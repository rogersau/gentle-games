import React from 'react';
import { PanResponder, StyleSheet } from 'react-native';
import { act, fireEvent, render } from '@testing-library/react-native';
import { CategoryMatchBoard } from './CategoryMatchBoard';

const mockPlayMatchSound = jest.fn();

jest.mock('../context/SettingsContext', () => ({
  useSettings: () => ({
    settings: { soundEnabled: true, soundVolume: 0.5, animationsEnabled: false },
  }),
}));

jest.mock('../utils/theme', () => ({
  useReducedMotion: () => false,
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
  }),
}));

jest.mock('../ui/animations', () => ({
  useAnimationEnabled: () => false,
  useScalePress: () => ({ scale: 1, onPressIn: jest.fn(), onPressOut: jest.fn() }),
}));
jest.mock('../utils/sounds', () => ({
  playMatchSound: (...args: unknown[]) => mockPlayMatchSound(...args),
}));
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) => {
      const values: Record<string, string> = {
        'games.categoryMatch.sortingInstruction': 'Put the picture with things like it.',
        'games.categoryMatch.interactionInstruction': 'Tap a group, or drag the picture to it.',
        'games.categoryMatch.hint': 'Look at the item type, then choose its group.',
        'games.categoryMatch.itemAccessibilityLabel': `${String(options?.item)} item`,
        'games.categoryMatch.selectItemHint': 'Tap to select the picture, or drag it to a group',
        'games.categoryMatch.categoryAccessibilityLabel': `${String(options?.category)} category`,
        'games.categoryMatch.categoryActivationHint': 'Put this picture in this group',
        'games.categoryMatch.correctFeedback': `${String(options?.item)} belongs in ${String(options?.category)}.`,
        'games.categoryMatch.incorrectFeedback': 'Try another group.',
        'games.categoryMatch.model': `Model: ${String(options?.item)} belongs in ${String(options?.category)}. Now place it there.`,
        'games.categoryMatch.modelAccessibilityLabel': `Model: ${String(options?.item)} belongs in ${String(options?.category)}.`,
        'games.categoryMatch.showHint': 'Show a hint',
        'games.categoryMatch.replay': 'Show the rule again',
        'games.categoryMatch.skip': 'Skip',
        'games.categoryMatch.skippedFeedback': `${String(options?.item)} was skipped. Choose Next when you are ready.`,
        'games.categoryMatch.next': 'Next item',
        'games.categoryMatch.nextHint': 'Show a new item using the same sorting rule',
        'games.categoryMatch.categories.food': 'Food',
        'games.categoryMatch.categories.toys': 'Toys',
        'games.categoryMatch.categories.clothes': 'Clothes',
        'games.categoryMatch.items.apple': 'apple',
        'games.categoryMatch.items.banana': 'banana',
        'games.categoryMatch.items.teddy': 'teddy bear',
      };
      return values[key] ?? key;
    },
  }),
}));

const touch = (pageX: number, pageY: number, count = 1) => ({
  nativeEvent: {
    pageX,
    pageY,
    locationX: 4,
    locationY: 40,
    touches: Array.from({ length: count }),
  },
});

const layOutDragTargets = (screen: ReturnType<typeof render>) => {
  const layout = (id: string, x: number, y: number, width: number, height: number) => {
    fireEvent(screen.getByTestId(id), 'layout', {
      nativeEvent: { layout: { x, y, width, height } },
    });
  };
  layout('category-drag-surface', 126, 0, 84, 84);
  layout('category-zone-row', 0, 100, 308, 96);
  layout('category-zone-food', 0, 0, 150, 96);
  layout('category-zone-toys', 158, 0, 150, 96);
};

