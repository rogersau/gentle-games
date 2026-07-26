import { act, renderHook } from '@testing-library/react-native';
import { AccessibilityInfo, Animated } from 'react-native';
import { useAnimationEnabled, useFadeIn, useGentleBounce, useScalePress } from './animations';

let mockSettings = {
  animationsEnabled: true,
};

jest.mock('../context/SettingsContext', () => ({
  useSettings: () => ({
    settings: mockSettings,
  }),
}));

describe('ui animations hooks', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSettings = { animationsEnabled: true };

    jest.spyOn(Animated, 'timing').mockImplementation(
      () =>
        ({
          start: (callback?: () => void) => callback?.(),
          stop: jest.fn(),
          reset: jest.fn(),
        }) as any,
    );

    jest.spyOn(Animated, 'sequence').mockImplementation(
      () =>
        ({
          start: (callback?: () => void) => callback?.(),
          stop: jest.fn(),
          reset: jest.fn(),
        }) as any,
    );
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('returns animation-enabled flag from settings', () => {
    mockSettings.animationsEnabled = false;
    const { result } = renderHook(() => useAnimationEnabled());
    expect(result.current).toBe(false);
  });

  it('updates effective animation policy when the OS preference changes at runtime', async () => {
    let onChange: ((enabled: boolean) => void) | undefined;
    jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(false);
    jest.spyOn(AccessibilityInfo, 'addEventListener').mockImplementation((_, callback) => {
      onChange = callback as unknown as (enabled: boolean) => void;
      return { remove: jest.fn() } as any;
    });

    const { result } = renderHook(() => useAnimationEnabled());
    await act(async () => {
      await Promise.resolve();
    });
    expect(result.current).toBe(true);

    act(() => onChange?.(true));
    expect(result.current).toBe(false);

    act(() => onChange?.(false));
    expect(result.current).toBe(true);
  });

  it('fadeIn sets opacity immediately when animations are disabled', () => {
    mockSettings.animationsEnabled = false;
    const setValueSpy = jest.spyOn(Animated.Value.prototype, 'setValue');
    const { result } = renderHook(() => useFadeIn());

    act(() => {
      result.current.fadeIn();
    });

    expect(setValueSpy).toHaveBeenCalledWith(1);
    expect(Animated.timing).not.toHaveBeenCalled();
  });

  it('fadeIn starts timing animation when enabled', () => {
    const { result } = renderHook(() => useFadeIn(450));

    act(() => {
      result.current.fadeIn();
    });

    expect(Animated.timing).toHaveBeenCalledWith(
      expect.any(Animated.Value),
      expect.objectContaining({
        toValue: 1,
        duration: 450,
      }),
    );
  });

  it('gentle bounce does nothing when disabled', () => {
    mockSettings.animationsEnabled = false;
    const { result } = renderHook(() => useGentleBounce());

    act(() => {
      result.current.bounce();
    });

    expect(Animated.sequence).not.toHaveBeenCalled();
  });

  it('gentle bounce runs sequence when enabled', () => {
    const { result } = renderHook(() => useGentleBounce());

    act(() => {
      result.current.bounce();
    });

    expect(Animated.sequence).toHaveBeenCalledTimes(1);
  });

  it('scale press creates press-in and press-out timings', () => {
    const { result } = renderHook(() => useScalePress());

    act(() => {
      result.current.onPressIn();
      result.current.onPressOut();
    });

    const toValues = (Animated.timing as jest.Mock).mock.calls.map(
      ([, config]) => (config as { toValue: number }).toValue,
    );
    expect(toValues).toEqual(expect.arrayContaining([0.96, 1]));
  });
});
