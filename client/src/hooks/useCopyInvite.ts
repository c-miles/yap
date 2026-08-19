import { useEffect, useRef, useState } from "react";
import { copyToClipboard } from "../utils/copyToClipboard";

// Copies the room invite URL and flips 'copied' for ~2s. Used by the solo empty-room prompt.
//
// Takes the friendly room NAME (the human-readable slug), not the Mongo id —
// a link built from the id lands the recipient in a green room with no room
// name to show.
export function useCopyInvite(roomName?: string) {
  const [copied, setCopied] = useState(false);
  const [failed, setFailed] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  const copy = async () => {
    if (!roomName) return;
    const ok = await copyToClipboard(`${window.location.origin}/room/${roomName}`);
    if (timer.current) clearTimeout(timer.current);
    if (ok) {
      setCopied(true);
      setFailed(false);
      timer.current = setTimeout(() => setCopied(false), 2000);
    } else {
      setFailed(true);
      setCopied(false);
      timer.current = setTimeout(() => setFailed(false), 2000);
    }
  };

  return { copied, failed, copy };
}
