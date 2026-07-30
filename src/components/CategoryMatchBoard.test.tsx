import React from 'react';
import { PanResponder } from 'react-native';
import { act, fireEvent, render } from '@testing-library/react-native';
import { CategoryMatchBoard } from './CategoryMatchBoard';

const mockPlayMatchSound = jest.fn();

jest.mock('../context/SettingsContext', () => ({
  useSettings: () => ({
    settings: { soundEnabled: true, soundVolume: 0.5, animationsEnabled: false },
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
        'games.categoryMatch.sortingInstruction': `Sorting rule: item type. Choose ${String(options?.categories ?? '')}.`,
        'games.categoryMatch.hint': 'Look at the item type, then choose its group.',
        'games.categoryMatch.itemAccessibilityLabel': `${String(options?.item)} item`,
        'games.categoryMatch.selectItemHint': 'Tap to select this item, then activate a category',
        'games.categoryMatch.selectItemFirst': 'Select the item before choosing a category',
        'games.categoryMatch.categoryAccessibilityLabel': `${String(options?.category)} category`,
        'games.categoryMatch.categoryActivationHint': 'Activate to place the selected item here',
        'games.categoryMatch.correctFeedback': `${String(options?.item)} belongs in ${String(options?.category)}.`,
        'games.categoryMatch.incorrectFeedback': `${String(options?.item)} does not belong in ${String(options?.chosenCategory)}. It belongs in ${String(options?.correctCategory)}.`,
        'games.categoryMatch.model': `Model: ${String(options?.item)} belongs in ${String(options?.category)}. Now place it there.`,
        'games.categoryMatch.modelAccessibilityLabel': `Model: ${String(options?.item)} belongs in ${String(options?.category)}.`,
        'games.categoryMatch.showHint': 'Show a hint',
        'games.categoryMatch.replay': 'Hear the rule again',
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

  it('states the sorting attribute and exposes item and category accessibility labels', () => {
    const screen = render(<CategoryMatchBoard width={360} height={480} />);

    expect(screen.getByText('Sorting rule: item type. Choose Food, Toys.')).toBeTruthy();
    expect(screen.getByTestId('category-draggable-token').props.accessibilityLabel).toBe(
      'apple item',
    );
    expect(screen.getByTestId('category-zone-food').props.accessibilityLabel).toBe('Food category');
    expect(screen.getByTestId('category-zone-toys').props.accessibilityRole).toBe('button');
  });

  it('uses the same answer path for tap activation and drag release', () => {
    const onCorrectMatch = jest.fn();
    const screen = render(
      <CategoryMatchBoard width={360} height={480} onCorrectMatch={onCorrectMatch} />,
    );
    const token = screen.getByTestId('category-draggable-token');
    fireEvent.press(token);
    fireEvent.press(screen.getByTestId('category-zone-food'));
    expect(onCorrectMatch).toHaveBeenCalledTimes(1);
    expect(mockPlayMatchSound).toHaveBeenCalledTimes(1);

    fireEvent.press(screen.getByTestId('category-match-next'));
    const nextToken = screen.getByTestId('category-draggable-token');
    act(() => {
      nextToken.props.onPanResponderMove({}, { dx: -86, dy: 128 });
      nextToken.props.onPanResponderRelease({}, { dx: -86, dy: 128 });
    });
    expect(onCorrectMatch).toHaveBeenCalledTimes(2);
  });

  it('progresses independent, hinted, modelled, and corrected stages with explanatory feedback', () => {
    const screen = render(<CategoryMatchBoard width={360} height={480} />);
    const choose = (testID: string) => {
      fireEvent.press(screen.getByTestId('category-draggable-token'));
      fireEvent.press(screen.getByTestId(testID));
    };

    choose('category-zone-toys');
    expect(screen.getByTestId('category-match-feedback').props.children).toContain(
      'apple does not belong in Toys',
    );
    choose('category-zone-toys');
    expect(screen.getByText('Model: apple belongs in Food. Now place it there.')).toBeTruthy();
    choose('category-zone-food');
    expect(screen.getByTestId('category-match-feedback').props.children).toBe(
      'apple belongs in Food.',
    );
    expect(screen.getByTestId('category-match-next')).toBeTruthy();
  });

  it('supports the explicit three-category setting without adding a starter category', () => {
    const screen = render(<CategoryMatchBoard width={360} height={480} categoryCount={3} />);
    expect(screen.getByText('Sorting rule: item type. Choose Food, Toys, Clothes.')).toBeTruthy();
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
