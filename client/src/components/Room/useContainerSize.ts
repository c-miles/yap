import { useLayoutEffect, useRef, useState } from "react";

// Measures an element's content box with a ResizeObserver. Container-based (not
// window) so it also tracks the chat-drawer reflow. The first measurement is
// taken synchronously inside useLayoutEffect — before the browser paints — so
// tiles never flash at the wrong size on room entry.
export function useContainerSize<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || typeof ResizeObserver === "undefined") return;

    // clientWidth/Height are the padding box; subtract padding to match the
    // observer's content-box rect, so the seed and later updates agree.
    const style = getComputedStyle(el);
    const padX = parseFloat(style.paddingLeft) + parseFloat(style.paddingRight);
    const padY = parseFloat(style.paddingTop) + parseFloat(style.paddingBottom);
    setSize({ width: el.clientWidth - padX, height: el.clientHeight - padY });

    const observer = new ResizeObserver(([entry]) =>
      setSize({ width: entry.contentRect.width, height: entry.contentRect.height })
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return { ref, size };
}
