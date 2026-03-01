import React, { useMemo } from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  ViewStyle,
} from 'react-native';
import { useThemeColors } from '../../utils/theme';
import { Space, Radius, Shadow } from '../tokens';
import { ThemeColors } from '../../types';

interface AppCardProps {
  children: React.ReactNode;
  /** If provided, card is pressable */
  onPress?: () => void;
  /** Visual variant */
  variant?: 'default' | 'elevated' | 'outlined';
  /** Additional container style */
  style?: ViewStyle;
  /** Optional decorative accent border on left */
  accentColor?: string;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  testID?: string;
}

export const AppCard: React.FC<AppCardProps> = ({
  children,
  onPress,
  variant = 'default',
  style,
  accentColor,
  accessibilityLabel,
  accessibilityHint,
  testID,
}) => {
  const { colors } = useThemeColors();
  const styles = useMemo(() => createStyles(colors, variant), [colors, variant]);

  const accentBorder = accentColor
    ? { borderLeftWidth: 4, borderLeftColor: accentColor }
    : undefined;

  const content = (
    <View style={[styles.card, accentBorder, style]} testID={testID}>
      {children}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.85}
        accessibilityLabel={accessibilityLabel}
        accessibilityRole="button"
        accessibilityHint={accessibilityHint}
      >
        {content}
      </TouchableOpacity>
    );
  }

  return content;
};

const createStyles = (colors: ThemeColors, variant: 'default' | 'elevated' | 'outlined') =>
  StyleSheet.create({
    card: {
      backgroundColor: variant === 'outlined' ? 'transparent' : colors.surface,
      borderRadius: Radius.lg,
      padding: Space.lg,
      borderWidth: variant === 'outlined' ? 2 : 0,
      borderColor: variant === 'outlined' ? colors.border : 'transparent',
      ...(variant === 'elevated' ? Shadow.md : Shadow.sm),
    },
  });
