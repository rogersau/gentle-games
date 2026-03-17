import { renderHook, act } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useDebouncedDrawingSave } from './useDebouncedDrawingSave';
import type { HistoryEntry } from '../components/DrawingCanvas';

const historyA: HistoryEntry[] = [
  {
    kind: 'shape',
    id: 'shape-1',
    type: 'circle',
    x: 10,
    y: 10,
    size: 20,
    color: '#000000',
  },
];

const historyB: HistoryEntry[] = [
  {
    kind: 'stroke',
    id: 'stroke-1',
    points: [{ x: 1, y: 2 }],
    color: '#ff0000',
    width: 5,
  },
];

describe('useDebouncedDrawingSave', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('collapses rapid scheduleSave calls into one final persisted payload after the debounce window', async () => {
    const { result } = renderHook(() =>
      useDebouncedDrawingSave({
        storageKey: '@drawing-test',
        debounceMs: 250,
      })
    );

    act(() => {
      result.current.scheduleSave(historyA);
      result.current.scheduleSave(historyB);
      jest.advanceTimersByTime(249);
    });

    expect(AsyncStorage.setItem).not.toHaveBeenCalled();

    await act(async () => {
      jest.advanceTimersByTime(1);
      await Promise.resolve();
    });

    expect(AsyncStorage.setItem).toHaveBeenCalledTimes(1);
    expect(AsyncStorage.setItem).toHaveBeenCalledWith('@drawing-test', JSON.stringify(historyB));
  });

  it('flushPendingSave writes the latest queued history immediately before the timer fires', async () => {
    const { result } = renderHook(() =>
      useDebouncedDrawingSave({
        storageKey: '@drawing-test',
        debounceMs: 250,
      })
    );

    act(() => {
      result.current.scheduleSave(historyA);
    });

    await act(async () => {
      await result.current.flushPendingSave();
    });

    expect(AsyncStorage.setItem).toHaveBeenCalledTimes(1);
    expect(AsyncStorage.setItem).toHaveBeenCalledWith('@drawing-test', JSON.stringify(historyA));

    await act(async () => {
      jest.advanceTimersByTime(250);
      await Promise.resolve();
    });

    expect(AsyncStorage.setItem).toHaveBeenCalledTimes(1);
  });

  it('removes the saved drawing when the latest queued history is empty', async () => {
    const { result } = renderHook(() =>
      useDebouncedDrawingSave({
        storageKey: '@drawing-test',
        debounceMs: 250,
      })
    );

    act(() => {
      result.current.scheduleSave([]);
    });

    await act(async () => {
      await result.current.flushPendingSave();
    });

    expect(AsyncStorage.removeItem).toHaveBeenCalledWith('@drawing-test');
    expect(AsyncStorage.setItem).not.toHaveBeenCalled();
  });
});
