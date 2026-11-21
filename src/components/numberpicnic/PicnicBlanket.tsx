import React, { useLayoutEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  PanResponder,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  type PanResponderGestureState,
  type ViewStyle,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Space, Radius, HitTarget } from '../../ui/tokens';
import type { ThemeColors } from '../../types';
import { useThemeColors } from '../../utils/theme';
import { webGameDragSurface } from '../../utils/pwaInteractionGuards';

interface WindowRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

type DragGesture = Pick<PanResponderGestureState, 'dx' | 'dy'> &
  Partial<Pick<PanResponderGestureState, 'moveX' | 'moveY'>>;

interface ActiveDrag {
  itemId: number;
  origin: WindowRect | null;
  basket: WindowRect | null;
  gesture: DragGesture | null;
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
): boolean =>
  Boolean(
    draggedRect &&
    dropZoneLayout &&
    draggedRect.x < dropZoneLayout.x + dropZoneLayout.width &&
    draggedRect.x + draggedRect.width > dropZoneLayout.x &&
    draggedRect.y < dropZoneLayout.y + dropZoneLayout.height &&
    draggedRect.y + draggedRect.height > dropZoneLayout.y,
  );

export const isNumberPicnicDropValid = (
  itemLayout: WindowRect | null,
  dropZoneLayout: WindowRect | null | undefined,
  gesture: DragGesture,
): boolean => {
  if (itemLayout) {
    return doesNumberPicnicRectOverlap(
      translateNumberPicnicRect(itemLayout, gesture.dx, gesture.dy),
      dropZoneLayout,
    );
  }

  const { moveX, moveY } = gesture;
  return Boolean(
    dropZoneLayout &&
    typeof moveX === 'number' &&
    typeof moveY === 'number' &&
    moveX >= dropZoneLayout.x &&
    moveX <= dropZoneLayout.x + dropZoneLayout.width &&
    moveY >= dropZoneLayout.y &&
    moveY <= dropZoneLayout.y + dropZoneLayout.height,
  );
};

const measureRect = (view: View | null, onMeasured: (rect: WindowRect) => void) => {
  view?.measureInWindow((x, y, width, height) => {
    if ([x, y, width, height].every(Number.isFinite) && width > 0 && height > 0) {
      onMeasured({ x, y, width, height });
    }
  });
};

interface PicnicBlanketProps {
  itemEmoji: string;
  itemName: string;
  itemIds: readonly number[];
  firstItemId: number;
  poolSize: number;
  onItemDrop: (id: number) => void;
  onDropStart: () => void;
  onDragOverBasket: (isOver: boolean) => void;
  onDropEnd: () => void;
  basketRef: React.RefObject<View | null>;
  isComplete: boolean;
  compact?: boolean;
  style?: ViewStyle;
  testID?: string;
}

const DRAG_THRESHOLD = 8;
const webDragStyle = Platform.OS === 'web' ? ({ touchAction: 'none' } as ViewStyle) : undefined;

