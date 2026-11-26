import React, { useMemo } from 'react';
import {
  AccessibilityState,
  AccessibilityRole,
  StyleSheet,
  Text,
  TouchableOpacity,
  Animated,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { useThemeColors } from '../../utils/theme';
import { useScalePress } from '../animations';
import { Space, Radius, Shadow, TypeStyle, HitTarget, ON_ACCENT_TEXT } from '../tokens';
import { ThemeColors } from '../../types';
import { ResolvedThemeMode } from '../../utils/theme';
import { ControlIcon, ControlIconName } from './ControlIcon';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';
const BUTTON_TOUCH_SLOP = { top: 6, bottom: 6, left: 6, right: 6 };
const BUTTON_PRESS_RETENTION = { top: 12, bottom: 12, left: 12, right: 12 };

interface AppButtonProps {
  label: string;
  icon?: ControlIconName;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  disabledLabel?: string;
  fullWidth?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  accessibilityState?: AccessibilityState;
  accessibilityRole?: AccessibilityRole;
  'aria-checked'?: boolean | 'mixed';
  testID?: string;
}

export const AppButton: React.FC<AppButtonProps> = ({
  label,
  icon,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  disabledLabel,
  fullWidth = false,
  style,
  textStyle,
  accessibilityLabel,
  accessibilityHint,
  accessibilityState,
  accessibilityRole = 'button',
  'aria-checked': ariaChecked,
  testID,
}) => {
  const { colors, resolvedMode } = useThemeColors();
  const { scale, onPressIn, onPressOut } = useScalePress();
  const styles = useMemo(
    () => createStyles(colors, resolvedMode, variant, size),
    [colors, resolvedMode, variant, size],
  );

  const displayedLabel = disabled ? (disabledLabel ?? label) : label;

  return (
    <Animated.View style={{ transform: [{ scale }], alignSelf: fullWidth ? 'stretch' : 'auto' }}>
      <TouchableOpacity
        style={[styles.button, fullWidth && styles.fullWidth, style, disabled && styles.disabled]}
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        disabled={disabled}
        activeOpacity={0.9}
        hitSlop={BUTTON_TOUCH_SLOP}
        pressRetentionOffset={BUTTON_PRESS_RETENTION}
        accessibilityLabel={
          disabled && disabledLabel ? displayedLabel : (accessibilityLabel ?? label)
        }
        accessibilityRole={accessibilityRole}
        accessibilityHint={accessibilityHint}
        accessibilityState={{ ...accessibilityState, disabled }}
        aria-checked={ariaChecked}
        aria-expanded={accessibilityState?.expanded}
        testID={testID}
      >
        {icon ? (
          <ControlIcon name={icon} color={disabled ? colors.textLight : styles.label.color} />
        ) : null}
        <Text style={[styles.label, textStyle, disabled && { color: colors.textLight }]}>
          {displayedLabel}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

const sizeMap = {
  sm: { paddingVertical: Space.sm, paddingHorizontal: Space.lg, minHeight: HitTarget.min },
  md: { paddingVertical: Space.md, paddingHorizontal: Space.xl, minHeight: HitTarget.min },
  lg: {
    paddingVertical: Space.base,
    paddingHorizontal: Space['2xl'],
    minHeight: HitTarget.min + 8,
  },
};

const createStyles = (
  colors: ThemeColors,
  resolvedMode: ResolvedThemeMode,
  variant: ButtonVariant,
  size: ButtonSize,
) => {
  const sizeValues = sizeMap[size];

  const variantStyles: Record<
    ButtonVariant,
    { bg: string; text: string; border: string; borderWidth: number }
  > = {
    primary: {
      bg: colors.primary,
      text: resolvedMode === 'dark' ? ON_ACCENT_TEXT : colors.text,
      border: 'transparent',
      borderWidth: 0,
    },
    secondary: {
      bg: colors.lavender,
      text: colors.lavenderInk,
      border: resolvedMode === 'dark' ? colors.line : '#D6C6E8',
      borderWidth: 1.5,
    },
    ghost: {
      bg: colors.surface,
      text: colors.text,
      border: colors.line,
      borderWidth: 1.5,
    },
    danger: {
      bg: colors.peach,
      text: colors.peachInk,
      border: resolvedMode === 'dark' ? colors.line : '#E9C9B6',
      borderWidth: 1.5,
    },
  };

  const v = variantStyles[variant];

  return StyleSheet.create({
    button: {
      backgroundColor: v.bg,
      borderRadius: Radius.full,
      borderWidth: v.borderWidth,
      borderColor: v.border,
      flexDirection: 'row',
      gap: Space.sm,
      alignItems: 'center',
      justifyContent: 'center',
      ...(variant === 'ghost' ? Shadow.sm : undefined),
      ...sizeValues,
    },
    label: {
      ...(size === 'sm' ? TypeStyle.buttonSm : TypeStyle.button),
      color: v.text,
      textAlign: 'center',
      flexShrink: 1,
    },
    disabled: {
      backgroundColor: colors.sunken,
      borderColor: colors.line,
      borderWidth: 1.5,
    },
    fullWidth: {
      width: '100%',
    },
  });
};
