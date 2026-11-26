import React, { useCallback, useMemo, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useSettings } from '../context/SettingsContext';
import { useMochi } from '../hooks/useMochi';
import { KeepyUppyBoard, KeepyUppyBoardRef } from '../components/KeepyUppyBoard';
import { KeepyUppyBounds, MAX_BALLOONS } from '../utils/keepyUppyLogic';
import { ThemeColors } from '../types';
import { useReducedMotion, useThemeColors } from '../utils/theme';
import { AppButton } from '../ui/components';
import { GameShell } from '../ui/components/GameShell';
import { Space, TypeStyle } from '../ui/tokens';
import { calculateGameBoardSize, useMeasuredGameViewport } from '../ui/gameLayout';
import { getGamePresentationPolicy } from '../utils/gamePresentationPolicy';
import { getGameSettings } from '../games/settings';

const MILESTONES = [10, 25, 50];

export const KeepyUppyScreen: React.FC = () => {
  const navigation = useNavigation();
  const { settings } = useSettings();
  const { showPressureMetrics, showMilestoneCelebrations } = getGamePresentationPolicy(settings);
  const { colors } = useThemeColors();
  const canAnimate = !useReducedMotion();
  const [paused, setPaused] = useState(false);
  const motionEnabled = canAnimate && !paused;
  const { t } = useTranslation();
  const { showMochi } = useMochi();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const boardRef = useRef<KeepyUppyBoardRef>(null);
  const { viewport, onLayout } = useMeasuredGameViewport();
  const [score, setScore] = useState(0);
  const [balloonCount, setBalloonCount] = useState(1);
  const [popped, setPopped] = useState(0);
  const lastPhraseIndexRef = useRef(-1);

  const pickPhrase = (phrases: string[], lastIndex: number): { phrase: string; index: number } => {
    let idx: number;
    do {
      idx = Math.floor(Math.random() * phrases.length);
    } while (idx === lastIndex && phrases.length > 1);
    return { phrase: phrases[idx], index: idx };
  };

  const handleScoreChange = useCallback(
    (newScore: number) => {
      setScore(newScore);
      if (MILESTONES.includes(newScore) && settings.showMochiInGames && showMilestoneCelebrations) {
        const { phrase, index } = pickPhrase(
          t('mascot.keepyUppyPhrases', { returnObjects: true }) as string[],
          lastPhraseIndexRef.current,
        );
        lastPhraseIndexRef.current = index;
        showMochi(phrase, 'happy');
      }
    },
    [settings.showMochiInGames, showMilestoneCelebrations, showMochi, t],
  );

  const bounds = useMemo<KeepyUppyBounds>(() => {
    return calculateGameBoardSize(viewport, {
      horizontalPadding: (Space.md + Space.sm) * 2 + 3,
      verticalReserve: showPressureMetrics ? 84 : 28,
      compactMinHeight: 220,
      maxHeightRatio: 0.96,
    });
  }, [viewport, showPressureMetrics]);

  const handleAddBalloon = () => {
    boardRef.current?.addBalloon();
  };

  return (
    <GameShell
      onLayout={onLayout}
      testID='keepy-uppy-screen'
      title={t('games.keepyUppy.title')}
      onHome={() => navigation.goBack()}
      prompt={t(
        !motionEnabled
          ? 'games.keepyUppy.stillSubtitle'
          : showPressureMetrics
            ? 'games.keepyUppy.subtitle'
            : 'games.keepyUppy.restSubtitle',
      )}
      actions={
        <>
          <AppButton
            icon='add'
            label={t('games.keepyUppy.addBalloon')}
            variant='secondary'
            size='sm'
            onPress={handleAddBalloon}
            disabled={balloonCount >= MAX_BALLOONS}
            disabledLabel={t('games.keepyUppy.balloonLimit')}
            accessibilityHint={t('games.keepyUppy.addBalloonHint')}
          />
          {canAnimate ? (
            <AppButton
              icon={paused ? 'play' : 'pause'}
              label={t(paused ? 'common.resume' : 'common.pause')}
              accessibilityLabel={t(paused ? 'common.resumeMovement' : 'common.pauseMovement')}
              variant='ghost'
              size='sm'
              onPress={() => setPaused((current) => !current)}
            />
          ) : null}
        </>
      }
    >
      {showPressureMetrics ? (
        <View style={styles.statsRow}>
          <Text
            style={styles.statText}
            accessibilityLabel={t('games.keepyUppy.taps', { count: score })}
          >
            {t('games.keepyUppy.taps', { count: score })}
          </Text>
          <Text
            style={styles.statText}
            accessibilityLabel={t('games.keepyUppy.balloons', { count: balloonCount })}
          >
            {t('games.keepyUppy.balloons', { count: balloonCount })}
          </Text>
          <Text
            style={styles.statText}
            accessibilityLabel={t('games.keepyUppy.popped', { count: popped })}
          >
            {t('games.keepyUppy.popped', { count: popped })}
          </Text>
        </View>
      ) : null}

      <KeepyUppyBoard
        ref={boardRef}
        bounds={bounds}
        onScoreChange={handleScoreChange}
        onBalloonCountChange={setBalloonCount}
        onPoppedChange={setPopped}
        easyMode={getGameSettings(settings, 'keepy-uppy').liftMode === 'gentle'}
        motionEnabled={motionEnabled}
        allowPopping={showPressureMetrics}
      />
    </GameShell>
  );
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    statsRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'center',
      gap: Space.md,
      marginBottom: Space.md,
    },
    statText: {
      ...TypeStyle.buttonSm,
      color: colors.text,
    },
  });
