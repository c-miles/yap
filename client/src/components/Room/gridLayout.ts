export interface GridLayout {
  cols: number;
  rows: number;
  tileWidth: number;
  tileHeight: number;
}

const TILE_ASPECT_WIDE = 16 / 9;
const TILE_ASPECT_NARROW = 1; // square
const NARROW_BREAKPOINT_PX = 640;

// 16:9 on roomy landscape containers; square on narrow or portrait ones so a
// phone doesn't get short 16:9 strips with dead space above and below.
export function chooseAspectRatio(containerWidth: number, containerHeight: number): number {
  if (containerWidth < NARROW_BREAKPOINT_PX || containerHeight > containerWidth) {
    return TILE_ASPECT_NARROW;
  }
  return TILE_ASPECT_WIDE;
}

// Largest fixed-ratio tile that fits `count` tiles in the container. Tries each
// column count and keeps the arrangement with the biggest tile area (the Jitsi
// tile-view approach). Container-shape responsiveness falls out for free: a
// wide container makes more columns win, a tall one makes more rows win.
export function computeGridLayout(
  containerWidth: number,
  containerHeight: number,
  count: number,
  aspectRatio: number,
  gap: number,
  maxTileWidth: number
): GridLayout {
  let best: GridLayout = { cols: 1, rows: count, tileWidth: 0, tileHeight: 0 };
  let bestArea = -1;

  for (let cols = 1; cols <= count; cols++) {
    const rows = Math.ceil(count / cols);
    const availW = (containerWidth - gap * (cols - 1)) / cols;
    const availH = (containerHeight - gap * (rows - 1)) / rows;

    // The tile is the largest aspect-ratio box fitting the cell, then capped.
    const tileWidth = Math.min(availW, availH * aspectRatio, maxTileWidth);
    if (tileWidth <= 0) continue;
    const tileHeight = tileWidth / aspectRatio;
    const area = tileWidth * tileHeight;

    // Maximize tile area. On an exact tie — e.g. maxTileWidth caps two
    // arrangements to the same size — prefer more columns on a landscape
    // container so two people sit side by side rather than stacked.
    const breaksTie = area === bestArea && cols > best.cols && containerWidth >= containerHeight;
    if (area > bestArea || breaksTie) {
      bestArea = area;
      best = { cols, rows, tileWidth: Math.floor(tileWidth), tileHeight: Math.floor(tileHeight) };
    }
  }

  return best;
}
