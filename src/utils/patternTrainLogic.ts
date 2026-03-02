import { Difficulty, PATTERN_TRAIN_EMOJIS, PatternTrainRound } from '../types';

const shuffle = <T,>(items: T[], rng: () => number): T[] => {
  const next = [...items];
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }
  return next;
};

const getPatternTemplate = (difficulty: Difficulty): { label: string; indexes: number[] } => {
  if (difficulty === 'easy') {
    return { label: 'AB pattern', indexes: [0, 1, 0, 1] };
  }
  if (difficulty === 'medium') {
    return { label: 'ABC pattern', indexes: [0, 1, 2, 0, 1, 2] };
  }
  return { label: 'AABB pattern', indexes: [0, 0, 1, 1, 0, 0, 1, 1] };
};

export const generatePatternTrainRound = (
  difficulty: Difficulty,
  rng: () => number = Math.random
): PatternTrainRound => {
  const { label, indexes } = getPatternTemplate(difficulty);
  const tokenCount = Math.max(...indexes) + 1;
  const tokens = shuffle(PATTERN_TRAIN_EMOJIS, rng).slice(0, tokenCount);
  const sequence = indexes.map((index) => tokens[index]);

  const answerIndex = sequence.length - 1;
  const answer = sequence[answerIndex];
  const display = sequence.map((token, index) => (index === answerIndex ? '❔' : token));

  const distractors = shuffle(PATTERN_TRAIN_EMOJIS.filter((emoji) => emoji !== answer), rng).slice(0, 3);
  const choices = shuffle([answer, ...distractors], rng);

  return {
    sequence,
    display,
    choices,
    answer,
    patternLabel: label,
  };
};

export const isPatternTrainChoiceCorrect = (round: PatternTrainRound, choice: string): boolean =>
  round.answer === choice;

