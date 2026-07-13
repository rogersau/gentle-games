import { useState, useRef, useEffect, useMemo } from 'react';
import { PanResponder } from 'react-native';
import { useDrawingHistory } from './useDrawingHistory';
import { useDrawingTools } from './useDrawingTools';
import { useSymmetry } from './useSymmetry';
import type { HistoryEntry, Stroke, Point } from '../components/DrawingCanvas';

interface UseDrawingCanvasOptions {
  initialHistory: HistoryEntry[];
  onHistoryChange?: (history: HistoryEntry[]) => void;
  canvasWidth: number;
  canvasHeight: number;
}

export function useDrawingCanvas({
  initialHistory,
  onHistoryChange,
  canvasWidth,
  canvasHeight,
}: UseDrawingCanvasOptions) {
  const historyHook = useDrawingHistory({ initialHistory, onHistoryChange });
  const toolsHook = useDrawingTools();
  const symmetryHook = useSymmetry(toolsHook.symmetryMode);

  const [currentStrokes, setCurrentStrokes] = useState<Array<Omit<Stroke, 'kind' | 'id'>>>([]);
  const currentStrokesRef = useRef(currentStrokes);
  useEffect(() => {
    currentStrokesRef.current = currentStrokes;
  }, [currentStrokes]);

  const panResponder = useMemo(() => {
    return PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        const { locationX, locationY } = evt.nativeEvent;
        const point: Point = { x: locationX, y: locationY };

        if (toolsHook.toolRef.current === 'pen') {
          const actionId = String(historyHook.nextActionIdRef.current++);
          const offsets = symmetryHook.getSymmetryOffsets();

          const strokes = offsets.map(([xMult, yMult]) => ({
            points: [{ x: xMult === 1 ? point.x : canvasWidth - point.x, y: yMult === 1 ? point.y : canvasHeight - point.y }],
            color: toolsHook.selectedColorRef.current,
            width: 2,
            actionId,
          }));

          setCurrentStrokes(strokes);
        }
      },
      onPanResponderMove: (evt) => {
        const { locationX, locationY } = evt.nativeEvent;
        const point: Point = { x: locationX, y: locationY };

        if (toolsHook.toolRef.current === 'pen') {
          setCurrentStrokes((prev) =>
            prev.map((stroke, idx) => {
              const offsets = symmetryHook.getSymmetryOffsets();
              const [xMult, yMult] = offsets[idx] || [1, 1];
              return {
                ...stroke,
                points: [...stroke.points, { x: xMult === 1 ? point.x : canvasWidth - point.x, y: yMult === 1 ? point.y : canvasHeight - point.y }],
              };
            })
          );
        }
      },
      onPanResponderRelease: () => {
        if (toolsHook.toolRef.current === 'pen') {
          currentStrokesRef.current.forEach((stroke, idx) => {
            historyHook.addToHistory({
              kind: 'stroke',
              id: `stroke-${Date.now()}-${idx}`,
              ...stroke,
            });
          });
          setCurrentStrokes([]);
        }
      },
    });
  }, [canvasWidth, canvasHeight, symmetryHook, historyHook, toolsHook]);

  return {
    panResponder,
    currentStrokes,
    ...historyHook,
    ...toolsHook,
    ...symmetryHook,
  };
}