export const PicnicBlanket: React.FC<PicnicBlanketProps> = ({
  itemEmoji,
  itemName,
  itemIds,
  firstItemId,
  poolSize,
  onItemDrop,
  onDropStart,
  onDragOverBasket,
  onDropEnd,
  basketRef,
  isComplete,
  compact = false,
  style,
  testID,
}) => {
  const { colors } = useThemeColors();
  const { t } = useTranslation();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [draggingId, setDraggingId] = useState<number | null>(null);
  const [position] = useState(() => new Animated.ValueXY());
  const activeDrag = useRef<ActiveDrag | null>(null);
  const itemRefs = useRef<Record<number, View | null>>({});
  const availableIds = useMemo(() => new Set(itemIds), [itemIds]);
  const bindings = useRef({
    availableIds,
    isComplete,
    onDropStart,
    onDragOverBasket,
    onDropEnd,
    onItemDrop,
  });

  useLayoutEffect(() => {
    bindings.current = {
      availableIds,
      isComplete,
      onDropStart,
      onDragOverBasket,
      onDropEnd,
      onItemDrop,
    };
  }, [availableIds, isComplete, onDropStart, onDragOverBasket, onDropEnd, onItemDrop]);

  useLayoutEffect(
    () => () => {
      activeDrag.current = null;
    },
    [],
  );

  const slots = useMemo(
    () =>
      Array.from({ length: poolSize - firstItemId }, (_, index) => {
        const itemId = firstItemId + index;
        const getDrag = () => {
          const drag = activeDrag.current;
          return drag?.itemId === itemId ? drag : null;
        };
        const reportOverlap = (drag: ActiveDrag) => {
          if (activeDrag.current === drag && drag.gesture) {
            bindings.current.onDragOverBasket(
              isNumberPicnicDropValid(drag.origin, drag.basket, drag.gesture),
            );
          }
        };
        const finishDrag = () => {
          activeDrag.current = null;
          setDraggingId(null);
          position.setValue({ x: 0, y: 0 });
          bindings.current.onDropEnd();
        };

        return {
          itemId,
          responder: PanResponder.create({
            onMoveShouldSetPanResponder: (_, { dx, dy }) =>
              !activeDrag.current &&
              !bindings.current.isComplete &&
              bindings.current.availableIds.has(itemId) &&
              dy <= -DRAG_THRESHOLD &&
              -dy >= Math.abs(dx),
            onPanResponderGrant: () => {
              if (
                activeDrag.current ||
                bindings.current.isComplete ||
                !bindings.current.availableIds.has(itemId)
              )
                return;
              const drag: ActiveDrag = { itemId, origin: null, basket: null, gesture: null };
              activeDrag.current = drag;
              setDraggingId(itemId);
              bindings.current.onDropStart();

              // Measure the stationary slot. Its bounds exclude the animated translation.
              measureRect(itemRefs.current[itemId], (origin) => {
                drag.origin = origin;
                reportOverlap(drag);
              });
              // Scrolling can move the basket without firing its onLayout.
              measureRect(basketRef.current, (basket) => {
                drag.basket = basket;
                reportOverlap(drag);
              });
            },
            onPanResponderMove: (_, gesture) => {
              const drag = getDrag();
              if (!drag) return;
              const { dx, dy, moveX, moveY } = gesture;
              drag.gesture = { dx, dy, moveX, moveY };
              position.setValue({ x: dx, y: dy });
              reportOverlap(drag);
            },
            onPanResponderRelease: () => {
              const drag = getDrag();
              if (!drag) return;
              const valid =
                drag.gesture && isNumberPicnicDropValid(drag.origin, drag.basket, drag.gesture);
              finishDrag();
              if (valid) bindings.current.onItemDrop(itemId);
            },
            onPanResponderTerminationRequest: () => false,
            onPanResponderTerminate: () => {
              if (getDrag()) finishDrag();
            },
          }),
        };
      }),
    [basketRef, firstItemId, poolSize, position],
  );

  return (
    <View style={[styles.container, compact && styles.containerCompact, style]} testID={testID}>
      <View style={styles.itemsContainer}>
        {slots.map(({ itemId, responder }) => {
          const available = availableIds.has(itemId);
          if (compact && !available) return null;
          const isDragging = itemId === draggingId;
          return (
            <View
              key={itemId}
              ref={(node) => {
                itemRefs.current[itemId] = node;
              }}
              collapsable={false}
              // Pressable owns its own responder callbacks, so the slot handles drag.
              {...responder.panHandlers}
              style={[
                styles.slot,
                compact && styles.slotCompact,
                isDragging && styles.draggingSlot,
              ]}
              testID={`picnic-drag-${itemId}`}
            >
              {available ? (
                <Pressable
                  {...(!isComplete && webGameDragSurface)}
                  style={[styles.item, compact && styles.itemCompact, !isComplete && webDragStyle]}
                  onPress={() => {
                    if (!activeDrag.current) onItemDrop(itemId);
                  }}
                  disabled={isComplete}
                  accessibilityRole='button'
                  accessibilityLabel={t('games.numberPicnic.itemAccessibilityLabel', {
                    item: itemName,
                    index: itemId - firstItemId + 1,
                  })}
                  accessibilityHint={t('games.numberPicnic.itemAccessibilityHint')}
                  testID={`picnic-item-${itemId}`}
                >
                  <Animated.View
                    style={isDragging && { transform: position.getTranslateTransform() }}
                  >
                    <Text style={[styles.emoji, compact && styles.emojiCompact]} selectable={false}>
                      {itemEmoji}
                    </Text>
                  </Animated.View>
                </Pressable>
              ) : (
                <View style={styles.placeholder} />
              )}
            </View>
          );
        })}
      </View>
    </View>
  );
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      width: '100%',
      maxWidth: 432,
      zIndex: 2,
      backgroundColor: colors.surfaceGame,
      borderRadius: Radius.lg,
      borderWidth: 2,
      borderColor: colors.border,
      padding: Space.sm,
    },
    containerCompact: { padding: Space.xs },
    itemsContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'center',
    },
    slot: { margin: Space.xs },
    slotCompact: { margin: Space.xxs },
    draggingSlot: { zIndex: 1 },
    item: {
      width: 56,
      height: 56,
      justifyContent: 'center',
      alignItems: 'center',
    },
    itemCompact: { width: HitTarget.min, height: HitTarget.min },
    emoji: { fontSize: 36, textAlign: 'center' },
    emojiCompact: { fontSize: 30 },
    placeholder: {
      width: 56,
      height: 56,
      borderRadius: Radius.md,
      borderWidth: 1,
      borderColor: colors.border,
    },
  });
