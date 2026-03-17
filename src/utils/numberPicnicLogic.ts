import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
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
  const visualDots = Array(Math.min(targetCount, 12)).fill('🟢');

  return {
    itemEmoji: item.emoji,
    itemName: item.name,
    targetCount,
    visualDots,
  };
};

export const clampNumberPicnicCount = (count: number): number =>
  Math.max(0, Math.min(12, Math.floor(count)));

export const updateNumberPicnicCount = (currentCount: number, delta: number): number =>
  clampNumberPicnicCount(currentCount + delta);

export const isNumberPicnicPromptComplete = (currentCount: number, prompt: NumberPicnicPrompt): boolean =>
  currentCount === prompt.targetCount;

export interface UseNumberPicnicGameResult {
  // State
  prompt: NumberPicnicPrompt;
  basketCount: number;
  completedPicnics: number;
  isProcessing: boolean;
  isDragging: boolean;
  isOverBasket: boolean;
  isSuccess: boolean;
  blanketItemCount: number;
  basketItems: string[];
  isComplete: boolean;
  
  // Actions
  handleDropStart: () => void;
  handleItemDrop: (index: number) => void;
  handleDropEnd: () => void;
  handleDragOverBasket: (isOver: boolean) => void;
  startNewRound: () => void;
}

export const useNumberPicnicGame = (difficulty: Difficulty): UseNumberPicnicGameResult => {
  // Game state
  const [prompt, setPrompt] = useState(() => generateNumberPicnicPrompt(difficulty));
  const [basketCount, setBasketCount] = useState(0);
  const [completedPicnics, setCompletedPicnics] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isOverBasket, setIsOverBasket] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [blanketItemCount, setBlanketItemCount] = useState(() => {
    const max = getNumberPicnicMaxCount(difficulty);
    return Math.max(12, max + 3);
  });

  // Use refs for values that change frequently to avoid recreating callbacks
  const basketCountRef = useRef(basketCount);
  const isProcessingRef = useRef(isProcessing);
  useEffect(() => {
    basketCountRef.current = basketCount;
  }, [basketCount]);
  
  useEffect(() => {
    isProcessingRef.current = isProcessing;
  }, [isProcessing]);

  const isComplete = isNumberPicnicPromptComplete(basketCount, prompt);
  
  // Generate basket items array for display
  const basketItems = useMemo(() => 
    Array(basketCount).fill(prompt.itemEmoji),
    [basketCount, prompt.itemEmoji]
  );

  // Check for completion
  useEffect(() => {
    if (isComplete && !isSuccess) {
      setIsSuccess(true);
    }
  }, [isComplete, isSuccess]);

  const handleDropStart = useCallback(() => {
    setIsDragging(true);
  }, []);

  // Handle when item is dragged over basket (for highlighting)
  const handleDragOverBasket = useCallback((isOver: boolean) => {
    setIsOverBasket(isOver);
  }, []);

  // Handle item drop
  const handleItemDrop = useCallback((index: number) => {
    if (isProcessingRef.current) {
      return;
    }

    const max = getNumberPicnicMaxCount(difficulty);
    if (basketCountRef.current >= max) {
      return;
    }

    setIsProcessing(true);
    setIsDragging(false);
    setIsOverBasket(false);
    
    // Add item to basket
    setBasketCount(prev => {
      return Math.min(prev + 1, max);
    });
    setBlanketItemCount(prev => {
      return prev - 1;
    });
    
    setTimeout(() => {
      setIsProcessing(false);
    }, 300);
  }, [difficulty]);

  // Handle drop end
  const handleDropEnd = useCallback(() => {
    setIsDragging(false);
    setIsOverBasket(false);
  }, []);

  // Start new round after basket exits
  const startNewRound = useCallback(() => {
    const newPrompt = generateNumberPicnicPrompt(difficulty);
    setPrompt(newPrompt);
    setBasketCount(0);
    setCompletedPicnics(current => current + 1);
    setIsSuccess(false);
    setIsDragging(false);
    setIsOverBasket(false);
    
    // Reset blanket items for new round
    const max = getNumberPicnicMaxCount(difficulty);
    setBlanketItemCount(Math.max(12, max + 3));
  }, [difficulty]);

  return {
    // State
    prompt,
    basketCount,
    completedPicnics,
    isProcessing,
    isDragging,
    isOverBasket,
    isSuccess,
    blanketItemCount,
    basketItems,
    isComplete,
    
    // Actions
    handleDropStart,
    handleItemDrop,
    handleDropEnd,
    handleDragOverBasket,
    startNewRound,
  };
};
