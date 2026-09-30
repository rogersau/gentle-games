import React from 'react';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import { AppState, Text, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ParentTimerProvider, useParentTimer } from './ParentTimerContext';

const mockSettings = {
  parentTimerMinutes: 1,
  animationsEnabled: true,
};

jest.mock('../context/SettingsContext', () => ({
  useSettings: () => ({ settings: mockSettings }),
}));

jest.mock('../utils/theme', () => ({
  useReducedMotion: () => false,
  useThemeColors: () => ({
    colors: {
      background: '#FFFFFF',
      text: '#000000',
      textLight: '#666666',
      primary: '#4A90E2',
      cardFront: '#FFFFFF',
      cardBack: '#F0F0F0',
      secondary: '#E74C3C',
    },
    resolvedMode: 'light',
  }),
}));

const storage = AsyncStorage as unknown as {
  getItem: jest.Mock;
  setItem: jest.Mock;
  removeItem: jest.Mock;
};

const TestComponent: React.FC = () => {
  const { secondsRemaining, isLocked } = useParentTimer();
  return (
    <View>
      <Text testID='seconds'>{secondsRemaining}</Text>
      <Text testID='locked'>{isLocked ? 'locked' : 'unlocked'}</Text>
    </View>
  );
};

const renderTimer = async () => {
  const screen = render(
    <ParentTimerProvider>
      <TestComponent />
    </ParentTimerProvider>,
  );
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });
  return screen;
};

