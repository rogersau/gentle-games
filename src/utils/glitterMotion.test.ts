import { getMotionForce, getShakeStrength, shouldTriggerShake } from './glitterMotion';

describe('glitterMotion', () => {
  it('converts accelerometer reading to simulation force', () => {
    expect(getMotionForce({ x: 0.5, y: -0.25, z: 1 })).toEqual({ x: 5, y: -2.5 });
  });

  it('calculates shake strength from acceleration magnitude', () => {
    expect(getShakeStrength({ x: 0, y: 0, z: 1 })).toBeCloseTo(0);
    expect(getShakeStrength({ x: 2, y: 0, z: 1 })).toBeGreaterThan(0.9);
  });

  it('uses threshold and cooldown for shake triggering', () => {
    const reading = { x: 2, y: 0, z: 1 };
    expect(shouldTriggerShake(reading, 1000, 1200)).toBe(false);
    expect(shouldTriggerShake(reading, 1000, 1801)).toBe(true);
    expect(shouldTriggerShake(reading, 1000, 1801, { threshold: 2 })).toBe(false);
  });
});
