import React, { useEffect, useRef } from "react";
import { Send } from "lucide-react";
import { Icon, IconButton, fieldClassName } from "../atoms";
import { MessageThreadProps } from "../../types/messageTypes";

const MessageThread: React.FC<MessageThreadProps> = ({ messages, onSendMessage }) => {
  const [newMessage, setNewMessage] = React.useState("");
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      onSendMessage(newMessage.trim());
      setNewMessage("");
    }
  };

  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages]);

  // auto-grow the textarea up to a small cap, then it scrolls
  useEffect(() => {
    const el = inputRef.current;
    if (el) {
      el.style.height = "auto";
      const full = el.scrollHeight;
      el.style.height = `${Math.min(full, 120)}px`;
      el.style.overflowY = full > 120 ? "auto" : "hidden";
    }
  }, [newMessage]);

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div ref={listRef} className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((msg, index) => (
          <div key={msg._id ?? index} className="text-sm break-words">
            <span className="font-semibold text-text">{msg.username}</span>{" "}
            <span className="text-text-secondary">{msg.message}</span>
          </div>
        ))}
      </div>

      <div className="p-4 border-t border-border">
        <div className="flex gap-2 items-end">
          <textarea
            ref={inputRef}
            rows={1}
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            aria-label="Message"
            placeholder="Type a message…"
            className={`${fieldClassName} border-glass-border flex-1 resize-none py-2.5`}
          />
          <IconButton variant="primary" onClick={handleSendMessage} aria-label="Send message" className="shrink-0">
            <Icon icon={Send} size="md" aria-hidden="true" />
          </IconButton>
        </div>
      </div>
    </div>
  );
};

export default MessageThread;
