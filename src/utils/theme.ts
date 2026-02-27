import { useColorScheme } from 'react-native';
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

