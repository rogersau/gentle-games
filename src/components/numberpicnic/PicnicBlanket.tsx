import React, { useMemo, useRef, useCallback, useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  ViewStyle,
  useWindowDimensions,
  Animated,
  PanResponder,
  Platform,
  Text,
} from 'react-native';
import { useThemeColors } from '../../utils/theme';
import { Space, Radius } from '../../ui/tokens';
import { ThemeColors } from '../../types';
import { useSettings } from '../../context/SettingsContext';

interface WindowRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export const translateNumberPicnicRect = (layout: WindowRect, dx: number, dy: number): WindowRect => ({
  x: layout.x + dx,
  y: layout.y + dy,
  width: layout.width,
  height: layout.height,
});

export const doesNumberPicnicRectOverlap = (
  draggedRect: WindowRect | null,
  dropZoneLayout: WindowRect | null | undefined
): boolean => {
  if (!draggedRect || !dropZoneLayout) {
    return false;
  }

  return (
    draggedRect.x < dropZoneLayout.x + dropZoneLayout.width &&
    draggedRect.x + draggedRect.width > dropZoneLayout.x &&
    draggedRect.y < dropZoneLayout.y + dropZoneLayout.height &&
    draggedRect.y + draggedRect.height > dropZoneLayout.y
  );
};

interface DraggableItem {
  id: number;
  emoji: string;
  position: Animated.ValueXY;
  scale: Animated.Value;
  opacity: Animated.Value;
  isAvailable: boolean;
  isDragging: boolean;
}

interface MeasurableNode {
  measureInWindow?: (callback: (x: number, y: number, width: number, height: number) => void) => void;
}

interface PicnicBlanketProps {
  itemEmoji: string;
  itemCount: number;
  targetCount: number;
  onItemDrop: (index: number) => void;
  onDropStart?: () => void;
  onDragOverBasket?: (isOver: boolean) => void;
  dropZoneLayout?: WindowRect | null;
  onDropEnd?: () => void;
  isProcessing?: boolean;
  style?: ViewStyle;
  testID?: string;
}

