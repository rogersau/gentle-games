import React, { useMemo, useRef } from 'react';
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { GlitterGlobe, GlitterGlobeRef } from '../components/GlitterGlobe';
import { ThemeColors } from '../types';
import { useThemeColors } from '../utils/theme';
import { AppScreen, AppHeader, AppButton } from '../ui/components';
import { Space, TypeStyle } from '../ui/tokens';

export const GlitterScreen: React.FC = () => {
  const navigation = useNavigation();
  const { colors } = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const globeRef = useRef<GlitterGlobeRef>(null);
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();

  const globeSize = useMemo(() => {
    const maxWidth = screenWidth - 32;
    const maxHeight = screenHeight * 0.58;
    return Math.max(240, Math.min(maxWidth, maxHeight));
  }, [screenHeight, screenWidth]);

  return (
    <AppScreen>
      <AppHeader title="Glitter Fall" onBack={() => navigation.goBack()} />

      <View style={styles.content}>
        <Text style={styles.subtitle} accessibilityRole="text">
          Tap buttons to add glitter, then shake or swirl your finger.
        </Text>

        <View style={styles.globeWrap}>
          <GlitterGlobe ref={globeRef} width={globeSize} height={globeSize} />
        </View>

        <View style={styles.controls}>
          <AppButton
            label="⭐ Sprinkle"
            variant="secondary"
            onPress={() => globeRef.current?.addGlitter(12)}
            accessibilityHint="Add glitter particles to the globe"
            style={{ flex: 1 }}
          />
          <AppButton
            label="🧹 Clear"
            variant="primary"
            onPress={() => globeRef.current?.clearGlitter()}
            accessibilityHint="Remove all glitter from the globe"
            style={{ flex: 1 }}
          />
        </View>
      </View>
    </AppScreen>
  );
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    content: {
      flex: 1,
      alignItems: 'center',
      paddingHorizontal: Space.base,
      paddingTop: Space.base,
      paddingBottom: Space.md,
    },
    subtitle: {
      ...TypeStyle.bodySm,
      color: colors.textLight,
      textAlign: 'center',
      marginBottom: Space.md,
    },
    globeWrap: {
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: Space.lg,
    },
    controls: {
      width: '90%',
      flexDirection: 'row',
      justifyContent: 'center',
      gap: Space.sm,
    },
  });
