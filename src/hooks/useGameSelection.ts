import { useState, useCallback } from 'react';
import type { GameDefinition } from '../games/registry';
import type { Difficulty } from '../types';

interface UseGameSelectionReturn {
  selectedGame: GameDefinition | null;
  showDifficultySelector: boolean;
  handleGameSelect: (game: GameDefinition) => void;
  handleDifficultySelect: (difficulty: Difficulty) => Promise<Difficulty>;
  handleCloseModal: () => void;
}

export function useGameSelection(): UseGameSelectionReturn {
  const [selectedGame, setSelectedGame] = useState<GameDefinition | null>(null);
  const [showDifficultySelector, setShowDifficultySelector] = useState(false);

  const handleGameSelect = useCallback((game: GameDefinition) => {
    setSelectedGame(game);
    setShowDifficultySelector(game.launchMode === 'difficulty-select');
  }, []);

  const handleDifficultySelect = useCallback((difficulty: Difficulty): Promise<Difficulty> => {
    setShowDifficultySelector(false);
    setSelectedGame(null);
    return Promise.resolve(difficulty);
  }, []);

  const handleCloseModal = useCallback(() => {
    setShowDifficultySelector(false);
    setSelectedGame(null);
  }, []);

  return {
    selectedGame,
    showDifficultySelector,
    handleGameSelect,
    handleDifficultySelect,
    handleCloseModal,
  };
}
