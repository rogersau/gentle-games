import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { Linking, StyleSheet } from 'react-native';
import { HomeScreen } from './HomeScreen';
import { APP_ROUTES } from '../types/navigation';
import { openExternalUrl } from '../utils/externalLinks';

const mockNavigate = jest.fn();
const mockUpdateSettings = jest.fn().mockResolvedValue(undefined);
const mockOpenExternalUrl = openExternalUrl as jest.MockedFunction<typeof openExternalUrl>;
let mockSettings = {
  animationsEnabled: true,
  soundEnabled: true,
  soundVolume: 0.5,
  difficulty: 'medium' as const,
  enableUnfinishedGames: true,
  theme: 'mixed' as const,
  showCardPreview: true,
  keepyUppyEasyMode: true,
  colorMode: 'system' as const,
  hiddenGames: [] as string[],
  parentTimerMinutes: 0,
};

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: mockNavigate,
  }),
}));

jest.mock('../context/SettingsContext', () => ({
  useSettings: () => ({
    settings: mockSettings,
    updateSettings: mockUpdateSettings,
  }),
}));

jest.mock('../utils/theme', () => ({
  useThemeColors: () => ({
    colors: { background: '#FFFEF7', text: '#5A5A5A' },
    resolvedMode: 'light',
  }),
  useReducedMotion: () => false,
}));

jest.mock('../utils/externalLinks', () => ({
  openExternalUrl: jest.fn(),
}));

jest.mock('../context/MochiContext', () => ({
  useMochiContext: () => ({
    mochiProps: { variant: 'idle', visible: false, phrase: null },
    showMochi: jest.fn(),
    hideMochi: jest.fn(),
    celebrate: jest.fn(),
  }),
}));

