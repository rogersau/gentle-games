import { AudioPlayer, AudioSource, createAudioPlayer, setAudioModeAsync } from 'expo-audio';
import { useCallback, useEffect, useRef, useState } from 'react';

// Music tracks configuration
// Add your MP3 files to src/assets/sounds/music/ as track1.mp3, track2.mp3, track3.mp3
// See README.md in that folder for detailed instructions

const loadMusicTracks = (): Record<string, AudioSource> => {
  const tracks: Record<string, AudioSource> = {};
  
  try {
    // Dynamically load each track - if file doesn't exist, it will be skipped
    try { tracks.track1 = require('../assets/sounds/music/track1.mp3'); } catch { /* not found */ }
    try { tracks.track2 = require('../assets/sounds/music/track2.mp3'); } catch { /* not found */ }
    try { tracks.track3 = require('../assets/sounds/music/track3.mp3'); } catch { /* not found */ }
    
    if (Object.keys(tracks).length === 0) {
      console.log('Music: No tracks found. Add MP3 files to src/assets/sounds/music/ to enable music.');
    } else {
      console.log(`Music: Loaded ${Object.keys(tracks).length} track(s)`);
    }
  } catch {
    console.log('Music: Error loading tracks.');
  }
  
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

export const useBackgroundMusic = () => {
  const playerRef = useRef<AudioPlayer | null>(null);
  const [musicState, setMusicState] = useState<MusicState>({
    isPlaying: false,
    currentTrack: null,
  });
  const [isLoaded, setIsLoaded] = useState(false);

  // Initialize audio mode
  useEffect(() => {
    const initAudio = async () => {
      try {
        await setAudioModeAsync({
          playsInSilentMode: true,
          shouldPlayInBackground: true,
        });
      } catch (error) {
        console.warn('Failed to configure audio mode:', error);
      }
    };
    initAudio();
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (playerRef.current) {
        playerRef.current.remove();
        playerRef.current = null;
      }
    };
  }, []);

  const loadAndPlayTrack = useCallback(async (trackName: TrackName) => {
    try {
      // Remove existing player if any
      if (playerRef.current) {
        playerRef.current.remove();
        playerRef.current = null;
      }

      // Create new player
      const player = createAudioPlayer(musicTracks[trackName], {
        keepAudioSessionActive: true,
      });
      
      player.volume = 0.3; // Gentle background volume
      player.loop = true;
      
      playerRef.current = player;
      setIsLoaded(true);
      
      player.play();
      setMusicState({ isPlaying: true, currentTrack: trackName });
    } catch (error) {
      console.warn(`Failed to load music track "${String(trackName)}":`, error);
      setIsLoaded(false);
    }
  }, []);

  const toggleMusic = useCallback(async () => {
    if (musicState.isPlaying) {
      // Stop music
      if (playerRef.current) {
        playerRef.current.pause();
      }
      setMusicState(prev => ({ ...prev, isPlaying: false }));
    } else {
      // Check if tracks are available
      if (Object.keys(musicTracks).length === 0) {
        console.log('Music: No tracks available to play.');
        return;
      }
      
      // Start music with random track
      const track = getRandomTrack();
      
      if (!track) return;
      
      if (musicState.currentTrack && playerRef.current) {
        // Resume current track
        playerRef.current.play();
        setMusicState(prev => ({ ...prev, isPlaying: true }));
      } else {
        // Load and play new random track
        await loadAndPlayTrack(track);
      }
    }
  }, [musicState.isPlaying, musicState.currentTrack, loadAndPlayTrack]);

  const stopMusic = useCallback(() => {
    if (playerRef.current) {
      playerRef.current.pause();
    }
    setMusicState(prev => ({ ...prev, isPlaying: false }));
  }, []);

  return {
    isPlaying: musicState.isPlaying,
    isLoaded,
    currentTrack: musicState.currentTrack,
    toggleMusic,
    stopMusic,
  };
};
