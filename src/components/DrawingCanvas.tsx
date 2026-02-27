import React, { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import {
  View,
  StyleSheet,
  PanResponder,
  TouchableOpacity,
  Text,
  ScrollView,
  Modal,
} from 'react-native';
import Svg, { Path, Circle, Rect, Polygon, Line } from 'react-native-svg';

export interface Point {
  x: number;
  y: number;
}

export interface Stroke {
  kind: 'stroke';
  id: string;
  points: Point[];
  color: string;
  width: number;
}

export interface Shape {
  kind: 'shape';
  id: string;
  type: 'circle' | 'square' | 'triangle';
  x: number;
  y: number;
  size: number;
  color: string;
}

export interface ErasedRegion {
  kind: 'erase';
  id: string;
  points: Point[];
  width: number;
}

// A history entry is a drawable action
export type HistoryEntry = Stroke | Shape | ErasedRegion;

type Tool = 'pen' | 'eraser' | 'shape';
type ShapeType = 'circle' | 'square' | 'triangle';
type SymmetryMode = 'none' | 'half' | 'quarter';

const COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
  '#DDA0DD', '#98D8C8', '#FFB6C1', '#5A5A5A',
];

const PRESET_COLORS = [
  '#FF0000', '#FF4500', '#FF8C00', '#FFD700', '#FFFF00',
  '#ADFF2F', '#7FFF00', '#00FF00', '#00FA9A', '#00CED1',
  '#00BFFF', '#1E90FF', '#4169E1', '#0000FF', '#8A2BE2',
  '#9932CC', '#FF00FF', '#FF1493', '#DC143C', '#8B0000',
  '#A0522D', '#D2691E', '#CD853F', '#DAA520', '#B8860B',
  '#556B2F', '#6B8E23', '#228B22', '#008B8B', '#5F9EA0',
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
  if (mode === 'half') return [[1, 1], [-1, 1]];
  if (mode === 'quarter') return [[1, 1], [-1, 1], [1, -1], [-1, -1]];
  return [[1, 1]];
};

/**
 * Apply symmetry transform to a point
 */
const applySymmetry = (point: Point, width: number, height: number, xMult: number, yMult: number): Point => {
  const centerX = width / 2;
  const centerY = height / 2;
  
  return {
    x: centerX + (point.x - centerX) * xMult,
    y: centerY + (point.y - centerY) * yMult,
  };
};

