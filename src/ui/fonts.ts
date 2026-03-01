import { useFonts as useNunitoFonts } from '@expo-google-fonts/nunito';

export const FontFamily = {
  regular: 'Nunito_400Regular',
  medium: 'Nunito_500Medium',
  semiBold: 'Nunito_600SemiBold',
  bold: 'Nunito_700Bold',
  extraBold: 'Nunito_800ExtraBold',
} as const;

// Fallback for when fonts haven't loaded yet
export const SystemFontFamily = {
  regular: undefined,
  medium: undefined,
  semiBold: undefined,
  bold: undefined,
  extraBold: undefined,
} as const;

export const useFonts = () => {
  const [fontsLoaded, fontError] = useNunitoFonts({
    Nunito_400Regular: require('@expo-google-fonts/nunito/400Regular/Nunito_400Regular.ttf'),
    Nunito_500Medium: require('@expo-google-fonts/nunito/500Medium/Nunito_500Medium.ttf'),
    Nunito_600SemiBold: require('@expo-google-fonts/nunito/600SemiBold/Nunito_600SemiBold.ttf'),
    Nunito_700Bold: require('@expo-google-fonts/nunito/700Bold/Nunito_700Bold.ttf'),
    Nunito_800ExtraBold: require('@expo-google-fonts/nunito/800ExtraBold/Nunito_800ExtraBold.ttf'),
  });

  return { fontsLoaded, fontError };
};
