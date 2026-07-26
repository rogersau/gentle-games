import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Override the global mock — this test exercises the real SettingsContext
jest.unmock('./SettingsContext');
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
  const { settings, isLoading, updateSettings, isSaving, persistenceError } = useSettings();

  if (isLoading) {
    return <Text testID='loading'>loading</Text>;
  }

  return (
    <View>
      <Text testID='animations'>{String(settings.animationsEnabled)}</Text>
      <Text testID='sound'>{String(settings.soundEnabled)}</Text>
      <Text testID='volume'>{String(settings.soundVolume)}</Text>
      <Text testID='difficulty'>{settings.difficulty}</Text>
      <Text testID='theme'>{settings.theme}</Text>
      <Text testID='keepyEasy'>{String(settings.keepyUppyEasyMode)}</Text>
      <Text testID='colorMode'>{settings.colorMode}</Text>
      <Text testID='hiddenGames'>{settings.hiddenGames.join(',')}</Text>
      <Text testID='telemetry'>{String(settings.telemetryEnabled)}</Text>
      <Text testID='pressure-free'>{String(settings.pressureFreeMode)}</Text>
      <Text testID='unfinishedGames'>{String(settings.enableUnfinishedGames)}</Text>
      <Text testID='saving'>{String(!!isSaving)}</Text>
      <Text testID='persistence-error'>{persistenceError ?? ''}</Text>
      <TouchableOpacity testID='set-volume' onPress={() => updateSettings({ soundVolume: 0.9 })}>
        <Text>set-volume</Text>
      </TouchableOpacity>
      <TouchableOpacity
        testID='set-sound-off'
        onPress={() => updateSettings({ soundEnabled: false })}
      >
        <Text>set-sound-off</Text>
      </TouchableOpacity>
      <TouchableOpacity
        testID='set-language-us'
        onPress={() => updateSettings({ language: 'en-US' })}
      >
        <Text>set-language-us</Text>
      </TouchableOpacity>
      <TouchableOpacity testID='set-hard' onPress={() => updateSettings({ difficulty: 'hard' })}>
        <Text>set-hard</Text>
      </TouchableOpacity>
      <TouchableOpacity testID='set-pressure-free' onPress={() => updateSettings({ pressureFreeMode: true })}>
        <Text>set-pressure-free</Text>
      </TouchableOpacity>
      <TouchableOpacity
        testID='set-telemetry'
        onPress={() => updateSettings({ telemetryEnabled: true })}
      >
        <Text>set-telemetry</Text>
      </TouchableOpacity>
    </View>
  );
};

