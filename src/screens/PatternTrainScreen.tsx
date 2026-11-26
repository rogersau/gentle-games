import { GamePicture } from '../ui/components/GamePicture';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Animated,
  Easing,
  Platform,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { ThemeColors, Difficulty } from '../types';
import { useSettings } from '../context/SettingsContext';
import { playMatchSound } from '../utils/sounds';
import { useThemeColors } from '../utils/theme';
import { AppButton, SegmentedControl, GuidedPracticePrompt } from '../ui/components';
import { HitTarget, Space, TypeStyle } from '../ui/tokens';
import { getGameSettings, patternLevelToDifficulty, PatternTrainLevel } from '../games/settings';
import { useAnimationEnabled } from '../ui/animations';
import { TrainEngine, Carriage } from '../components/train';
import { getGamePresentationPolicy } from '../utils/gamePresentationPolicy';
import { usePatternTrainGame } from './usePatternTrainGame';
import { PatternTrainChoice } from './PatternTrainChoice';
import { ControlIcon } from '../ui/components/ControlIcon';
import { GameShell, GameCompletion } from '../ui/components/GameShell';

const pictureKeys: Record<string, string> = {
  '🚂': 'engine',
  '🌟': 'star',
  '🌈': 'rainbow',
  '🌸': 'flower',
  '☁️': 'cloud',
  '🫧': 'bubbles',
  '🍓': 'strawberry',
  '🧸': 'teddy',
};

const COMPLETION_PAUSE_MS = 1200;
const DEPARTURE_DURATION_MS = 750;

