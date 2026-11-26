import React from 'react';
import { AccessibilityInfo } from 'react-native';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { SettingsScreen } from './SettingsScreen';
import type { GameId } from '../games/registry';
import type { AppStackParamList, SettingsPage } from '../types/navigation';
import { openExternalUrl } from '../utils/externalLinks';
import { DEFAULT_GAME_SETTINGS } from '../games/settings';
import { GLITTER_PRESETS } from '../games/glitterSettings';

const mockGoBack = jest.fn();
const mockPush = jest.fn();
const mockDone = jest.fn();
let mockParams: AppStackParamList['Settings'];
jest.mock('../utils/externalLinks', () => ({ openExternalUrl: jest.fn() }));
const renderPage = (page: SettingsPage, gameId?: GameId) => {
  mockParams = { page, gameId };
  return render(<SettingsScreen />);
};
const mockUpdateSettings = jest.fn();
let mockIsSaving = false;
let mockPersistenceError: string | null = null;
let mockSettings: any = {
  movement: 'lively',
  grownUpsHoldGate: true,
  soundEnabled: true,
  soundVolume: 0.5,
  difficulty: 'medium' as const,
  theme: 'mixed' as const,
  showCardPreview: true,
  keepyUppyEasyMode: true,
  colorMode: 'system' as const,
  hiddenGames: [] as string[],
  parentTimerMinutes: 0,
  enableUnfinishedGames: true,
  language: 'en-AU' as const,
  telemetryEnabled: false,
  showMochiInGames: true,
  pressureFreeMode: false,
};

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    goBack: mockGoBack,
    push: mockPush,
    popToTop: mockDone,
  }),
  useRoute: () => ({ params: mockParams }),
}));

jest.mock('../context/SettingsContext', () => ({
  useSettings: () => ({
    settings: mockSettings,
    updateSettings: mockUpdateSettings,
    updateGameSettings: mockUpdateSettings,
    isSaving: mockIsSaving,
    persistenceError: mockPersistenceError,
  }),
}));

