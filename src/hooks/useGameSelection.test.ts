import { renderHook, act } from '@testing-library/react-native';
import { useGameSelection } from './useGameSelection';

const memorySnapGame = {
  id: 'memory-snap' as const,
  nameKey: 'games.memorySnap.name' as const,
  descriptionKey: 'games.memorySnap.description' as const,
  icon: '🧩',
  accentColor: '#abc123',
};

const drawingGame = {
  id: 'drawing' as const,
  nameKey: 'games.drawing.name' as const,
  descriptionKey: 'games.drawing.description' as const,
  icon: '🎨',
  accentColor: '#def456',
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
      result.current.handleGameSelect({
        ...drawingGame,
        launchMode: 'difficulty-select',
      });
    });

    expect(result.current.selectedGame).toEqual({
      ...drawingGame,
      launchMode: 'difficulty-select',
    });
    expect(result.current.showDifficultySelector).toBe(true);
  });

  it('keeps direct-launch games out of the difficulty selector', () => {
    const { result } = renderHook(() => useGameSelection());

    act(() => {
      result.current.handleGameSelect({
        ...memorySnapGame,
        launchMode: 'direct',
      });
    });

    expect(result.current.selectedGame).toEqual({
      ...memorySnapGame,
      launchMode: 'direct',
    });
    expect(result.current.showDifficultySelector).toBe(false);
  });

  it('defaults memory snap to difficulty-select launch mode for HomeScreen compatibility', () => {
    const { result } = renderHook(() => useGameSelection());

    act(() => {
      result.current.handleGameSelect(memorySnapGame);
    });

    expect(result.current.selectedGame).toEqual({
      ...memorySnapGame,
      launchMode: 'difficulty-select',
    });
    expect(result.current.showDifficultySelector).toBe(true);
  });

  it('defaults non-memory-snap games to direct launch mode for HomeScreen compatibility', () => {
    const { result } = renderHook(() => useGameSelection());

    act(() => {
      result.current.handleGameSelect(drawingGame);
    });

    expect(result.current.selectedGame).toEqual({
      ...drawingGame,
      launchMode: 'direct',
    });
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
