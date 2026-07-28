import React, { useMemo } from 'react';
import { AccessibilityState, StyleSheet, View, Text, ViewStyle } from 'react-native';
import { useThemeColors, ResolvedThemeMode } from '../../utils/theme';
import { Space, TypeStyle } from '../tokens';
import { ThemeColors } from '../../types';
import { AppCard } from './AppCard';
import { IconBadge } from './IconBadge';
import { GameArtwork } from './GameArtwork';
import { useTranslation } from 'react-i18next';
import type { GameId } from '../../games/registry';

interface GameCardProps {
  gameId?: GameId;
  icon: string;
  title: string;
  description: string;
  onPress: () => void;
  /** Accent color used by the icon well and illustration */
  accentColor?: string;
  style?: ViewStyle;
  accessibilityState?: AccessibilityState;
  disabled?: boolean;
  testID?: string;
}

export const GameCard: React.FC<GameCardProps> = ({
  gameId,
  icon,
  title,
  description,
  onPress,
  accentColor,
  style,
  accessibilityState,
  disabled = false,
  testID,
}) => {
  const { colors, resolvedMode } = useThemeColors();
  const styles = useMemo(() => createStyles(colors, resolvedMode), [colors, resolvedMode]);
  const { t } = useTranslation();

  return (
    <AppCard
      onPress={onPress}
      variant='outlined'
      style={StyleSheet.flatten([styles.card, style])}
      accessibilityLabel={`${title}. ${description}`}
      accessibilityHint={t('accessibility.gameCardHint')}
      accessibilityState={accessibilityState}
      disabled={disabled}
      testID={testID}
    >
      <View style={styles.row}>
        <View
          style={[
            styles.iconWell,
            accentColor ? { backgroundColor: `${accentColor}33` } : undefined,
          ]}
          accessibilityLabel={title}
          accessibilityRole='image'
        >
          {gameId ? (
            <GameArtwork gameId={gameId} fallbackColor={accentColor} size={62} />
          ) : (
            <IconBadge
              icon={icon}
              size='md'
              showBorder={false}
              backgroundColor='transparent'
              accessibilityLabel={title}
            />
          )}
        </View>
        <View style={styles.info}>
          <Text style={styles.title} numberOfLines={2}>
            {title}
          </Text>
          <Text style={styles.description} numberOfLines={2}>
            {description}
          </Text>
        </View>
        <Text
          style={styles.chevron}
          accessibilityElementsHidden
          importantForAccessibility='no-hide-descendants'
        >
          ›
        </Text>
      </View>
    </AppCard>
  );
};

const createStyles = (colors: ThemeColors, _resolvedMode: ResolvedThemeMode) =>
  StyleSheet.create({
    card: {
      marginBottom: Space.md,
      justifyContent: 'center',
      minHeight: 100,
      padding: Space.md,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Space.base,
    },
    iconWell: {
      width: 72,
      height: 72,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.surfaceElevated,
      flexShrink: 0,
    },
    info: {
      flex: 1,
    },
    title: {
      ...TypeStyle.h4,
      color: colors.text,
      marginBottom: Space.xxs,
    },
    description: {
      ...TypeStyle.bodySm,
      color: colors.text,
    },
    chevron: {
      color: colors.textLight,
      fontSize: 36,
      lineHeight: 40,
      fontWeight: '300',
      marginLeft: Space.xs,
      marginRight: Space.xs,
    },
  });
