import { useCallback, useEffect, useRef, useState } from 'react';

export interface UseTrackedTimeoutsResult {
  queueTimeout: (callback: () => void, delay: number) => void;
  clearAllTimeouts: () => void;
  pendingTimeoutCount: number;
}

export const useTrackedTimeouts = (): UseTrackedTimeoutsResult => {
  const timeoutIdsRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const isMountedRef = useRef(true);
  const [pendingTimeoutCount, setPendingTimeoutCount] = useState(0);

  const syncPendingTimeoutCount = useCallback(() => {
    if (isMountedRef.current) {
      setPendingTimeoutCount(timeoutIdsRef.current.length);
    }
  }, []);

  const queueTimeout = useCallback(
    (callback: () => void, delay: number) => {
      const timeoutId = setTimeout(() => {
        timeoutIdsRef.current = timeoutIdsRef.current.filter((id) => id !== timeoutId);
        syncPendingTimeoutCount();
        callback();
      }, delay);

      timeoutIdsRef.current.push(timeoutId);
      syncPendingTimeoutCount();
    },
    [syncPendingTimeoutCount]
  );

  const clearAllTimeouts = useCallback(() => {
    timeoutIdsRef.current.forEach((timeoutId) => clearTimeout(timeoutId));
    timeoutIdsRef.current = [];
    syncPendingTimeoutCount();
  }, [syncPendingTimeoutCount]);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      timeoutIdsRef.current.forEach((timeoutId) => clearTimeout(timeoutId));
      timeoutIdsRef.current = [];
    };
  }, []);

  return {
    queueTimeout,
    clearAllTimeouts,
    pendingTimeoutCount,
  };
};
