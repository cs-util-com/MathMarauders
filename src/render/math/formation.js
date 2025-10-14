const DEFAULT_SPACING = 1.25;

/**
 * Compute a compact grid formation centered around the origin.
 * Returns an array of { x, y, z } positions sorted from front to back.
 * The formation expands smoothly as counts increase so the camera framing stays predictable.
 */
export function computeFormationPositions(count, { spacing = DEFAULT_SPACING } = {}) {
  if (!Number.isFinite(count) || count <= 0) {
    return [];
  }

  const safeCount = Math.floor(count);
  const columns = Math.ceil(Math.sqrt(safeCount));
  const rows = Math.ceil(safeCount / columns);
  const positions = [];

  for (let index = 0; index < safeCount; index += 1) {
    const row = Math.floor(index / columns);
    const column = index % columns;
    const offsetX = (column - (columns - 1) / 2) * spacing;
    const offsetZ = -row * spacing;
    positions.push({ x: offsetX, y: 0, z: offsetZ });
  }

  return positions;
}

/**
 * Applies a lateral steering offset to a set of formation positions.
 * Steering values in [-1, 1] move the formation across the lane while respecting soft bounds.
 */
export function applySteerOffset(positions, steer, laneHalfWidth = 5) {
  if (!positions || positions.length === 0) {
    return positions;
  }
  const clamped = Math.max(-1, Math.min(1, steer));
  const offset = clamped * (laneHalfWidth * 0.6);
  return positions.map((pos) => ({ ...pos, x: pos.x + offset }));
}
