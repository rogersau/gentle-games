import { ControlIcon } from '../ui/components/ControlIcon';
import { GamePicture } from '../ui/components/GamePicture';
import React, {
  useState,
  useRef,
  useEffect,
  useLayoutEffect,
  forwardRef,
  useImperativeHandle,
  useMemo,
  useCallback,
} from 'react';
import {
  View,
  StyleSheet,
  PanResponder,
  TouchableOpacity,
  Text,
  Platform,
  type GestureResponderEvent,
  type NativeTouchEvent,
  type ViewStyle,
} from 'react-native';
import { AppModal, AppButton } from '../ui/components';
import { useTranslation } from 'react-i18next';
import Svg, { Path, Circle, Rect, Polygon, Line } from 'react-native-svg';
import { ThemeColors } from '../types';
import { useThemeColors } from '../utils/theme';
import { webGameDragSurface } from '../utils/pwaInteractionGuards';
import { Space, Radius, TypeStyle, ON_ACCENT_TEXT } from '../ui/tokens';
import type { TranslationKey } from '../i18n/types';
import {
  compactDrawingHistory,
  decimateDrawingPoints,
  DRAWING_HISTORY_MAX_POINTS_PER_ENTRY,
} from '../utils/drawingPersistence';

export interface Point {
  x: number;
  y: number;
}

export interface Stroke {
  kind: 'stroke';
  id: string;
  actionId?: string;
  points: Point[];
  color: string;
  width: number;
}

export interface Shape {
  kind: 'shape';
  id: string;
  actionId?: string;
  type: 'circle' | 'square' | 'triangle';
  x: number;
  y: number;
  size: number;
  color: string;
}

export interface ErasedRegion {
  kind: 'erase';
  id: string;
  actionId?: string;
  points: Point[];
  width: number;
}

// A history entry is a drawable action
export type HistoryEntry = Stroke | Shape | ErasedRegion;

type Tool = 'pen' | 'eraser' | 'shape';
type ShapeType = Shape['type'];
type SymmetryMode = 'none' | 'half' | 'quarter';
type ShapeChoice = { type: ShapeType; size: number };

type DrawingGesture = {
  entry: HistoryEntry;
  touchId: NativeTouchEvent['identifier'];
  width: number;
  height: number;
  symmetryMode: SymmetryMode;
};

const EMPTY_HISTORY: HistoryEntry[] = [];

const TOOL_INSTRUCTION_KEYS: Record<Tool, TranslationKey> = {
  pen: 'games.drawing.instruction',
  eraser: 'games.drawing.eraseInstruction',
  shape: 'games.drawing.shapeInstruction',
};

const SHAPE_TRANSLATION_KEYS: Record<ShapeType, TranslationKey> = {
  circle: 'games.drawing.shape.circle',
  square: 'games.drawing.shape.square',
  triangle: 'games.drawing.shape.triangle',
};

const SHAPES = ['circle', 'square', 'triangle'] as const;
const SHAPE_SIZES = [
  { size: 30, label: 'games.drawing.sizeSmall', name: 'small' },
  { size: 60, label: 'games.drawing.sizeMedium', name: 'medium' },
  { size: 100, label: 'games.drawing.sizeLarge', name: 'large' },
] as const;

const SYMMETRY_MODE_TRANSLATION_KEYS: Record<SymmetryMode, TranslationKey> = {
  none: 'games.drawing.symmetryMode.none',
  half: 'games.drawing.symmetryMode.half',
  quarter: 'games.drawing.symmetryMode.quarter',
};

const COLORS = [
  '#FF6B6B',
  '#4ECDC4',
  '#45B7D1',
  '#96CEB4',
  '#FFEAA7',
  '#DDA0DD',
  '#98D8C8',
  '#FFB6C1',
  '#5A5A5A',
];

const PRESET_COLORS = [
  '#FF0000',
  '#FF4500',
  '#FF8C00',
  '#FFD700',
  '#FFFF00',
  '#ADFF2F',
  '#7FFF00',
  '#00FF00',
  '#00FA9A',
  '#00CED1',
  '#00BFFF',
  '#1E90FF',
  '#4169E1',
  '#0000FF',
  '#8A2BE2',
  '#9932CC',
  '#FF00FF',
  '#FF1493',
  '#DC143C',
  '#8B0000',
  '#A0522D',
  '#D2691E',
  '#CD853F',
  '#DAA520',
  '#B8860B',
  '#556B2F',
  '#6B8E23',
  '#228B22',
  '#008B8B',
  '#5F9EA0',
];

interface DrawingCanvasProps {
  width: number;
  height: number;
  bottomInset?: number;
  initialHistory?: HistoryEntry[];
  onHistoryChange?: (history: HistoryEntry[]) => void;
  onInstructionChange?: (key: TranslationKey) => void;
  hideClear?: boolean;
  canvasBackgroundColor?: string;
}