export const PicnicBlanket: React.FC<PicnicBlanketProps> = ({
  itemEmoji,
  itemCount,
  targetCount,
  onItemDrop,
  onDropStart,
  onDragOverBasket,
  dropZoneLayout,
  onDropEnd,
  isProcessing = false,
  style,
  testID,
}) => {
  const { colors } = useThemeColors();
  const { width: screenWidth } = useWindowDimensions();
  const { settings } = useSettings();
  const styles = useMemo(() => createStyles(colors), [colors]);

  // Calculate how many items to show on the blanket
  const maxItems = Math.max(12, targetCount + 3);
  const visibleItems = Math.min(itemCount, maxItems);
  
  // Track which item is currently being dragged
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  
  // Create draggable items only once
  const draggableItemsRef = useRef<DraggableItem[]>([]);
  const itemRefs = useRef<Array<MeasurableNode | null>>([]);
  const itemLayoutsRef = useRef<Record<number, WindowRect | null>>({});
  const isOverBasketRef = useRef(false);
  
  // Track the current emoji to detect changes
  const prevEmojiRef = useRef(itemEmoji);
  
  // Initialize items if not already done OR if emoji changed (new round)
  if (draggableItemsRef.current.length === 0 || prevEmojiRef.current !== itemEmoji) {
    prevEmojiRef.current = itemEmoji;
    draggableItemsRef.current = Array.from({ length: maxItems }, (_, index) => ({
      id: index,
      emoji: itemEmoji,
      position: new Animated.ValueXY({ x: 0, y: 0 }),
      scale: new Animated.Value(1),
      opacity: new Animated.Value(index < visibleItems ? 1 : 0.3),
      isAvailable: index < visibleItems,
      isDragging: false,
    }));
  }

  // Update availability when itemCount changes - animate opacity instead of recreating
  useEffect(() => {
    draggableItemsRef.current.forEach((item, index) => {
      const shouldBeAvailable = index < visibleItems;
      item.isAvailable = shouldBeAvailable;
      
      // Animate opacity change
      if (settings.animationsEnabled && !settings.reducedMotionEnabled) {
        Animated.timing(item.opacity, {
          toValue: shouldBeAvailable ? 1 : 0.3,
          duration: 200,
          useNativeDriver: Platform.OS !== 'web',
        }).start();
      } else {
        item.opacity.setValue(shouldBeAvailable ? 1 : 0.3);
      }
    });
  }, [visibleItems, settings.animationsEnabled, settings.reducedMotionEnabled]);

  const setDragOverlap = useCallback((isOver: boolean) => {
    if (isOverBasketRef.current === isOver) {
      return;
    }

    isOverBasketRef.current = isOver;
    onDragOverBasket?.(isOver);
  }, [onDragOverBasket]);

  const measureItemLayout = useCallback((index: number, onMeasured: (layout: WindowRect | null) => void) => {
    const itemRef = itemRefs.current[index];
    if (!itemRef?.measureInWindow) {
      onMeasured(itemLayoutsRef.current[index] ?? null);
      return;
    }

    itemRef.measureInWindow((x, y, width, height) => {
      const layout = { x, y, width, height };
      itemLayoutsRef.current[index] = layout;
      onMeasured(layout);
    });
  }, []);

  const updateDragOverlap = useCallback(
    (index: number, dx: number, dy: number, options?: { forceMeasure?: boolean }): boolean => {
      const evaluateOverlap = (layout: WindowRect | null) => {
        const translatedLayout = layout
          ? translateNumberPicnicRect(layout, dx, dy)
          : null;

        const isOver = doesNumberPicnicRectOverlap(translatedLayout, dropZoneLayout);

        setDragOverlap(isOver);
        return isOver;
      };

      const cachedLayout = itemLayoutsRef.current[index] ?? null;
      if (options?.forceMeasure || !cachedLayout) {
        let measuredOverlap = false;
        measureItemLayout(index, (layout) => {
          measuredOverlap = evaluateOverlap(layout);
        });
        return measuredOverlap;
      }

      return evaluateOverlap(cachedLayout);
    },
    [dropZoneLayout, measureItemLayout, setDragOverlap]
  );

  // Create PanResponder for an item
  const createPanResponder = useCallback((item: DraggableItem, index: number) => {
    return PanResponder.create({
      onStartShouldSetPanResponder: () => !isProcessing && item.isAvailable,
      onMoveShouldSetPanResponder: () => !isProcessing && item.isAvailable,
      onPanResponderGrant: () => {
        setDraggingIndex(index);
        onDropStart?.();
        setDragOverlap(false);
        measureItemLayout(index, () => undefined);
        
        // Scale up when dragging starts
        if (settings.animationsEnabled && !settings.reducedMotionEnabled) {
          Animated.timing(item.scale, {
            toValue: 1.3,
            duration: 200,
            useNativeDriver: Platform.OS !== 'web',
          }).start();
        }
      },
      onPanResponderMove: (_, gestureState) => {
        // Update position based on gesture
        item.position.setValue({
          x: gestureState.dx,
          y: gestureState.dy,
        });

        updateDragOverlap(index, gestureState.dx, gestureState.dy);
      },
      onPanResponderRelease: (_, gestureState) => {
        const isValidDrop = updateDragOverlap(index, gestureState.dx, gestureState.dy, { forceMeasure: true });

        setDraggingIndex(null);
        setDragOverlap(false);
        onDropEnd?.();
        
        // Scale back down
        if (settings.animationsEnabled && !settings.reducedMotionEnabled) {
          Animated.timing(item.scale, {
            toValue: 1,
            duration: 200,
            useNativeDriver: Platform.OS !== 'web',
          }).start();
        }

        if (isValidDrop) {
          onItemDrop(index);
          
          // Fade out the item
          if (settings.animationsEnabled && !settings.reducedMotionEnabled) {
            Animated.timing(item.opacity, {
              toValue: 0,
              duration: 200,
              useNativeDriver: Platform.OS !== 'web',
            }).start(() => {
              item.position.setValue({ x: 0, y: 0 });
            });
          } else {
            item.opacity.setValue(0);
            item.position.setValue({ x: 0, y: 0 });
          }
        } else {
          // Reset position (not dropped to basket)
          if (settings.animationsEnabled && !settings.reducedMotionEnabled) {
            Animated.spring(item.position, {
              toValue: { x: 0, y: 0 },
              useNativeDriver: Platform.OS !== 'web',
              friction: 5,
            }).start();
          } else {
            item.position.setValue({ x: 0, y: 0 });
          }
        }
      },
      onPanResponderTerminate: () => {
        setDraggingIndex(null);
        setDragOverlap(false);
        onDropEnd?.();
      },
    });
  }, [
    isProcessing,
    settings.animationsEnabled,
    settings.reducedMotionEnabled,
    onDropStart,
    onDropEnd,
    onItemDrop,
    measureItemLayout,
    setDragOverlap,
    updateDragOverlap,
  ]);

  const itemsPerRow = screenWidth < 400 ? 4 : screenWidth < 600 ? 5 : 6;

  // Generate item positions with scatter
  const itemPositions = useMemo(() => {
    return Array.from({ length: maxItems }, (_, index) => ({
      id: index,
      offsetX: (index % 3) * 2 - 2,
      offsetY: Math.floor(index / itemsPerRow) % 2 === 0 ? 0 : 4,
    }));
  }, [itemsPerRow, maxItems]);

  return (
    <View style={[styles.container, style]} testID={testID}>
      <View style={styles.blanket}>
        {/* Gingham pattern overlay */}
        <View style={styles.pattern} />
        
        {/* Instruction text */}
        <Text style={styles.instruction}>
          Drag items up to the basket!
        </Text>
        
        {/* Items grid */}
        <View style={styles.itemsContainer}>
          {draggableItemsRef.current.map((item, index) => {
            const panResponder = createPanResponder(item, index);
            const pos = itemPositions[index];
            const isCurrentlyDragging = draggingIndex === index;
            
            const animatedStyle = {
              transform: [
                { translateX: item.position.x },
                { translateY: item.position.y },
                { scale: item.scale },
              ],
              opacity: item.opacity,
              // High zIndex when dragging so item appears above basket
              zIndex: isCurrentlyDragging ? 100 : 1,
            };

            return (
              <View
                key={item.id}
                style={[
                  styles.itemWrapper,
                  {
                    transform: [
                      { translateX: pos.offsetX },
                      { translateY: pos.offsetY },
                    ],
                    // Also set zIndex on wrapper when dragging
                    zIndex: isCurrentlyDragging ? 100 : 1,
                  },
                ]}
              >
                {item.isAvailable ? (
                  <Animated.View
                    ref={(node) => {
                      itemRefs.current[index] = node as MeasurableNode | null;
                    }}
                    onLayout={(event) => {
                      const { layout } = event.nativeEvent;
                      itemLayoutsRef.current[index] = {
                        x: layout.x,
                        y: layout.y,
                        width: layout.width,
                        height: layout.height,
                      };
                    }}
                    {...panResponder.panHandlers}
                    style={[styles.draggableItem, animatedStyle]}
                    accessibilityLabel={`${itemEmoji} item ${index + 1}. Drag up to basket.`}
                    accessibilityHint="Drag this item upward to add it to the picnic basket"
                    testID={`picnic-item-${index}`}
                  >
                    <Text style={styles.emoji} selectable={false}>
                      {item.emoji}
                    </Text>
                  </Animated.View>
                ) : (
                  <View style={styles.placeholder}>
                    <View style={styles.placeholderInner} />
                  </View>
                )}
              </View>
            );
          })}
        </View>
      </View>
    </View>
  );
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      width: '100%',
      paddingHorizontal: Space.sm,
      // Higher zIndex than basket so items can be seen above it
      zIndex: 10,
    },
    blanket: {
      backgroundColor: '#FFE4E1',
      borderRadius: Radius.lg,
      borderWidth: 3,
      borderColor: '#FFB6C1',
      padding: Space.md,
      position: 'relative',
      // Remove overflow hidden so items can extend beyond blanket when dragging
      // overflow: 'hidden',
    },
    pattern: {
      ...StyleSheet.absoluteFillObject,
      opacity: 0.15,
      backgroundColor: 'transparent',
    },
    instruction: {
      textAlign: 'center',
      marginBottom: Space.sm,
      color: colors.textLight,
      fontSize: 14,
    },
    itemsContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'center',
      alignItems: 'center',
    },
    itemWrapper: {
      margin: Space.xs,
      // Ensure each item wrapper can be positioned independently
      position: 'relative',
    },
    draggableItem: {
      width: 56,
      height: 56,
      justifyContent: 'center',
      alignItems: 'center',
    },
    emoji: {
      fontSize: 36,
      textAlign: 'center',
    },
    placeholder: {
      width: 56,
      height: 56,
      backgroundColor: 'rgba(0, 0, 0, 0.03)',
      borderRadius: 12,
      borderWidth: 2,
      borderStyle: 'dashed',
      borderColor: 'rgba(0, 0, 0, 0.1)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    placeholderInner: {
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: 'rgba(0, 0, 0, 0.05)',
    },
  });
