import { useCallback, useEffect, useRef, useState } from "react";

const HIDE_DELAY_MS = 4000;

// hides the call header and controls after HIDE_DELAY_MS; enabled=false pins them
export function useChromeVisibility(enabled: boolean) {
  const [visible, setVisible] = useState(true);
  const timer = useRef<ReturnType<typeof setTimeout>>();

  const clear = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const reveal = useCallback(() => {
    if (!enabled) return;
    clear();
    setVisible(true);
    timer.current = setTimeout(() => setVisible(false), HIDE_DELAY_MS);
  }, [enabled, clear]);

  const hide = useCallback(() => {
    if (!enabled) return;
    clear();
    setVisible(false);
  }, [enabled, clear]);

  useEffect(() => {
    if (!enabled) {
      clear();
      setVisible(true);
      return;
    }
    timer.current = setTimeout(() => setVisible(false), HIDE_DELAY_MS);
    return clear;
  }, [enabled, clear]);

  return { visible, reveal, hide };
}
