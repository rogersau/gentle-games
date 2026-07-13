import React from 'react';
import { Animated } from 'react-native';
import { fireEvent, render } from '@testing-library/react-native';
import { PicnicItem, PicnicItemPlaceholder } from './PicnicItem';

let mockSettings = {
  animationsEnabled: true,
  reducedMotionEnabled: false,
};

jest.mock('../../context/SettingsContext', () => ({
  useSettings: () => ({
    settings: mockSettings,
  }),
}));

describe('PicnicItem', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSettings = {
      animationsEnabled: true,
      reducedMotionEnabled: false,
    };

    jest.spyOn(Animated, 'timing').mockImplementation(
      () =>
        ({
          start: (callback?: () => void) => callback?.(),
          stop: jest.fn(),
          reset: jest.fn(),
        }) as any,
    );

    jest.spyOn(Animated, 'parallel').mockImplementation(
      (animations: any[]) =>
        ({
          start: (callback?: () => void) => {
            animations.forEach((animation) => animation.start?.());
            callback?.();
          },
          stop: jest.fn(),
        }) as any,
    );
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('calls onPress when item is not animating', () => {
    const onPress = jest.fn();
    const { getByRole } = render(<PicnicItem emoji='🍎' onPress={onPress} isAnimating={false} />);

    fireEvent.press(getByRole('button'));

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('blocks presses while animating', () => {
    const onPress = jest.fn();
    const { getByRole } = render(<PicnicItem emoji='🍎' onPress={onPress} isAnimating />);

    fireEvent.press(getByRole('button'));

    expect(onPress).not.toHaveBeenCalled();
  });

  it('runs completion callback and resets after animation', () => {
    const onAnimationComplete = jest.fn();

    render(
      <PicnicItem
        emoji='🍓'
        onPress={jest.fn()}
        isAnimating
        onAnimationComplete={onAnimationComplete}
      />,
    );

    expect(Animated.parallel).toHaveBeenCalledTimes(1);
    expect(onAnimationComplete).toHaveBeenCalledTimes(1);
  });

  it('uses reduced timing when animations are disabled', () => {
    mockSettings.animationsEnabled = false;

    render(<PicnicItem emoji='🍇' onPress={jest.fn()} isAnimating />);

    const timingCalls = (Animated.timing as jest.Mock).mock.calls;
    const durations = timingCalls
      .map(([, config]) => (config as { duration?: number }).duration)
      .filter((duration): duration is number => typeof duration === 'number');

    expect(durations).toEqual([50, 50, 50]);
  });

  it('renders placeholder state', () => {
    const { toJSON } = render(<PicnicItemPlaceholder />);
    expect(toJSON()).toBeTruthy();
  });
});