export const DrawingCanvas = forwardRef<DrawingCanvasRef, DrawingCanvasProps>(
  ({ width, height, bottomInset = 0, initialHistory = [], onHistoryChange, canvasBackgroundColor = '#FFFFFF' }, ref) => {
    // Unified ordered history — preserves exact draw order for correct undo
    const [history, setHistory] = useState<HistoryEntry[]>(initialHistory);
    // Current strokes being drawn (one per symmetry copy)
    const [currentStrokes, setCurrentStrokes] = useState<Omit<Stroke, 'kind' | 'id'>[]>([]);

    // Update history when initialHistory prop changes (e.g., when loading saved drawing)
    useEffect(() => {
      console.log('DrawingCanvas: initialHistory changed, entries:', initialHistory.length);
      setHistory(initialHistory);
    }, [initialHistory]);

    const [selectedColor, setSelectedColor] = useState('#FF6B6B');
    const [tool, setTool] = useState<Tool>('pen');
    const [shapeType, setShapeType] = useState<ShapeType>('circle');
    const [shapeSize, setShapeSize] = useState(50);
    const [symmetryMode, setSymmetryMode] = useState<SymmetryMode>('none');
    const [showColorPicker, setShowColorPicker] = useState(false);
    const [showShapePicker, setShowShapePicker] = useState(false);
    const [customColors, setCustomColors] = useState<string[]>([]);
    const [pickerColor, setPickerColor] = useState('#FF6B6B');

    // Refs for PanResponder closures
    const selectedColorRef = useRef(selectedColor);
    const toolRef = useRef(tool);
    const shapeTypeRef = useRef(shapeType);
    const shapeSizeRef = useRef(shapeSize);
    const symmetryModeRef = useRef(symmetryMode);
    const historyRef = useRef(history);

    useEffect(() => { selectedColorRef.current = selectedColor; }, [selectedColor]);
    useEffect(() => { toolRef.current = tool; }, [tool]);
    useEffect(() => { shapeTypeRef.current = shapeType; }, [shapeType]);
    useEffect(() => { shapeSizeRef.current = shapeSize; }, [shapeSize]);
    useEffect(() => { symmetryModeRef.current = symmetryMode; }, [symmetryMode]);
    useEffect(() => { historyRef.current = history; }, [history]);

    // Notify parent of history changes
    useEffect(() => {
      console.log('DrawingCanvas: history changed, entries:', history.length);
      onHistoryChange?.(history);
    }, [history, onHistoryChange]);

    // Expose imperative methods
    useImperativeHandle(ref, () => ({
      clear: () => {
        setHistory([]);
        setCurrentStrokes([]);
      },
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
            const newShapes: Shape[] = offsets.map(([xMult, yMult], idx) => {
              const pt = applySymmetry({ x: locationX, y: locationY }, width, height, xMult, yMult);
              return {
                kind: 'shape' as const,
                id: `shape-${Date.now()}-${idx}`,
                type: shapeTypeRef.current,
                x: pt.x,
                y: pt.y,
                size: shapeSizeRef.current,
                color: selectedColorRef.current,
              };
            });
            setHistory((prev) => [...prev, ...newShapes]);
          } else {
            const strokeWidth = toolRef.current === 'eraser' ? 30 : 5;
            const offsets = getSymmetryOffsets(mode);
            // Create one stroke for each symmetry copy with properly mirrored initial points
            const newStrokes = offsets.map(([xMult, yMult]) => {
              const mirroredPt = applySymmetry({ x: locationX, y: locationY }, width, height, xMult, yMult);
              return {
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
            
            return prevStrokes.map((stroke, idx) => {
              const [xMult, yMult] = offsets[idx] || [1, 1];
              const mirroredPt = applySymmetry({ x: locationX, y: locationY }, width, height, xMult, yMult);
              return {
                ...stroke,
                points: [...stroke.points, mirroredPt],
              };
            });
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
                points: stroke.points,
                width: stroke.width,
              }));
              setHistory((h) => [...h, ...eraseEntries]);
            } else {
              // Create stroke entries for each symmetry copy
              const strokeEntries: Stroke[] = strokes.map((stroke, idx) => ({
                kind: 'stroke',
                id: `stroke-${Date.now()}-${idx}`,
                points: stroke.points,
                color: stroke.color,
                width: stroke.width,
              }));
              setHistory((h) => [...h, ...strokeEntries]);
            }
            return [];
          });
        },
      })
    ).current;

    const handleClear = () => {
      setHistory([]);
      setCurrentStrokes([]);
    };

    const handleUndo = () => {
      // When undoing with symmetry, we need to remove all copies of the last action
      // Each action creates N entries (where N is the symmetry count at that time)
      // For simplicity, just remove one entry at a time
      setHistory((prev) => prev.slice(0, -1));
    };

    const handleColorSelect = (color: string) => {
      setSelectedColor(color);
      if (tool === 'eraser') setTool('pen');
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

    // Build SVG content from unified history.
    const renderHistoryEntry = (entry: HistoryEntry) => {
      if (entry.kind === 'stroke') {
        return (
          <Path
            key={entry.id}
            d={pointsToSmoothPath(entry.points)}
            stroke={entry.color}
            strokeWidth={entry.width}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
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
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        );
      }

      if (entry.kind === 'shape') {
        const halfSize = entry.size / 2;
        switch (entry.type) {
          case 'circle':
            return (
              <Circle
                key={entry.id}
                cx={entry.x}
                cy={entry.y}
                r={halfSize}
                fill={entry.color}
              />
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
            return (
              <Polygon
                key={entry.id}
                points={pts}
                fill={entry.color}
              />
            );
          }
        }
      }
    };

    const canUndo = history.length > 0;

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
            stroke="#A8D8EA"
            strokeWidth={2}
            strokeDasharray="8,4"
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
              stroke="#A8D8EA"
              strokeWidth={2}
              strokeDasharray="8,4"
            />
            <Line
              x1={0}
              y1={centerY}
              x2={width}
              y2={centerY}
              stroke="#A8D8EA"
              strokeWidth={2}
              strokeDasharray="8,4"
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
          testID="drawing-canvas-container"
          style={[styles.canvasContainer, { width, height, backgroundColor: canvasBackgroundColor }]}
        >
          <Svg width={width} height={height} style={[styles.canvas, { backgroundColor: canvasBackgroundColor }]}>
            {/* Canvas background */}
            <Path d={`M 0 0 H ${width} V ${height} H 0 Z`} fill={canvasBackgroundColor} />

            {history.map((entry) => renderHistoryEntry(entry))}

            {/* Symmetry guide lines */}
            {renderSymmetryGuides()}

            {/* Live stroke previews */}
            {currentStrokes.map((stroke, idx) => (
              <Path
                key={`preview-${idx}`}
                d={pointsToSmoothPath(stroke.points)}
                stroke={tool === 'eraser' ? canvasBackgroundColor : stroke.color}
                strokeWidth={stroke.width}
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
            ))}
          </Svg>

          <View style={styles.touchOverlay} {...panResponder.panHandlers} />
        </View>

        {/* Toolbar */}
        <View style={[styles.toolbar, { paddingBottom: Math.max(8, bottomInset) }]}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.colorPalette}
          >
            {allColors.map((color) => (
              <TouchableOpacity
                key={color}
                testID="palette-color-button"
                style={[
                  styles.colorButton,
                  { backgroundColor: color },
                  selectedColor === color && tool !== 'eraser' ? styles.selectedColor : undefined,
                ]}
                onPress={() => handleColorSelect(color)}
              />
            ))}

            <TouchableOpacity
              testID="open-color-picker"
              style={[styles.colorButton, styles.customColorButton]}
              onPress={handleOpenColorPicker}
            >
              <Text style={styles.plusText}>+</Text>
            </TouchableOpacity>
          </ScrollView>

          <View style={styles.toolButtons}>
            <TouchableOpacity
              style={[styles.toolButton, tool === 'pen' ? styles.toolButtonActive : undefined]}
              onPress={() => handleToolSelect('pen')}
            >
              <Text style={styles.toolButtonText}>✏️</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.toolButton, tool === 'shape' ? styles.toolButtonActive : undefined]}
              onPress={() => handleToolSelect('shape')}
            >
              <Text style={styles.toolButtonText}>
                {shapeType === 'circle' && '🔴'}
                {shapeType === 'square' && '🟦'}
                {shapeType === 'triangle' && '🔺'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.toolButton, symmetryMode !== 'none' ? styles.toolButtonActive : undefined]}
              onPress={cycleSymmetryMode}
            >
              <Text style={styles.toolButtonText}>
                {symmetryMode === 'none' && '🦋'}
                {symmetryMode === 'half' && '🦋'}
                {symmetryMode === 'quarter' && '🦋'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.toolButton, tool === 'eraser' ? styles.toolButtonActive : undefined]}
              onPress={() => handleToolSelect('eraser')}
            >
              <Text style={styles.toolButtonText}>🧹</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.toolButton, !canUndo ? styles.toolButtonDisabled : undefined]}
              onPress={handleUndo}
              disabled={!canUndo}
            >
              <Text style={[styles.toolButtonText, !canUndo ? styles.disabledText : undefined]}>↩️</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.toolButton}
              onPress={handleClear}
            >
              <Text style={styles.toolButtonText}>🗑️</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Shape tool indicator */}
        {tool === 'shape' && (
          <View style={styles.toolIndicator}>
            <Text style={styles.toolIndicatorText}>
              Tap to place {shapeType} (size: {shapeSize})
            </Text>
            <View style={styles.sizeControls}>
              <TouchableOpacity
                style={styles.sizeButton}
                onPress={() => setShapeSize(Math.max(20, shapeSize - 10))}
              >
                <Text style={styles.sizeButtonText}>−</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.sizeButton}
                onPress={() => setShapeSize(Math.min(150, shapeSize + 10))}
              >
                <Text style={styles.sizeButtonText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Color Picker Modal */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={showColorPicker}
          onRequestClose={handleCustomColorSelect}
        >
          <TouchableOpacity 
            style={styles.modalOverlay}
            onPress={handleCustomColorSelect}
            activeOpacity={1}
          >
            <TouchableOpacity style={styles.modalContent} onPress={(e) => e.stopPropagation()} activeOpacity={1}>
              <Text style={styles.modalTitle}>Pick a Color</Text>

              <View style={styles.previewContainer}>
                <View style={[styles.colorPreview, { backgroundColor: pickerColor }]} />
                <Text style={styles.colorHex}>{pickerColor.toUpperCase()}</Text>
              </View>

              <View style={styles.colorGrid}>
                {PRESET_COLORS.map((color) => (
                  <TouchableOpacity
                    key={color}
                    style={[
                      styles.gridColorButton,
                      { backgroundColor: color },
                      pickerColor === color ? styles.gridColorSelected : undefined,
                    ]}
                    onPress={() => setPickerColor(color)}
                  />
                ))}
              </View>

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => setShowColorPicker(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  testID="confirm-custom-color"
                  style={styles.selectButton}
                  onPress={handleCustomColorSelect}
                >
                  <Text style={styles.selectButtonText}>Use Color</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          </TouchableOpacity>
        </Modal>

        {/* Shape Picker Modal */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={showShapePicker}
          onRequestClose={() => setShowShapePicker(false)}
        >
          <TouchableOpacity 
            style={styles.modalOverlay}
            onPress={() => setShowShapePicker(false)}
            activeOpacity={1}
          >
            <TouchableOpacity style={styles.modalContent} onPress={(e) => e.stopPropagation()} activeOpacity={1}>
              <Text style={styles.modalTitle}>Choose Shape</Text>

              <View style={styles.shapeGrid}>
                <TouchableOpacity
                  style={[styles.shapeButton, shapeType === 'circle' ? styles.shapeButtonActive : undefined]}
                  onPress={() => handleShapeSelect('circle')}
                >
                  <Text style={styles.shapeIcon}>🔴</Text>
                  <Text style={styles.shapeLabel}>Circle</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.shapeButton, shapeType === 'square' ? styles.shapeButtonActive : undefined]}
                  onPress={() => handleShapeSelect('square')}
                >
                  <Text style={styles.shapeIcon}>🟦</Text>
                  <Text style={styles.shapeLabel}>Square</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.shapeButton, shapeType === 'triangle' ? styles.shapeButtonActive : undefined]}
                  onPress={() => handleShapeSelect('triangle')}
                >
                  <Text style={styles.shapeIcon}>🔺</Text>
                  <Text style={styles.shapeLabel}>Triangle</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.sizeLabel}>Size: {shapeSize}</Text>
              <View style={styles.sizeSlider}>
                <TouchableOpacity
                  style={styles.sizeControlButton}
                  onPress={() => setShapeSize(30)}
                >
                  <Text style={styles.sizeControlText}>Small</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.sizeControlButton}
                  onPress={() => setShapeSize(60)}
                >
                  <Text style={styles.sizeControlText}>Medium</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.sizeControlButton}
                  onPress={() => setShapeSize(100)}
                >
                  <Text style={styles.sizeControlText}>Large</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowShapePicker(false)}
              >
                <Text style={styles.cancelButtonText}>Done</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          </TouchableOpacity>
        </Modal>
      </View>
    );
  }
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
  },
  canvasContainer: {
    position: 'relative',
    borderRadius: 16,
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
    marginTop: 8,
    width: '100%',
    alignItems: 'center',
    paddingBottom: 8,
  },
  colorPalette: {
    flexDirection: 'row',
    paddingHorizontal: 8,
    paddingVertical: 8,
    gap: 10,
    alignItems: 'center',
  },
  colorButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
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
  },
  toolButton: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: '#E8E4E1',
  },
  toolButtonActive: {
    backgroundColor: '#A8D8EA',
    borderColor: '#A8D8EA',
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
    borderRadius: 20,
    padding: 24,
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
    width: 40,
    height: 40,
    borderRadius: 20,
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
    justifyContent: 'center',
    gap: 16,
    marginBottom: 24,
  },
  shapeButton: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#E8E4E1',
    alignItems: 'center',
    minWidth: 90,
  },
  shapeButtonActive: {
    backgroundColor: '#A8D8EA',
    borderColor: '#A8D8EA',
  },
  shapeIcon: {
    fontSize: 40,
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
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#E8E4E1',
  },
  sizeControlText: {
    fontSize: 14,
    color: '#5A5A5A',
    fontWeight: '500',
  },
});
