import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ViewStyle } from 'react-native';
import { useMemo } from 'react';
import { useThemeColors } from '../../utils/theme';
import { Space, Radius, TypeStyle, HitTarget } from '../tokens';
import { ThemeColors } from '../../types';
import { ResolvedThemeMode } from '../../utils/theme';
import { useTranslation } from 'react-i18next';

interface AppHeaderProps {
  title: string;
  /** Show back button. Provide onBack handler. */
  onBack?: () => void;
  /** Custom back label (default: "← Back") */
  backLabel?: string;
  /** Right-side action */
  rightAction?: React.ReactNode;
  /** Additional container style */
  style?: ViewStyle;
}

const HEADER_TOUCH_SLOP = { top: 8, bottom: 8, left: 8, right: 8 };
const HEADER_PRESS_RETENTION = { top: 12, bottom: 12, left: 12, right: 12 };

export const AppHeader: React.FC<AppHeaderProps> = ({
  title,
  onBack,
  backLabel,
  rightAction,
  style,
}) => {
  const { colors, resolvedMode } = useThemeColors();
  const { t } = useTranslation();
  const styles = useMemo(() => createStyles(colors, resolvedMode), [colors, resolvedMode]);

  const displayedBackLabel = backLabel ?? t('common.back');

  return (
    <View style={[styles.container, style]}>
      {onBack ? (
        <TouchableOpacity
          style={styles.backButton}
          onPress={onBack}
          accessibilityLabel={t('common.back') }
          accessibilityRole="button"
          hitSlop={HEADER_TOUCH_SLOP}
          pressRetentionOffset={HEADER_PRESS_RETENTION}
        >
          <Text style={styles.backText}>{displayedBackLabel}</Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.placeholder} />
      )}

      <Text style={styles.title} numberOfLines={1} accessibilityRole="header">
        {title}
      </Text>

      {rightAction ? (
        <View style={styles.rightSlot}>{rightAction}</View>
      ) : (
        <View style={styles.placeholder} />
      )}
    </View>
  );
};

const createStyles = (colors: ThemeColors, resolvedMode: ResolvedThemeMode) =>
  StyleSheet.create({
    container: {
      height: 60,
      paddingHorizontal: Space.base,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderBottomWidth: 1,
      borderBottomColor: colors.borderSubtle,
      backgroundColor: colors.background,
    },
    backButton: {
      minWidth: 80,
      minHeight: HitTarget.min,
      borderRadius: Radius.full,
      borderWidth: 2,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: Space.md,
    },
    backText: {
      ...TypeStyle.buttonSm,
      color: resolvedMode === 'dark' ? colors.text : colors.text,
    },
    title: {
      ...TypeStyle.h3,
      color: colors.text,
      flex: 1,
      textAlign: 'center',
      marginHorizontal: Space.sm,
    },
    placeholder: {
      minWidth: 80,
    },
    rightSlot: {
      minWidth: 80,
      alignItems: 'flex-end',
    },
  });
