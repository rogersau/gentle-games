import { renderHook, act } from '@testing-library/react-native';
import { usePicnicDrag } from './usePicnicDrag';

describe('usePicnicDrag', () => {
  it('starts with no active drag', () => {
    const onDrop = jest.fn();
    const { result } = renderHook(() => usePicnicDrag({ onDrop }));
    expect(result.current.activeDrag).toBeNull();
    expect(result.current.isOverBasket).toBe(false);
  });

  it('provides panResponder', () => {
    const onDrop = jest.fn();
    const { result } = renderHook(() => usePicnicDrag({ onDrop }));
    expect(result.current.panResponder).toBeDefined();
    expect(result.current.panResponder.panHandlers).toBeDefined();
  });

  it('provides drag position', () => {
    const onDrop = jest.fn();
    const { result } = renderHook(() => usePicnicDrag({ onDrop }));
    expect(result.current.dragPosition).toEqual({ x: 0, y: 0 });
  });
});
