import { io, Socket } from "socket.io-client";
import { API_BASE_URL } from "../config";
import { getAuthToken } from "./authToken";

let socket: Socket | null = null;

// clerk tokens live ~60s; socket.io re-invokes this callback on every
// (re)connect, so each handshake gets a fresh one.
const authCallback = (cb: (data: object) => void) => {
  getAuthToken().then((token) => cb(token ? { token } : {}));
};

// One socket for the whole app. autoConnect: false so the connection's
// lifetime is owned by useSocket's effect, not module import order.
export function getSocket(): Socket {
  if (!socket) {
    socket = API_BASE_URL
      ? io(API_BASE_URL, { autoConnect: false, auth: authCallback })
      : io({ autoConnect: false, auth: authCallback });
  }
  return socket;
}
