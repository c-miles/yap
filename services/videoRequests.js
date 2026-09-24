const MAX_REQUESTED_HEIGHT = 2160;

export function normalizeRequestedHeight(value) {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  return Math.min(MAX_REQUESTED_HEIGHT, Math.max(0, Math.round(value)));
}
