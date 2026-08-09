// 6-way mesh = each client encodes its video up to 5 times. Uncapped 720p+
// makes that ~5x full bitrate uploads; 480p at 600kbps keeps phones alive.
export const MAX_VIDEO_BITRATE_BPS = 600_000;

export const VIDEO_CONSTRAINTS: MediaTrackConstraints = {
  width: { ideal: 640 },
  height: { ideal: 480 },
  frameRate: { ideal: 24, max: 30 },
};

export function withVideoBitrateCap(params: RTCRtpSendParameters): RTCRtpSendParameters {
  const encodings = params.encodings?.length ? params.encodings : [{}];
  return {
    ...params,
    encodings: encodings.map((encoding) => ({ ...encoding, maxBitrate: MAX_VIDEO_BITRATE_BPS })),
  };
}
