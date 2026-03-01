import React, { useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity, Animated, ViewStyle, TextStyle } from 'react-native';
import { useThemeColors } from '../../utils/theme';
import { useScalePress } from '../animations';
import { Space, Radius, TypeStyle, HitTarget } from '../tokens';
import { ThemeColors } from '../../types';
import { ResolvedThemeMode } from '../../utils/theme';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface AppButtonProps {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  testID?: string;
}

export const AppButton: React.FC<AppButtonProps> = ({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  fullWidth = false,
  style,
  textStyle,
  accessibilityLabel,
  accessibilityHint,
  testID,
}) => {
  const { colors, resolvedMode } = useThemeColors();
  const { scale, onPressIn, onPressOut } = useScalePress();
  const styles = useMemo(
    () => createStyles(colors, resolvedMode, variant, size),
    [colors, resolvedMode, variant, size]
  );

  return (
    <Animated.View style={{ transform: [{ scale }], alignSelf: fullWidth ? 'stretch' : 'auto' }}>
      <TouchableOpacity
        style={[styles.button, disabled && styles.disabled, fullWidth && styles.fullWidth, style]}
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        disabled={disabled}
        activeOpacity={0.8}
        accessibilityLabel={accessibilityLabel ?? label}
        accessibilityRole="button"
        accessibilityHint={accessibilityHint}
        accessibilityState={{ disabled }}
        testID={testID}
      >
        <Text style={[styles.label, textStyle]}>{label}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

const sizeMap = {
  sm: { paddingVertical: Space.sm, paddingHorizontal: Space.base, minHeight: HitTarget.min - 4 },
  md: { paddingVertical: Space.md, paddingHorizontal: Space.xl, minHeight: HitTarget.min },
  lg: { paddingVertical: Space.base, paddingHorizontal: Space['2xl'], minHeight: HitTarget.min + 8 },
};

const createStyles = (
  colors: ThemeColors,
  resolvedMode: ResolvedThemeMode,
  variant: ButtonVariant,
  size: ButtonSize
) => {
  const sizeValues = sizeMap[size];

  const variantStyles: Record<ButtonVariant, { bg: string; text: string; border: string }> = {
    primary: { bg: colors.primary, text: colors.surface, border: colors.primary },
    secondary: { bg: colors.secondary, text: colors.surface, border: colors.secondary },
    ghost: {
      bg: 'transparent',
      text: resolvedMode === 'dark' ? colors.text : colors.text,
      border: colors.border,
    },
    danger: { bg: colors.danger, text: colors.surface, border: colors.danger },
  };

  const v = variantStyles[variant];

  return StyleSheet.create({
    button: {
      backgroundColor: v.bg,
      borderRadius: Radius.full,
      borderWidth: variant === 'ghost' ? 2 : 0,
      borderColor: v.border,
      alignItems: 'center',
      justifyContent: 'center',
      ...sizeValues,
    },
    label: {
      ...(size === 'sm' ? TypeStyle.buttonSm : TypeStyle.button),
      color: v.text,
    },
    disabled: {
      opacity: 0.5,
    },
    fullWidth: {
      width: '100%',
    },
  });
};
