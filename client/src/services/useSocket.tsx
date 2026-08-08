import React from "react";
import { Socket } from "socket.io-client";
import { getSocket } from "./socket";

const useSocket = (): Socket | null => {
  const [socket, setSocket] = React.useState<Socket | null>(null);

  React.useEffect(() => {
    const s = getSocket();
    s.connect();
    setSocket(s);

    return () => {
      s.disconnect();
    };
  }, []);

  return socket;
};

export default useSocket;
