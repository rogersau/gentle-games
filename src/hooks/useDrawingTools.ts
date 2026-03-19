import { useState, useRef, useEffect } from 'react';

type Tool = 'pen' | 'eraser' | 'shape';
type ShapeType = 'circle' | 'square' | 'triangle';
type SymmetryMode = 'none' | 'half' | 'quarter';

export function useDrawingTools() {
  const [selectedColor, setSelectedColor] = useState('#FF6B6B');
  const [tool, setTool] = useState<Tool>('pen');
  const [shapeType, setShapeType] = useState<ShapeType>('circle');
  const [shapeSize, setShapeSize] = useState(50);
  const [symmetryMode, setSymmetryMode] = useState<SymmetryMode>('none');

  const selectedColorRef = useRef(selectedColor);
  const toolRef = useRef(tool);
  const shapeTypeRef = useRef(shapeType);
  const shapeSizeRef = useRef(shapeSize);
  const symmetryModeRef = useRef(symmetryMode);

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
  };
}

export type { Tool, ShapeType, SymmetryMode };
