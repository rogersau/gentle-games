export interface MotionReading {
  x: number;
  y: number;
  z: number;
}

export interface ShakeDetectionOptions {
  threshold?: number;
  cooldownMs?: number;
}

export const getMotionForce = (reading: MotionReading) => ({
  x: reading.x * 10,
  y: reading.y * 10,
});

export const getShakeStrength = (reading: MotionReading): number => {
  const magnitude = Math.sqrt(
    reading.x * reading.x + reading.y * reading.y + reading.z * reading.z
  );
  return Math.abs(magnitude - 1);
};

export const shouldTriggerShake = (
  reading: MotionReading,
  lastShakeAt: number,
  now: number,
  options: ShakeDetectionOptions = {}
): boolean => {
  const threshold = options.threshold ?? 0.9;
  const cooldownMs = options.cooldownMs ?? 700;
  if (now - lastShakeAt < cooldownMs) return false;
  return getShakeStrength(reading) >= threshold;
};
