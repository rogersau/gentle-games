import React from 'react';
import { act, fireEvent, render } from '@testing-library/react-native';
import { StyleSheet, AccessibilityInfo } from 'react-native';
import { HomeScreen } from './HomeScreen';
import * as registry from '../games/registry';
import { APP_ROUTES } from '../types/navigation';

const mockNavigate = jest.fn();
let mockFocusCallback: (() => void) | undefined;
const mockUpdateSettings = jest.fn().mockResolvedValue(undefined);
let mockSettings = {
  movement: 'lively' as 'lively' | 'gentle' | 'still',
  grownUpsHoldGate: true,
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
    mockUpdateSettings.mockResolvedValue(undefined);
    mockGetVisibleGames.mockImplementation(actualRegistry.getVisibleGames);
    mockGetGameRoute.mockImplementation(actualRegistry.getGameRoute);
    mockSettings = {
      movement: 'lively' as 'lively' | 'gentle' | 'still',
      grownUpsHoldGate: true,
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

  it('presents the picture shelf without tile descriptions or an external link', () => {
    mockSettings.enableUnfinishedGames = false;
    const screen = render(<HomeScreen />);
    expect(screen.getByRole('header', { name: 'Hello!' })).toBeTruthy();
    expect(screen.getByText('What shall we play?')).toBeTruthy();
    expect(screen.getAllByTestId(/^home-game-/)).toHaveLength(8);
    expect(screen.getByRole('button', { name: 'Memory Snap. Find matching pairs' })).toBeTruthy();
    expect(screen.queryByText('Find matching pairs')).toBeNull();
    expect(screen.queryByRole('link')).toBeNull();
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

  it('shows finished direct-launch games while keeping unfinished games hidden', () => {
    mockSettings = { ...mockSettings, enableUnfinishedGames: false };
    const screen = render(<HomeScreen />);

    expect(screen.getByText('Drawing Pad')).toBeTruthy();
    expect(screen.getByText('Keepy Uppy')).toBeTruthy();
    expect(screen.queryByText('Number Picnic')).toBeNull();
  });

  it('opens Memory immediately without replacing the saved board size', () => {
    const screen = render(<HomeScreen />);
    fireEvent.press(screen.getByTestId('home-game-memory-snap'));
    expect(mockNavigate).toHaveBeenCalledWith(APP_ROUTES.Game);
    expect(mockUpdateSettings).not.toHaveBeenCalled();
    expect(screen.queryByText(/Select difficulty/)).toBeNull();
  });

  it('cancels an early release and opens settings only after the hold', () => {
    jest.useFakeTimers();
    try {
      const screen = render(<HomeScreen />);
      const gate = screen.getByTestId('home-grown-ups');
      fireEvent(gate, 'pressIn');
      act(() => jest.advanceTimersByTime(1000));
      expect(screen.getByText('Keep holding…', { includeHiddenElements: true })).toBeTruthy();
      fireEvent(gate, 'pressOut');
      fireEvent.press(gate);
      expect(mockNavigate).not.toHaveBeenCalled();
      expect(screen.queryByText('Keep holding…', { includeHiddenElements: true })).toBeNull();
      fireEvent(gate, 'pressIn');
      act(() => jest.advanceTimersByTime(3000));
      expect(gate.props).toBeDefined();
      fireEvent(gate, 'longPress');
      expect(mockNavigate).toHaveBeenCalledWith(APP_ROUTES.Settings);
    } finally {
      jest.useRealTimers();
    }
  });

  it('supports accessible activation with a quick sum and no time limit', async () => {
    const screenReader = jest
      .spyOn(AccessibilityInfo, 'isScreenReaderEnabled')
      .mockResolvedValue(true);
    const random = jest.spyOn(Math, 'random').mockReturnValue(0.5);
    try {
      const screen = render(<HomeScreen />);
      const gate = screen.getByTestId('home-grown-ups');
      await act(async () => {});
      fireEvent.press(gate);
      expect(screen.getByText('32 + 26 = ?')).toBeTruthy();
      const input = screen.getByTestId('grown-ups-answer');
      fireEvent.changeText(input, '0');
      fireEvent(input, 'submitEditing');
      expect(mockNavigate).not.toHaveBeenCalled();
      fireEvent.changeText(input, '58');
      fireEvent(input, 'submitEditing');
      expect(mockNavigate).toHaveBeenCalledWith(APP_ROUTES.Settings);
    } finally {
      screenReader.mockRestore();
      random.mockRestore();
    }
  });

  it('opens settings on a tap for a family that turns the gate off', () => {
    mockSettings.grownUpsHoldGate = false;
    const screen = render(<HomeScreen />);
    fireEvent.press(screen.getByTestId('home-grown-ups'));
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

    expect(
      screen.getByText('No games are on the shelf. A grown-up can add them back.'),
    ).toBeTruthy();
    expect(screen.queryByTestId('home-game-memory-snap')).toBeNull();
  });

  it('game list container uses flex to fill available space', () => {
    const screen = render(<HomeScreen />);
    const gamesContainer = screen.getByTestId('home-games-container');
    const { flex, maxHeight } = StyleSheet.flatten(gamesContainer.props.style);

    expect(flex).toBe(1);
    expect(maxHeight).toBeUndefined();
  });
});
