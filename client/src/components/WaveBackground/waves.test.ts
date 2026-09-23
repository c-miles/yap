import Noise from "../../utils/perlin";
import { createCursor, createField, moveCursor, stepField } from "./waves";

const noise = new Noise(0.42);

function runFrames(field: ReturnType<typeof createField>, frames: number, cursor: ReturnType<typeof createCursor> | null) {
  for (let t = 0; t < frames; t++) {
    stepField(field, t * 16, noise, cursor);
  }
}

test("the field overscans the area so no edge ever shows a gap", () => {
  const field = createField(1000, 600);
  const xs = field.flat().map((p) => p.x);
  const ys = field.flat().map((p) => p.y);
  expect(Math.min(...xs)).toBeLessThanOrEqual(-100);
  expect(Math.max(...xs)).toBeGreaterThanOrEqual(1100);
  expect(Math.min(...ys)).toBeLessThan(0);
  expect(Math.max(...ys)).toBeGreaterThan(600);
});

test("a fast cursor pushes nearby points and leaves far ones alone", () => {
  const field = createField(1000, 600);
  const cursor = createCursor();
  moveCursor(cursor, 500, 300);
  for (let t = 0; t < 30; t++) {
    moveCursor(cursor, 500 + (t % 2 === 0 ? 60 : -60), 300);
    stepField(field, t * 16, noise, cursor);
  }

  const points = field.flat();
  const near = points.filter((p) => Math.hypot(p.x - 500, p.y - 300) < 60);
  const far = points.filter((p) => Math.hypot(p.x - 500, p.y - 300) > 400);
  expect(near.some((p) => p.cursorX !== 0 || p.cursorY !== 0)).toBe(true);
  expect(far.every((p) => p.cursorX === 0 && p.cursorY === 0)).toBe(true);
});

test("cursor displacement never goes past 100px", () => {
  const field = createField(1000, 600);
  const cursor = createCursor();
  moveCursor(cursor, 0, 300);
  for (let t = 0; t < 120; t++) {
    moveCursor(cursor, t % 2 === 0 ? 1000 : 0, 300);
    stepField(field, t * 16, noise, cursor);
  }

  const offsets = field.flat().flatMap((p) => [Math.abs(p.cursorX), Math.abs(p.cursorY)]);
  expect(Math.max(...offsets)).toBeLessThanOrEqual(100);
});

test("without a cursor, points only follow the wave", () => {
  const field = createField(1000, 600);
  runFrames(field, 30, null);
  expect(field.flat().every((p) => p.cursorX === 0 && p.cursorY === 0)).toBe(true);
  expect(field.flat().some((p) => p.waveX !== 0 || p.waveY !== 0)).toBe(true);
});
