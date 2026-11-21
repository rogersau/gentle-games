import { useCallback, useEffect, useRef, useState } from 'react';
import type {
  Difficulty,
  NumberPicnicChoice,
  NumberPicnicGroup,
  NumberPicnicMode,
  NumberPicnicPrompt,
  NumberPicnicStage,
} from '../types';
import { NUMBER_PICNIC_ITEMS } from '../types';
import type { Settings } from '../types';
import { createGuidedRoundController, GuidedRoundState } from '../guided-practice/controller';
import { narrateNumberPicnicCount, stopNumberPicnicNarration } from './numberPicnicNarration';
import { DEFAULT_LANGUAGE } from '../types/i18n';

export const NUMBER_PICNIC_EXTRA_ITEMS = 2;

export const getNumberPicnicMaxCount = (difficulty: Difficulty): number => {
  if (difficulty === 'easy') return 5;
  if (difficulty === 'medium') return 8;
  return 10;
};

export const getNumberPicnicRange = (stage: NumberPicnicStage): { min: number; max: number } => {
  if (stage === '1-3') return { min: 1, max: 3 };
  if (stage === '1-5') return { min: 1, max: 5 };
  return { min: 6, max: 10 };
};

export const stageForDifficulty = (difficulty: Difficulty): NumberPicnicStage =>
  difficulty === 'hard' ? '6-10' : difficulty === 'medium' ? '1-5' : '1-3';

export const stageForMaxQuantity = (maxQuantity: number): NumberPicnicStage =>
  maxQuantity <= 3 ? '1-3' : maxQuantity <= 5 ? '1-5' : '6-10';

export const isNumberPicnicModeAvailable = (
  stage: NumberPicnicStage,
  mode: NumberPicnicMode,
): boolean => mode !== 'add-one-more' || stage === '6-10';

export const getNumberPicnicPoolSize = (targetCount: number): number =>
  Math.max(1, Math.floor(targetCount)) + NUMBER_PICNIC_EXTRA_ITEMS;

const boundedRandom = (rng: () => number): number => {
  const value = rng();
  return Number.isFinite(value) ? Math.min(Math.max(value, 0), 0.999999) : 0;
};

const randomInteger = (rng: () => number, min: number, max: number): number =>
  Math.floor(boundedRandom(rng) * (max - min + 1)) + min;

const getDotSlots = (quantity: number, frameCapacity: 5 | 10): number[] => {
  const patterns: Record<number, number[]> = {
    1: [2],
    2: [1, 3],
    3: [0, 2, 4],
    4: [0, 1, 3, 4],
    5: [0, 1, 2, 3, 4],
  };
  if (quantity <= 5) return patterns[quantity];
  return Array.from({ length: quantity }, (_, index) => index).slice(0, frameCapacity);
};

export const createNumberPicnicRepresentation = (quantity: number) => {
  const safeQuantity = Math.max(1, Math.min(10, Math.floor(quantity)));
  const frameCapacity: 5 | 10 = safeQuantity <= 5 ? 5 : 10;
  return {
    quantity: safeQuantity,
    numeral: safeQuantity,
    frameCapacity,
    filledSlots: getDotSlots(safeQuantity, frameCapacity),
  };
};

const createChoice = (id: string, quantity: number): NumberPicnicChoice => ({
  id,
  quantity,
  numeral: quantity,
  representation: createNumberPicnicRepresentation(quantity),
});

const distinctQuantities = (target: number, min: number, max: number): number[] => {
  const values = [target];
  for (let quantity = min; quantity <= max && values.length < 3; quantity += 1) {
    if (quantity !== target) values.push(quantity);
  }
  return values;
};

const shuffleQuantities = (quantities: number[], rng: () => number): number[] => {
  const shuffled = [...quantities];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = randomInteger(rng, 0, index);
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }
  return shuffled;
};

