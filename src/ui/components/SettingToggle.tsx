import React, { useId, useMemo } from 'react';
import { Platform, Pressable, StyleSheet, View, Text } from 'react-native';
import { useThemeColors } from '../../utils/theme';
import { HitTarget, Space, TypeStyle } from '../tokens';
import { ThemeColors } from '../../types';

interface SettingToggleProps {
  label: string;
  description?: string;
  artwork?: React.ReactNode;
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
}

export const SettingToggle: React.FC<SettingToggleProps> = ({
  label,
  description,
  artwork,
  value,
  onValueChange,
  disabled = false,
}) => {
  const { colors } = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const descriptionId = useId();
  const toggle = () => onValueChange(!value);
  const webKeyboard = Platform.OS === 'web' && {
    onKeyDown: (event: React.KeyboardEvent) => {
      if (event.key !== ' ') return;
      event.preventDefault();
      if (!event.repeat && !disabled) toggle();
    },
  };

  return (
    <Pressable
      {...webKeyboard}
      style={[styles.row, disabled && styles.disabled]}
      onPress={toggle}
      disabled={disabled}
      accessibilityLabel={label}
      accessibilityHint={description}
      accessibilityRole='switch'
      aria-checked={value}
      aria-describedby={description ? descriptionId : undefined}
      accessibilityState={{ checked: value, disabled }}
    >
      {artwork}
      <View style={styles.labelContainer}>
        <Text style={styles.label}>{label}</Text>
        {description && (
          <Text nativeID={descriptionId} style={styles.description}>
            {description}
          </Text>
        )}
      </View>
      <View
        style={[styles.track, value && styles.trackOn]}
        pointerEvents='none'
        accessibilityElementsHidden
        importantForAccessibility='no-hide-descendants'
        aria-hidden
      >
        <View style={styles.thumb} />
      </View>
    </Pressable>
  );
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    row: {
      minHeight: HitTarget.min,
      paddingVertical: Space.md,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: Space.base,
    },
    disabled: { opacity: 0.6 },
    track: {
      width: 42,
      height: 24,
      padding: 3,
      borderRadius: 12,
      backgroundColor: colors.border,
      justifyContent: 'center',
    },
    trackOn: { backgroundColor: colors.primary, alignItems: 'flex-end' },
    thumb: { width: 18, height: 18, borderRadius: 9, backgroundColor: colors.surface },
    labelContainer: {
      flex: 1,
    },
    label: {
      ...TypeStyle.label,
      color: colors.text,
    },
    description: {
      ...TypeStyle.bodySm,
      color: colors.textLight,
      marginTop: Space.xxs,
    },
  });
