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
    const screen = render(<SettingsScreen />);
    fireEvent.press(screen.getByText('Dark'));

    expect(mockUpdateSettings).toHaveBeenCalledWith({ colorMode: 'dark' });
  });

  it('updates volume using controls', () => {
    const screen = render(<SettingsScreen />);

    fireEvent.press(screen.getByText('+'));

    expect(mockUpdateSettings).toHaveBeenCalledWith({ soundVolume: 0.6 });
  });

  it('toggles card preview setting', () => {
    const screen = render(<SettingsScreen />);
    const cardPreviewSwitch = screen.getByRole('switch', { name: /Show Card Preview/i });
    fireEvent(cardPreviewSwitch, 'valueChange', false);

    expect(mockUpdateSettings).toHaveBeenCalledWith({ showCardPreview: false });
  });

  it('does not show theme or difficulty controls', () => {
    const screen = render(<SettingsScreen />);

    expect(screen.queryByText('Theme')).toBeNull();
    expect(screen.queryByText('Difficulty')).toBeNull();
  });

  it('toggles Keepy Uppy easy mode setting', () => {
    const screen = render(<SettingsScreen />);
    const keepyUppySwitch = screen.getByRole('switch', { name: /Keepy Uppy Easy Mode/i });
    fireEvent(keepyUppySwitch, 'valueChange', false);

    expect(mockUpdateSettings).toHaveBeenCalledWith({ keepyUppyEasyMode: false });
  });

  it('goes back to home when save button is pressed', () => {
    const screen = render(<SettingsScreen />);
    fireEvent.press(screen.getByText('Save'));

    expect(mockGoBack).toHaveBeenCalledTimes(1);
  });

  it('toggles game visibility via switch', () => {
    const screen = render(<SettingsScreen />);
    const memorySnapSwitch = screen.getByRole('switch', { name: /Memory Snap/i });
    fireEvent(memorySnapSwitch, 'valueChange', false);

    expect(mockUpdateSettings).toHaveBeenCalledWith({
      hiddenGames: ['memory-snap'],
    });
  });

  it('selects parent timer duration', () => {
    const screen = render(<SettingsScreen />);
    fireEvent.press(screen.getByText('15 min'));

    expect(mockUpdateSettings).toHaveBeenCalledWith({ parentTimerMinutes: 15 });
  });
});
