import React, {
  useState,
  useRef,
  useEffect,
  forwardRef,
  useImperativeHandle,
  useMemo,
} from 'react';
import { View, StyleSheet, PanResponder, TouchableOpacity, Text, ScrollView } from 'react-native';
import { AppModal, AppButton } from '../ui/components';
import { useTranslation } from 'react-i18next';
import Svg, { Path, Circle, Rect, Polygon, Line } from 'react-native-svg';
import { ThemeColors } from '../types';
import { useThemeColors } from '../utils/theme';
import { Space, Radius } from '../ui/tokens';
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
type ShapeType = 'circle' | 'square' | 'triangle';
type SymmetryMode = 'none' | 'half' | 'quarter';

const SHAPE_TRANSLATION_KEYS: Record<ShapeType, TranslationKey> = {
  circle: 'games.drawing.shape.circle',
  square: 'games.drawing.shape.square',
  triangle: 'games.drawing.shape.triangle',
};

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
  if (points.length === 0) return '';
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;
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

/**
 * Apply symmetry transform to a point
 */
const applySymmetry = (
  point: Point,
  width: number,
  height: number,
  xMult: number,
  yMult: number,
): Point => {
  const centerX = width / 2;
  const centerY = height / 2;

  return {
    x: centerX + (point.x - centerX) * xMult,
    y: centerY + (point.y - centerY) * yMult,
  };
};

