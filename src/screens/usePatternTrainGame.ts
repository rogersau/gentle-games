import { useCallback, useEffect, useRef, useState } from 'react';
import { Animated } from 'react-native';
import { createGuidedRoundController, GuidedRoundState } from '../guided-practice/controller';
import { Difficulty } from '../types';
import {
  generateTrainPattern,
  generateTransferPattern,
  isTrainChoiceCorrect,
  TrainPattern,
} from '../utils/patternTrainLogic';

export interface DraggableCarriage {
  emoji: string;
  position: Animated.ValueXY;
  scale: Animated.Value;
  opacity: Animated.Value;
  isAvailable: boolean;
}

export interface PatternTrainGameState {
  pattern: TrainPattern | null;
  completedRounds: number;
  wrongAttempts: number;
  isProcessing: boolean;
  showDifficultySelector: boolean;
  showMilestoneModal: boolean;
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
  startNewRound: () => void;
  submitChoice: (choice: string) => ChoiceResult | null;
  showHint: () => void;
  skipRound: () => void;
  replayInstructions: () => void;
  handleMilestoneContinue: () => void;
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
  const [pattern, setPattern] = useState<TrainPattern | null>(null);
  const [activeDifficulty, setActiveDifficulty] = useState(initialDifficulty);
  const [completedRounds, setCompletedRounds] = useState(0);
  const [wrongAttempts, setWrongAttempts] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showDifficultySelector, setShowDifficultySelector] = useState(true);
  const [showMilestoneModal, setShowMilestoneModal] = useState(false);
  const [attachedCarriage, setAttachedCarriage] = useState<string | null>(null);
  const [guidedRound, setGuidedRound] = useState<GuidedRoundState>(() =>
    createController().getState(),
  );
  const [feedback, setFeedback] = useState(t('games.patternTrain.feedback.initial'));
  const controllerRef = useRef(createController());

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

  const handleDifficultySelect = useCallback(
    (nextDifficulty: Difficulty) => {
      setActiveDifficulty(nextDifficulty);
      setPattern(generateTrainPattern(nextDifficulty));
      setWrongAttempts(0);
      setAttachedCarriage(null);
      setIsProcessing(false);
      setShowDifficultySelector(false);
      setShowMilestoneModal(false);
      setFeedback(t('games.patternTrain.feedback.initial'));
      resetController();
    },
    [resetController, t],
  );

  const startNewRound = useCallback(() => {
    const currentGuidedRound = controllerRef.current.getState();
    if (
      pattern &&
      currentGuidedRound.phase !== 'corrected' &&
      currentGuidedRound.phase !== 'skipped'
    ) {
      return;
    }
    const nextPattern = pattern
      ? currentGuidedRound.exampleNumber % 2 === 1
        ? generateTransferPattern(pattern)
        : generateTrainPattern(activeDifficulty)
      : generateTrainPattern(activeDifficulty);
    setPattern(nextPattern);
    setGuidedRound(pattern ? controllerRef.current.startNextExample() : resetController());
    setWrongAttempts(0);
    setAttachedCarriage(null);
    setIsProcessing(false);
    setShowMilestoneModal(false);
    setFeedback(t('games.patternTrain.feedback.initial'));
  }, [activeDifficulty, pattern, resetController, t]);

  const submitChoice = useCallback(
    (choice: string): ChoiceResult | null => {
      if (
        !pattern ||
        isProcessing ||
        guidedRound.phase === 'corrected' ||
        guidedRound.phase === 'skipped'
      ) {
        return null;
      }

      const isCorrect = isTrainChoiceCorrect(pattern, choice);
      const nextGuidedRound = controllerRef.current.attempt(isCorrect);
      setGuidedRound(nextGuidedRound);
      setWrongAttempts(nextGuidedRound.incorrectAttempts);

      if (isCorrect) {
        setAttachedCarriage(choice);
        setIsProcessing(true);
        const nextCompletedRounds = completedRounds + 1;
        setCompletedRounds(nextCompletedRounds);
        if (showMilestones && nextCompletedRounds % 5 === 0) {
          setShowMilestoneModal(true);
        }
        setFeedback(t('games.patternTrain.feedback.correct'));
      } else {
        setFeedback(t('games.patternTrain.feedback.incorrect'));
      }

      return { isCorrect, guidedRound: nextGuidedRound };
    },
    [completedRounds, guidedRound.phase, isProcessing, pattern, showMilestones, t],
  );

  const skipRound = useCallback(() => {
    if (!pattern) return;
    setGuidedRound(controllerRef.current.skip());
    setIsProcessing(false);
  }, [pattern]);

  const showHint = useCallback(() => {
    setGuidedRound(controllerRef.current.showHint());
  }, []);

  const replayInstructions = useCallback(() => {
    setGuidedRound(controllerRef.current.replayInstructions());
  }, []);

  const handleMilestoneContinue = useCallback(() => {
    setShowMilestoneModal(false);
    startNewRound();
  }, [startNewRound]);

  const resetGame = useCallback(() => {
    setPattern(null);
    setActiveDifficulty(initialDifficulty);
    setCompletedRounds(0);
    setWrongAttempts(0);
    setIsProcessing(false);
    setShowDifficultySelector(true);
    setShowMilestoneModal(false);
    setAttachedCarriage(null);
    setFeedback(t('games.patternTrain.feedback.initial'));
    resetController();
  }, [initialDifficulty, resetController, t]);

  const state: PatternTrainGameState = {
    pattern,
    completedRounds,
    wrongAttempts,
    isProcessing,
    showDifficultySelector,
    showMilestoneModal,
    attachedCarriage,
    guidedRound,
    feedback,
  };

  const actions: PatternTrainGameActions = {
    handleDifficultySelect,
    handleCloseDifficultySelector: () => setShowDifficultySelector(false),
    startNewRound,
    submitChoice,
    showHint,
    skipRound,
    replayInstructions,
    handleMilestoneContinue,
    resetGame,
  };

  return { state, actions };
}
