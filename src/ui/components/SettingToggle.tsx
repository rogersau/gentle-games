import React, { useId, useMemo } from 'react';
import { Platform, Pressable, StyleSheet, View, Text } from 'react-native';
import { useThemeColors } from '../../utils/theme';
import { HitTarget, Space, TypeStyle, SWITCH_ON_TRACK, SWITCH_ON_THUMB } from '../tokens';
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
        <View style={[styles.thumb, value && styles.thumbOn]} />
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
    disabled: { backgroundColor: colors.sunken },
    track: {
      width: 50,
      height: 30,
      padding: 3,
      borderRadius: 15,
      borderWidth: 2,
      borderColor: colors.outline,
      backgroundColor: colors.surface,
      justifyContent: 'center',
    },
    trackOn: {
      backgroundColor: SWITCH_ON_TRACK,
      borderColor: colors.skyInk,
      alignItems: 'flex-end',
    },
    thumb: { width: 20, height: 20, borderRadius: 10, backgroundColor: colors.outline },
    thumbOn: { backgroundColor: SWITCH_ON_THUMB },
    labelContainer: {
      flex: 1,
    },
    label: {
      ...TypeStyle.label,
      color: colors.text,
    },
    description: {
      ...TypeStyle.helper,
      color: colors.textLight,
      marginTop: Space.xxs,
    },
  });