export const DrawingCanvas = forwardRef<DrawingCanvasRef, DrawingCanvasProps>(
  (
    {
      width,
      height,
      bottomInset = 0,
      initialHistory = [],
      onHistoryChange,
      canvasBackgroundColor = '#FFFFFF',
    },
    ref,
  ) => {
    const { colors } = useThemeColors();
    const { t } = useTranslation();
    const themedStyles = useMemo(() => createThemedStyles(colors), [colors]);
    // Unified ordered history — preserves exact draw order for correct undo
    const [history, setHistory] = useState<HistoryEntry[]>(() =>
      compactDrawingHistory(initialHistory),
    );
    // Current strokes being drawn (one per symmetry copy)
    const [currentStrokes, setCurrentStrokes] = useState<Array<Omit<Stroke, 'kind' | 'id'>>>([]);

    // Update history when initialHistory prop changes (e.g., when loading saved drawing)
    useEffect(() => {
      setHistory(compactDrawingHistory(initialHistory));
    }, [initialHistory]);

    const [selectedColor, setSelectedColor] = useState('#FF6B6B');
    const [tool, setTool] = useState<Tool>('pen');
    const [shapeType, setShapeType] = useState<ShapeType>('circle');
    const [shapeSize, setShapeSize] = useState(60);
    const [symmetryMode, setSymmetryMode] = useState<SymmetryMode>('none');
    const [showClearConfirm, setShowClearConfirm] = useState(false);
    const [showColorPicker, setShowColorPicker] = useState(false);
    const [showShapePicker, setShowShapePicker] = useState(false);
    const [customColors, setCustomColors] = useState<string[]>([]);
    const [pickerColor, setPickerColor] = useState('#FF6B6B');
    const [accessibilityAnnouncement, setAccessibilityAnnouncement] = useState('');

    // Refs for PanResponder closures
    const selectedColorRef = useRef(selectedColor);
    const toolRef = useRef(tool);
    const shapeTypeRef = useRef(shapeType);
    const shapeSizeRef = useRef(shapeSize);
    const symmetryModeRef = useRef(symmetryMode);
    const historyRef = useRef(history);
    const nextActionIdRef = useRef(0);

    useEffect(() => {
      selectedColorRef.current = selectedColor;
    }, [selectedColor]);
    useEffect(() => {
      toolRef.current = tool;
    }, [tool]);
    useEffect(() => {
      shapeTypeRef.current = shapeType;
    }, [shapeType]);
    useEffect(() => {
      shapeSizeRef.current = shapeSize;
    }, [shapeSize]);
    useEffect(() => {
      symmetryModeRef.current = symmetryMode;
    }, [symmetryMode]);
    useEffect(() => {
      historyRef.current = history;
    }, [history]);

    // Notify parent of history changes
    useEffect(() => {
      onHistoryChange?.(history);
    }, [history, onHistoryChange]);

    const clearCanvas = () => {
      setHistory([]);
      setCurrentStrokes([]);
    };

    const createActionId = () => {
      const actionId = `action-${Date.now()}-${nextActionIdRef.current}`;
      nextActionIdRef.current += 1;
      return actionId;
    };

    // Expose imperative methods
    useImperativeHandle(ref, () => ({
      clear: clearCanvas,
      getHistory: () => historyRef.current,
    }));

    const panResponder = useRef(
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (evt) => {
          const { locationX, locationY } = evt.nativeEvent;
          const mode = symmetryModeRef.current;

          if (toolRef.current === 'shape') {
            // Create shapes with symmetry
            const offsets = getSymmetryOffsets(mode);
            const actionId = createActionId();
            const newShapes: Shape[] = offsets.map(([xMult, yMult], idx) => {
              const pt = applySymmetry({ x: locationX, y: locationY }, width, height, xMult, yMult);
              return {
                kind: 'shape' as const,
                id: `shape-${Date.now()}-${idx}`,
                actionId,
                type: shapeTypeRef.current,
                x: pt.x,
                y: pt.y,
                size: shapeSizeRef.current,
                color: selectedColorRef.current,
              };
            });
            setHistory((prev) => compactDrawingHistory([...prev, ...newShapes]));
          } else {
            const strokeWidth = toolRef.current === 'eraser' ? 30 : 5;
            const offsets = getSymmetryOffsets(mode);
            const actionId = createActionId();
            // Create one stroke for each symmetry copy with properly mirrored initial points
            const newStrokes = offsets.map(([xMult, yMult]) => {
              const mirroredPt = applySymmetry(
                { x: locationX, y: locationY },
                width,
                height,
                xMult,
                yMult,
              );
              return {
                actionId,
                points: [mirroredPt],
                color: selectedColorRef.current,
                width: strokeWidth,
              };
            });
            setCurrentStrokes(newStrokes);
          }
        },
        onPanResponderMove: (evt) => {
          if (toolRef.current === 'shape') return;
          const { locationX, locationY } = evt.nativeEvent;
          const mode = symmetryModeRef.current;

          setCurrentStrokes((prevStrokes) => {
            if (prevStrokes.length === 0) return [];
            const offsets = getSymmetryOffsets(mode);

            let changed = false;
            const next = prevStrokes.map((stroke, idx) => {
              const [xMult, yMult] = offsets[idx] || [1, 1];
              const mirroredPt = applySymmetry(
                { x: locationX, y: locationY },
                width,
                height,
                xMult,
                yMult,
              );
              const previous = stroke.points[stroke.points.length - 1];
              const dx = mirroredPt.x - previous.x;
              const dy = mirroredPt.y - previous.y;
              // Pointer events can repeat the same coordinate many times.
              if (dx * dx + dy * dy < 4) return stroke;
              changed = true;
              return {
                ...stroke,
                points: decimateDrawingPoints(
                  [...stroke.points, mirroredPt],
                  DRAWING_HISTORY_MAX_POINTS_PER_ENTRY,
                ),
              };
            });
            return changed ? next : prevStrokes;
          });
        },
        onPanResponderRelease: () => {
          if (toolRef.current === 'shape') return;

          setCurrentStrokes((strokes) => {
            if (strokes.length === 0) return [];

            if (toolRef.current === 'eraser') {
              // Create erase entries for each symmetry copy
              const eraseEntries: ErasedRegion[] = strokes.map((stroke, idx) => ({
                kind: 'erase',
                id: `erase-${Date.now()}-${idx}`,
                actionId: stroke.actionId,
                points: stroke.points,
                width: stroke.width,
              }));
              setHistory((h) => compactDrawingHistory([...h, ...eraseEntries]));
            } else {
              // Create stroke entries for each symmetry copy
              const strokeEntries: Stroke[] = strokes.map((stroke, idx) => ({
                kind: 'stroke',
                id: `stroke-${Date.now()}-${idx}`,
                actionId: stroke.actionId,
                points: stroke.points,
                color: stroke.color,
                width: stroke.width,
              }));
              setHistory((h) => compactDrawingHistory([...h, ...strokeEntries]));
            }
            return [];
          });
        },
      }),
    ).current;

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
      setHistory((prev) => {
        if (prev.length === 0) {
          return prev;
        }

        const lastEntry = prev[prev.length - 1];
        if (!lastEntry.actionId) {
          return prev.slice(0, -1);
        }

        let cutoffIndex = prev.length - 1;
        while (cutoffIndex >= 0 && prev[cutoffIndex].actionId === lastEntry.actionId) {
          cutoffIndex -= 1;
        }

        return prev.slice(0, cutoffIndex + 1);
      });
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
      setTool(selectedTool);
      if (selectedTool === 'shape') setShowShapePicker(true);
    };

    const handleOpenColorPicker = () => {
      setPickerColor(selectedColor);
      setShowColorPicker(true);
    };

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
      setShowColorPicker(false);
    };

    const handleShapeSelect = (type: ShapeType) => {
      setShapeType(type);
      setTool('shape');
      setShowShapePicker(false);
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
    const renderHistoryEntry = (entry: HistoryEntry) => {
      if (entry.kind === 'stroke') {
        return (
          <Path
            key={entry.id}
            d={pointsToSmoothPath(entry.points)}
            stroke={entry.color}
            strokeWidth={entry.width}
            strokeLinecap='round'
            strokeLinejoin='round'
            fill='none'
          />
        );
      }

      if (entry.kind === 'erase') {
        return (
          <Path
            key={entry.id}
            d={pointsToSmoothPath(entry.points)}
            stroke={canvasBackgroundColor}
            strokeWidth={entry.width}
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
    };

    const canUndo = history.length > 0;

    // Path construction is memoized so pointer movement only renders the live preview.
    const renderedHistory = useMemo(
      () => history.map((entry) => renderHistoryEntry(entry)),
      [history, canvasBackgroundColor],
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

            {/* Symmetry guide lines */}
            {renderSymmetryGuides()}

            {/* Live stroke previews */}
            {currentStrokes.map((stroke, idx) => (
              <Path
                key={`preview-${idx}`}
                d={pointsToSmoothPath(stroke.points)}
                stroke={tool === 'eraser' ? canvasBackgroundColor : stroke.color}
                strokeWidth={stroke.width}
                strokeLinecap='round'
                strokeLinejoin='round'
                fill='none'
              />
            ))}
          </Svg>

          <View style={styles.touchOverlay} {...panResponder.panHandlers} />
        </View>

        {/* Toolbar */}
        <View style={[styles.toolbar, { paddingBottom: Math.max(8, bottomInset) }]}>
          <ScrollView
            horizontal
            style={styles.toolbarScroll}
            showsHorizontalScrollIndicator
            contentContainerStyle={styles.colorPalette}
          >
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
                />
              );
            })}

            <TouchableOpacity
              testID='open-color-picker'
              style={[styles.colorButton, styles.customColorButton]}
              onPress={handleOpenColorPicker}
              hitSlop={COLOR_BUTTON_HIT_SLOP}
              accessibilityRole='button'
              accessibilityLabel={t('games.drawing.addColour')}
              accessibilityHint={t('games.drawing.addColourHint')}
            >
              <Text style={styles.plusText}>+</Text>
            </TouchableOpacity>
          </ScrollView>

          <ScrollView
            horizontal
            style={styles.toolbarScroll}
            showsHorizontalScrollIndicator
            contentContainerStyle={styles.toolButtons}
          >
            <TouchableOpacity
              style={[
                styles.toolButton,
                tool === 'pen' ? themedStyles.toolButtonActive : undefined,
              ]}
              onPress={() => handleToolSelect('pen')}
              accessibilityRole='button'
              accessibilityLabel={t('games.drawing.penTool')}
              accessibilityState={{ selected: tool === 'pen' }}
            >
              <Text style={styles.toolButtonText}>✏️</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.toolButton,
                tool === 'shape' ? themedStyles.toolButtonActive : undefined,
              ]}
              onPress={() => handleToolSelect('shape')}
              accessibilityRole='button'
              accessibilityLabel={`${t('games.drawing.shapeTool')}, ${t(SHAPE_TRANSLATION_KEYS[shapeType])}`}
              accessibilityState={{ selected: tool === 'shape' }}
            >
              <Text style={styles.toolButtonText}>
                {shapeType === 'circle' && '🔴'}
                {shapeType === 'square' && '🟦'}
                {shapeType === 'triangle' && '🔺'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.toolButton,
                symmetryMode !== 'none' ? themedStyles.toolButtonActive : undefined,
              ]}
              onPress={cycleSymmetryMode}
              accessibilityRole='button'
              accessibilityLabel={t('games.drawing.symmetry', {
                mode: t(SYMMETRY_MODE_TRANSLATION_KEYS[symmetryMode]),
              })}
              accessibilityHint={t('games.drawing.symmetryHint')}
            >
              <Text style={styles.toolButtonText}>
                {symmetryMode === 'none' && '🦋'}
                {symmetryMode === 'half' && '🦋'}
                {symmetryMode === 'quarter' && '🦋'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.toolButton,
                tool === 'eraser' ? themedStyles.toolButtonActive : undefined,
              ]}
              onPress={() => handleToolSelect('eraser')}
              accessibilityRole='button'
              accessibilityLabel={t('games.drawing.eraserTool')}
              accessibilityState={{ selected: tool === 'eraser' }}
            >
              <Text style={styles.toolButtonText}>🧹</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.toolButton, !canUndo ? styles.toolButtonDisabled : undefined]}
              onPress={handleUndo}
              disabled={!canUndo}
              accessibilityRole='button'
              accessibilityLabel={t('games.drawing.undo')}
              accessibilityState={{ disabled: !canUndo }}
            >
              <Text style={[styles.toolButtonText, !canUndo ? styles.disabledText : undefined]}>
                ↩️
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              testID='clear-drawing-button'
              style={styles.toolButton}
              onPress={handleClear}
              accessibilityRole='button'
              accessibilityLabel={t('games.drawing.clearCanvas')}
              accessibilityHint={t('games.drawing.clearHint')}
            >
              <Text style={styles.toolButtonText}>🗑️</Text>
            </TouchableOpacity>
          </ScrollView>
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
          <Text style={styles.modalText}>{t('games.drawing.clearConfirmMessage')}</Text>

          <View style={[styles.modalButtons, { gap: 12 }]}>
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
          onClose={handleCustomColorSelect}
          title={t('games.drawing.pickColour')}
          showClose={false}
          dismissOnBackdropPress={false}
        >
          <View style={styles.previewContainer}>
            <View style={[styles.colorPreview, { backgroundColor: pickerColor }]} />
            <Text style={styles.colorHex}>{pickerColor.toUpperCase()}</Text>
          </View>

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
                />
              );
            })}
          </View>

          <View style={[styles.modalButtons]}>
            <AppButton
              label={t('common.cancel')}
              variant='secondary'
              onPress={() => setShowColorPicker(false)}
              style={{ flex: 1, marginRight: Space.sm }}
            />
            <AppButton
              label={t('games.drawing.useColour')}
              variant='primary'
              onPress={handleCustomColorSelect}
              testID='confirm-custom-color'
              style={{ flex: 1, marginLeft: Space.sm }}
            />
          </View>
        </AppModal>

        {/* Shape Picker Modal */}
        <AppModal
          visible={showShapePicker}
          onClose={() => setShowShapePicker(false)}
          title={t('games.drawing.chooseShape')}
          showClose={false}
          dismissOnBackdropPress={false}
          contentStyle={{ maxHeight: '80%' }}
        >
          <View style={styles.shapeGrid}>
            <TouchableOpacity
              testID='shape-option-circle'
              style={[
                styles.shapeButton,
                shapeType === 'circle' ? styles.shapeButtonActive : undefined,
              ]}
              onPress={() => handleShapeSelect('circle')}
              accessibilityRole='button'
              accessibilityLabel={t('games.drawing.shape.circle')}
              accessibilityState={{ selected: shapeType === 'circle' }}
            >
              <Text style={styles.shapeIcon}>🔴</Text>
              <Text style={styles.shapeLabel}>{t('games.drawing.shape.circle')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              testID='shape-option-square'
              style={[
                styles.shapeButton,
                shapeType === 'square' ? styles.shapeButtonActive : undefined,
              ]}
              onPress={() => handleShapeSelect('square')}
              accessibilityRole='button'
              accessibilityLabel={t('games.drawing.shape.square')}
              accessibilityState={{ selected: shapeType === 'square' }}
            >
              <Text style={styles.shapeIcon}>🟦</Text>
              <Text style={styles.shapeLabel}>{t('games.drawing.shape.square')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              testID='shape-option-triangle'
              style={[
                styles.shapeButton,
                shapeType === 'triangle' ? styles.shapeButtonActive : undefined,
              ]}
              onPress={() => handleShapeSelect('triangle')}
              accessibilityRole='button'
              accessibilityLabel={t('games.drawing.shape.triangle')}
              accessibilityState={{ selected: shapeType === 'triangle' }}
            >
              <Text style={styles.shapeIcon}>🔺</Text>
              <Text style={styles.shapeLabel}>{t('games.drawing.shape.triangle')}</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.sizeLabel}>{t('games.drawing.size', { size: shapeSize })}</Text>
          <View style={styles.sizeSlider}>
            <TouchableOpacity
              testID='shape-size-small'
              style={[
                styles.sizeControlButton,
                shapeSize === 30 ? styles.sizeControlButtonActive : undefined,
              ]}
              onPress={() => setShapeSize(30)}
              accessibilityRole='button'
              accessibilityLabel={t('games.drawing.sizeSmall')}
              accessibilityState={{ selected: shapeSize === 30 }}
            >
              <Text style={styles.sizeControlText}>{t('games.drawing.sizeSmall')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              testID='shape-size-medium'
              style={[
                styles.sizeControlButton,
                shapeSize === 60 ? styles.sizeControlButtonActive : undefined,
              ]}
              onPress={() => setShapeSize(60)}
              accessibilityRole='button'
              accessibilityLabel={t('games.drawing.sizeMedium')}
              accessibilityState={{ selected: shapeSize === 60 }}
            >
              <Text style={styles.sizeControlText}>{t('games.drawing.sizeMedium')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              testID='shape-size-large'
              style={[
                styles.sizeControlButton,
                shapeSize === 100 ? styles.sizeControlButtonActive : undefined,
              ]}
              onPress={() => setShapeSize(100)}
              accessibilityRole='button'
              accessibilityLabel={t('games.drawing.sizeLarge')}
              accessibilityState={{ selected: shapeSize === 100 }}
            >
              <Text style={styles.sizeControlText}>{t('games.drawing.sizeLarge')}</Text>
            </TouchableOpacity>
          </View>

          <AppButton
            label={t('common.done')}
            variant='primary'
            onPress={() => setShowShapePicker(false)}
          />
        </AppModal>
      </View>
    );
  },
);