export const PatternTrainScreen: React.FC = () => {
  const navigation = useNavigation();
  const { settings, updateGameSettings } = useSettings();
  const patternSettings = getGameSettings(settings, 'pattern-train');
  const difficulty = patternLevelToDifficulty(patternSettings.level);
  const { showPressureMetrics, showMilestoneCelebrations } = getGamePresentationPolicy(settings);
  const animationsEnabled = useAnimationEnabled();
  const { colors } = useThemeColors();
  const { t } = useTranslation();
  const translate = t as unknown as (key: string) => string;
  const { width: windowWidth } = useWindowDimensions();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { state, actions } = usePatternTrainGame({
    difficulty,
    t: t as (key: string, options?: Record<string, unknown>) => string,
    showMilestones: showMilestoneCelebrations,
  });
  const {
    pattern,
    completedRounds,
    showDifficultySelector,
    showMilestone,
    attachedCarriage,
    guidedRound,
    feedback,
  } = state;
  const {
    handleDifficultySelect: selectDifficulty,
    handleCloseDifficultySelector,
    startNewRound,
    submitChoice,
    showHint,
    skipRound,
    replayInstructions,
  } = actions;

  const [showInstructions, setShowInstructions] = useState(false);
  const trainZoneRef = useRef<View>(null);
  const [measuredTrainWidth, setMeasuredTrainWidth] = useState<number>();
  const trainWidth = measuredTrainWidth ?? Math.min(windowWidth, 760) - 2 * (Space.md + Space.lg);
  const [departure] = useState(() => new Animated.Value(0));
  const isComplete = guidedRound.phase === 'corrected';

  useEffect(() => {
    if (!isComplete || showDifficultySelector) return;

    let animation: Animated.CompositeAnimation | undefined;
    const timer = setTimeout(() => {
      if (!animationsEnabled) return;

      animation = Animated.timing(departure, {
        toValue: 1,
        duration: DEPARTURE_DURATION_MS,
        easing: Easing.inOut(Easing.quad),
        useNativeDriver: Platform.OS !== 'web',
        isInteraction: false,
      });
      animation.start();
    }, COMPLETION_PAUSE_MS);

    return () => {
      clearTimeout(timer);
      animation?.stop();
      departure.setValue(0);
    };
  }, [animationsEnabled, departure, isComplete, showDifficultySelector]);

  const difficultyOptions: { value: Difficulty; label: string }[] = [
    { value: 'easy', label: t('games.patternTrain.difficulty.easy.label') },
    { value: 'medium', label: t('games.patternTrain.difficulty.medium.label') },
    { value: 'hard', label: t('games.patternTrain.difficulty.hard.label') },
  ];

  const handleDifficultySelect = useCallback(
    (nextDifficulty: Difficulty) => {
      const level: PatternTrainLevel =
        nextDifficulty === 'hard'
          ? 'challenge'
          : nextDifficulty === 'medium'
            ? 'growing'
            : 'starter';
      void updateGameSettings('pattern-train', { level });
      selectDifficulty(nextDifficulty);
    },
    [selectDifficulty, updateGameSettings],
  );

  const handleChoice = useCallback(
    (choice: string) => {
      const result = submitChoice(choice);
      if (!result) return;

      if (result.isCorrect) void playMatchSound(settings);
      if (Platform.OS === 'ios') {
        AccessibilityInfo.announceForAccessibility(
          result.isCorrect
            ? t('games.patternTrain.feedback.correct')
            : t('games.patternTrain.feedback.incorrect'),
        );
      }
    },
    [settings, submitChoice, t],
  );

  const handleDrop = useCallback(
    (choice: string, pageX: number, pageY: number) => {
      const zone = trainZoneRef.current;
      // Web measurement uses viewport coordinates, while responder events use page coordinates.
      const x = Platform.OS === 'web' ? pageX - window.scrollX : pageX;
      const y = Platform.OS === 'web' ? pageY - window.scrollY : pageY;
      zone?.measure((_left, _top, width, height, zoneX, zoneY) => {
        if (
          zone === trainZoneRef.current &&
          width > 0 &&
          height > 0 &&
          x >= zoneX &&
          x <= zoneX + width &&
          y >= zoneY &&
          y <= zoneY + height
        ) {
          handleChoice(choice);
        }
      });
    },
    [handleChoice],
  );

  const pictureName = (emoji: string) =>
    pictureKeys[emoji] ? translate(`games.patternTrain.pictures.${pictureKeys[emoji]}`) : emoji;
  const trainSequence = pattern.carriages.map((carriage) =>
    carriage.isMissing
      ? attachedCarriage
        ? pictureName(attachedCarriage)
        : t('games.patternTrain.missingCarriage')
      : pictureName(carriage.emoji),
  );
  const toggleInstructions = () => {
    if (!showInstructions) {
      replayInstructions();
      if (Platform.OS === 'ios') {
        AccessibilityInfo.announceForAccessibility(t('games.patternTrain.instructions'));
      }
    }
    setShowInstructions(!showInstructions);
  };
  const showingAnswer = guidedRound.phase === 'modelled';
  const pictureStrip = (values: string[]) => (
    <View style={styles.pictureStrip} aria-hidden accessible={false}>
      {values.map((value, index) => (
        <GamePicture key={index} name={value} size={26} />
      ))}
    </View>
  );
  const model = (
    <View>
      <Text style={styles.modelText}>
        {t('games.patternTrain.guidance.matchCue', { picture: pictureName(pattern.answer) })}
      </Text>
    </View>
  );
  const usableWidth = Math.max(1, trainWidth - Space.sm);
  const engineWidth = Math.min(36, usableWidth / 5);
  const split = (usableWidth - engineWidth) / pattern.carriages.length < 52;
  const rows = split
    ? [
        pattern.carriages.slice(0, pattern.repeatUnit.length),
        pattern.carriages.slice(pattern.repeatUnit.length),
      ]
    : [pattern.carriages];
  const carriageSize = Math.min(76, (usableWidth - engineWidth) / rows[0].length);
  const choiceWidth =
    (trainWidth - Space.sm * (pattern.choices.length - 1)) / pattern.choices.length;
  const choiceSize = Math.max(HitTarget.min, Math.min(104, Math.floor(choiceWidth)));
  const trainOffset = departure.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -trainWidth],
  });

  return (
    <GameShell
      title={t('games.patternTrain.title')}
      onHome={() => navigation.goBack()}
      prompt={t(
        isComplete
          ? 'common.againPrompt'
          : showInstructions
            ? 'games.patternTrain.instructions'
            : 'games.patternTrain.guidance.instruction',
      )}
      actions={
        !isComplete && guidedRound.phase === 'independent' ? (
          <AppButton
            icon='eye'
            label={t('games.patternTrain.guidance.showPatternButton')}
            variant='secondary'
            onPress={showHint}
          />
        ) : undefined
      }
      onMoreClose={handleCloseDifficultySelector}
      more={(close) =>
        showDifficultySelector ? (
          <>
            <Text style={styles.platformLabel} accessibilityRole='header'>
              {t('games.patternTrain.chooseDifficulty')}
            </Text>
            <SegmentedControl
              options={difficultyOptions}
              value={difficulty}
              wrap
              onValueChange={(value) => {
                handleDifficultySelect(value);
                close();
              }}
            />
          </>
        ) : (
          <>
            {!isComplete && (
              <AppButton
                icon='next'
                label={t('games.patternTrain.guidance.skip')}
                variant='ghost'
                onPress={() => {
                  skipRound();
                  close();
                }}
              />
            )}
            <AppButton
              label={t('games.patternTrain.changeLevel')}
              variant='ghost'
              onPress={actions.openDifficultySelector}
              testID='pattern-train-level'
            />
            {!isComplete && (
              <AppButton
                label={t(
                  showInstructions
                    ? 'games.patternTrain.guidance.hideInstructions'
                    : 'games.patternTrain.guidance.replay',
                )}
                variant='ghost'
                onPress={() => {
                  toggleInstructions();
                  close();
                }}
              />
            )}
          </>
        )
      }
    >
      <View
        ref={trainZoneRef}
        collapsable={false}
        style={styles.trainZone}
        onLayout={(event) => setMeasuredTrainWidth(event.nativeEvent.layout.width)}
        accessible
        accessibilityLabel={t('games.patternTrain.train.accessibilityLabel', {
          sequence: trainSequence.join(', '),
        })}
        accessibilityRole='image'
        testID='pattern-train-zone'
      >
        <Animated.View
          style={[styles.trainRows, { transform: [{ translateX: isComplete ? trainOffset : 0 }] }]}
        >
          {rows.map((row, rowIndex) => (
            <View
              key={rowIndex}
              style={[
                styles.trainContainer,
                { width: engineWidth + rows[0].length * carriageSize },
              ]}
            >
              {rowIndex === 0 ? (
                <TrainEngine size={engineWidth} />
              ) : (
                <View style={{ width: engineWidth }} />
              )}
              {row.map((carriage, index) => (
                <Carriage
                  key={index}
                  size={carriageSize}
                  isMissing={carriage.isMissing && !attachedCarriage}
                  content={
                    carriage.isMissing && !attachedCarriage && !showingAnswer ? '?' : carriage.emoji
                  }
                />
              ))}
            </View>
          ))}
        </Animated.View>
      </View>
      {!isComplete && (
        <Text style={styles.platformLabel}>{t('games.patternTrain.platform.label')}</Text>
      )}
      {!isComplete && (
        <View style={styles.platform}>
          {pattern.choices.map((emoji) => (
            <PatternTrainChoice
              key={`${guidedRound.exampleNumber}-${pattern.difficulty}-${emoji}`}
              emoji={emoji}
              label={t('games.patternTrain.carriage.accessibilityLabel', {
                picture: pictureName(emoji),
              })}
              hint={t('games.patternTrain.carriage.accessibilityHint')}
              size={choiceSize}
              disabled={isComplete}
              animationsEnabled={animationsEnabled}
              onChoose={handleChoice}
              onDrop={handleDrop}
            />
          ))}
        </View>
      )}
      <View aria-live='polite'>
        {feedback && !isComplete ? (
          <View style={styles.feedbackRow}>
            {!isComplete && guidedRound.incorrectAttempts > 0 && (
              <View testID='pattern-train-retry-cue'>
                <ControlIcon name='repeat' color={colors.text} size={18} />
              </View>
            )}
            <Text style={styles.feedback}>{feedback}</Text>
          </View>
        ) : null}
      </View>

      {showMilestone && (
        <Text style={styles.meta}>
          {t('games.patternTrain.milestone.rounds', { count: completedRounds })}
        </Text>
      )}
      {!isComplete && (
        <GuidedPracticePrompt
          state={guidedRound}
          hint={t('games.patternTrain.guidance.showPattern', {
            unit: pattern.repeatUnit.map(pictureName).join(', '),
          })}
          hintPicture={pictureStrip(pattern.repeatUnit)}
          model={model}
          hideActions
        />
      )}
      {isComplete && (
        <GameCompletion
          message={t('games.patternTrain.feedback.correct')}
          onReplay={startNewRound}
          onHome={() => navigation.goBack()}
        />
      )}
      {showPressureMetrics && !showMilestone ? (
        <Text
          style={styles.meta}
          accessibilityLabel={t('games.patternTrain.roundsAccessibilityLabel', {
            count: completedRounds,
          })}
        >
          {t('games.patternTrain.completedRounds')}: {completedRounds}
        </Text>
      ) : null}
    </GameShell>
  );
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    meta: { ...TypeStyle.label, color: colors.text, marginVertical: Space.sm },
    trainZone: {
      width: '100%',
      minHeight: 64,
      justifyContent: 'center',
      alignItems: 'center',
      overflow: 'hidden',
      paddingHorizontal: Space.xs,
    },
    trainRows: { gap: Space.xs },
    trainContainer: { flexDirection: 'row', alignItems: 'center' },
    pictureStrip: {
      flexDirection: 'row',
      justifyContent: 'center',
      flexWrap: 'wrap',
      gap: Space.xs,
    },
    modelText: {
      ...TypeStyle.bodySm,
      color: colors.text,
      textAlign: 'center',
      marginTop: Space.xs,
    },
    platformLabel: { ...TypeStyle.label, color: colors.text, marginVertical: Space.sm },
    platform: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'center',
      gap: Space.sm,
      width: '100%',
    },
    feedback: {
      ...TypeStyle.bodySm,
      color: colors.text,
      textAlign: 'center',
      flexShrink: 1,
    },
    feedbackRow: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      gap: Space.xs,
      marginTop: Space.sm,
    },
  });
