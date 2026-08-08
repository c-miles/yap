interface EnvLike {
  REACT_APP_API_BASE_URL?: string;
  NODE_ENV?: string;
}

// Empty string means same-origin: fetch("/rooms/...") and io() both resolve
// against the page's own origin, which is correct when Express serves the build.
export function resolveApiBaseUrl(env: EnvLike): string {
  if (env.REACT_APP_API_BASE_URL !== undefined) {
    return env.REACT_APP_API_BASE_URL;
  }
  return env.NODE_ENV === "production" ? "" : "http://localhost:3001";
}

export const API_BASE_URL = resolveApiBaseUrl(process.env as EnvLike);