export interface DrawingCanvasRef {
  clear: () => void;
  getHistory: () => HistoryEntry[];
}

/**
 * Convert an array of points into a smooth SVG path using quadratic Bézier
 * curves through the midpoints between consecutive points.
 */
const pointsToSmoothPath = (points: Point[]): string => {
  if (points.length === 2) {
    return `M ${points[0].x} ${points[0].y} L ${points[1].x} ${points[1].y}`;
  }

  let path = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length - 1; i++) {
    const midX = (points[i].x + points[i + 1].x) / 2;
    const midY = (points[i].y + points[i + 1].y) / 2;
    path += ` Q ${points[i].x} ${points[i].y} ${midX} ${midY}`;
  }
  // Line to last point
  const last = points[points.length - 1];
  path += ` L ${last.x} ${last.y}`;
  return path;
};

/**
 * Get all symmetry offsets for a given mode
 * Returns array of [xMultiplier, yMultiplier] pairs
 * where (1,1) = original, (-1,1) = mirrored horizontally, etc.
 */
const getSymmetryOffsets = (mode: SymmetryMode): Array<[number, number]> => {
  if (mode === 'none') return [[1, 1]];
  if (mode === 'half')
    return [
      [1, 1],
      [-1, 1],
    ];
  if (mode === 'quarter')
    return [
      [1, 1],
      [-1, 1],
      [1, -1],
      [-1, -1],
    ];
  return [[1, 1]];
};

const getGestureEntries = ({
  entry,
  width,
  height,
  symmetryMode,
}: DrawingGesture): HistoryEntry[] =>
  getSymmetryOffsets(symmetryMode).map(([xMult, yMult], index) => {
    const mirror = ({ x, y }: Point): Point => ({
      x: xMult === 1 ? x : width - x,
      y: yMult === 1 ? y : height - y,
    });
    const id = `${entry.id}-${index}`;
    if (entry.kind === 'shape') return { ...entry, id, ...mirror(entry) };
    const points = index === 0 ? entry.points : entry.points.map(mirror);
    return { ...entry, id, points };
  });

const getTouchPoint = (touch: NativeTouchEvent | undefined): Point | undefined => {
  if (!touch) return undefined;
  const { locationX: x, locationY: y } = touch;
  if (Number.isFinite(x) && Number.isFinite(y)) return { x, y };
  return undefined;
};

