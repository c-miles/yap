interface GridLayout {
  cols: number;
  rows: number;
  tileWidth: number;
  tileHeight: number;
}

const TILE_ASPECT_WIDE = 16 / 9;
const TILE_ASPECT_NARROW = 1;
const NARROW_BREAKPOINT_PX = 640;

// 16:9 on roomy landscape containers; square on narrow or portrait ones so a
// phone doesn't get short 16:9 strips with dead space above and below.
export function chooseAspectRatio(containerWidth: number, containerHeight: number): number {
  if (containerWidth < NARROW_BREAKPOINT_PX || containerHeight > containerWidth) {
    return TILE_ASPECT_NARROW;
  }
  return TILE_ASPECT_WIDE;
}

// tries every column count and keeps the biggest tile. on a landscape (or square)
// container 2+ tiles never stack in one column
export function computeGridLayout(
  containerWidth: number,
  containerHeight: number,
  count: number,
  aspectRatio: number,
  gap: number,
  maxTileWidth: number
): GridLayout {
  const minCols = count > 1 && containerWidth >= containerHeight ? 2 : 1;
  let best: GridLayout = { cols: minCols, rows: Math.ceil(count / minCols), tileWidth: 0, tileHeight: 0 };
  let bestArea = -1;

  for (let cols = minCols; cols <= count; cols++) {
    const rows = Math.ceil(count / cols);
    const availW = (containerWidth - gap * (cols - 1)) / cols;
    const availH = (containerHeight - gap * (rows - 1)) / rows;

    const tileWidth = Math.min(availW, availH * aspectRatio, maxTileWidth);
    if (tileWidth <= 0) continue;
    const tileHeight = tileWidth / aspectRatio;
    const area = tileWidth * tileHeight;

    // maxTileWidth can cap two layouts to the same size; landscape then prefers side by side
    const breaksTie = area === bestArea && cols > best.cols && containerWidth >= containerHeight;
    if (area > bestArea || breaksTie) {
      bestArea = area;
      best = { cols, rows, tileWidth: Math.floor(tileWidth), tileHeight: Math.floor(tileHeight) };
    }
  }

  return best;
}
