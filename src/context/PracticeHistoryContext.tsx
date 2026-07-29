import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  DEFAULT_PRACTICE_HISTORY_SETTINGS,
  parsePracticeHistoryStorage,
  PRACTICE_HISTORY_STORAGE_KEY,
  PracticeHistoryRetentionDays,
  PracticeHistorySettings,
  PracticeResult,
  prunePracticeResults,
  sanitizePracticeResult,
  serializePracticeHistory,
} from '../utils/practiceHistory';

export interface PracticeHistoryContextValue {
  records: PracticeResult[];
  settings: PracticeHistorySettings;
  recordResult: (result: PracticeResult) => Promise<void>;
  updateSettings: (changes: Partial<PracticeHistorySettings>) => Promise<void>;
  deleteAllRecords: () => Promise<void>;
  clearHistory: () => Promise<void>;
  isLoading: boolean;
  isSaving: boolean;
  persistenceError: string | null;
}

const PracticeHistoryContext = createContext<PracticeHistoryContextValue | undefined>(undefined);

const errorMessage = (error: unknown): string => {
  if (error instanceof Error && error.message) return error.message;
  return 'Unable to save practice history';
};

const isRetentionDays = (value: unknown): value is PracticeHistoryRetentionDays =>
  value === 7 || value === 30 || value === 90;

const sanitizeSettings = (
  current: PracticeHistorySettings,
  changes: Partial<PracticeHistorySettings>,
): PracticeHistorySettings => ({
  enabled: typeof changes.enabled === 'boolean' ? changes.enabled : current.enabled,
  retentionDays: isRetentionDays(changes.retentionDays)
    ? changes.retentionDays
    : current.retentionDays,
});

export const PracticeHistoryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState(DEFAULT_PRACTICE_HISTORY_SETTINGS);
  const [records, setRecords] = useState<PracticeResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [persistenceError, setPersistenceError] = useState<string | null>(null);
  const settingsRef = useRef(settings);
  const recordsRef = useRef(records);
  const mountedRef = useRef(true);
  const storageQueueRef = useRef(Promise.resolve());
  const pendingWritesRef = useRef(0);
  const writeVersionRef = useRef(0);
  const [hydrationGate] = useState(() => {
    let resolve: () => void = () => {};
    const promise = new Promise<void>((resolvePromise) => {
      resolve = resolvePromise;
    });
    return { promise, resolve };
  });

  const enqueueStorageOperation = useCallback((operation: () => Promise<void>): Promise<void> => {
    const operationPromise = storageQueueRef.current.catch(() => undefined).then(operation);
    storageQueueRef.current = operationPromise.catch(() => undefined);
    return operationPromise;
  }, []);

  const persistSnapshot = useCallback(
    (nextSettings: PracticeHistorySettings, nextRecords: PracticeResult[]): Promise<void> => {
      const version = ++writeVersionRef.current;
      pendingWritesRef.current += 1;
      if (mountedRef.current) setIsSaving(true);
      const snapshot = serializePracticeHistory(nextSettings, nextRecords);
      const writePromise = enqueueStorageOperation(async () => {
        await AsyncStorage.setItem(PRACTICE_HISTORY_STORAGE_KEY, snapshot);
      });
      void writePromise
        .then(() => {
          if (mountedRef.current && version === writeVersionRef.current) setPersistenceError(null);
        })
        .catch((error: unknown) => {
          if (mountedRef.current && version === writeVersionRef.current)
            setPersistenceError(errorMessage(error));
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
    let cancelled = false;
    const hydrate = async () => {
      let raw: string | null = null;
      let readFailed = false;
      try {
        raw = await AsyncStorage.getItem(PRACTICE_HISTORY_STORAGE_KEY);
      } catch (error) {
        readFailed = true;
        if (mountedRef.current) setPersistenceError(errorMessage(error));
      }

      const parsed = readFailed ? null : parsePracticeHistoryStorage(raw);
      if (cancelled) return;
      if (raw !== null && parsed === null) {
        try {
          await enqueueStorageOperation(() =>
            AsyncStorage.removeItem(PRACTICE_HISTORY_STORAGE_KEY).then(() => undefined),
          );
        } catch {
          // A malformed value is still treated as empty if cleanup also fails.
        }
      }
      if (cancelled) return;

      const nextSettings = parsed?.value.settings ?? DEFAULT_PRACTICE_HISTORY_SETTINGS;
      const nextRecords = parsed?.value.records ?? [];
      settingsRef.current = nextSettings;
      recordsRef.current = nextRecords;
      setSettings(nextSettings);
      setRecords(nextRecords);

      if (parsed?.shouldPersist) {
        try {
          await persistSnapshot(nextSettings, nextRecords);
        } catch {
          // The persistence error is exposed without blocking hydration.
        }
      }
      if (mountedRef.current) setIsLoading(false);
      hydrationGate.resolve();
    };
    void hydrate();
    return () => {
      cancelled = true;
      mountedRef.current = false;
    };
  }, [enqueueStorageOperation, hydrationGate, persistSnapshot]);

  const updateSettings = useCallback(
    async (changes: Partial<PracticeHistorySettings>) => {
      await hydrationGate.promise;
      if (!mountedRef.current) return;
      const nextSettings = sanitizeSettings(settingsRef.current, changes);
      const nextRecords = prunePracticeResults(recordsRef.current, nextSettings.retentionDays);
      settingsRef.current = nextSettings;
      recordsRef.current = nextRecords;
      setSettings(nextSettings);
      setRecords(nextRecords);
      try {
        await persistSnapshot(nextSettings, nextRecords);
      } catch {
        // Persistence failures are surfaced through persistenceError.
      }
    },
    [hydrationGate, persistSnapshot],
  );

  const recordResult = useCallback(
    async (result: PracticeResult) => {
      await hydrationGate.promise;
      if (!mountedRef.current || !settingsRef.current.enabled) return;
      const sanitized = sanitizePracticeResult(result);
      if (!sanitized) return;
      const nextRecords = prunePracticeResults(
        [...recordsRef.current, sanitized],
        settingsRef.current.retentionDays,
      );
      recordsRef.current = nextRecords;
      setRecords(nextRecords);
      try {
        await persistSnapshot(settingsRef.current, nextRecords);
      } catch {
        // Persistence failures are surfaced through persistenceError.
      }
    },
    [hydrationGate, persistSnapshot],
  );

  const deleteAllRecords = useCallback(async () => {
    await hydrationGate.promise;
    if (!mountedRef.current) return;
    recordsRef.current = [];
    setRecords([]);
    try {
      await persistSnapshot(settingsRef.current, []);
    } catch {
      // Persistence failures are surfaced through persistenceError.
    }
  }, [hydrationGate, persistSnapshot]);

  useEffect(
    () => () => {
      mountedRef.current = false;
    },
    [],
  );

  return (
    <PracticeHistoryContext.Provider
      value={{
        records,
        settings,
        recordResult,
        updateSettings,
        deleteAllRecords,
        clearHistory: deleteAllRecords,
        isLoading,
        isSaving,
        persistenceError,
      }}
    >
      {children}
    </PracticeHistoryContext.Provider>
  );
};

export const usePracticeHistory = (): PracticeHistoryContextValue => {
  const context = useContext(PracticeHistoryContext);
  if (context === undefined) {
    throw new Error('usePracticeHistory must be used within a PracticeHistoryProvider');
  }
  return context;
};
