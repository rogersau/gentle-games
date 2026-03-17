import { useCallback, useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { HistoryEntry } from '../components/DrawingCanvas';

interface UseDebouncedDrawingSaveOptions {
  storageKey: string;
  debounceMs?: number;
}

interface UseDebouncedDrawingSaveResult {
  scheduleSave: (history: HistoryEntry[]) => void;
  flushPendingSave: () => Promise<void>;
}

const DEFAULT_DEBOUNCE_MS = 250;

export const useDebouncedDrawingSave = ({
  storageKey,
  debounceMs = DEFAULT_DEBOUNCE_MS,
}: UseDebouncedDrawingSaveOptions): UseDebouncedDrawingSaveResult => {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingHistoryRef = useRef<HistoryEntry[] | null>(null);
  const writeQueueRef = useRef<Promise<void>>(Promise.resolve());

  const clearPendingTimer = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const persistHistory = useCallback(
    async (history: HistoryEntry[]) => {
      writeQueueRef.current = writeQueueRef.current
        .catch(() => undefined)
        .then(async () => {
          if (history.length > 0) {
            await AsyncStorage.setItem(storageKey, JSON.stringify(history));
            return;
          }

          await AsyncStorage.removeItem(storageKey);
        });

      await writeQueueRef.current;
    },
    [storageKey]
  );

  const flushPendingSave = useCallback(async () => {
    clearPendingTimer();

    if (!pendingHistoryRef.current) {
      return;
    }

    const historyToPersist = pendingHistoryRef.current;
    pendingHistoryRef.current = null;
    await persistHistory(historyToPersist);
  }, [clearPendingTimer, persistHistory]);

  const scheduleSave = useCallback(
    (history: HistoryEntry[]) => {
      pendingHistoryRef.current = history;
      clearPendingTimer();
      timeoutRef.current = setTimeout(() => {
        void flushPendingSave();
      }, debounceMs);
    },
    [clearPendingTimer, debounceMs, flushPendingSave]
  );

  useEffect(() => clearPendingTimer, [clearPendingTimer]);

  return {
    scheduleSave,
    flushPendingSave,
  };
};

