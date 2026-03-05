import { renderHook, act, waitFor } from '@testing-library/react-native';
import { useBackgroundMusic } from './music';

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
  beforeEach(() => {
    jest.clearAllMocks();
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
      playsInSilentMode: true,
      shouldPlayInBackground: true,
    });
  });

  it('handles audio mode configuration errors gracefully', async () => {
    const { setAudioModeAsync } = require('expo-audio');
    setAudioModeAsync.mockRejectedValueOnce(new Error('Audio mode failed'));

    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
    
    renderHook(() => useBackgroundMusic());

    // Wait for the async init to complete
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(consoleSpy).toHaveBeenCalledWith(
      'Failed to configure audio mode:',
      expect.any(Error)
    );

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
      expect.any(Error)
    );

    consoleSpy.mockRestore();
  });
});