const createThemedStyles = (colors: ThemeColors) =>
  StyleSheet.create({
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
    width: 44,
    height: 44,
    borderRadius: 22,
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
    gap: 8,
    marginTop: 8,
    paddingHorizontal: Space.xs,
    alignItems: 'center',
  },
  toolButton: {
    backgroundColor: '#FFFFFF',
    minWidth: 48,
    minHeight: 48,
    paddingHorizontal: 11,
    paddingVertical: 10,
    borderRadius: Radius.full,
    borderWidth: 2,
    borderColor: '#E8E4E1',
  },
  toolButtonDisabled: {
    opacity: 0.4,
  },
  toolButtonText: {
    fontSize: 18,
  },
  disabledText: {
    opacity: 0.3,
  },
  toolIndicator: {
    marginTop: 8,
    alignItems: 'center',
  },
  toolIndicatorText: {
    fontSize: 14,
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
    alignItems: 'center',
    marginBottom: 20,
  },
  colorPreview: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    borderColor: '#E8E4E1',
    marginBottom: 8,
  },
  colorHex: {
    fontSize: 14,
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
    width: 44,
    height: 44,
    borderRadius: 22,
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
    gap: 12,
    justifyContent: 'center',
  },
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
  shapeButtonActive: {
    backgroundColor: '#A8D8EA',
    borderColor: '#A8D8EA',
  },
  shapeIcon: {
    fontSize: 36,
    marginBottom: 8,
  },
  shapeLabel: {
    fontSize: 14,
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
  sizeSlider: {
    flexDirection: 'row',
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
  sizeControlButtonActive: {
    backgroundColor: '#A8D8EA',
    borderColor: '#A8D8EA',
  },
  accessibilityAnnouncement: {
    position: 'absolute',
    left: -1000,
    width: 1,
    height: 1,
  },
  sizeControlText: {
    fontSize: 14,
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
