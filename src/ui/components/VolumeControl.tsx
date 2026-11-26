import React, { useMemo, useState } from 'react';
import { Platform, StyleSheet, View, Text, TouchableOpacity, Pressable } from 'react-native';
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
  const percent = Math.round(value * 100);

  const stepValues = Array.from({ length: steps }, (_, i) => (i + 1) / steps);

  const decrease = () => {
    const newVal = Math.max(0, Math.round((value - 1 / steps) * steps) / steps);
    onValueChange(newVal);
  };

  const increase = () => {
    const newVal = Math.min(1, Math.round((value + 1 / steps) * steps) / steps);
    onValueChange(newVal);
  };
  const webKeyboard = Platform.OS === 'web' && {
    onKeyDown: (event: React.KeyboardEvent) => {
      switch (event.key) {
        case 'ArrowLeft':
        case 'ArrowDown':
          decrease();
          break;
        case 'ArrowRight':
        case 'ArrowUp':
          increase();
          break;
        case 'Home':
          onValueChange(0);
          break;
        case 'End':
          onValueChange(1);
          break;
        default:
          return;
      }
      event.preventDefault();
    },
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.button, value <= 0 && styles.buttonDisabled]}
        onPress={decrease}
        disabled={value <= 0}
        accessibilityLabel={t('settings.volume.decrease')}
        accessibilityRole='button'
      >
        <Text style={[styles.buttonText, value <= 0 && styles.buttonTextDisabled]}>−</Text>
      </TouchableOpacity>

      <Pressable
        {...webKeyboard}
        style={styles.barTrack}
        onLayout={(event) => setTrackWidth(event.nativeEvent.layout.width)}
        onPress={(event) => {
          let width = trackWidth;
          let x = event.nativeEvent.locationX;
          if (Platform.OS === 'web') {
            const { nativeEvent, currentTarget } = event as unknown as React.MouseEvent;
            // RN Web's onPress uses a click. Measure against the full track,
            // independently of the segment the pointer hit.
            if (!nativeEvent.detail || typeof currentTarget?.getBoundingClientRect !== 'function')
              return;
            const bounds = currentTarget.getBoundingClientRect();
            width = bounds.width;
            x = nativeEvent.clientX - bounds.left;
          }
          if (width <= 0 || !Number.isFinite(x)) return;
          const step = Math.max(0, Math.min(steps, Math.round((x / width) * steps)));
          onValueChange(step / steps);
        }}
        accessibilityRole='adjustable'
        accessibilityLabel={t('settings.volume.current', { percent })}
        accessibilityHint={t('settings.volume.adjustHint')}
        accessibilityValue={{ min: 0, max: 100, now: percent }}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
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
            pointerEvents='none'
            accessible={false}
          />
        ))}
      </Pressable>

      <TouchableOpacity
        style={[styles.button, value >= 1 && styles.buttonDisabled]}
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
    buttonDisabled: { backgroundColor: colors.sunken },
    buttonTextDisabled: { color: colors.textLight },
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
      backgroundColor: colors.sunken,
      borderWidth: 1,
      borderColor: colors.outline,
    },
    segmentFilled: {
      backgroundColor: colors.skyInk,
      borderColor: colors.skyInk,
    },
  });
