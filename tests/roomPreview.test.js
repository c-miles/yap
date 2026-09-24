import test from "node:test";
import assert from "node:assert/strict";
import { withRoomPreview } from "../services/roomPreview.js";

const html = `<html><head>
<title>yap · Drop-in video rooms for your group</title>
<meta name="description" content="Start a room, share the link."/>
<meta property="og:title" content="Drop-in video rooms for your group"/>
<meta property="og:description" content="Start a room, share the link."/>
<meta name="twitter:title" content="Drop-in video rooms for your group"/>
<meta name="twitter:description" content="Start a room, share the link."/>
</head><body></body></html>`;

test("a friendly room name becomes the preview title", () => {
  const out = withRoomPreview(html, "brave-blue-tiger");
  assert.match(out, /<title>Join brave-blue-tiger · yap<\/title>/);
  assert.match(out, /<meta property="og:title" content="Join brave-blue-tiger"\/?>/);
  assert.match(out, /<meta name="twitter:title" content="Join brave-blue-tiger"\/?>/);
});

test("room previews describe the invite and stay out of search", () => {
  const out = withRoomPreview(html, "brave-blue-tiger");
  const invite = "You're invited to a video room on yap. Up to 6 people, right in your browser.";
  assert.match(out, new RegExp(`<meta property="og:description" content="${invite}"\/?>`));
  assert.match(out, new RegExp(`<meta name="twitter:description" content="${invite}"\/?>`));
  assert.match(out, /<meta property="og:url" content="https:\/\/yap\.anomaly-labs\.com\/room\/brave-blue-tiger">/);
  assert.match(out, /<meta name="robots" content="noindex">/);
});

test("anything that isn't a friendly name gets a generic title and is never echoed", () => {
  for (const room of ["507f1f77bcf86cd799439011", "<script>", "Brave-Blue-Tiger"]) {
    const out = withRoomPreview(html, room);
    assert.match(out, /<title>Join a video room · yap<\/title>/);
    assert.match(out, /<meta property="og:title" content="Join a video room"\/?>/);
    assert.ok(!out.includes(room), `${room} leaked into the page`);
  }
});
