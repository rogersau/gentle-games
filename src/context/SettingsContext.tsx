import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ColorMode, Settings } from '../types';

interface SettingsContextType {
  settings: Settings;
  updateSettings: (newSettings: Partial<Settings>) => Promise<void>;
  isLoading: boolean;
}

const defaultSettings: Settings = {
  animationsEnabled: true,
  soundEnabled: true,
  soundVolume: 0.5,
  difficulty: 'medium',
  theme: 'mixed',
  showCardPreview: true,
  colorMode: 'system',
};

const toBoolean = (value: unknown, fallback: boolean): boolean => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (normalized === 'true') return true;
    if (normalized === 'false') return false;
  }
  return fallback;
};

const toVolume = (value: unknown, fallback: number): number => {
  if (typeof value !== 'number' || Number.isNaN(value)) return fallback;
  if (value < 0) return 0;
  if (value > 1) return 1;
  return value;
};

const toDifficulty = (value: unknown, fallback: Settings['difficulty']): Settings['difficulty'] => {
  if (value === 'easy' || value === 'medium' || value === 'hard') return value;
  return fallback;
};

const toTheme = (value: unknown, fallback: Settings['theme']): Settings['theme'] => {
  if (value === 'animals' || value === 'shapes' || value === 'mixed') return value;
  return fallback;
};

const toColorMode = (value: unknown, fallback: ColorMode): ColorMode => {
  if (value === 'light' || value === 'dark' || value === 'system') return value;
  return fallback;
};

const sanitizeSettings = (candidate: unknown): Settings => {
  if (!candidate || typeof candidate !== 'object' || Array.isArray(candidate)) {
    return defaultSettings;
  }

  const parsed = candidate as Record<string, unknown>;

  return {
    animationsEnabled: toBoolean(parsed.animationsEnabled, defaultSettings.animationsEnabled),
    soundEnabled: toBoolean(parsed.soundEnabled, defaultSettings.soundEnabled),
    soundVolume: toVolume(parsed.soundVolume, defaultSettings.soundVolume),
    difficulty: toDifficulty(parsed.difficulty, defaultSettings.difficulty),
    theme: toTheme(parsed.theme, defaultSettings.theme),
    showCardPreview: toBoolean(parsed.showCardPreview, defaultSettings.showCardPreview),
    colorMode: toColorMode(parsed.colorMode, defaultSettings.colorMode),
  };
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const savedSettings = await AsyncStorage.getItem('gentleMatchSettings');
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        setSettings(sanitizeSettings(parsed));
      }
    } catch (error) {
      console.warn('Failed to load settings:', error);
      // Clear corrupted settings
      await AsyncStorage.removeItem('gentleMatchSettings');
    } finally {
      setIsLoading(false);
    }
  };

  const updateSettings = async (newSettings: Partial<Settings>) => {
    try {
      const normalized = sanitizeSettings({ ...settings, ...newSettings });
      const updated = { ...settings, ...normalized };
      setSettings(updated);
      await AsyncStorage.setItem('gentleMatchSettings', JSON.stringify(updated));
    } catch (error) {
      console.warn('Failed to save settings:', error);
    }
  };

  return (
    <SettingsContext.Provider value={{ settings, updateSettings, isLoading }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
