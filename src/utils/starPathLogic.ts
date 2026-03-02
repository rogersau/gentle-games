import { StarPathCollectible, StarPathPoint } from '../types';

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

export const clampStarPathPoint = (
  point: StarPathPoint,
  width: number,
  height: number,
  padding = 18
): StarPathPoint => ({
  x: clamp(point.x, padding, Math.max(padding, width - padding)),
  y: clamp(point.y, padding, Math.max(padding, height - padding)),
});

export const createStarPathCollectibles = (
  width: number,
  height: number,
  count = 6
): StarPathCollectible[] => {
  const safeCount = Math.max(3, count);
  const xStart = Math.max(28, width * 0.18);
  const xEnd = Math.min(width - 28, width * 0.82);
  const yStart = Math.max(36, height * 0.14);
  const yEnd = Math.min(height - 36, height * 0.84);

  return Array.from({ length: safeCount }, (_, index) => {
    const progress = safeCount === 1 ? 0 : index / (safeCount - 1);
    const wave = Math.sin(progress * Math.PI * 2) * Math.min(28, width * 0.06);
    return {
      id: `star-path-item-${index}`,
      x: xStart + (xEnd - xStart) * progress + wave,
      y: yEnd - (yEnd - yStart) * progress,
      collected: false,
    };
  });
};

export const collectStarPathItems = (
  items: StarPathCollectible[],
  point: StarPathPoint,
  radius = 34
): { items: StarPathCollectible[]; collectedNow: number } => {
  let collectedNow = 0;
  const next = items.map((item) => {
    if (item.collected) return item;
    const distance = Math.hypot(item.x - point.x, item.y - point.y);
    if (distance <= radius) {
      collectedNow += 1;
      return { ...item, collected: true };
    }
    return item;
  });
  return { items: next, collectedNow };
};

export const applyStarPathTilt = (
  point: StarPathPoint,
  tiltX: number,
  tiltY: number,
  speed: number,
  width: number,
  height: number
): StarPathPoint => {
  const next = {
    x: point.x + tiltX * speed,
    y: point.y + tiltY * speed,
  };
  return clampStarPathPoint(next, width, height);
};

