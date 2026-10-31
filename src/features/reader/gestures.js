export function getSwipeDirection({ dx, dy, duration, minDistance = 48, maxDuration = 900, axisRatio = 1.25 }) {
  if (![dx, dy, duration].every(Number.isFinite)) return null;
  if (Math.abs(dx) < minDistance || Math.abs(dx) < Math.abs(dy) * axisRatio || duration > maxDuration) {
    return null;
  }
  return dx < 0 ? 'next' : 'prev';
}
