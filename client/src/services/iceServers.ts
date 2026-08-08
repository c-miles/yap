import { API_BASE_URL } from "../config";

export const STUN_FALLBACK: RTCIceServer[] = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
];

const CACHE_TTL_MS = 60 * 60 * 1000;

let cached: RTCIceServer[] | null = null;
let cachedAt = 0;
let pending: Promise<RTCIceServer[]> | null = null;

// Failure never blocks a call — worst case we run STUN-only, which is
// exactly the pre-TURN behavior.
export async function getIceServers(): Promise<RTCIceServer[]> {
  if (cached && Date.now() - cachedAt < CACHE_TTL_MS) {
    return cached;
  }

  if (pending) {
    return pending;
  }

  const fetchIceServers = async (): Promise<RTCIceServer[]> => {
    try {
      const response = await fetch(`${API_BASE_URL}/turn-credentials`);
      if (!response.ok) {
        throw new Error(`status ${response.status}`);
      }
      const data = await response.json();
      if (!Array.isArray(data.iceServers) || data.iceServers.length === 0) {
        throw new Error("empty ice server list");
      }
      cached = data.iceServers;
      cachedAt = Date.now();
      return cached as RTCIceServer[];
    } catch (error) {
      console.error("Could not fetch TURN credentials, using STUN only:", error);
      return STUN_FALLBACK;
    }
  };

  pending = fetchIceServers().finally(() => {
    pending = null;
  });

  return pending;
}

export function resetIceServerCache(): void {
  cached = null;
  cachedAt = 0;
  pending = null;
}
