import { Socket } from "socket.io-client";
import { getIceServers } from "../../services/iceServers";
import { isPolite, shouldIgnoreOffer } from "./negotiationState";
import { initialStepper, stepQuality, StepperState } from "./qualityStepper";
import { withStartBitrate } from "./sdpHints";
import { startBitrateKbps, targetEncoding, withEncoding } from "./videoQuality";
import { PeerVideoStats, readSenderStats, SenderStats, VideoStatsSnapshot } from "./videoStats";

interface PeerConnection {
  connection: RTCPeerConnection;
  userId: string;
  polite: boolean;
  makingOffer: boolean;
  ignoreOffer: boolean;
  isSettingRemoteAnswerPending: boolean;
  iceCandidatesQueue: RTCIceCandidateInit[];
  disconnectTimer: ReturnType<typeof setTimeout> | null;
  stuckTimer: ReturnType<typeof setTimeout> | null;
  restartAttempts: number;
  encodingUpdate: Promise<void>;
  encodingStale: boolean;
  videoStats?: SenderStats;
}

export interface PeerConnectionCallbacks {
  onStreamAdded: (userId: string, stream: MediaStream) => void;
  onStreamRemoved: (userId: string) => void;
  onConnectionStateChange: (userId: string, state: RTCPeerConnectionState) => void;
  onVideoStats?: (snapshot: VideoStatsSnapshot) => void;
}

const DISCONNECT_GRACE_MS = 4000;
const MAX_ICE_RESTARTS = 2;
const MAX_PENDING_CANDIDATES = 32;
const STUCK_CONNECTION_TIMEOUT_MS = 8000;
const STUCK_CONNECTION_JITTER_MS = 2000;
const STATS_INTERVAL_MS = 3000;

const videoSender = (pc: RTCPeerConnection) => pc.getSenders().find((sender) => sender.track?.kind === "video");

const markAsMotion = (stream: MediaStream) =>
  stream.getVideoTracks().forEach((track) => {
    track.contentHint = "motion";
  });

export class PeerConnectionManager {
  private peers: Map<string, PeerConnection> = new Map();
  // candidates that show up before their peer exists — trickle ICE often beats the offer
  private pendingCandidates: Map<string, RTCIceCandidateInit[]> = new Map();
  private localStream: MediaStream | null = null;
  private socket: Socket;
  private userId: string;
  private callbacks: PeerConnectionCallbacks;
  // kept apart from peers so requests survive a rebuild and can land before the connection does
  private requestedHeights: Map<string, number> = new Map();
  private stepper: StepperState;
  private statsTimer: ReturnType<typeof setInterval>;

  private readonly handleReceiveOffer = async ({ offer, fromUserId }: { offer: RTCSessionDescriptionInit; fromUserId: string }) => {
    await this.handleOffer(fromUserId, offer);
  };

  private readonly handleReceiveAnswer = async ({ answer, fromUserId }: { answer: RTCSessionDescriptionInit; fromUserId: string }) => {
    await this.handleAnswer(fromUserId, answer);
  };

  private readonly handleReceiveIceCandidate = async ({ candidate, fromUserId }: { candidate: RTCIceCandidateInit; fromUserId: string }) => {
    await this.handleIceCandidate(fromUserId, candidate);
  };

  private readonly handleReceiveVideoRequest = ({ maxHeight, fromUserId }: { maxHeight: number; fromUserId: string }) => {
    this.requestedHeights.set(fromUserId, maxHeight);
    const peer = this.peers.get(fromUserId);
    if (peer) {
      this.applyVideoEncoding(peer);
    }
  };

  constructor(
    socket: Socket,
    userId: string,
    callbacks: PeerConnectionCallbacks
  ) {
    this.socket = socket;
    this.userId = userId;
    this.callbacks = callbacks;
    const onPhone = window.matchMedia("(pointer: coarse)").matches;
    this.stepper = initialStepper(onPhone ? 1 : 0);
    this.statsTimer = setInterval(
      () => this.sampleVideoStats().catch((error) => console.error("Error sampling video stats:", error)),
      STATS_INTERVAL_MS
    );

    this.setupSocketListeners();

    // warm the ICE server cache (getIceServers dedupes in-flight fetches)
    void getIceServers();
  }

  private setupSocketListeners() {
    this.socket.on("receiveOffer", this.handleReceiveOffer);
    this.socket.on("receiveAnswer", this.handleReceiveAnswer);
    this.socket.on("receiveIceCandidate", this.handleReceiveIceCandidate);
    this.socket.on("receiveVideoRequest", this.handleReceiveVideoRequest);
  }

