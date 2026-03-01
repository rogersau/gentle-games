import { Difficulty, LETTER_LANTERN_ALPHABET, LetterLanternRound } from '../types';

const shuffle = <T,>(items: T[], rng: () => number): T[] => {
  const next = [...items];
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }
  return next;
};

export const getLetterLanternChoiceCount = (difficulty: Difficulty): number => {
  if (difficulty === 'easy') return 6;
  if (difficulty === 'medium') return 8;
  return 10;
};

export const generateLetterLanternRound = (
  difficulty: Difficulty,
  rng: () => number = Math.random
): LetterLanternRound => {
  const targetLetter = LETTER_LANTERN_ALPHABET[Math.floor(rng() * LETTER_LANTERN_ALPHABET.length)];
  const choiceCount = getLetterLanternChoiceCount(difficulty);
  const distractors = shuffle(
    LETTER_LANTERN_ALPHABET.filter((letter) => letter !== targetLetter),
    rng
  ).slice(0, Math.max(0, choiceCount - 1));
  const choices = shuffle([targetLetter, ...distractors], rng);

  return {
    targetLetter,
    choices,
  };
};

export const isLetterLanternMatch = (round: LetterLanternRound, selectedLetter: string): boolean =>
  round.targetLetter === selectedLetter;