describe('SettingsContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('defaults telemetryEnabled to false for fresh installs', async () => {
    storage.getItem.mockResolvedValueOnce(null);

    const screen = render(
      <SettingsProvider>
        <TestConsumer />
      </SettingsProvider>,
    );

    await waitFor(() => expect(screen.queryByTestId('loading')).toBeNull());

    expect(screen.getByTestId('telemetry').props.children).toBe('false');
    expect(screen.getByTestId('pressure-free').props.children).toBe('false');
  });

  it('hides unfinished games on fresh installs', async () => {
    storage.getItem.mockResolvedValueOnce(null);

    const screen = render(
      <SettingsProvider>
        <TestConsumer />
      </SettingsProvider>,
    );

    await waitFor(() => expect(screen.queryByTestId('loading')).toBeNull());

    expect(screen.getByTestId('unfinishedGames').props.children).toBe('false');
  });

  it('sanitizes invalid persisted telemetryEnabled values back to false', async () => {
    storage.getItem.mockResolvedValueOnce(
      JSON.stringify({
        animationsEnabled: 'false',
        soundEnabled: 'true',
        soundVolume: 2,
        difficulty: 'invalid',
        theme: 'invalid',
        keepyUppyEasyMode: 'invalid',
        colorMode: 'invalid',
        telemetryEnabled: 'maybe',
      }),
    );

    const screen = render(
      <SettingsProvider>
        <TestConsumer />
      </SettingsProvider>,
    );

    await waitFor(() => expect(screen.queryByTestId('loading')).toBeNull());

    expect(screen.getByTestId('animations').props.children).toBe('false');
    expect(screen.getByTestId('sound').props.children).toBe('true');
    expect(screen.getByTestId('volume').props.children).toBe('1');
    expect(screen.getByTestId('difficulty').props.children).toBe('medium');
    expect(screen.getByTestId('theme').props.children).toBe('mixed');
    expect(screen.getByTestId('keepyEasy').props.children).toBe('true');
    expect(screen.getByTestId('colorMode').props.children).toBe('system');
    expect(screen.getByTestId('telemetry').props.children).toBe('false');
  });

  it('drops invalid persisted hidden game ids on load', async () => {
    storage.getItem.mockResolvedValueOnce(
      JSON.stringify({
        hiddenGames: ['memory-snap', 'not-a-game', 42, 'bubble-pop'],
      }),
    );

    const screen = render(
      <SettingsProvider>
        <TestConsumer />
      </SettingsProvider>,
    );

    await waitFor(() => expect(screen.queryByTestId('loading')).toBeNull());

    expect(screen.getByTestId('hiddenGames').props.children).toBe('memory-snap,bubble-pop');
    expect(storage.setItem).toHaveBeenCalledWith(
      'gentleMatchSettings',
      JSON.stringify({
        animationsEnabled: true,
        soundEnabled: true,
        soundVolume: 0.5,
        difficulty: 'medium',
        theme: 'mixed',
        showCardPreview: true,
        keepyUppyEasyMode: true,
        colorMode: 'system',
        hiddenGames: ['memory-snap', 'bubble-pop'],
        parentTimerMinutes: 0,
        enableUnfinishedGames: false,
        language: 'en-AU',
        reducedMotionEnabled: false,
        telemetryEnabled: false,
        showMochiInGames: true,
        pressureFreeMode: false,
      }),
    );
  });

  it('completes legacy migration before allowing later settings updates', async () => {
    let resolveMigration: () => void = () => {};
    storage.getItem.mockResolvedValueOnce(JSON.stringify({ soundEnabled: false }));
    storage.setItem.mockImplementationOnce(
      () =>
        new Promise<void>((resolve) => {
          resolveMigration = resolve;
        }),
    );

    const screen = render(
      <SettingsProvider>
        <TestConsumer />
      </SettingsProvider>,
    );

    await waitFor(() => expect(storage.setItem).toHaveBeenCalledTimes(1));
    await act(async () => {
      resolveMigration();
      await Promise.resolve();
    });
    await waitFor(() => expect(screen.queryByTestId('loading')).toBeNull());

    fireEvent.press(screen.getByTestId('set-hard'));
    await waitFor(() => expect(storage.setItem).toHaveBeenCalledTimes(2));
    expect(JSON.parse(storage.setItem.mock.calls[1][1]).difficulty).toBe('hard');
  });

  it('removes corrupted persisted settings', async () => {
    storage.getItem.mockResolvedValueOnce('{bad json');
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

    render(
      <SettingsProvider>
        <TestConsumer />
      </SettingsProvider>,
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
      </SettingsProvider>,
    );

    await waitFor(() => expect(screen.queryByTestId('loading')).toBeNull());
    fireEvent.press(screen.getByTestId('set-hard'));

    await waitFor(() => {
      expect(storage.setItem).toHaveBeenCalledWith('gentleMatchSettings', expect.any(String));
    });

    const saved = storage.setItem.mock.calls[0][1];
    expect(JSON.parse(saved).difficulty).toBe('hard');
  });

  it('persists telemetryEnabled updates to storage', async () => {
    storage.getItem.mockResolvedValueOnce(null);

    const screen = render(
      <SettingsProvider>
        <TestConsumer />
      </SettingsProvider>,
    );

    await waitFor(() => expect(screen.queryByTestId('loading')).toBeNull());
    fireEvent.press(screen.getByTestId('set-telemetry'));

    await waitFor(() => {
      expect(storage.setItem).toHaveBeenCalledWith('gentleMatchSettings', expect.any(String));
    });

    const saved = storage.setItem.mock.calls[0][1];
    expect(JSON.parse(saved).telemetryEnabled).toBe(true);
  });

  it('persists pressureFreeMode updates to storage', async () => {
    storage.getItem.mockResolvedValueOnce(null);
    const screen = render(
      <SettingsProvider>
        <TestConsumer />
      </SettingsProvider>,
    );
    await waitFor(() => expect(screen.queryByTestId('loading')).toBeNull());
    fireEvent.press(screen.getByTestId('set-pressure-free'));
    await waitFor(() => expect(storage.setItem).toHaveBeenCalledWith('gentleMatchSettings', expect.any(String)));
    expect(JSON.parse(storage.setItem.mock.calls[0][1]).pressureFreeMode).toBe(true);
  });

  it('merges rapid updates and serialises delayed writes', async () => {
    storage.getItem.mockResolvedValueOnce(null);
    const pending: Array<{ value: string; resolve: () => void }> = [];
    storage.setItem.mockImplementation((_key: string, value: string) => {
      return new Promise<void>((resolve) => pending.push({ value, resolve }));
    });

    const screen = render(
      <SettingsProvider>
        <TestConsumer />
      </SettingsProvider>,
    );

    await waitFor(() => expect(screen.queryByTestId('loading')).toBeNull());
    fireEvent.press(screen.getByTestId('set-volume'));
    fireEvent.press(screen.getByTestId('set-sound-off'));

    await waitFor(() => expect(storage.setItem).toHaveBeenCalledTimes(1));
    expect(screen.getByTestId('volume').props.children).toBe('0.9');
    expect(screen.getByTestId('sound').props.children).toBe('false');
    expect(pending).toHaveLength(1);

    pending[0].resolve();
    await waitFor(() => expect(storage.setItem).toHaveBeenCalledTimes(2));
    expect(JSON.parse(pending[0].value).soundVolume).toBe(0.9);
    expect(JSON.parse(pending[0].value).soundEnabled).toBe(true);
    pending[1].resolve();

    await waitFor(() => expect(screen.getByTestId('saving').props.children).toBe('false'));
    const finalSnapshot = JSON.parse(storage.setItem.mock.calls[1][1]);
    expect(finalSnapshot.soundVolume).toBe(0.9);
    expect(finalSnapshot.soundEnabled).toBe(false);
  });

  it('recovers after a persistence failure and exposes the error', async () => {
    storage.getItem.mockResolvedValueOnce(null);
    const failure = new Error('disk full');
    storage.setItem.mockRejectedValueOnce(failure).mockResolvedValue(undefined);
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

    const screen = render(
      <SettingsProvider>
        <TestConsumer />
      </SettingsProvider>,
    );

    await waitFor(() => expect(screen.queryByTestId('loading')).toBeNull());
    fireEvent.press(screen.getByTestId('set-volume'));
    await waitFor(() =>
      expect(screen.getByTestId('persistence-error').props.children).toBe('disk full'),
    );

    fireEvent.press(screen.getByTestId('set-sound-off'));
    await waitFor(() => expect(storage.setItem).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(screen.getByTestId('persistence-error').props.children).toBe(''));

    const finalSnapshot = JSON.parse(storage.setItem.mock.calls[1][1]);
    expect(finalSnapshot.soundVolume).toBe(0.9);
    expect(finalSnapshot.soundEnabled).toBe(false);
    warnSpy.mockRestore();
  });
});
