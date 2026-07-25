import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
  useReducer,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ColorMode, Settings } from '../types';
import { SupportedLanguage, DEFAULT_LANGUAGE } from '../types/i18n';
import { changeLanguage } from '../i18n';
import { GameId, isGameId } from '../games/registry';

interface SettingsContextType {
  settings: Settings;
  updateSettings: (newSettings: Partial<Settings>) => Promise<void>;
  isLoading: boolean;
  isSaving: boolean;
  persistenceError: string | null;
}

const defaultSettings: Settings = {
  animationsEnabled: true,
  soundEnabled: true,
  soundVolume: 0.5,
  difficulty: 'medium',
  theme: 'mixed',
  showCardPreview: true,
  keepyUppyEasyMode: true,
  colorMode: 'system',
  hiddenGames: [],
  parentTimerMinutes: 0,
  enableUnfinishedGames: false,
  language: DEFAULT_LANGUAGE,
  reducedMotionEnabled: false,
  telemetryEnabled: false,
  showMochiInGames: true,
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

const toHiddenGames = (value: unknown): GameId[] => {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is GameId => typeof item === 'string' && isGameId(item));
};

const toParentTimerMinutes = (value: unknown): number => {
  if (typeof value !== 'number' || Number.isNaN(value)) return 0;
  if (value < 0) return 0;
  return Math.floor(value);
};

const toLanguage = (value: unknown): SupportedLanguage => {
  if (value === 'en-AU' || value === 'en-US') return value;
  return DEFAULT_LANGUAGE;
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
    keepyUppyEasyMode: toBoolean(parsed.keepyUppyEasyMode, defaultSettings.keepyUppyEasyMode),
    colorMode: toColorMode(parsed.colorMode, defaultSettings.colorMode),
    hiddenGames: toHiddenGames(parsed.hiddenGames),
    parentTimerMinutes: toParentTimerMinutes(parsed.parentTimerMinutes),
    enableUnfinishedGames: toBoolean(
      parsed.enableUnfinishedGames,
      defaultSettings.enableUnfinishedGames,
    ),
    language: toLanguage(parsed.language),
    reducedMotionEnabled: toBoolean(
      parsed.reducedMotionEnabled,
      defaultSettings.reducedMotionEnabled,
    ),
    telemetryEnabled: toBoolean(parsed.telemetryEnabled, defaultSettings.telemetryEnabled),
    showMochiInGames: toBoolean(parsed.showMochiInGames, defaultSettings.showMochiInGames),
  };
};

const areSettingsEqual = (left: Settings, right: Settings): boolean => {
  return JSON.stringify(left) === JSON.stringify(right);
};

type SettingsAction =
  | { type: 'replace'; settings: Settings }
  | { type: 'merge'; values: Partial<Settings> };

const settingsReducer = (state: Settings, action: SettingsAction): Settings => {
  if (action.type === 'replace') return action.settings;
  return sanitizeSettings({ ...state, ...action.values });
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);
const SETTINGS_STORAGE_KEY = 'gentleMatchSettings';

const errorMessage = (error: unknown): string => {
  if (error instanceof Error && error.message) return error.message;
  return 'Unable to save settings';
};

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, dispatchSettings] = useReducer(settingsReducer, defaultSettings);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [persistenceError, setPersistenceError] = useState<string | null>(null);
  const settingsRef = useRef(defaultSettings);
  const mountedRef = useRef(true);
  const storageQueueRef = useRef(Promise.resolve());
  const pendingWritesRef = useRef(0);
  const writeVersionRef = useRef(0);
  const hydrationResolveRef = useRef<() => void>(() => undefined);
  const hydrationPromiseRef = useRef(
    new Promise<void>((resolve) => {
      hydrationResolveRef.current = resolve;
    }),
  );

  const enqueueStorageOperation = useCallback((operation: () => Promise<void>): Promise<void> => {
    // Recover the chain after a failed operation so later changes still save.
    const operationPromise = storageQueueRef.current.catch(() => undefined).then(operation);
    storageQueueRef.current = operationPromise.catch(() => undefined);
    return operationPromise;
  }, []);

  const persistSettings = useCallback(
    (snapshot: Settings): Promise<void> => {
      const version = ++writeVersionRef.current;
      pendingWritesRef.current += 1;
      if (mountedRef.current) setIsSaving(true);

      const writePromise = enqueueStorageOperation(async () => {
        await AsyncStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(snapshot));
      });

      void writePromise
        .then(() => {
          if (mountedRef.current && version === writeVersionRef.current) {
            setPersistenceError(null);
          }
        })
        .catch((error: unknown) => {
          console.warn('Failed to save settings:', error);
          if (mountedRef.current && version === writeVersionRef.current) {
            setPersistenceError(errorMessage(error));
          }
        })
        .finally(() => {
          pendingWritesRef.current -= 1;
          if (mountedRef.current && pendingWritesRef.current === 0) setIsSaving(false);
        });

      return writePromise;
    },
    [enqueueStorageOperation],
  );

  useEffect(() => {
    mountedRef.current = true;
    let cancelled = false;
    const loadSettings = async () => {
      let sanitized = defaultSettings;
      let shouldPersistSanitized = false;

      try {
        const savedSettings = await AsyncStorage.getItem(SETTINGS_STORAGE_KEY);
        if (savedSettings) {
          const parsed = JSON.parse(savedSettings);
          sanitized = sanitizeSettings(parsed);
          shouldPersistSanitized = !areSettingsEqual(sanitized, parsed as Settings);
        }
      } catch (error) {
        console.warn('Failed to load settings:', error);
        try {
          await enqueueStorageOperation(async () => {
            await AsyncStorage.removeItem(SETTINGS_STORAGE_KEY);
          });
        } catch (removeError) {
          console.warn('Failed to clear settings:', removeError);
          if (mountedRef.current) setPersistenceError(errorMessage(removeError));
        }
      }

      if (cancelled) return;

      settingsRef.current = sanitized;
      dispatchSettings({ type: 'replace', settings: sanitized });

      if (shouldPersistSanitized) {
        try {
          await persistSettings(sanitized);
        } catch {
          // persistSettings records the error for the UI; hydration can finish.
        }
      }

      if (mountedRef.current) setIsLoading(false);
      hydrationResolveRef.current();
    };

    void loadSettings();
    return () => {
      cancelled = true;
      mountedRef.current = false;
    };
  }, [enqueueStorageOperation, persistSettings]);

  useEffect(() => {
    if (!isLoading) void changeLanguage(settings.language);
  }, [isLoading, settings.language]);

  const updateSettings = useCallback(
    async (newSettings: Partial<Settings>) => {
      await hydrationPromiseRef.current;
      if (!mountedRef.current) return;

      // Keep a canonical latest snapshot so rapid updates merge with one another.
      const updated = sanitizeSettings({ ...settingsRef.current, ...newSettings });
      settingsRef.current = updated;
      dispatchSettings({ type: 'merge', values: newSettings });
      try {
        await persistSettings(updated);
      } catch {
        // Persistence failures are exposed through persistenceError without interrupting the UI.
      }
    },
    [persistSettings],
  );

  return (
    <SettingsContext.Provider
      value={{ settings, updateSettings, isLoading, isSaving, persistenceError }}
    >
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
