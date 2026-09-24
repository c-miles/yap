const VIDEO_CODEC = /^a=rtpmap:(\d+) (VP8|VP9|H264|AV1)\/90000/;
const START_BITRATE = "x-google-start-bitrate";

// without this the encoder assumes ~300 kbps and opens at 320x180 before ramping up.
// chrome and safari read it from the description they receive; firefox ignores it
export function withStartBitrate(sdp: string, kbps: number): string {
  const lines = sdp.split("\r\n");
  const codecs = new Set<string>();
  const hasFmtp = new Set<string>();
  let inVideo = false;

  lines.forEach((line) => {
    if (line.startsWith("m=")) inVideo = line.startsWith("m=video");
    const codec = inVideo ? line.match(VIDEO_CODEC) : null;
    if (codec) codecs.add(codec[1]);
    const fmtp = inVideo ? line.match(/^a=fmtp:(\d+) /) : null;
    if (fmtp) hasFmtp.add(fmtp[1]);
  });

  const hint = `${START_BITRATE}=${kbps}`;
  inVideo = false;
  return lines
    .flatMap((line) => {
      if (line.startsWith("m=")) inVideo = line.startsWith("m=video");
      if (!inVideo) return [line];

      const fmtp = line.match(/^a=fmtp:(\d+) (.*)$/);
      if (fmtp && codecs.has(fmtp[1])) {
        return fmtp[2].includes(START_BITRATE) ? [line] : [`${line};${hint}`];
      }
      const rtpmap = line.match(/^a=rtpmap:(\d+) /);
      if (rtpmap && codecs.has(rtpmap[1]) && !hasFmtp.has(rtpmap[1])) {
        return [line, `a=fmtp:${rtpmap[1]} ${hint}`];
      }
      return [line];
    })
    .join("\r\n");
}
