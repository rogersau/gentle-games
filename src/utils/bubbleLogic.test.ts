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
    const bubbles = ensureMinimumBubbles([], 2, 300, 10, sequenceRng([0.2, 0.4, 0.6]));
    expect(bubbles).toHaveLength(2);
  });

  it('respects max bubble cap while enforcing minimum', () => {
    const bubbles = ensureMinimumBubbles([], 4, 300, 2, sequenceRng([0.1]));
    expect(bubbles).toHaveLength(2);
  });

  it('removes bubbles that leave the bottom of the field', () => {
    const input: Bubble[] = [
      {
        id: 'keep',
        x: 50,
        y: 10,
        radius: 20,
        speed: 30,
        color: '#A8D8EA',
        opacity: 0.5,
      },
      {
        id: 'drop',
        x: 50,
        y: 155,
        radius: 20,
        speed: 30,
        color: '#FFB6C1',
        opacity: 0.5,
      },
    ];

    const result = stepBubbles(input, 1 / 24, 120);
    expect(result.map((bubble) => bubble.id)).toEqual(['keep']);
  });
});

