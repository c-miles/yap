import { io, Socket } from "socket.io-client";
import { API_BASE_URL } from "../config";

let socket: Socket | null = null;

// One socket for the whole app. autoConnect: false so the connection's
// lifetime is owned by useSocket's effect, not module import order.
export function getSocket(): Socket {
  if (!socket) {
    socket = API_BASE_URL
      ? io(API_BASE_URL, { autoConnect: false })
      : io({ autoConnect: false });
  }
  return socket;
}
