import React, { useEffect, useRef } from "react";
import Noise from "../../utils/perlin";
import { createCursor, createField, drawField, moveCursor, stepField } from "./waves";
import "./WaveBackground.css";

// just under 1000/30, so 60hz screens draw every other frame
const SUBTLE_FRAME_GAP_MS = 30;

interface WaveBackgroundProps {
  // subtle is fainter and ignores the cursor, for pages with content on top
  variant?: "hero" | "subtle";
  className?: string;
}

const WaveBackground: React.FC<WaveBackgroundProps> = ({ variant = "hero", className = "" }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const container = containerRef.current!;
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const noise = new Noise(Math.random());
    const cursor = variant === "hero" ? createCursor() : null;
    const showCursorDot = cursor && !window.matchMedia("(hover: none) and (pointer: coarse)").matches;
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let field = createField(0, 0);
    let width = 0;
    let height = 0;
    let frame = 0;
    let lastDrawn = -Infinity;

    const draw = (time: number) => {
      stepField(field, time, noise, cursor);
      drawField(ctx, field, width, height);
    };

    const resize = () => {
      ({ width, height } = container.getBoundingClientRect());
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.lineWidth = 1;
      ctx.strokeStyle = getComputedStyle(canvas).color;
      field = createField(width, height);
      if (still) {
        draw(0);
      }
    };

    const tick = (time: number) => {
      frame = requestAnimationFrame(tick);
      if (variant === "subtle" && time - lastDrawn < SUBTLE_FRAME_GAP_MS) return;
      lastDrawn = time;
      draw(time);
      if (showCursorDot) {
        container.style.setProperty("--x", `${cursor.smoothX}px`);
        container.style.setProperty("--y", `${cursor.smoothY}px`);
      }
    };

    const followPointer = (clientX: number, clientY: number) => {
      const rect = container.getBoundingClientRect();
      moveCursor(cursor!, clientX - rect.left, clientY - rect.top);
    };
    const onMouseMove = (e: MouseEvent) => followPointer(e.clientX, e.clientY);
    const onTouchMove = (e: TouchEvent) => followPointer(e.touches[0].clientX, e.touches[0].clientY);

    const observer = new ResizeObserver(resize);
    observer.observe(container);
    resize();

    if (!still) {
      frame = requestAnimationFrame(tick);
      if (cursor) {
        window.addEventListener("mousemove", onMouseMove);
        window.addEventListener("touchmove", onTouchMove, { passive: true });
      }
    }

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("touchmove", onTouchMove);
    };
  }, [variant]);

  return (
    <div
      ref={containerRef}
      className={`wave-background ${variant === "subtle" ? "wave-background--subtle" : ""} ${className}`}
      aria-hidden="true"
    >
      <canvas ref={canvasRef} className="wave-canvas" />
    </div>
  );
};

export default WaveBackground;
