import { ensureMinimumBubbles, stepBubbles, Bubble } from './bubbleLogic';

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
    const [bubble] = ensureMinimumBubbles([], 1, 300, fieldHeight, 3, sequenceRng([0.5, 0.2, 0.3, 0.4, 0.7]));
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
});
