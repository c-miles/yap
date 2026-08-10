// set by the bridge under ClerkProvider; read by authFetch, the socket's
// handshake callback, and the ice-server fetch — none of which can use hooks
type TokenGetter = () => Promise<string | null>;

let tokenGetter: TokenGetter | null = null;

export function setAuthTokenGetter(getter: TokenGetter | null): void {
  tokenGetter = getter;
}

export async function getAuthToken(): Promise<string | null> {
  if (!tokenGetter) {
    return null;
  }
  try {
    return await tokenGetter();
  } catch {
    return null;
  }
}
