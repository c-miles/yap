export const STUN_FALLBACK = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
];

export const CREDENTIAL_TTL_SECONDS = 7200;
const FETCH_TIMEOUT_MS = 5000;

// never throws: a call should still work STUN-only when TURN is down or unset
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
    const { iceServers } = await response.json();
    if (!Array.isArray(iceServers) || !iceServers[0]?.urls) {
      throw new Error("TURN credential response had no servers");
    }
    return iceServers;
  } catch (error) {
    console.error("TURN credentials unavailable, falling back to STUN only:", error.message);
    return STUN_FALLBACK;
  }
}
