import React, { useState, useEffect } from "react";

import { Message } from "../../types/messageTypes";
import MessageThread from "./MessageThread";

const MessageThreadContainer: React.FC<{
  roomId: string | undefined;
  username: string | undefined;
  socket: any;
}> = ({ roomId, username, socket }) => {
  const [messages, setMessages] = useState<Message[]>([]);

  useEffect(() => {
    if (socket && roomId) {
      // Request existing room messages when component mounts.
      // No payload needed: the server derives the room from its socket
      // registry, not from anything we send.
      socket.emit("getRoomMessages");

      const handleRoomMessages = (roomMessages: Message[]) => {
        setMessages(roomMessages);
      };

      const handleReceiveMessage = (receivedMessage: Message) => {
        setMessages((prevMessages) => [...prevMessages, receivedMessage]);
      };

      socket.on("roomMessages", handleRoomMessages);
      socket.on("receiveMessage", handleReceiveMessage);

      return () => {
        socket.off("receiveMessage", handleReceiveMessage);
        socket.off("roomMessages", handleRoomMessages);
      };
    }
  }, [socket, roomId]);

  const handleSendMessage = (messageContent: string) => {
    if (messageContent.trim() && roomId && username) {
      // no local append — the server echoes receiveMessage to everyone, us included
      // roomId/timestamp aren't sent: the server derives the room from its
      // socket registry and stamps its own timestamp
      socket?.emit("sendMessage", { message: messageContent, username });
    }
  };

  return (
    <MessageThread messages={messages} onSendMessage={handleSendMessage} />
  );
};

export default MessageThreadContainer;
