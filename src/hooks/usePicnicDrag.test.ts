import { renderHook, act } from '@testing-library/react-native';
import { usePicnicDrag } from './usePicnicDrag';
import { PanResponder } from 'react-native';

describe('usePicnicDrag', () => {
  afterEach(() => jest.restoreAllMocks());
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

  it.each([
    { points: [{ pageX: 110, pageY: 110 }], valid: true },
    {
      points: [
        { pageX: 110, pageY: 110 },
        { pageX: 10, pageY: 10 },
      ],
      valid: false,
    },
  ])(
    'uses the last pointer position when move and release occur before a render: $valid',
    ({ points, valid }) => {
      let handlers!: Parameters<typeof PanResponder.create>[0];
      jest.spyOn(PanResponder, 'create').mockImplementation((config) => {
        handlers = config;
        return { panHandlers: {} };
      });
      const onDrop = jest.fn();
      const { result } = renderHook(() =>
        usePicnicDrag({ onDrop, dropZoneBounds: { x: 100, y: 100, width: 50, height: 50 } }),
      );
      act(() => {
        result.current.setActiveDrag('apple');
        for (const point of points)
          handlers.onPanResponderMove?.({ nativeEvent: point } as any, {} as any);
        handlers.onPanResponderRelease?.({} as any, {} as any);
      });
      expect(onDrop).toHaveBeenCalledWith('apple', valid);
      expect(result.current.activeDrag).toBeNull();
      expect(result.current.isOverBasket).toBe(false);
    },
  );
});
