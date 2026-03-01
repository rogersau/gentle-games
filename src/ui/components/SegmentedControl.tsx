import React, { useMemo } from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { useThemeColors } from '../../utils/theme';
import { Space, Radius, TypeStyle, HitTarget } from '../tokens';
import { ThemeColors } from '../../types';
import { ResolvedThemeMode } from '../../utils/theme';

interface SegmentOption<T extends string | number> {
  value: T;
  label: string;
}

interface SegmentedControlProps<T extends string | number> {
  options: SegmentOption<T>[];
  value: T;
  onValueChange: (value: T) => void;
  /** Allow wrapping for many options */
  wrap?: boolean;
}

export const SegmentedControl = <T extends string | number>({
  options,
  value,
  onValueChange,
  wrap = false,
}: SegmentedControlProps<T>) => {
  const { colors, resolvedMode } = useThemeColors();
  const styles = useMemo(() => createStyles(colors, resolvedMode), [colors, resolvedMode]);

  return (
    <View style={[styles.container, wrap && styles.containerWrap]} accessibilityRole="radiogroup">
      {options.map((option) => {
        const isActive = option.value === value;
        return (
          <TouchableOpacity
            key={String(option.value)}
            style={[
              styles.segment,
              isActive && styles.segmentActive,
              !wrap && styles.segmentFlex,
            ]}
            onPress={() => onValueChange(option.value)}
            accessibilityLabel={option.label}
            accessibilityRole="radio"
            accessibilityState={{ selected: isActive }}
          >
            <Text style={[styles.label, isActive && styles.labelActive]}>
              {option.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const createStyles = (colors: ThemeColors, resolvedMode: ResolvedThemeMode) =>
  StyleSheet.create({
    container: {
      flexDirection: 'row',
      gap: Space.sm,
    },
    containerWrap: {
      flexWrap: 'wrap',
    },
    segment: {
      backgroundColor: colors.surface,
      borderWidth: 2,
      borderColor: colors.border,
      borderRadius: Radius.md,
      paddingVertical: Space.sm + 2,
      paddingHorizontal: Space.md,
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: HitTarget.min,
    },
    segmentFlex: {
      flex: 1,
    },
    segmentActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    label: {
      ...TypeStyle.buttonSm,
      color: colors.text,
    },
    labelActive: {
      color: colors.surface,
    },
  });
