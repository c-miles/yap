import React, { useEffect, useRef, useState } from "react";
import { Message } from "../../types/messageTypes";

const VISIBLE_MS = 5000;

// Briefly surfaces the latest message over the video while chat is closed. Shows
// on each new message (Room passes null once chat opens), auto-hides after ~5s.
const ChatToast: React.FC<{ message: Message | null }> = ({ message }) => {
  const [shown, setShown] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (!message) {
      setShown(false);
      return;
    }
    setShown(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setShown(false), VISIBLE_MS);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [message]);

  if (!message) return null;

  return (
    <div
      className={`chat-toast max-w-sm rounded-xl bg-surface-raised px-4 py-2 text-sm shadow-lg
        transition-opacity duration-300 motion-reduce:transition-none ${shown ? "opacity-100" : "opacity-0 pointer-events-none"}`}
      role="status"
      aria-live="polite"
    >
      <span className="font-medium text-accent">{message.username}</span>{" "}
      <span className="text-text break-words">{message.message}</span>
    </div>
  );
};

export default ChatToast;
