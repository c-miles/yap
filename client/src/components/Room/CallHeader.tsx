import React, { useState, useRef, useEffect } from "react";
import { Link2, Check } from "lucide-react";

interface CallHeaderProps {
  roomName?: string;
  participantCount: number;
  roomId?: string;
  visible: boolean;
  onPointerDown?: React.PointerEventHandler<HTMLElement>;
}

const CallHeader: React.FC<CallHeaderProps> = ({ roomName, participantCount, roomId, visible, onPointerDown }) => {
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const copyInvite = async () => {
    if (!roomId) return;
    // Clear any pending timer before scheduling a new one
    if (timerRef.current) clearTimeout(timerRef.current);

    if (!navigator.clipboard) return;

    try {
      await navigator.clipboard.writeText(`${window.location.origin}/room/${roomId}`);
      setCopied(true);
      timerRef.current = setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard blocked (insecure context / denied) — ShareRoomModal stays the reliable path
    }
  };

  return (
    <header
      className={`absolute top-0 inset-x-0 z-20 flex items-center justify-between gap-4 px-4 py-3
        bg-gradient-to-b from-black/60 to-transparent text-text-secondary
        transition-opacity duration-300 motion-reduce:transition-none
        ${visible ? "opacity-100" : "opacity-0 pointer-events-none"}`}
      style={{ paddingTop: "max(0.75rem, env(safe-area-inset-top))" }}
      onPointerDown={onPointerDown}
    >
      <span className="text-sm font-medium text-text truncate min-w-0">{roomName}</span>
      <span className="text-xs whitespace-nowrap">
        {participantCount} {participantCount === 1 ? "person" : "people"}
      </span>
      <button
        type="button"
        onClick={copyInvite}
        aria-label="Copy invite link"
        className="focus-ring inline-flex items-center gap-1.5 rounded-full px-3 py-2.5 min-h-[48px] text-xs
          bg-white/10 hover:bg-white/20 text-text transition-colors"
      >
        {copied ? <Check size={16} aria-hidden="true" /> : <Link2 size={16} aria-hidden="true" />}
        <span>{copied ? "Copied" : "Copy invite"}</span>
      </button>
    </header>
  );
};

export default CallHeader;
