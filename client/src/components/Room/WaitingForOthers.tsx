import React from "react";
import { Link2, Check } from "lucide-react";
import { Button, Icon } from "../atoms";
import { useCopyFeedback } from "../../hooks/useCopyFeedback";
import { inviteUrl } from "../../utils/roomName";

const WaitingForOthers: React.FC<{ roomName: string }> = ({ roomName }) => {
  const { copied, failed, copy } = useCopyFeedback<"invite">();
  return (
    <div className="flex items-center gap-4 rounded-xl glass-strong px-4 py-3 text-text">
      <div className="text-left">
        <p className="text-sm font-medium">Waiting for others to join…</p>
        <p className="text-xs text-text-secondary">
          {failed ? "Couldn't copy, press ⌘C" : "Share the room to pull someone in."}
        </p>
      </div>
      <Button onClick={() => copy(inviteUrl(roomName), "invite")} aria-label="Copy invite link" size="sm" className="shrink-0">
        <Icon icon={copied ? Check : Link2} size="sm" aria-hidden="true" />
        {copied ? "Copied" : "Copy invite"}
      </Button>
    </div>
  );
};

export default WaitingForOthers;
