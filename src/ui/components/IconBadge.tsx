import React, { useMemo } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { useThemeColors } from '../../utils/theme';
import { Space, Radius, Shadow } from '../tokens';
import { ThemeColors } from '../../types';

type BadgeSize = 'sm' | 'md' | 'lg';

interface IconBadgeProps {
  /** Emoji or short text to display */
  icon: string;
  /** Background color for the badge circle */
  backgroundColor?: string;
  size?: BadgeSize;
  /** Whether to show decorative border */
  showBorder?: boolean;
  accessibilityLabel?: string;
}

const sizeMap: Record<BadgeSize, { container: number; fontSize: number; borderWidth: number }> = {
  sm: { container: 36, fontSize: 18, borderWidth: 2 },
  md: { container: 52, fontSize: 28, borderWidth: 3 },
  lg: { container: 68, fontSize: 38, borderWidth: 3 },
};

export const IconBadge: React.FC<IconBadgeProps> = ({
  icon,
  backgroundColor,
  size = 'md',
  showBorder = true,
  accessibilityLabel,
}) => {
  const { colors } = useThemeColors();
  const styles = useMemo(
    () => createStyles(colors, size, backgroundColor, showBorder),
    [colors, size, backgroundColor, showBorder]
  );

  return (
    <View
      style={styles.outerRing}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="image"
    >
      <View style={styles.innerCircle}>
        <Text style={styles.icon}>{icon}</Text>
      </View>
    </View>
  );
};

const createStyles = (
  colors: ThemeColors,
  size: BadgeSize,
  backgroundColor: string | undefined,
  showBorder: boolean
) => {
  const s = sizeMap[size];
  const bg = backgroundColor ?? colors.surfaceElevated;

  return StyleSheet.create({
    outerRing: {
      width: s.container + (showBorder ? s.borderWidth * 2 + 4 : 0),
      height: s.container + (showBorder ? s.borderWidth * 2 + 4 : 0),
      borderRadius: Radius.full,
      borderWidth: showBorder ? s.borderWidth : 0,
      borderColor: colors.borderSubtle,
      borderStyle: 'dashed',
      alignItems: 'center',
      justifyContent: 'center',
      ...Shadow.sm,
    },
    innerCircle: {
      width: s.container,
      height: s.container,
      borderRadius: Radius.full,
      backgroundColor: bg,
      alignItems: 'center',
      justifyContent: 'center',
    },
    icon: {
      fontSize: s.fontSize,
      textAlign: 'center',
    },
  });
};
