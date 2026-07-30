import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AppState, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { BreathingBall, BreathingBallRef, BallColorScheme } from '../components/BreathingBall';
import { Mochi } from '../components/Mochi';
import { useThemeColors } from '../utils/theme';
import { useBackgroundMusic } from '../utils/music';
import { useSettings } from '../context/SettingsContext';
import { AppScreen, AppHeader, AppButton, AppCard, SegmentedControl } from '../ui/components';
import { Space, TypeStyle } from '../ui/tokens';
import { useAnimationEnabled } from '../ui/animations';
import { BreathingSessionLength, getGameSettings } from '../games/settings';
import type { ThemeColors } from '../types';

type ActivityMode = 'opening' | 'watching' | 'active' | 'paused' | 'normal' | 'complete';

const MAX_BALL_SIZE = 250;
const SESSION_OPTIONS: BreathingSessionLength[] = [3, 5, 10, 'open-ended'];

const getColorSchemes = (): BallColorScheme[] => [
  { primary: '#B4D7E8', accent: '#7FB3D5', name: 'Ocean' },
  { primary: '#F5C6D6', accent: '#E8A4C9', name: 'Rose' },
  { primary: '#C8E6C9', accent: '#A5D6A7', name: 'Mint' },
  { primary: '#FFE0B2', accent: '#FFCC80', name: 'Sunset' },
  { primary: '#E1BEE7', accent: '#CE93D8', name: 'Lavender' },
];

