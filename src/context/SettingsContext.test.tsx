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
  const {
    settings,
    isLoading,
    updateSettings,
    updateGameSettings,
    resetGameSettings,
    resetAllSettings,
    isSaving,
    persistenceError,
  } = useSettings();

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
      <Text testID='memory-pairs'>{String(settings.gameSettings?.['memory-snap'].pairCount)}</Text>
      <Text testID='memory-preview'>{settings.gameSettings?.['memory-snap'].previewMode}</Text>
      <Text testID='memory-mismatch'>
        {String(settings.gameSettings?.['memory-snap'].mismatchDuration)}
      </Text>
      <Text testID='memory-hint'>{String(settings.gameSettings?.['memory-snap'].hintEnabled)}</Text>
      <Text testID='category-count'>
        {String(settings.gameSettings?.['category-match'].categoryCount)}
      </Text>
      <Text testID='number-picnic-max'>
        {String(settings.gameSettings?.['number-picnic'].maxQuantity)}
      </Text>
      <Text testID='number-picnic-stage'>{settings.gameSettings?.['number-picnic'].stage}</Text>
      <Text testID='number-picnic-mode'>{settings.gameSettings?.['number-picnic'].mode}</Text>
      <Text testID='number-picnic-spoken'>
        {String(settings.gameSettings?.['number-picnic'].spokenCounting)}
      </Text>
      <Text testID='pattern-level'>{settings.gameSettings?.['pattern-train'].level}</Text>
      <Text testID='glitter-preset'>{settings.gameSettings?.['glitter-fall'].preset}</Text>
      <Text testID='glitter-ripples'>
        {String(settings.gameSettings?.['glitter-fall'].ripples)}
      </Text>
      <Text testID='breathing-session'>
        {String(settings.gameSettings?.['breathing-garden'].sessionLength)}
      </Text>
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
      <TouchableOpacity
        testID='set-pressure-free'
        onPress={() => updateSettings({ pressureFreeMode: true })}
      >
        <Text>set-pressure-free</Text>
      </TouchableOpacity>
      <TouchableOpacity
        testID='set-memory-hard'
        onPress={() => updateGameSettings('memory-snap', { pairCount: 15 })}
      >
        <Text>set-memory-hard</Text>
      </TouchableOpacity>
      <TouchableOpacity
        testID='set-memory-options'
        onPress={() =>
          updateGameSettings('memory-snap', {
            pairCount: 4,
            previewMode: 'until-ready',
            mismatchDuration: 3000,
            hintEnabled: false,
          })
        }
      >
        <Text>set-memory-options</Text>
      </TouchableOpacity>
      <TouchableOpacity testID='reset-memory' onPress={() => resetGameSettings('memory-snap')}>
        <Text>reset-memory</Text>
      </TouchableOpacity>
      <TouchableOpacity
        testID='set-glitter-ripples'
        onPress={() => updateGameSettings('glitter-fall', { ripples: true })}
      >
        <Text>set-glitter-ripples</Text>
      </TouchableOpacity>
      <TouchableOpacity testID='reset-glitter' onPress={() => resetGameSettings('glitter-fall')}>
        <Text>reset-glitter</Text>
      </TouchableOpacity>
      <TouchableOpacity
        testID='set-number-picnic-max'
        onPress={() => updateGameSettings('number-picnic', { maxQuantity: 10 })}
      >
        <Text>set-number-picnic-max</Text>
      </TouchableOpacity>
      <TouchableOpacity testID='reset-all' onPress={() => resetAllSettings()}>
        <Text>reset-all</Text>
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
    expect(screen.getByTestId('pressure-free').props.children).toBe('true');
    expect(screen.getByTestId('difficulty').props.children).toBe('easy');
    expect(screen.getByTestId('memory-pairs').props.children).toBe('2');
    expect(screen.getByTestId('category-count').props.children).toBe('2');
    expect(screen.getByTestId('number-picnic-max').props.children).toBe('5');
    expect(screen.getByTestId('number-picnic-stage').props.children).toBe('1-5');
    expect(screen.getByTestId('number-picnic-mode').props.children).toBe('make-amount');
    expect(screen.getByTestId('number-picnic-spoken').props.children).toBe('false');
    expect(screen.getByTestId('pattern-level').props.children).toBe('starter');
    expect(screen.getByTestId('glitter-preset').props.children).toBe('settle');
    expect(screen.getByTestId('breathing-session').props.children).toBe('open-ended');
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

  it('migrates legacy Number Picnic settings into stages and learning controls', async () => {
    storage.getItem.mockResolvedValueOnce(
      JSON.stringify({
        settingsVersion: 3,
        gameSettings: { 'number-picnic': { maxQuantity: 8 } },
      }),
    );

    const screen = render(
      <SettingsProvider>
        <TestConsumer />
      </SettingsProvider>,
    );

    await waitFor(() => expect(screen.queryByTestId('loading')).toBeNull());

    expect(screen.getByTestId('number-picnic-stage').props.children).toBe('6-10');
    expect(screen.getByTestId('number-picnic-mode').props.children).toBe('make-amount');
    expect(screen.getByTestId('number-picnic-spoken').props.children).toBe('false');
    expect(JSON.parse(storage.setItem.mock.calls[0][1])).toMatchObject({
      settingsVersion: 4,
      gameSettings: {
        'number-picnic': {
          maxQuantity: 8,
          stage: '6-10',
          mode: 'make-amount',
          spokenCounting: false,
        },
      },
    });
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
    expect(screen.getByTestId('difficulty').props.children).toBe('easy');
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
    const migrated = JSON.parse(storage.setItem.mock.calls[0][1]);
    expect(migrated).toMatchObject({
      settingsVersion: 4,
      hiddenGames: ['memory-snap', 'bubble-pop'],
      pressureFreeMode: false,
      gameSettings: {
        'memory-snap': {
          pairCount: 6,
          previewMode: 'none',
          mismatchDuration: 2000,
          hintEnabled: true,
        },
        'pattern-train': { level: 'starter' },
      },
    });
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
    await waitFor(() =>
      expect(storage.setItem).toHaveBeenCalledWith('gentleMatchSettings', expect.any(String)),
    );
    expect(JSON.parse(storage.setItem.mock.calls[0][1]).pressureFreeMode).toBe(true);
  });

  it('persists all Memory Snap options independently', async () => {
    storage.getItem.mockResolvedValueOnce(null);
    const screen = render(
      <SettingsProvider>
        <TestConsumer />
      </SettingsProvider>,
    );
    await waitFor(() => expect(screen.queryByTestId('loading')).toBeNull());

    fireEvent.press(screen.getByTestId('set-memory-options'));
    await waitFor(() => expect(screen.getByTestId('memory-pairs').props.children).toBe('4'));
    expect(screen.getByTestId('memory-preview').props.children).toBe('until-ready');
    expect(screen.getByTestId('memory-mismatch').props.children).toBe('3000');
    expect(screen.getByTestId('memory-hint').props.children).toBe('false');
    expect(JSON.parse(storage.setItem.mock.calls[0][1]).gameSettings['memory-snap']).toEqual({
      pairCount: 4,
      previewMode: 'until-ready',
      mismatchDuration: 3000,
      hintEnabled: false,
    });
  });

  it('migrates a legacy Memory Snap showPreview value into previewMode', async () => {
    storage.getItem.mockResolvedValueOnce(
      JSON.stringify({
        settingsVersion: 2,
        gameSettings: { 'memory-snap': { pairCount: 4, showPreview: true } },
      }),
    );
    const screen = render(
      <SettingsProvider>
        <TestConsumer />
      </SettingsProvider>,
    );
    await waitFor(() => expect(screen.queryByTestId('loading')).toBeNull());

    expect(screen.getByTestId('memory-pairs').props.children).toBe('4');
    expect(screen.getByTestId('memory-preview').props.children).toBe('4-seconds');
    const migrated = JSON.parse(storage.setItem.mock.calls[0][1]);
    expect(migrated.gameSettings['memory-snap']).toMatchObject({
      pairCount: 4,
      previewMode: '4-seconds',
    });
    expect(migrated.gameSettings['memory-snap'].showPreview).toBeUndefined();
  });

  it('migrates a missing or invalid Category Match setting to the two-group starter', async () => {
    storage.getItem.mockResolvedValueOnce(
      JSON.stringify({
        settingsVersion: 4,
        gameSettings: { 'category-match': { categoryCount: 4, showPreview: false } },
      }),
    );
    const screen = render(
      <SettingsProvider>
        <TestConsumer />
      </SettingsProvider>,
    );
    await waitFor(() => expect(screen.queryByTestId('loading')).toBeNull());

    expect(screen.getByTestId('category-count').props.children).toBe('2');
    const migrated = JSON.parse(storage.setItem.mock.calls[0][1]);
    expect(migrated.gameSettings['category-match']).toEqual({
      categoryCount: 2,
      showPreview: false,
    });
  });

  it('migrates explicit legacy choices into isolated game settings', async () => {
    storage.getItem.mockResolvedValueOnce(
      JSON.stringify({
        difficulty: 'hard',
        showCardPreview: false,
        keepyUppyEasyMode: false,
        pressureFreeMode: false,
      }),
    );

    const screen = render(
      <SettingsProvider>
        <TestConsumer />
      </SettingsProvider>,
    );
    await waitFor(() => expect(screen.queryByTestId('loading')).toBeNull());

    expect(screen.getByTestId('pressure-free').props.children).toBe('false');
    expect(screen.getByTestId('memory-pairs').props.children).toBe('15');
    expect(screen.getByTestId('pattern-level').props.children).toBe('challenge');
    const migrated = JSON.parse(storage.setItem.mock.calls[0][1]);
    expect(migrated.gameSettings['memory-snap']).toEqual({
      pairCount: 15,
      previewMode: 'none',
      mismatchDuration: 2000,
      hintEnabled: true,
    });
    expect(migrated.gameSettings['keepy-uppy']).toEqual({ liftMode: 'precise' });
    expect(migrated.gameSettings['bubble-pop']).toEqual({ motion: 'moving', density: 'full' });
  });

  it('falls back safely when versioned per-game values are invalid', async () => {
    storage.getItem.mockResolvedValueOnce(
      JSON.stringify({
        settingsVersion: 2,
        pressureFreeMode: true,
        gameSettings: {
          'memory-snap': { pairCount: 99 },
          'pattern-train': { level: 'impossible' },
        },
      }),
    );

    const screen = render(
      <SettingsProvider>
        <TestConsumer />
      </SettingsProvider>,
    );
    await waitFor(() => expect(screen.queryByTestId('loading')).toBeNull());

    expect(screen.getByTestId('memory-pairs').props.children).toBe('2');
    expect(screen.getByTestId('pattern-level').props.children).toBe('starter');
  });

  it('uses current defaults when a versioned profile is missing per-game settings', async () => {
    storage.getItem.mockResolvedValueOnce(
      JSON.stringify({
        settingsVersion: 2,
        pressureFreeMode: true,
      }),
    );

    const screen = render(
      <SettingsProvider>
        <TestConsumer />
      </SettingsProvider>,
    );
    await waitFor(() => expect(screen.queryByTestId('loading')).toBeNull());

    expect(screen.getByTestId('glitter-preset').props.children).toBe('settle');
    const saved = JSON.parse(storage.setItem.mock.calls[0][1]);
    expect(saved.gameSettings['bubble-pop']).toEqual({ motion: 'still', density: 'sparse' });
  });

  it('updates and resets one game without changing another game', async () => {
    storage.getItem.mockResolvedValueOnce(null);
    const screen = render(
      <SettingsProvider>
        <TestConsumer />
      </SettingsProvider>,
    );
    await waitFor(() => expect(screen.queryByTestId('loading')).toBeNull());

    fireEvent.press(screen.getByTestId('set-memory-hard'));
    await waitFor(() => expect(screen.getByTestId('memory-pairs').props.children).toBe('15'));
    expect(screen.getByTestId('pattern-level').props.children).toBe('starter');

    fireEvent.press(screen.getByTestId('reset-memory'));
    await waitFor(() => expect(screen.getByTestId('memory-pairs').props.children).toBe('2'));
    expect(screen.getByTestId('pattern-level').props.children).toBe('starter');
  });

  it('persists and resets Glitter Fall overrides independently', async () => {
    storage.getItem.mockResolvedValueOnce(null);
    const screen = render(
      <SettingsProvider>
        <TestConsumer />
      </SettingsProvider>,
    );
    await waitFor(() => expect(screen.queryByTestId('loading')).toBeNull());

    fireEvent.press(screen.getByTestId('set-glitter-ripples'));
    await waitFor(() => expect(screen.getByTestId('glitter-ripples').props.children).toBe('true'));
    const saved = JSON.parse(storage.setItem.mock.calls.at(-1)[1]);
    expect(saved.gameSettings['glitter-fall'].ripples).toBe(true);
    expect(saved.gameSettings['breathing-garden'].sessionLength).toBe('open-ended');

    fireEvent.press(screen.getByTestId('reset-glitter'));
    await waitFor(() => expect(screen.getByTestId('glitter-ripples').props.children).toBe('false'));
    expect(screen.getByTestId('glitter-preset').props.children).toBe('settle');
  });

  it('persists Number Picnic quantity without changing global difficulty', async () => {
    storage.getItem.mockResolvedValueOnce(null);
    const screen = render(
      <SettingsProvider>
        <TestConsumer />
      </SettingsProvider>,
    );
    await waitFor(() => expect(screen.queryByTestId('loading')).toBeNull());

    fireEvent.press(screen.getByTestId('set-number-picnic-max'));
    await waitFor(() => expect(screen.getByTestId('number-picnic-max').props.children).toBe('10'));
    expect(screen.getByTestId('difficulty').props.children).toBe('easy');
    const saved = JSON.parse(storage.setItem.mock.calls.at(-1)[1]);
    expect(saved.gameSettings['number-picnic'].maxQuantity).toBe(10);
  });

  it('reset-all restores pressure-free starter defaults', async () => {
    storage.getItem.mockResolvedValueOnce(
      JSON.stringify({
        settingsVersion: 2,
        pressureFreeMode: false,
        gameSettings: { 'memory-snap': { pairCount: 15, showPreview: false } },
      }),
    );
    const screen = render(
      <SettingsProvider>
        <TestConsumer />
      </SettingsProvider>,
    );
    await waitFor(() => expect(screen.queryByTestId('loading')).toBeNull());

    fireEvent.press(screen.getByTestId('reset-all'));
    await waitFor(() => expect(screen.getByTestId('pressure-free').props.children).toBe('true'));
    expect(screen.getByTestId('memory-pairs').props.children).toBe('2');
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
