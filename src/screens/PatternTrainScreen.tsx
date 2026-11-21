import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  AccessibilityInfo,
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
import {
  AppScreen,
  GameHeader,
  AppButton,
  AppCard,
  AppModal,
  GuidedPracticePrompt,
} from '../ui/components';
import { HitTarget, Space, TypeStyle } from '../ui/tokens';
import { getGameSettings, patternLevelToDifficulty, PatternTrainLevel } from '../games/settings';
import { useAnimationEnabled } from '../ui/animations';
import { TrainEngine, Carriage } from '../components/train';
import { getGamePresentationPolicy } from '../utils/gamePresentationPolicy';
import { usePatternTrainGame } from './usePatternTrainGame';
import { PatternTrainChoice } from './PatternTrainChoice';
import { ControlIcon } from '../ui/components/ControlIcon';

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
  const ruleLabel = translate(`games.patternTrain.rules.${pattern.templateId}`);
  const model = (
    <View>
      <Text
        style={styles.modelText}
        accessibilityLabel={t('games.patternTrain.guidance.modelAccessibilityLabel', {
          sequence: pattern.carriages.map((carriage) => pictureName(carriage.emoji)).join(', '),
        })}
      >
        {t('games.patternTrain.guidance.model', {
          sequence: pattern.carriages.map((carriage) => carriage.emoji).join(' '),
        })}
      </Text>
      <Text style={styles.modelText}>
        {t('games.patternTrain.repeatUnit', {
          unit: pattern.repeatUnit.join(' '),
          rule: ruleLabel,
        })}
      </Text>
    </View>
  );
  const trainScale = Math.min(
    1,
    Math.max(1, trainWidth - Space.sm) / (64 + pattern.carriages.length * 56),
  );
  const choiceWidth =
    (trainWidth - Space.sm * (pattern.choices.length - 1)) / pattern.choices.length;
  const choiceSize = Math.max(HitTarget.min, Math.min(64, Math.floor(choiceWidth)));
  const isComplete = guidedRound.phase === 'corrected';

  return (
    <AppScreen
      scroll
      header={
        <GameHeader title={t('games.patternTrain.title')} onBack={() => navigation.goBack()} />
      }
    >
      <View style={styles.content}>
        <Text style={styles.subtitle} accessibilityRole='header'>
          {t('games.patternTrain.guidance.instruction')}
        </Text>

        <AppCard variant='elevated' style={styles.patternCard}>
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
            <View style={styles.trainContainer}>
              <TrainEngine size={64 * trainScale} />
              {pattern.carriages.map((carriage, index) => (
                <Carriage
                  key={index}
                  size={56 * trainScale}
                  isMissing={carriage.isMissing && !attachedCarriage}
                  content={carriage.isMissing ? (attachedCarriage ?? '?') : carriage.emoji}
                />
              ))}
            </View>
          </View>
        </AppCard>

        <AppCard variant='elevated' style={styles.platformCard}>
          <Text style={styles.platformLabel}>{t('games.patternTrain.platform.label')}</Text>
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
          <View aria-live='polite'>
            {feedback ? (
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
        </AppCard>

        {isComplete ? (
          <>
            <AppButton
              icon='next'
              label={t('games.patternTrain.guidance.next')}
              onPress={startNewRound}
              accessibilityHint={t('games.patternTrain.guidance.nextHint')}
              testID='pattern-train-next'
            />
            {showMilestone ? (
              <Text style={styles.meta}>
                {t('games.patternTrain.milestone.rounds', { count: completedRounds })}
              </Text>
            ) : null}
          </>
        ) : (
          <GuidedPracticePrompt
            state={guidedRound}
            instruction={showInstructions ? t('games.patternTrain.instructions') : undefined}
            hint={t('games.patternTrain.guidance.showPattern', {
              unit: pattern.repeatUnit.join(' '),
            })}
            model={model}
            hintLabel={t('games.patternTrain.guidance.showPatternButton')}
            replayLabel={t(
              showInstructions
                ? 'games.patternTrain.guidance.hideInstructions'
                : 'games.patternTrain.guidance.replay',
            )}
            skipLabel={t('games.patternTrain.guidance.skip')}
            onReplay={toggleInstructions}
            onHint={showHint}
            onSkip={skipRound}
          />
        )}

        <AppButton
          label={t('games.patternTrain.changeLevel')}
          variant='ghost'
          onPress={actions.openDifficultySelector}
          style={styles.levelButton}
          testID='pattern-train-level'
        />

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
      </View>

      <AppModal
        visible={showDifficultySelector}
        onClose={handleCloseDifficultySelector}
        title={t('games.patternTrain.chooseDifficulty')}
        showClose
        closeLabel={t('common.cancel')}
      >
        <View style={styles.optionsList}>
          {difficultyOptions.map(({ value, label }) => (
            <AppButton
              key={value}
              label={label}
              variant={difficulty === value ? 'primary' : 'ghost'}
              size='md'
              fullWidth
              onPress={() => handleDifficultySelect(value)}
              style={styles.optionButton}
              accessibilityLabel={t('games.patternTrain.difficultyAccessibilityLabel', { label })}
              accessibilityState={{ selected: difficulty === value }}
            />
          ))}
        </View>
      </AppModal>
    </AppScreen>
  );
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    content: {
      width: '100%',
      maxWidth: 760,
      alignSelf: 'center',
      alignItems: 'center',
      paddingHorizontal: Space.md,
      paddingTop: Space.base,
      paddingBottom: Space.xl,
    },
    subtitle: {
      ...TypeStyle.bodySm,
      color: colors.textLight,
      textAlign: 'center',
      marginBottom: Space.sm,
    },
    meta: { ...TypeStyle.label, color: colors.text, marginVertical: Space.sm },
    patternCard: { width: '100%', alignItems: 'center', marginVertical: Space.sm },
    trainZone: {
      width: '100%',
      minHeight: 64,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: Space.xs,
    },
    trainContainer: { flexDirection: 'row', alignItems: 'center' },
    modelText: {
      ...TypeStyle.bodySm,
      color: colors.text,
      textAlign: 'center',
      marginTop: Space.xs,
    },
    platformCard: { width: '100%', marginVertical: Space.sm, alignItems: 'center', zIndex: 1 },
    platformLabel: { ...TypeStyle.label, color: colors.textLight, marginBottom: Space.sm },
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
    optionsList: { marginBottom: Space.sm },
    optionButton: { marginBottom: Space.sm },
    levelButton: { marginTop: Space.sm },
  });