export const generateNumberPicnicPrompt = (
  stage: NumberPicnicStage,
  rng: () => number = Math.random,
  requestedMode: NumberPicnicMode = 'make-amount',
): NumberPicnicPrompt => {
  const mode = isNumberPicnicModeAvailable(stage, requestedMode) ? requestedMode : 'make-amount';
  const { min, max } = getNumberPicnicRange(stage);
  const item = NUMBER_PICNIC_ITEMS[randomInteger(rng, 0, NUMBER_PICNIC_ITEMS.length - 1)];
  const targetCount =
    mode === 'add-one-more'
      ? randomInteger(rng, min, Math.max(min, max - 1)) + 1
      : randomInteger(rng, min, max);
  const representation = createNumberPicnicRepresentation(targetCount);
  let choices: NumberPicnicChoice[] = [];
  let groups: NumberPicnicGroup[] = [];
  let comparison: 'more' | 'fewer' | null = null;

  if (mode === 'find-amount' || mode === 'match-numeral') {
    choices = shuffleQuantities(distinctQuantities(targetCount, min, max), rng).map(
      (quantity, index) => createChoice(`choice-${index}`, quantity),
    );
  }

  if (mode === 'more-fewer') {
    const leftQuantity = randomInteger(rng, min, max);
    const rightCandidates = Array.from({ length: max - min + 1 }, (_, index) => min + index).filter(
      (quantity) => quantity !== leftQuantity,
    );
    const rightQuantity = rightCandidates[randomInteger(rng, 0, rightCandidates.length - 1)];
    comparison = boundedRandom(rng) < 0.5 ? 'more' : 'fewer';
    groups = [
      {
        id: 'left',
        quantity: leftQuantity,
        representation: createNumberPicnicRepresentation(leftQuantity),
      },
      {
        id: 'right',
        quantity: rightQuantity,
        representation: createNumberPicnicRepresentation(rightQuantity),
      },
    ];
  }

  return {
    itemEmoji: item.emoji,
    itemName: item.name,
    targetCount,
    stage,
    mode,
    representation,
    choices,
    groups,
    comparison,
  };
};

export const clampNumberPicnicCount = (count: number): number =>
  Math.max(0, Math.min(12, Math.floor(count)));

export const updateNumberPicnicCount = (currentCount: number, delta: number): number =>
  clampNumberPicnicCount(currentCount + delta);

export const isNumberPicnicPromptComplete = (
  currentCount: number,
  prompt: NumberPicnicPrompt,
): boolean => currentCount === prompt.targetCount;

export interface NumberPicnicGameState {
  prompt: NumberPicnicPrompt;
  poolItemIds: number[];
  placedItemIds: number[];
  round: number;
  completedPicnics: number;
  completionAnnouncementRound: number | null;
  isDragging: boolean;
  isOverBasket: boolean;
}

export type NumberPicnicAction =
  | { type: 'add'; itemId: number }
  | { type: 'remove'; itemId: number }
  | { type: 'undo' }
  | { type: 'reset' }
  | { type: 'new-prompt'; prompt: NumberPicnicPrompt }
  | { type: 'next'; prompt: NumberPicnicPrompt }
  | { type: 'drag-start' }
  | { type: 'drag-end' }
  | { type: 'drag-over'; isOver: boolean };

export const createNumberPicnicState = (
  prompt: NumberPicnicPrompt,
  round = 0,
  completedPicnics = 0,
): NumberPicnicGameState => {
  const initialCount = prompt.mode === 'add-one-more' ? prompt.targetCount - 1 : 0;
  const allItemIds = Array.from(
    { length: getNumberPicnicPoolSize(prompt.targetCount) },
    (_, id) => id,
  );

  return {
    prompt,
    poolItemIds: allItemIds.slice(initialCount),
    placedItemIds: allItemIds.slice(0, initialCount),
    round,
    completedPicnics,
    completionAnnouncementRound: null,
    isDragging: false,
    isOverBasket: false,
  };
};

const restorePoolOrder = (poolItemIds: number[], itemId: number): number[] =>
  [...poolItemIds, itemId].sort((left, right) => left - right);

