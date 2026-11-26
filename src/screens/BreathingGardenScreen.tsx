import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { BreathingBall, BreathingBallRef, defaultColorSchemes } from '../components/BreathingBall';
import { Mochi } from '../components/Mochi';
import { useReducedMotion, useThemeColors } from '../utils/theme';
import { useBackgroundMusic } from '../utils/music';
import { useSettings } from '../context/SettingsContext';
import { AppModal, AppButton, SegmentedControl } from '../ui/components';
import { Space, TypeStyle } from '../ui/tokens';
import { GameShell, GameCompletion } from '../ui/components/GameShell';
import { GameArtwork } from '../ui/components/GameArtwork';
import { BreathingSessionLength, getGameSettings } from '../games/settings';

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
  const motionEnabled = !useReducedMotion();
  const { t } = useTranslation();
  const [choosingLength, setChoosingLength] = useState(false);
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

  const phasePrompt = t(
    paused
      ? 'games.breathingGarden.paused'
      : phase === 'inhale'
        ? 'games.breathingGarden.inhale'
        : 'games.breathingGarden.exhale',
  );
  const renderActivity = () => (
    <View style={styles.breathCard}>
      {mode === 'watching' && (
        <Text style={[TypeStyle.body, { color: colors.textLight }]}>
          {t('games.breathingGarden.watching')}
        </Text>
      )}
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
    </View>
  );

  const opening = mode === 'opening';
  const complete = mode === 'complete';
  const prompt =
    mode === 'normal'
      ? t('games.breathingGarden.normalMessage')
      : isPaced
        ? phasePrompt
        : t(complete ? 'common.againPrompt' : 'games.breathingGarden.comfortMessage');

  const stop = (
    <AppButton
      icon='stop'
      label={t(
        mode === 'watching' ? 'games.breathingGarden.stopWatching' : 'games.breathingGarden.stop',
      )}
      onPress={() =>
        finishActivity(mode === 'watching' || mode === 'normal' ? 'opening' : 'complete')
      }
      variant='ghost'
      size='sm'
      testID='breathing-stop'
    />
  );
  const pauseOrResume = isPaced ? (
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
  ) : null;
  return (
    <GameShell
      testID='breathing-garden-screen'
      title={t('games.breathingGarden.title')}
      onHome={handleBack}
      prompt={prompt}
      actions={
        opening ? (
          <AppButton
            icon='play'
            label={t('games.breathingGarden.start')}
            onPress={() => begin('active')}
            testID='breathing-start'
          />
        ) : mode === 'normal' ? (
          stop
        ) : (
          pauseOrResume
        )
      }
      more={
        complete
          ? undefined
          : (close) => (
              <>
                {opening && (
                  <>
                    <AppButton
                      icon='eye'
                      label={t('games.breathingGarden.watchFirst')}
                      variant='secondary'
                      onPress={() => {
                        close();
                        begin('watching');
                      }}
                      testID='breathing-watch-first'
                    />
                    <AppButton
                      label={t('games.breathingGarden.breatheNormally')}
                      variant='ghost'
                      onPress={() => {
                        close();
                        changeActivity({ mode: 'normal' });
                      }}
                      testID='breathing-normal'
                    />
                  </>
                )}
                {isPaced && (
                  <AppButton
                    icon='stop'
                    variant='ghost'
                    label={t(
                      mode === 'watching'
                        ? 'games.breathingGarden.stopWatching'
                        : 'games.breathingGarden.stop',
                    )}
                    onPress={() => {
                      close();
                      finishActivity(mode === 'watching' ? 'opening' : 'complete');
                    }}
                    testID='breathing-stop'
                  />
                )}
                {visualControl}
                <AppButton
                  label={
                    isPlaying
                      ? t('games.breathingGarden.musicOff')
                      : t('games.breathingGarden.musicOn')
                  }
                  onPress={toggleMusic}
                  variant='ghost'
                  disabled={!settings.soundEnabled}
                  testID='breathing-music'
                />
                <AppButton
                  label={t('games.breathingGarden.changeColor')}
                  disabled={!visualCue}
                  onPress={() =>
                    setColorIndex((current) => (current + 1) % defaultColorSchemes.length)
                  }
                  variant='ghost'
                />
              </>
            )
      }
    >
      {opening && (
        <View style={styles.opening}>
          <GameArtwork gameId='breathing-garden' size={140} />
          <AppButton
            size='sm'
            variant='ghost'
            testID='breathing-session-length'
            label={t('games.breathingGarden.session.chip', {
              length: sessionOptions.find(({ value }) => value === sessionLength)?.label,
            })}
            accessibilityHint={t('games.breathingGarden.session.title')}
            onPress={() => setChoosingLength(true)}
          />
        </View>
      )}
      {mode === 'normal' && (
        <View testID='breathing-normal-state' style={styles.opening}>
          <GameArtwork gameId='breathing-garden' size={128} />
        </View>
      )}
      {complete && (
        <GameCompletion
          testID='breathing-complete'
          message={t('games.breathingGarden.finished')}
          onReplay={() => begin('active')}
          onHome={handleBack}
        />
      )}
      {isPaced && renderActivity()}
      <AppModal
        visible={choosingLength}
        placement='bottom'
        title={t('games.breathingGarden.session.title')}
        onClose={() => setChoosingLength(false)}
      >
        <SegmentedControl
          options={sessionOptions}
          value={sessionLength}
          wrap
          onValueChange={(value) => {
            void updateGameSettings('breathing-garden', { sessionLength: value });
            setChoosingLength(false);
          }}
        />
      </AppModal>
    </GameShell>
  );
};

const styles = StyleSheet.create({
  opening: { width: '100%', alignItems: 'center', gap: Space.md, paddingVertical: Space.lg },
  breathCard: {
    width: '100%',
    maxWidth: 620,
    paddingVertical: Space.lg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Space.base,
  },
  ballContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  breathingMochi: { position: 'absolute', right: 0, bottom: 0 },
  hiddenCue: { display: 'none' },
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
