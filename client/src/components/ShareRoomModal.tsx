import React, { useState, useRef, useEffect } from "react";
import { Copy, Check } from "lucide-react";
import { IconButton, Icon } from "./atoms";
import { Modal } from "./molecules";
import { copyToClipboard } from "../utils/copyToClipboard";

interface ShareRoomModalProps {
  open: boolean;
  onClose: () => void;
  roomName: string;
}

const ShareRoomModal: React.FC<ShareRoomModalProps> = ({ open, onClose, roomName }) => {
  const [copied, setCopied] = useState<null | "link" | "name">(null);
  const [failed, setFailed] = useState<null | "link" | "name">(null);
  const revertTimer = useRef<ReturnType<typeof setTimeout>>();
  const shareableUrl = `${window.location.origin}/room/${roomName}`;

  useEffect(() => {
    return () => {
      if (revertTimer.current) clearTimeout(revertTimer.current);
    };
  }, []);

  const copy = async (text: string, field: "link" | "name") => {
    const ok = await copyToClipboard(text);
    if (revertTimer.current) clearTimeout(revertTimer.current);
    if (ok) {
      setCopied(field);
      setFailed(null);
      revertTimer.current = setTimeout(() => setCopied(null), 2000);
    } else {
      setFailed(field);
      setCopied(null);
      revertTimer.current = setTimeout(() => setFailed(null), 2000);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Share room">
      <div className="mt-4">
        <p className="text-sm text-text-secondary mb-2">Room name</p>
        <div className="flex items-center gap-2 bg-bg border border-border rounded-lg p-3">
          <p className="flex-1 font-mono text-lg text-text break-all">{roomName}</p>
          <IconButton onClick={() => copy(roomName, "name")} size="sm" aria-label="Copy room name">
            {copied === "name" ? <Icon icon={Check} size="sm" /> : <Icon icon={Copy} size="sm" />}
          </IconButton>
        </div>
        {failed === "name" && <p className="mt-1 text-xs text-danger">Couldn't copy, press Cmd/Ctrl+C</p>}
      </div>

      <div className="mt-4">
        <p className="text-sm text-text-secondary mb-2">Invite link</p>
        <div className="flex items-center gap-2 bg-bg border border-border rounded-lg p-3">
          <p className="flex-1 text-sm font-mono text-text-secondary break-all">{shareableUrl}</p>
          <IconButton onClick={() => copy(shareableUrl, "link")} size="sm" aria-label="Copy invite link">
            {copied === "link" ? <Icon icon={Check} size="sm" /> : <Icon icon={Copy} size="sm" />}
          </IconButton>
        </div>
        {failed === "link" && <p className="mt-1 text-xs text-danger">Couldn't copy, press Cmd/Ctrl+C</p>}
      </div>

      <p className="mt-4 text-xs text-text-muted">
        Anyone with a Yap account can hop in from this link, or by entering the room name.
      </p>
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
