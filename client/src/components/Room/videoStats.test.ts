import { readSenderStats } from "./videoStats";

const report = (entries: Record<string, any>[]) =>
  new Map(entries.map((entry) => [entry.id, entry])) as unknown as RTCStatsReport;

const sample = (bytesSent: number, timestamp: number) =>
  report([
    {
      id: "out",
      type: "outbound-rtp",
      kind: "video",
      codecId: "c1",
      frameWidth: 960,
      frameHeight: 540,
      framesPerSecond: 30,
      bytesSent,
      timestamp,
      qualityLimitationReason: "none",
      encoderImplementation: "VideoToolbox",
    },
    { id: "c1", type: "codec", mimeType: "video/H264" },
    { id: "t1", type: "transport", selectedCandidatePairId: "p1" },
    { id: "p1", type: "candidate-pair", availableOutgoingBitrate: 2_500_000 },
    { id: "p2", type: "candidate-pair", availableOutgoingBitrate: 1 },
  ]);

test("reads what the sender is actually sending", () => {
  expect(readSenderStats(sample(1000, 1))).toEqual({
    width: 960,
    height: 540,
    fps: 30,
    kbps: undefined,
    limitation: "none",
    codec: "H264",
    encoder: "VideoToolbox",
    availableKbps: 2500,
    bytesSent: 1000,
    timestamp: 1,
  });
});

test("works out the bitrate from the previous sample", () => {
  const first = readSenderStats(sample(0, 1000))!;
  expect(readSenderStats(sample(250_000, 3000), first)!.kbps).toBe(1000);
});

test("returns null when there's no outgoing video yet", () => {
  expect(readSenderStats(report([{ id: "x", type: "transport" }]))).toBeNull();
});
