import { useState, useRef, useEffect, useCallback } from 'react';
import type { HistoryEntry } from '../components/DrawingCanvas';

interface UseDrawingHistoryOptions {
  initialHistory: HistoryEntry[];
  onHistoryChange?: (history: HistoryEntry[]) => void;
}

export function useDrawingHistory({ initialHistory, onHistoryChange }: UseDrawingHistoryOptions) {
  const [history, setHistory] = useState<HistoryEntry[]>(initialHistory);
  const [redoStack, setRedoStack] = useState<HistoryEntry[][]>([]);
  const historyRef = useRef(history);
  const nextActionIdRef = useRef(0);

  useEffect(() => {
    historyRef.current = history;
  }, [history]);

  useEffect(() => {
    onHistoryChange?.(history);
  }, [history, onHistoryChange]);

  const addToHistory = useCallback((entry: HistoryEntry) => {
    const next = [...historyRef.current, entry];
    historyRef.current = next;
    setHistory(next);
    setRedoStack([]);
  }, []);

  const addBatchToHistory = useCallback((entries: HistoryEntry[]) => {
    if (entries.length === 0) return;
    const next = [...historyRef.current, ...entries];
    historyRef.current = next;
    setHistory(next);
    setRedoStack([]);
  }, []);

  const undo = useCallback(() => {
    const prev = historyRef.current;
    if (prev.length === 0) return;
    const last = prev[prev.length - 1];
    let group: HistoryEntry[];
    let next: HistoryEntry[];
    if (last.actionId) {
      const start = prev.findLastIndex((entry) => entry.actionId !== last.actionId) + 1;
      group = prev.slice(start);
      next = prev.slice(0, start);
    } else {
      group = [last];
      next = prev.slice(0, -1);
    }
    historyRef.current = next;
    setHistory(next);
    setRedoStack((stack) => [...stack, group]);
  }, []);

  const redo = useCallback(() => {
    setRedoStack((stack) => {
      const group = stack[stack.length - 1];
      if (!group) return stack;
      const next = [...historyRef.current, ...group];
      historyRef.current = next;
      setHistory(next);
      return stack.slice(0, -1);
    });
  }, []);

  const clearHistory = useCallback(() => {
    historyRef.current = [];
    setHistory([]);
    setRedoStack([]);
  }, []);

  const getHistorySnapshot = useCallback(() => {
    return [...historyRef.current];
  }, []);

  return {
    history,
    addToHistory,
    addBatchToHistory,
    undo,
    redo,
    canRedo: redoStack.length > 0,
    clearHistory,
    getHistorySnapshot,
    nextActionIdRef,
  };
}
