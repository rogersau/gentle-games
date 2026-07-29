import type { GameId } from './registry';

export type GameMode = 'sensory-regulation' | 'creative-play' | 'guided-practice';

export interface GameOutcomeDefinition {
  mode: GameMode;
  immediateTarget: string | null;
  completionMeaning: string;
  prohibitedClaims: readonly string[];
  recordPerformance: boolean;
  usabilityIndicators: readonly string[];
  accessibilityAndSensoryAssumptions: readonly string[];
}

const NO_THERAPY_CLAIMS = [
  'therapy or treatment',
  'generalised developmental improvement',
] as const;

export const GAME_OUTCOMES = {
  'memory-snap': {
    mode: 'guided-practice',
    immediateTarget: 'Remember and relocate visual items within the current board.',
    completionMeaning: 'All pairs on the current board have been found.',
    prohibitedClaims: NO_THERAPY_CLAIMS,
    recordPerformance: true,
    usabilityIndicators: ['Can start a board', 'Can reveal and match cards', 'Can leave freely'],
    accessibilityAndSensoryAssumptions: ['Cards have spoken labels', 'Counters are optional'],
  },
  drawing: {
    mode: 'creative-play',
    immediateTarget: null,
    completionMeaning: 'The child decides when their exploratory mark-making is complete.',
    prohibitedClaims: [...NO_THERAPY_CLAIMS, 'creative quality or correctness'],
    recordPerformance: false,
    usabilityIndicators: ['Can choose a tool', 'Can make and undo marks', 'Can clear deliberately'],
    accessibilityAndSensoryAssumptions: ['Tools are labelled', 'No correct answer is implied'],
  },
  'glitter-fall': {
    mode: 'sensory-regulation',
    immediateTarget: null,
    completionMeaning: 'The child controls the exploration and decides when to stop.',
    prohibitedClaims: [...NO_THERAPY_CLAIMS, 'calming or regulation outcome'],
    recordPerformance: false,
    usabilityIndicators: ['Can add, move, and clear glitter', 'Can leave freely'],
    accessibilityAndSensoryAssumptions: [
      'Reduced motion is respected',
      'Motion is child-controlled',
    ],
  },
  'bubble-pop': {
    mode: 'sensory-regulation',
    immediateTarget: 'Explore immediate cause and effect by activating bubbles.',
    completionMeaning: 'There is no required completion state in free play.',
    prohibitedClaims: [...NO_THERAPY_CLAIMS, 'attention or motor improvement'],
    recordPerformance: false,
    usabilityIndicators: ['Can activate a bubble', 'Can use stationary input'],
    accessibilityAndSensoryAssumptions: ['Stationary bubbles are available', 'Sound is optional'],
  },
  'category-match': {
    mode: 'guided-practice',
    immediateTarget: 'Sort an item by the explicitly stated sky, land, or ocean rule.',
    completionMeaning: 'The child applies the current sorting rule to the presented item.',
    prohibitedClaims: [...NO_THERAPY_CLAIMS, 'general reasoning improvement'],
    recordPerformance: true,
    usabilityIndicators: ['Can replay the rule', 'Can sort without dragging', 'Can leave freely'],
    accessibilityAndSensoryAssumptions: ['Tap input supplements dragging', 'Feedback is neutral'],
  },
  'keepy-uppy': {
    mode: 'sensory-regulation',
    immediateTarget: 'Track a balloon and choose when to tap it within the game.',
    completionMeaning: 'There is no required score or completion state.',
    prohibitedClaims: [...NO_THERAPY_CLAIMS, 'coordination improvement'],
    recordPerformance: false,
    usabilityIndicators: ['Can lift a balloon', 'Can add a balloon', 'Can leave freely'],
    accessibilityAndSensoryAssumptions: ['Gentle lift is the default', 'Counters are optional'],
  },
  'breathing-garden': {
    mode: 'sensory-regulation',
    immediateTarget: 'Offer an optional visual pacing rhythm.',
    completionMeaning: 'The child may follow, pause, reset, or leave the visual rhythm.',
    prohibitedClaims: [...NO_THERAPY_CLAIMS, 'breathing compliance', 'anxiety reduction'],
    recordPerformance: false,
    usabilityIndicators: ['Can perceive the phase', 'Can reset or leave freely'],
    accessibilityAndSensoryAssumptions: [
      'The phase is available without motion',
      'Music is optional',
    ],
  },
  'pattern-train': {
    mode: 'guided-practice',
    immediateTarget: 'Recognise and apply the current repeating rule to the missing position.',
    completionMeaning: 'The child completes the corrected response for the current pattern.',
    prohibitedClaims: [...NO_THERAPY_CLAIMS, 'general intelligence improvement'],
    recordPerformance: true,
    usabilityIndicators: [
      'Can identify the rule',
      'Can answer without dragging',
      'Can skip or leave',
    ],
    accessibilityAndSensoryAssumptions: ['Patterns have text alternatives', 'No forced timer'],
  },
  'number-picnic': {
    mode: 'guided-practice',
    immediateTarget: 'Link one item to each count and the requested quantity.',
    completionMeaning: 'The basket contains exactly the requested quantity.',
    prohibitedClaims: [...NO_THERAPY_CLAIMS, 'general mathematics improvement'],
    recordPerformance: true,
    usabilityIndicators: ['Can add and remove items', 'Can complete without dragging'],
    accessibilityAndSensoryAssumptions: ['Tap input supplements dragging', 'No forced timer'],
  },
} as const satisfies Record<GameId, GameOutcomeDefinition>;
