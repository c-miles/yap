import React from "react";
import { Copy, Check } from "lucide-react";
import { IconButton, Icon } from "./atoms";
import { Modal } from "./molecules";
import { useCopyFeedback } from "../hooks/useCopyFeedback";
import { inviteUrl } from "../utils/roomName";

type Field = "name" | "link";

const CopyField: React.FC<{
  label: string;
  value: string;
  copied: boolean;
  failed: boolean;
  onCopy: () => void;
  valueClassName: string;
}> = ({ label, value, copied, failed, onCopy, valueClassName }) => (
  <div>
    <p className="text-sm text-text-secondary mb-2">{label}</p>
    <div className="flex items-center gap-2 bg-field border border-glass-border rounded-lg p-3">
      <p className={`flex-1 font-mono text-text break-all ${valueClassName}`}>{value}</p>
      <IconButton onClick={onCopy} aria-label={`Copy ${label.toLowerCase()}`}>
        <Icon icon={copied ? Check : Copy} size="sm" />
      </IconButton>
    </div>
    {failed && <p className="mt-1 text-sm text-danger">Couldn't copy, press Cmd/Ctrl+C</p>}
  </div>
);

const ShareRoomModal: React.FC<{ open: boolean; onClose: () => void; roomName: string }> = ({ open, onClose, roomName }) => {
  const { copied, failed, copy } = useCopyFeedback<Field>();
  const link = inviteUrl(roomName);

  return (
    <Modal open={open} onClose={onClose} title="Share room">
      <div className="space-y-4">
        <CopyField
          label="Room name"
          value={roomName}
          copied={copied === "name"}
          failed={failed === "name"}
          onCopy={() => copy(roomName, "name")}
          valueClassName="text-lg"
        />
        <CopyField
          label="Invite link"
          value={link}
          copied={copied === "link"}
          failed={failed === "link"}
          onCopy={() => copy(link, "link")}
          valueClassName="text-sm text-text-secondary"
        />
        <p className="text-xs text-text-muted">
          Anyone with a Yap account can hop in from this link, or by entering the room name.
        </p>
      </div>
      <span aria-live="polite" className="sr-only">
        {copied === "name"
          ? "Room name copied"
          : copied === "link"
          ? "Invite link copied"
          : failed
          ? "Couldn't copy, press Command or Control C"
          : ""}
      </span>
    </Modal>
  );
};

export default ShareRoomModal;
