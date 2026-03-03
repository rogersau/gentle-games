import { Difficulty, PATTERN_TRAIN_EMOJIS, PatternTrainRound } from '../types';

const shuffle = <T,>(items: T[], rng: () => number): T[] => {
  const next = [...items];
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }
  return next;
};

interface PatternTemplate {
  label: string;
  indexes: number[];
  displayLength: number; // How many carriages to show (not counting missing one)
}

const PATTERN_POOLS: Record<Difficulty, PatternTemplate[]> = {
  easy: [
    { label: 'AB pattern', indexes: [0, 1, 0, 1, 0, 1], displayLength: 4 }, // Shows 3 carriages + 1 missing, missing position is randomized
  ],
  medium: [
    { label: 'ABC pattern', indexes: [0, 1, 2, 0, 1, 2, 0, 1, 2], displayLength: 5 }, // Show A, B, C, A, ? (answer is B) - shows one full ABC cycle
    { label: 'AAB pattern', indexes: [0, 0, 1, 0, 0, 1, 0, 0, 1], displayLength: 5 },
    { label: 'ABB pattern', indexes: [0, 1, 1, 0, 1, 1, 0, 1, 1], displayLength: 5 },
  ],
  hard: [
    { label: 'AABB pattern', indexes: [0, 0, 1, 1, 0, 0, 1, 1, 0, 0, 1, 1], displayLength: 6 },
    { label: 'ABBA pattern', indexes: [0, 1, 1, 0, 0, 1, 1, 0, 0, 1, 1, 0], displayLength: 6 },
    { label: 'ABCB pattern', indexes: [0, 1, 2, 1, 0, 1, 2, 1, 0, 1, 2, 1], displayLength: 6 },
  ],
};

const getRandomPatternTemplate = (difficulty: Difficulty, rng: () => number): PatternTemplate => {
  const pool = PATTERN_POOLS[difficulty];
  const index = Math.floor(rng() * pool.length);
  return pool[index];
};

export interface TrainCarriage {
  emoji: string;
  isMissing: boolean;
}

export interface TrainPattern {
  carriages: TrainCarriage[];
  answer: string;
  choices: string[];
  patternLabel: string;
}

export const generateTrainPattern = (
  difficulty: Difficulty,
  rng: () => number = Math.random
): TrainPattern => {
  const template = getRandomPatternTemplate(difficulty, rng);
  const tokenCount = Math.max(...template.indexes) + 1;
  const tokens = shuffle(PATTERN_TRAIN_EMOJIS, rng).slice(0, tokenCount);
  const sequence = template.indexes.map((index) => tokens[index]);
  
  // Create carriages: visible carriages with emojis + missing carriage
  // Note: Engine is separate and has no emoji - only carriages have emojis
  const carriages: TrainCarriage[] = [];
  
  // For easy mode, randomly decide which carriage is missing (3rd or 4th)
  let missingIndex: number;
  if (difficulty === 'easy') {
    // Randomly choose to hide position 2 or 3 (0-indexed: 3rd or 4th carriage)
    missingIndex = Math.floor(rng() * 2) + 2; // Either 2 or 3
  } else {
    // For medium/hard, always make the last position missing
    missingIndex = template.displayLength - 1;
  }
  
  // Build carriages array
  for (let i = 0; i < template.displayLength; i++) {
    if (i < sequence.length) {
      const isMissing = i === missingIndex;
      carriages.push({ 
        emoji: sequence[i], 
        isMissing: isMissing 
      });
    }
  }
  
  // The answer is the item at the missing index
  const answer = sequence[missingIndex];
  
  // Generate choices (answer + 3 distractors)
  const distractors = shuffle(PATTERN_TRAIN_EMOJIS.filter((emoji) => emoji !== answer), rng).slice(0, 3);
  const choices = shuffle([answer, ...distractors], rng);

  return {
    carriages,
    answer,
    choices,
    patternLabel: template.label,
  };
};

export const isTrainChoiceCorrect = (pattern: TrainPattern, choice: string): boolean =>
  pattern.answer === choice;

export const removeWrongChoices = (choices: string[], answer: string, count: number): string[] => {
  const wrongChoices = choices.filter((choice) => choice !== answer);
  const choicesToRemove = wrongChoices.slice(0, count);
  return choices.filter((choice) => !choicesToRemove.includes(choice));
};

// Legacy exports for backwards compatibility
export const generatePatternTrainRound = (
  difficulty: Difficulty,
  rng: () => number = Math.random
): PatternTrainRound => {
  const pattern = generateTrainPattern(difficulty, rng);
  const sequence = pattern.carriages.map(c => c.emoji);
  const display = pattern.carriages.map(c => c.isMissing ? '❔' : c.emoji);
  
  return {
    sequence,
    display,
    choices: pattern.choices,
    answer: pattern.answer,
    patternLabel: pattern.patternLabel,
  };
};

export const isPatternTrainChoiceCorrect = (round: PatternTrainRound, choice: string): boolean =>
  round.answer === choice;
