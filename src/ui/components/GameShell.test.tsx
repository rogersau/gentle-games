import React from 'react';
import { Text, Platform } from 'react-native';
import { act, fireEvent, render } from '@testing-library/react-native';
import { GameCompletion, GameShell } from './GameShell';
import { AppButton } from './AppButton';

const mockSettings = {
  soundEnabled: false,
  soundVolume: 0.6,
  language: 'en-AU',
  colorMode: 'light',
  movement: 'still',
};
const mockUpdate = jest.fn();

jest.mock('../../context/SettingsContext', () => ({
  useSettings: () => ({ settings: mockSettings, updateSettings: mockUpdate }),
}));

const frame = () => (
  <GameShell
    title='Example game'
    prompt='Take your time.'
    onHome={() => {}}
    actions={<AppButton label='Help' onPress={() => {}} />}
    more={(close) => <AppButton label='Another action' onPress={close} />}
  >
    <Text>Board</Text>
  </GameShell>
);

it('uses a separate action bar and an explicitly opened More sheet', () => {
  const screen = render(frame());
  expect(screen.getByTestId('game-play-surface')).toHaveTextContent('Board');
  expect(screen.getByTestId('game-action-bar')).toHaveTextContent(/Help.*More/);
  expect(screen.queryByRole('button', { name: 'Another action' })).toBeNull();
  fireEvent.press(screen.getByTestId('game-more'));
  fireEvent.press(screen.getByRole('button', { name: 'Another action' }));
  expect(screen.queryByRole('button', { name: 'Another action' })).toBeNull();
});

it('offers replay and Home inline', () => {
  const onReplay = jest.fn();
  const onHome = jest.fn();
  const screen = render(<GameCompletion message='Finished' onReplay={onReplay} onHome={onHome} />);
  fireEvent.press(screen.getByRole('button', { name: 'Play again' }));
  fireEvent.press(screen.getByRole('button', { name: 'common.home' }));
  expect(onReplay).toHaveBeenCalledTimes(1);
  expect(onHome).toHaveBeenCalledTimes(1);
});

it('only offers speech with sound and a local voice, and cancels playback on mute', () => {
  const original = Object.getOwnPropertyDescriptor(globalThis, 'window');
  const platform = jest.replaceProperty(Platform, 'OS', 'web');
  const remote = { lang: 'en-AU', localService: false };
  const local = { lang: 'en-US', localService: true };
  let voices = [remote];
  let onVoicesChanged: () => void = () => {};
  const speak = jest.fn();
  const cancel = jest.fn();
  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    value: {
      speechSynthesis: {
        getVoices: () => voices,
        speak,
        cancel,
        addEventListener: (_event: string, listener: () => void) => {
          onVoicesChanged = listener;
        },
        removeEventListener: jest.fn(),
      },
      SpeechSynthesisUtterance: class {
        constructor(readonly text: string) {}
      },
    },
  });

  try {
    const screen = render(frame());
    expect(screen.queryByTestId('game-hear-prompt')).toBeNull();
    mockSettings.soundEnabled = true;
    screen.rerender(frame());
    expect(screen.queryByTestId('game-hear-prompt')).toBeNull();
    voices = [remote, local];
    act(() => onVoicesChanged());
    fireEvent.press(screen.getByTestId('game-hear-prompt'));
    expect(speak).toHaveBeenCalledWith(
      expect.objectContaining({
        text: 'Take your time.',
        voice: local,
        volume: 0.6,
      }),
    );
    mockSettings.soundEnabled = false;
    screen.rerender(frame());
    expect(screen.queryByTestId('game-hear-prompt')).toBeNull();
    expect(cancel).toHaveBeenCalledTimes(1);
    screen.unmount();
  } finally {
    mockSettings.soundEnabled = false;
    if (original) Object.defineProperty(globalThis, 'window', original);
    else Reflect.deleteProperty(globalThis, 'window');
    platform.restore();
  }
});