export const numberPicnicReducer = (
  state: NumberPicnicGameState,
  action: NumberPicnicAction,
): NumberPicnicGameState => {
  switch (action.type) {
    case 'add': {
      if (
        !state.poolItemIds.includes(action.itemId) ||
        state.placedItemIds.length >= state.prompt.targetCount
      ) {
        return state;
      }
      const placedItemIds = [...state.placedItemIds, action.itemId];
      const isComplete = placedItemIds.length === state.prompt.targetCount;
      return {
        ...state,
        poolItemIds: state.poolItemIds.filter((id) => id !== action.itemId),
        placedItemIds,
        completionAnnouncementRound: isComplete ? state.round : null,
        isDragging: false,
        isOverBasket: false,
      };
    }
    case 'remove':
      if (
        !state.placedItemIds.includes(action.itemId) ||
        (state.prompt.mode === 'add-one-more' && action.itemId < state.prompt.targetCount - 1)
      ) {
        return state;
      }
      return {
        ...state,
        poolItemIds: restorePoolOrder(state.poolItemIds, action.itemId),
        placedItemIds: state.placedItemIds.filter((id) => id !== action.itemId),
        completionAnnouncementRound: null,
      };
    case 'undo': {
      const itemId = state.placedItemIds[state.placedItemIds.length - 1];
      return itemId === undefined ? state : numberPicnicReducer(state, { type: 'remove', itemId });
    }
    case 'reset':
      return createNumberPicnicState(state.prompt, state.round, state.completedPicnics);
    case 'new-prompt':
      return createNumberPicnicState(action.prompt);
    case 'next':
      return createNumberPicnicState(
        action.prompt,
        state.round + 1,
        state.completedPicnics + Number(state.placedItemIds.length === state.prompt.targetCount),
      );
    case 'drag-start':
      return { ...state, isDragging: true, isOverBasket: false };
    case 'drag-end':
      return { ...state, isDragging: false, isOverBasket: false };
    case 'drag-over':
      if (!state.isDragging || state.isOverBasket === action.isOver) return state;
      return { ...state, isOverBasket: action.isOver };
  }
};

export interface UseNumberPicnicGameOptions {
  mode?: NumberPicnicMode;
  rng?: () => number;
  settings?: Pick<Settings, 'soundEnabled'> & Partial<Pick<Settings, 'soundVolume' | 'language'>>;
  spokenCounting?: boolean;
  narrateCount?: (count: number) => void;
}

export interface UseNumberPicnicGameResult {
  prompt: NumberPicnicPrompt;
  basketCount: number;
  completedPicnics: number;
  isDragging: boolean;
  isOverBasket: boolean;
  isSuccess: boolean;
  blanketItemIds: number[];
  basketItems: string[];
  basketItemIds: number[];
  isComplete: boolean;
  hasCompletionAnnouncement: boolean;
  guidedRound: GuidedRoundState;
  handleDropStart: () => void;
  handleItemDrop: (index: number) => void;
  handleBasketItemPress: (itemId: number) => void;
  handleUndo: () => void;
  handleReset: () => void;
  handleDropEnd: () => void;
  handleDragOverBasket: (isOver: boolean) => void;
  handleChoice: (choiceId: string) => boolean;
  showHint: () => void;
  startNewRound: () => void;
}

