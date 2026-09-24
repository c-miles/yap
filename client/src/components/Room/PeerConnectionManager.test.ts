import { PeerConnectionManager } from "./PeerConnectionManager";

jest.mock("../../services/iceServers", () => ({ getIceServers: () => Promise.resolve([]) }));

let nextEncodings: object[] = [{ active: true }];

class FakeSender {
  params: any = { transactionId: "t", encodings: nextEncodings.map((encoding) => ({ ...encoding })) };
  limitation = "none";
  setParameters = jest.fn((params: any) => {
    this.params = params;
    return Promise.resolve();
  });
  replaceTrack = jest.fn((track: any) => {
    this.track = track;
    return Promise.resolve();
  });
  getStats = jest.fn(() =>
    Promise.resolve(
      new Map([
        ["out", { id: "out", type: "outbound-rtp", kind: "video", bytesSent: 0, timestamp: 0, qualityLimitationReason: this.limitation }],
      ])
    )
  );
  constructor(public track: any) {}
  getParameters() {
    return this.params;
  }
}

class FakePeerConnection {
  static instances: FakePeerConnection[] = [];
  senders: FakeSender[] = [];
  connectionState = "connected";
  signalingState = "stable";
  localDescription: any = null;
  remoteDescription: any = null;
  onnegotiationneeded: any = null;
  ontrack: any = null;
  onicecandidate: any = null;
  onconnectionstatechange: any = null;
  setRemoteDescription = jest.fn(async (description: any) => {
    this.remoteDescription = description;
  });
  setLocalDescription = jest.fn(async () => {
    const type = this.remoteDescription?.type === "offer" ? "answer" : "offer";
    this.localDescription = { type, sdp: "m=video 9 UDP/TLS/RTP/SAVPF 96\r\na=rtpmap:96 VP8/90000\r\n" };
  });

  constructor() {
    FakePeerConnection.instances.push(this);
  }
  addTrack(track: any) {
    const sender = new FakeSender(track);
    this.senders.push(sender);
    return sender;
  }
  getSenders() {
    return this.senders;
  }
  close() {
    this.connectionState = "closed";
  }
  restartIce() {}
}

function fakeSocket() {
  const handlers = new Map<string, (payload: any) => void>();
  return {
    on: (event: string, handler: (payload: any) => void) => handlers.set(event, handler),
    off: (event: string) => handlers.delete(event),
    emit: jest.fn(),
    fire: (event: string, payload: any) => handlers.get(event)?.(payload),
  };
}

const track = (kind: string, settings = { width: 1280, height: 720 }) => ({
  kind,
  readyState: "live",
  enabled: true,
  contentHint: "",
  getSettings: () => settings,
  stop: jest.fn(),
});

const stream = (tracks: any[]) =>
  ({
    getTracks: () => tracks,
    getVideoTracks: () => tracks.filter((t) => t.kind === "video"),
    getAudioTracks: () => tracks.filter((t) => t.kind === "audio"),
  } as unknown as MediaStream);

// drains promise chains without timers, so it also works under fake timers
const settle = async () => {
  for (let i = 0; i < 20; i++) await Promise.resolve();
};

const statsTick = async () => {
  jest.advanceTimersByTime(3000);
  await settle();
};

const videoSenderOf = (index: number) => FakePeerConnection.instances[index].senders.find((s) => s.track.kind === "video")!;
const encodingOf = (index: number) => videoSenderOf(index).params.encodings[0];
const sent = (event: string) => socket.emit.mock.calls.find(([name]) => name === event)?.[1];

let socket: ReturnType<typeof fakeSocket>;
let manager: PeerConnectionManager;

function startManager(videoSettings?: { width: number; height: number }) {
  manager = new PeerConnectionManager(socket as any, "a", {
    onStreamAdded: jest.fn(),
    onStreamRemoved: jest.fn(),
    onConnectionStateChange: jest.fn(),
  });
  manager.setLocalStream(stream([track("video", videoSettings), track("audio")]));
}

async function connect(...userIds: string[]) {
  for (const userId of userIds) {
    await manager.createPeerConnection(userId);
  }
  await settle();
}

beforeEach(() => {
  FakePeerConnection.instances = [];
  nextEncodings = [{ active: true }];
  (global as any).RTCPeerConnection = FakePeerConnection;
  window.matchMedia = jest.fn().mockReturnValue({ matches: false });
  socket = fakeSocket();
});

afterEach(() => {
  manager.cleanup();
  jest.useRealTimers();
});

test("applies the 1-on-1 rung to a new peer's video", async () => {
  startManager();
  await connect("b");

  expect(encodingOf(0)).toMatchObject({ active: true, maxBitrate: 2_000_000, scaleResolutionDownBy: 1 });
});

test("a second peer lowers the first peer's rung", async () => {
  startManager();
  await connect("b", "c");

  expect(encodingOf(0).maxBitrate).toBe(1_500_000);
});

test("a peer leaving lets the others' rung climb back", async () => {
  startManager();
  await connect("b", "c");
  manager.removePeer("c");
  await settle();

  expect(encodingOf(0).maxBitrate).toBe(2_000_000);
});

