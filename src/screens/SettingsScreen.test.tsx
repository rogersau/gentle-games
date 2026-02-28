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
  colorMode: 'system' as const,
  hiddenGames: [] as string[],
  parentTimerMinutes: 0,
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
      colorMode: 'system',
      hiddenGames: [],
      parentTimerMinutes: 0,
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

    const switches = screen.getAllByRole('switch');
    fireEvent(switches[0], 'valueChange', false);

    expect(mockUpdateSettings).toHaveBeenCalledWith({ showCardPreview: false });
  });

  it('does not show theme or difficulty controls', () => {
    const screen = render(<SettingsScreen />);

    expect(screen.queryByText('Theme')).toBeNull();
    expect(screen.queryByText('Difficulty')).toBeNull();
  });

  it('goes back to home when save button is pressed', () => {
    const screen = render(<SettingsScreen />);
    fireEvent.press(screen.getByText('Save'));

    expect(mockGoBack).toHaveBeenCalledTimes(1);
  });

  it('toggles game visibility via switch', () => {
    const screen = render(<SettingsScreen />);
    const switches = screen.getAllByRole('switch');
    // First 3 switches: Card Preview, Animations, Sound. Next 5: game toggles.
    const memorySnapSwitch = switches[3];
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
