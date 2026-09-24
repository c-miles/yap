const RESOLUTION_STEPS = [720, 540, 360, 270, 180];
export const MAX_STEP_DOWN = 2;
const MAX_FRAMERATE = 30;
const MAX_START_KBPS = 1000;

const STEP_BITRATE_CAP: Record<number, number> = {
  720: 2_000_000,
  540: 1_000_000,
  360: 500_000,
  270: 320_000,
  180: 180_000,
};

// index = remote peers - 1; 5+ share the last rung
const LADDER = [
  { height: 720, maxBitrate: 2_000_000 },
  { height: 720, maxBitrate: 1_500_000 },
  { height: 540, maxBitrate: 1_000_000 },
  { height: 540, maxBitrate: 850_000 },
  { height: 540, maxBitrate: 700_000 },
];

export const VIDEO_CONSTRAINTS: MediaTrackConstraints = {
  width: { ideal: 1280 },
  height: { ideal: 720 },
  frameRate: { ideal: MAX_FRAMERATE, max: MAX_FRAMERATE },
};

const rungFor = (peerCount: number) => LADDER[Math.min(Math.max(peerCount, 1), LADDER.length) - 1];

type VideoTarget = Required<
  Pick<RTCRtpEncodingParameters, "active" | "maxBitrate" | "maxFramerate" | "scaleResolutionDownBy">
>;

export function snapRequestedHeight(pixels: number): number {
  if (pixels <= 0) return 0;
  const fitting = RESOLUTION_STEPS.filter((step) => step >= pixels);
  return fitting.length ? fitting[fitting.length - 1] : RESOLUTION_STEPS[0];
}

export function targetEncoding({
  peerCount,
  stepDown,
  requestedHeight,
  captureShortSide,
}: {
  peerCount: number;
  stepDown: number;
  requestedHeight?: number;
  captureShortSide: number;
}): VideoTarget {
  const rung = rungFor(peerCount);
  const stepIndex = Math.min(Math.max(RESOLUTION_STEPS.indexOf(rung.height) + stepDown, 0), RESOLUTION_STEPS.length - 1);
  const limit = requestedHeight && requestedHeight > 0 ? snapRequestedHeight(requestedHeight) : Infinity;
  const height = Math.min(RESOLUTION_STEPS[stepIndex], limit);

  return {
    active: requestedHeight !== 0,
    maxBitrate: Math.min(rung.maxBitrate, STEP_BITRATE_CAP[height]),
    maxFramerate: MAX_FRAMERATE,
    scaleResolutionDownBy: Math.max(1, captureShortSide / height),
  };
}

export function withEncoding(params: RTCRtpSendParameters, target: VideoTarget): RTCRtpSendParameters | null {
  if (!params.encodings?.length) return null;
  const [first, ...rest] = params.encodings;
  return { ...params, encodings: [{ ...first, ...target }, ...rest] };
}

export function startBitrateKbps(peerCount: number): number {
  return Math.min(MAX_START_KBPS, rungFor(peerCount).maxBitrate / 1000);
}
