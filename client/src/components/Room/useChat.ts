import { useCallback, useEffect, useRef, useState } from "react";
import { Message } from "../../types/messageTypes";

// Single source of truth for in-call chat: socket wiring + message list + unread
// tracking, so the panel, the unread badge, and the over-video toast all read
// from one place. Unread counts messages that arrive while the panel is closed.
export function useChat(
  socket: any,
  roomId: string | undefined,
  username: string | undefined,
  isChatOpen: boolean
) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [latestUnread, setLatestUnread] = useState<Message | null>(null);

  // read live open-state inside the socket handler without re-subscribing
  // (re-subscribing would re-emit getRoomMessages on every open/close).
  const isChatOpenRef = useRef(isChatOpen);
  isChatOpenRef.current = isChatOpen;

  useEffect(() => {
    if (!socket || !roomId) return;
    socket.emit("getRoomMessages");

    const handleRoomMessages = (roomMessages: Message[]) => setMessages(roomMessages);
    const handleReceiveMessage = (msg: Message) => {
      setMessages((prev) => [...prev, msg]);
      if (!isChatOpenRef.current) {
        setUnreadCount((n) => n + 1);
        setLatestUnread(msg);
      }
    };

    socket.on("roomMessages", handleRoomMessages);
    socket.on("receiveMessage", handleReceiveMessage);
    return () => {
      socket.off("roomMessages", handleRoomMessages);
      socket.off("receiveMessage", handleReceiveMessage);
    };
  }, [socket, roomId]);

  useEffect(() => {
    if (isChatOpen) {
      setUnreadCount(0);
      setLatestUnread(null);
    }
  }, [isChatOpen]);

  const sendMessage = useCallback(
    (text: string) => {
      if (text.trim() && roomId && username) {
        socket?.emit("sendMessage", { message: text, username });
      }
    },
    [socket, roomId, username]
  );

  return { messages, sendMessage, unreadCount, latestUnread };
}
