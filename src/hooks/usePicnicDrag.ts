import { useState, useRef, useMemo } from 'react';
import { PanResponder } from 'react-native';

interface UsePicnicDragOptions {
  onDrop: (itemId: string, valid: boolean) => void;
  dropZoneBounds?: { x: number; y: number; width: number; height: number } | null;
}

export function usePicnicDrag({ onDrop, dropZoneBounds }: UsePicnicDragOptions) {
  const [activeDrag, setActiveDrag] = useState<string | null>(null);
  const [dragPosition, setDragPosition] = useState({ x: 0, y: 0 });
  const [isOverBasket, setIsOverBasket] = useState(false);

  const dragItemIdRef = useRef<string | null>(null);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (evt) => {
        },
        onPanResponderMove: (evt) => {
          const { pageX, pageY } = evt.nativeEvent;
          setDragPosition({ x: pageX, y: pageY });

          if (dropZoneBounds) {
            const over =
              pageX >= dropZoneBounds.x &&
              pageX <= dropZoneBounds.x + dropZoneBounds.width &&
              pageY >= dropZoneBounds.y &&
              pageY <= dropZoneBounds.y + dropZoneBounds.height;
            setIsOverBasket(over);
          }
        },
        onPanResponderRelease: () => {
          if (dragItemIdRef.current) {
            const valid = isOverBasket;
            onDrop(dragItemIdRef.current, valid);
          }
          setActiveDrag(null);
          setDragPosition({ x: 0, y: 0 });
          setIsOverBasket(false);
          dragItemIdRef.current = null;
        },
        onPanResponderTerminate: () => {
          setActiveDrag(null);
          setDragPosition({ x: 0, y: 0 });
          setIsOverBasket(false);
          dragItemIdRef.current = null;
        },
      }),
    [dropZoneBounds, onDrop],
  );

  return {
    activeDrag,
    setActiveDrag: (id: string | null) => {
      setActiveDrag(id);
      dragItemIdRef.current = id;
    },
    dragPosition,
    isOverBasket,
    panResponder,
  };
}
