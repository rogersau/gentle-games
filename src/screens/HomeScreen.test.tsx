import React from 'react';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import { Linking, StyleSheet } from 'react-native';
import { HomeScreen } from './HomeScreen';
import type { GameDefinition } from '../games/registry';
import * as registry from '../games/registry';
import { APP_ROUTES } from '../types/navigation';
import { openExternalUrl } from '../utils/externalLinks';
import { GAME_OUTCOMES } from '../games/outcomes';

const mockNavigate = jest.fn();
let mockFocusCallback: (() => void) | undefined;
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
  useFocusEffect: (callback: () => void) => {
    mockFocusCallback = callback;
  },
}));

jest.mock('../context/SettingsContext', () => ({
  useSettings: () => ({
    settings: mockSettings,
    updateGameSettings: mockUpdateSettings,
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

jest.mock('../games/registry', () => {
  const actual = jest.requireActual('../games/registry');

  return {
    ...actual,
    getVisibleGames: jest.fn(actual.getVisibleGames),
    getGameRoute: jest.fn(actual.getGameRoute),
  };
});

jest.mock('../context/MochiContext', () => ({
  useMochiContext: () => ({
    mochiProps: { variant: 'idle', visible: false, phrase: null },
    showMochi: jest.fn(),
    hideMochi: jest.fn(),
    celebrate: jest.fn(),
  }),
}));

const actualRegistry = jest.requireActual(
  '../games/registry',
) as typeof import('../games/registry');
const mockGetVisibleGames = jest.mocked(registry.getVisibleGames);
const mockGetGameRoute = jest.mocked(registry.getGameRoute);

describe('HomeScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockOpenExternalUrl.mockResolvedValue('opened');
    mockUpdateSettings.mockResolvedValue(undefined);
    mockGetVisibleGames.mockImplementation(actualRegistry.getVisibleGames);
    mockGetGameRoute.mockImplementation(actualRegistry.getGameRoute);
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

  it('presents the calm single-column home introduction', () => {
    const screen = render(<HomeScreen />);

    expect(screen.getByRole('header', { name: 'Gentle Games' })).toBeTruthy();
    expect(screen.getByText('Choose something gentle')).toBeTruthy();

    const drawingCard = screen.getByTestId('home-game-drawing');
    expect(StyleSheet.flatten(drawingCard.props.style)).toMatchObject({
      minHeight: 100,
      borderWidth: 1,
    });
  });

  it('navigates directly to Drawing screen when Drawing Pad is selected', () => {
    jest.useFakeTimers();
    const screen = render(<HomeScreen />);
    fireEvent.press(screen.getByText('Drawing Pad'));
    jest.advanceTimersByTime(300);
    expect(mockNavigate).toHaveBeenCalledWith(APP_ROUTES.Drawing);
    jest.useRealTimers();
  });

  it('ignores rapid repeated direct-launch presses', () => {
    jest.useFakeTimers();
    const screen = render(<HomeScreen />);
    const drawingCard = screen.getByText('Drawing Pad');

    fireEvent.press(drawingCard);
    fireEvent.press(drawingCard);

    expect(mockNavigate).toHaveBeenCalledTimes(1);
    expect(mockNavigate).toHaveBeenCalledWith(APP_ROUTES.Drawing);
    jest.useRealTimers();
  });

  it('allows another launch after Home regains focus', () => {
    const screen = render(<HomeScreen />);

    fireEvent.press(screen.getByText('Drawing Pad'));
    expect(mockNavigate).toHaveBeenLastCalledWith(APP_ROUTES.Drawing);

    act(() => mockFocusCallback?.());
    fireEvent.press(screen.getByText('Bubble Pop'));

    expect(mockNavigate).toHaveBeenCalledTimes(2);
    expect(mockNavigate).toHaveBeenLastCalledWith(APP_ROUTES.Bubble);
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
      expect(mockUpdateSettings).toHaveBeenCalledWith('memory-snap', { pairCount: 15 });
      expect(mockNavigate).toHaveBeenCalledWith(APP_ROUTES.Game);
    });
  });

  it('ignores repeated difficulty presses while settings are pending', async () => {
    let resolveSettings!: () => void;
    mockUpdateSettings.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          resolveSettings = resolve;
        }),
    );
    const screen = render(<HomeScreen />);
    fireEvent.press(screen.getByText('Memory Snap'));

    const hardButton = screen
      .getAllByRole('button')
      .find((el: any) => el.props.accessibilityLabel?.includes('Hard'));
    expect(hardButton).toBeTruthy();
    fireEvent.press(hardButton!);
    fireEvent.press(hardButton!);

    expect(mockUpdateSettings).toHaveBeenCalledTimes(1);
    expect(hardButton!.props.accessibilityState).toMatchObject({ disabled: true, busy: true });
    expect(mockNavigate).not.toHaveBeenCalled();

    await act(async () => {
      resolveSettings();
      await Promise.resolve();
    });
    expect(mockNavigate).toHaveBeenCalledTimes(1);
    expect(mockNavigate).toHaveBeenCalledWith(APP_ROUTES.Game);
  });

  it('resets the launch guard when saving difficulty fails', async () => {
    mockUpdateSettings.mockRejectedValueOnce(new Error('save failed'));
    const screen = render(<HomeScreen />);
    fireEvent.press(screen.getByText('Memory Snap'));
    const hardButton = screen
      .getAllByRole('button')
      .find((el: any) => el.props.accessibilityLabel?.includes('Hard'));
    fireEvent.press(hardButton!);

    await waitFor(() => expect(mockUpdateSettings).toHaveBeenCalledTimes(1));
    await waitFor(() => {
      const retryButton = screen
        .getAllByRole('button')
        .find((el: any) => el.props.accessibilityLabel?.includes('Hard'));
      expect(retryButton!.props.accessibilityState.disabled).toBe(false);
    });

    const retryButton = screen
      .getAllByRole('button')
      .find((el: any) => el.props.accessibilityLabel?.includes('Hard'));
    fireEvent.press(retryButton!);
    await waitFor(() => {
      expect(mockUpdateSettings).toHaveBeenCalledTimes(2);
      expect(mockNavigate).toHaveBeenCalledWith(APP_ROUTES.Game);
    });
  });

  it('does not navigate when a pending difficulty launch resolves after unmount', async () => {
    let resolveSettings!: () => void;
    mockUpdateSettings.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          resolveSettings = resolve;
        }),
    );
    const screen = render(<HomeScreen />);
    fireEvent.press(screen.getByText('Memory Snap'));
    const hardButton = screen
      .getAllByRole('button')
      .find((el: any) => el.props.accessibilityLabel?.includes('Hard'));
    fireEvent.press(hardButton!);
    screen.unmount();

    await act(async () => {
      resolveSettings();
      await Promise.resolve();
    });
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('routes difficulty-select games to their own route after picking a difficulty', async () => {
    const routedDifficultyGame: GameDefinition = {
      id: 'pattern-train',
      route: APP_ROUTES.PatternTrain,
      nameKey: 'games.patternTrain.name',
      descriptionKey: 'games.patternTrain.description',
      icon: '🚂',
      accentColor: '#A8DADC',
      isUnfinished: false,
      launchMode: 'difficulty-select',
      outcome: GAME_OUTCOMES['pattern-train'],
    };

    mockGetVisibleGames.mockReturnValue([routedDifficultyGame]);

    const screen = render(<HomeScreen />);

    fireEvent.press(screen.getByText('Pattern Train'));
    expect(screen.getByText(/Select difficulty/)).toBeTruthy();

    const easyButton = screen
      .getAllByRole('button')
      .find((el: any) => el.props.accessibilityLabel?.includes('Easy'));
    expect(easyButton).toBeTruthy();
    fireEvent.press(easyButton!);

    await waitFor(() => {
      expect(mockUpdateSettings).toHaveBeenCalledWith('memory-snap', { pairCount: 6 });
      expect(mockNavigate).toHaveBeenCalledWith(APP_ROUTES.PatternTrain);
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

  it('shows a calm empty state when every game is hidden', () => {
    mockSettings = {
      ...mockSettings,
      hiddenGames: actualRegistry.GAME_REGISTRY.map((game) => game.id),
    };
    const screen = render(<HomeScreen />);

    expect(screen.getByText('All games are hidden. Enable one in Settings.')).toBeTruthy();
    expect(screen.queryByTestId('home-game-memory-snap')).toBeNull();
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
