import { MAX_VIDEO_BITRATE_BPS, VIDEO_CONSTRAINTS, withVideoBitrateCap } from "./videoEncoding";

test("caps every encoding without dropping other settings", () => {
  const params = {
    encodings: [{ active: true, scaleResolutionDownBy: 2 }],
    degradationPreference: "balanced",
  } as unknown as RTCRtpSendParameters;

  const capped = withVideoBitrateCap(params);

  expect(capped.encodings).toEqual([
    { active: true, scaleResolutionDownBy: 2, maxBitrate: MAX_VIDEO_BITRATE_BPS },
  ]);
  expect((capped as any).degradationPreference).toBe("balanced");
});

test("creates one capped encoding when none exist", () => {
  const capped = withVideoBitrateCap({ encodings: [] } as unknown as RTCRtpSendParameters);
  expect(capped.encodings).toEqual([{ maxBitrate: MAX_VIDEO_BITRATE_BPS }]);
});

test("constraints ask for 480p-ish video, not full resolution", () => {
  expect(VIDEO_CONSTRAINTS).toEqual({
    width: { ideal: 640 },
    height: { ideal: 480 },
    frameRate: { ideal: 24, max: 30 },
  });
});