describe('ParentTimerContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    mockSettings.parentTimerMinutes = 1;
    mockSettings.animationsEnabled = true;
    storage.getItem.mockResolvedValue(null);
    storage.setItem.mockResolvedValue(undefined);
    storage.removeItem.mockResolvedValue(undefined);
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('starts and persists a fresh allowance', async () => {
    const { getByTestId } = await renderTimer();
    expect(getByTestId('seconds').props.children).toBe(60);
    expect(getByTestId('locked').props.children).toBe('unlocked');
    expect(storage.setItem).toHaveBeenCalledWith(
      'gentleGames.parentTimerSession',
      expect.stringContaining('"durationMinutes":1'),
    );
  });

  it('restores a persisted allowance before its deadline on relaunch', async () => {
    const expiresAt = Date.now() + 30_000;
    storage.getItem.mockResolvedValueOnce(JSON.stringify({ expiresAt, durationMinutes: 1 }));
    const { getByTestId } = await renderTimer();

    expect(getByTestId('seconds').props.children).toBe(30);
    expect(getByTestId('locked').props.children).toBe('unlocked');
    expect(storage.setItem).not.toHaveBeenCalled();
  });

  it('locks immediately after relaunch when the persisted deadline has passed', async () => {
    storage.getItem.mockResolvedValueOnce(
      JSON.stringify({ expiresAt: Date.now() - 1, durationMinutes: 1 }),
    );
    const { getByTestId } = await renderTimer();

    expect(getByTestId('seconds').props.children).toBe(0);
    expect(getByTestId('locked').props.children).toBe('locked');
    expect(storage.setItem).toHaveBeenCalledWith(
      'gentleGames.parentTimerSession',
      expect.stringContaining('"locked":true'),
    );
  });

  it('remains locked after expiring and relaunching', async () => {
    const first = await renderTimer();
    jest.setSystemTime(Date.now() + 61_000);
    act(() => {
      jest.advanceTimersByTime(1000);
    });
    expect(first.getByTestId('locked').props.children).toBe('locked');

    await waitFor(() =>
      expect(storage.setItem).toHaveBeenCalledWith(
        'gentleGames.parentTimerSession',
        expect.stringContaining('"locked":true'),
      ),
    );
    const lockedSession = storage.setItem.mock.calls.at(-1)?.[1];
    first.unmount();
    storage.getItem.mockResolvedValueOnce(lockedSession);

    const second = await renderTimer();
    expect(second.getByTestId('locked').props.children).toBe('locked');
  });

  it('reconciles elapsed wall-clock time when returning to the foreground', async () => {
    let onAppStateChange: ((state: any) => void) | undefined;
    const addListenerSpy = jest
      .spyOn(AppState, 'addEventListener')
      .mockImplementation((_event, callback) => {
        onAppStateChange = callback;
        return { remove: jest.fn() } as ReturnType<typeof AppState.addEventListener>;
      });
    const { getByTestId } = await renderTimer();

    jest.setSystemTime(Date.now() + 30_000);
    act(() => onAppStateChange?.('active'));
    expect(getByTestId('seconds').props.children).toBe(30);

    addListenerSpy.mockRestore();
  });

  it('locks based on the deadline rather than interval tick count', async () => {
    const { getByTestId } = await renderTimer();
    jest.setSystemTime(Date.now() + 61_000);
    act(() => {
      jest.advanceTimersByTime(1000);
    });
    expect(getByTestId('seconds').props.children).toBe(0);
    expect(getByTestId('locked').props.children).toBe('locked');
  });

  it('clears the persisted allowance when the timer is disabled', async () => {
    const screen = await renderTimer();
    mockSettings.parentTimerMinutes = 0;
    screen.rerender(
      <ParentTimerProvider>
        <TestComponent />
      </ParentTimerProvider>,
    );
    await waitFor(() => expect(screen.getByTestId('seconds').props.children).toBe(0));
    expect(storage.removeItem).toHaveBeenCalledWith('gentleGames.parentTimerSession');
    expect(screen.getByTestId('locked').props.children).toBe('unlocked');
  });

  it('resets to the new duration when the configured duration changes', async () => {
    const screen = await renderTimer();
    jest.setSystemTime(Date.now() + 30_000);
    mockSettings.parentTimerMinutes = 2;
    screen.rerender(
      <ParentTimerProvider>
        <TestComponent />
      </ParentTimerProvider>,
    );

    await waitFor(() => expect(screen.getByTestId('seconds').props.children).toBe(120));
    expect(screen.getByTestId('locked').props.children).toBe('unlocked');
    expect(storage.setItem).toHaveBeenLastCalledWith(
      'gentleGames.parentTimerSession',
      expect.stringContaining('"durationMinutes":2'),
    );
  });

  it('discards malformed persisted data and starts a fresh session', async () => {
    storage.getItem.mockResolvedValueOnce('{not valid json');
    const { getByTestId } = await renderTimer();
    expect(getByTestId('seconds').props.children).toBe(60);
    expect(getByTestId('locked').props.children).toBe('unlocked');
    expect(storage.removeItem).toHaveBeenCalledWith('gentleGames.parentTimerSession');
    expect(storage.setItem).toHaveBeenCalledWith(
      'gentleGames.parentTimerSession',
      expect.stringContaining('"durationMinutes":1'),
    );
  });

  it('does not continue ticking after unmount', async () => {
    const { unmount } = await renderTimer();
    unmount();
    act(() => jest.advanceTimersByTime(1000));
  });

  it.each([
    { random: 0.9, question: '48 + 38 = ?', answer: '86' },
    { random: 0, question: '12 − 11 = ?', answer: '1' },
  ])(
    'restarts the allowance for a correct answer to $question',
    async ({ random, question, answer }) => {
      jest.spyOn(Math, 'random').mockReturnValue(random);
      mockSettings.animationsEnabled = false;
      storage.getItem.mockResolvedValueOnce(
        JSON.stringify({ expiresAt: Date.now() - 1, durationMinutes: 1, locked: true }),
      );
      const screen = await renderTimer();
      expect(screen.getByText(question)).toBeTruthy();
      fireEvent.changeText(screen.getByTestId('parent-timer-answer-input'), answer);
      fireEvent.press(screen.getByTestId('parent-timer-unlock-button'));
      expect(screen.getByTestId('locked').props.children).toBe('unlocked');
      expect(screen.getByTestId('seconds').props.children).toBe(60);
      await waitFor(() =>
        expect(storage.setItem).toHaveBeenCalledWith(
          'gentleGames.parentTimerSession',
          expect.stringContaining('"locked":false'),
        ),
      );
    },
  );

  it.each(['', '0', '1-2', '--1'])(
    'keeps the gate closed for an incorrect or malformed answer: %s',
    async (answer) => {
      jest.spyOn(Math, 'random').mockReturnValue(0);
      mockSettings.animationsEnabled = false;
      storage.getItem.mockResolvedValueOnce(
        JSON.stringify({ expiresAt: Date.now() - 1, durationMinutes: 1, locked: true }),
      );
      const screen = await renderTimer();
      fireEvent.changeText(screen.getByTestId('parent-timer-answer-input'), answer);
      fireEvent.press(screen.getByTestId('parent-timer-unlock-button'));
      expect(screen.getByTestId('locked').props.children).toBe('locked');
      expect(screen.getByTestId('seconds').props.children).toBe(0);
    },
  );

  it('offers a hold gesture and an equivalent screen-reader action without requiring arithmetic', async () => {
    storage.getItem.mockResolvedValueOnce(
      JSON.stringify({ expiresAt: Date.now() - 1, durationMinutes: 1, locked: true }),
    );
    const screen = await renderTimer();
    const holdButton = screen.getByTestId('parent-timer-hold-button');
    expect(holdButton.props.accessibilityRole).toBe('button');
    expect(holdButton.props.accessibilityHint).toBeTruthy();
    fireEvent.press(holdButton);
    expect(screen.getByTestId('locked').props.children).toBe('locked');
    fireEvent(holdButton, 'longPress');
    expect(screen.getByTestId('locked').props.children).toBe('unlocked');
    expect(screen.getByTestId('seconds').props.children).toBe(60);

    act(() => jest.advanceTimersByTime(61_000));
    expect(screen.getByTestId('locked').props.children).toBe('locked');
    fireEvent(screen.getByTestId('parent-timer-hold-button'), 'accessibilityAction', {
      nativeEvent: { actionName: 'activate' },
    });
    expect(screen.getByTestId('locked').props.children).toBe('unlocked');
  });
});
