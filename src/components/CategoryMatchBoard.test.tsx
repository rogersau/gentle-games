import React from 'react';
import { PanResponder } from 'react-native';
import { act, fireEvent, render } from '@testing-library/react-native';
import { CategoryMatchBoard } from './CategoryMatchBoard';
import { CATEGORY_MATCH_CATEGORIES } from '../types';

const mockPlayFlipSound = jest.fn();
const mockPlayMatchSound = jest.fn();
const mockCreateCategoryMatchRound = jest.fn();

jest.mock('../context/SettingsContext', () => ({
  useSettings: () => ({
    settings: {
      animationsEnabled: false,
      reducedMotionEnabled: false,
      soundEnabled: true,
      soundVolume: 0.5,
    },
  }),
}));

jest.mock('../utils/theme', () => ({
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
    resolvedMode: 'light',
    colorMode: 'light',
  }),
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'games.categoryMatch.accessibilityLabel': 'Sort each emoji into Sky, Land, or Ocean.',
        'games.categoryMatch.dragToMatchingCategory': 'Drag to the matching category.',
        'games.categoryMatch.interactionInstruction':
          'Drag the item, or tap it to select it and choose a category.',
        'games.categoryMatch.itemAccessibilityLabel': '{{item}} item',
        'games.categoryMatch.selectItemHint': 'Tap to select this item, then choose a category.',
        'games.categoryMatch.itemSelected': '{{item}} selected. Choose a category.',
        'games.categoryMatch.selectItemFirst': 'Select the item before choosing a category.',
        'games.categoryMatch.categoryAccessibilityLabel': '{{category}} category',
        'games.categoryMatch.categoryActivationHint': 'Activate to place the selected item here.',
        'games.categoryMatch.selectedItemHint': 'Item selected. Choose a category.',
        'games.categoryMatch.categorySelectFirstHint':
          'Select the item first, then activate this category.',
        'games.categoryMatch.selectionInstruction':
          'Item selected. Activate a category to place it.',
        'games.categoryMatch.dragInstruction': 'Move the token to the matching category.',
        'games.categoryMatch.greatMatch': 'Great match!',
        'games.categoryMatch.tryDifferent': 'Try a different category.',
      };

      return translations[key] ?? key;
    },
  }),
}));

jest.mock('../utils/sounds', () => ({
  playFlipSound: (...args: unknown[]) => mockPlayFlipSound(...args),
  playMatchSound: (...args: unknown[]) => mockPlayMatchSound(...args),
}));

jest.mock('../utils/categoryMatchLogic', () => {
  const actual = jest.requireActual('../utils/categoryMatchLogic');
  return {
    ...actual,
    createCategoryMatchRound: (...args: unknown[]) => mockCreateCategoryMatchRound(...args),
  };
});

describe('CategoryMatchBoard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    jest.spyOn(PanResponder, 'create').mockImplementation(
      (handlers: any) =>
        ({
          panHandlers: handlers,
        }) as any,
    );

    mockCreateCategoryMatchRound.mockReturnValue({
      item: {
        emoji: '☀️',
        name: 'sun',
        color: '#FFFACD',
        category: 'sky',
      },
      categories: CATEGORY_MATCH_CATEGORIES,
    });
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('highlights the hovered zone, reports correct drops, and resets styling after incorrect drops', () => {
    const onCorrectMatch = jest.fn();
    const onIncorrectMatch = jest.fn();
    const screen = render(
      <CategoryMatchBoard
        width={360}
        height={480}
        onCorrectMatch={onCorrectMatch}
        onIncorrectMatch={onIncorrectMatch}
      />,
    );

    const token = screen.getByTestId('category-draggable-token');

    act(() => {
      token.props.onPanResponderMove?.({}, { dx: -116, dy: 293 });
    });

    expect(screen.getByTestId('category-zone-sky').props.style).toEqual(
      expect.arrayContaining([expect.objectContaining({ borderColor: '#A8D8EA' })]),
    );

    act(() => {
      token.props.onPanResponderRelease?.({}, { dx: -116, dy: 293 });
    });

    expect(onCorrectMatch).toHaveBeenCalledWith(
      expect.objectContaining({ emoji: '☀️', category: 'sky' }),
      'sky',
    );

    act(() => {
      token.props.onPanResponderMove?.({}, { dx: -10, dy: 293 });
      token.props.onPanResponderRelease?.({}, { dx: -10, dy: 293 });
    });

    expect(onIncorrectMatch).toHaveBeenCalledTimes(1);
    expect(screen.getByText('Try a different category.')).toBeTruthy();

    act(() => {
      jest.advanceTimersByTime(850);
    });

    expect(screen.queryByText('Try a different category.')).toBeNull();
    expect(screen.getByTestId('category-zone-land').props.style).not.toEqual(
      expect.arrayContaining([expect.objectContaining({ borderColor: '#A8D8EA' })]),
    );
  });

  it('supports tap-to-select followed by category activation with the same scoring path', () => {
    const onCorrectMatch = jest.fn();
    const screen = render(
      <CategoryMatchBoard width={360} height={480} onCorrectMatch={onCorrectMatch} />,
    );
    const token = screen.getByTestId('category-draggable-token');
    const sky = screen.getByTestId('category-zone-sky');

    expect(token.props.accessibilityRole).toBe('button');
    expect(token.props.accessibilityState).toEqual({ selected: false });
    expect(sky.props.accessibilityRole).toBe('button');
    expect(sky.props.accessibilityHint).toBe('Select the item first, then activate this category.');

    act(() => {
      fireEvent.press(token);
    });
    expect(screen.getByTestId('category-draggable-token').props.accessibilityState).toEqual({
      selected: true,
    });

    act(() => {
      // Pressable's onPress is also the keyboard/switch activation path.
      fireEvent.press(sky);
    });

    expect(onCorrectMatch).toHaveBeenCalledWith(
      expect.objectContaining({ emoji: '☀️', category: 'sky' }),
      'sky',
    );
    expect(mockPlayMatchSound).toHaveBeenCalled();
    expect(screen.getByText('Great match!')).toBeTruthy();
  });

  it('reports a wrong activated category and exposes polite live feedback', () => {
    const onIncorrectMatch = jest.fn();
    const screen = render(
      <CategoryMatchBoard width={360} height={480} onIncorrectMatch={onIncorrectMatch} />,
    );

    act(() => {
      fireEvent.press(screen.getByTestId('category-draggable-token'));
    });
    act(() => {
      fireEvent.press(screen.getByTestId('category-zone-land'));
    });

    expect(onIncorrectMatch).toHaveBeenCalledTimes(1);
    const feedback = screen.getByText('Try a different category.');
    expect(feedback.props.accessibilityLiveRegion).toBe('polite');
    expect(feedback.props.accessibilityRole).toBe('text');
  });

  it('clears feedback timers on unmount before delayed feedback completes', () => {
    const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');
    const screen = render(
      <CategoryMatchBoard width={360} height={480} onIncorrectMatch={jest.fn()} />,
    );
    const token = screen.getByTestId('category-draggable-token');

    act(() => {
      token.props.onPanResponderMove?.({}, { dx: -10, dy: 293 });
      token.props.onPanResponderRelease?.({}, { dx: -10, dy: 293 });
    });

    screen.unmount();

    expect(clearTimeoutSpy).toHaveBeenCalled();

    act(() => {
      jest.runOnlyPendingTimers();
    });
  });
});
