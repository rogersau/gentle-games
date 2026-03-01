import React, { useMemo } from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { useThemeColors } from '../../utils/theme';
import { Space, Radius, TypeStyle, HitTarget } from '../tokens';
import { ThemeColors } from '../../types';
import { ResolvedThemeMode } from '../../utils/theme';

interface VolumeControlProps {
  value: number;
  onValueChange: (value: number) => void;
  steps?: number;
}

export const VolumeControl: React.FC<VolumeControlProps> = ({
  value,
  onValueChange,
  steps = 10,
}) => {
  const { colors, resolvedMode } = useThemeColors();
  const styles = useMemo(() => createStyles(colors, resolvedMode), [colors, resolvedMode]);

  const stepValues = Array.from({ length: steps }, (_, i) => (i + 1) / steps);

  const decrease = () => {
    const newVal = Math.max(0, Math.round((value - 1 / steps) * steps) / steps);
    onValueChange(newVal);
  };

  const increase = () => {
    const newVal = Math.min(1, Math.round((value + 1 / steps) * steps) / steps);
    onValueChange(newVal);
  };

  return (
    <View style={styles.container} accessibilityRole="adjustable" accessibilityLabel={`Volume ${Math.round(value * 100)}%`}>
      <TouchableOpacity
        style={styles.button}
        onPress={decrease}
        disabled={value <= 0}
        accessibilityLabel="Decrease volume"
        accessibilityRole="button"
      >
        <Text style={[styles.buttonText, value <= 0 && styles.buttonTextDisabled]}>−</Text>
      </TouchableOpacity>

      <View style={styles.barTrack}>
        {stepValues.map((step) => (
          <TouchableOpacity
            key={step}
            style={[styles.segment, value >= step && styles.segmentFilled]}
            onPress={() => onValueChange(step)}
            accessibilityLabel={`Set volume to ${Math.round(step * 100)}%`}
          />
        ))}
      </View>

      <TouchableOpacity
        style={styles.button}
        onPress={increase}
        disabled={value >= 1}
        accessibilityLabel="Increase volume"
        accessibilityRole="button"
      >
        <Text style={[styles.buttonText, value >= 1 && styles.buttonTextDisabled]}>+</Text>
      </TouchableOpacity>
    </View>
  );
};

const createStyles = (colors: ThemeColors, resolvedMode: ResolvedThemeMode) =>
  StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Space.sm,
    },
    button: {
      width: HitTarget.min - 8,
      height: HitTarget.min - 8,
      borderRadius: Radius.full,
      backgroundColor: colors.surface,
      borderWidth: 2,
      borderColor: colors.border,
      justifyContent: 'center',
      alignItems: 'center',
    },
    buttonText: {
      ...TypeStyle.h4,
      color: colors.text,
      lineHeight: 24,
    },
    buttonTextDisabled: {
      opacity: 0.3,
    },
    barTrack: {
      flex: 1,
      flexDirection: 'row',
      gap: 3,
      alignItems: 'center',
    },
    segment: {
      flex: 1,
      height: 20,
      borderRadius: Radius.xs,
      backgroundColor: colors.border,
    },
    segmentFilled: {
      backgroundColor: colors.primary,
    },
  });
