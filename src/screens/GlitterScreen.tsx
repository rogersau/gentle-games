import React, { useMemo, useRef, useEffect } from 'react';
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { GlitterGlobe, GlitterGlobeRef } from '../components/GlitterGlobe';
import { ThemeColors } from '../types';
import { useThemeColors } from '../utils/theme';
import { AppScreen, AppHeader, AppButton } from '../ui/components';
import { Space, TypeStyle } from '../ui/tokens';
import { useMochi } from '../hooks/useMochi';
import { useSettings } from '../context/SettingsContext';

export const GlitterScreen: React.FC = () => {
  const navigation = useNavigation();
  const { colors } = useThemeColors();
  const { t } = useTranslation();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const globeRef = useRef<GlitterGlobeRef>(null);
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();

  const { settings } = useSettings();
  const { showMochi } = useMochi();

  const lastInteractionRef = useRef(Date.now());
  const checkInShownRef = useRef(false);

  const handleInteraction = () => {
    lastInteractionRef.current = Date.now();
    checkInShownRef.current = false;
  };

  useEffect(() => {
    if (!settings.showMochiInGames) {
      return;
    }

    const interval = setInterval(() => {
      if (checkInShownRef.current) {
        return;
      }

      if (Date.now() - lastInteractionRef.current >= 15000) {
        checkInShownRef.current = true;
        const phrases = t('mascot.glitterPhrases', { returnObjects: true }) as string[];
        const phrase = phrases[Math.floor(Math.random() * phrases.length)];
        showMochi(phrase, 'happy');
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [settings.showMochiInGames, showMochi, t]);

  const globeSize = useMemo(() => {
    const maxWidth = screenWidth - 32;
    const maxHeight = screenHeight * 0.58;
    return Math.max(240, Math.min(maxWidth, maxHeight));
  }, [screenHeight, screenWidth]);

  return (
    <AppScreen>
      <AppHeader title={t('games.glitterFall.title')} onBack={() => navigation.goBack()} />

      <View style={styles.content}>
        <Text style={styles.subtitle} accessibilityRole='text'>
          {t('games.glitterFall.subtitle')}
        </Text>

        <View style={styles.globeWrap}>
          <GlitterGlobe ref={globeRef} width={globeSize} height={globeSize} onInteraction={handleInteraction} />
        </View>

        <View style={styles.controls} testID='glitter-controls'>
          <AppButton
            label={t('games.glitterFall.clearGlitter')}
            variant='secondary'
            onPress={() => globeRef.current?.clearGlitter()}
            accessibilityHint={t('games.glitterFall.clearGlitterHint')}
            testID='glitter-clear-button'
            style={{ flex: 1 }}
          />
          <AppButton
            label={t('games.glitterFall.addGlitter')}
            variant='primary'
            onPress={() => globeRef.current?.addGlitter(12)}
            accessibilityHint={t('games.glitterFall.addGlitterHint')}
            testID='glitter-add-button'
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
