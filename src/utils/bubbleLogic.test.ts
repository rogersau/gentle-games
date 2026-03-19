import {
  ensureMinimumBubbles,
  stepBubbles,
  spawnBubbles,
  Bubble,
  createBubble,
} from './bubbleLogic';

const sequenceRng = (values: number[]) => {
  let index = 0;
  return () => {
    const value = values[index % values.length];
    index += 1;
    return value;
  };
};

describe('bubbleLogic', () => {
  it('ensures at least the minimum number of bubbles', () => {
    const bubbles = ensureMinimumBubbles([], 2, 300, 400, 10, sequenceRng([0.2, 0.4, 0.6]));
    expect(bubbles).toHaveLength(2);
  });

  it('respects max bubble cap while enforcing minimum', () => {
    const bubbles = ensureMinimumBubbles([], 4, 300, 400, 2, sequenceRng([0.1]));
    expect(bubbles).toHaveLength(2);
  });

  it('can spawn a bubble lower in the field with a smaller initial size', () => {
    const fieldHeight = 400;
    const [bubble] = ensureMinimumBubbles(
      [],
      1,
      300,
      fieldHeight,
      3,
      sequenceRng([0.5, 0.2, 0.3, 0.4, 0.7]),
    );
    expect(bubble.y).toBeGreaterThanOrEqual(fieldHeight * 0.22);
    expect(bubble.y).toBeLessThanOrEqual(fieldHeight * 0.62);
    expect(bubble.radius).toBeLessThan(bubble.targetRadius);
    expect(bubble.growthPerSecond).toBeGreaterThan(0);
  });

  it('removes bubbles that leave the bottom of the field', () => {
    const input: Bubble[] = [
      {
        id: 'keep',
        x: 50,
        y: 10,
        radius: 20,
        targetRadius: 20,
        growthPerSecond: 0,
        speed: 30,
        color: '#A8D8EA',
        opacity: 0.5,
      },
      {
        id: 'drop',
        x: 50,
        y: 155,
        radius: 20,
        targetRadius: 20,
        growthPerSecond: 0,
        speed: 30,
        color: '#FFB6C1',
        opacity: 0.5,
      },
    ];

    const result = stepBubbles(input, 1 / 24, 120);
    expect(result.map((bubble) => bubble.id)).toEqual(['keep']);
  });

  it('grows bubble radius gradually while moving', () => {
    const input: Bubble[] = [
      {
        id: 'growing',
        x: 120,
        y: 120,
        radius: 10,
        targetRadius: 20,
        growthPerSecond: 12,
        speed: 24,
        color: '#A8D8EA',
        opacity: 0.5,
      },
    ];

    const [result] = stepBubbles(input, 1 / 24, 400);
    expect(result.radius).toBeGreaterThan(10);
    expect(result.radius).toBeLessThanOrEqual(20);
    expect(result.y).toBeGreaterThan(120);
  });

  describe('edge cases', () => {
    it('creates bubble that starts from top (non-lower spawn)', () => {
      // rng(0) = 0.5 is the startsLower check (0.5 < 0.35 = false), so it starts from top
      const bubble = createBubble(300, 400, () => 0.5);
      expect(bubble.y).toBeLessThan(0); // Above the screen
      expect(bubble.growthPerSecond).toBe(0); // No growth for top-spawned bubbles
      expect(bubble.radius).toBe(bubble.targetRadius); // Full size immediately
    });

    it('handles negative count in spawnBubbles', () => {
      const existing: Bubble[] = [];
      const result = spawnBubbles(existing, -5, 300, 400, Math.random);
      expect(result).toHaveLength(0);
    });

    it('handles zero count in spawnBubbles', () => {
      const existing: Bubble[] = [];
      const result = spawnBubbles(existing, 0, 300, 400, Math.random);
      expect(result).toHaveLength(0);
    });

    it('handles zero minimum in ensureMinimumBubbles', () => {
      const existing: Bubble[] = [];
      const result = ensureMinimumBubbles(existing, 0, 300, 400, 10, Math.random);
      expect(result).toHaveLength(0);
    });

    it('trims excess bubbles when existing exceeds max', () => {
      const existing: Bubble[] = [
        {
          id: '1',
          x: 10,
          y: 10,
          radius: 20,
          targetRadius: 20,
          growthPerSecond: 0,
          speed: 10,
          color: '#fff',
          opacity: 0.5,
        },
        {
          id: '2',
          x: 20,
          y: 20,
          radius: 20,
          targetRadius: 20,
          growthPerSecond: 0,
          speed: 10,
          color: '#fff',
          opacity: 0.5,
        },
        {
          id: '3',
          x: 30,
          y: 30,
          radius: 20,
          targetRadius: 20,
          growthPerSecond: 0,
          speed: 10,
          color: '#fff',
          opacity: 0.5,
        },
      ];
      const result = ensureMinimumBubbles(existing, 1, 300, 400, 2, Math.random);
      expect(result).toHaveLength(2);
    });

    it('handles negative deltaSeconds in stepBubbles', () => {
      const input: Bubble[] = [
        {
          id: 'test',
          x: 50,
          y: 50,
          radius: 20,
          targetRadius: 20,
          growthPerSecond: 10,
          speed: 30,
          color: '#A8D8EA',
          opacity: 0.5,
        },
      ];

      const [result] = stepBubbles(input, -1, 400);
      expect(result.y).toBe(50); // Should not move with negative delta
      expect(result.radius).toBe(20); // Should not grow
    });

    it('caps deltaSeconds at maximum in stepBubbles', () => {
      const input: Bubble[] = [
        {
          id: 'test',
          x: 50,
          y: 50,
          radius: 20,
          targetRadius: 100,
          growthPerSecond: 1000,
          speed: 1000,
          color: '#A8D8EA',
          opacity: 0.5,
        },
      ];

      const [result] = stepBubbles(input, 10, 400); // Large delta should be capped
      // Should move but not as much as 10 seconds would suggest
      expect(result.y).toBeGreaterThan(50);
      expect(result.y).toBeLessThan(500);
    });

    it('handles bubble exactly at bottom boundary', () => {
      const input: Bubble[] = [
        {
          id: 'atBoundary',
          x: 50,
          y: 420, // y - radius = 400, exactly at boundary
          radius: 20,
          targetRadius: 20,
          growthPerSecond: 0,
          speed: 30,
          color: '#A8D8EA',
          opacity: 0.5,
        },
      ];

      const result = stepBubbles(input, 1 / 24, 400);
      // Bubble at exactly y - radius = height should be filtered out
      expect(result).toHaveLength(0);
    });

    it('handles bubble just above bottom boundary', () => {
      const input: Bubble[] = [
        {
          id: 'justAbove',
          x: 50,
          y: 379, // y - radius = 359 < 400, should be kept
          radius: 20,
          targetRadius: 20,
          growthPerSecond: 0,
          speed: 1, // Very slow
          color: '#A8D8EA',
          opacity: 0.5,
        },
      ];

      const result = stepBubbles(input, 1 / 24, 400);
      expect(result).toHaveLength(1);
    });

    it('spawns multiple bubbles with spawnBubbles', () => {
      const existing: Bubble[] = [];
      const result = spawnBubbles(existing, 3, 300, 400, Math.random);
      expect(result).toHaveLength(3);
    });
  });
});
