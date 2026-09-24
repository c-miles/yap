import { snapRequestedHeight, startBitrateKbps, targetEncoding, withEncoding } from "./videoQuality";

test.each([
  [0, 0],
  [-5, 0],
  [100, 180],
  [180, 180],
  [181, 270],
  [506, 540],
  [720, 720],
  [1440, 720],
])("snaps a %p px tile to the %p step", (px, step) => {
  expect(snapRequestedHeight(px)).toBe(step);
});

const base = { stepDown: 0, captureShortSide: 720 };

test.each([
  [1, 2_000_000, 1],
  [2, 1_500_000, 1],
  [3, 1_000_000, 720 / 540],
  [4, 850_000, 720 / 540],
  [5, 700_000, 720 / 540],
  [9, 700_000, 720 / 540],
  [0, 2_000_000, 1],
])("with %p remote peers sends %p bps at scale %p", (peerCount, maxBitrate, scale) => {
  expect(targetEncoding({ ...base, peerCount })).toEqual({
    active: true,
    maxBitrate,
    maxFramerate: 30,
    scaleResolutionDownBy: scale,
  });
});

test("stepping down lowers the resolution and caps the bitrate to that step", () => {
  expect(targetEncoding({ ...base, peerCount: 1, stepDown: 1 })).toMatchObject({ maxBitrate: 1_000_000, scaleResolutionDownBy: 720 / 540 });
  expect(targetEncoding({ ...base, peerCount: 1, stepDown: 2 })).toMatchObject({ maxBitrate: 500_000, scaleResolutionDownBy: 2 });
  expect(targetEncoding({ ...base, peerCount: 5, stepDown: 2 })).toMatchObject({ maxBitrate: 320_000, scaleResolutionDownBy: 720 / 270 });
});

test("a viewer's smaller tile lowers what we send them, a bigger one doesn't raise it", () => {
  expect(targetEncoding({ ...base, peerCount: 1, requestedHeight: 360 })).toMatchObject({ maxBitrate: 500_000, scaleResolutionDownBy: 2 });
  expect(targetEncoding({ ...base, peerCount: 5, requestedHeight: 720 })).toMatchObject({ maxBitrate: 700_000, scaleResolutionDownBy: 720 / 540 });
});

test("an off-step request is snapped instead of producing a bad bitrate", () => {
  expect(targetEncoding({ ...base, peerCount: 1, requestedHeight: 500 })).toMatchObject({ maxBitrate: 1_000_000, scaleResolutionDownBy: 720 / 540 });
});

test("a request of 0 pauses the stream", () => {
  expect(targetEncoding({ ...base, peerCount: 2, requestedHeight: 0 }).active).toBe(false);
});

test("a camera below the target is never upscaled", () => {
  expect(targetEncoding({ peerCount: 1, stepDown: 0, captureShortSide: 480 }).scaleResolutionDownBy).toBe(1);
  expect(targetEncoding({ peerCount: 1, stepDown: 0, captureShortSide: 0 }).scaleResolutionDownBy).toBe(1);
});

test("withEncoding updates the first encoding and keeps everything else", () => {
  const params = {
    transactionId: "t1",
    degradationPreference: "maintain-framerate",
    encodings: [{ active: true, rid: "a" }, { rid: "b" }],
  } as unknown as RTCRtpSendParameters;
  const target = { active: false, maxBitrate: 1, maxFramerate: 30, scaleResolutionDownBy: 2 };

  expect(withEncoding(params, target)).toEqual({
    transactionId: "t1",
    degradationPreference: "maintain-framerate",
    encodings: [{ active: false, rid: "a", maxBitrate: 1, maxFramerate: 30, scaleResolutionDownBy: 2 }, { rid: "b" }],
  });
});

test("withEncoding returns null before the sender has negotiated encodings", () => {
  const params = { encodings: [] } as unknown as RTCRtpSendParameters;
  expect(withEncoding(params, { active: true, maxBitrate: 1, maxFramerate: 30, scaleResolutionDownBy: 1 })).toBeNull();
});

test.each([
  [1, 1000],
  [2, 1000],
  [4, 850],
  [5, 700],
  [0, 1000],
])("with %p remote peers the stream starts at %p kbps", (peerCount, kbps) => {
  expect(startBitrateKbps(peerCount)).toBe(kbps);
});

test("out-of-range inputs can't produce a broken encoding", () => {
  expect(targetEncoding({ ...base, peerCount: 1, stepDown: -1 })).toMatchObject({ maxBitrate: 2_000_000, scaleResolutionDownBy: 1 });
  expect(targetEncoding({ ...base, peerCount: 1, requestedHeight: -5 })).toEqual({
    active: true,
    maxBitrate: 2_000_000,
    maxFramerate: 30,
    scaleResolutionDownBy: 1,
  });
});
