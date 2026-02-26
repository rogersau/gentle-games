import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { HomeScreen } from './HomeScreen';

const mockNavigate = jest.fn();
const mockUpdateSettings = jest.fn().mockResolvedValue(undefined);
let mockSettings = {
  animationsEnabled: true,
  soundEnabled: true,
  soundVolume: 0.5,
  difficulty: 'medium' as const,
  theme: 'mixed' as const,
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
    };
  });

  it('navigates directly to Drawing screen when Drawing Pad is selected', () => {
    const screen = render(<HomeScreen />);
    fireEvent.press(screen.getByText('Drawing Pad'));

    expect(mockNavigate).toHaveBeenCalledWith('Drawing');
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
});
