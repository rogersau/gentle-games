import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { LayoutChangeEvent, Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { useThemeColors } from '../../utils/theme';
import { Space, TypeStyle, Radius, HitTarget } from '../../ui/tokens';
import { ThemeColors } from '../../types';
import { useTranslation } from 'react-i18next';

interface PicnicBasketProps {
  items: string[];
  itemIds?: number[];
  removableItemIds?: readonly number[];
  measureRequest?: number;
  targetCount: number;
  onPress: () => void;
  onItemPress?: (itemId: number) => void;
  onDropZoneLayout?: (layout: { x: number; y: number; width: number; height: number }) => void;
  onDrop?: (itemId: string, valid: boolean) => void;
  isDropTarget?: boolean;
  isSuccess?: boolean;
  onAnimationComplete?: () => void;
  style?: ViewStyle;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  testID?: string;
}

export const PicnicBasket: React.FC<PicnicBasketProps> = ({
  items,
  itemIds,
  removableItemIds,
  measureRequest = 0,
  targetCount,
  onItemPress,
  onDropZoneLayout,
  isDropTarget = false,
  isSuccess = false,
  style,
  accessibilityLabel,
  accessibilityHint,
  testID,
}) => {
  const { colors } = useThemeColors();
  const { t } = useTranslation();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const basketRef = useRef<View>(null);

  const measureDropZone = useCallback(() => {
    basketRef.current?.measureInWindow?.((x, y, width, height) => {
      onDropZoneLayout?.({ x, y, width, height });
    });
  }, [onDropZoneLayout]);

  const handleLayout = (event: LayoutChangeEvent) => {
    if (basketRef.current?.measureInWindow) {
      measureDropZone();
      return;
    }
    const { layout } = event.nativeEvent;
    onDropZoneLayout?.(layout);
  };

  useEffect(() => {
    measureDropZone();
  }, [items.length, measureDropZone, measureRequest]);

  const ids = itemIds ?? items.map((_, index) => index);
  const removableIds = new Set(removableItemIds ?? ids);
  const displayedItems = items.slice(0, 12);
  const remainingCount = Math.max(0, items.length - displayedItems.length);
  const isFull = items.length >= targetCount;

  return (
    <View style={[styles.container, style]} accessible={false}>
      <View style={styles.handle} />
      <View
        ref={basketRef}
        onLayout={handleLayout}
        testID={testID ? `${testID}-drop-zone` : undefined}
        style={[
          styles.basket,
          isDropTarget && styles.basketTarget,
          isSuccess && styles.basketCorrect,
          isFull && !isSuccess && styles.basketFull,
        ]}
      >
        <View style={styles.rim} />
        <View style={styles.itemsArea}>
          {displayedItems.length > 0 ? (
            <View style={styles.itemsGrid}>
              {displayedItems.map((emoji, index) => {
                const itemId = ids[index] ?? index;
                const item = (
                  <Text style={styles.itemEmoji} selectable={false}>
                    {emoji}
                  </Text>
                );
                if (!onItemPress || !removableIds.has(itemId)) {
                  return (
                    <View
                      key={itemId}
                      accessible={false}
                      style={styles.placedItem}
                      testID={`picnic-placed-item-${itemId}`}
                    >
                      {item}
                    </View>
                  );
                }
                return (
                  <Pressable
                    key={itemId}
                    onPress={() => onItemPress?.(itemId)}
                    accessibilityRole='button'
                    accessibilityLabel={t('games.numberPicnic.removeItemAccessibilityLabel', {
                      item: emoji,
                      index: index + 1,
                    })}
                    accessibilityHint={t('games.numberPicnic.removeItemAccessibilityHint')}
                    style={styles.placedItem}
                    testID={`picnic-placed-item-${itemId}`}
                  >
                    {item}
                  </Pressable>
                );
              })}
            </View>
          ) : (
            <Text style={styles.emptyText}>{t('games.numberPicnic.emptyBasket')}</Text>
          )}
          {remainingCount > 0 && (
            <Text style={styles.moreIndicator}>
              {t('games.numberPicnic.moreItems', { count: remainingCount })}
            </Text>
          )}
        </View>
        <View style={[styles.countBadge, isSuccess && styles.countBadgeCorrect]}>
          <Text
            style={styles.countText}
            accessibilityLabel={accessibilityLabel}
            accessibilityHint={accessibilityHint}
          >
            {items.length}/{targetCount}
          </Text>
        </View>
      </View>
    </View>
  );
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      alignItems: 'center',
      paddingHorizontal: Space.md,
    },
    handle: {
      width: 100,
      height: 30,
      borderWidth: 4,
      borderColor: colors.border,
      borderBottomWidth: 0,
      borderRadius: 50,
      marginBottom: -15,
      zIndex: 1,
    },
    basket: {
      width: 280,
      minHeight: 180,
      backgroundColor: colors.surface,
      borderRadius: Radius.lg,
      borderWidth: 4,
      borderColor: colors.border,
      paddingHorizontal: Space.md,
      paddingTop: Space.lg,
      paddingBottom: Space.md,
      position: 'relative',
    },
    basketTarget: {
      borderColor: colors.primary,
      borderWidth: 6,
    },
    basketCorrect: {
      borderColor: colors.success,
      backgroundColor: `${colors.success}20`,
    },
    basketFull: {
      borderColor: colors.danger,
    },
    rim: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: 8,
      backgroundColor: colors.border,
      borderTopLeftRadius: Radius.lg - 4,
      borderTopRightRadius: Radius.lg - 4,
    },
    itemsArea: {
      minHeight: 100,
      justifyContent: 'center',
      alignItems: 'center',
    },
    itemsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'center',
      alignItems: 'center',
      maxWidth: 240,
    },
    placedItem: {
      minWidth: HitTarget.min,
      minHeight: HitTarget.min,
      justifyContent: 'center',
      alignItems: 'center',
    },
    itemEmoji: {
      fontSize: 24,
      textAlign: 'center',
    },
    moreIndicator: {
      ...TypeStyle.bodySm,
      color: colors.textLight,
      marginTop: Space.xs,
    },
    emptyText: {
      ...TypeStyle.body,
      color: colors.textLight,
      textAlign: 'center',
      fontStyle: 'italic',
    },
    countBadge: {
      position: 'absolute',
      bottom: -12,
      alignSelf: 'center',
      backgroundColor: colors.primary,
      paddingHorizontal: Space.md,
      paddingVertical: Space.xs,
      borderRadius: 20,
      borderWidth: 3,
      borderColor: colors.surface,
    },
    countBadgeCorrect: {
      backgroundColor: colors.success,
    },
    countText: {
      ...TypeStyle.label,
      color: '#FFFFFF',
      fontWeight: 'bold',
    },
  });
