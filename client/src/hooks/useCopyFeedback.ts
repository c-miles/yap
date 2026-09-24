import { useEffect, useRef, useState } from "react";
import { copyToClipboard } from "../utils/copyToClipboard";

// copied/failed hold the key of the last copy for ~2s
export function useCopyFeedback<K extends string>() {
  const [copied, setCopied] = useState<K | null>(null);
  const [failed, setFailed] = useState<K | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  const copy = async (text: string, key: K) => {
    const ok = await copyToClipboard(text);
    if (timer.current) clearTimeout(timer.current);
    setCopied(ok ? key : null);
    setFailed(ok ? null : key);
    timer.current = setTimeout(() => (ok ? setCopied(null) : setFailed(null)), 2000);
  };

  return { copied, failed, copy };
}
