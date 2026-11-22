import { GamePicture } from '../../ui/components/GamePicture';
import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { useThemeColors } from '../../utils/theme';
import { Space, TypeStyle, Radius, HitTarget, ON_ACCENT_TEXT } from '../../ui/tokens';
import { ThemeColors } from '../../types';
import { useTranslation } from 'react-i18next';

interface PicnicBasketProps {
  items: string[];
  itemIds?: number[];
  removableItemIds?: readonly number[];
  dropZoneRef?: React.Ref<View>;
  targetCount: number;
  itemName?: string;
  onItemPress?: (itemId: number) => void;
  isDropTarget?: boolean;
  isDragging?: boolean;
  isSuccess?: boolean;
  compact?: boolean;
  style?: ViewStyle;
  accessibilityLabel?: string;
  testID?: string;
}

export const PicnicBasket: React.FC<PicnicBasketProps> = ({
  items,
  itemIds,
  removableItemIds,
  dropZoneRef,
  targetCount,
  itemName,
  onItemPress,
  isDropTarget = false,
  isDragging = false,
  isSuccess = false,
  compact = false,
  style,
  accessibilityLabel,
  testID,
}) => {
  const { colors } = useThemeColors();
  const { t } = useTranslation();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const ids = itemIds ?? items.map((_, index) => index);
  const removableIds = new Set(removableItemIds ?? ids);
  const displayedItems = items.slice(0, 12);
  const remainingCount = Math.max(0, items.length - displayedItems.length);
  const isFull = items.length >= targetCount;

  return (
    <View style={[styles.container, style]} accessible={false}>
      <View style={[styles.handle, compact && styles.handleCompact]} />
      <View
        ref={dropZoneRef}
        collapsable={false}
        testID={testID ? `${testID}-drop-zone` : undefined}
        style={[
          styles.basket,
          compact && styles.basketCompact,
          isDropTarget && styles.basketTarget,
          isSuccess && styles.basketCorrect,
          isFull && !isSuccess && styles.basketFull,
        ]}
      >
        <View style={styles.rim} />
        <View style={[styles.itemsArea, compact && styles.itemsAreaCompact]}>
          {displayedItems.length > 0 ? (
            <View style={styles.itemsGrid}>
              {displayedItems.map((emoji, index) => {
                const itemId = ids[index] ?? index;
                const item = <GamePicture name={emoji} size={24} />;
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
                    disabled={isDragging}
                    accessibilityRole='button'
                    accessibilityLabel={t('games.numberPicnic.removeItemAccessibilityLabel', {
                      item: itemName ?? emoji,
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
          <Text style={styles.countText} accessibilityLabel={accessibilityLabel}>
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
      width: '100%',
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
    handleCompact: { height: 20, marginBottom: -10 },
    basket: {
      width: '100%',
      maxWidth: 280,
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
    basketCompact: { minHeight: 106, paddingTop: Space.sm, paddingBottom: Space.md },
    basketTarget: {
      borderColor: colors.primary,
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
    itemsAreaCompact: { minHeight: 68 },
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
      color: ON_ACCENT_TEXT,
      fontWeight: 'bold',
    },
  });