  private withStartHint(description: RTCSessionDescription | null): RTCSessionDescriptionInit | null {
    return description && { type: description.type, sdp: withStartBitrate(description.sdp, startBitrateKbps(this.peers.size)) };
  }

  // serialized per peer since overlapping setParameters calls can reject.
  // failed or too-early updates get retried on the next stats tick
  private applyVideoEncoding(peer: PeerConnection): void {
    peer.encodingUpdate = peer.encodingUpdate
      .then(() => this.updateVideoEncoding(peer))
      .then((applied) => {
        peer.encodingStale = !applied;
      })
      .catch((error) => {
        peer.encodingStale = true;
        console.error(`Error updating video encoding for ${peer.userId}:`, error);
      });
  }

  private async updateVideoEncoding(peer: PeerConnection): Promise<boolean> {
    const sender = videoSender(peer.connection);
    if (!sender?.track || peer.connection.connectionState === "closed") {
      return true;
    }
    const { width = 0, height = 0 } = sender.track.getSettings();
    const params = withEncoding(
      sender.getParameters(),
      targetEncoding({
        peerCount: this.peers.size,
        stepDown: this.stepper.stepDown,
        requestedHeight: this.requestedHeights.get(peer.userId),
        captureShortSide: Math.min(width, height),
      })
    );
    if (!params) {
      return false;
    }
    await sender.setParameters(params);
    return true;
  }

  private applyAllVideoEncodings(): void {
    this.peers.forEach((peer) => this.applyVideoEncoding(peer));
  }

  private async sampleVideoStats(): Promise<void> {
    const samples = await Promise.all(Array.from(this.peers.values()).map((peer) => this.sampleVideoSender(peer)));
    const peers = samples.filter((sample): sample is PeerVideoStats => sample !== null);
    const cameraOn = Boolean(this.localStream?.getVideoTracks().some((track) => track.enabled));
    // idle senders (camera off, or paused by the viewer) report no limit and would vote us back up
    const reasons = cameraOn
      ? peers
          .filter((sample) => sample.requestedHeight !== 0)
          .map((sample) => sample.limitation)
          .filter((reason): reason is string => Boolean(reason))
      : [];

    const next = stepQuality(this.stepper, reasons);
    const stepped = next.stepDown !== this.stepper.stepDown;
    this.stepper = next;
    this.peers.forEach((peer) => {
      if (stepped || peer.encodingStale) {
        this.applyVideoEncoding(peer);
      }
    });
    this.callbacks.onVideoStats?.({ peerCount: this.peers.size, stepDown: next.stepDown, peers });
  }

  private async sampleVideoSender(peer: PeerConnection): Promise<PeerVideoStats | null> {
    const sender = videoSender(peer.connection);
    if (!sender) {
      return null;
    }
    const report = await sender.getStats().catch(() => null);
    const stats = report && readSenderStats(report, peer.videoStats);
    peer.videoStats = stats ?? undefined;
    return stats && { ...stats, userId: peer.userId, requestedHeight: this.requestedHeights.get(peer.userId) };
  }

  setLocalStream(stream: MediaStream): void {
    // a stale caller (closure over a retired stream) can't even revert the
    // reference if every track it's holding is already dead
    if (!stream.getTracks().some((track) => track.readyState === "live")) {
      return;
    }
    markAsMotion(stream);
    this.localStream = stream;
    // addTrack fires onnegotiationneeded, so late tracks renegotiate on their own
    this.peers.forEach((peer) => {
      stream.getTracks().forEach((track) => {
        if (track.readyState === "ended") {
          return; // a stale caller handed us a retired stream — never wire dead tracks
        }
        const sender = peer.connection.getSenders().find((s) => s.track?.kind === track.kind);
        if (!sender) {
          peer.connection.addTrack(track, stream);
          if (track.kind === "video") {
            this.applyVideoEncoding(peer);
          }
        }
      });
    });
  }

