import { useCallback, useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { HistoryEntry } from '../components/DrawingCanvas';
import { serializeDrawingHistory } from '../utils/drawingPersistence';

interface UseDebouncedDrawingSaveOptions {
  storageKey: string;
  debounceMs?: number;
  onError?: (error: unknown) => void;
  onSuccess?: () => void;
}

interface UseDebouncedDrawingSaveResult {
  scheduleSave: (history: HistoryEntry[]) => void;
  flushPendingSave: () => Promise<void>;
}

export const DEFAULT_DRAWING_SAVE_DEBOUNCE_MS = 250;

export const useDebouncedDrawingSave = ({
  storageKey,
  debounceMs = DEFAULT_DRAWING_SAVE_DEBOUNCE_MS,
  onError,
  onSuccess,
}: UseDebouncedDrawingSaveOptions): UseDebouncedDrawingSaveResult => {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingHistoryRef = useRef<HistoryEntry[] | null>(null);
  const writeQueueRef = useRef<Promise<void>>(Promise.resolve());
  const mountedRef = useRef(true);
  const callbacksRef = useRef({ onError, onSuccess });
  callbacksRef.current = { onError, onSuccess };

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
          try {
            if (history.length > 0) {
              await AsyncStorage.setItem(storageKey, serializeDrawingHistory(history));
              if (mountedRef.current) callbacksRef.current.onSuccess?.();
              return;
            }

            await AsyncStorage.removeItem(storageKey);
            if (mountedRef.current) callbacksRef.current.onSuccess?.();
          } catch (error) {
            if (mountedRef.current) callbacksRef.current.onError?.(error);
          }
        });

      await writeQueueRef.current;
    },
    [storageKey],
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
    [clearPendingTimer, debounceMs, flushPendingSave],
  );

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      void flushPendingSave();
    };
  }, [flushPendingSave]);

  return {
    scheduleSave,
    flushPendingSave,
  };
};
