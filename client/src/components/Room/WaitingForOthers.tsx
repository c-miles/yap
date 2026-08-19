import React from "react";
import { Link2, Check } from "lucide-react";
import { useCopyInvite } from "../../hooks/useCopyInvite";

// Empty-room invite prompt; Room renders it only while participants.size === 0.
const WaitingForOthers: React.FC<{ roomName?: string }> = ({ roomName }) => {
  const { copied, failed, copy } = useCopyInvite(roomName);
  return (
    <div className="flex items-center gap-4 rounded-xl bg-surface/95 border border-border shadow-lg px-4 py-3 text-text">
      <div className="text-left">
        <p className="text-sm font-medium">Waiting for others to join…</p>
        <p className="text-xs text-text-secondary">
          {failed ? "Couldn't copy — press ⌘C" : "Share the room to pull someone in."}
        </p>
      </div>
      <button
        type="button"
        onClick={copy}
        aria-label="Copy invite link"
        className="focus-ring inline-flex items-center gap-2 min-h-[44px] px-4 rounded-lg bg-accent text-accent-fg text-sm font-semibold hover:bg-accent-hover transition-colors shrink-0"
      >
        {copied ? <Check size={18} aria-hidden="true" /> : <Link2 size={18} aria-hidden="true" />}
        {copied ? "Copied" : "Copy invite"}
      </button>
    </div>
  );
};

export default WaitingForOthers;
