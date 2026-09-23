export function buildAllowedOrigins(env) {
  return ["http://localhost:3000", env.RENDER_EXTERNAL_URL, env.APP_URL]
    .filter(Boolean)
    // a trailing slash would fail cors and clerk's authorizedParties check
    .map((url) => new URL(url).origin);
}
