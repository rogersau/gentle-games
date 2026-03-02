import { Difficulty, NumberPicnicPrompt, NUMBER_PICNIC_ITEMS } from '../types';

export const getNumberPicnicMaxCount = (difficulty: Difficulty): number => {
  if (difficulty === 'easy') return 5;
  if (difficulty === 'medium') return 8;
  return 10;
};

export const generateNumberPicnicPrompt = (
  difficulty: Difficulty,
  rng: () => number = Math.random
): NumberPicnicPrompt => {
  const item = NUMBER_PICNIC_ITEMS[Math.floor(rng() * NUMBER_PICNIC_ITEMS.length)];
  const max = getNumberPicnicMaxCount(difficulty);
  const targetCount = Math.floor(rng() * max) + 1;

  return {
    itemEmoji: item.emoji,
    itemName: item.name,
    targetCount,
  };
};

export const clampNumberPicnicCount = (count: number): number =>
  Math.max(0, Math.min(12, Math.floor(count)));

export const updateNumberPicnicCount = (currentCount: number, delta: number): number =>
  clampNumberPicnicCount(currentCount + delta);

export const isNumberPicnicPromptComplete = (currentCount: number, prompt: NumberPicnicPrompt): boolean =>
  currentCount === prompt.targetCount;

