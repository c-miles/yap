import { useEffect, useRef, useState } from "react";
import { Socket } from "socket.io-client";
import { snapRequestedHeight } from "./videoQuality";

const REQUEST_DEBOUNCE_MS = 300;

// tells each sender the most we can show of them, 0 pauses their video while our tab is hidden
export function useVideoRequests(socket: Socket | null, remoteUserIds: string[], tileHeight: number) {
  const [hidden, setHidden] = useState(document.hidden);
  const [resendKey, setResendKey] = useState(0);
  const sent = useRef(new Map<string, number>());
  const idsKey = remoteUserIds.join(",");

  useEffect(() => {
    const onVisibilityChange = () => setHidden(document.hidden);
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => document.removeEventListener("visibilitychange", onVisibilityChange);
  }, []);

  // a rejoin on either side can drop our request, so send it again
  useEffect(() => {
    if (!socket) return;
    const forgetUser = ({ userId }: { userId: string }) => {
      sent.current.delete(userId);
      setResendKey((key) => key + 1);
    };
    const forgetEveryone = () => {
      sent.current.clear();
      setResendKey((key) => key + 1);
    };
    socket.on("userJoined", forgetUser);
    socket.on("currentParticipants", forgetEveryone);
    return () => {
      socket.off("userJoined", forgetUser);
      socket.off("currentParticipants", forgetEveryone);
    };
  }, [socket]);

  const maxHeight = hidden ? 0 : snapRequestedHeight(tileHeight * (window.devicePixelRatio || 1));
  const measured = hidden || tileHeight > 0;

  useEffect(() => {
    if (!socket || !measured) return;
    const ids = idsKey ? idsKey.split(",") : [];

    const timer = setTimeout(() => {
      ids.forEach((userId) => {
        if (sent.current.get(userId) === maxHeight) return;
        socket.emit("sendVideoRequest", { targetUserId: userId, maxHeight });
        sent.current.set(userId, maxHeight);
      });
      Array.from(sent.current.keys())
        .filter((userId) => !ids.includes(userId))
        .forEach((userId) => sent.current.delete(userId));
    }, REQUEST_DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [socket, idsKey, maxHeight, measured, resendKey]);
}
