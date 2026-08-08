export const STUN_FALLBACK = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
];

const CREDENTIAL_TTL_SECONDS = 86400;
const FETCH_TIMEOUT_MS = 5000;

// Mints ephemeral TURN credentials from Cloudflare Realtime. Never throws:
// a call must still be attemptable (STUN-only) when TURN is down/unconfigured.
export async function fetchIceServers({ keyId, apiToken, fetchFn = fetch } = {}) {
  if (!keyId || !apiToken) {
    return STUN_FALLBACK;
  }

  try {
    const response = await fetchFn(
      `https://rtc.live.cloudflare.com/v1/turn/keys/${keyId}/credentials/generate-ice-servers`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ttl: CREDENTIAL_TTL_SECONDS }),
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      }
    );
    if (!response.ok) {
      throw new Error(`TURN credential request failed with status ${response.status}`);
    }
    const data = await response.json();
    // generate-ice-servers returns { iceServers: [...] }; the older generate
    // endpoint returns a single object — normalize both into a list.
    const list = Array.isArray(data.iceServers) ? data.iceServers : [data.iceServers];
    if (list.length === 0 || !list[0] || !list[0].urls) {
      throw new Error("TURN credential response had no servers");
    }
    return list;
  } catch (error) {
    console.error("TURN credentials unavailable, falling back to STUN only:", error.message);
    return STUN_FALLBACK;
  }
}