describe('HomeScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockOpenExternalUrl.mockResolvedValue('opened');
    jest.spyOn(Linking, 'openURL').mockResolvedValue(undefined);
    mockSettings = {
      animationsEnabled: true,
      soundEnabled: true,
      soundVolume: 0.5,
      difficulty: 'medium',
      enableUnfinishedGames: true,
      theme: 'mixed',
      showCardPreview: true,
      keepyUppyEasyMode: true,
      colorMode: 'system',
      hiddenGames: [],
      parentTimerMinutes: 0,
    };
  });

  it('navigates directly to Drawing screen when Drawing Pad is selected', () => {
    jest.useFakeTimers();
    const screen = render(<HomeScreen />);
    fireEvent.press(screen.getByText('Drawing Pad'));
    jest.advanceTimersByTime(300);
    expect(mockNavigate).toHaveBeenCalledWith(APP_ROUTES.Drawing);
    jest.useRealTimers();
  });

  it('navigates directly to Glitter screen when Glitter Fall is selected', () => {
    jest.useFakeTimers();
    const screen = render(<HomeScreen />);
    fireEvent.press(screen.getByText('Glitter Fall'));
    jest.advanceTimersByTime(300);
    expect(mockNavigate).toHaveBeenCalledWith(APP_ROUTES.Glitter);
    jest.useRealTimers();
  });

  it('navigates directly to Bubble screen when Bubble Pop is selected', () => {
    jest.useFakeTimers();
    const screen = render(<HomeScreen />);
    fireEvent.press(screen.getByText('Bubble Pop'));
    jest.advanceTimersByTime(300);
    expect(mockNavigate).toHaveBeenCalledWith(APP_ROUTES.Bubble);
    jest.useRealTimers();
  });

  it('navigates directly to Category Match screen when Category Match is selected', () => {
    jest.useFakeTimers();
    const screen = render(<HomeScreen />);
    fireEvent.press(screen.getByText('Category Match'));
    jest.advanceTimersByTime(300);
    expect(mockNavigate).toHaveBeenCalledWith(APP_ROUTES.CategoryMatch);
    jest.useRealTimers();
  });

  it('navigates directly to Keepy Uppy screen when Keepy Uppy is selected', () => {
    jest.useFakeTimers();
    const screen = render(<HomeScreen />);
    fireEvent.press(screen.getByText('Keepy Uppy'));
    jest.advanceTimersByTime(300);
    expect(mockNavigate).toHaveBeenCalledWith(APP_ROUTES.KeepyUppy);
    jest.useRealTimers();
  });

  it('shows registry direct-launch games even when unfinished games are disabled', () => {
    mockSettings = { ...mockSettings, enableUnfinishedGames: false };
    const screen = render(<HomeScreen />);

    expect(screen.getByText('Drawing Pad')).toBeTruthy();
    expect(screen.getByText('Keepy Uppy')).toBeTruthy();
    expect(screen.queryByText('Number Picnic')).toBeNull();
  });

  it('shows difficulty modal for Memory Snap and navigates to Game after selection', async () => {
    const screen = render(<HomeScreen />);

    // GameCard wraps content in TouchableOpacity with accessibility label
    const memorySnapCard = screen
      .getAllByRole('button')
      .find((el: any) => el.props.accessibilityLabel?.includes('Memory Snap'));
    expect(memorySnapCard).toBeTruthy();
    fireEvent.press(memorySnapCard!);
    expect(screen.getByText(/Select difficulty/)).toBeTruthy();

    // Find the Hard difficulty button
    const hardButton = screen
      .getAllByRole('button')
      .find((el: any) => el.props.accessibilityLabel?.includes('Hard'));
    expect(hardButton).toBeTruthy();
    fireEvent.press(hardButton!);

    await waitFor(() => {
      expect(mockUpdateSettings).toHaveBeenCalledWith({ difficulty: 'hard' });
      expect(mockNavigate).toHaveBeenCalledWith(APP_ROUTES.Game);
    });
  });

  it('navigates to Settings through the shared app route contract', () => {
    const screen = render(<HomeScreen />);

    fireEvent.press(screen.getByLabelText('⚙️  Settings'));

    expect(mockNavigate).toHaveBeenCalledWith(APP_ROUTES.Settings);
  });

  it('hides games listed in hiddenGames setting', () => {
    mockSettings = { ...mockSettings, hiddenGames: ['drawing', 'bubble-pop'] };
    const screen = render(<HomeScreen />);

    expect(screen.queryByText('Drawing Pad')).toBeNull();
    expect(screen.queryByText('Bubble Pop')).toBeNull();
    expect(screen.getByText('Memory Snap')).toBeTruthy();
    expect(screen.getByText('Glitter Fall')).toBeTruthy();
    expect(screen.getByText('Category Match')).toBeTruthy();
    expect(screen.getByText('Keepy Uppy')).toBeTruthy();
  });

  it('game list container uses flex to fill available space', () => {
    const screen = render(<HomeScreen />);
    const gamesContainer = screen.getByTestId('home-games-container');
    const { flex, maxHeight } = StyleSheet.flatten(gamesContainer.props.style);

    expect(flex).toBe(1);
    expect(maxHeight).toBeUndefined();
  });

  it('routes website link presses through openExternalUrl', async () => {
    const screen = render(<HomeScreen />);

    fireEvent.press(screen.getByRole('link'));

    await waitFor(() => {
      expect(mockOpenExternalUrl).toHaveBeenCalledWith('https://gentlegames.org');
    });
    expect(Linking.openURL).not.toHaveBeenCalled();
  });

  it.each(['unsupported', 'failed'] as const)(
    'shows a calm website fallback modal when the helper returns %s',
    async (result) => {
      mockOpenExternalUrl.mockResolvedValue(result);
      const screen = render(<HomeScreen />);

      fireEvent.press(screen.getByRole('link'));

      await waitFor(() => {
        expect(screen.getByText('Website unavailable')).toBeTruthy();
        expect(
          screen.getByText(
            "We couldn't open the Gentle Games website right now. Please try again later.",
          ),
        ).toBeTruthy();
      });

      expect(screen.queryByText(/exploded|Error:|TypeError/i)).toBeNull();
      expect(Linking.openURL).not.toHaveBeenCalled();
    },
  );

});
