import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AppState, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { BreathingBall, BreathingBallRef, defaultColorSchemes } from '../components/BreathingBall';
import { Mochi } from '../components/Mochi';
import { useThemeColors } from '../utils/theme';
import { useBackgroundMusic } from '../utils/music';
import { useSettings } from '../context/SettingsContext';
import { AppScreen, GameHeader, AppButton, AppCard, SegmentedControl } from '../ui/components';
import { Space, TypeStyle } from '../ui/tokens';
import { useAnimationEnabled } from '../ui/animations';
import { BreathingSessionLength, getGameSettings } from '../games/settings';
import type { ThemeColors } from '../types';

type Activity =
  | { mode: 'opening' | 'normal' | 'complete' }
  | { mode: 'watching' | 'active'; paused: boolean };

const MAX_BALL_SIZE = 250;
const SESSION_OPTIONS: BreathingSessionLength[] = [3, 5, 10, 'open-ended'];

export const BreathingGardenScreen: React.FC = () => {
  const navigation = useNavigation();
  const { width: windowWidth } = useWindowDimensions();
  const { colors } = useThemeColors();
  const { settings, updateGameSettings } = useSettings();
  const breathingSettings = getGameSettings(settings, 'breathing-garden');
  const motionEnabled = useAnimationEnabled();
  const { t } = useTranslation();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [colorIndex, setColorIndex] = useState(0);
  const [activity, setActivity] = useState<Activity>({ mode: 'opening' });
  const activityRef = useRef(activity);
  const [phase, setPhase] = useState<'inhale' | 'exhale'>('inhale');
  const [progress, setProgress] = useState(0);
  const [completedBreaths, setCompletedBreaths] = useState(0);
  const ballRef = useRef<BreathingBallRef>(null);
  const { isPlaying, toggleMusic, stopMusic } = useBackgroundMusic();
  const { sessionLength, visualCue } = breathingSettings;
  const { mode } = activity;
  const isPaced = 'paused' in activity;
  const paused = isPaced && activity.paused;
  const ballSize = Math.max(1, Math.min(MAX_BALL_SIZE, windowWidth - Space.lg * 4));
  const colorScheme = defaultColorSchemes[colorIndex];

  const changeActivity = useCallback((next: Activity) => {
    activityRef.current = next;
    setActivity(next);
  }, []);

  const pause = useCallback(() => {
    const current = activityRef.current;
    if ('paused' in current && !current.paused) {
      ballRef.current?.pause();
      changeActivity({ ...current, paused: true });
    }
    stopMusic();
  }, [changeActivity, stopMusic]);

  useFocusEffect(useCallback(() => pause, [pause]));

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state !== 'active') pause();
    });
    return () => subscription.remove();
  }, [pause]);

  const begin = (nextMode: 'active' | 'watching') => {
    setCompletedBreaths(0);
    setPhase('inhale');
    setProgress(0);
    changeActivity({ mode: nextMode, paused: false });
  };

  const finishActivity = useCallback(
    (nextMode: 'opening' | 'complete') => {
      ballRef.current?.pause();
      stopMusic();
      changeActivity({ mode: nextMode });
    },
    [changeActivity, stopMusic],
  );

  const handleCycleComplete = useCallback(
    (count: number) => {
      const currentMode = activityRef.current.mode;
      if (currentMode === 'watching') {
        finishActivity('opening');
      } else if (currentMode === 'active' && sessionLength !== 'open-ended') {
        if (count >= sessionLength) {
          finishActivity('complete');
        } else {
          setCompletedBreaths(count);
        }
      }
    },
    [finishActivity, sessionLength],
  );

  const handleBack = () => {
    pause();
    navigation.goBack();
  };

  const sessionOptions = SESSION_OPTIONS.map((value) => ({
    value,
    label:
      value === 'open-ended'
        ? t('games.breathingGarden.session.openEnded')
        : t('games.breathingGarden.session.breaths', { count: value }),
  }));

  const visualControl = (
    <AppButton
      label={t(visualCue ? 'games.breathingGarden.visualOff' : 'games.breathingGarden.visualOn')}
      accessibilityLabel={t('games.breathingGarden.visualLabel')}
      accessibilityRole='switch'
      accessibilityState={{ checked: visualCue }}
      aria-checked={visualCue}
      onPress={() => updateGameSettings('breathing-garden', { visualCue: !visualCue })}
      variant='ghost'
      size='sm'
      testID='breathing-visual-cue'
    />
  );

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
          icon='play'
          label={t('games.breathingGarden.start')}
          onPress={() => begin('active')}
          fullWidth
          testID='breathing-start'
        />
        <AppButton
          icon='eye'
          label={t('games.breathingGarden.watchFirst')}
          onPress={() => begin('watching')}
          variant='secondary'
          fullWidth
          testID='breathing-watch-first'
        />
        <AppButton
          label={t('games.breathingGarden.breatheNormally')}
          onPress={() => changeActivity({ mode: 'normal' })}
          variant='ghost'
          fullWidth
          testID='breathing-normal'
        />
        {visualControl}
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
    if (sessionLength === 'open-ended' || mode !== 'active') return null;
    return (
      <View
        style={styles.progressDots}
        accessible
        accessibilityRole='progressbar'
        accessibilityLabel={t('games.breathingGarden.sessionProgress')}
        accessibilityValue={{ min: 0, max: sessionLength, now: completedBreaths }}
      >
        {Array.from({ length: sessionLength }, (_, index) => (
          <View
            key={index}
            testID={`breathing-session-dot-${index}`}
            style={[
              styles.progressDot,
              { borderColor: colors.textLight },
              index < completedBreaths && { backgroundColor: colors.textLight },
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
        <View aria-live='polite'>
          <Text style={styles.phaseLabel}>
            {paused
              ? t('games.breathingGarden.paused')
              : t(
                  phase === 'inhale'
                    ? 'games.breathingGarden.inhale'
                    : 'games.breathingGarden.exhale',
                )}
          </Text>
        </View>
        <View
          style={[
            styles.ballContainer,
            { width: ballSize, height: ballSize },
            !visualCue && styles.hiddenCue,
          ]}
          pointerEvents='none'
          aria-hidden
          accessibilityElementsHidden
          importantForAccessibility='no-hide-descendants'
          testID={visualCue ? 'breathing-ball' : undefined}
        >
          <BreathingBall
            ref={ballRef}
            size={ballSize}
            baseSize={Math.min(120, ballSize * 0.5)}
            expandSize={Math.min(210, ballSize * 0.84)}
            colorScheme={colorScheme}
            autoStart
            reducedMotion={!motionEnabled}
            showVisual={visualCue}
            onPhaseChange={setPhase}
            onCycleComplete={handleCycleComplete}
            onProgress={
              visualCue && (!motionEnabled || settings.showMochiInGames) ? setProgress : undefined
            }
            showCycleCount={false}
          />
          {visualCue && settings.showMochiInGames ? (
            <View style={styles.breathingMochi} pointerEvents='none'>
              <Mochi
                size='md'
                breathingPhase={motionEnabled ? phase : null}
                breathingProgress={progress}
                animate={motionEnabled}
                color={colorScheme.primary}
                highlightColor={colorScheme.accent}
                shadowColor={colorScheme.accent}
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
                  { borderColor: colors.textLight },
                  progress >= threshold && { backgroundColor: colors.textLight },
                ]}
              />
            ))}
          </View>
        ) : null}
        {renderProgressDots()}
      </AppCard>
    );
  };

  const renderSessionControls = () => (
    <View style={styles.sessionControls} testID='breathing-session-controls'>
      {isPaced ? (
        <AppButton
          icon={paused ? 'play' : 'pause'}
          label={t(paused ? 'games.breathingGarden.resume' : 'games.breathingGarden.pause')}
          onPress={() => {
            if (paused) {
              ballRef.current?.resume();
              changeActivity({ ...activity, paused: false });
            } else {
              pause();
            }
          }}
          variant='secondary'
          size='sm'
          testID={paused ? 'breathing-resume' : 'breathing-pause'}
        />
      ) : null}
      <AppButton
        icon='stop'
        label={t(
          mode === 'watching' ? 'games.breathingGarden.stopWatching' : 'games.breathingGarden.stop',
        )}
        onPress={() => finishActivity(mode === 'watching' ? 'opening' : 'complete')}
        variant='ghost'
        size='sm'
        testID='breathing-stop'
      />
    </View>
  );

  const renderPreferences = () => (
    <View style={styles.preferences}>
      <AppButton
        label={isPlaying ? t('games.breathingGarden.musicOff') : t('games.breathingGarden.musicOn')}
        onPress={toggleMusic}
        variant='ghost'
        size='sm'
        disabled={!settings.soundEnabled}
        testID='breathing-music'
      />
      {isPaced ? visualControl : null}
      {isPaced && visualCue ? (
        <AppButton
          label={t('games.breathingGarden.changeColor')}
          onPress={() => setColorIndex((current) => (current + 1) % defaultColorSchemes.length)}
          variant='ghost'
          size='sm'
        />
      ) : null}
    </View>
  );

  const inActivity = isPaced || mode === 'normal';
  return (
    <AppScreen
      scroll
      testID='breathing-garden-screen'
      header={
        <>
          <GameHeader title={t('games.breathingGarden.title')} onBack={handleBack} />
          {inActivity ? renderSessionControls() : null}
        </>
      }
    >
      <View style={styles.content}>
        {mode === 'opening' ? renderOpening() : null}
        {mode === 'complete' ? (
          <AppCard variant='elevated' style={styles.openingCard} testID='breathing-complete'>
            <Text style={styles.guidance}>{t('games.breathingGarden.finished')}</Text>
            <AppButton
              label={t('games.breathingGarden.startAgain')}
              onPress={() => changeActivity({ mode: 'opening' })}
              fullWidth
            />
            <AppButton
              label={t('games.breathingGarden.exit')}
              onPress={handleBack}
              variant='ghost'
            />
          </AppCard>
        ) : null}
        {inActivity ? renderActivity() : null}
        {inActivity ? renderPreferences() : null}
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
    hiddenCue: { display: 'none' },
    sessionControls: {
      alignSelf: 'center',
      width: '100%',
      maxWidth: 620,
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'center',
      paddingHorizontal: Space.sm,
      paddingTop: Space.sm,
      gap: Space.sm,
    },
    preferences: {
      width: '100%',
      maxWidth: 620,
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'center',
      gap: Space.sm,
    },
    progressDots: {
      flexDirection: 'row',
      justifyContent: 'center',
      flexWrap: 'wrap',
      gap: Space.sm,
    },
    progressDot: { width: 14, height: 14, borderRadius: 7, borderWidth: 2 },
    phaseDots: { flexDirection: 'row', gap: Space.xs },
    phaseDot: { width: 10, height: 10, borderRadius: 5, borderWidth: 1 },
  });
