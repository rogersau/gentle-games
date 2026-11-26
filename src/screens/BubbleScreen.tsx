import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { BubbleField } from '../components/BubbleField';
import { ThemeColors } from '../types';
import { useSettings } from '../context/SettingsContext';
import { useMochi } from '../hooks/useMochi';
import { playBubblePopSound } from '../utils/sounds';
import { useReducedMotion, useThemeColors } from '../utils/theme';
import { AppButton } from '../ui/components';
import { GameShell } from '../ui/components/GameShell';
import { Space, TypeStyle } from '../ui/tokens';
import { calculateGameBoardSize, useMeasuredGameViewport } from '../ui/gameLayout';
import { getGamePresentationPolicy } from '../utils/gamePresentationPolicy';
import { getGameSettings } from '../games/settings';

const MILESTONES = [10, 25, 50];

export const BubbleScreen: React.FC = () => {
  const navigation = useNavigation();
  const [isFocused, setIsFocused] = useState(() => navigation.isFocused?.() ?? true);
  useEffect(() => {
    const focusSubscription = navigation.addListener?.('focus', () => setIsFocused(true));
    const blurSubscription = navigation.addListener?.('blur', () => setIsFocused(false));
    return () => {
      focusSubscription?.();
      blurSubscription?.();
    };
  }, [navigation]);
  const { settings } = useSettings();
  const { colors } = useThemeColors();
  const { showPressureMetrics, showMilestoneCelebrations } = getGamePresentationPolicy(settings);
  const { t } = useTranslation();
  const motionEnabled = !useReducedMotion();
  const bubbleSettings = getGameSettings(settings, 'bubble-pop');
  const [stillBubbles, setStillBubbles] = useState(bubbleSettings.motion === 'still');
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [poppedCount, setPoppedCount] = useState(0);
  const popCountRef = useRef(0);
  const lastPhraseIndexRef = useRef(-1);
  const { showMochi } = useMochi();
  const { viewport, onLayout } = useMeasuredGameViewport();

  const boardSize = useMemo(() => {
    return calculateGameBoardSize(viewport, {
      horizontalPadding: (Space.md + Space.sm) * 2 + 3,
      verticalReserve: showPressureMetrics ? 68 : 28,
      compactMinHeight: 220,
      maxHeightRatio: 0.96,
    });
  }, [viewport, showPressureMetrics]);

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
    if (
      MILESTONES.includes(popCountRef.current) &&
      settings.showMochiInGames &&
      showMilestoneCelebrations
    ) {
      const { phrase, index } = pickPhrase(
        t('mascot.bubblePhrases', { returnObjects: true }) as string[],
        lastPhraseIndexRef.current,
      );
      lastPhraseIndexRef.current = index;
      showMochi(phrase, 'happy');
    }
    void playBubblePopSound(settings);
  }, [settings, showMilestoneCelebrations, showMochi, t]);

  return (
    <GameShell
      onLayout={onLayout}
      testID='bubble-screen'
      title={t('games.bubblePop.title')}
      prompt={t('games.bubblePop.subtitle')}
      onHome={() => navigation.goBack()}
      actions={
        motionEnabled ? (
          <AppButton
            icon={stillBubbles ? 'play' : 'pause'}
            label={t(
              stillBubbles ? 'games.bubblePop.movingBubbles' : 'games.bubblePop.stillBubbles',
            )}
            variant='ghost'
            size='sm'
            testID='bubble-motion-toggle'
            onPress={() => setStillBubbles((current) => !current)}
          />
        ) : null
      }
    >
      {showPressureMetrics ? (
        <Text
          style={styles.counter}
          accessibilityLabel={t('games.bubblePop.popped', {
            count: poppedCount,
          })}
        >
          {t('games.bubblePop.popped', { count: poppedCount })}
        </Text>
      ) : null}

      <View style={styles.boardWrap}>
        <BubbleField
          width={boardSize.width}
          height={boardSize.height}
          minActiveBubbles={bubbleSettings.density === 'sparse' ? 1 : 2}
          maxActiveBubbles={bubbleSettings.density === 'sparse' ? 4 : 12}
          onBubblePop={handleBubblePop}
          motionEnabled={motionEnabled && !stillBubbles}
          showModeToggle={false}
          isFocused={isFocused}
        />
      </View>
    </GameShell>
  );
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
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
