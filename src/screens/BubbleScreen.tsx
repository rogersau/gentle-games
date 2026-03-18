import React, { useCallback, useMemo, useRef, useState } from 'react';
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { BubbleField } from '../components/BubbleField';
import { ThemeColors } from '../types';
import { useSettings } from '../context/SettingsContext';
import { useMochi } from '../hooks/useMochi';
import { playBubblePopSound } from '../utils/sounds';
import { useThemeColors } from '../utils/theme';
import { AppScreen, AppHeader } from '../ui/components';
import { Space, TypeStyle } from '../ui/tokens';

export const BubbleScreen: React.FC = () => {
  const navigation = useNavigation();
  const { settings } = useSettings();
  const { colors } = useThemeColors();
  const { t } = useTranslation();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [poppedCount, setPoppedCount] = useState(0);
  const popCountRef = useRef(0);
  const lastPhraseIndexRef = useRef(-1);
  const { showMochi } = useMochi();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();

  const boardSize = useMemo(() => {
    const width = Math.max(260, screenWidth - 24);
    const height = Math.max(320, Math.min(screenHeight * 0.72, screenHeight - 220));
    return { width, height };
  }, [screenHeight, screenWidth]);

  const pickPhrase = (phrases: string[], lastIndex: number): { phrase: string; index: number } => {
    let idx: number;
    do {
      idx = Math.floor(Math.random() * phrases.length);
    } while (idx === lastIndex && phrases.length > 1);
    return { phrase: phrases[idx], index: idx };
  };

  const handleBubblePop = useCallback(() => {
    setPoppedCount((count) => count + 1);
    popCountRef.current += 1;
    const MILESTONES = [10, 25, 50];
    if (MILESTONES.includes(popCountRef.current) && settings.showMochiInGames) {
      const { phrase, index } = pickPhrase(
        t('mascot.bubblePhrases', { returnObjects: true }) as string[],
        lastPhraseIndexRef.current,
      );
      lastPhraseIndexRef.current = index;
      showMochi(phrase, 'happy');
    }
    void playBubblePopSound(settings);
  }, [settings, showMochi, t]);

  return (
    <AppScreen>
      <AppHeader title={t('games.bubblePop.title')} onBack={() => navigation.goBack()} />

      <View style={styles.content}>
        <Text style={styles.subtitle} accessibilityRole='text'>
          {t('games.bubblePop.subtitle')}
        </Text>
        <Text
          style={styles.counter}
          accessibilityLabel={t('games.bubblePop.popped', { count: poppedCount })}
        >
          {t('games.bubblePop.popped', { count: poppedCount })}
        </Text>

        <View style={styles.boardWrap}>
          <BubbleField
            width={boardSize.width}
            height={boardSize.height}
            minActiveBubbles={2}
            maxActiveBubbles={12}
            onBubblePop={handleBubblePop}
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
      paddingHorizontal: Space.md,
      paddingTop: Space.base,
      paddingBottom: Space.md,
    },
    subtitle: {
      ...TypeStyle.bodySm,
      color: colors.textLight,
      textAlign: 'center',
      marginBottom: Space.sm,
    },
    counter: {
      ...TypeStyle.label,
      color: colors.text,
      marginBottom: Space.md,
    },
    boardWrap: {
      alignItems: 'center',
      justifyContent: 'center',
    },
  });
