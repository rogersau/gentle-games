import { AudioPlayer, createAudioPlayer, setAudioModeAsync } from 'expo-audio';
import { Settings } from '../types';

const soundAssets = {
  flip: require('../assets/sounds/flip.mp3'),
  match: require('../assets/sounds/match.mp3'),
  complete: require('../assets/sounds/complete.mp3'),
  pop: require('../assets/sounds/pop.mp3'),
};

interface SoundEffect {
  player: AudioPlayer | null;
  isLoaded: boolean;
}

const sounds: Record<keyof typeof soundAssets, SoundEffect> = {
  flip: { player: null, isLoaded: false },
  match: { player: null, isLoaded: false },
  complete: { player: null, isLoaded: false },
  pop: { player: null, isLoaded: false },
};

const loadSound = async (name: keyof typeof soundAssets): Promise<void> => {
  try {
    const player = createAudioPlayer(soundAssets[name], {
      keepAudioSessionActive: false,
    });
    player.volume = 0.5;
    player.loop = false;

    sounds[name].player = player;
    sounds[name].isLoaded = true;
  } catch (error) {
    console.warn(`Sound file for "${name}" not found. Add MP3 files to src/assets/sounds/ to enable audio.`);
  }
};

export const initializeSounds = async (): Promise<void> => {
  try {
    await setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: false,
    });
  } catch (error) {
    console.warn('Failed to configure audio mode:', error);
  }

  await Promise.all([loadSound('flip'), loadSound('match'), loadSound('complete'), loadSound('pop')]);
};

const playSoundEffect = async (
  name: keyof typeof soundAssets,
  volumeMultiplier: number,
  settings: Settings
): Promise<void> => {
  if (!settings.soundEnabled) return;

  const effect = sounds[name];
  if (!effect?.isLoaded || !effect.player) return;

  try {
    const cappedUserVolume = settings.soundVolume * 0.5;
    const finalVolume = Math.max(0, Math.min(1, cappedUserVolume * volumeMultiplier));
    effect.player.volume = finalVolume;
    await effect.player.seekTo(0);
    effect.player.play();
  } catch (error) {
    console.warn(`Failed to play ${name} sound:`, error);
  }
};

export const playFlipSound = async (settings: Settings): Promise<void> => {
  await playSoundEffect('flip', 0.6, settings);
};

export const playMatchSound = async (settings: Settings): Promise<void> => {
  await playSoundEffect('match', 0.8, settings);
};

export const playCompleteSound = async (settings: Settings): Promise<void> => {
  await playSoundEffect('complete', 1.0, settings);
};

export const playBubblePopSound = async (settings: Settings): Promise<void> => {
  await playSoundEffect('pop', 0.7, settings);
};

export const unloadSounds = async (): Promise<void> => {
  for (const effect of Object.values(sounds)) {
    if (effect.player) {
      effect.player.remove();
    }
  }

  sounds.flip.player = null;
  sounds.match.player = null;
  sounds.complete.player = null;
  sounds.pop.player = null;
  sounds.flip.isLoaded = false;
  sounds.match.isLoaded = false;
  sounds.complete.isLoaded = false;
  sounds.pop.isLoaded = false;
};

