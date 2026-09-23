import test from "node:test";
import assert from "node:assert/strict";
import { buildAllowedOrigins } from "../services/allowedOrigins.js";

test("always allows the local dev client", () => {
  assert.deepEqual(buildAllowedOrigins({}), ["http://localhost:3000"]);
});

test("adds the render url and the custom domain when they're set", () => {
  const origins = buildAllowedOrigins({
    RENDER_EXTERNAL_URL: "https://echo-zzrf.onrender.com",
    APP_URL: "https://yap.anomaly-labs.com",
  });
  assert.deepEqual(origins, [
    "http://localhost:3000",
    "https://echo-zzrf.onrender.com",
    "https://yap.anomaly-labs.com",
  ]);
});

test("strips a trailing slash so the origin still matches", () => {
  const origins = buildAllowedOrigins({ APP_URL: "https://yap.anomaly-labs.com/" });
  assert.deepEqual(origins, ["http://localhost:3000", "https://yap.anomaly-labs.com"]);
});
