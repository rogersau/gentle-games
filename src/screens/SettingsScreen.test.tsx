import React from 'react';
import { Text } from 'react-native';
import { fireEvent, render } from '@testing-library/react-native';
import { useTranslation } from 'react-i18next';
import { SettingsScreen } from './SettingsScreen';
import { TranslationKey } from '../i18n/types';

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
let mockSettings = {
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
  }),
}));

describe('SettingsScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
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

  it('toggles card preview setting', () => {
    const screen = render(React.createElement(SettingsScreen));
    const cardPreviewSwitch = screen.getByRole('switch', { name: /Show Card Preview/i });
    fireEvent(cardPreviewSwitch, 'valueChange', false);

    expect(mockUpdateSettings).toHaveBeenCalledWith({ showCardPreview: false });
  });

  it('does not show theme or difficulty controls', () => {
    const screen = render(React.createElement(SettingsScreen));

    expect(screen.queryByText('Theme')).toBeNull();
    expect(screen.queryByText('Difficulty')).toBeNull();
  });

  it('toggles Keepy Uppy easy mode setting', () => {
    const screen = render(React.createElement(SettingsScreen));
    const keepyUppySwitch = screen.getByRole('switch', { name: /Keepy Uppy Easy Mode/i });
    fireEvent(keepyUppySwitch, 'valueChange', false);

    expect(mockUpdateSettings).toHaveBeenCalledWith({ keepyUppyEasyMode: false });
  });

  it('goes back to home when save button is pressed', () => {
    const screen = render(React.createElement(SettingsScreen));
    fireEvent.press(screen.getByText('Save'));

    expect(mockGoBack).toHaveBeenCalledTimes(1);
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
    const soundSwitch = screen.getByRole('switch', { name: /Sound/i });
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
});
