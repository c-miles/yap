import { Socket } from "socket.io-client";
import { getIceServers } from "../../services/iceServers";
import { isPolite, shouldIgnoreOffer } from "./negotiationState";
import { withVideoBitrateCap } from "./videoEncoding";

interface PeerConnection {
  connection: RTCPeerConnection;
  stream?: MediaStream;
  userId: string;
  polite: boolean;
  makingOffer: boolean;
  ignoreOffer: boolean;
  isSettingRemoteAnswerPending: boolean;
  iceCandidatesQueue: RTCIceCandidateInit[];
  disconnectTimer: ReturnType<typeof setTimeout> | null;
  stuckTimer: ReturnType<typeof setTimeout> | null;
  restartAttempts: number;
}

const DISCONNECT_GRACE_MS = 4000;
const MAX_ICE_RESTARTS = 2;
const MAX_PENDING_CANDIDATES = 32;
const STUCK_CONNECTION_TIMEOUT_MS = 8000;
const STUCK_CONNECTION_JITTER_MS = 2000;

export class PeerConnectionManager {
  private peers: Map<string, PeerConnection> = new Map();
  // candidates that show up before their peer exists — trickle ICE often beats the offer
  private pendingCandidates: Map<string, RTCIceCandidateInit[]> = new Map();
  private localStream: MediaStream | null = null;
  private socket: Socket;
  private userId: string;
  private _roomId: string; // Reserved for future room-specific WebRTC features
  private callbacks: {
    onStreamAdded: (userId: string, stream: MediaStream) => void;
    onStreamRemoved: (userId: string) => void;
    onConnectionStateChange: (userId: string, state: RTCPeerConnectionState) => void;
  };

  private readonly handleReceiveOffer = async ({ offer, fromUserId }: { offer: RTCSessionDescriptionInit; fromUserId: string }) => {
    await this.handleOffer(fromUserId, offer);
  };

  private readonly handleReceiveAnswer = async ({ answer, fromUserId }: { answer: RTCSessionDescriptionInit; fromUserId: string }) => {
    await this.handleAnswer(fromUserId, answer);
  };

  private readonly handleReceiveIceCandidate = async ({ candidate, fromUserId }: { candidate: RTCIceCandidateInit; fromUserId: string }) => {
    await this.handleIceCandidate(fromUserId, candidate);
  };

  constructor(
    socket: Socket,
    userId: string,
    roomId: string,
    callbacks: {
      onStreamAdded: (userId: string, stream: MediaStream) => void;
      onStreamRemoved: (userId: string) => void;
      onConnectionStateChange: (userId: string, state: RTCPeerConnectionState) => void;
    }
  ) {
    this.socket = socket;
    this.userId = userId;
    this._roomId = roomId;
    this.callbacks = callbacks;

    this.setupSocketListeners();

    // warm the ICE server cache (getIceServers dedupes in-flight fetches)
    void getIceServers();
  }

  private setupSocketListeners() {
    this.socket.on("receiveOffer", this.handleReceiveOffer);
    this.socket.on("receiveAnswer", this.handleReceiveAnswer);
    this.socket.on("receiveIceCandidate", this.handleReceiveIceCandidate);
  }

  private capVideoSender(sender: RTCRtpSender): void {
    sender.setParameters(withVideoBitrateCap(sender.getParameters())).catch((error) => {
      console.error("Error capping video bitrate:", error);
    });
  }

  setLocalStream(stream: MediaStream): void {
    // a stale caller (closure over a retired stream) can't even revert the
    // reference if every track it's holding is already dead
    if (!stream.getTracks().some((track) => track.readyState === "live")) {
      return;
    }
    this.localStream = stream;
    // addTrack fires onnegotiationneeded, so late tracks renegotiate on their own
    this.peers.forEach((peer) => {
      stream.getTracks().forEach((track) => {
        if (track.readyState === "ended") {
          return; // a stale caller handed us a retired stream — never wire dead tracks
        }
        const sender = peer.connection.getSenders().find((s) => s.track?.kind === track.kind);
        if (!sender) {
          const newSender = peer.connection.addTrack(track, stream);
          if (track.kind === "video") {
            this.capVideoSender(newSender);
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
        const sender = pc.addTrack(track, this.localStream!);
        if (track.kind === "video") {
          this.capVideoSender(sender);
        }
      });
    }

    // every offer starts here — initial tracks, late tracks, restartIce.
    // colliding offers resolve via the polite/impolite roles.
    pc.onnegotiationneeded = async () => {
      if (pc.signalingState !== "stable") {
        return; // browser re-fires when stable if negotiation is still needed
      }
      try {
        peer.makingOffer = true;
        await pc.setLocalDescription();
        this.socket.emit("sendOffer", { targetUserId, offer: pc.localDescription });
      } catch (error) {
        console.error(`Error negotiating with ${targetUserId}:`, error);
      } finally {
        peer.makingOffer = false;
      }
    };

    pc.ontrack = (event) => {
      if (event.streams && event.streams[0]) {
        peer.stream = event.streams[0];
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
      this.socket.emit("sendAnswer", { targetUserId: fromUserId, answer: pc.localDescription });
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
  }

  async updateLocalStream(stream: MediaStream): Promise<void> {
    this.localStream = stream;
    // replaceTrack avoids renegotiation; addTrack of a new kind triggers it automatically
    this.peers.forEach((peer) => {
      const senders = peer.connection.getSenders();
      stream.getTracks().forEach((track) => {
        const sender = senders.find((s) => s.track?.kind === track.kind);
        if (sender) {
          sender.replaceTrack(track).catch((error) => {
            console.error(`Error replacing ${track.kind} track for ${peer.userId}:`, error);
          });
        } else {
          const newSender = peer.connection.addTrack(track, stream);
          if (track.kind === "video") {
            this.capVideoSender(newSender);
          }
        }
      });
    });
  }

  toggleVideo(enabled: boolean): void {
    if (this.localStream) {
      this.localStream.getVideoTracks().forEach((track) => {
        track.enabled = enabled;
      });
    }
  }

  toggleAudio(enabled: boolean): void {
    if (this.localStream) {
      this.localStream.getAudioTracks().forEach((track) => {
        track.enabled = enabled;
      });
    }
  }

  cleanup(): void {
    this.socket.off("receiveOffer", this.handleReceiveOffer);
    this.socket.off("receiveAnswer", this.handleReceiveAnswer);
    this.socket.off("receiveIceCandidate", this.handleReceiveIceCandidate);

    this.removeAllPeers();
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => track.stop());
      this.localStream = null;
    }
  }
}
