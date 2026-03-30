import { renderHook, act } from '@testing-library/react-native';
import type { GameDefinition } from '../games/registry';
import { APP_ROUTES } from '../types/navigation';
import { useGameSelection } from './useGameSelection';

const memorySnapGame: GameDefinition = {
  id: 'memory-snap',
  route: APP_ROUTES.Game,
  nameKey: 'games.memorySnap.name',
  descriptionKey: 'games.memorySnap.description',
  icon: '🧩',
  accentColor: '#abc123',
  isUnfinished: false,
  launchMode: 'difficulty-select',
};

const drawingGame: GameDefinition = {
  id: 'drawing',
  route: APP_ROUTES.Drawing,
  nameKey: 'games.drawing.name',
  descriptionKey: 'games.drawing.description',
  icon: '🎨',
  accentColor: '#def456',
  isUnfinished: false,
  launchMode: 'direct',
};

describe('useGameSelection', () => {
  it('starts with no selected game', () => {
    const { result } = renderHook(() => useGameSelection());
    expect(result.current.selectedGame).toBeNull();
    expect(result.current.showDifficultySelector).toBe(false);
  });

  it('provides game selection handlers', () => {
    const { result } = renderHook(() => useGameSelection());
    expect(typeof result.current.handleGameSelect).toBe('function');
    expect(typeof result.current.handleDifficultySelect).toBe('function');
    expect(typeof result.current.handleCloseModal).toBe('function');
  });

  it('opens the difficulty selector for games with difficulty-select launch mode', () => {
    const { result } = renderHook(() => useGameSelection());

    act(() => {
      result.current.handleGameSelect(memorySnapGame);
    });

    expect(result.current.selectedGame).toEqual(memorySnapGame);
    expect(result.current.showDifficultySelector).toBe(true);
  });

  it('keeps direct-launch games out of the difficulty selector', () => {
    const { result } = renderHook(() => useGameSelection());

    act(() => {
      result.current.handleGameSelect(drawingGame);
    });

    expect(result.current.selectedGame).toEqual(drawingGame);
    expect(result.current.showDifficultySelector).toBe(false);
  });

  it('clears selection after choosing a difficulty', async () => {
    const { result } = renderHook(() => useGameSelection());

    act(() => {
      result.current.handleGameSelect(memorySnapGame);
    });

    await act(async () => {
      await result.current.handleDifficultySelect('medium');
    });

    expect(result.current.selectedGame).toBeNull();
    expect(result.current.showDifficultySelector).toBe(false);
  });

  it('clears selection when the modal closes', () => {
    const { result } = renderHook(() => useGameSelection());

    act(() => {
      result.current.handleGameSelect(memorySnapGame);
    });

    act(() => {
      result.current.handleCloseModal();
    });

    expect(result.current.selectedGame).toBeNull();
    expect(result.current.showDifficultySelector).toBe(false);
  });
});
