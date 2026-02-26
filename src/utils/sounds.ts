import { Audio } from 'expo-av';
import { Settings } from '../types';

// Asset mapping — Metro will bundle these at build time
const soundAssets = {
  flip: require('../assets/sounds/flip.mp3'),
  match: require('../assets/sounds/match.mp3'),
  complete: require('../assets/sounds/complete.mp3'),
};

interface SoundEffect {
  sound: Audio.Sound | null;
  isLoaded: boolean;
}

const sounds: Record<string, SoundEffect> = {
  flip: { sound: null, isLoaded: false },
  match: { sound: null, isLoaded: false },
  complete: { sound: null, isLoaded: false },
};

const loadSound = async (name: keyof typeof soundAssets): Promise<void> => {
  try {
    const { sound } = await Audio.Sound.createAsync(
      soundAssets[name],
      { volume: 0.5 }
    );
    sounds[name].sound = sound;
    sounds[name].isLoaded = true;
  } catch (error) {
    console.warn(`Sound file for "${name}" not found. Add MP3 files to src/assets/sounds/ to enable audio.`);
  }
};

export const initializeSounds = async (): Promise<void> => {
  await Promise.all([
    loadSound('flip'),
    loadSound('match'),
    loadSound('complete'),
  ]);
};

const playSoundEffect = async (
  name: keyof typeof soundAssets,
  volumeMultiplier: number,
  settings: Settings
): Promise<void> => {
  if (!settings.soundEnabled) return;

  const effect = sounds[name];
  if (!effect?.isLoaded || !effect.sound) return;

  try {
    // Cap max volume at 50% so user 100% = actual 50%, user 50% = actual 25%
    const cappedUserVolume = settings.soundVolume * 0.5;
    const finalVolume = Math.max(0, Math.min(1, cappedUserVolume * volumeMultiplier));
    await effect.sound.setVolumeAsync(finalVolume);
    await effect.sound.setPositionAsync(0);
    await effect.sound.playAsync();
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

export const unloadSounds = async (): Promise<void> => {
  for (const effect of Object.values(sounds)) {
    if (effect.sound) {
      await effect.sound.unloadAsync();
    }
  }
  sounds.flip.isLoaded = false;
  sounds.match.isLoaded = false;
  sounds.complete.isLoaded = false;
};
