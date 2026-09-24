import React, { useEffect, useRef } from "react";
import Noise from "../../utils/perlin";
import { createCursor, createField, drawField, moveCursor, stepField } from "./waves";
import "./WaveBackground.css";

const WaveBackground: React.FC<{ className?: string }> = ({ className = "" }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const container = containerRef.current!;
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const noise = new Noise(Math.random());
    const cursor = createCursor();
    const showCursorDot = !window.matchMedia("(hover: none) and (pointer: coarse)").matches;
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let field = createField(0, 0);
    let width = 0;
    let height = 0;
    let frame = 0;

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
      draw(time);
      if (showCursorDot) {
        container.style.setProperty("--x", `${cursor.smoothX}px`);
        container.style.setProperty("--y", `${cursor.smoothY}px`);
      }
    };

    const followPointer = (clientX: number, clientY: number) => {
      const rect = container.getBoundingClientRect();
      moveCursor(cursor, clientX - rect.left, clientY - rect.top);
    };
    const onMouseMove = (e: MouseEvent) => followPointer(e.clientX, e.clientY);
    const onTouchMove = (e: TouchEvent) => followPointer(e.touches[0].clientX, e.touches[0].clientY);

    const observer = new ResizeObserver(resize);
    observer.observe(container);
    resize();

    if (!still) {
      frame = requestAnimationFrame(tick);
      window.addEventListener("mousemove", onMouseMove);
      window.addEventListener("touchmove", onTouchMove, { passive: true });
    }

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("touchmove", onTouchMove);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={`wave-background ${className}`}
      aria-hidden="true"
    >
      <canvas ref={canvasRef} className="wave-canvas" />
    </div>
  );
};

export default WaveBackground;