describe('CategoryMatchBoard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Math, 'random').mockReturnValue(0);
    jest
      .spyOn(PanResponder, 'create')
      .mockImplementation((handlers: any) => ({ panHandlers: handlers }) as any);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('explains tap and drag and exposes item and category accessibility labels', () => {
    const screen = render(<CategoryMatchBoard width={360} height={480} />);

    expect(screen.getByText('Tap a group, or drag the picture to it.')).toBeTruthy();
    expect(screen.getByTestId('category-draggable-token').props.accessibilityLabel).toBe(
      'apple item',
    );
    expect(screen.getByTestId('category-zone-food').props.accessibilityLabel).toBe('Food category');
    expect(screen.getByTestId('category-zone-toys').props.accessibilityRole).toBe('button');
  });

  it('accepts a group tap and keeps the match visible until the player chooses Next', () => {
    const onCorrectMatch = jest.fn();
    const screen = render(
      <CategoryMatchBoard width={360} height={480} onCorrectMatch={onCorrectMatch} />,
    );
    fireEvent.press(screen.getByTestId('category-zone-food'));
    expect(onCorrectMatch).toHaveBeenCalledTimes(1);
    expect(mockPlayMatchSound).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId('category-zone-food')).toBeDisabled();
    expect(screen.getByTestId('category-zone-toys')).toBeDisabled();
    expect(screen.getByText('✓', { includeHiddenElements: true })).toBeTruthy();
    expect(screen.getByTestId('category-draggable-token')).toHaveAccessibleName('apple item');

    fireEvent.press(screen.getByTestId('category-match-next'));
    expect(screen.getByTestId('category-draggable-token')).toHaveAccessibleName('banana item');
    expect(screen.queryByText('✓', { includeHiddenElements: true })).toBeNull();
    expect(screen.getByTestId('category-zone-food')).toBeEnabled();
  });

  it('scores the finger release on a measured group even when the picture center is elsewhere', () => {
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
    layOutDragTargets(screen);
    const drag = screen.getByTestId('category-drag-surface').props;
    expect(drag.onStartShouldSetPanResponderCapture(touch(300, 100))).toBe(false);
    expect(drag.onMoveShouldSetPanResponder(touch(304, 100))).toBe(false);
    expect(drag.onMoveShouldSetPanResponder(touch(300, 110))).toBe(true);
    act(() => {
      drag.onPanResponderGrant(touch(300, 110));
      drag.onPanResponderMove(touch(335, 175));
    });
    expect(StyleSheet.flatten(screen.getByTestId('category-zone-toys').props.style)).toMatchObject({
      borderColor: '#5A5A5A',
    });
    act(() => drag.onPanResponderRelease(touch(318, 171, 0)));
    expect(onCorrectMatch).toHaveBeenCalledWith(expect.objectContaining({ id: 'apple' }), 'food');
    expect(onIncorrectMatch).not.toHaveBeenCalled();
  });

  it.each(['outside the groups', 'after cancellation', 'after a second finger lands'])(
    'keeps the round when dragging ends %s',
    (end) => {
      const onIncorrectMatch = jest.fn();
      const screen = render(
        <CategoryMatchBoard width={360} height={480} onIncorrectMatch={onIncorrectMatch} />,
      );
      layOutDragTargets(screen);
      const drag = screen.getByTestId('category-drag-surface').props;
      act(() => {
        drag.onStartShouldSetPanResponderCapture(touch(300, 100));
        drag.onPanResponderGrant(touch(300, 110));
        drag.onPanResponderMove(touch(335, 175));
        if (end === 'after cancellation') {
          drag.onPanResponderTerminate();
        } else {
          if (end === 'after a second finger lands') drag.onPanResponderStart(touch(335, 175, 2));
          drag.onPanResponderRelease(
            end === 'outside the groups' ? touch(322, 175, 0) : touch(335, 175, 0),
          );
        }
      });
      expect(screen.queryByTestId('category-match-feedback')).toBeNull();
      expect(screen.queryByTestId('category-match-next')).toBeNull();
      expect(screen.getByTestId('category-draggable-token')).toHaveAccessibleName('apple item');
      expect(
        StyleSheet.flatten(screen.getByTestId('category-zone-toys').props.style),
      ).toMatchObject({
        borderColor: '#E8E4E1',
      });
      expect(onIncorrectMatch).not.toHaveBeenCalled();
      expect(mockPlayMatchSound).not.toHaveBeenCalled();
    },
  );

  it('progresses independent, hinted, modelled, and corrected stages with explanatory feedback', () => {
    const screen = render(<CategoryMatchBoard width={360} height={480} />);
    const choose = (testID: string) => {
      fireEvent.press(screen.getByTestId('category-draggable-token'));
      fireEvent.press(screen.getByTestId(testID));
    };

    choose('category-zone-toys');
    expect(screen.getByTestId('category-match-feedback')).toHaveTextContent('Try another group.');
    expect(screen.getByTestId('category-match-retry-cue')).toBeTruthy();
    choose('category-zone-toys');
    expect(screen.getByText('Model: apple belongs in Food. Now place it there.')).toBeTruthy();
    expect(StyleSheet.flatten(screen.getByTestId('category-zone-food').props.style)).toMatchObject({
      borderStyle: 'dashed',
    });
    choose('category-zone-food');
    expect(screen.getByTestId('category-match-feedback').props.children).toBe(
      'apple belongs in Food.',
    );
    expect(screen.getByTestId('category-match-next')).toBeTruthy();
  });

  it('supports the explicit three-category setting without adding a starter category', () => {
    const screen = render(<CategoryMatchBoard width={360} height={480} categoryCount={3} />);
    expect(screen.getByTestId('category-zone-clothes')).toBeTruthy();
  });

  it('allows Skip and Next without scoring, streaks, or item elimination', () => {
    const screen = render(<CategoryMatchBoard width={360} height={480} />);
    fireEvent.press(screen.getByText('Skip'));
    expect(screen.getByTestId('category-match-feedback').props.children).toContain(
      'apple was skipped',
    );
    fireEvent.press(screen.getByTestId('category-match-next'));
    expect(screen.queryByText(/streak/i)).toBeNull();
    expect(screen.queryByText(/Correct:/i)).toBeNull();
  });
});
