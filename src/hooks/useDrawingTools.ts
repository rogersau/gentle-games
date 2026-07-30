import { useState, useRef, useEffect } from 'react';

type Tool = 'pen' | 'eraser' | 'shape' | 'stamp';
type ShapeType = 'circle' | 'square' | 'triangle';
type SymmetryMode = 'none' | 'half' | 'quarter';

export function useDrawingTools() {
  const [selectedColor, setSelectedColor] = useState('#FF6B6B');
  const [tool, setTool] = useState<Tool>('pen');
  const [shapeType, setShapeType] = useState<ShapeType>('circle');
  const [shapeSize, setShapeSize] = useState(50);
  const [symmetryMode, setSymmetryMode] = useState<SymmetryMode>('none');
  const [strokeWidth, setStrokeWidth] = useState(5);
  const [smoothing, setSmoothing] = useState(0.7);

  const selectedColorRef = useRef(selectedColor);
  const toolRef = useRef(tool);
  const shapeTypeRef = useRef(shapeType);
  const shapeSizeRef = useRef(shapeSize);
  const symmetryModeRef = useRef(symmetryMode);
  const strokeWidthRef = useRef(strokeWidth);
  const smoothingRef = useRef(smoothing);

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
    strokeWidthRef.current = strokeWidth;
  }, [strokeWidth]);
  useEffect(() => {
    smoothingRef.current = smoothing;
  }, [smoothing]);

  return {
    tool,
    setTool,
    toolRef,
    selectedColor,
    setSelectedColor,
    selectedColorRef,
    shapeType,
    setShapeType,
    shapeTypeRef,
    shapeSize,
    setShapeSize,
    shapeSizeRef,
    symmetryMode,
    setSymmetryMode,
    symmetryModeRef,
    strokeWidth,
    setStrokeWidth,
    strokeWidthRef,
    smoothing,
    setSmoothing,
    smoothingRef,
  };
}

export type { Tool, ShapeType, SymmetryMode };
