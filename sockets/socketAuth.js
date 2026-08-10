import { verifyToken } from "@clerk/express";

// socket.io invokes the client's auth callback on every (re)connect, so each
// handshake carries a fresh short-lived clerk token — verify it here once per
// connection and stamp the identity the event handlers will trust.
export function createSocketAuth({ secretKey, authorizedParties, verify = verifyToken }) {
  return async (socket, next) => {
    const token = socket.handshake?.auth?.token;
    if (!token) {
      return next(new Error("unauthorized"));
    }
    try {
      const payload = await verify(token, { secretKey, authorizedParties });
      socket.data.userId = payload.sub;
      next();
    } catch (error) {
      next(new Error("unauthorized"));
    }
  };
}
