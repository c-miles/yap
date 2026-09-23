import Noise from "../../utils/perlin";

const X_GAP = 10;
const Y_GAP = 32;

export interface WavePoint {
  x: number;
  y: number;
  waveX: number;
  waveY: number;
  cursorX: number;
  cursorY: number;
  velocityX: number;
  velocityY: number;
}

export type WaveField = WavePoint[][];

export interface Cursor {
  x: number;
  y: number;
  smoothX: number;
  smoothY: number;
  lastX: number;
  lastY: number;
  speed: number;
  angle: number;
  placed: boolean;
}

// vertical lines, padded past every edge so the waves never pull away from the sides
export function createField(width: number, height: number): WaveField {
  const lineCount = Math.ceil((width + 200) / X_GAP);
  const pointCount = Math.ceil((height + 30) / Y_GAP);
  const xStart = (width - X_GAP * lineCount) / 2;
  const yStart = (height - Y_GAP * pointCount) / 2;

  return Array.from({ length: lineCount + 1 }, (_, i) =>
    Array.from({ length: pointCount + 1 }, (_, j) => ({
      x: xStart + X_GAP * i,
      y: yStart + Y_GAP * j,
      waveX: 0,
      waveY: 0,
      cursorX: 0,
      cursorY: 0,
      velocityX: 0,
      velocityY: 0,
    }))
  );
}

export function createCursor(): Cursor {
  return { x: -10, y: 0, smoothX: 0, smoothY: 0, lastX: 0, lastY: 0, speed: 0, angle: 0, placed: false };
}

export function moveCursor(cursor: Cursor, x: number, y: number) {
  cursor.x = x;
  cursor.y = y;
  if (!cursor.placed) {
    cursor.smoothX = cursor.lastX = x;
    cursor.smoothY = cursor.lastY = y;
    cursor.placed = true;
  }
}

function updateCursor(cursor: Cursor) {
  cursor.smoothX += (cursor.x - cursor.smoothX) * 0.1;
  cursor.smoothY += (cursor.y - cursor.smoothY) * 0.1;

  const dx = cursor.x - cursor.lastX;
  const dy = cursor.y - cursor.lastY;
  cursor.speed = Math.min(100, cursor.speed + (Math.hypot(dx, dy) - cursor.speed) * 0.1);
  cursor.angle = Math.atan2(dy, dx);
  cursor.lastX = cursor.x;
  cursor.lastY = cursor.y;
}

function pushByCursor(p: WavePoint, cursor: Cursor) {
  const distance = Math.hypot(p.x - cursor.smoothX, p.y - cursor.smoothY);
  const reach = Math.max(175, cursor.speed);

  if (distance < reach) {
    const force = Math.cos(distance * 0.001) * (1 - distance / reach) * reach * cursor.speed * 0.00065;
    p.velocityX += Math.cos(cursor.angle) * force;
    p.velocityY += Math.sin(cursor.angle) * force;
  }

  p.velocityX = (p.velocityX - p.cursorX * 0.005) * 0.925;
  p.velocityY = (p.velocityY - p.cursorY * 0.005) * 0.925;
  p.cursorX = Math.min(100, Math.max(-100, p.cursorX + p.velocityX * 2));
  p.cursorY = Math.min(100, Math.max(-100, p.cursorY + p.velocityY * 2));
}

export function stepField(field: WaveField, time: number, noise: Noise, cursor: Cursor | null) {
  if (cursor) {
    updateCursor(cursor);
  }

  for (const line of field) {
    for (const p of line) {
      const angle = noise.perlin2((p.x + time * 0.0125) * 0.002, (p.y + time * 0.005) * 0.0015) * 12;
      p.waveX = Math.cos(angle) * 32;
      p.waveY = Math.sin(angle) * 16;

      if (cursor) {
        pushByCursor(p, cursor);
      }
    }
  }
}

export function drawField(ctx: CanvasRenderingContext2D, field: WaveField, width: number, height: number) {
  ctx.clearRect(0, 0, width, height);
  ctx.beginPath();

  for (const line of field) {
    const [first] = line;
    ctx.moveTo(first.x + first.waveX, first.y + first.waveY);
    // the last point skips the cursor push so each line stays pinned at the bottom
    line.forEach((p, i) => {
      const pinned = i === line.length - 1;
      ctx.lineTo(p.x + p.waveX + (pinned ? 0 : p.cursorX), p.y + p.waveY + (pinned ? 0 : p.cursorY));
    });
  }

  ctx.stroke();
}
