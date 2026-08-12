import { computeGridLayout, chooseAspectRatio } from "./gridLayout";

const R = 16 / 9;

test("single tile is one column, respects the aspect ratio, and fits the container", () => {
  const l = computeGridLayout(1280, 720, 1, R, 12, Infinity);
  expect(l.cols).toBe(1);
  expect(l.rows).toBe(1);
  expect(l.tileWidth / l.tileHeight).toBeCloseTo(R, 1);
  expect(l.tileWidth).toBeLessThanOrEqual(1280);
  expect(l.tileHeight).toBeLessThanOrEqual(720);
});

test("max tile width caps a lone tile so it doesn't dominate a big monitor", () => {
  const l = computeGridLayout(2560, 1440, 1, R, 12, 960);
  expect(l.tileWidth).toBeLessThanOrEqual(960);
  expect(l.tileWidth / l.tileHeight).toBeCloseTo(R, 1);
});

test("two tiles on a wide container go side by side (landscape), not stacked", () => {
  const l = computeGridLayout(1280, 720, 2, R, 12, Infinity);
  expect(l.cols).toBe(2);
  expect(l.rows).toBe(1);
  // each tile stays 16:9 (landscape), not a tall portrait
  expect(l.tileWidth).toBeGreaterThan(l.tileHeight);
});

test("four tiles form a 2x2 grid", () => {
  const l = computeGridLayout(1280, 720, 4, R, 12, Infinity);
  expect(l.cols).toBe(2);
  expect(l.rows).toBe(2);
});

test("every arrangement (1-6) keeps the ratio and fits the container both ways", () => {
  for (let n = 1; n <= 6; n++) {
    const l = computeGridLayout(1000, 800, n, R, 12, Infinity);
    expect(l.tileWidth / l.tileHeight).toBeCloseTo(R, 1);
    expect(l.cols * l.tileWidth + (l.cols - 1) * 12).toBeLessThanOrEqual(1000 + 1);
    expect(l.rows * l.tileHeight + (l.rows - 1) * 12).toBeLessThanOrEqual(800 + 1);
    expect(l.cols * l.rows).toBeGreaterThanOrEqual(n);
  }
});

test("two capped tiles on a large landscape monitor sit side by side, not stacked", () => {
  // At 1440p the 960px cap makes 1-col and 2-col equal area; the tie must
  // resolve to side-by-side on a landscape container.
  const l = computeGridLayout(2560, 1440, 2, R, 12, 960);
  expect(l.cols).toBe(2);
  expect(l.rows).toBe(1);
});

test("the chosen arrangement maximizes tile area vs the alternatives", () => {
  // On a wide-short container, 3 people should prefer 3 columns over 1 or 2.
  const l = computeGridLayout(1500, 400, 3, R, 12, Infinity);
  expect(l.cols).toBe(3);
});

test("chooseAspectRatio: wide container is 16:9, narrow/portrait is square", () => {
  expect(chooseAspectRatio(1280, 720)).toBeCloseTo(16 / 9, 2);
  expect(chooseAspectRatio(390, 800)).toBe(1); // portrait phone
  expect(chooseAspectRatio(500, 400)).toBe(1); // below the narrow breakpoint
});
