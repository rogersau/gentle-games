import React from 'react';
import { Text } from 'react-native';
import { fireEvent, render } from '@testing-library/react-native';
import { useTranslation } from 'react-i18next';
import { SettingsScreen } from './SettingsScreen';
import { TranslationKey } from '../i18n/types';
import { DEFAULT_GAME_SETTINGS } from '../games/settings';
import { GLITTER_PRESETS } from '../games/glitterSettings';

jest.mock('../games/registry', () => {
  const actual = jest.requireActual('../games/registry');

  return {
    ...actual,
    GAME_REGISTRY: actual.GAME_REGISTRY.map((game: { id: string }) =>
      game.id === 'number-picnic' ? { ...game, isUnfinished: false } : game,
    ),
  };
});

const mockGoBack = jest.fn();
const mockUpdateSettings = jest.fn();
let mockIsSaving = false;
let mockPersistenceError: string | null = null;
let mockSettings: any = {
  animationsEnabled: true,
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
  reducedMotionEnabled: false,
  telemetryEnabled: false,
  showMochiInGames: true,
  pressureFreeMode: false,
};

const TranslationProbe = ({ translationKey }: { translationKey: TranslationKey }) => {
  const { t } = useTranslation();
  return <Text>{t(translationKey)}</Text>;
};

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    goBack: mockGoBack,
  }),
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
    mockIsSaving = false;
    mockPersistenceError = null;
    mockSettings = {
      animationsEnabled: true,
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
      reducedMotionEnabled: false,
      telemetryEnabled: false,
      showMochiInGames: true,
      pressureFreeMode: false,
    };
  });

  it('updates color mode from appearance options', () => {
    const screen = render(React.createElement(SettingsScreen));
    fireEvent.press(screen.getByText('Dark'));

    expect(mockUpdateSettings).toHaveBeenCalledWith({ colorMode: 'dark' });
  });

  it('updates volume using controls', () => {
    const screen = render(React.createElement(SettingsScreen));

    fireEvent.press(screen.getByText('+'));

    expect(mockUpdateSettings).toHaveBeenCalledWith({ soundVolume: 0.6 });
  });

  it('updates Memory Snap preview setting', () => {
    const screen = render(React.createElement(SettingsScreen));
    fireEvent.press(screen.getByRole('radio', { name: 'None' }));

    expect(mockUpdateSettings).toHaveBeenCalledWith('memory-snap', { previewMode: 'none' });
  });

  it('keeps Category Match at two groups by default and allows the explicit third group', () => {
    const screen = render(React.createElement(SettingsScreen));
    expect(screen.getByRole('radio', { name: '2 groups: Food and Toys' })).toBeTruthy();
    fireEvent.press(screen.getByRole('radio', { name: '3 groups: Food, Toys, and Clothes' }));

    expect(mockUpdateSettings).toHaveBeenCalledWith('category-match', { categoryCount: 3 });
  });

  it('persists Number Picnic quantity independently from global difficulty', () => {
    mockSettings.gameSettings = { ...DEFAULT_GAME_SETTINGS };
    const screen = render(React.createElement(SettingsScreen));

    fireEvent.press(screen.getByRole('radio', { name: '6–10' }));

    expect(mockUpdateSettings).toHaveBeenCalledWith('number-picnic', {
      stage: '6-10',
      maxQuantity: 10,
      mode: 'make-amount',
    });
  });

  it('selects a Number Picnic mode and optional spoken counting independently', () => {
    mockSettings.gameSettings = { ...DEFAULT_GAME_SETTINGS };
    const screen = render(React.createElement(SettingsScreen));

    fireEvent.press(screen.getByRole('radio', { name: 'Find the amount' }));
    expect(mockUpdateSettings).toHaveBeenCalledWith('number-picnic', { mode: 'find-amount' });

    fireEvent(screen.getByRole('switch', { name: /Speak each count/i }), 'valueChange', true);
    expect(mockUpdateSettings).toHaveBeenCalledWith('number-picnic', { spokenCounting: true });
  });

  it('does not show theme or difficulty controls', () => {
    const screen = render(React.createElement(SettingsScreen));

    expect(screen.queryByText('Theme')).toBeNull();
    expect(screen.queryByText('Difficulty')).toBeNull();
  });

  it('persists a Keepy Uppy motor profile with its explicit controls', () => {
    mockSettings.gameSettings = { ...DEFAULT_GAME_SETTINGS };
    const screen = render(React.createElement(SettingsScreen));
    fireEvent.press(
      screen.getByRole('radio', { name: 'settings.keepyUppy.profiles.direct-touch' }),
    );

    expect(mockUpdateSettings).toHaveBeenCalledWith('keepy-uppy', {
      profile: 'direct-touch',
      balloonSize: 34,
      gravity: 220,
      targetSize: 1,
      balloonCount: 1,
    });
  });

  it('persists individual Glitter Fall overrides', () => {
    mockSettings.gameSettings = {
      ...DEFAULT_GAME_SETTINGS,
      'glitter-fall': GLITTER_PRESETS.explore,
    };
    const screen = render(<SettingsScreen />);

    fireEvent(
      screen.getByRole('switch', { name: /settings.glitterFall.ripples/i }),
      'valueChange',
      false,
    );
    expect(mockUpdateSettings).toHaveBeenCalledWith('glitter-fall', { ripples: false });
  });

  it('resets Glitter Fall overrides to the selected preset', () => {
    mockSettings.gameSettings = {
      ...DEFAULT_GAME_SETTINGS,
      'glitter-fall': { ...GLITTER_PRESETS.watch, colorCount: 6, ripples: true },
    };
    const screen = render(<SettingsScreen />);

    fireEvent.press(screen.getByText('settings.glitterFall.resetPreset'));
    expect(mockUpdateSettings).toHaveBeenCalledWith('glitter-fall', GLITTER_PRESETS.watch);
  });

  it('autosaves changes without a Save action and has one clear back path', () => {
    const screen = render(React.createElement(SettingsScreen));

    expect(screen.queryByText('Save')).toBeNull();
    expect(screen.getAllByText('← Back')).toHaveLength(1);

    fireEvent.press(screen.getByText('← Back'));
    expect(mockGoBack).toHaveBeenCalledTimes(1);
  });

  it('shows accessible autosave status without announcing every update', () => {
    const screen = render(React.createElement(SettingsScreen));

    expect(screen.getByTestId('settings-persistence-status').props.children).toBe('Saved');
    expect(screen.getByTestId('settings-persistence-status').props.accessibilityLiveRegion).toBe(
      'none',
    );

    mockIsSaving = true;
    screen.rerender(React.createElement(SettingsScreen));
    expect(screen.getByTestId('settings-persistence-status').props.children).toBe('Saving…');

    mockIsSaving = false;
    mockPersistenceError = 'storage failed';
    screen.rerender(React.createElement(SettingsScreen));
    expect(screen.getByTestId('settings-persistence-status').props.children).toContain(
      'Settings could not be saved',
    );
    expect(screen.getByTestId('settings-persistence-status').props.accessibilityRole).toBe('alert');
  });

  it('toggles game visibility via switch', () => {
    const screen = render(React.createElement(SettingsScreen));
    const memorySnapSwitch = screen.getByRole('switch', { name: /Memory Snap/i });
    fireEvent(memorySnapSwitch, 'valueChange', false);

    expect(mockUpdateSettings).toHaveBeenCalledWith({
      hiddenGames: ['memory-snap'],
    });
  });

  it('shows games based on registry unfinished flags', () => {
    mockSettings.enableUnfinishedGames = false;

    const screen = render(React.createElement(SettingsScreen));

    expect(screen.getByRole('switch', { name: /Number Picnic/i })).toBeTruthy();
  });

  it('removes a game from hidden games when re-enabled', () => {
    mockSettings.hiddenGames = ['memory-snap'];

    const screen = render(React.createElement(SettingsScreen));
    const memorySnapSwitch = screen.getByRole('switch', { name: /Memory Snap/i });
    fireEvent(memorySnapSwitch, 'valueChange', true);

    expect(mockUpdateSettings).toHaveBeenCalledWith({
      hiddenGames: [],
    });
  });

  it('selects parent timer duration', () => {
    const screen = render(React.createElement(SettingsScreen));
    fireEvent.press(screen.getByText('15 min'));

    expect(mockUpdateSettings).toHaveBeenCalledWith({ parentTimerMinutes: 15 });
  });

  it('toggles animations setting', () => {
    const screen = render(React.createElement(SettingsScreen));
    const animationsSwitch = screen.getByRole('switch', { name: /Animations/i });
    fireEvent(animationsSwitch, 'valueChange', false);

    expect(mockUpdateSettings).toHaveBeenCalledWith({ animationsEnabled: false });
  });

  it('toggles sound setting', () => {
    const screen = render(React.createElement(SettingsScreen));
    const soundSwitch = screen.getByRole('switch', { name: /^Sound,/i });
    fireEvent(soundSwitch, 'valueChange', false);

    expect(mockUpdateSettings).toHaveBeenCalledWith({ soundEnabled: false });
  });

  it('updates volume by decreasing', () => {
    mockSettings.soundVolume = 0.7;
    const screen = render(React.createElement(SettingsScreen));

    fireEvent.press(screen.getByLabelText('Decrease volume'));

    expect(mockUpdateSettings).toHaveBeenCalledWith({ soundVolume: 0.6 });
  });

  it('shows a telemetry toggle with calm localized privacy copy', () => {
    const screen = render(React.createElement(SettingsScreen));

    expect(screen.getByText('Share anonymous app updates')).toBeTruthy();
    expect(
      screen.getByText('Analytics and crash reports stay off until you turn this on.'),
    ).toBeTruthy();
  });

  it('toggles telemetry consent on and off', () => {
    const firstScreen = render(React.createElement(SettingsScreen));
    const telemetryOffSwitch = firstScreen.getByRole('switch', {
      name: /Share anonymous app updates/i,
    });
    fireEvent(telemetryOffSwitch, 'valueChange', true);

    expect(mockUpdateSettings).toHaveBeenCalledWith({ telemetryEnabled: true });

    mockUpdateSettings.mockClear();
    mockSettings.telemetryEnabled = true;

    const secondScreen = render(React.createElement(SettingsScreen));
    const telemetryOnSwitch = secondScreen.getByRole('switch', {
      name: /Share anonymous app updates/i,
    });
    fireEvent(telemetryOnSwitch, 'valueChange', false);

    expect(mockUpdateSettings).toHaveBeenCalledWith({ telemetryEnabled: false });
  });

  it('provides localized website fallback strings for downstream reuse', () => {
    const titleProbe = render(<TranslationProbe translationKey='home.websiteLinkFallback.title' />);
    const messageProbe = render(
      <TranslationProbe translationKey='home.websiteLinkFallback.message' />,
    );

    expect(titleProbe.getByText('Website unavailable')).toBeTruthy();
    expect(
      messageProbe.getByText(
        "We couldn't open the Gentle Games website right now. Please try again later.",
      ),
    ).toBeTruthy();
  });

  it('toggles pressure-free play mode', () => {
    const screen = render(React.createElement(SettingsScreen));
    const pressureSwitch = screen.getByRole('switch', { name: /pressureFreeMode.label/i });
    fireEvent(pressureSwitch, 'valueChange', true);
    expect(mockUpdateSettings).toHaveBeenCalledWith({ pressureFreeMode: true });
  });
});
