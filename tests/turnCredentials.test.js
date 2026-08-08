import test from "node:test";
import assert from "node:assert/strict";
import { fetchIceServers, STUN_FALLBACK } from "../services/turnCredentials.js";

test("returns STUN fallback when credentials are not configured", async () => {
  const servers = await fetchIceServers({});
  assert.deepEqual(servers, STUN_FALLBACK);
});

test("returns Cloudflare's server list on success", async () => {
  const provided = [
    {
      urls: [
        "stun:stun.cloudflare.com:3478",
        "turn:turn.cloudflare.com:3478?transport=udp",
        "turns:turn.cloudflare.com:443?transport=tcp",
      ],
      username: "u",
      credential: "c",
    },
  ];
  const fetchFn = async () => ({ ok: true, json: async () => ({ iceServers: provided }) });
  const servers = await fetchIceServers({
    keyId: "test-key-id",
    apiToken: "test-token",
    fetchFn,
  });
  assert.deepEqual(servers, provided);
});

test("normalizes a single iceServers object into a list", async () => {
  const single = { urls: ["turn:turn.cloudflare.com:3478"], username: "u", credential: "c" };
  const fetchFn = async () => ({ ok: true, json: async () => ({ iceServers: single }) });
  const servers = await fetchIceServers({
    keyId: "test-key-id",
    apiToken: "test-token",
    fetchFn,
  });
  assert.deepEqual(servers, [single]);
});

test("sends the key id in the URL and the token as a bearer header", async () => {
  let seenUrl = "";
  let seenOptions = {};
  const fetchFn = async (url, options) => {
    seenUrl = url;
    seenOptions = options;
    return { ok: true, json: async () => ({ iceServers: [{ urls: ["turn:x"], username: "u", credential: "c" }] }) };
  };
  await fetchIceServers({ keyId: "abc123", apiToken: "tok456", fetchFn });
  assert.match(seenUrl, /\/turn\/keys\/abc123\/credentials\/generate-ice-servers$/);
  assert.equal(seenOptions.headers.Authorization, "Bearer tok456");
});

test("falls back to STUN when the provider errors", async () => {
  const fetchFn = async () => ({ ok: false, status: 500 });
  const servers = await fetchIceServers({
    keyId: "test-key-id",
    apiToken: "test-token",
    fetchFn,
  });
  assert.deepEqual(servers, STUN_FALLBACK);
});

test("falls back to STUN when the response has no servers", async () => {
  const fetchFn = async () => ({ ok: true, json: async () => ({ nope: true }) });
  const servers = await fetchIceServers({
    keyId: "test-key-id",
    apiToken: "test-token",
    fetchFn,
  });
  assert.deepEqual(servers, STUN_FALLBACK);
});

test("falls back to STUN when the fetch rejects", async () => {
  const fetchFn = async () => {
    throw new Error("network failure");
  };
  const servers = await fetchIceServers({
    keyId: "test-key-id",
    apiToken: "test-token",
    fetchFn,
  });
  assert.deepEqual(servers, STUN_FALLBACK);
});

test("passes an abort signal so a hung provider cannot block the call", async () => {
  let seenOptions = {};
  const fetchFn = async (url, options) => {
    seenOptions = options;
    return { ok: true, json: async () => ({ iceServers: [{ urls: ["turn:x"], username: "u", credential: "c" }] }) };
  };
  await fetchIceServers({ keyId: "test-key-id", apiToken: "test-token", fetchFn });
  assert.ok(seenOptions.signal instanceof AbortSignal, "signal should be an AbortSignal");
});
