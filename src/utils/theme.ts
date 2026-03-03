import { useColorScheme, AccessibilityInfo } from 'react-native';
import { useEffect, useState } from 'react';
import { useSettings } from '../context/SettingsContext';
import { ColorMode, DARK_PASTEL_COLORS, PASTEL_COLORS, ThemeColors } from '../types';

export type ResolvedThemeMode = 'light' | 'dark';

export const resolveThemeMode = (
  mode: ColorMode | undefined,
  systemScheme: ReturnType<typeof useColorScheme>
): ResolvedThemeMode => {
  if (mode === 'light' || mode === 'dark') {
    return mode;
  }
  return systemScheme === 'dark' ? 'dark' : 'light';
};

export const getThemeColors = (mode: ResolvedThemeMode): ThemeColors =>
  mode === 'dark' ? DARK_PASTEL_COLORS : PASTEL_COLORS;

export const useThemeColors = () => {
  const { settings } = useSettings();
  const systemScheme = useColorScheme();
  const resolvedMode = resolveThemeMode(settings.colorMode, systemScheme);

  return {
    colors: getThemeColors(resolvedMode),
    resolvedMode,
    colorMode: settings.colorMode,
  };
};

export const useReducedMotion = (): boolean => {
  const { settings } = useSettings();
  const [systemPrefersReducedMotion, setSystemPrefersReducedMotion] = useState(false);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      setSystemPrefersReducedMotion(enabled);
    });

    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', (enabled) => {
      setSystemPrefersReducedMotion(enabled);
    });

    return () => {
      subscription.remove();
    };
  }, []);

  if (settings.reducedMotionEnabled) {
    return true;
  }

  return systemPrefersReducedMotion;
};

