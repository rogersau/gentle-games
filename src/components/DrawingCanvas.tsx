import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  PanResponder,
  TouchableOpacity,
  Text,
  ScrollView,
  Modal,
  GestureResponderEvent,
} from 'react-native';
import Svg, { Path, Circle, Rect, Polygon } from 'react-native-svg';

interface Point {
  x: number;
  y: number;
}

interface Stroke {
  points: Point[];
  color: string;
  width: number;
}

interface Shape {
  id: string;
  type: 'circle' | 'square' | 'triangle';
  x: number;
  y: number;
  size: number;
  color: string;
}

type Tool = 'pen' | 'eraser' | 'shape';
type ShapeType = 'circle' | 'square' | 'triangle';

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
}

export const DrawingCanvas: React.FC<DrawingCanvasProps> = ({ width, height }) => {
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [shapes, setShapes] = useState<Shape[]>([]);
  const [currentStroke, setCurrentStroke] = useState<Stroke | null>(null);
  const [selectedColor, setSelectedColor] = useState('#FF6B6B');
  const [tool, setTool] = useState<Tool>('pen');
  const [shapeType, setShapeType] = useState<ShapeType>('circle');
  const [shapeSize, setShapeSize] = useState(40);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showShapePicker, setShowShapePicker] = useState(false);
  const [customColors, setCustomColors] = useState<string[]>([]);
  const [pickerColor, setPickerColor] = useState('#FF6B6B');
  
  const selectedColorRef = useRef(selectedColor);
  const toolRef = useRef(tool);
  const shapeTypeRef = useRef(shapeType);
  const shapeSizeRef = useRef(shapeSize);
  
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

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        const { locationX, locationY } = evt.nativeEvent;
        
        if (toolRef.current === 'shape') {
          // Add shape at tap location
          const newShape: Shape = {
            id: Date.now().toString(),
            type: shapeTypeRef.current,
            x: locationX,
            y: locationY,
            size: shapeSizeRef.current,
            color: selectedColorRef.current,
          };
          setShapes((prev) => [...prev, newShape]);
        } else {
          // Regular drawing
          const strokeWidth = toolRef.current === 'eraser' ? 30 : 5;
          const newStroke: Stroke = {
            points: [{ x: locationX, y: locationY }],
            color: toolRef.current === 'eraser' ? '#FFFFFF' : selectedColorRef.current,
            width: strokeWidth,
          };
          setCurrentStroke(newStroke);
        }
      },
      onPanResponderMove: (evt) => {
        if (toolRef.current === 'shape') return;
        
        const { locationX, locationY } = evt.nativeEvent;
        setCurrentStroke((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            points: [...prev.points, { x: locationX, y: locationY }],
          };
        });
      },
      onPanResponderRelease: () => {
        if (toolRef.current === 'shape') return;
        
        setCurrentStroke((prev) => {
          if (prev) {
            setStrokes((strokes) => [...strokes, prev]);
          }
          return null;
        });
      },
    })
  ).current;

  const pointsToPath = (points: Point[]): string => {
    if (points.length === 0) return '';
    let path = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      path += ` L ${points[i].x} ${points[i].y}`;
    }
    return path;
  };

  const handleClear = () => {
    setStrokes([]);
    setShapes([]);
    setCurrentStroke(null);
  };

  const handleUndo = () => {
    // Undo shapes first, then strokes
    if (shapes.length > 0) {
      setShapes((prev) => prev.slice(0, -1));
    } else {
      setStrokes((prev) => prev.slice(0, -1));
    }
  };

  const handleColorSelect = (color: string) => {
    setSelectedColor(color);
    if (tool === 'eraser') {
      setTool('pen');
    }
  };

  const handleToolSelect = (selectedTool: Tool) => {
    setTool(selectedTool);
    if (selectedTool === 'shape') {
      setShowShapePicker(true);
    }
  };

  const handleOpenColorPicker = () => {
    setPickerColor(selectedColor);
    setShowColorPicker(true);
  };

  const handleCustomColorSelect = () => {
    if (!customColors.includes(pickerColor)) {
      setCustomColors((prev) => [...prev.slice(-3), pickerColor]);
    }
    handleColorSelect(pickerColor);
    setShowColorPicker(false);
  };

  const handleShapeSelect = (type: ShapeType) => {
    setShapeType(type);
    setTool('shape');
    setShowShapePicker(false);
  };

  const allColors = [...COLORS, ...customColors];

  const renderShape = (shape: Shape) => {
    const halfSize = shape.size / 2;
    
    switch (shape.type) {
      case 'circle':
        return (
          <Circle
            key={shape.id}
            cx={shape.x}
            cy={shape.y}
            r={halfSize}
            fill={shape.color}
          />
        );
      case 'square':
        return (
          <Rect
            key={shape.id}
            x={shape.x - halfSize}
            y={shape.y - halfSize}
            width={shape.size}
            height={shape.size}
            fill={shape.color}
          />
        );
      case 'triangle':
        const points = `
          ${shape.x},${shape.y - halfSize}
          ${shape.x - halfSize},${shape.y + halfSize}
          ${shape.x + halfSize},${shape.y + halfSize}
        `;
        return (
          <Polygon
            key={shape.id}
            points={points}
            fill={shape.color}
          />
        );
    }
  };

  return (
    <View style={styles.container}>
      {/* Canvas */}
      <View style={[styles.canvasContainer, { width, height }]}>
        <Svg width={width} height={height} style={styles.canvas}>
          <Path d={`M 0 0 H ${width} V ${height} H 0 Z`} fill="#FFFFFF" />
          
          {/* Completed strokes */}
          {strokes.map((stroke, index) => (
            <Path
              key={`stroke-${index}`}
              d={pointsToPath(stroke.points)}
              stroke={stroke.color}
              strokeWidth={stroke.width}
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          ))}
          
          {/* Shapes */}
          {shapes.map((shape) => renderShape(shape))}
          
          {/* Current stroke */}
          {currentStroke && (
            <Path
              d={pointsToPath(currentStroke.points)}
              stroke={currentStroke.color}
              strokeWidth={currentStroke.width}
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          )}
        </Svg>
        
        <View style={styles.touchOverlay} {...panResponder.panHandlers} />
      </View>

      {/* Toolbar */}
      <View style={styles.toolbar}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.colorPalette}
        >
          {allColors.map((color) => (
            <TouchableOpacity
              key={color}
              style={[
                styles.colorButton,
                { backgroundColor: color },
                selectedColor === color && tool !== 'eraser' && styles.selectedColor,
              ]}
              onPress={() => handleColorSelect(color)}
            />
          ))}
          
          <TouchableOpacity
            style={[styles.colorButton, styles.customColorButton]}
            onPress={handleOpenColorPicker}
          >
            <Text style={styles.plusText}>+</Text>
          </TouchableOpacity>
        </ScrollView>

        <View style={styles.toolButtons}>
          <TouchableOpacity
            style={[styles.toolButton, tool === 'pen' && styles.toolButtonActive]}
            onPress={() => handleToolSelect('pen')}
          >
            <Text style={styles.toolButtonText}>✏️</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.toolButton, tool === 'shape' && styles.toolButtonActive]}
            onPress={() => handleToolSelect('shape')}
          >
            <Text style={styles.toolButtonText}>
              {shapeType === 'circle' && '🔴'}
              {shapeType === 'square' && '🟦'}
              {shapeType === 'triangle' && '🔺'}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.toolButton, tool === 'eraser' && styles.toolButtonActive]}
            onPress={() => handleToolSelect('eraser')}
          >
            <Text style={styles.toolButtonText}>🧹</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.toolButton}
            onPress={handleUndo}
            disabled={strokes.length === 0 && shapes.length === 0}
          >
            <Text style={[styles.toolButtonText, strokes.length === 0 && shapes.length === 0 && styles.disabledText]}>
              ↩️
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.toolButton}
            onPress={handleClear}
          >
            <Text style={styles.toolButtonText}>🗑️</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Tool indicator */}
      {tool === 'shape' && (
        <View style={styles.toolIndicator}>
          <Text style={styles.toolIndicatorText}>
            Tap to place {shapeType} ({shapeSize}px)
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
              onPress={() => setShapeSize(Math.min(100, shapeSize + 10))}
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
        onRequestClose={() => setShowColorPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
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
                    pickerColor === color && styles.gridColorSelected,
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
                style={styles.selectButton}
                onPress={handleCustomColorSelect}
              >
                <Text style={styles.selectButtonText}>Use Color</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Shape Picker Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showShapePicker}
        onRequestClose={() => setShowShapePicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Choose Shape</Text>
            
            <View style={styles.shapeGrid}>
              <TouchableOpacity
                style={[styles.shapeButton, shapeType === 'circle' && styles.shapeButtonActive]}
                onPress={() => handleShapeSelect('circle')}
              >
                <Text style={styles.shapeIcon}>🔴</Text>
                <Text style={styles.shapeLabel}>Circle</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.shapeButton, shapeType === 'square' && styles.shapeButtonActive]}
                onPress={() => handleShapeSelect('square')}
              >
                <Text style={styles.shapeIcon}>🟦</Text>
                <Text style={styles.shapeLabel}>Square</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.shapeButton, shapeType === 'triangle' && styles.shapeButtonActive]}
                onPress={() => handleShapeSelect('triangle')}
              >
                <Text style={styles.shapeIcon}>🔺</Text>
                <Text style={styles.shapeLabel}>Triangle</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.sizeLabel}>Size: {shapeSize}px</Text>
            <View style={styles.sizeSlider}>
              <TouchableOpacity 
                style={styles.sizeControlButton}
                onPress={() => setShapeSize(Math.max(20, shapeSize - 10))}
              >
                <Text style={styles.sizeControlText}>Small</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.sizeControlButton}
                onPress={() => setShapeSize(50)}
              >
                <Text style={styles.sizeControlText}>Medium</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.sizeControlButton}
                onPress={() => setShapeSize(Math.min(100, shapeSize + 10))}
              >
                <Text style={styles.sizeControlText}>Large</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowShapePicker(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

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
    marginTop: 12,
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
