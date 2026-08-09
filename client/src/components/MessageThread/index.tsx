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
      // Request existing room messages when component mounts
      socket.emit("getRoomMessages", { roomId });

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
      const newMessage = {
        roomId,
        username,
        message: messageContent,
        timestamp: new Date(),
      };
      // no local append — the server echoes receiveMessage to everyone, us included
      socket?.emit("sendMessage", newMessage);
    }
  };

  return (
    <MessageThread messages={messages} onSendMessage={handleSendMessage} />
  );
};

export default MessageThreadContainer;
