// same shape as the client's isValidRoomNameFormat, and the only thing keeping raw input out of the html
const FRIENDLY_NAME = /^[a-z]{3,}-[a-z]{3,}-[a-z]{3,}$/;
const SITE = "https://yap.anomaly-labs.com";
const INVITE = "You're invited to a video room on Yap. Up to 6 people, right in your browser.";

// only matches one-line <meta attr="key" content="..."> tags, as index.html has them
const setMeta = (html, attr, key, content) =>
  html.replace(new RegExp(`(<meta ${attr}="${key}" content=")[^"]*"`), `$1${content}"`);

export function withRoomPreview(html, room) {
  const friendly = FRIENDLY_NAME.test(room);
  const title = friendly ? `Join ${room}` : "Join a video room";
  const extra = [
    friendly && `<meta property="og:url" content="${SITE}/room/${room}">`,
    `<meta name="robots" content="noindex">`,
  ].filter(Boolean);

  let out = html.replace(/<title>[^<]*<\/title>/, `<title>${title} · Yap</title>`);
  out = setMeta(out, "property", "og:title", title);
  out = setMeta(out, "name", "twitter:title", title);
  out = setMeta(out, "property", "og:description", INVITE);
  out = setMeta(out, "name", "twitter:description", INVITE);
  return out.replace("</head>", `${extra.join("")}</head>`);
}
