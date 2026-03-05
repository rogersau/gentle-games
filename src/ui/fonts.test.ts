import { renderHook } from '@testing-library/react-native';
import { useFonts, FontFamily, SystemFontFamily } from './fonts';

// Mock @expo-google-fonts/nunito
const mockUseNunitoFonts = jest.fn();

jest.mock('@expo-google-fonts/nunito', () => ({
  useFonts: (...args: unknown[]) => mockUseNunitoFonts(...args),
}));

describe('fonts', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('FontFamily', () => {
    it('exports correct font family names', () => {
      expect(FontFamily.regular).toBe('Nunito_400Regular');
      expect(FontFamily.medium).toBe('Nunito_500Medium');
      expect(FontFamily.semiBold).toBe('Nunito_600SemiBold');
      expect(FontFamily.bold).toBe('Nunito_700Bold');
      expect(FontFamily.extraBold).toBe('Nunito_800ExtraBold');
    });
  });

  describe('SystemFontFamily', () => {
    it('exports undefined values for system fallback', () => {
      expect(SystemFontFamily.regular).toBeUndefined();
      expect(SystemFontFamily.medium).toBeUndefined();
      expect(SystemFontFamily.semiBold).toBeUndefined();
      expect(SystemFontFamily.bold).toBeUndefined();
      expect(SystemFontFamily.extraBold).toBeUndefined();
    });
  });

  describe('useFonts', () => {
    it('returns fonts loaded state as true when fonts load successfully', () => {
      mockUseNunitoFonts.mockReturnValue([true, null]);

      const { result } = renderHook(() => useFonts());

      expect(result.current.fontsLoaded).toBe(true);
      expect(result.current.fontError).toBeNull();
    });

    it('returns fonts loaded state as false while loading', () => {
      mockUseNunitoFonts.mockReturnValue([false, null]);

      const { result } = renderHook(() => useFonts());

      expect(result.current.fontsLoaded).toBe(false);
      expect(result.current.fontError).toBeNull();
    });

    it('returns error when font loading fails', () => {
      const mockError = new Error('Font load failed');
      mockUseNunitoFonts.mockReturnValue([false, mockError]);

      const { result } = renderHook(() => useFonts());

      expect(result.current.fontsLoaded).toBe(false);
      expect(result.current.fontError).toBe(mockError);
    });

    it('passes correct font configuration to useNunitoFonts', () => {
      mockUseNunitoFonts.mockReturnValue([true, null]);

      renderHook(() => useFonts());

      expect(mockUseNunitoFonts).toHaveBeenCalledWith({
        Nunito_400Regular: require('@expo-google-fonts/nunito/400Regular/Nunito_400Regular.ttf'),
        Nunito_500Medium: require('@expo-google-fonts/nunito/500Medium/Nunito_500Medium.ttf'),
        Nunito_600SemiBold: require('@expo-google-fonts/nunito/600SemiBold/Nunito_600SemiBold.ttf'),
        Nunito_700Bold: require('@expo-google-fonts/nunito/700Bold/Nunito_700Bold.ttf'),
        Nunito_800ExtraBold: require('@expo-google-fonts/nunito/800ExtraBold/Nunito_800ExtraBold.ttf'),
      });
    });
  });
});
