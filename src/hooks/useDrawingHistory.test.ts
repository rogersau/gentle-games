import { renderHook, act } from '@testing-library/react-native';
import { useDrawingHistory } from './useDrawingHistory';
import type { HistoryEntry } from '../components/DrawingCanvas';

const mockEntry: HistoryEntry = {
  kind: 'stroke',
  id: 'test-1',
  actionId: 'action-1',
  points: [{ x: 0, y: 0 }],
  color: '#FF0000',
  width: 2,
};

describe('useDrawingHistory', () => {
  it('starts with initial history', () => {
    const { result } = renderHook(() => useDrawingHistory({ initialHistory: [mockEntry] }));
    expect(result.current.history).toEqual([mockEntry]);
  });

  it('starts empty when no initial history', () => {
    const { result } = renderHook(() => useDrawingHistory({ initialHistory: [] }));
    expect(result.current.history).toEqual([]);
  });

  it('adds entries to history', () => {
    const { result } = renderHook(() => useDrawingHistory({ initialHistory: [] }));
    act(() => {
      result.current.addToHistory(mockEntry);
    });
    expect(result.current.history).toEqual([mockEntry]);
  });

  it('calls onHistoryChange when history changes', () => {
    const onHistoryChange = jest.fn();
    const { result } = renderHook(() => useDrawingHistory({
      initialHistory: [],
      onHistoryChange,
    }));
    act(() => {
      result.current.addToHistory(mockEntry);
    });
    expect(onHistoryChange).toHaveBeenCalledWith([mockEntry]);
  });

  it('removes last entry on undo', () => {
    const entry2: HistoryEntry = { ...mockEntry, id: 'test-2', actionId: undefined };
    const { result } = renderHook(() => useDrawingHistory({
      initialHistory: [mockEntry, entry2],
    }));
    act(() => {
      result.current.undo();
    });
    expect(result.current.history).toEqual([mockEntry]);
  });

  it('removes all entries with same actionId on undo', () => {
    const entry2: HistoryEntry = { ...mockEntry, id: 'test-2', actionId: 'action-1' };
    const entry3: HistoryEntry = { ...mockEntry, id: 'test-3', actionId: 'action-2' };
    const { result } = renderHook(() => useDrawingHistory({
      initialHistory: [mockEntry, entry2, entry3],
    }));
    act(() => {
      result.current.undo();
    });
    expect(result.current.history).toEqual([mockEntry, entry2]);
  });

  it('clears all history', () => {
    const { result } = renderHook(() => useDrawingHistory({
      initialHistory: [mockEntry],
    }));
    act(() => {
      result.current.clearHistory();
    });
    expect(result.current.history).toEqual([]);
  });

  it('returns history snapshot', () => {
    const { result } = renderHook(() => useDrawingHistory({
      initialHistory: [mockEntry],
    }));
    const snapshot = result.current.getHistorySnapshot();
    expect(snapshot).toEqual([mockEntry]);
    expect(snapshot).not.toBe(result.current.history);
  });
});