export const DrawingCanvas = forwardRef<DrawingCanvasRef, DrawingCanvasProps>(
  (
    {
      width,
      height,
      bottomInset = 0,
      initialHistory = EMPTY_HISTORY,
      onHistoryChange,
      onInstructionChange,
      hideClear = false,
      canvasBackgroundColor = '#FFFFFF',
    },
    ref,
  ) => {
    const { colors } = useThemeColors();
    const { t } = useTranslation();
    const themedStyles = useMemo(() => createThemedStyles(colors), [colors]);
    const [drawing, setDrawing] = useState(() => ({
      history: compactDrawingHistory(initialHistory),
      beforeClear: null as HistoryEntry[] | null,
    }));
    const { history, beforeClear } = drawing;
    const drawingRef = useRef(drawing);
    const initialHistoryRef = useRef(initialHistory);
    const nextActionIdRef = useRef(0);
    const [activeGesture, setActiveGesture] = useState<DrawingGesture | null>(null);
    const activeGestureRef = useRef<DrawingGesture | null>(null);

    const [selectedColor, setSelectedColor] = useState('#FF6B6B');
    const [tool, setTool] = useState<Tool>('pen');
    useEffect(
      () => onInstructionChange?.(TOOL_INSTRUCTION_KEYS[tool]),
      [tool, onInstructionChange],
    );
    const [shape, setShape] = useState<ShapeChoice>({ type: 'circle', size: 60 });
    const [shapeDraft, setShapeDraft] = useState<ShapeChoice | null>(null);
    const [symmetryMode, setSymmetryMode] = useState<SymmetryMode>('none');
    const [showClearConfirm, setShowClearConfirm] = useState(false);
    const [showColorPicker, setShowColorPicker] = useState(false);
    const [customColors, setCustomColors] = useState<string[]>([]);
    const [pickerColor, setPickerColor] = useState('#FF6B6B');
    const [accessibilityAnnouncement, setAccessibilityAnnouncement] = useState('');

    const settingsRef = useRef({ width, height, selectedColor, tool, shape, symmetryMode });
    useLayoutEffect(() => {
      settingsRef.current = { width, height, selectedColor, tool, shape, symmetryMode };
    }, [width, height, selectedColor, tool, shape, symmetryMode]);

    // Responder events and navigation can arrive before React renders the preceding update.
    const replaceHistory = useCallback(
      (history: HistoryEntry[], beforeClear = drawingRef.current.beforeClear) => {
        const next = { history, beforeClear };
        drawingRef.current = next;
        setDrawing(next);
      },
      [],
    );
    const replaceActiveGesture = useCallback((next: DrawingGesture | null) => {
      activeGestureRef.current = next;
      setActiveGesture(next);
    }, []);

    useEffect(() => {
      if (initialHistoryRef.current === initialHistory) return;
      initialHistoryRef.current = initialHistory;
      replaceActiveGesture(null);
      replaceHistory(compactDrawingHistory(initialHistory), null);
    }, [initialHistory, replaceActiveGesture, replaceHistory]);

    useEffect(() => {
      onHistoryChange?.(history);
    }, [history, onHistoryChange]);

    const clearCanvas = useCallback(() => {
      replaceActiveGesture(null);
      const { history } = drawingRef.current;
      if (history.length > 0) replaceHistory([], history);
    }, [replaceActiveGesture, replaceHistory]);

    useImperativeHandle(
      ref,
      () => ({
        clear: clearCanvas,
        getHistory: () => drawingRef.current.history,
      }),
      [clearCanvas],
    );

    const [panResponder] = useState(() => {
      const appendPoint = (gesture: DrawingGesture, event?: GestureResponderEvent) => {
        const { entry, touchId } = gesture;
        if (entry.kind === 'shape' || !event) return gesture;

        const touch = event.nativeEvent;
        const point = getTouchPoint(
          touch.changedTouches?.find(({ identifier }) => identifier === touchId) ??
            (touch.identifier === touchId ? touch : undefined),
        );
        if (!point) return gesture;

        const previous = entry.points[entry.points.length - 1];
        const dx = point.x - previous.x;
        const dy = point.y - previous.y;
        if (dx * dx + dy * dy < 4) return gesture;

        const points = decimateDrawingPoints(
          [...entry.points, point],
          DRAWING_HISTORY_MAX_POINTS_PER_ENTRY,
        );
        return { ...gesture, entry: { ...entry, points } };
      };

      return PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onPanResponderTerminationRequest: () => activeGestureRef.current === null,
        onPanResponderGrant: ({ nativeEvent }) => {
          const touch = nativeEvent.changedTouches?.[0] ?? nativeEvent;
          const point = getTouchPoint(touch);
          if (!point) return;

          const { width, height, selectedColor, tool, shape, symmetryMode } = settingsRef.current;
          const actionId = `action-${Date.now()}-${nextActionIdRef.current++}`;
          const base = { id: actionId, actionId };
          const entry: HistoryEntry =
            tool === 'shape'
              ? { ...base, kind: 'shape', ...shape, ...point, color: selectedColor }
              : tool === 'eraser'
                ? { ...base, kind: 'erase', points: [point], width: 30 }
                : { ...base, kind: 'stroke', points: [point], width: 5, color: selectedColor };

          replaceActiveGesture({ entry, touchId: touch.identifier, width, height, symmetryMode });
        },
        onPanResponderMove: (event) => {
          const gesture = activeGestureRef.current;
          if (!gesture) return;
          const updated = appendPoint(gesture, event);
          if (updated !== gesture) replaceActiveGesture(updated);
        },
        onPanResponderRelease: (event) => {
          const gesture = activeGestureRef.current;
          if (!gesture) return;

          replaceActiveGesture(null);
          const entries = getGestureEntries(appendPoint(gesture, event));
          replaceHistory(compactDrawingHistory([...drawingRef.current.history, ...entries]));
        },
        onPanResponderTerminate: () => replaceActiveGesture(null),
      });
    });

    const handleClear = () => {
      setShowClearConfirm(true);
    };

    const handleCancelClear = () => {
      setShowClearConfirm(false);
    };

    const handleConfirmClear = () => {
      clearCanvas();
      setShowClearConfirm(false);
    };

    const handleUndo = () => {
      const { history: previous, beforeClear } = drawingRef.current;
      if (previous.length === 0) {
        if (beforeClear) replaceHistory(beforeClear, null);
        return;
      }

      const lastEntry = previous[previous.length - 1];
      let cutoff = previous.length - 1;
      while (
        lastEntry.actionId &&
        cutoff > 0 &&
        previous[cutoff - 1].actionId === lastEntry.actionId
      ) {
        cutoff -= 1;
      }
      replaceHistory(previous.slice(0, cutoff));
    };

    const handleColorSelect = (color: string) => {
      const wasEraserActive = tool === 'eraser';
      setSelectedColor(color);
      if (wasEraserActive) {
        setTool('pen');
        setAccessibilityAnnouncement(t('games.drawing.penActivatedAnnouncement'));
      }
    };

    const handleToolSelect = (selectedTool: Tool) => {
      if (selectedTool === 'shape') {
        setShapeDraft(shape);
      } else {
        setTool(selectedTool);
      }
    };

    const handleOpenColorPicker = () => {
      setPickerColor(selectedColor);
      setShowColorPicker(true);
    };

    const handleCloseColorPicker = () => setShowColorPicker(false);

    const handleCustomColorSelect = () => {
      const normalizedPickerColor = pickerColor.toUpperCase();

      setCustomColors((prev) => {
        const normalizedExisting = [...COLORS, ...prev].map((color) => color.toUpperCase());
        if (normalizedExisting.includes(normalizedPickerColor)) {
          return prev;
        }

        return [...prev.slice(-3), normalizedPickerColor];
      });

      handleColorSelect(normalizedPickerColor);
      handleCloseColorPicker();
    };

    const shapeChoice = shapeDraft ?? shape;
    const handleCloseShapePicker = () => setShapeDraft(null);
    const handleConfirmShape = () => {
      setShape(shapeChoice);
      setTool('shape');
      handleCloseShapePicker();
    };

    const cycleSymmetryMode = () => {
      const modes: SymmetryMode[] = ['none', 'half', 'quarter'];
      const currentIndex = modes.indexOf(symmetryMode);
      const nextIndex = (currentIndex + 1) % modes.length;
      setSymmetryMode(modes[nextIndex]);
    };

    const allColors = [...COLORS, ...customColors];

    const getColorLabel = (color: string, isCustom: boolean) => {
      if (isCustom) {
        return t('games.drawing.customColour', { hex: color });
      }

      const translationKey = COLOR_TRANSLATION_KEYS[color.toUpperCase()];
      return translationKey ? t(translationKey) : t('games.drawing.customColour', { hex: color });
    };

    const colorButtonHint =
      tool === 'eraser'
        ? t('games.drawing.colourButtonEraserHint')
        : t('games.drawing.colourButtonHint');

    // Build SVG content from unified history.
    const renderHistoryEntry = useCallback(
      (entry: HistoryEntry) => {
        if (entry.kind === 'stroke' || entry.kind === 'erase') {
          const { id, points, width } = entry;
          const color = entry.kind === 'erase' ? canvasBackgroundColor : entry.color;
          if (points.length === 0) return null;
          if (points.length === 1) {
            const [point] = points;
            return <Circle key={id} cx={point.x} cy={point.y} r={width / 2} fill={color} />;
          }

          return (
            <Path
              key={id}
              d={pointsToSmoothPath(points)}
              stroke={color}
              strokeWidth={width}
              strokeLinecap='round'
              strokeLinejoin='round'
              fill='none'
            />
          );
        }

        if (entry.kind === 'shape') {
          const halfSize = entry.size / 2;
          switch (entry.type) {
            case 'circle':
              return (
                <Circle key={entry.id} cx={entry.x} cy={entry.y} r={halfSize} fill={entry.color} />
              );
            case 'square':
              return (
                <Rect
                  key={entry.id}
                  x={entry.x - halfSize}
                  y={entry.y - halfSize}
                  width={entry.size}
                  height={entry.size}
                  fill={entry.color}
                />
              );
            case 'triangle': {
              const pts = `${entry.x},${entry.y - halfSize} ${entry.x - halfSize},${entry.y + halfSize} ${entry.x + halfSize},${entry.y + halfSize}`;
              return <Polygon key={entry.id} points={pts} fill={entry.color} />;
            }
          }
        }
      },
      [canvasBackgroundColor],
    );

    const canClear = history.length > 0;
    const canUndo = canClear || beforeClear !== null;

    // Path construction is memoized so pointer movement only renders the live preview.
    const renderedHistory = useMemo(
      () => history.map((entry) => renderHistoryEntry(entry)),
      [history, renderHistoryEntry],
    );

    // Render symmetry guide lines
    const renderSymmetryGuides = () => {
      if (symmetryMode === 'none') return null;

      const centerX = width / 2;
      const centerY = height / 2;

      if (symmetryMode === 'half') {
        return (
          <Line
            x1={centerX}
            y1={0}
            x2={centerX}
            y2={height}
            stroke='#A8D8EA'
            strokeWidth={2}
            strokeDasharray='8,4'
          />
        );
      }

      if (symmetryMode === 'quarter') {
        return (
          <>
            <Line
              x1={centerX}
              y1={0}
              x2={centerX}
              y2={height}
              stroke='#A8D8EA'
              strokeWidth={2}
              strokeDasharray='8,4'
            />
            <Line
              x1={0}
              y1={centerY}
              x2={width}
              y2={centerY}
              stroke='#A8D8EA'
              strokeWidth={2}
              strokeDasharray='8,4'
            />
          </>
        );
      }

      return null;
    };

    return (
      <View style={styles.container}>
        {/* Canvas */}
        <View
          testID='drawing-canvas-container'
          style={[
            styles.canvasContainer,
            { width, height, backgroundColor: canvasBackgroundColor },
          ]}
        >
          <Svg
            width={width}
            height={height}
            style={[styles.canvas, { backgroundColor: canvasBackgroundColor }]}
          >
            {/* Canvas background */}
            <Path d={`M 0 0 H ${width} V ${height} H 0 Z`} fill={canvasBackgroundColor} />

            {renderedHistory}

            {activeGesture && getGestureEntries(activeGesture).map(renderHistoryEntry)}

            {renderSymmetryGuides()}
          </Svg>

          <View
            {...webGameDragSurface}
            collapsable={false}
            style={[
              styles.touchOverlay,
              Platform.OS === 'web' && ({ touchAction: 'none' } as ViewStyle),
            ]}
            {...panResponder.panHandlers}
          />
        </View>

        {!onInstructionChange && (
          <Text style={[styles.drawingInstruction, { color: colors.textLight }]}>
            {t(TOOL_INSTRUCTION_KEYS[tool])}
          </Text>
        )}
        {/* Toolbar */}
        <View style={[styles.toolbar, { paddingBottom: Math.max(8, bottomInset) }]}>
          <View style={styles.colorPalette}>
            {allColors.map((color) => {
              const isCustomColor = customColors.includes(color);
              const isSelected = selectedColor === color && tool !== 'eraser';
              return (
                <TouchableOpacity
                  key={color}
                  testID='palette-color-button'
                  style={[
                    styles.colorButton,
                    { backgroundColor: color },
                    isSelected ? styles.selectedColor : undefined,
                  ]}
                  onPress={() => handleColorSelect(color)}
                  hitSlop={COLOR_BUTTON_HIT_SLOP}
                  accessibilityRole='button'
                  accessibilityLabel={getColorLabel(color, isCustomColor)}
                  accessibilityHint={colorButtonHint}
                  accessibilityState={{ selected: isSelected }}
                  {...{ 'aria-pressed': isSelected }}
                />
              );
            })}

            <TouchableOpacity
              testID='open-color-picker'
              style={[styles.colorButton, styles.customColorButton, themedStyles.toolButton]}
              onPress={handleOpenColorPicker}
              hitSlop={COLOR_BUTTON_HIT_SLOP}
              accessibilityRole='button'
              accessibilityLabel={t('games.drawing.addColour')}
              accessibilityHint={t('games.drawing.addColourHint')}
            >
              <Text style={[styles.plusText, { color: colors.text }]}>+</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.toolButtons}>
            <TouchableOpacity
              style={[
                styles.toolButton,
                themedStyles.toolButton,
                tool === 'pen' ? themedStyles.toolButtonActive : undefined,
              ]}
              onPress={() => handleToolSelect('pen')}
              accessibilityRole='button'
              accessibilityLabel={t('games.drawing.penTool')}
              accessibilityState={{ selected: tool === 'pen' }}
            >
              <GamePicture name='pencil' size={26} />
              <Text
                style={[styles.toolLabel, { color: tool === 'pen' ? ON_ACCENT_TEXT : colors.text }]}
              >
                {t('games.drawing.tools.pen')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.toolButton,
                themedStyles.toolButton,
                tool === 'shape' ? themedStyles.toolButtonActive : undefined,
              ]}
              onPress={() => handleToolSelect('shape')}
              accessibilityRole='button'
              accessibilityLabel={`${t('games.drawing.shapeTool')}, ${t(SHAPE_TRANSLATION_KEYS[shape.type])}`}
              accessibilityState={{ selected: tool === 'shape' }}
            >
              <ControlIcon
                name={shape.type}
                color={tool === 'shape' ? ON_ACCENT_TEXT : colors.text}
                size={26}
              />
              <Text
                style={[
                  styles.toolLabel,
                  { color: tool === 'shape' ? ON_ACCENT_TEXT : colors.text },
                ]}
              >
                {t('games.drawing.tools.shapes')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.toolButton,
                themedStyles.toolButton,
                symmetryMode !== 'none' ? themedStyles.toolButtonActive : undefined,
              ]}
              onPress={cycleSymmetryMode}
              accessibilityRole='button'
              accessibilityLabel={t('games.drawing.symmetry', {
                mode: t(SYMMETRY_MODE_TRANSLATION_KEYS[symmetryMode]),
              })}
              accessibilityHint={t('games.drawing.symmetryHint')}
            >
              <GamePicture name='butterfly' size={26} />
              <Text
                style={[
                  styles.toolLabel,
                  { color: symmetryMode !== 'none' ? ON_ACCENT_TEXT : colors.text },
                ]}
              >
                {t(`games.drawing.mirrorState.${symmetryMode}`)}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.toolButton,
                themedStyles.toolButton,
                tool === 'eraser' ? themedStyles.toolButtonActive : undefined,
              ]}
              onPress={() => handleToolSelect('eraser')}
              accessibilityRole='button'
              accessibilityLabel={t('games.drawing.eraserTool')}
              accessibilityState={{ selected: tool === 'eraser' }}
            >
              <ControlIcon
                name='eraser'
                color={tool === 'eraser' ? ON_ACCENT_TEXT : colors.text}
                size={26}
              />
              <Text
                style={[
                  styles.toolLabel,
                  { color: tool === 'eraser' ? ON_ACCENT_TEXT : colors.text },
                ]}
              >
                {t('games.drawing.tools.eraser')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.toolButton,
                themedStyles.toolButton,
                !canUndo && { backgroundColor: colors.sunken, borderColor: colors.outline },
              ]}
              onPress={handleUndo}
              disabled={!canUndo}
              accessibilityRole='button'
              accessibilityLabel={t(
                !canUndo && hideClear ? 'games.drawing.undoUnavailable' : 'games.drawing.undo',
              )}
              accessibilityState={{ disabled: !canUndo }}
            >
              <ControlIcon name='undo' color={canUndo ? colors.text : colors.textLight} size={26} />
              <Text style={[styles.toolLabel, { color: canUndo ? colors.text : colors.textLight }]}>
                {t(!canUndo && hideClear ? 'games.drawing.undoUnavailable' : 'games.drawing.undo')}
              </Text>
            </TouchableOpacity>

            {!hideClear && (
              <TouchableOpacity
                testID='clear-drawing-button'
                style={[
                  styles.toolButton,
                  themedStyles.toolButton,
                  !canClear && { backgroundColor: colors.sunken, borderColor: colors.outline },
                ]}
                onPress={handleClear}
                disabled={!canClear}
                accessibilityRole='button'
                accessibilityLabel={t('games.drawing.clearCanvas')}
                accessibilityHint={t('games.drawing.clearHint')}
                accessibilityState={{ disabled: !canClear }}
              >
                <ControlIcon name='bin' color={colors.text} size={26} />
                <Text style={[styles.toolLabel, { color: colors.text }]}>
                  {t('games.drawing.tools.clear')}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
        <Text
          accessibilityRole='alert'
          accessibilityLiveRegion='polite'
          style={styles.accessibilityAnnouncement}
        >
          {accessibilityAnnouncement}
        </Text>

        <AppModal
          visible={showClearConfirm}
          onClose={handleCancelClear}
          title={t('games.drawing.clearTitle')}
          showClose={false}
          dismissOnBackdropPress={false}
        >
          <Text style={[styles.modalText, themedStyles.modalText]}>
            {t('games.drawing.clearConfirmMessage')}
          </Text>

          <View style={styles.modalButtons}>
            <AppButton
              label={t('common.cancel')}
              variant='secondary'
              onPress={handleCancelClear}
              testID='clear-confirm-cancel'
            />
            <AppButton
              label={t('games.drawing.clearConfirm')}
              variant='danger'
              onPress={handleConfirmClear}
              testID='clear-confirm-accept'
            />
          </View>
        </AppModal>

        {/* Color Picker Modal */}
        <AppModal
          visible={showColorPicker}
          onClose={handleCloseColorPicker}
          title={t('games.drawing.pickColour')}
          showClose={false}
          dismissOnBackdropPress={false}
          headerContent={
            <View style={styles.previewContainer}>
              <View style={[styles.colorPreview, { backgroundColor: pickerColor }]} />
              <Text style={[styles.colorHex, themedStyles.modalText]}>
                {pickerColor.toUpperCase()}
              </Text>
            </View>
          }
          footer={
            <View style={[styles.modalButtons, styles.pickerFooter]}>
              <AppButton
                label={t('common.cancel')}
                variant='secondary'
                size='sm'
                onPress={handleCloseColorPicker}
              />
              <AppButton
                label={t('games.drawing.useColour')}
                variant='primary'
                size='sm'
                onPress={handleCustomColorSelect}
                testID='confirm-custom-color'
              />
            </View>
          }
        >
          <View style={styles.colorGrid}>
            {PRESET_COLORS.map((color) => {
              const isSelected = pickerColor === color;
              return (
                <TouchableOpacity
                  key={color}
                  testID='color-picker-preset-button'
                  style={[
                    styles.gridColorButton,
                    { backgroundColor: color },
                    isSelected ? styles.gridColorSelected : undefined,
                  ]}
                  onPress={() => setPickerColor(color)}
                  hitSlop={COLOR_BUTTON_HIT_SLOP}
                  accessibilityRole='button'
                  accessibilityLabel={getColorLabel(color, false)}
                  accessibilityHint={t('games.drawing.colourPickerPresetHint')}
                  accessibilityState={{ selected: isSelected }}
                  {...{ 'aria-pressed': isSelected }}
                />
              );
            })}
          </View>
        </AppModal>

        {/* Shape Picker Modal */}
        <AppModal
          visible={shapeDraft !== null}
          onClose={handleCloseShapePicker}
          title={t('games.drawing.chooseShape')}
          showClose={false}
          dismissOnBackdropPress={false}
          contentStyle={{ maxHeight: '80%' }}
        >
          <View style={styles.shapeGrid}>
            {SHAPES.map((type) => {
              const selected = shapeChoice.type === type;
              const label = t(SHAPE_TRANSLATION_KEYS[type]);
              return (
                <TouchableOpacity
                  key={type}
                  testID={`shape-option-${type}`}
                  style={[
                    styles.shapeButton,
                    themedStyles.toolButton,
                    selected && themedStyles.toolButtonActive,
                  ]}
                  onPress={() => setShapeDraft({ ...shapeChoice, type })}
                  accessibilityRole='button'
                  accessibilityLabel={label}
                  accessibilityState={{ selected }}
                >
                  <ControlIcon
                    name={type}
                    color={selected ? ON_ACCENT_TEXT : colors.text}
                    size={32}
                  />
                  <Text
                    style={[
                      styles.shapeLabel,
                      selected ? styles.selectedLabel : themedStyles.modalText,
                    ]}
                  >
                    {label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={[styles.sizeLabel, themedStyles.modalText]}>{t('games.drawing.size')}</Text>
          <View style={styles.sizeOptions}>
            {SHAPE_SIZES.map(({ size, label, name }) => {
              const selected = shapeChoice.size === size;
              return (
                <TouchableOpacity
                  key={size}
                  testID={`shape-size-${name}`}
                  style={[
                    styles.sizeControlButton,
                    themedStyles.toolButton,
                    selected && themedStyles.toolButtonActive,
                  ]}
                  onPress={() => setShapeDraft({ ...shapeChoice, size })}
                  accessibilityRole='button'
                  accessibilityLabel={t(label)}
                  accessibilityState={{ selected }}
                >
                  <Text
                    style={[
                      styles.sizeControlText,
                      selected ? styles.selectedLabel : themedStyles.modalText,
                    ]}
                  >
                    {t(label)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={styles.modalButtons}>
            <AppButton
              label={t('common.cancel')}
              variant='secondary'
              onPress={handleCloseShapePicker}
            />
            <AppButton label={t('common.done')} variant='primary' onPress={handleConfirmShape} />
          </View>
        </AppModal>
      </View>
    );
  },
);

const createThemedStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    modalText: { color: colors.text },
    toolButton: { backgroundColor: colors.surface, borderColor: colors.border },
    toolButtonActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
  });

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
  },
  canvasContainer: {
    position: 'relative',
    borderRadius: Radius.lg,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  canvas: {
    backgroundColor: '#FFFFFF',
  },
  touchOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  toolbar: {
    marginTop: Space.xs,
    width: '100%',
    alignItems: 'center',
    paddingBottom: Space.xs,
  },
  colorPalette: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    paddingHorizontal: Space.xs,
    paddingVertical: Space.xs,
    gap: Space.sm,
    alignItems: 'center',
  },
  toolbarScroll: {
    width: '100%',
    flexGrow: 0,
  },
  colorButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#E8E4E1',
  },
  customColorButton: {
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  plusText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#5A5A5A',
  },
  selectedColor: {
    borderColor: '#5A5A5A',
    borderWidth: 3,
    transform: [{ scale: 1.1 }],
  },
  toolButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    width: '100%',
    gap: 8,
    marginTop: 8,
    paddingHorizontal: Space.xs,
    alignItems: 'center',
  },
  toolButton: {
    backgroundColor: '#FFFFFF',
    width: '30%',
    maxWidth: 112,
    minHeight: 60,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    paddingVertical: 10,
    borderRadius: Radius.full,
    borderWidth: 2,
    borderColor: '#E8E4E1',
  },
  drawingInstruction: { ...TypeStyle.bodySm, textAlign: 'center', marginTop: Space.sm },
  toolLabel: { ...TypeStyle.bodySm, color: ON_ACCENT_TEXT, textAlign: 'center' },
  toolIndicator: {
    marginTop: 8,
    alignItems: 'center',
  },
  toolIndicatorText: {
    fontSize: 15,
    color: '#5A5A5A',
    marginBottom: 4,
  },
  sizeControls: {
    flexDirection: 'row',
    gap: 12,
  },
  sizeButton: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: '#E8E4E1',
  },
  sizeButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#5A5A5A',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFFEF7',
    borderRadius: Radius.xl,
    padding: Space.lg,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#5A5A5A',
    textAlign: 'center',
    marginBottom: 20,
  },
  modalText: {
    fontSize: 16,
    color: '#5A5A5A',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
  },
  previewContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Space.sm,
    marginBottom: Space.md,
  },
  colorPreview: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 4,
    borderColor: '#E8E4E1',
  },
  colorHex: {
    fontSize: 15,
    color: '#5A5A5A',
    fontWeight: '600',
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 24,
  },
  gridColorButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#E8E4E1',
  },
  gridColorSelected: {
    borderColor: '#5A5A5A',
    borderWidth: 3,
    transform: [{ scale: 1.1 }],
  },
  modalButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'center',
  },
  pickerFooter: { marginTop: Space.sm },
  cancelButton: {
    backgroundColor: '#E8E4E1',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 25,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#5A5A5A',
  },
  selectButton: {
    backgroundColor: '#A8D8EA',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 25,
  },
  selectButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  shapeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 24,
  },
  shapeButton: {
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#E8E4E1',
    alignItems: 'center',
    minWidth: 80,
    minHeight: 104,
    justifyContent: 'center',
  },
  shapeLabel: {
    fontSize: 15,
    color: '#5A5A5A',
    fontWeight: '600',
  },
  sizeLabel: {
    fontSize: 16,
    color: '#5A5A5A',
    textAlign: 'center',
    marginBottom: 12,
    fontWeight: '600',
  },
  sizeOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 20,
  },
  sizeControlButton: {
    backgroundColor: '#FFFFFF',
    minHeight: 48,
    minWidth: 72,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#E8E4E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedLabel: { color: ON_ACCENT_TEXT },
  accessibilityAnnouncement: {
    position: 'absolute',
    left: -1000,
    width: 1,
    height: 1,
  },
  sizeControlText: {
    fontSize: 15,
    color: '#5A5A5A',
    fontWeight: '500',
  },
});