export const BreathingGardenScreen: React.FC = () => {
  const navigation = useNavigation();
  const { width: windowWidth } = useWindowDimensions();
  const { colors } = useThemeColors();
  const { settings, updateSettings, updateGameSettings } = useSettings();
  const breathingSettings = getGameSettings(settings, 'breathing-garden');
  const motionEnabled = useAnimationEnabled();
  const { t } = useTranslation();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const colorSchemes = useMemo(() => getColorSchemes(), []);
  const [colorIndex, setColorIndex] = useState(0);
  const [mode, setMode] = useState<ActivityMode>('opening');
  const [phase, setPhase] = useState<'inhale' | 'exhale'>('inhale');
  const [progress, setProgress] = useState(0);
  const [completedBreaths, setCompletedBreaths] = useState(0);
  const ballRef = useRef<BreathingBallRef>(null);
  const modeRef = useRef(mode);
  const pausedActivityRef = useRef<'active' | 'watching'>('active');
  const { isPlaying, toggleMusic, stopMusic } = useBackgroundMusic();
  const sessionLength = breathingSettings.sessionLength;
  const visualCue = breathingSettings.visualCue;
  const ballSize = Math.min(MAX_BALL_SIZE, Math.max(160, windowWidth - Space.lg * 4));

  modeRef.current = mode;

  const pauseForInterruption = useCallback(() => {
    ballRef.current?.pause();
    stopMusic();
    setMode((current) => {
      if (current === 'active' || current === 'watching') {
        pausedActivityRef.current = current;
        return 'paused';
      }
      return current;
    });
  }, [stopMusic]);

  useFocusEffect(
    useCallback(() => {
      return pauseForInterruption;
    }, [pauseForInterruption]),
  );

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state !== 'active') pauseForInterruption();
    });
    return () => subscription.remove();
  }, [pauseForInterruption]);

  useEffect(
    () => () => {
      ballRef.current?.pause();
      stopMusic();
    },
    [stopMusic],
  );

  const begin = (nextMode: 'active' | 'watching') => {
    setCompletedBreaths(0);
    setPhase('inhale');
    setProgress(0);
    setMode(nextMode);
  };

  const stop = () => {
    ballRef.current?.pause();
    stopMusic();
    setMode('complete');
  };

  const handleCycleComplete = () => {
    if (modeRef.current === 'watching') {
      ballRef.current?.pause();
      setMode('opening');
      return;
    }
    if (modeRef.current !== 'active') return;

    setCompletedBreaths((current) => {
      const next = current + 1;
      if (sessionLength !== 'open-ended' && next >= sessionLength) {
        ballRef.current?.pause();
        stopMusic();
        setMode('complete');
      }
      return next;
    });
  };

  const resume = () => {
    ballRef.current?.resume();
    setMode(pausedActivityRef.current);
  };

  const handleBack = () => {
    ballRef.current?.pause();
    stopMusic();
    navigation.goBack();
  };

  const sessionOptions = SESSION_OPTIONS.map((value) => ({
    value,
    label:
      value === 'open-ended'
        ? t('games.breathingGarden.session.openEnded')
        : t('games.breathingGarden.session.breaths', { count: value }),
  }));

  const renderOpening = () => (
    <AppCard variant='elevated' style={styles.openingCard}>
      <Text style={styles.guidance}>{t('games.breathingGarden.comfortMessage')}</Text>
      <Text style={styles.sectionLabel}>{t('games.breathingGarden.session.title')}</Text>
      <SegmentedControl
        options={sessionOptions}
        value={sessionLength}
        onValueChange={(value) => updateGameSettings('breathing-garden', { sessionLength: value })}
        wrap
      />
      <View style={styles.openingActions}>
        <AppButton
          label={t('games.breathingGarden.start')}
          onPress={() => begin('active')}
          fullWidth
          testID='breathing-start'
        />
        <AppButton
          label={t('games.breathingGarden.watchFirst')}
          onPress={() => begin('watching')}
          variant='secondary'
          fullWidth
          testID='breathing-watch-first'
        />
        <AppButton
          label={t('games.breathingGarden.breatheNormally')}
          onPress={() => setMode('normal')}
          variant='ghost'
          fullWidth
          testID='breathing-normal'
        />
        <AppButton
          label={t('games.breathingGarden.exit')}
          onPress={handleBack}
          variant='ghost'
          fullWidth
          testID='breathing-exit'
        />
      </View>
    </AppCard>
  );

  const renderProgressDots = () => {
    if (sessionLength === 'open-ended' || mode === 'watching') return null;
    return (
      <View
        style={styles.progressDots}
        accessibilityLabel={t('games.breathingGarden.sessionProgress')}
      >
        {Array.from({ length: sessionLength }, (_, index) => (
          <View
            key={index}
            testID={`breathing-session-dot-${index}`}
            style={[
              styles.progressDot,
              { borderColor: colors.primary },
              index < completedBreaths && { backgroundColor: colors.primary },
            ]}
          />
        ))}
      </View>
    );
  };

  const renderActivity = () => {
    if (mode === 'normal') {
      return (
        <AppCard variant='elevated' style={styles.breathCard} testID='breathing-normal-state'>
          <Text style={styles.guidance}>{t('games.breathingGarden.normalMessage')}</Text>
        </AppCard>
      );
    }

    return (
      <AppCard variant='elevated' style={styles.breathCard}>
        {mode === 'watching' ? (
          <Text style={styles.watchLabel}>{t('games.breathingGarden.watching')}</Text>
        ) : null}
        <Text style={styles.phaseLabel} accessibilityLiveRegion='polite'>
          {visualCue
            ? phase === 'inhale'
              ? t('games.breathingGarden.inhale')
              : t('games.breathingGarden.exhale')
            : t('games.breathingGarden.cueOffMessage')}
        </Text>
        <View
          style={[
            styles.ballContainer,
            { width: ballSize, height: ballSize },
            !visualCue && styles.hiddenCue,
          ]}
          accessibilityElementsHidden={!visualCue}
          importantForAccessibility={visualCue ? 'auto' : 'no-hide-descendants'}
        >
          <BreathingBall
            key={mode === 'watching' ? 'watching' : 'session'}
            ref={ballRef}
            size={ballSize}
            baseSize={Math.min(120, ballSize * 0.5)}
            expandSize={Math.min(210, ballSize * 0.84)}
            colorScheme={colorSchemes[colorIndex]}
            autoStart={mode === 'watching' || mode === 'active'}
            reducedMotion={!motionEnabled}
            onPhaseChange={setPhase}
            onCycleComplete={handleCycleComplete}
            onProgress={setProgress}
            showCycleCount={false}
          />
          {settings.showMochiInGames ? (
            <View style={styles.breathingMochi} pointerEvents='none'>
              <Mochi
                size='md'
                breathingPhase={phase}
                breathingProgress={progress}
                animate={motionEnabled}
                color={colorSchemes[colorIndex].primary}
                highlightColor={colorSchemes[colorIndex].accent}
                shadowColor={colorSchemes[colorIndex].accent}
              />
            </View>
          ) : null}
        </View>
        {!motionEnabled && visualCue ? (
          <View style={styles.phaseDots} testID='breathing-static-progress'>
            {[0.25, 0.5, 0.75, 1].map((threshold) => (
              <View
                key={threshold}
                style={[
                  styles.phaseDot,
                  { borderColor: colors.accent },
                  progress >= threshold && { backgroundColor: colors.accent },
                ]}
              />
            ))}
          </View>
        ) : null}
        {renderProgressDots()}
      </AppCard>
    );
  };

  const renderControls = () => (
    <View style={styles.controls}>
      {mode === 'active' || mode === 'watching' ? (
        <AppButton
          label={t('games.breathingGarden.pause')}
          onPress={() => {
            ballRef.current?.pause();
            pausedActivityRef.current = mode;
            setMode('paused');
          }}
          variant='secondary'
          testID='breathing-pause'
        />
      ) : mode === 'paused' ? (
        <AppButton
          label={t('games.breathingGarden.resume')}
          onPress={resume}
          variant='secondary'
          testID='breathing-resume'
        />
      ) : null}
      <AppButton
        label={t('games.breathingGarden.stop')}
        onPress={stop}
        variant='ghost'
        testID='breathing-stop'
      />
      <AppButton
        label={
          settings.soundEnabled
            ? t('games.breathingGarden.soundOff')
            : t('games.breathingGarden.soundOn')
        }
        onPress={() => updateSettings({ soundEnabled: !settings.soundEnabled })}
        variant='ghost'
        testID='breathing-sound'
      />
      <AppButton
        label={isPlaying ? t('games.breathingGarden.musicOff') : t('games.breathingGarden.musicOn')}
        onPress={toggleMusic}
        variant='ghost'
        disabled={!settings.soundEnabled}
        testID='breathing-music'
      />
      <AppButton
        label={
          visualCue ? t('games.breathingGarden.visualOff') : t('games.breathingGarden.visualOn')
        }
        onPress={() => updateGameSettings('breathing-garden', { visualCue: !visualCue })}
        variant='ghost'
        testID='breathing-visual-cue'
      />
      <AppButton
        label={t('games.breathingGarden.changeColor')}
        onPress={() => setColorIndex((current) => (current + 1) % colorSchemes.length)}
        variant='ghost'
      />
    </View>
  );

  return (
    <AppScreen scroll testID='breathing-garden-screen'>
      <AppHeader title={t('games.breathingGarden.title')} onBack={handleBack} />
      <View style={styles.content}>
        {mode === 'opening' ? renderOpening() : null}
        {mode === 'complete' ? (
          <AppCard variant='elevated' style={styles.openingCard} testID='breathing-complete'>
            <Text style={styles.guidance}>{t('games.breathingGarden.finished')}</Text>
            <AppButton
              label={t('games.breathingGarden.startAgain')}
              onPress={() => setMode('opening')}
              fullWidth
            />
            <AppButton
              label={t('games.breathingGarden.exit')}
              onPress={handleBack}
              variant='ghost'
            />
          </AppCard>
        ) : null}
        {mode !== 'opening' && mode !== 'complete' ? renderActivity() : null}
        {mode !== 'opening' && mode !== 'complete' ? renderControls() : null}
      </View>
    </AppScreen>
  );
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    content: {
      flex: 1,
      alignItems: 'center',
      paddingHorizontal: Space.lg,
      paddingVertical: Space.base,
      gap: Space.base,
    },
    openingCard: { width: '100%', maxWidth: 620, gap: Space.base },
    guidance: { ...TypeStyle.body, color: colors.text, textAlign: 'center' },
    sectionLabel: { ...TypeStyle.label, color: colors.text, textAlign: 'center' },
    openingActions: { width: '100%', gap: Space.sm },
    breathCard: {
      width: '100%',
      maxWidth: 620,
      minHeight: 360,
      alignItems: 'center',
      justifyContent: 'center',
      gap: Space.base,
    },
    phaseLabel: { ...TypeStyle.h3, color: colors.text, textAlign: 'center' },
    watchLabel: { ...TypeStyle.label, color: colors.textLight, textAlign: 'center' },
    ballContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
    },
    breathingMochi: { position: 'absolute', right: 0, bottom: 0 },
    hiddenCue: { opacity: 0, height: 1, overflow: 'hidden' },
    controls: {
      width: '100%',
      maxWidth: 620,
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'center',
      gap: Space.sm,
    },
    progressDots: { flexDirection: 'row', gap: Space.sm },
    progressDot: { width: 14, height: 14, borderRadius: 7, borderWidth: 2 },
    phaseDots: { flexDirection: 'row', gap: Space.xs },
    phaseDot: { width: 10, height: 10, borderRadius: 5, borderWidth: 1 },
  });
