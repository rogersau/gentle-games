import { Difficulty, PATTERN_TRAIN_EMOJIS, PatternTrainRound } from '../types';

const shuffle = <T>(items: T[], rng: () => number): T[] => {
  const next = [...items];
  for (let index = next.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(rng() * (index + 1));
    [next[index], next[swapIndex]] = [next[swapIndex], next[index]];
  }
  return next;
};

export interface PatternTemplate {
  id: string;
  label: string;
  indexes: number[];
  unitLength: number;
  displayLength: number;
}

const PATTERN_POOLS: Record<Difficulty, PatternTemplate[]> = {
  easy: [{ id: 'ab', label: 'AB pattern', indexes: [0, 1, 0, 1], unitLength: 2, displayLength: 4 }],
  medium: [
    { id: 'abc', label: 'ABC pattern', indexes: [0, 1, 2, 0, 1], unitLength: 3, displayLength: 5 },
    { id: 'aab', label: 'AAB pattern', indexes: [0, 0, 1, 0, 0], unitLength: 3, displayLength: 5 },
    { id: 'abb', label: 'ABB pattern', indexes: [0, 1, 1, 0, 1], unitLength: 3, displayLength: 5 },
  ],
  hard: [
    {
      id: 'aabb',
      label: 'AABB pattern',
      indexes: [0, 0, 1, 1, 0, 0],
      unitLength: 4,
      displayLength: 6,
    },
    {
      id: 'abba',
      label: 'ABBA pattern',
      indexes: [0, 1, 1, 0, 0, 1],
      unitLength: 4,
      displayLength: 6,
    },
    {
      id: 'abcb',
      label: 'ABCB pattern',
      indexes: [0, 1, 2, 1, 0, 1],
      unitLength: 4,
      displayLength: 6,
    },
  ],
};

const CHOICE_COUNTS: Record<Difficulty, number> = { easy: 2, medium: 3, hard: 4 };

export interface TrainCarriage {
  emoji: string;
  isMissing: boolean;
}

export interface TrainPattern {
  carriages: TrainCarriage[];
  answer: string;
  choices: string[];
  patternLabel: string;
  repeatUnit: string[];
  templateId: string;
  missingIndex: number;
  difficulty: Difficulty;
}

const getRandomPatternTemplate = (difficulty: Difficulty, rng: () => number): PatternTemplate => {
  const pool = PATTERN_POOLS[difficulty];
  return pool[Math.min(pool.length - 1, Math.floor(rng() * pool.length))];
};

const getMissingIndex = (template: PatternTemplate, rng: () => number): number => {
  // Keep the first symbol visible, while allowing middle positions to be tested.
  const positions = Array.from({ length: template.displayLength - 1 }, (_, index) => index + 1);
  return positions[Math.min(positions.length - 1, Math.floor(rng() * positions.length))];
};

const chooseTokens = (
  tokenCount: number,
  rng: () => number,
  excludedTokens: string[] = [],
): string[] => {
  const available = PATTERN_TRAIN_EMOJIS.filter((emoji) => !excludedTokens.includes(emoji));
  return shuffle(available, rng).slice(0, tokenCount);
};

const createPattern = (
  difficulty: Difficulty,
  template: PatternTemplate,
  rng: () => number,
  excludedTokens: string[] = [],
): TrainPattern => {
  const tokenCount = Math.max(...template.indexes) + 1;
  const tokens = chooseTokens(tokenCount, rng, excludedTokens);
  const sequence = template.indexes.map((index) => tokens[index]);
  const missingIndex = getMissingIndex(template, rng);
  const answer = sequence[missingIndex];
  const distractors = shuffle(
    PATTERN_TRAIN_EMOJIS.filter((emoji) => emoji !== answer),
    rng,
  ).slice(0, CHOICE_COUNTS[difficulty] - 1);

  return {
    carriages: sequence.map((emoji, index) => ({ emoji, isMissing: index === missingIndex })),
    answer,
    choices: shuffle([answer, ...distractors], rng),
    patternLabel: template.label,
    repeatUnit: template.indexes.slice(0, template.unitLength).map((index) => tokens[index]),
    templateId: template.id,
    missingIndex,
    difficulty,
  };
};

export const generateTrainPattern = (
  difficulty: Difficulty,
  rng: () => number = Math.random,
): TrainPattern => createPattern(difficulty, getRandomPatternTemplate(difficulty, rng), rng);

/** Reuses the same rule while changing every symbol for a transfer example. */
export const generateTransferPattern = (
  pattern: TrainPattern,
  rng: () => number = Math.random,
): TrainPattern => {
  const template = PATTERN_POOLS[pattern.difficulty].find(({ id }) => id === pattern.templateId);
  if (!template) return generateTrainPattern(pattern.difficulty, rng);
  return createPattern(pattern.difficulty, template, rng, pattern.repeatUnit);
};

export const isTrainChoiceCorrect = (pattern: TrainPattern, choice: string): boolean =>
  pattern.answer === choice;

// Kept as a small adapter for callers that still consume the original round shape.
export const generatePatternTrainRound = (
  difficulty: Difficulty,
  rng: () => number = Math.random,
): PatternTrainRound => {
  const pattern = generateTrainPattern(difficulty, rng);
  return {
    sequence: pattern.carriages.map((carriage) => carriage.emoji),
    display: pattern.carriages.map((carriage) => (carriage.isMissing ? '❔' : carriage.emoji)),
    choices: pattern.choices,
    answer: pattern.answer,
    patternLabel: pattern.patternLabel,
  };
};

export const isPatternTrainChoiceCorrect = (round: PatternTrainRound, choice: string): boolean =>
  round.answer === choice;