/** Friendly, localisable names for every built-in palette and picker colour. */
const COLOR_TRANSLATION_KEYS: Record<string, TranslationKey> = {
  '#FF6B6B': 'games.drawing.colors.coral',
  '#4ECDC4': 'games.drawing.colors.turquoise',
  '#45B7D1': 'games.drawing.colors.skyBlue',
  '#96CEB4': 'games.drawing.colors.mint',
  '#FFEAA7': 'games.drawing.colors.butterYellow',
  '#DDA0DD': 'games.drawing.colors.lavender',
  '#98D8C8': 'games.drawing.colors.seafoam',
  '#FFB6C1': 'games.drawing.colors.softPink',
  '#5A5A5A': 'games.drawing.colors.charcoal',
  '#FF0000': 'games.drawing.colors.red',
  '#FF4500': 'games.drawing.colors.orangeRed',
  '#FF8C00': 'games.drawing.colors.orange',
  '#FFD700': 'games.drawing.colors.gold',
  '#FFFF00': 'games.drawing.colors.yellow',
  '#ADFF2F': 'games.drawing.colors.lime',
  '#7FFF00': 'games.drawing.colors.chartreuse',
  '#00FF00': 'games.drawing.colors.green',
  '#00FA9A': 'games.drawing.colors.springGreen',
  '#00CED1': 'games.drawing.colors.darkTurquoise',
  '#00BFFF': 'games.drawing.colors.deepSkyBlue',
  '#1E90FF': 'games.drawing.colors.dodgerBlue',
  '#4169E1': 'games.drawing.colors.royalBlue',
  '#0000FF': 'games.drawing.colors.blue',
  '#8A2BE2': 'games.drawing.colors.blueViolet',
  '#9932CC': 'games.drawing.colors.darkOrchid',
  '#FF00FF': 'games.drawing.colors.magenta',
  '#FF1493': 'games.drawing.colors.deepPink',
  '#DC143C': 'games.drawing.colors.crimson',
  '#8B0000': 'games.drawing.colors.darkRed',
  '#A0522D': 'games.drawing.colors.sienna',
  '#D2691E': 'games.drawing.colors.chocolate',
  '#CD853F': 'games.drawing.colors.peru',
  '#DAA520': 'games.drawing.colors.goldenrod',
  '#B8860B': 'games.drawing.colors.darkGoldenrod',
  '#556B2F': 'games.drawing.colors.darkOlive',
  '#6B8E23': 'games.drawing.colors.olive',
  '#228B22': 'games.drawing.colors.forestGreen',
  '#008B8B': 'games.drawing.colors.darkCyan',
  '#5F9EA0': 'games.drawing.colors.cadetBlue',
};
const COLOR_BUTTON_HIT_SLOP = 4;
