import { useState, useCallback, useRef } from 'react';
import { Difficulty } from '../types';
import {
  generateTrainPattern,
  removeWrongChoices,
  TrainPattern,
} from '../utils/patternTrainLogic';

export type TrainPhase = 'entering' | 'waiting' | 'exiting' | 'offscreen';
export type FeedbackType = 'initial' | 'correct' | 'incorrect' | 'reveal';

export interface PatternTrainGameState {
  // Game state
  pattern: TrainPattern | null;
  completedRounds: number;
  wrongAttempts: number;
  isProcessing: boolean;
  showMilestoneModal: boolean;
  showDifficultySelector: boolean;
  selectedChoice: string | null;
  attachedCarriage: string | null;

  // Train state
  trainPhase: TrainPhase;

  // Feedback state
  feedback: string;
  feedbackType: FeedbackType;
}

export interface PatternTrainGameActions {
  // Game actions
  handleDifficultySelect: (difficulty: Difficulty) => void;
  handleCloseDifficultySelector: () => void;
  startNewRound: () => void;
  handleCorrectAnswer: () => void;
  handleIncorrectAnswer: (carriageEmoji: string) => void;
  handleRevealAnswer: () => void;
  resetGame: () => void;

  // UI actions
  setShowMilestoneModal: (show: boolean) => void;
  setSelectedChoice: (choice: string | null) => void;
  setAttachedCarriage: (carriage: string | null) => void;
  setWrongAttempts: (attempts: number) => void;
  setFeedback: (feedback: string) => void;
  setFeedbackType: (type: FeedbackType) => void;
  setTrainPhase: (phase: TrainPhase) => void;
  setIsProcessing: (processing: boolean) => void;

  // Utility
  queueTimeout: (callback: () => void, delay: number) => void;
  clearAllTimeouts: () => void;
  getRandomFeedback: (type: 'correct' | 'incorrect') => string;
}

export interface UsePatternTrainGameReturn {
  state: PatternTrainGameState;
  actions: PatternTrainGameActions;
}

interface UsePatternTrainGameOptions {
  difficulty: Difficulty;
  t: (key: string, options?: Record<string, unknown>) => string;
}

const MILESTONE_INTERVAL = 5;

export function usePatternTrainGame(
  options: UsePatternTrainGameOptions
): UsePatternTrainGameReturn {
  const { difficulty: initialDifficulty, t } = options;

  // Game state
  const [pattern, setPattern] = useState<TrainPattern | null>(null);
  const [completedRounds, setCompletedRounds] = useState(0);
  const [wrongAttempts, setWrongAttempts] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showMilestoneModal, setShowMilestoneModal] = useState(false);
  const [showDifficultySelector, setShowDifficultySelector] = useState(true);
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null);
  const [attachedCarriage, setAttachedCarriage] = useState<string | null>(null);

  // Train state
  const [trainPhase, setTrainPhase] = useState<TrainPhase>('offscreen');

  // Feedback state
  const [feedback, setFeedback] = useState(t('games.patternTrain.feedback.initial'));
  const [feedbackType, setFeedbackType] = useState<FeedbackType>('initial');

  // Timeout management
  const timeoutIdsRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const queueTimeout = useCallback((callback: () => void, delay: number) => {
    const timeoutId = setTimeout(() => {
      timeoutIdsRef.current = timeoutIdsRef.current.filter((id) => id !== timeoutId);
      callback();
    }, delay);
    timeoutIdsRef.current.push(timeoutId);
  }, []);

  const clearAllTimeouts = useCallback(() => {
    timeoutIdsRef.current.forEach((timeoutId) => clearTimeout(timeoutId));
    timeoutIdsRef.current = [];
  }, []);

  const getRandomFeedback = useCallback(
    (type: 'correct' | 'incorrect'): string => {
      const optionsKey =
        type === 'correct'
          ? 'games.patternTrain.feedback.correctOptions'
          : 'games.patternTrain.feedback.incorrectOptions';
      const fallbackKey =
        type === 'correct'
          ? 'games.patternTrain.feedback.correct'
          : 'games.patternTrain.feedback.incorrect';

      const messages = t(optionsKey, { returnObjects: true }) as unknown as string[];
      if (Array.isArray(messages) && messages.length > 0) {
        const index = Math.floor(Math.random() * messages.length);
        return messages[index];
      }
      return t(fallbackKey);
    },
    [t]
  );

  const startNewRound = useCallback(() => {
    const newPattern = generateTrainPattern(initialDifficulty);
    setPattern(newPattern);
    setWrongAttempts(0);
    setSelectedChoice(null);
    setAttachedCarriage(null);
    setIsProcessing(false);
    setFeedback(t('games.patternTrain.feedback.initial'));
    setFeedbackType('initial');
  }, [initialDifficulty, t]);

  const handleDifficultySelect = useCallback(
    (difficulty: Difficulty) => {
      const newPattern = generateTrainPattern(difficulty);
      setPattern(newPattern);
      setShowDifficultySelector(false);
    },
    []
  );

  const handleCloseDifficultySelector = useCallback(() => {
    setShowDifficultySelector(false);
  }, []);

  const handleCorrectAnswer = useCallback(() => {
    const newCount = completedRounds + 1;
    setCompletedRounds(newCount);

    // Check for milestone
    if (newCount > 0 && newCount % MILESTONE_INTERVAL === 0) {
      setShowMilestoneModal(true);
    }
  }, [completedRounds]);

  const handleIncorrectAnswer = useCallback(
    (carriageEmoji: string) => {
      if (!pattern) return;

      const newWrongAttempts = wrongAttempts + 1;
      setWrongAttempts(newWrongAttempts);

      if (newWrongAttempts < 3) {
        // Remove the wrong choice that was dragged
        removeWrongChoices(pattern.choices, pattern.answer, 1, carriageEmoji);
      }
    },
    [pattern, wrongAttempts]
  );

  const handleRevealAnswer = useCallback(() => {
    // Answer revealed after 3 wrong attempts
    // Game will exit train
  }, []);

  const resetGame = useCallback(() => {
    clearAllTimeouts();
    setPattern(null);
    setCompletedRounds(0);
    setWrongAttempts(0);
    setIsProcessing(false);
    setShowMilestoneModal(false);
    setShowDifficultySelector(true);
    setSelectedChoice(null);
    setAttachedCarriage(null);
    setTrainPhase('offscreen');
    setFeedback(t('games.patternTrain.feedback.initial'));
    setFeedbackType('initial');
  }, [clearAllTimeouts, t]);

  const state: PatternTrainGameState = {
    pattern,
    completedRounds,
    wrongAttempts,
    isProcessing,
    showMilestoneModal,
    showDifficultySelector,
    selectedChoice,
    attachedCarriage,
    trainPhase,
    feedback,
    feedbackType,
  };

  const actions: PatternTrainGameActions = {
    handleDifficultySelect,
    handleCloseDifficultySelector,
    startNewRound,
    handleCorrectAnswer,
    handleIncorrectAnswer,
    handleRevealAnswer,
    resetGame,
    setShowMilestoneModal,
    setSelectedChoice,
    setAttachedCarriage,
    setWrongAttempts,
    setFeedback,
    setFeedbackType,
    setTrainPhase,
    setIsProcessing,
    queueTimeout,
    clearAllTimeouts,
    getRandomFeedback,
  };

  return {
    state,
    actions,
  };
}
