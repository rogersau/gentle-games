import React, { useMemo } from 'react';
import { StyleSheet, View, Text, ViewStyle } from 'react-native';
import { useThemeColors, ResolvedThemeMode } from '../../utils/theme';
import { Space, TypeStyle } from '../tokens';
import { ThemeColors } from '../../types';
import { AppCard } from './AppCard';
import { IconBadge } from './IconBadge';

interface GameCardProps {
  icon: string;
  title: string;
  description: string;
  onPress: () => void;
  /** Accent color for the card border */
  accentColor?: string;
  style?: ViewStyle;
  testID?: string;
}

export const GameCard: React.FC<GameCardProps> = ({
  icon,
  title,
  description,
  onPress,
  accentColor,
  style,
  testID,
}) => {
  const { colors, resolvedMode } = useThemeColors();
  const styles = useMemo(() => createStyles(colors, resolvedMode), [colors, resolvedMode]);

  return (
    <AppCard
      onPress={onPress}
      variant="elevated"
      accentColor={accentColor}
      style={StyleSheet.flatten([styles.card, style])}
      accessibilityLabel={`${title}. ${description}`}
      accessibilityHint="Double tap to play this game"
      testID={testID}
    >
      <View style={styles.row}>
        <IconBadge icon={icon} size="md" accessibilityLabel={title} />
        <View style={styles.info}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.description}>{description}</Text>
        </View>
      </View>
    </AppCard>
  );
};

const createStyles = (colors: ThemeColors, resolvedMode: ResolvedThemeMode) =>
  StyleSheet.create({
    card: {
      marginBottom: Space.md,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Space.base,
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
      color: colors.textLight,
    },
  });
