import React from 'react';
import { Animated } from 'react-native';
import { act, render, waitFor } from '@testing-library/react-native';
import { PicnicBasket } from './PicnicBasket';

let mockSettings = {
  animationsEnabled: true,
  reducedMotionEnabled: false,
};

jest.mock('../../context/SettingsContext', () => ({
  useSettings: () => ({
    settings: mockSettings,
  }),
}));

jest.mock('../../utils/theme', () => ({
  useThemeColors: () => ({
    colors: {
      background: '#FFFEF7',
      cardBack: '#E8E4E1',
      cardFront: '#FFFFFF',
      text: '#5A5A5A',
      textLight: '#8A8A8A',
      primary: '#A8D8EA',
      secondary: '#FFB6C1',
      success: '#B8E6B8',
      matched: '#D3D3D3',
      surfaceGame: '#FFFFFF',
      surface: '#FFFFFF',
      surfaceElevated: '#FFFFFF',
      border: '#E8E4E1',
      borderSubtle: '#F0EDE9',
      overlay: 'rgba(90, 90, 90, 0.4)',
      accent: '#D4A9E6',
      danger: '#E8A0A0',
    },
  }),
}));

describe('PicnicBasket', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
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
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('shows empty state text and current count', () => {
    const { getByText } = render(<PicnicBasket items={[]} targetCount={3} onPress={jest.fn()} />);

    expect(getByText('Drag items here!')).toBeTruthy();
    expect(getByText('0/3')).toBeTruthy();
  });

  it('shows overflow indicator when more than 12 items are present', () => {
    const items = Array.from({ length: 14 }, () => '🍎');
    const { getByText } = render(
      <PicnicBasket items={items} targetCount={14} onPress={jest.fn()} />,
    );

    expect(getByText('+2 more')).toBeTruthy();
    expect(getByText('14/14')).toBeTruthy();
  });

  it('triggers completion callback after success delay', async () => {
    const onAnimationComplete = jest.fn();

    render(
      <PicnicBasket
        items={['🍓']}
        targetCount={1}
        onPress={jest.fn()}
        isSuccess
        onAnimationComplete={onAnimationComplete}
      />,
    );

    act(() => {
      jest.advanceTimersByTime(800);
    });

    await waitFor(() => {
      expect(onAnimationComplete).toHaveBeenCalledTimes(1);
    });
  });

  it('supports reduced-motion mode without animated timing dependency', async () => {
    mockSettings.animationsEnabled = false;
    const onAnimationComplete = jest.fn();

    render(
      <PicnicBasket
        items={['🍌']}
        targetCount={1}
        onPress={jest.fn()}
        isSuccess
        onAnimationComplete={onAnimationComplete}
      />,
    );

    act(() => {
      jest.advanceTimersByTime(800);
    });

    await waitFor(() => {
      expect(onAnimationComplete).toHaveBeenCalledTimes(1);
    });
  });
});
