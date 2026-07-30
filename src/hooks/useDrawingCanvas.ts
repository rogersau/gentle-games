import { useState, useRef, useEffect, useMemo } from 'react';
import { PanResponder } from 'react-native';
import { useDrawingHistory } from './useDrawingHistory';
import { useDrawingTools } from './useDrawingTools';
import { useSymmetry } from './useSymmetry';
import type { HistoryEntry, Stroke, Point, Shape, Stamp } from '../components/DrawingCanvas';
import { advanceGuidedProgress, isGuidedPathComplete } from '../utils/drawingGuidedModes';

interface UseDrawingCanvasOptions {
  initialHistory: HistoryEntry[];
  onHistoryChange?: (history: HistoryEntry[]) => void;
  canvasWidth: number;
  canvasHeight: number;
  guidedPath?: Point[];
  guidedTolerance?: number;
}

export function useDrawingCanvas({
  initialHistory,
  onHistoryChange,
  canvasWidth,
  canvasHeight,
  guidedPath = [],
  guidedTolerance = 34,
}: UseDrawingCanvasOptions) {
  const historyHook = useDrawingHistory({ initialHistory, onHistoryChange });
  const toolsHook = useDrawingTools();
  const symmetryHook = useSymmetry(toolsHook.symmetryMode);

  const [currentStrokes, setCurrentStrokes] = useState<Array<Omit<Stroke, 'kind' | 'id'>>>([]);
  const currentStrokesRef = useRef(currentStrokes);
  const guidedProgressRef = useRef(0);
  const [guidedProgress, setGuidedProgress] = useState(0);
  useEffect(() => {
    currentStrokesRef.current = currentStrokes;
  }, [currentStrokes]);

  const advanceGuidance = (points: Point[]) => {
    const next = advanceGuidedProgress(
      guidedPath,
      guidedProgressRef.current,
      points,
      guidedTolerance,
    );
    guidedProgressRef.current = next;
    setGuidedProgress(next);
  };

  const panResponder = useMemo(() => {
    return PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        const { locationX, locationY } = evt.nativeEvent;
        const point: Point = { x: locationX, y: locationY };

        const tool = toolsHook.toolRef.current;
        const offsets = symmetryHook.getSymmetryOffsets();
        const actionId = String(historyHook.nextActionIdRef.current++);

        if (tool === 'shape') {
          const entries: Shape[] = offsets.map(([xMult, yMult], idx) => ({
            kind: 'shape',
            id: `shape-${Date.now()}-${idx}`,
            actionId,
            type: toolsHook.shapeTypeRef.current,
            x: xMult === 1 ? point.x : canvasWidth - point.x,
            y: yMult === 1 ? point.y : canvasHeight - point.y,
            size: toolsHook.shapeSizeRef.current,
            color: toolsHook.selectedColorRef.current,
          }));
          historyHook.addBatchToHistory(entries);
          advanceGuidance([point]);
        } else if (tool === 'stamp') {
          const entries: Stamp[] = offsets.map(([xMult, yMult], idx) => ({
            kind: 'stamp',
            id: `stamp-${Date.now()}-${idx}`,
            actionId,
            x: xMult === 1 ? point.x : canvasWidth - point.x,
            y: yMult === 1 ? point.y : canvasHeight - point.y,
            size: Math.max(8, toolsHook.strokeWidthRef.current * 3),
            color: toolsHook.selectedColorRef.current,
          }));
          historyHook.addBatchToHistory(entries);
          advanceGuidance([point]);
        } else if (tool === 'pen' || tool === 'eraser') {
          const strokes = offsets.map(([xMult, yMult]) => ({
            points: [
              {
                x: xMult === 1 ? point.x : canvasWidth - point.x,
                y: yMult === 1 ? point.y : canvasHeight - point.y,
              },
            ],
            color: toolsHook.selectedColorRef.current,
            width:
              tool === 'eraser'
                ? toolsHook.strokeWidthRef.current * 3
                : toolsHook.strokeWidthRef.current,
            actionId,
          }));

          currentStrokesRef.current = strokes;
          setCurrentStrokes(strokes);
          advanceGuidance([point]);
        }
      },
      onPanResponderMove: (evt) => {
        const { locationX, locationY } = evt.nativeEvent;
        const point: Point = { x: locationX, y: locationY };

        if (toolsHook.toolRef.current === 'pen' || toolsHook.toolRef.current === 'eraser') {
          const offsets = symmetryHook.getSymmetryOffsets();
          const nextStrokes = currentStrokesRef.current.map((stroke, idx) => {
            const [xMult, yMult] = offsets[idx] || [1, 1];
            return {
              ...stroke,
              points: [
                ...stroke.points,
                {
                  x: xMult === 1 ? point.x : canvasWidth - point.x,
                  y: yMult === 1 ? point.y : canvasHeight - point.y,
                },
              ],
            };
          });
          currentStrokesRef.current = nextStrokes;
          setCurrentStrokes(nextStrokes);
          advanceGuidance([point]);
        }
      },
      onPanResponderRelease: () => {
        const tool = toolsHook.toolRef.current;
        if (tool !== 'pen' && tool !== 'eraser') return;
        const entries = currentStrokesRef.current.map((stroke, idx) => ({
          kind: tool === 'eraser' ? ('erase' as const) : ('stroke' as const),
          id: `${tool}-${Date.now()}-${idx}`,
          ...stroke,
        }));
        historyHook.addBatchToHistory(entries);
        currentStrokesRef.current = [];
        setCurrentStrokes([]);
      },
      onPanResponderTerminate: () => {
        const tool = toolsHook.toolRef.current;
        if (tool !== 'pen' && tool !== 'eraser') return;
        const entries = currentStrokesRef.current.map((stroke, idx) => ({
          kind: tool === 'eraser' ? ('erase' as const) : ('stroke' as const),
          id: `${tool}-${Date.now()}-${idx}`,
          ...stroke,
        }));
        historyHook.addBatchToHistory(entries);
        currentStrokesRef.current = [];
        setCurrentStrokes([]);
      },
    });
  }, [canvasWidth, canvasHeight, symmetryHook, historyHook, toolsHook]);

  return {
    panResponder,
    currentStrokes,
    guidedProgress,
    guidedCompleted: isGuidedPathComplete(guidedPath, guidedProgress),
    ...historyHook,
    ...toolsHook,
    ...symmetryHook,
  };
}