describe('SettingsScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockParams = undefined;
    mockIsSaving = false;
    mockPersistenceError = null;
    mockSettings = {
      movement: 'lively',
      grownUpsHoldGate: true,
      soundEnabled: true,
      soundVolume: 0.5,
      difficulty: 'medium',
      theme: 'mixed',
      showCardPreview: true,
      keepyUppyEasyMode: true,
      colorMode: 'system',
      hiddenGames: [],
      parentTimerMinutes: 0,
      enableUnfinishedGames: true,
      language: 'en-AU',
      telemetryEnabled: false,
      showMochiInGames: true,
      pressureFreeMode: false,
    };
  });

  it('updates color mode from appearance options', () => {
    const screen = renderPage('appearance');
    fireEvent.press(screen.getByText('Dark'));

    expect(mockUpdateSettings).toHaveBeenCalledWith({ colorMode: 'dark' });
  });

  it('updates volume using controls', () => {
    const screen = render(React.createElement(SettingsScreen));

    fireEvent.press(screen.getByText('+'));

    expect(mockUpdateSettings).toHaveBeenCalledWith({ soundVolume: 0.6 });
  });

  it('updates Memory Snap preview setting', () => {
    const screen = renderPage('game', 'memory-snap');
    fireEvent.press(screen.getByRole('radio', { name: 'None' }));

    expect(mockUpdateSettings).toHaveBeenCalledWith('memory-snap', { previewMode: 'none' });
  });

  it('keeps Category Match at two groups by default and allows the explicit third group', () => {
    const screen = renderPage('game', 'category-match');
    expect(screen.getByRole('radio', { name: 'Two groups' })).toBeTruthy();
    fireEvent.press(screen.getByRole('radio', { name: 'Three groups' }));

    expect(mockUpdateSettings).toHaveBeenCalledWith('category-match', { categoryCount: 3 });
  });

  it('selects an Outdoors picture set independently of the group count', () => {
    const screen = renderPage('game', 'category-match');
    expect(screen.getByRole('radio', { name: 'Everyday things' })).toBeChecked();
    fireEvent.press(screen.getByRole('radio', { name: 'Outdoors' }));
    expect(mockUpdateSettings).toHaveBeenCalledWith('category-match', { pack: 'outdoors' });
  });

  it('persists Number Picnic quantity independently from global difficulty', () => {
    mockSettings.gameSettings = { ...DEFAULT_GAME_SETTINGS };
    const screen = renderPage('game', 'number-picnic');

    fireEvent.press(screen.getByRole('radio', { name: '6–10' }));

    expect(mockUpdateSettings).toHaveBeenCalledWith('number-picnic', {
      stage: '6-10',
      maxQuantity: 10,
      mode: 'make-amount',
    });
  });

  it('selects a Number Picnic mode and optional spoken counting independently', () => {
    mockSettings.gameSettings = { ...DEFAULT_GAME_SETTINGS };
    const screen = renderPage('game', 'number-picnic');

    fireEvent.press(screen.getByRole('radio', { name: 'Find the amount' }));
    expect(mockUpdateSettings).toHaveBeenCalledWith('number-picnic', { mode: 'find-amount' });

    fireEvent.press(screen.getByRole('switch', { name: /Speak each count/i }));
    expect(mockUpdateSettings).toHaveBeenCalledWith('number-picnic', { spokenCounting: true });
  });

  it('does not show theme or difficulty controls', () => {
    const screen = render(React.createElement(SettingsScreen));

    expect(screen.queryByText('Theme')).toBeNull();
    expect(screen.queryByText('Difficulty')).toBeNull();
  });

  it('toggles Keepy Uppy easy mode setting', () => {
    const screen = renderPage('game', 'keepy-uppy');
    const keepyUppySwitch = screen.getByRole('switch', { name: /Keepy Uppy Easy Mode/i });
    fireEvent.press(keepyUppySwitch);

    expect(mockUpdateSettings).toHaveBeenCalledWith('keepy-uppy', { liftMode: 'precise' });
  });

  it('persists individual Glitter Fall overrides', () => {
    mockSettings.gameSettings = {
      ...DEFAULT_GAME_SETTINGS,
      'glitter-fall': GLITTER_PRESETS.explore,
    };
    const screen = renderPage('game', 'glitter-fall');

    fireEvent.press(screen.getByRole('switch', { name: /settings.glitterFall.ripples/i }));
    expect(mockUpdateSettings).toHaveBeenCalledWith('glitter-fall', { ripples: false });
  });

  it('resets Glitter Fall overrides to the selected preset', () => {
    mockSettings.gameSettings = {
      ...DEFAULT_GAME_SETTINGS,
      'glitter-fall': { ...GLITTER_PRESETS.watch, colorCount: 6, ripples: true },
    };
    const screen = renderPage('game', 'glitter-fall');

    fireEvent.press(screen.getByText('settings.glitterFall.resetPreset'));
    expect(mockUpdateSettings).toHaveBeenCalledWith('glitter-fall', GLITTER_PRESETS.watch);
  });

  it('gives the hub a single Done action and opens Games as a child page', () => {
    const screen = render(<SettingsScreen />);
    expect(screen.queryByText('Save')).toBeNull();
    expect(screen.queryByText('Back')).toBeNull();
    fireEvent.press(screen.getByRole('button', { name: 'Games' }));
    expect(mockPush).toHaveBeenCalledWith('Settings', { page: 'games', gameId: undefined });
    fireEvent.press(screen.getByRole('button', { name: 'Done' }));
    expect(mockDone).toHaveBeenCalledTimes(1);
  });

  it('only shows an accessible persistence banner on failure', () => {
    const screen = render(<SettingsScreen />);
    expect(screen.queryByTestId('settings-persistence-status')).toBeNull();
    mockIsSaving = true;
    screen.rerender(<SettingsScreen />);
    expect(screen.queryByTestId('settings-persistence-status')).toBeNull();
    mockIsSaving = false;
    mockPersistenceError = 'storage failed';
    screen.rerender(<SettingsScreen />);
    expect(screen.getByTestId('settings-persistence-status')).toHaveTextContent(
      /Settings could not be saved/,
    );
    expect(screen.getByTestId('settings-persistence-status').props.accessibilityRole).toBe('alert');
  });

  it('toggles game visibility via switch', () => {
    const screen = renderPage('game', 'memory-snap');
    const memorySnapSwitch = screen.getByRole('switch', { name: 'Show this game on Home' });
    fireEvent.press(memorySnapSwitch);

    expect(mockUpdateSettings).toHaveBeenCalledWith({
      hiddenGames: ['memory-snap'],
    });
  });

  it('only lists Number Picnic after opting in and opens its separate detail', () => {
    mockSettings.enableUnfinishedGames = false;
    const screen = renderPage('games');
    expect(screen.queryByRole('button', { name: 'Number Picnic' })).toBeNull();
    mockSettings.enableUnfinishedGames = true;
    screen.rerender(<SettingsScreen />);
    fireEvent.press(screen.getByRole('button', { name: 'Number Picnic' }));
    expect(mockPush).toHaveBeenCalledWith('Settings', { page: 'game', gameId: 'number-picnic' });
    expect(screen.queryByRole('radio', { name: '6–10' })).toBeNull();
    fireEvent.press(screen.getByRole('button', { name: 'Back' }));
    expect(mockGoBack).toHaveBeenCalled();
  });

  it('removes a game from hidden games when re-enabled', () => {
    mockSettings.hiddenGames = ['memory-snap'];

    const screen = renderPage('game', 'memory-snap');
    const memorySnapSwitch = screen.getByRole('switch', { name: 'Show this game on Home' });
    fireEvent.press(memorySnapSwitch);

    expect(mockUpdateSettings).toHaveBeenCalledWith({
      hiddenGames: [],
    });
  });

  it('selects parent timer duration', () => {
    const screen = renderPage('break');
    fireEvent.press(screen.getByText('15 min'));

    expect(mockUpdateSettings).toHaveBeenCalledWith({ parentTimerMinutes: 15 });
  });

  it('saves one movement preference, with a visible current state and OS override notice', async () => {
    const motion = jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(true);
    const screen = render(<SettingsScreen />);
    expect(screen.getByRole('radio', { name: 'Lively' })).toBeChecked();
    expect(screen.queryByRole('switch', { name: 'Animations' })).toBeNull();
    fireEvent.press(screen.getByRole('radio', { name: 'Still' }));
    expect(mockUpdateSettings).toHaveBeenCalledWith({ movement: 'still' });
    await screen.findByText(/device’s reduced-motion setting/);
    motion.mockRestore();
  });

  it('allows a family to turn the hold gate off', () => {
    const screen = render(<SettingsScreen />);
    fireEvent.press(screen.getByRole('switch', { name: 'Grown-ups hold gate' }));
    expect(mockUpdateSettings).toHaveBeenCalledWith({ grownUpsHoldGate: false });
  });

  it('toggles sound setting', () => {
    const screen = render(React.createElement(SettingsScreen));
    const soundSwitch = screen.getByRole('switch', { name: 'Sound' });
    fireEvent.press(soundSwitch);

    expect(mockUpdateSettings).toHaveBeenCalledWith({ soundEnabled: false });
  });

  it('updates volume by decreasing', () => {
    mockSettings.soundVolume = 0.7;
    const screen = render(React.createElement(SettingsScreen));

    fireEvent.press(screen.getByLabelText('Decrease volume'));

    expect(mockUpdateSettings).toHaveBeenCalledWith({ soundVolume: 0.6 });
  });

  it('shows a telemetry toggle with calm localized privacy copy', () => {
    const screen = renderPage('privacy');

    expect(screen.getByText('Share anonymous app updates')).toBeTruthy();
    expect(
      screen.getByText('Analytics and crash reports stay off until you turn this on.'),
    ).toBeTruthy();
  });

  it('toggles telemetry consent on and off', () => {
    const firstScreen = renderPage('privacy');
    const telemetryOffSwitch = firstScreen.getByRole('switch', {
      name: /Share anonymous app updates/i,
    });
    fireEvent.press(telemetryOffSwitch);

    expect(mockUpdateSettings).toHaveBeenCalledWith({ telemetryEnabled: true });

    mockUpdateSettings.mockClear();
    mockSettings.telemetryEnabled = true;

    const secondScreen = renderPage('privacy');
    const telemetryOnSwitch = secondScreen.getByRole('switch', {
      name: /Share anonymous app updates/i,
    });
    fireEvent.press(telemetryOnSwitch);

    expect(mockUpdateSettings).toHaveBeenCalledWith({ telemetryEnabled: false });
  });

  it('keeps the website in Privacy & about and explains offline failures', async () => {
    jest.mocked(openExternalUrl).mockResolvedValueOnce('failed');
    const screen = renderPage('privacy');
    fireEvent.press(screen.getByRole('link', { name: 'Visit gentlegames.org' }));
    expect(openExternalUrl).toHaveBeenCalledWith('https://gentlegames.org');
    await waitFor(() => expect(screen.getByText('Website unavailable')).toBeTruthy());
    fireEvent.press(screen.getByText('Close'));
    expect(screen.getByText(/^Version /)).toBeTruthy();
  });

  it('toggles pressure-free play mode', () => {
    const screen = render(React.createElement(SettingsScreen));
    const pressureSwitch = screen.getByRole('switch', { name: /pressure-free play/i });
    fireEvent.press(pressureSwitch);
    expect(mockUpdateSettings).toHaveBeenCalledWith({ pressureFreeMode: true });
  });
});
