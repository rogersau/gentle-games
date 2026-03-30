import { useState, useCallback } from 'react';
import type { GameLaunchMode } from '../games/registry';
import type { HomeGameId } from '../types/navigation';
import type { Difficulty } from '../types';
import type { TranslationKey } from '../i18n/types';

export interface Game {
  id: HomeGameId;
  nameKey: TranslationKey;
  descriptionKey: TranslationKey;
  icon: string;
  accentColor?: string;
  launchMode?: GameLaunchMode;
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
    const normalizedGame: Game = {
      ...game,
      launchMode:
        game.launchMode ?? (game.id === 'memory-snap' ? 'difficulty-select' : 'direct'),
    };

    setSelectedGame(normalizedGame);
    setShowDifficultySelector(normalizedGame.launchMode === 'difficulty-select');
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
