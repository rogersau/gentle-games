import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { SettingsScreen } from './SettingsScreen';

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
  language: 'en-AU' as const,
  reducedMotionEnabled: false,
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
      language: 'en-AU',
      reducedMotionEnabled: false,
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

  it('selects parent timer duration', () => {
    const screen = render(React.createElement(SettingsScreen));
    fireEvent.press(screen.getByText('15 min'));

    expect(mockUpdateSettings).toHaveBeenCalledWith({ parentTimerMinutes: 15 });
  });

  // New tests
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

  it('selects 30 min parent timer', () => {
    const screen = render(React.createElement(SettingsScreen));
    fireEvent.press(screen.getByText('30 min'));

    expect(mockUpdateSettings).toHaveBeenCalledWith({ parentTimerMinutes: 30 });
  });

  it('selects 20 min parent timer', () => {
    const screen = render(React.createElement(SettingsScreen));
    fireEvent.press(screen.getByText('20 min'));

    expect(mockUpdateSettings).toHaveBeenCalledWith({ parentTimerMinutes: 20 });
  });

  it('selects 30 min parent timer', () => {
    const screen = render(React.createElement(SettingsScreen));
    fireEvent.press(screen.getByText('30 min'));

    expect(mockUpdateSettings).toHaveBeenCalledWith({ parentTimerMinutes: 30 });
  });

  it('shows off parent timer when selected', () => {
    const screen = render(React.createElement(SettingsScreen));
    fireEvent.press(screen.getByText('Off'));

    expect(mockUpdateSettings).toHaveBeenCalledWith({ parentTimerMinutes: 0 });
  });

  it('hides multiple games', () => {
    const screen = render(React.createElement(SettingsScreen));
    
    // Hide Memory Snap
    const memorySnapSwitch = screen.getByRole('switch', { name: /Memory Snap/i });
    fireEvent(memorySnapSwitch, 'valueChange', false);
    
    expect(mockUpdateSettings).toHaveBeenCalledWith({
      hiddenGames: ['memory-snap'],
    });
  });

  it('shows previously hidden game when toggled back', () => {
    mockSettings.hiddenGames = ['drawing'];
    const screen = render(React.createElement(SettingsScreen));

    // Show Drawing game (currently hidden, so toggle is off)
    const drawingSwitch = screen.getByRole('switch', { name: /drawing/i });
    fireEvent(drawingSwitch, 'valueChange', true);

    expect(mockUpdateSettings).toHaveBeenCalledWith({
      hiddenGames: [],
    });
  });
});