import { withStartBitrate } from "./sdpHints";

const sdp = [
  "v=0",
  "m=audio 9 UDP/TLS/RTP/SAVPF 111",
  "a=rtpmap:111 opus/48000/2",
  "a=fmtp:111 minptime=10;useinbandfec=1",
  "m=video 9 UDP/TLS/RTP/SAVPF 96 97 102",
  "a=rtpmap:96 VP8/90000",
  "a=rtpmap:97 rtx/90000",
  "a=fmtp:97 apt=96",
  "a=rtpmap:102 H264/90000",
  "a=fmtp:102 level-asymmetry-allowed=1;profile-level-id=42e01f",
  "",
].join("\r\n");

const lines = (text: string) => text.split("\r\n");

test("adds an fmtp line for a codec that has none, right after its rtpmap", () => {
  const out = lines(withStartBitrate(sdp, 1000));
  expect(out[out.indexOf("a=rtpmap:96 VP8/90000") + 1]).toBe("a=fmtp:96 x-google-start-bitrate=1000");
});

test("appends to a codec's existing fmtp line", () => {
  expect(lines(withStartBitrate(sdp, 700))).toContain(
    "a=fmtp:102 level-asymmetry-allowed=1;profile-level-id=42e01f;x-google-start-bitrate=700"
  );
});

test("leaves audio and retransmission payloads alone", () => {
  const out = lines(withStartBitrate(sdp, 1000));
  expect(out).toContain("a=fmtp:111 minptime=10;useinbandfec=1");
  expect(out).toContain("a=fmtp:97 apt=96");
});

test("applying it twice doesn't stack hints", () => {
  const once = withStartBitrate(sdp, 1000);
  expect(withStartBitrate(once, 1000)).toBe(once);
});
