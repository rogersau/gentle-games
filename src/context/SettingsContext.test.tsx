import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SettingsProvider, useSettings } from './SettingsContext';

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

const storage = AsyncStorage as unknown as {
  getItem: jest.Mock;
  setItem: jest.Mock;
  removeItem: jest.Mock;
};

const TestConsumer = () => {
  const { settings, isLoading, updateSettings } = useSettings();

  if (isLoading) {
    return <Text testID="loading">loading</Text>;
  }

  return (
    <View>
      <Text testID="animations">{String(settings.animationsEnabled)}</Text>
      <Text testID="sound">{String(settings.soundEnabled)}</Text>
      <Text testID="volume">{String(settings.soundVolume)}</Text>
      <Text testID="difficulty">{settings.difficulty}</Text>
      <Text testID="theme">{settings.theme}</Text>
      <Text testID="colorMode">{settings.colorMode}</Text>
      <TouchableOpacity testID="set-hard" onPress={() => updateSettings({ difficulty: 'hard' })}>
        <Text>set-hard</Text>
      </TouchableOpacity>
    </View>
  );
};

describe('SettingsContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('sanitizes persisted settings values', async () => {
    storage.getItem.mockResolvedValueOnce(
      JSON.stringify({
        animationsEnabled: 'false',
        soundEnabled: 'true',
        soundVolume: 2,
        difficulty: 'invalid',
        theme: 'invalid',
        colorMode: 'invalid',
      })
    );

    const screen = render(
      <SettingsProvider>
        <TestConsumer />
      </SettingsProvider>
    );

    await waitFor(() => expect(screen.queryByTestId('loading')).toBeNull());

    expect(screen.getByTestId('animations').props.children).toBe('false');
    expect(screen.getByTestId('sound').props.children).toBe('true');
    expect(screen.getByTestId('volume').props.children).toBe('1');
    expect(screen.getByTestId('difficulty').props.children).toBe('medium');
    expect(screen.getByTestId('theme').props.children).toBe('mixed');
    expect(screen.getByTestId('colorMode').props.children).toBe('system');
  });

  it('removes corrupted persisted settings', async () => {
    storage.getItem.mockResolvedValueOnce('{bad json');
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

    render(
      <SettingsProvider>
        <TestConsumer />
      </SettingsProvider>
    );

    await waitFor(() => {
      expect(storage.removeItem).toHaveBeenCalledWith('gentleMatchSettings');
    });

    warnSpy.mockRestore();
  });

  it('persists updates to storage', async () => {
    storage.getItem.mockResolvedValueOnce(null);

    const screen = render(
      <SettingsProvider>
        <TestConsumer />
      </SettingsProvider>
    );

    await waitFor(() => expect(screen.queryByTestId('loading')).toBeNull());
    fireEvent.press(screen.getByTestId('set-hard'));

    await waitFor(() => {
      expect(storage.setItem).toHaveBeenCalledWith(
        'gentleMatchSettings',
        expect.any(String)
      );
    });

    const saved = storage.setItem.mock.calls[0][1];
    expect(JSON.parse(saved).difficulty).toBe('hard');
  });
});
