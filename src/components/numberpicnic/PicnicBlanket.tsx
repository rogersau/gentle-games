import React, { useMemo, useRef, useCallback, useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  ViewStyle,
  useWindowDimensions,
  Animated,
  PanResponder,
  Platform,
  Pressable,
  Text,
} from 'react-native';
import { useThemeColors } from '../../utils/theme';
import { Space, Radius } from '../../ui/tokens';
import { useAnimationEnabled } from '../../ui/animations';
import { ThemeColors } from '../../types';
import { useTranslation } from 'react-i18next';

interface WindowRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export const translateNumberPicnicRect = (
  layout: WindowRect,
  dx: number,
  dy: number,
): WindowRect => ({
  x: layout.x + dx,
  y: layout.y + dy,
  width: layout.width,
  height: layout.height,
});

export const doesNumberPicnicRectOverlap = (
  draggedRect: WindowRect | null,
  dropZoneLayout: WindowRect | null | undefined,
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

export const isNumberPicnicDropValid = (
  itemLayout: WindowRect | null,
  dropZoneLayout: WindowRect | null | undefined,
  gesture: { dx: number; dy: number; moveX?: number; moveY?: number },
): boolean => {
  if (itemLayout) {
    return doesNumberPicnicRectOverlap(
      translateNumberPicnicRect(itemLayout, gesture.dx, gesture.dy),
      dropZoneLayout,
    );
  }

  return Boolean(
    dropZoneLayout &&
    typeof gesture.moveX === 'number' &&
    typeof gesture.moveY === 'number' &&
    gesture.moveX >= dropZoneLayout.x &&
    gesture.moveX <= dropZoneLayout.x + dropZoneLayout.width &&
    gesture.moveY >= dropZoneLayout.y &&
    gesture.moveY <= dropZoneLayout.y + dropZoneLayout.height,
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
  measureInWindow?: (
    callback: (x: number, y: number, width: number, height: number) => void,
  ) => void;
}

interface PicnicBlanketProps {
  itemEmoji: string;
  itemCount: number;
  itemIds?: number[];
  targetCount: number;
  onItemDrop: (index: number) => void;
  onDropStart?: () => void;
  onDragOverBasket?: (isOver: boolean) => void;
  dropZoneLayout?: WindowRect | null;
  onDropEnd?: () => void;
  isProcessing?: boolean;
  style?: ViewStyle;
  testID?: string;
  measureItemInWindow?: (
    itemId: number,
    callback: (x: number, y: number, width: number, height: number) => void,
  ) => void;
}

export const PicnicBlanket: React.FC<PicnicBlanketProps> = ({
  itemEmoji,
  itemCount,
  itemIds,
  targetCount,
  onItemDrop,
  onDropStart,
  onDragOverBasket,
  dropZoneLayout,
  onDropEnd,
  isProcessing = false,
  style,
  testID,
  measureItemInWindow,
}) => {
  const { colors } = useThemeColors();
  const { width: screenWidth } = useWindowDimensions();
  const animationsEnabled = useAnimationEnabled();
  const { t } = useTranslation();
  const styles = useMemo(() => createStyles(colors), [colors]);

  // Keep source identities stable so a rerender cannot change what is placed.
  const availableItemIds = itemIds ?? Array.from({ length: itemCount }, (_, index) => index);
  const maxItems = Math.max(targetCount + 3, ...availableItemIds, 0);
  const availableIds = useMemo(() => new Set(availableItemIds), [availableItemIds]);

  // Track which item is currently being dragged
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);

  // Create draggable items only once
  const draggableItemsRef = useRef<DraggableItem[]>([]);
  const itemRefs = useRef<Array<MeasurableNode | null>>([]);
  const itemLayoutsRef = useRef<Record<number, WindowRect | null>>({});
  const isOverBasketRef = useRef(false);

  // Track the current emoji to detect changes
  const prevEmojiRef = useRef(itemEmoji);

  // Rebuild only for a new round or a changed pool shape, never for layout changes.
  if (draggableItemsRef.current.length !== maxItems || prevEmojiRef.current !== itemEmoji) {
    prevEmojiRef.current = itemEmoji;
    draggableItemsRef.current = Array.from({ length: maxItems }, (_, index) => ({
      id: index,
      emoji: itemEmoji,
      position: new Animated.ValueXY({ x: 0, y: 0 }),
      scale: new Animated.Value(1),
      opacity: new Animated.Value(availableIds.has(index) ? 1 : 0.3),
      isAvailable: availableIds.has(index),
      isDragging: false,
    }));
  }

  // Update availability when itemCount changes - animate opacity instead of recreating
  useEffect(() => {
    draggableItemsRef.current.forEach((item, index) => {
      const shouldBeAvailable = availableIds.has(index);
      item.isAvailable = shouldBeAvailable;

      // Animate opacity change
      if (animationsEnabled) {
        Animated.timing(item.opacity, {
          toValue: shouldBeAvailable ? 1 : 0.3,
          duration: 200,
          useNativeDriver: Platform.OS !== 'web',
        }).start();
      } else {
        item.opacity.setValue(shouldBeAvailable ? 1 : 0.3);
      }
    });
  }, [availableIds, animationsEnabled]);

  const setDragOverlap = useCallback(
    (isOver: boolean) => {
      if (isOverBasketRef.current === isOver) {
        return;
      }

      isOverBasketRef.current = isOver;
      onDragOverBasket?.(isOver);
    },
    [onDragOverBasket],
  );

  const measureItemLayout = useCallback(
    (index: number, onMeasured: (layout: WindowRect | null) => void) => {
      const saveMeasurement = (x: number, y: number, width: number, height: number) => {
        const layout = { x, y, width, height };
        itemLayoutsRef.current[index] = layout;
        onMeasured(layout);
      };
      if (measureItemInWindow) {
        measureItemInWindow(index, saveMeasurement);
        return;
      }
      const itemRef = itemRefs.current[index];
      if (!itemRef?.measureInWindow) {
        onMeasured(itemLayoutsRef.current[index] ?? null);
        return;
      }

      itemRef.measureInWindow(saveMeasurement);
    },
    [measureItemInWindow],
  );

  const updateDragOverlap = useCallback(
    (index: number, dx: number, dy: number, options?: { forceMeasure?: boolean }): boolean => {
      const evaluateOverlap = (layout: WindowRect | null) => {
        const translatedLayout = layout ? translateNumberPicnicRect(layout, dx, dy) : null;

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
    [dropZoneLayout, measureItemLayout, setDragOverlap],
  );

  const isPointOverBasket = useCallback(
    (x: number, y: number) =>
      Boolean(
        dropZoneLayout &&
        x >= dropZoneLayout.x &&
        x <= dropZoneLayout.x + dropZoneLayout.width &&
        y >= dropZoneLayout.y &&
        y <= dropZoneLayout.y + dropZoneLayout.height,
      ),
    [dropZoneLayout],
  );

  // Create PanResponder for an item
  const createPanResponder = useCallback(
    (item: DraggableItem, index: number) => {
      return PanResponder.create({
        onStartShouldSetPanResponder: () => false,
        onMoveShouldSetPanResponder: () => !isProcessing && item.isAvailable,
        onPanResponderGrant: () => {
          setDraggingIndex(index);
          onDropStart?.();
          setDragOverlap(false);
          measureItemLayout(index, () => undefined);

          // Scale up when dragging starts
          if (animationsEnabled) {
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

          const hasMeasuredItem = Boolean(itemLayoutsRef.current[index]);
          if (hasMeasuredItem) {
            updateDragOverlap(index, gestureState.dx, gestureState.dy);
          } else if (Number.isFinite(gestureState.moveX) && Number.isFinite(gestureState.moveY)) {
            setDragOverlap(isPointOverBasket(gestureState.moveX, gestureState.moveY));
          }
        },
        onPanResponderRelease: (_, gestureState) => {
          const finishRelease = (layout: WindowRect | null) => {
            const isValidDrop = isNumberPicnicDropValid(layout, dropZoneLayout, gestureState);

            setDraggingIndex(null);
            setDragOverlap(false);
            onDropEnd?.();

            if (animationsEnabled) {
              Animated.timing(item.scale, {
                toValue: 1,
                duration: 200,
                useNativeDriver: Platform.OS !== 'web',
              }).start();
            }

            if (isValidDrop) {
              onItemDrop(index);
              if (animationsEnabled) {
                Animated.timing(item.opacity, {
                  toValue: 0,
                  duration: 200,
                  useNativeDriver: Platform.OS !== 'web',
                }).start(() => item.position.setValue({ x: 0, y: 0 }));
              } else {
                item.opacity.setValue(0);
                item.position.setValue({ x: 0, y: 0 });
              }
              return;
            }

            if (animationsEnabled) {
              Animated.spring(item.position, {
                toValue: { x: 0, y: 0 },
                useNativeDriver: Platform.OS !== 'web',
                friction: 5,
              }).start();
            } else {
              item.position.setValue({ x: 0, y: 0 });
            }
          };

          measureItemLayout(index, finishRelease);
        },
        onPanResponderTerminate: () => {
          setDraggingIndex(null);
          setDragOverlap(false);
          onDropEnd?.();
          item.position.setValue({ x: 0, y: 0 });
          item.scale.setValue(1);
        },
      });
    },
    [
      isProcessing,
      animationsEnabled,
      onDropStart,
      onDropEnd,
      onItemDrop,
      measureItemLayout,
      isPointOverBasket,
      setDragOverlap,
      updateDragOverlap,
    ],
  );

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
        <Text style={styles.instruction}>{t('games.numberPicnic.instruction')}</Text>

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
                    transform: [{ translateX: pos.offsetX }, { translateY: pos.offsetY }],
                    // Also set zIndex on wrapper when dragging
                    zIndex: isCurrentlyDragging ? 100 : 1,
                  },
                ]}
              >
                {item.isAvailable ? (
                  <Pressable
                    {...panResponder.panHandlers}
                    onPress={() => {
                      if (!isProcessing && item.isAvailable) {
                        onItemDrop(index);
                      }
                    }}
                    disabled={isProcessing}
                    accessibilityLabel={t('games.numberPicnic.itemAccessibilityLabel', {
                      item: itemEmoji,
                      index: index + 1,
                    })}
                    accessibilityHint={t('games.numberPicnic.itemAccessibilityHint')}
                    accessibilityRole='button'
                    testID={`picnic-item-${index}`}
                  >
                    <Animated.View
                      ref={(node) => {
                        itemRefs.current[index] = node as MeasurableNode | null;
                      }}
                      onLayout={() => measureItemLayout(index, () => undefined)}
                      style={[styles.draggableItem, animatedStyle]}
                    >
                      <Text style={styles.emoji} selectable={false}>
                        {item.emoji}
                      </Text>
                    </Animated.View>
                  </Pressable>
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
