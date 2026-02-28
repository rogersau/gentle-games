import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';
import { HomeScreen } from './HomeScreen';

const mockNavigate = jest.fn();
const mockUpdateSettings = jest.fn().mockResolvedValue(undefined);
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

describe('HomeScreen', () => {
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
    };
  });

  it('navigates directly to Drawing screen when Drawing Pad is selected', () => {
    const screen = render(<HomeScreen />);
    fireEvent.press(screen.getByText('Drawing Pad'));

    expect(mockNavigate).toHaveBeenCalledWith('Drawing');
  });

  it('navigates directly to Glitter screen when Glitter Fall is selected', () => {
    const screen = render(<HomeScreen />);
    fireEvent.press(screen.getByText('Glitter Fall'));

    expect(mockNavigate).toHaveBeenCalledWith('Glitter');
  });

  it('navigates directly to Bubble screen when Bubble Pop is selected', () => {
    const screen = render(<HomeScreen />);
    fireEvent.press(screen.getByText('Bubble Pop'));

    expect(mockNavigate).toHaveBeenCalledWith('Bubble');
  });

  it('navigates directly to Category Match screen when Category Match is selected', () => {
    const screen = render(<HomeScreen />);
    fireEvent.press(screen.getByText('Category Match'));

    expect(mockNavigate).toHaveBeenCalledWith('CategoryMatch');
  });

  it('navigates directly to Keepy Uppy screen when Keepy Uppy is selected', () => {
    const screen = render(<HomeScreen />);
    fireEvent.press(screen.getByText('Keepy Uppy'));

    expect(mockNavigate).toHaveBeenCalledWith('KeepyUppy');
  });

  it('shows difficulty modal for Memory Snap and navigates to Game after selection', async () => {
    const screen = render(<HomeScreen />);

    fireEvent.press(screen.getByText('Memory Snap'));
    expect(screen.getByText('Select difficulty (last played: Medium)')).toBeTruthy();

    fireEvent.press(screen.getByText('Hard'));

    await waitFor(() => {
      expect(mockUpdateSettings).toHaveBeenCalledWith({ difficulty: 'hard' });
      expect(mockNavigate).toHaveBeenCalledWith('Game');
    });
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

  it('shows a scroll hint on the game list', () => {
    const screen = render(<HomeScreen />);

    expect(screen.getByText('Scroll to see more ↓')).toBeTruthy();
  });

  it('game list container uses flex to fill available space', () => {
    const screen = render(<HomeScreen />);
    const gamesContainer = screen.getByTestId('home-games-container');
    const { flex, maxHeight } = StyleSheet.flatten(gamesContainer.props.style);

    expect(flex).toBe(1);
    expect(maxHeight).toBeUndefined();
  });
});