export const useNumberPicnicGame = (
  stage: NumberPicnicStage,
  options: UseNumberPicnicGameOptions = {},
): UseNumberPicnicGameResult => {
  const requestedMode = options.mode ?? 'make-amount';
  const mode = isNumberPicnicModeAvailable(stage, requestedMode) ? requestedMode : 'make-amount';
  const isPlacementMode = mode === 'make-amount' || mode === 'add-one-more';
  const rng = options.rng ?? Math.random;
  const [state, setState] = useState(() =>
    createNumberPicnicState(generateNumberPicnicPrompt(stage, rng, mode)),
  );
  const stateRef = useRef(state);
  const controllerRef = useRef(createGuidedRoundController({ hintAfter: 1, modelAfter: 2 }));
  const [guidedRound, setGuidedRound] = useState<GuidedRoundState>(() =>
    controllerRef.current.getState(),
  );
  const previousConfigRef = useRef({ stage, mode });
  const spokenCounting = options.spokenCounting === true;
  const soundEnabled = options.settings?.soundEnabled === true;
  const volume = options.settings?.soundVolume ?? 0.5;
  const locale = options.settings?.language ?? DEFAULT_LANGUAGE;

  const dispatchGame = useCallback((action: NumberPicnicAction) => {
    const next = numberPicnicReducer(stateRef.current, action);
    if (next === stateRef.current) return;
    stateRef.current = next;
    setState(next);
  }, []);

  const resetGuidance = useCallback(() => {
    controllerRef.current.dispose();
    controllerRef.current = createGuidedRoundController({ hintAfter: 1, modelAfter: 2 });
    setGuidedRound(controllerRef.current.getState());
  }, []);

  useEffect(() => {
    const previous = previousConfigRef.current;
    if (previous.stage === stage && previous.mode === mode) return;
    previousConfigRef.current = { stage, mode };
    dispatchGame({
      type: 'new-prompt',
      prompt: generateNumberPicnicPrompt(stage, rng, mode),
    });
    resetGuidance();
  }, [dispatchGame, mode, resetGuidance, rng, stage]);

  useEffect(() => () => controllerRef.current.dispose(), []);
  useEffect(() => {
    if (isPlacementMode && spokenCounting && soundEnabled && volume > 0) {
      return stopNumberPicnicNarration;
    }
  }, [isPlacementMode, spokenCounting, soundEnabled, volume, locale]);

  const handleItemDrop = useCallback(
    (itemId: number) => {
      const current = stateRef.current;
      if (!isPlacementMode) return;
      dispatchGame({ type: 'add', itemId });
      if (current === stateRef.current) return;
      narrateNumberPicnicCount(stateRef.current.placedItemIds.length, {
        spokenCounting,
        soundEnabled,
        volume,
        locale,
        narrate: options.narrateCount,
      });
    },
    [
      dispatchGame,
      isPlacementMode,
      spokenCounting,
      soundEnabled,
      volume,
      locale,
      options.narrateCount,
    ],
  );

  const handleRemove = useCallback(
    (itemId: number) => {
      if (stateRef.current.isDragging) return;
      dispatchGame({ type: 'remove', itemId });
    },
    [dispatchGame],
  );

  const handleChoice = useCallback(
    (choiceId: string): boolean => {
      const { prompt } = stateRef.current;
      const { phase } = controllerRef.current.getState();
      if (isPlacementMode || phase === 'corrected' || phase === 'skipped') {
        return false;
      }
      const choices = prompt.mode === 'more-fewer' ? prompt.groups : prompt.choices;
      const choice = choices.find(({ id }) => id === choiceId);
      if (!choice) return false;

      const quantities = prompt.groups.map(({ quantity }) => quantity);
      const target =
        prompt.mode === 'more-fewer'
          ? prompt.comparison === 'more'
            ? Math.max(...quantities)
            : Math.min(...quantities)
          : prompt.targetCount;
      const isCorrect = choice.quantity === target;
      const nextGuidedRound = controllerRef.current.attempt(isCorrect);
      setGuidedRound(nextGuidedRound);
      return isCorrect;
    },
    [isPlacementMode],
  );

  const handleUndo = useCallback(() => {
    const current = stateRef.current;
    const initialCount =
      current.prompt.mode === 'add-one-more' ? current.prompt.targetCount - 1 : 0;
    if (current.placedItemIds.length <= initialCount) return;
    const itemId = current.placedItemIds[current.placedItemIds.length - 1];
    if (itemId !== undefined) handleRemove(itemId);
  }, [handleRemove]);

  const handleReset = useCallback(() => {
    if (stateRef.current.isDragging) return;
    dispatchGame({ type: 'reset' });
    resetGuidance();
  }, [dispatchGame, resetGuidance]);

  const startNewRound = useCallback(() => {
    if (stateRef.current.isDragging) return;
    const nextPrompt = generateNumberPicnicPrompt(stage, rng, mode);
    dispatchGame({ type: isPlacementMode ? 'next' : 'new-prompt', prompt: nextPrompt });
    if (!isPlacementMode) {
      controllerRef.current.skip();
      setGuidedRound(controllerRef.current.startNextExample());
    }
  }, [dispatchGame, isPlacementMode, mode, rng, stage]);

  const currentComplete = state.placedItemIds.length === state.prompt.targetCount;
  const isChoiceComplete = !isPlacementMode && guidedRound.phase === 'corrected';
  const isComplete = isPlacementMode ? currentComplete : isChoiceComplete;

  return {
    prompt: state.prompt,
    basketCount: state.placedItemIds.length,
    completedPicnics: state.completedPicnics,
    isDragging: state.isDragging,
    isOverBasket: state.isOverBasket,
    isSuccess: isComplete,
    blanketItemIds: state.poolItemIds,
    basketItems: state.placedItemIds.map(() => state.prompt.itemEmoji),
    basketItemIds: state.placedItemIds,
    isComplete,
    hasCompletionAnnouncement: isPlacementMode && state.completionAnnouncementRound === state.round,
    guidedRound,
    handleDropStart: () => dispatchGame({ type: 'drag-start' }),
    handleItemDrop,
    handleBasketItemPress: handleRemove,
    handleUndo,
    handleReset,
    handleDropEnd: () => dispatchGame({ type: 'drag-end' }),
    handleDragOverBasket: (isOver: boolean) => dispatchGame({ type: 'drag-over', isOver }),
    handleChoice,
    showHint: () => setGuidedRound(controllerRef.current.showHint()),
    startNewRound,
  };
};