  async createPeerConnection(targetUserId: string): Promise<void> {
    if (this.peers.has(targetUserId)) {
      return;
    }

    const iceServers = await getIceServers();

    // Re-check after the await: an offer for this peer may have raced us.
    if (this.peers.has(targetUserId)) {
      return;
    }

    const pc = new RTCPeerConnection({
      iceServers,
      iceTransportPolicy: "all",
      bundlePolicy: "max-bundle",
      rtcpMuxPolicy: "require",
    });

    const peer: PeerConnection = {
      connection: pc,
      userId: targetUserId,
      polite: isPolite(this.userId, targetUserId),
      makingOffer: false,
      ignoreOffer: false,
      isSettingRemoteAnswerPending: false,
      iceCandidatesQueue: [],
      disconnectTimer: null,
      stuckTimer: null,
      restartAttempts: 0,
      encodingUpdate: Promise.resolve(),
      encodingStale: false,
    };
    this.peers.set(targetUserId, peer);

    // stuck in new/connecting this long usually means ICE gathering never happened —
    // restartIce kicks it back on. jitter keeps both sides from firing at once.
    peer.stuckTimer = setTimeout(() => {
      peer.stuckTimer = null;
      const state = peer.connection.connectionState;
      if (state === "new" || state === "connecting") {
        console.warn(`Connection to ${targetUserId} stuck in "${state}"; attempting ICE restart`);
        this.attemptIceRestart(peer);
      }
    }, STUCK_CONNECTION_TIMEOUT_MS + Math.random() * STUCK_CONNECTION_JITTER_MS);

    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => {
        if (track.readyState === "ended") {
          return; // a stale caller handed us a retired stream — never wire dead tracks
        }
        pc.addTrack(track, this.localStream!);
      });
    }
    // a new peer changes the call size, which moves everyone's rung
    this.applyAllVideoEncodings();

    // every offer starts here — initial tracks, late tracks, restartIce.
    // colliding offers resolve via the polite/impolite roles.
    pc.onnegotiationneeded = async () => {
      if (pc.signalingState !== "stable") {
        return; // browser re-fires when stable if negotiation is still needed
      }
      try {
        peer.makingOffer = true;
        await pc.setLocalDescription();
        this.socket.emit("sendOffer", { targetUserId, offer: this.withStartHint(pc.localDescription) });
      } catch (error) {
        console.error(`Error negotiating with ${targetUserId}:`, error);
      } finally {
        peer.makingOffer = false;
      }
    };

    pc.ontrack = (event) => {
      if (event.streams && event.streams[0]) {
        this.callbacks.onStreamAdded(targetUserId, event.streams[0]);
      }
    };

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        this.socket.emit("sendIceCandidate", { targetUserId, candidate: event.candidate });
      }
    };

    pc.onconnectionstatechange = () => {
      this.callbacks.onConnectionStateChange(targetUserId, pc.connectionState);

      switch (pc.connectionState) {
        case "connected":
          this.clearTimers(peer);
          peer.restartAttempts = 0;
          // firefox has no encodings to set until negotiation finishes
          this.applyVideoEncoding(peer);
          break;
        case "disconnected":
          // often just a wifi blip — give it a moment before forcing a restart
          this.clearDisconnectTimer(peer);
          peer.disconnectTimer = setTimeout(() => {
            this.attemptIceRestart(peer);
          }, DISCONNECT_GRACE_MS);
          break;
        case "failed":
          this.clearDisconnectTimer(peer);
          this.attemptIceRestart(peer);
          break;
        case "closed":
          this.removePeer(targetUserId);
          break;
      }
    };

    this.drainPendingCandidates(peer);
  }

  private clearDisconnectTimer(peer: PeerConnection): void {
    if (peer.disconnectTimer !== null) {
      clearTimeout(peer.disconnectTimer);
      peer.disconnectTimer = null;
    }
  }

  private clearTimers(peer: PeerConnection): void {
    this.clearDisconnectTimer(peer);
    if (peer.stuckTimer !== null) {
      clearTimeout(peer.stuckTimer);
      peer.stuckTimer = null;
    }
  }

  private attemptIceRestart(peer: PeerConnection): void {
    const state = peer.connection.connectionState;
    if (state === "connected" || state === "closed") {
      return;
    }
    if (peer.restartAttempts >= MAX_ICE_RESTARTS) {
      console.error(`Connection to ${peer.userId} failed after ${MAX_ICE_RESTARTS} ICE restarts; tearing down`);
      // out of retries — tear down. the grid shows "connection lost"; an automatic rebuild path is future work.
      this.removePeer(peer.userId);
      return;
    }
    peer.restartAttempts += 1;
    // fires onnegotiationneeded with fresh ICE credentials
    peer.connection.restartIce();
  }

  private drainPendingCandidates(peer: PeerConnection): void {
    const pending = this.pendingCandidates.get(peer.userId);
    if (pending) {
      peer.iceCandidatesQueue.push(...pending);
      this.pendingCandidates.delete(peer.userId);
    }
  }

  private async flushCandidateQueue(peer: PeerConnection): Promise<void> {
    while (peer.iceCandidatesQueue.length > 0) {
      const candidate = peer.iceCandidatesQueue.shift()!;
      try {
        await peer.connection.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (error) {
        if (!peer.ignoreOffer) {
          console.error(`Error adding queued ICE candidate from ${peer.userId}:`, error);
        }
      }
    }
  }

  private async handleOffer(fromUserId: string, offer: RTCSessionDescriptionInit): Promise<void> {
    if (!this.peers.has(fromUserId)) {
      await this.createPeerConnection(fromUserId);
    }
    const peer = this.peers.get(fromUserId);
    if (!peer) {
      return;
    }
    const pc = peer.connection;

    peer.ignoreOffer = shouldIgnoreOffer(
      peer.polite,
      peer.makingOffer,
      pc.signalingState,
      peer.isSettingRemoteAnswerPending
    );
    if (peer.ignoreOffer) {
      return; // the other side is polite; it will roll back and take ours
    }

    try {
      // implicit rollback happens in here if we had our own offer in flight
      await pc.setRemoteDescription(offer);
      await this.flushCandidateQueue(peer);
      await pc.setLocalDescription(); // creates the answer
      this.socket.emit("sendAnswer", { targetUserId: fromUserId, answer: this.withStartHint(pc.localDescription) });
    } catch (error) {
      console.error(`Error handling offer from ${fromUserId}:`, error);
    }
  }

  private async handleAnswer(fromUserId: string, answer: RTCSessionDescriptionInit): Promise<void> {
    const peer = this.peers.get(fromUserId);
    if (!peer) {
      return;
    }
    if (peer.connection.signalingState !== "have-local-offer") {
      console.warn(`Dropping answer from ${fromUserId} in state ${peer.connection.signalingState}`);
      return;
    }

    peer.isSettingRemoteAnswerPending = true;
    try {
      await peer.connection.setRemoteDescription(answer);
    } catch (error) {
      console.error(`Error handling answer from ${fromUserId}:`, error);
      return;
    } finally {
      peer.isSettingRemoteAnswerPending = false;
    }
    await this.flushCandidateQueue(peer);
  }

  private async handleIceCandidate(fromUserId: string, candidate: RTCIceCandidateInit): Promise<void> {
    const peer = this.peers.get(fromUserId);

    if (!peer) {
      // no peer yet — buffer instead of dropping
      const pending = this.pendingCandidates.get(fromUserId) ?? [];
      if (pending.length < MAX_PENDING_CANDIDATES) {
        pending.push(candidate);
        this.pendingCandidates.set(fromUserId, pending);
      }
      return;
    }

    if (!peer.connection.remoteDescription) {
      peer.iceCandidatesQueue.push(candidate);
      return;
    }

    try {
      await peer.connection.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (error) {
      // expected while ignoring a collided offer (stale ufrag); real errors matter
      if (!peer.ignoreOffer) {
        console.error(`Error adding ICE candidate from ${fromUserId}:`, error);
      }
    }
  }

  removePeer(userId: string): void {
    const peer = this.peers.get(userId);
    if (peer) {
      this.clearTimers(peer);
      peer.connection.close();
      this.peers.delete(userId);
      this.callbacks.onStreamRemoved(userId);
      this.applyAllVideoEncodings();
    }
    this.pendingCandidates.delete(userId);
  }

  removeAllPeers(): void {
    this.peers.forEach((peer, userId) => {
      this.clearTimers(peer);
      peer.connection.close();
      this.callbacks.onStreamRemoved(userId);
    });
    this.peers.clear();
    this.pendingCandidates.clear();
    this.requestedHeights.clear();
  }

  async updateLocalStream(stream: MediaStream): Promise<void> {
    markAsMotion(stream);
    this.localStream = stream;
    const replacements: Promise<void>[] = [];
    // replaceTrack avoids renegotiation; addTrack of a new kind triggers it automatically
    this.peers.forEach((peer) => {
      const senders = peer.connection.getSenders();
      stream.getTracks().forEach((track) => {
        const sender = senders.find((s) => s.track?.kind === track.kind);
        if (sender) {
          replacements.push(
            sender.replaceTrack(track).then(
              () => {
                // a new camera can capture at a different size, so rescale
                if (track.kind === "video") {
                  this.applyVideoEncoding(peer);
                }
              },
              (error) => {
                console.error(`Error replacing ${track.kind} track for ${peer.userId}:`, error);
                throw error;
              }
            )
          );
        } else {
          peer.connection.addTrack(track, stream);
          if (track.kind === "video") {
            this.applyVideoEncoding(peer);
          }
        }
      });
    });
    await Promise.all(replacements);
  }

  cleanup(): void {
    this.socket.off("receiveOffer", this.handleReceiveOffer);
    this.socket.off("receiveAnswer", this.handleReceiveAnswer);
    this.socket.off("receiveIceCandidate", this.handleReceiveIceCandidate);
    this.socket.off("receiveVideoRequest", this.handleReceiveVideoRequest);
    clearInterval(this.statsTimer);

    this.removeAllPeers();
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => track.stop());
      this.localStream = null;
    }
  }
}
