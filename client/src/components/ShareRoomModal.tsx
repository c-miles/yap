import React, { useState, useRef, useEffect, Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { Copy, Check, X } from "lucide-react";
import { IconButton } from "./atoms";
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
    <Transition appear show={open} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-150"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-100"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/50" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-150"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-100"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-lg bg-surface border border-border p-6 text-left align-middle shadow-xl transition-all">
                <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-text mb-4 relative">
                  Share room
                  <button
                    onClick={onClose}
                    aria-label="Close"
                    className="focus-ring absolute right-0 top-0 text-text-muted hover:text-text transition-colors"
                  >
                    <X size={20} />
                  </button>
                </Dialog.Title>

                <div className="mt-4">
                  <p className="text-sm text-text-secondary mb-2">Room name</p>
                  <div className="flex items-center gap-2 bg-bg border border-border rounded-lg p-3">
                    <p className="flex-1 font-mono text-lg text-text break-all">{roomName}</p>
                    <IconButton onClick={() => copy(roomName, "name")} size="sm" aria-label="Copy room name">
                      {copied === "name" ? <Check size={16} /> : <Copy size={16} />}
                    </IconButton>
                  </div>
                  {failed === "name" && (
                    <p className="mt-1 text-xs text-danger">Couldn't copy — press ⌘/Ctrl+C</p>
                  )}
                </div>

                <div className="mt-4">
                  <p className="text-sm text-text-secondary mb-2">Invite link</p>
                  <div className="flex items-center gap-2 bg-bg border border-border rounded-lg p-3">
                    <p className="flex-1 text-sm font-mono text-text-secondary break-all">{shareableUrl}</p>
                    <IconButton onClick={() => copy(shareableUrl, "link")} size="sm" aria-label="Copy invite link">
                      {copied === "link" ? <Check size={16} /> : <Copy size={16} />}
                    </IconButton>
                  </div>
                  {failed === "link" && (
                    <p className="mt-1 text-xs text-danger">Couldn't copy — press ⌘/Ctrl+C</p>
                  )}
                </div>

                <p className="mt-4 text-xs text-text-muted">
                  Anyone with a Yap account can hop in from this link — or by entering the room name.
                </p>
                <span aria-live="polite" className="sr-only">
                  {copied === "name"
                    ? "Room name copied"
                    : copied === "link"
                    ? "Invite link copied"
                    : failed
                    ? "Couldn't copy — press Command or Control C"
                    : ""}
                </span>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default ShareRoomModal;
