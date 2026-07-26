import { AppState, AppStateStatus } from 'react-native';
import { AudioPlayer, AudioSource, createAudioPlayer } from 'expo-audio';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useSettings } from '../context/SettingsContext';

// Music tracks configuration.
// If you rename or remove a track file, update this list; required files must exist at bundle time.

const loadMusicTracks = (): Record<string, AudioSource> => {
  const tracks: Record<string, AudioSource> = {
    track1: require('../assets/sounds/music/track1.mp3'),
    track2: require('../assets/sounds/music/track2.mp3'),
    track3: require('../assets/sounds/music/track3.mp3'),
    track4: require('../assets/sounds/music/track4.mp3'),
  };
  console.log(`Music: Loaded ${Object.keys(tracks).length} track(s)`);
  return tracks;
};

const musicTracks = loadMusicTracks();
type TrackName = keyof typeof musicTracks;

interface MusicState {
  isPlaying: boolean;
  currentTrack: TrackName | null;
}

const getRandomTrack = (): TrackName | null => {
  const tracks = Object.keys(musicTracks) as TrackName[];
  if (tracks.length === 0) return null;
  return tracks[Math.floor(Math.random() * tracks.length)];
};

const isExplicitlyInactive = (state: AppStateStatus): boolean =>
  state === 'background' || state === 'inactive';

const removePlayer = (player: AudioPlayer | null): void => {
  if (!player) return;
  try {
    player.remove();
  } catch (error) {
    console.warn('Failed to remove music player:', error);
  }
};

export const useBackgroundMusic = () => {
  const { settings } = useSettings();
  const playerRef = useRef<AudioPlayer | null>(null);
  const settingsRef = useRef(settings);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState ?? 'active');
  const playRequestRef = useRef(0);
  const [musicState, setMusicState] = useState<MusicState>({
    isPlaying: false,
    currentTrack: null,
  });
  const [isLoaded, setIsLoaded] = useState(false);

  settingsRef.current = settings;

  const stopMusic = useCallback((remove = false) => {
    playRequestRef.current += 1;
    const player = playerRef.current;
    if (player) {
      try {
        player.pause();
      } catch (error) {
        console.warn('Failed to pause music:', error);
      }
      if (remove) {
        removePlayer(player);
        playerRef.current = null;
        setIsLoaded(false);
        setMusicState((previous) => ({ ...previous, currentTrack: null }));
      }
    }
    setMusicState((previous) => ({ ...previous, isPlaying: false }));
  }, []);

  const stopMusicRef = useRef(stopMusic);
  stopMusicRef.current = stopMusic;

  // Stop as soon as the app loses focus.
  useEffect(() => {
    const handleAppStateChange = (nextState: AppStateStatus) => {
      appStateRef.current = nextState;
      if (nextState !== 'active') {
        stopMusicRef.current();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, []);

  // Global sound settings are authoritative while this screen is mounted.
  // Turning sound back on only permits a future explicit toggle.
  useEffect(() => {
    if (!settings.soundEnabled) {
      stopMusicRef.current();
      return;
    }

    if (playerRef.current) {
      playerRef.current.volume = settings.soundVolume;
    }
  }, [settings.soundEnabled, settings.soundVolume]);

  // Remove the player when the hook is unmounted.
  useEffect(() => {
    return () => stopMusicRef.current(true);
  }, []);

  const loadAndPlayTrack = useCallback(async (trackName: TrackName) => {
    if (!settingsRef.current.soundEnabled || isExplicitlyInactive(appStateRef.current)) return;

    const playRequest = playRequestRef.current + 1;
    playRequestRef.current = playRequest;
    let player: AudioPlayer | null = null;
    try {
      removePlayer(playerRef.current);
      playerRef.current = null;

      player = createAudioPlayer(musicTracks[trackName], {
        keepAudioSessionActive: false,
      });
      player.volume = settingsRef.current.soundVolume;
      player.loop = true;
      playerRef.current = player;

      // Awaiting also catches a rejected play promise in test/native adapters.
      await player.play();
      if (playRequest !== playRequestRef.current || !settingsRef.current.soundEnabled || isExplicitlyInactive(appStateRef.current)) {
        removePlayer(playerRef.current);
        playerRef.current = null;
        setIsLoaded(false);
        setMusicState({ isPlaying: false, currentTrack: null });
        return;
      }
      setIsLoaded(true);
      setMusicState({ isPlaying: true, currentTrack: trackName });
    } catch (error) {
      console.warn(`Failed to load music track "${String(trackName)}":`, error);
      removePlayer(playerRef.current ?? player);
      playerRef.current = null;
      setIsLoaded(false);
      setMusicState({ isPlaying: false, currentTrack: null });
    }
  }, []);

  const toggleMusic = useCallback(async () => {
    if (musicState.isPlaying) {
      stopMusic();
      return;
    }

    if (!settingsRef.current.soundEnabled || isExplicitlyInactive(appStateRef.current)) return;

    if (Object.keys(musicTracks).length === 0) {
      console.log('Music: No tracks available to play.');
      return;
    }

    const track = musicState.currentTrack ?? getRandomTrack();
    if (!track) return;

    if (musicState.currentTrack && playerRef.current) {
      try {
        playerRef.current.volume = settingsRef.current.soundVolume;
        await playerRef.current.play();
        setMusicState((previous) => ({ ...previous, isPlaying: true }));
      } catch (error) {
        console.warn('Failed to resume music:', error);
        stopMusic(true);
      }
    } else {
      await loadAndPlayTrack(track);
    }
  }, [musicState.currentTrack, musicState.isPlaying, loadAndPlayTrack, stopMusic]);

  return {
    isPlaying: musicState.isPlaying,
    isLoaded,
    currentTrack: musicState.currentTrack,
    toggleMusic,
    stopMusic,
  };
};
