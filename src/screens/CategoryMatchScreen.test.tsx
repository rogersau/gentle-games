import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { CategoryMatchScreen } from './CategoryMatchScreen';

const mockGoBack = jest.fn();
let mockSettings: any = {
  pressureFreeMode: true,
  gameSettings: { 'category-match': { categoryCount: 2 as const, showPreview: true } },
};

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

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) =>
      ({
        'common.back': '← Back',
        'games.categoryMatch.title': 'Category Match',
        'games.categoryMatch.quickPreview': 'Quick Preview',
        'games.categoryMatch.previewInstruction':
          'The sorting rule is item type. Choose the matching group.',
        'games.categoryMatch.startSorting': 'Start Sorting',
        'games.categoryMatch.startSortingHint': 'Begin the category sorting game',
        'games.categoryMatch.categories.food': 'Food',
        'games.categoryMatch.categories.toys': 'Toys',
        'games.categoryMatch.categories.clothes': 'Clothes',
      })[key] ?? key,
  }),
}));

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ goBack: mockGoBack }),
}));

jest.mock('../context/SettingsContext', () => ({
  useSettings: () => ({ settings: mockSettings }),
}));

jest.mock('../components/CategoryMatchBoard', () => {
  const { Text, View } = require('react-native');
  return {
    CategoryMatchBoard: ({ categoryCount }: { categoryCount: number }) => (
      <View testID='category-board'>
        <Text>{`category-count-${categoryCount}`}</Text>
      </View>
    ),
  };
});

describe('CategoryMatchScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSettings = {
      pressureFreeMode: true,
      gameSettings: { 'category-match': { categoryCount: 2, showPreview: true } },
    };
  });

  it('keeps the starter preview to two explicit groups and has no pressure metrics', () => {
    const screen = render(<CategoryMatchScreen />);
    expect(screen.getByText('Food')).toBeTruthy();
    expect(screen.getByText('Toys')).toBeTruthy();
    expect(screen.queryByText('Clothes')).toBeNull();
    expect(screen.queryByText(/Correct/i)).toBeNull();
    expect(screen.queryByText(/streak/i)).toBeNull();
  });

  it('starts the configured two-group game and preserves the single back path', () => {
    const screen = render(<CategoryMatchScreen />);
    fireEvent.press(screen.getByText('Start Sorting'));
    expect(screen.getByTestId('category-board')).toBeTruthy();
    expect(screen.getByText('category-count-2')).toBeTruthy();
    fireEvent.press(screen.getByText('← Back'));
    expect(mockGoBack).toHaveBeenCalledTimes(1);
  });

  it('shows the third category only after the explicit three-group setting', () => {
    mockSettings.gameSettings['category-match'].categoryCount = 3;
    const screen = render(<CategoryMatchScreen />);
    expect(screen.getByText('Clothes')).toBeTruthy();
    fireEvent.press(screen.getByText('Start Sorting'));
    expect(screen.getByText('category-count-3')).toBeTruthy();
  });
});
