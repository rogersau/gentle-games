import { Audio, AVPlaybackStatus } from 'expo-av';
import { Settings } from '../types';

interface SoundEffect {
  sound: Audio.Sound | null;
  isLoaded: boolean;
}

const sounds: Record<string, SoundEffect> = {
  flip: { sound: null, isLoaded: false },
  match: { sound: null, isLoaded: false },
  complete: { sound: null, isLoaded: false },
};

const loadSound = async (name: string): Promise<void> => {
  try {
    const { sound } = await Audio.Sound.createAsync(
      { uri: `assets/sounds/${name}.mp3` },
      { volume: 0.5 }
    );
    sounds[name].sound = sound;
    sounds[name].isLoaded = true;
  } catch (error) {
    console.warn(`Sound file assets/sounds/${name}.mp3 not found. Add sound files to enable audio.`);
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
  name: string,
  volume: number,
  settings: Settings
): Promise<void> => {
  if (!settings.soundEnabled) return;
  
  const effect = sounds[name];
  if (!effect?.isLoaded || !effect.sound) return;

  try {
    await effect.sound.setVolumeAsync(volume);
    await effect.sound.setPositionAsync(0);
    await effect.sound.playAsync();
  } catch (error) {
    console.warn(`Failed to play ${name} sound:`, error);
  }
};

export const playFlipSound = async (settings: Settings): Promise<void> => {
  await playSoundEffect('flip', settings.soundVolume * 0.3, settings);
};

export const playMatchSound = async (settings: Settings): Promise<void> => {
  await playSoundEffect('match', settings.soundVolume * 0.4, settings);
};

export const playCompleteSound = async (settings: Settings): Promise<void> => {
  await playSoundEffect('complete', settings.soundVolume * 0.5, settings);
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
