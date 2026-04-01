import { useState, useRef, useEffect, useCallback } from 'react';
import type { HistoryEntry } from '../components/DrawingCanvas';

interface UseDrawingHistoryOptions {
  initialHistory: HistoryEntry[];
  onHistoryChange?: (history: HistoryEntry[]) => void;
}

export function useDrawingHistory({
  initialHistory,
  onHistoryChange,
}: UseDrawingHistoryOptions) {
  const [history, setHistory] = useState<HistoryEntry[]>(initialHistory);
  const historyRef = useRef(history);
  const nextActionIdRef = useRef(0);

  useEffect(() => {
    historyRef.current = history;
  }, [history]);

  useEffect(() => {
    onHistoryChange?.(history);
  }, [history, onHistoryChange]);

  const addToHistory = useCallback((entry: HistoryEntry) => {
    setHistory((prev) => [...prev, entry]);
  }, []);

  const undo = useCallback(() => {
    setHistory((prev) => {
      if (prev.length === 0) return prev;
      const last = prev[prev.length - 1];
      if (last.actionId) {
        return prev.filter((entry) => entry.actionId !== last.actionId);
      }
      return prev.slice(0, -1);
    });
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
  }, []);

  const getHistorySnapshot = useCallback(() => {
    return [...historyRef.current];
  }, []);

  return {
    history,
    addToHistory,
    undo,
    clearHistory,
    getHistorySnapshot,
    nextActionIdRef,
  };
}
