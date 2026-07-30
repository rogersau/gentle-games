import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Animated,
  PanResponder,
  PanResponderGestureState,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
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
  AppHeader,
  AppButton,
  AppCard,
  AppModal,
  GuidedPracticePrompt,
} from '../ui/components';
import { Space, TypeStyle } from '../ui/tokens';
import { getGameSettings, patternLevelToDifficulty, PatternTrainLevel } from '../games/settings';
import { useAnimationEnabled } from '../ui/animations';
import { TrainEngine, Carriage } from '../components/train';
import { getGamePresentationPolicy } from '../utils/gamePresentationPolicy';
import { usePatternTrainGame, DraggableCarriage } from './usePatternTrainGame';

export const PatternTrainScreen: React.FC = () => {
  const navigation = useNavigation();
  const { settings, updateGameSettings } = useSettings();
  const patternSettings = getGameSettings(settings, 'pattern-train');
  const difficulty = patternLevelToDifficulty(patternSettings.level);
  const { showPressureMetrics, showMilestoneCelebrations } = getGamePresentationPolicy(settings);
  const animationsEnabled =
    typeof useAnimationEnabled === 'function'
      ? useAnimationEnabled()
      : settings.animationsEnabled !== false;
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
    isProcessing,
    showDifficultySelector,
    showMilestoneModal,
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

  const [draggableCarriages, setDraggableCarriages] = useState<DraggableCarriage[]>([]);
  const trainZoneRef = useRef<View>(null);
  const [trainZoneLayout, setTrainZoneLayout] = useState({ x: 0, y: 0, width: 0, height: 0 });

  React.useEffect(() => {
    if (!pattern) {
      setDraggableCarriages([]);
      return;
    }
    setDraggableCarriages(
      pattern.choices.map((emoji) => ({
        emoji,
        position: new Animated.ValueXY({ x: 0, y: 0 }),
        scale: new Animated.Value(1),
        opacity: new Animated.Value(1),
        isAvailable: true,
      })),
    );
  }, [pattern]);

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

  const handleCloseDifficultyModal = useCallback(() => {
    handleCloseDifficultySelector();
    navigation.goBack();
  }, [handleCloseDifficultySelector, navigation]);

  const measureTrainZone = useCallback(() => {
    trainZoneRef.current?.measure((_x, _y, width, height, pageX, pageY) => {
      setTrainZoneLayout({ x: pageX, y: pageY, width, height });
    });
  }, []);

  const handleChoice = useCallback(
    (choice: string) => {
      const result = submitChoice(choice);
      if (!result) return;

      if (result.isCorrect) void playMatchSound(settings);
      AccessibilityInfo.announceForAccessibility(
        result.isCorrect
          ? t('games.patternTrain.feedback.correctAnnouncement')
          : t('games.patternTrain.feedback.incorrectAnnouncement'),
      );
    },
    [settings, submitChoice, t],
  );

  const isOverTrainZone = useCallback(
    (gestureState: PanResponderGestureState) =>
      gestureState.moveX >= trainZoneLayout.x &&
      gestureState.moveX <= trainZoneLayout.x + trainZoneLayout.width &&
      gestureState.moveY >= trainZoneLayout.y &&
      gestureState.moveY <= trainZoneLayout.y + trainZoneLayout.height,
    [trainZoneLayout],
  );

  const createPanResponder = useCallback(
    (carriage: DraggableCarriage) =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => false,
        onMoveShouldSetPanResponder: (_, gestureState) =>
          !isProcessing &&
          guidedRound.phase !== 'corrected' &&
          carriage.isAvailable &&
          (Math.abs(gestureState.dx) > 4 || Math.abs(gestureState.dy) > 4),
        onPanResponderGrant: () => {
          if (animationsEnabled) {
            Animated.spring(carriage.scale, {
              toValue: 1.08,
              useNativeDriver: Platform.OS !== 'web',
            }).start();
          } else {
            carriage.scale.setValue(1.08);
          }
        },
        onPanResponderMove: (_, gestureState) => {
          carriage.position.setValue({ x: gestureState.dx, y: gestureState.dy });
        },
        onPanResponderRelease: (_, gestureState) => {
          const droppedOnTrain = isOverTrainZone(gestureState);
          if (droppedOnTrain) handleChoice(carriage.emoji);
          if (animationsEnabled) {
            Animated.spring(carriage.position, {
              toValue: { x: 0, y: 0 },
              useNativeDriver: Platform.OS !== 'web',
            }).start();
            Animated.spring(carriage.scale, {
              toValue: 1,
              useNativeDriver: Platform.OS !== 'web',
            }).start();
          } else {
            carriage.position.setValue({ x: 0, y: 0 });
            carriage.scale.setValue(1);
          }
        },
      }),
    [animationsEnabled, guidedRound.phase, handleChoice, isOverTrainZone, isProcessing],
  );

  const handleSkip = useCallback(() => {
    skipRound();
    startNewRound();
  }, [skipRound, startNewRound]);

  const ruleLabel = pattern ? translate(`games.patternTrain.rules.${pattern.templateId}`) : '';
  const model = pattern ? (
    <View
      accessibilityLabel={t('games.patternTrain.guidance.modelAccessibilityLabel', {
        sequence: pattern.carriages.map((carriage) => carriage.emoji).join(' '),
      })}
    >
      <Text style={styles.modelText}>
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
  ) : null;
  const trainScale = pattern
    ? Math.min(1, (windowWidth - Space.xl * 2) / (64 + pattern.carriages.length * 56))
    : 1;

  return (
    <AppScreen scroll>
      <AppHeader title={t('games.patternTrain.title')} onBack={() => navigation.goBack()} />
      <View style={styles.content}>
        <Text style={styles.subtitle} accessibilityRole='header'>
          {t('games.patternTrain.subtitle')}
        </Text>
        <Text style={styles.meta}>{t(`games.patternTrain.difficulty.${difficulty}.label`)}</Text>

        {pattern ? (
          <>
            <AppCard variant='elevated' style={styles.patternCard}>
              <Text style={styles.patternRule} accessibilityRole='header'>
                {ruleLabel}
              </Text>
              <Text
                style={styles.repeatUnit}
                accessibilityLabel={t('games.patternTrain.repeatUnitAccessibilityLabel', {
                  unit: pattern.repeatUnit.join(' '),
                  rule: ruleLabel,
                })}
              >
                {t('games.patternTrain.repeatUnit', {
                  unit: pattern.repeatUnit.join(' '),
                  rule: ruleLabel,
                })}
              </Text>
              <View
                ref={trainZoneRef}
                style={styles.trainZone}
                onLayout={measureTrainZone}
                accessibilityLabel={t('games.patternTrain.train.accessibilityLabel')}
                accessibilityRole='image'
              >
                <View style={[styles.trainContainer, { transform: [{ scale: trainScale }] }]}>
                  <View style={styles.trainPart}>
                    <TrainEngine size={64} />
                  </View>
                  {pattern.carriages.map((carriage, index) => {
                    const displayedEmoji = carriage.isMissing
                      ? state.attachedCarriage
                      : carriage.emoji;
                    const isOpenSlot = carriage.isMissing && !state.attachedCarriage;
                    return (
                      <View key={`${carriage.emoji}-${index}`} style={styles.trainPart}>
                        <Carriage
                          size={56}
                          isMissing={isOpenSlot}
                          content={displayedEmoji ?? '?'}
                        />
                      </View>
                    );
                  })}
                </View>
              </View>
            </AppCard>

            <GuidedPracticePrompt
              state={guidedRound}
              instruction={t('games.patternTrain.guidance.instruction')}
              neutralFeedback={feedback}
              hint={t('games.patternTrain.guidance.showPattern', {
                unit: pattern.repeatUnit.join(' '),
              })}
              model={model}
              hintLabel={t('games.patternTrain.guidance.showPatternButton')}
              replayLabel={t('games.patternTrain.guidance.replay')}
              skipLabel={t('games.patternTrain.guidance.skip')}
              onReplay={replayInstructions}
              onHint={showHint}
              onSkip={handleSkip}
            />

            <AppCard variant='elevated' style={styles.platformCard}>
              <Text style={styles.platformLabel}>{t('games.patternTrain.platform.label')}</Text>
              <View
                style={styles.platform}
                accessibilityLabel={t('games.patternTrain.platform.accessibilityLabel', {
                  count: draggableCarriages.length,
                })}
              >
                {draggableCarriages.map((carriage, index) => {
                  const panResponder = createPanResponder(carriage);
                  return (
                    <Animated.View
                      key={`${carriage.emoji}-${index}`}
                      style={[
                        styles.draggableCarriage,
                        {
                          transform: [
                            { translateX: carriage.position.x },
                            { translateY: carriage.position.y },
                            { scale: carriage.scale },
                          ],
                          opacity: carriage.opacity,
                        },
                      ]}
                      {...panResponder.panHandlers}
                    >
                      <TouchableOpacity
                        onPress={() => handleChoice(carriage.emoji)}
                        disabled={isProcessing || guidedRound.phase === 'corrected'}
                        accessibilityRole='button'
                        accessibilityLabel={t('games.patternTrain.carriage.accessibilityLabel', {
                          emoji: carriage.emoji,
                        })}
                        accessibilityHint={t('games.patternTrain.carriage.accessibilityHint')}
                        hitSlop={8}
                        style={styles.carriageButton}
                      >
                        <Carriage content={carriage.emoji} size={64} />
                      </TouchableOpacity>
                    </Animated.View>
                  );
                })}
              </View>
              <Text style={styles.instructions}>{t('games.patternTrain.instructions')}</Text>
            </AppCard>

            {guidedRound.phase === 'corrected' && !showMilestoneModal ? (
              <AppButton
                label={t('games.patternTrain.guidance.next')}
                onPress={startNewRound}
                accessibilityHint={t('games.patternTrain.guidance.nextHint')}
                testID='pattern-train-next'
              />
            ) : null}

            {showPressureMetrics ? (
              <Text
                style={styles.meta}
                accessibilityLabel={t('games.patternTrain.roundsAccessibilityLabel', {
                  count: completedRounds,
                })}
              >
                {t('games.patternTrain.completedRounds')}: {completedRounds}
              </Text>
            ) : null}
          </>
        ) : null}
      </View>

      <AppModal
        visible={showMilestoneCelebrations && showMilestoneModal}
        title={t('games.patternTrain.milestone.title', { count: completedRounds })}
        onClose={() => undefined}
        showClose={false}
        dismissOnBackdropPress={false}
      >
        <Text style={styles.milestoneText}>{t('games.patternTrain.milestone.default')}</Text>
        <Text style={styles.milestoneCount}>
          {t('games.patternTrain.milestone.rounds', { count: completedRounds })}
        </Text>
        <AppButton
          label={t('games.patternTrain.milestone.continue')}
          onPress={actions.handleMilestoneContinue}
          accessibilityHint={t('games.patternTrain.milestone.continueHint')}
        />
      </AppModal>

      <AppModal
        visible={showDifficultySelector}
        onClose={handleCloseDifficultyModal}
        title={t('games.patternTrain.title')}
        showClose
        closeLabel={t('common.cancel')}
      >
        <Text style={styles.modalSubtitle}>{t('games.patternTrain.chooseDifficulty')}</Text>
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
      alignItems: 'center',
      paddingHorizontal: Space.md,
      paddingTop: Space.base,
      paddingBottom: Space.xl,
      width: '100%',
    },
    subtitle: {
      ...TypeStyle.bodySm,
      color: colors.textLight,
      textAlign: 'center',
      marginBottom: Space.sm,
    },
    meta: { ...TypeStyle.label, color: colors.text, marginVertical: Space.sm },
    patternCard: { width: '100%', alignItems: 'center', marginVertical: Space.sm },
    patternRule: { ...TypeStyle.label, color: colors.text, marginBottom: Space.xs },
    repeatUnit: { ...TypeStyle.bodySm, color: colors.text, textAlign: 'center' },
    trainZone: {
      width: '100%',
      minHeight: 104,
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: Space.md,
      paddingHorizontal: Space.xs,
    },
    trainContainer: { flexDirection: 'row', alignItems: 'center' },
    trainPart: { flexDirection: 'row', alignItems: 'center', position: 'relative' },
    modelText: {
      ...TypeStyle.bodySm,
      color: colors.text,
      textAlign: 'center',
      marginTop: Space.xs,
    },
    platformCard: { width: '100%', marginVertical: Space.base, alignItems: 'center' },
    platformLabel: { ...TypeStyle.label, color: colors.textLight, marginBottom: Space.sm },
    platform: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'center',
      gap: Space.base,
      padding: Space.sm,
      minHeight: 80,
      width: '100%',
    },
    draggableCarriage: { zIndex: 10 },
    carriageButton: { padding: 0, backgroundColor: 'transparent' },
    instructions: {
      ...TypeStyle.bodySm,
      color: colors.textLight,
      textAlign: 'center',
      marginTop: Space.sm,
    },
    modalSubtitle: {
      ...TypeStyle.bodySm,
      color: colors.textLight,
      textAlign: 'center',
      marginBottom: Space.base,
    },
    optionsList: { marginBottom: Space.sm },
    optionButton: { marginBottom: Space.sm },
    milestoneText: {
      ...TypeStyle.body,
      color: colors.text,
      textAlign: 'center',
      marginBottom: Space.sm,
    },
    milestoneCount: {
      ...TypeStyle.label,
      color: colors.textLight,
      textAlign: 'center',
      marginBottom: Space.base,
    },
  });
