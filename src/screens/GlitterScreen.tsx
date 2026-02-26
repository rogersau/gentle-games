import React, { useMemo, useRef } from 'react';
import { StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GlitterGlobe, GlitterGlobeRef } from '../components/GlitterGlobe';
import { PASTEL_COLORS } from '../types';

export const GlitterScreen: React.FC = () => {
  const navigation = useNavigation();
  const globeRef = useRef<GlitterGlobeRef>(null);
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();

  const globeSize = useMemo(() => {
    const maxWidth = screenWidth - 32;
    const maxHeight = screenHeight * 0.58;
    return Math.max(240, Math.min(maxWidth, maxHeight));
  }, [screenHeight, screenWidth]);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Glitter Fall</Text>
        <View style={styles.backPlaceholder} />
      </View>

      <View style={styles.content}>
        <Text style={styles.subtitle}>Tap buttons to add glitter, then shake or swirl your finger.</Text>

        <View style={styles.globeWrap}>
          <GlitterGlobe ref={globeRef} width={globeSize} height={globeSize} />
        </View>

        <View style={styles.controls}>
          <TouchableOpacity style={styles.primaryButton} onPress={() => globeRef.current?.addGlitter(12)}>
            <Text style={styles.primaryButtonText}>⭐ Sprinkle</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryButton} onPress={() => globeRef.current?.clearGlitter()}>
            <Text style={styles.secondaryButtonText}>🧹 Clear</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: PASTEL_COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: PASTEL_COLORS.cardBack,
  },
  backButton: {
    width: 40,
    padding: 8,
  },
  backButtonText: {
    fontSize: 24,
    color: PASTEL_COLORS.text,
  },
  backPlaceholder: {
    width: 40,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: PASTEL_COLORS.text,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  subtitle: {
    fontSize: 14,
    color: PASTEL_COLORS.textLight,
    textAlign: 'center',
    marginBottom: 14,
  },
  globeWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  controls: {
    width: '90%',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: PASTEL_COLORS.secondary,
    paddingVertical: 14,
    borderRadius: 24,
    alignItems: 'center',
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: PASTEL_COLORS.cardFront,
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: PASTEL_COLORS.primary,
    paddingVertical: 14,
    borderRadius: 24,
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: PASTEL_COLORS.cardFront,
  },
});
