import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { useThemeColors } from '../../utils/theme';
import { Radius, Shadow } from '../tokens';
import { ThemeColors } from '../../types';

import { GamePicture } from './GamePicture';

type BadgeSize = 'sm' | 'md' | 'lg';

interface IconBadgeProps {
  /** Catalogue picture name or a supported legacy game symbol */
  icon: string;
  /** Background color for the badge circle */
  backgroundColor?: string;
  size?: BadgeSize;
  /** Whether to show decorative border */
  showBorder?: boolean;
  accessibilityLabel?: string;
}

const sizeMap: Record<BadgeSize, { container: number; pictureSize: number; borderWidth: number }> =
  {
    sm: { container: 36, pictureSize: 18, borderWidth: 2 },
    md: { container: 52, pictureSize: 28, borderWidth: 3 },
    lg: { container: 68, pictureSize: 38, borderWidth: 3 },
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
    [colors, size, backgroundColor, showBorder],
  );

  return (
    <View
      style={styles.outerRing}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole='image'
    >
      <View style={styles.innerCircle}>
        <GamePicture name={icon} size={sizeMap[size].pictureSize} />
      </View>
    </View>
  );
};

const createStyles = (
  colors: ThemeColors,
  size: BadgeSize,
  backgroundColor: string | undefined,
  showBorder: boolean,
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
  });
};
