import { renderHook, act } from '@testing-library/react-native';
import { useDrawingTools } from './useDrawingTools';

describe('useDrawingTools', () => {
  it('starts with pen tool and default color', () => {
    const { result } = renderHook(() => useDrawingTools());
    expect(result.current.tool).toBe('pen');
    expect(result.current.selectedColor).toBe('#FF6B6B');
    expect(result.current.shapeType).toBe('circle');
    expect(result.current.shapeSize).toBe(50);
    expect(result.current.symmetryMode).toBe('none');
  });

  it('changes tool', () => {
    const { result } = renderHook(() => useDrawingTools());
    act(() => {
      result.current.setTool('eraser');
    });
    expect(result.current.tool).toBe('eraser');
  });

  it('changes selected color', () => {
    const { result } = renderHook(() => useDrawingTools());
    act(() => {
      result.current.setSelectedColor('#00FF00');
    });
    expect(result.current.selectedColor).toBe('#00FF00');
  });

  it('changes shape type', () => {
    const { result } = renderHook(() => useDrawingTools());
    act(() => {
      result.current.setShapeType('square');
    });
    expect(result.current.shapeType).toBe('square');
  });

  it('changes shape size', () => {
    const { result } = renderHook(() => useDrawingTools());
    act(() => {
      result.current.setShapeSize(100);
    });
    expect(result.current.shapeSize).toBe(100);
  });

  it('changes symmetry mode', () => {
    const { result } = renderHook(() => useDrawingTools());
    act(() => {
      result.current.setSymmetryMode('half');
    });
    expect(result.current.symmetryMode).toBe('half');
  });
});