test("a portrait phone camera scales by its short side", async () => {
  startManager({ width: 720, height: 1280 });
  await connect("b", "c", "d");

  expect(encodingOf(0)).toMatchObject({ maxBitrate: 1_000_000, scaleResolutionDownBy: 720 / 540 });
});

test("marks the camera track as motion", async () => {
  startManager();
  await connect("b");

  expect(videoSenderOf(0).track.contentHint).toBe("motion");
});

test("a size request that arrives before the connection still applies", async () => {
  startManager();
  socket.fire("receiveVideoRequest", { maxHeight: 360, fromUserId: "b" });
  await connect("b");

  expect(encodingOf(0)).toMatchObject({ maxBitrate: 500_000, scaleResolutionDownBy: 2 });
});

test("a live request pauses and resumes the stream to that viewer", async () => {
  startManager();
  await connect("b");

  socket.fire("receiveVideoRequest", { maxHeight: 0, fromUserId: "b" });
  await settle();
  expect(encodingOf(0).active).toBe(false);

  socket.fire("receiveVideoRequest", { maxHeight: 360, fromUserId: "b" });
  await settle();
  expect(encodingOf(0)).toMatchObject({ active: true, maxBitrate: 500_000, scaleResolutionDownBy: 2 });
});

test("a connection torn down and rebuilt keeps the viewer's request", async () => {
  startManager();
  socket.fire("receiveVideoRequest", { maxHeight: 360, fromUserId: "b" });
  await connect("b");
  manager.removePeer("b");
  await connect("b");

  expect(encodingOf(1)).toMatchObject({ maxBitrate: 500_000, scaleResolutionDownBy: 2 });
});

test("offers tell the other side to start at the call's bitrate", async () => {
  startManager();
  await connect("b");
  await FakePeerConnection.instances[0].onnegotiationneeded();

  expect(sent("sendOffer").offer).toEqual({
    type: "offer",
    sdp: expect.stringContaining("a=fmtp:96 x-google-start-bitrate=1000"),
  });
});

test("answers carry the same start hint", async () => {
  startManager();
  socket.fire("receiveOffer", { offer: { type: "offer", sdp: "v=0" }, fromUserId: "b" });
  await settle();

  expect(sent("sendAnswer").answer).toEqual({
    type: "answer",
    sdp: expect.stringContaining("a=fmtp:96 x-google-start-bitrate=1000"),
  });
});

test("a camera switch rescales for the new camera's size", async () => {
  startManager();
  await connect("b", "c", "d");

  await manager.updateLocalStream(stream([track("video", { width: 1920, height: 1080 }), track("audio")]));
  await settle();

  expect(encodingOf(0).scaleResolutionDownBy).toBe(2);
});

test("a failed camera switch is reported instead of swallowed", async () => {
  startManager();
  await connect("b");
  videoSenderOf(0).replaceTrack.mockRejectedValueOnce(new Error("device busy"));
  jest.spyOn(console, "error").mockImplementation(() => {});

  await expect(manager.updateLocalStream(stream([track("video"), track("audio")]))).rejects.toThrow("device busy");
});

describe("with the stats loop running", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  test("sustained CPU limits step the stream down", async () => {
    startManager();
    await connect("b");
    videoSenderOf(0).limitation = "cpu";
    await statsTick();
    await statsTick();

    expect(encodingOf(0)).toMatchObject({ maxBitrate: 1_000_000, scaleResolutionDownBy: 720 / 540 });
  });

  test("paused streams don't count toward the CPU vote", async () => {
    startManager();
    socket.fire("receiveVideoRequest", { maxHeight: 0, fromUserId: "c" });
    socket.fire("receiveVideoRequest", { maxHeight: 0, fromUserId: "d" });
    await connect("b", "c", "d");
    videoSenderOf(0).limitation = "cpu";
    await statsTick();
    await statsTick();

    expect(encodingOf(0)).toMatchObject({ maxBitrate: 500_000, scaleResolutionDownBy: 2 });
  });

  test("turning the camera off holds the current step", async () => {
    startManager();
    await connect("b");
    videoSenderOf(0).limitation = "cpu";
    await statsTick();
    await statsTick();

    manager.toggleVideo(false);
    videoSenderOf(0).limitation = "none";
    for (let i = 0; i < 8; i++) await statsTick();

    expect(encodingOf(0).maxBitrate).toBe(1_000_000);
  });

  test("a failed encoding update is retried on the next stats tick", async () => {
    startManager();
    await connect("b");
    videoSenderOf(0).setParameters.mockRejectedValueOnce(new Error("busy"));
    jest.spyOn(console, "error").mockImplementation(() => {});

    socket.fire("receiveVideoRequest", { maxHeight: 360, fromUserId: "b" });
    await settle();
    expect(encodingOf(0).maxBitrate).toBe(2_000_000);

    await statsTick();
    expect(encodingOf(0)).toMatchObject({ maxBitrate: 500_000, scaleResolutionDownBy: 2 });
  });

  test("a sender with no encodings yet gets its caps once they appear (Firefox)", async () => {
    nextEncodings = [];
    startManager();
    await connect("b");
    videoSenderOf(0).params.encodings = [{ active: true }];

    await statsTick();
    expect(encodingOf(0).maxBitrate).toBe(2_000_000);
  });
});
