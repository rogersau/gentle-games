import {
  generateNumberPicnicPrompt,
  getNumberPicnicMaxCount,
  isNumberPicnicPromptComplete,
  updateNumberPicnicCount,
} from './numberPicnicLogic';

describe('numberPicnicLogic', () => {
  it('returns max count bands by difficulty', () => {
    expect(getNumberPicnicMaxCount('easy')).toBe(5);
    expect(getNumberPicnicMaxCount('medium')).toBe(8);
    expect(getNumberPicnicMaxCount('hard')).toBe(10);
  });

  it('generates prompt count inside difficulty range', () => {
    const prompt = generateNumberPicnicPrompt('medium', () => 0.5);
    expect(prompt.targetCount).toBeGreaterThanOrEqual(1);
    expect(prompt.targetCount).toBeLessThanOrEqual(8);
  });

  it('updates basket count with clamping and completion check', () => {
    expect(updateNumberPicnicCount(0, -1)).toBe(0);
    expect(updateNumberPicnicCount(11, 4)).toBe(12);
    const prompt = { itemEmoji: '🍎', itemName: 'apples', targetCount: 4 };
    expect(isNumberPicnicPromptComplete(4, prompt)).toBe(true);
    expect(isNumberPicnicPromptComplete(3, prompt)).toBe(false);
  });
});

