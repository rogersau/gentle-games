import { useCallback, useEffect, useRef, useState } from 'react';
import { createGuidedRoundController, GuidedRoundState } from '../guided-practice/controller';
import { Difficulty } from '../types';
import {
  generateTrainPattern,
  generateTransferPattern,
  isTrainChoiceCorrect,
  TrainPattern,
} from '../utils/patternTrainLogic';

export interface PatternTrainGameState {
  pattern: TrainPattern;
  completedRounds: number;
  showDifficultySelector: boolean;
  showMilestone: boolean;
  attachedCarriage: string | null;
  guidedRound: GuidedRoundState;
  feedback: string;
}

export interface ChoiceResult {
  isCorrect: boolean;
  guidedRound: GuidedRoundState;
}

export interface PatternTrainGameActions {
  handleDifficultySelect: (difficulty: Difficulty) => void;
  handleCloseDifficultySelector: () => void;
  openDifficultySelector: () => void;
  startNewRound: () => void;
  submitChoice: (choice: string) => ChoiceResult | null;
  showHint: () => void;
  skipRound: () => void;
  replayInstructions: () => void;
  resetGame: () => void;
}

export interface UsePatternTrainGameReturn {
  state: PatternTrainGameState;
  actions: PatternTrainGameActions;
}

interface UsePatternTrainGameOptions {
  difficulty: Difficulty;
  t: (key: string, options?: Record<string, unknown>) => string;
  showMilestones?: boolean;
}

const createController = () => createGuidedRoundController({ hintAfter: 1, modelAfter: 2 });

export function usePatternTrainGame({
  difficulty: initialDifficulty,
  t,
  showMilestones = true,
}: UsePatternTrainGameOptions) {
  const [pattern, setPattern] = useState(() => generateTrainPattern(initialDifficulty));
  const currentPattern = useRef(pattern);
  const [completedRounds, setCompletedRounds] = useState(0);
  const [showDifficultySelector, setShowDifficultySelector] = useState(false);
  const [attachedCarriage, setAttachedCarriage] = useState<string | null>(null);
  const [guidedRound, setGuidedRound] = useState<GuidedRoundState>(() =>
    createController().getState(),
  );
  const [initialController] = useState(createController);
  const controllerRef = useRef(initialController);

  useEffect(() => {
    return () => {
      controllerRef.current.dispose();
    };
  }, []);

  const resetController = useCallback(() => {
    controllerRef.current.dispose();
    controllerRef.current = createController();
    const nextState = controllerRef.current.getState();
    setGuidedRound(nextState);
    return nextState;
  }, []);

  const replacePattern = useCallback((nextPattern: TrainPattern) => {
    currentPattern.current = nextPattern;
    setPattern(nextPattern);
    setAttachedCarriage(null);
  }, []);

  const handleDifficultySelect = useCallback(
    (nextDifficulty: Difficulty) => {
      replacePattern(generateTrainPattern(nextDifficulty));
      setShowDifficultySelector(false);
      resetController();
    },
    [replacePattern, resetController],
  );

  const startNewRound = useCallback(() => {
    const currentGuidedRound = controllerRef.current.getState();
    if (
      currentPattern.current !== pattern ||
      (currentGuidedRound.phase !== 'corrected' && currentGuidedRound.phase !== 'skipped')
    ) {
      return;
    }
    const nextPattern =
      currentGuidedRound.exampleNumber % 2 === 1
        ? generateTransferPattern(pattern)
        : generateTrainPattern(pattern.difficulty);
    replacePattern(nextPattern);
    setGuidedRound(controllerRef.current.startNextExample());
  }, [pattern, replacePattern]);

  const submitChoice = useCallback(
    (choice: string): ChoiceResult | null => {
      const previousRound = controllerRef.current.getState();
      if (
        currentPattern.current !== pattern ||
        previousRound.phase === 'corrected' ||
        previousRound.phase === 'skipped'
      ) {
        return null;
      }

      const isCorrect = isTrainChoiceCorrect(pattern, choice);
      const nextGuidedRound = controllerRef.current.attempt(isCorrect);
      if (nextGuidedRound === previousRound) return null;
      setGuidedRound(nextGuidedRound);

      if (isCorrect) {
        setAttachedCarriage(choice);
        setCompletedRounds((count) => count + 1);
      }

      return { isCorrect, guidedRound: nextGuidedRound };
    },
    [pattern],
  );

  const skipRound = useCallback(() => {
    if (currentPattern.current !== pattern) return;
    if (controllerRef.current.skip().phase === 'skipped') startNewRound();
  }, [pattern, startNewRound]);

  const showHint = useCallback(() => {
    setGuidedRound(controllerRef.current.showHint());
  }, []);

  const replayInstructions = useCallback(() => {
    setGuidedRound(controllerRef.current.replayInstructions());
  }, []);

  const resetGame = useCallback(() => {
    replacePattern(generateTrainPattern(initialDifficulty));
    setCompletedRounds(0);
    setShowDifficultySelector(false);
    resetController();
  }, [initialDifficulty, replacePattern, resetController]);

  const state: PatternTrainGameState = {
    pattern,
    completedRounds,
    showDifficultySelector,
    showMilestone: showMilestones && guidedRound.phase === 'corrected' && completedRounds % 5 === 0,
    attachedCarriage,
    guidedRound,
    feedback:
      guidedRound.phase === 'corrected'
        ? t('games.patternTrain.feedback.correct')
        : guidedRound.incorrectAttempts > 0
          ? t('games.patternTrain.feedback.incorrect')
          : '',
  };

  const actions: PatternTrainGameActions = {
    handleDifficultySelect,
    handleCloseDifficultySelector: () => setShowDifficultySelector(false),
    openDifficultySelector: () => setShowDifficultySelector(true),
    startNewRound,
    submitChoice,
    showHint,
    skipRound,
    replayInstructions,
    resetGame,
  };

  return { state, actions };
}
