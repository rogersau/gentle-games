import {
  ensureMinimumBubbles,
  stepBubbles,
  spawnBubbles,
  Bubble,
  createBubble,
  createGuidedRound,
  evaluateGuidedResponse,
  getBubbleDirection,
  getBubbleSize,
  resolveBubbleSensoryConfig,
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
  const guidedBubble = (overrides: Partial<Bubble> = {}): Bubble => ({
    id: 'guided',
    x: 40,
    y: 80,
    radius: 24,
    targetRadius: 24,
    growthPerSecond: 0,
    speed: 20,
    color: '#A8D8EA',
    opacity: 0.5,
    ...overrides,
  });

  it('resolves a complete local sensory profile without shared settings', () => {
    expect(
      resolveBubbleSensoryConfig({ motion: 'floating', speed: 'fast', size: 'large' }),
    ).toEqual({
      motion: 'floating',
      speed: 'fast',
      density: 'sparse',
      size: 'large',
    });
  });

  it('creates deterministic colour, size, and direction prompts from bubbles', () => {
    const bubbles = [
      guidedBubble({ id: 'left-small', x: 40, targetRadius: 24 }),
      guidedBubble({ id: 'right-large', x: 260, targetRadius: 44, color: '#FFB6C1' }),
    ];

    expect(createGuidedRound('colour', bubbles, 300, () => 0).targetColour).toBe('#A8D8EA');
    expect(createGuidedRound('size', bubbles, 300, () => 0.75)).toMatchObject({
      targetSize: 'large',
      targetSizeGoal: 'biggest',
      targetRadius: 44,
    });
    expect(createGuidedRound('direction', bubbles, 300, () => 0.75).targetDirection).toBe('right');
    expect(getBubbleSize(bubbles[0])).toBe('small');
    expect(getBubbleDirection(bubbles[1], 300)).toBe('right');
  });

  it('rejects wrong guided responses neutrally without changing the round', () => {
    const round = { concept: 'colour' as const, targetColour: '#A8D8EA', fieldWidth: 300 };
    const response = evaluateGuidedResponse(round, guidedBubble({ color: '#FFB6C1' }), 0);

    expect(response).toEqual({ accepted: false, completed: false, reason: 'wrong', nextCount: 0 });
  });

  it('accepts the matching response for colour, size, and left/right concepts', () => {
    const bubble = guidedBubble({ x: 240, targetRadius: 44, color: '#FFB6C1' });

    expect(
      evaluateGuidedResponse(
        { concept: 'colour', targetColour: '#FFB6C1', fieldWidth: 300 },
        bubble,
        0,
      ).accepted,
    ).toBe(true);
    expect(
      evaluateGuidedResponse({ concept: 'size', targetSize: 'large', fieldWidth: 300 }, bubble, 0)
        .accepted,
    ).toBe(true);
    expect(
      evaluateGuidedResponse(
        { concept: 'direction', targetDirection: 'right', fieldWidth: 300 },
        bubble,
        0,
      ).accepted,
    ).toBe(true);
  });

  it('locks an exact count after the target and never resets the count', () => {
    const round = { concept: 'count' as const, targetCount: 2, fieldWidth: 300 };
    const first = evaluateGuidedResponse(round, guidedBubble(), 0);
    const second = evaluateGuidedResponse(round, guidedBubble({ id: 'second' }), first.nextCount);
    const locked = evaluateGuidedResponse(round, guidedBubble({ id: 'third' }), second.nextCount);

    expect(first.accepted).toBe(true);
    expect(second).toMatchObject({ accepted: true, completed: true, nextCount: 2 });
    expect(locked).toEqual({ accepted: false, completed: true, reason: 'locked', nextCount: 2 });
  });

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
