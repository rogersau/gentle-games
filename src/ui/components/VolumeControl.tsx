import React, { useMemo, useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Pressable } from 'react-native';
import { useThemeColors } from '../../utils/theme';
import { Space, Radius, TypeStyle, HitTarget } from '../tokens';
import { ThemeColors } from '../../types';
import { ResolvedThemeMode } from '../../utils/theme';
import { useTranslation } from 'react-i18next';

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
  const { t } = useTranslation();
  const styles = useMemo(() => createStyles(colors, resolvedMode), [colors, resolvedMode]);
  const [trackWidth, setTrackWidth] = useState(0);

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
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.button}
        onPress={decrease}
        disabled={value <= 0}
        accessibilityLabel={t('settings.volume.decrease')}
        accessibilityRole='button'
      >
        <Text style={[styles.buttonText, value <= 0 && styles.buttonTextDisabled]}>−</Text>
      </TouchableOpacity>

      <Pressable
        style={styles.barTrack}
        onLayout={(event) => setTrackWidth(event.nativeEvent.layout.width)}
        onPress={(event) => {
          if (trackWidth <= 0) return;
          const step = Math.max(
            0,
            Math.min(steps, Math.round((event.nativeEvent.locationX / trackWidth) * steps)),
          );
          onValueChange(step / steps);
        }}
        accessibilityRole='adjustable'
        accessibilityLabel={t('settings.volume.current', { percent: Math.round(value * 100) })}
        accessibilityHint={t('settings.volume.adjustHint')}
        accessibilityValue={{ min: 0, max: 100, now: Math.round(value * 100) }}
        accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
        onAccessibilityAction={(event) => {
          if (event.nativeEvent.actionName === 'increment') increase();
          if (event.nativeEvent.actionName === 'decrement') decrease();
        }}
      >
        {stepValues.map((step) => (
          <View
            key={step}
            style={[styles.segment, value >= step && styles.segmentFilled]}
            accessible={false}
          />
        ))}
      </Pressable>

      <TouchableOpacity
        style={styles.button}
        onPress={increase}
        disabled={value >= 1}
        accessibilityLabel={t('settings.volume.increase')}
        accessibilityRole='button'
      >
        <Text style={[styles.buttonText, value >= 1 && styles.buttonTextDisabled]}>+</Text>
      </TouchableOpacity>
    </View>
  );
};

const createStyles = (colors: ThemeColors, _resolvedMode: ResolvedThemeMode) =>
  StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Space.sm,
    },
    button: {
      width: HitTarget.min,
      height: HitTarget.min,
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
      minWidth: HitTarget.min,
      minHeight: HitTarget.min,
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
