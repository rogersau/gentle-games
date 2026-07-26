import { AppState } from 'react-native';
import { renderHook, act, waitFor } from '@testing-library/react-native';
import { useSettings } from '../context/SettingsContext';
import { useBackgroundMusic } from './music';

const mockUseSettings = jest.mocked(useSettings);

jest.mock('../context/SettingsContext', () => ({
  useSettings: jest.fn(),
}));

// Mock expo-audio
const mockPlayer = {
  play: jest.fn(),
  pause: jest.fn(),
  remove: jest.fn(),
  seekTo: jest.fn(() => Promise.resolve()),
  volume: 0.3,
  loop: true,
};

jest.mock('expo-audio', () => ({
  setAudioModeAsync: jest.fn(() => Promise.resolve()),
  createAudioPlayer: jest.fn(() => mockPlayer),
}));

describe('useBackgroundMusic', () => {
  let settings: { soundEnabled: boolean; soundVolume: number };
  let appStateListener: ((state: 'active' | 'background' | 'inactive') => void) | undefined;
  const removeListener = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    settings = { soundEnabled: true, soundVolume: 0.5 };
    mockUseSettings.mockImplementation(() => ({
      settings: settings as never,
      updateSettings: jest.fn(),
      isLoading: false,
      isSaving: false,
      persistenceError: null,
    }));
    jest.spyOn(AppState, 'addEventListener').mockImplementation(((event, listener) => {
      if (event === 'change') appStateListener = listener as typeof appStateListener;
      return { remove: removeListener } as ReturnType<typeof AppState.addEventListener>;
    }) as typeof AppState.addEventListener);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('initializes with correct default state', () => {
    const { result } = renderHook(() => useBackgroundMusic());

    expect(result.current.isPlaying).toBe(false);
    expect(result.current.isLoaded).toBe(false);
    expect(result.current.currentTrack).toBeNull();
  });

  it('configures audio mode on mount', () => {
    const { setAudioModeAsync } = require('expo-audio');

    renderHook(() => useBackgroundMusic());

    expect(setAudioModeAsync).toHaveBeenCalledWith({
      playsInSilentMode: false,
      shouldPlayInBackground: false,
    });
  });

  it('handles audio mode configuration errors gracefully', async () => {
    const { setAudioModeAsync } = require('expo-audio');
    setAudioModeAsync.mockRejectedValueOnce(new Error('Audio mode failed'));

    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

    renderHook(() => useBackgroundMusic());

    // Wait for the async init to complete
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(consoleSpy).toHaveBeenCalledWith('Failed to configure audio mode:', expect.any(Error));

    consoleSpy.mockRestore();
  });

  it('toggles music on when starting from stopped state', async () => {
    const { result } = renderHook(() => useBackgroundMusic());

    await act(async () => {
      await result.current.toggleMusic();
    });

    await waitFor(() => {
      expect(result.current.isPlaying).toBe(true);
      expect(result.current.isLoaded).toBe(true);
      expect(result.current.currentTrack).not.toBeNull();
    });

    expect(mockPlayer.play).toHaveBeenCalled();
  });

  it('toggles music off when currently playing', async () => {
    const { result } = renderHook(() => useBackgroundMusic());

    // Start music first
    await act(async () => {
      await result.current.toggleMusic();
    });

    await waitFor(() => {
      expect(result.current.isPlaying).toBe(true);
    });

    // Toggle off
    await act(async () => {
      await result.current.toggleMusic();
    });

    await waitFor(() => {
      expect(result.current.isPlaying).toBe(false);
    });

    expect(mockPlayer.pause).toHaveBeenCalled();
  });

  it('resumes current track when toggling back on', async () => {
    const { result } = renderHook(() => useBackgroundMusic());

    // Start music
    await act(async () => {
      await result.current.toggleMusic();
    });

    await waitFor(() => {
      expect(result.current.isPlaying).toBe(true);
    });

    const currentTrack = result.current.currentTrack;

    // Stop
    await act(async () => {
      await result.current.toggleMusic();
    });

    mockPlayer.play.mockClear();

    // Resume
    await act(async () => {
      await result.current.toggleMusic();
    });

    await waitFor(() => {
      expect(result.current.isPlaying).toBe(true);
      expect(result.current.currentTrack).toBe(currentTrack);
    });

    expect(mockPlayer.play).toHaveBeenCalled();
  });

  it('stops music when stopMusic is called', async () => {
    const { result } = renderHook(() => useBackgroundMusic());

    // Start music
    await act(async () => {
      await result.current.toggleMusic();
    });

    await waitFor(() => {
      expect(result.current.isPlaying).toBe(true);
    });

    // Stop
    act(() => {
      result.current.stopMusic();
    });

    await waitFor(() => {
      expect(result.current.isPlaying).toBe(false);
    });

    expect(mockPlayer.pause).toHaveBeenCalled();
  });

  it('cleans up player on unmount', async () => {
    const { result, unmount } = renderHook(() => useBackgroundMusic());

    // Start music first
    await act(async () => {
      await result.current.toggleMusic();
    });

    unmount();

    expect(mockPlayer.remove).toHaveBeenCalled();
  });


  it('honours global volume, stops when sound is disabled, and does not auto-start on re-enable', async () => {
    const { result, rerender } = renderHook(() => useBackgroundMusic());

    await act(async () => {
      await result.current.toggleMusic();
    });
    expect(mockPlayer.volume).toBe(0.5);
    expect(result.current.isPlaying).toBe(true);

    settings = { soundEnabled: true, soundVolume: 0.2 };
    rerender({});
    expect(mockPlayer.volume).toBe(0.2);

    settings = { soundEnabled: false, soundVolume: 0.2 };
    rerender({});
    expect(mockPlayer.pause).toHaveBeenCalled();
    expect(result.current.isPlaying).toBe(false);

    settings = { soundEnabled: true, soundVolume: 0.2 };
    rerender({});
    expect(mockPlayer.play).toHaveBeenCalledTimes(1);
    expect(result.current.isPlaying).toBe(false);
  });

  it('stops when the app moves to the background', async () => {
    const { result } = renderHook(() => useBackgroundMusic());
    await act(async () => {
      await result.current.toggleMusic();
    });

    act(() => {
      appStateListener?.('background');
    });
    expect(mockPlayer.pause).toHaveBeenCalled();
    expect(result.current.isPlaying).toBe(false);
  });

  it('cleans up when play fails', async () => {
    mockPlayer.play.mockRejectedValueOnce(new Error('play failed'));
    const { result } = renderHook(() => useBackgroundMusic());

    await act(async () => {
      await result.current.toggleMusic();
    });

    expect(result.current.isLoaded).toBe(false);
    expect(result.current.isPlaying).toBe(false);
    expect(result.current.currentTrack).toBeNull();
    expect(mockPlayer.remove).toHaveBeenCalled();
  });

  it('handles track loading errors gracefully', async () => {
    const { createAudioPlayer } = require('expo-audio');
    createAudioPlayer.mockImplementationOnce(() => {
      throw new Error('Track load failed');
    });

    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

    const { result } = renderHook(() => useBackgroundMusic());

    await act(async () => {
      await result.current.toggleMusic();
    });

    await waitFor(() => {
      expect(result.current.isLoaded).toBe(false);
    });

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('Failed to load music track'),
      expect.any(Error),
    );

    consoleSpy.mockRestore();
  });
});
