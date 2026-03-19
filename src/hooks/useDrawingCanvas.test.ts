import { renderHook } from '@testing-library/react-native';
import { useDrawingCanvas } from './useDrawingCanvas';

describe('useDrawingCanvas', () => {
  it('provides panResponder', () => {
    const { result } = renderHook(() => useDrawingCanvas({
      initialHistory: [],
      canvasWidth: 400,
      canvasHeight: 600,
    }));
    expect(result.current.panResponder).toBeDefined();
    expect(result.current.panResponder.panHandlers).toBeDefined();
  });

  it('provides current strokes state', () => {
    const { result } = renderHook(() => useDrawingCanvas({
      initialHistory: [],
      canvasWidth: 400,
      canvasHeight: 600,
    }));
    expect(result.current.currentStrokes).toEqual([]);
  });

  it('delegates history operations', () => {
    const { result } = renderHook(() => useDrawingCanvas({
      initialHistory: [],
      canvasWidth: 400,
      canvasHeight: 600,
    }));
    expect(typeof result.current.addToHistory).toBe('function');
    expect(typeof result.current.undo).toBe('function');
    expect(typeof result.current.clearHistory).toBe('function');
  });

  it('delegates tool operations', () => {
    const { result } = renderHook(() => useDrawingCanvas({
      initialHistory: [],
      canvasWidth: 400,
      canvasHeight: 600,
    }));
    expect(result.current.tool).toBe('pen');
    expect(typeof result.current.setTool).toBe('function');
    expect(result.current.selectedColor).toBe('#FF6B6B');
  });
});
