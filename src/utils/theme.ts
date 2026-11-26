import { useColorScheme, AccessibilityInfo } from 'react-native';
import { createContext, createElement, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { useSettings } from '../context/SettingsContext';
import { ColorMode, DARK_PASTEL_COLORS, PASTEL_COLORS, ThemeColors } from '../types';

export type ResolvedThemeMode = 'light' | 'dark';

export const resolveThemeMode = (
  mode: ColorMode | undefined,
  systemScheme: ReturnType<typeof useColorScheme>,
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

const SystemMotionContext = createContext<boolean | undefined>(undefined);

const useObservedSystemMotion = (initialValue: boolean, observe = true) => {
  const [systemPrefersReducedMotion, setSystemPrefersReducedMotion] = useState(initialValue);

  useEffect(() => {
    if (!observe) return;
    let active = true;
    let receivedChange = false;
    Promise.resolve(AccessibilityInfo.isReduceMotionEnabled())
      .then((enabled) => {
        if (active && !receivedChange) setSystemPrefersReducedMotion(enabled === true);
      })
      .catch((error: unknown) => {
        console.warn('Unable to read system reduced motion preference.', error);
      });

    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', (enabled) => {
      receivedChange = true;
      setSystemPrefersReducedMotion(enabled === true);
    });

    return () => {
      active = false;
      subscription?.remove();
    };
  }, [observe]);

  return systemPrefersReducedMotion;
};

/** Share the device preference throughout the app and stay still until the first read. */
export const SystemMotionProvider = ({ children }: { children: ReactNode }) => {
  const reducedMotion = useObservedSystemMotion(true);
  return createElement(SystemMotionContext.Provider, { value: reducedMotion }, children);
};

export const useSystemReducedMotion = (): boolean => {
  const sharedPreference = useContext(SystemMotionContext);
  const localPreference = useObservedSystemMotion(false, sharedPreference === undefined);
  return sharedPreference ?? localPreference;
};

export const useReducedMotion = (): boolean => {
  const { settings } = useSettings();
  const systemPrefersReducedMotion = useSystemReducedMotion();
  return settings.movement === 'still' || systemPrefersReducedMotion;
};
