import { renderHook, act } from '@testing-library/react-native';
import { useGameSelection } from './useGameSelection';

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
});
