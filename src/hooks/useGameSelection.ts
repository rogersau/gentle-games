import { useState, useCallback } from 'react';
import type { HomeGameId } from '../types/navigation';
import type { Difficulty } from '../types';
import type { TranslationKey } from '../i18n/types';

interface Game {
  id: HomeGameId;
  nameKey: TranslationKey;
  descriptionKey: TranslationKey;
  icon: string;
  accentColor?: string;
}

interface UseGameSelectionReturn {
  selectedGame: Game | null;
  showDifficultySelector: boolean;
  handleGameSelect: (game: Game) => void;
  handleDifficultySelect: (difficulty: Difficulty) => Promise<Difficulty>;
  handleCloseModal: () => void;
}

export function useGameSelection(): UseGameSelectionReturn {
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [showDifficultySelector, setShowDifficultySelector] = useState(false);

  const handleGameSelect = useCallback((game: Game) => {
    setSelectedGame(game);
    if (game.id === 'memory-snap') {
      setShowDifficultySelector(true);
    }
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

export type { Game };
