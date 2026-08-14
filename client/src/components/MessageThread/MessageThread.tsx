import React, { useEffect, useRef } from "react";
import { Send } from "lucide-react";
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
      el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
    }
  }, [newMessage]);

  return (
    <div className="h-full flex flex-col bg-surface overflow-hidden">
      <div ref={listRef} className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((msg, index) => (
          <div key={msg._id ?? index} className="text-sm break-words">
            <span className="font-medium text-accent">{msg.username}:</span>{" "}
            <span className="text-text break-words">{msg.message}</span>
          </div>
        ))}
      </div>

      <div className="p-4 border-t border-border bg-surface">
        <div className="flex gap-2 items-end">
          <textarea
            ref={inputRef}
            rows={1}
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            className="flex-1 resize-none px-3 py-2 bg-bg text-text border border-border rounded-lg
              focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
          />
          <button
            onClick={handleSendMessage}
            className="p-2 bg-accent hover:bg-accent-hover text-accent-fg rounded-lg transition-colors flex-shrink-0"
            aria-label="Send message"
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default MessageThread;
