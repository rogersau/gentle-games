import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Animated,
  AccessibilityInfo,
  PanResponder,
  PanResponderGestureState,
  Dimensions,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { ThemeColors, Difficulty } from '../types';
import { useSettings } from '../context/SettingsContext';
import { generateTrainPattern, isTrainChoiceCorrect, removeWrongChoices, TrainPattern } from '../utils/patternTrainLogic';
import { playMatchSound, playFlipSound, playCompleteSound } from '../utils/sounds';
import { useThemeColors } from '../utils/theme';
import { AppScreen, AppHeader, AppButton, AppCard, AppModal } from '../ui/components';
import { Space, TypeStyle } from '../ui/tokens';
import { useGentleBounce } from '../ui/animations';
import { TrainEngine, Carriage } from '../components/train';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Animation timing constants (in milliseconds)
const TRAIN_ANIMATION = {
  ENTRY_DURATION: 2000,
  EXIT_DURATION: 2000,
  SUCCESS_DELAY: 1000,
  CHOICE_FADE_DURATION: 300,
};

const MILESTONE_INTERVAL = 5;

interface DraggableCarriage {
  emoji: string;
  position: Animated.ValueXY;
  scale: Animated.Value;
  opacity: Animated.Value;
  isAvailable: boolean;
}

export const PatternTrainScreen: React.FC = () => {
  const navigation = useNavigation();
  const { settings, updateSettings } = useSettings();
  const { colors } = useThemeColors();
  const { t } = useTranslation();
  const styles = useMemo(() => createStyles(colors), [colors]);

  // Game state
  const [pattern, setPattern] = useState<TrainPattern | null>(null);
  const [completedRounds, setCompletedRounds] = useState(0);
  const [wrongAttempts, setWrongAttempts] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showMilestoneModal, setShowMilestoneModal] = useState(false);
  const [showDifficultySelector, setShowDifficultySelector] = useState(true);
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null);
  const [attachedCarriage, setAttachedCarriage] = useState<string | null>(null);

  // Train animation state
  const [_trainPhase, setTrainPhase] = useState<'entering' | 'waiting' | 'exiting' | 'offscreen'>('offscreen');
  const trainPosition = useRef<Animated.Value>(new Animated.Value(SCREEN_WIDTH)).current;
  const trainOpacity = useRef<Animated.Value>(new Animated.Value(0)).current;
  const timeoutIdsRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  // Draggable carriages state
  const [draggableCarriages, setDraggableCarriages] = useState<DraggableCarriage[]>([]);

  // Feedback state
  const [feedback, setFeedback] = useState(t('games.patternTrain.feedback.initial'));
  const [feedbackType, setFeedbackType] = useState<'initial' | 'correct' | 'incorrect' | 'reveal'>('initial');
  const feedbackOpacity = useRef<Animated.Value>(new Animated.Value(1)).current;
  const { bounce: successBounce } = useGentleBounce();

  const difficultyOptions: {
    value: Difficulty;
    label: string;
    description: string;
  }[] = [
    { value: 'easy', label: t('games.patternTrain.difficulty.easy.label'), description: t('games.patternTrain.difficulty.easy.description') },
    { value: 'medium', label: t('games.patternTrain.difficulty.medium.label'), description: t('games.patternTrain.difficulty.medium.description') },
    { value: 'hard', label: t('games.patternTrain.difficulty.hard.label'), description: t('games.patternTrain.difficulty.hard.description') },
  ];

  const getDifficultyLabel = (difficulty: Difficulty) => {
    const option = difficultyOptions.find((opt) => opt.value === difficulty);
    return option?.label || difficulty;
  };

  const handleDifficultySelect = async (difficulty: Difficulty) => {
    await updateSettings({ difficulty });
    // Generate pattern with selected difficulty
    const newPattern = generateTrainPattern(difficulty);
    setPattern(newPattern);
    setShowDifficultySelector(false);
  };

  const handleCloseDifficultyModal = () => {
    setShowDifficultySelector(false);
    // Go back if user cancels difficulty selection
    navigation.goBack();
  };

  // Refs for layout measurements
  const trainZoneRef = useRef<View>(null);
  const platformRef = useRef<View>(null);
  const [trainZoneLayout, setTrainZoneLayout] = useState({ x: 0, y: 0, width: 0, height: 0 });

  const queueTimeout = useCallback((callback: () => void, delay: number) => {
    const timeoutId = setTimeout(() => {
      timeoutIdsRef.current = timeoutIdsRef.current.filter((id) => id !== timeoutId);
      callback();
    }, delay);
    timeoutIdsRef.current.push(timeoutId);
  }, []);

  useEffect(() => () => {
    timeoutIdsRef.current.forEach((timeoutId) => clearTimeout(timeoutId));
    timeoutIdsRef.current = [];
  }, []);

  // Initialize draggable carriages when pattern changes
  useEffect(() => {
    if (!pattern) return;
    const carriages: DraggableCarriage[] = pattern.choices.map((emoji) => ({
      emoji,
      position: new Animated.ValueXY({ x: 0, y: 0 }),
      scale: new Animated.Value(1),
      opacity: new Animated.Value(1),
      isAvailable: true,
    }));
    setDraggableCarriages(carriages);
  }, [pattern]);

  const startTrainEntry = useCallback((entryPattern: TrainPattern | null) => {
    setTrainPhase('entering');
    trainPosition.setValue(SCREEN_WIDTH);
    trainOpacity.setValue(0);

    if (settings.animationsEnabled) {
      Animated.parallel([
        Animated.timing(trainPosition, {
          toValue: 0,
          duration: TRAIN_ANIMATION.ENTRY_DURATION,
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.timing(trainOpacity, {
          toValue: 1,
          duration: TRAIN_ANIMATION.ENTRY_DURATION * 0.5,
          useNativeDriver: Platform.OS !== 'web',
        }),
      ]).start(() => {
        setTrainPhase('waiting');
        if (entryPattern) {
          AccessibilityInfo.announceForAccessibility(
            t('games.patternTrain.train.arrived', {
              pattern: entryPattern.carriages.map(c => c.isMissing ? 'missing' : c.emoji).join(', '),
            })
          );
        }
      });
    } else {
      trainPosition.setValue(0);
      trainOpacity.setValue(1);
      setTrainPhase('waiting');
      if (entryPattern) {
        AccessibilityInfo.announceForAccessibility(
          t('games.patternTrain.train.arrived', {
            pattern: entryPattern.carriages.map(c => c.isMissing ? 'missing' : c.emoji).join(', '),
          })
        );
      }
    }
  }, [t, trainOpacity, trainPosition, settings.animationsEnabled]);

  // Initialize train entry animation only if difficulty selector is not showing
  useEffect(() => {
    if (!showDifficultySelector && pattern) {
      startTrainEntry(pattern);
    }
  }, [showDifficultySelector, pattern, startTrainEntry]);

  const startNewRound = useCallback(() => {
    const newPattern = generateTrainPattern(settings.difficulty);
    setPattern(newPattern);
    setWrongAttempts(0);
    setSelectedChoice(null);
    setAttachedCarriage(null);
    setIsProcessing(false);
    setFeedback(t('games.patternTrain.feedback.initial'));
    setFeedbackType('initial');

    if (settings.animationsEnabled) {
      Animated.timing(feedbackOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: Platform.OS !== 'web',
      }).start();
    } else {
      feedbackOpacity.setValue(1);
    }

  }, [settings.difficulty, t, feedbackOpacity, settings.animationsEnabled]);

  const startTrainExit = useCallback(() => {
    setTrainPhase('exiting');

    if (settings.animationsEnabled) {
      // Fade out platform carriages
      draggableCarriages.forEach((c) => {
        if (c.isAvailable) {
          Animated.timing(c.opacity, {
            toValue: 0,
            duration: 500,
            useNativeDriver: Platform.OS !== 'web',
          }).start();
        }
      });

      // Move train off screen with fade out
      Animated.parallel([
        Animated.timing(trainPosition, {
          toValue: -SCREEN_WIDTH,
          duration: TRAIN_ANIMATION.EXIT_DURATION,
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.timing(trainOpacity, {
          toValue: 0,
          duration: TRAIN_ANIMATION.EXIT_DURATION,
          useNativeDriver: Platform.OS !== 'web',
        }),
      ]).start(() => {
        setTrainPhase('offscreen');
        startNewRound();
      });
    } else {
      // Instant transition - set values directly
      draggableCarriages.forEach((c) => {
        if (c.isAvailable) {
          c.opacity.setValue(0);
        }
      });
      trainPosition.setValue(-SCREEN_WIDTH);
      trainOpacity.setValue(0);
      setTrainPhase('offscreen');
      startNewRound();
    }
  }, [draggableCarriages, startNewRound, settings.animationsEnabled]);

  const measureTrainZone = useCallback(() => {
    if (trainZoneRef.current) {
      trainZoneRef.current.measure((x, y, width, height, pageX, pageY) => {
        setTrainZoneLayout({ x: pageX, y: pageY, width, height });
      });
    }
  }, []);

  const isOverTrainZone = useCallback((gestureState: PanResponderGestureState): boolean => {
    const carriageX = gestureState.moveX;
    const carriageY = gestureState.moveY;

    return (
      carriageX >= trainZoneLayout.x &&
      carriageX <= trainZoneLayout.x + trainZoneLayout.width &&
      carriageY >= trainZoneLayout.y &&
      carriageY <= trainZoneLayout.y + trainZoneLayout.height
    );
  }, [trainZoneLayout]);

  const getRandomFeedback = useCallback((type: 'correct' | 'incorrect'): string => {
    const optionsKey = type === 'correct' 
      ? 'games.patternTrain.feedback.correctOptions' 
      : 'games.patternTrain.feedback.incorrectOptions';
    const fallbackKey = type === 'correct'
      ? 'games.patternTrain.feedback.correct'
      : 'games.patternTrain.feedback.incorrect';
    
    const messages = t(optionsKey, { returnObjects: true }) as string[];
    if (Array.isArray(messages) && messages.length > 0) {
      const index = Math.floor(Math.random() * messages.length);
      return messages[index];
    }
    return t(fallbackKey);
  }, [t]);

  const handleCarriageDrop = useCallback(async (carriage: DraggableCarriage, gestureState: PanResponderGestureState) => {
    if (isProcessing || !carriage.isAvailable || !pattern) return;

    const isOverZone = isOverTrainZone(gestureState);

    if (isOverZone) {
      setIsProcessing(true);
      const isCorrect = isTrainChoiceCorrect(pattern, carriage.emoji);

      if (isCorrect) {
        await playMatchSound(settings);
        successBounce();

        // Mark carriage as attached to train
        setAttachedCarriage(carriage.emoji);
        
        // Fade out the dragged carriage on platform
        Animated.timing(carriage.opacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: Platform.OS !== 'web',
        }).start();

        const successMessage = getRandomFeedback('correct');
        setFeedback(successMessage);
        setFeedbackType('correct');
        AccessibilityInfo.announceForAccessibility(`${successMessage}. Train complete!`);

        Animated.sequence([
          Animated.timing(feedbackOpacity, {
            toValue: 0,
            duration: 150,
            useNativeDriver: Platform.OS !== 'web',
          }),
          Animated.timing(feedbackOpacity, {
            toValue: 1,
            duration: 150,
            useNativeDriver: Platform.OS !== 'web',
          }),
        ]).start();

        // Increment completed rounds
        const newCount = completedRounds + 1;
        setCompletedRounds(newCount);

        // Check for milestone
        if (newCount > 0 && newCount % MILESTONE_INTERVAL === 0) {
          playCompleteSound(settings);
          setShowMilestoneModal(true);
        } else {
          // Exit train after success delay
          queueTimeout(() => {
            startTrainExit();
          }, TRAIN_ANIMATION.SUCCESS_DELAY);
        }
      } else {
        await playFlipSound(settings);

        const newWrongAttempts = wrongAttempts + 1;
        setWrongAttempts(newWrongAttempts);

        // Spring back to platform
        Animated.spring(carriage.position, {
          toValue: { x: 0, y: 0 },
          useNativeDriver: Platform.OS !== 'web',
        }).start();

        if (newWrongAttempts < 3 && pattern) {
          // Remove the wrong choice that was dragged (specifically the one attempted)
          const remainingChoices = removeWrongChoices(
            pattern.choices,
            pattern.answer,
            1,
            carriage.emoji
          );

          // Fade out removed carriages
          draggableCarriages.forEach((c, index) => {
            if (!remainingChoices.includes(c.emoji) && c.isAvailable) {
              Animated.timing(c.opacity, {
                toValue: 0,
                duration: TRAIN_ANIMATION.CHOICE_FADE_DURATION,
                useNativeDriver: Platform.OS !== 'web',
              }).start(() => {
                setDraggableCarriages((prevCarriages) =>
                  prevCarriages.map((prevCarriage, prevIndex) =>
                    prevIndex === index ? { ...prevCarriage, isAvailable: false } : prevCarriage
                  )
                );
              });
            }
          });

          const errorMessage = getRandomFeedback('incorrect');
          setFeedback(errorMessage);
          setFeedbackType('incorrect');
          AccessibilityInfo.announceForAccessibility(`${errorMessage}. Try again!`);

          setIsProcessing(false);
        } else {
          // Reveal answer after 3 wrong attempts
          const revealMessage = t('games.patternTrain.feedback.reveal', { answer: pattern.answer });
          setFeedback(revealMessage);
          setFeedbackType('reveal');
          AccessibilityInfo.announceForAccessibility(`${revealMessage}. Train leaving.`);

          queueTimeout(() => {
            startTrainExit();
          }, TRAIN_ANIMATION.SUCCESS_DELAY);
        }
      }
    } else {
      // Spring back to platform
      Animated.spring(carriage.position, {
        toValue: { x: 0, y: 0 },
        useNativeDriver: Platform.OS !== 'web',
      }).start();
    }
  }, [
    isProcessing,
    pattern,
    isOverTrainZone,
    wrongAttempts,
    settings,
    completedRounds,
    draggableCarriages,
    getRandomFeedback,
    successBounce,
    t,
    startTrainExit,
    queueTimeout,
  ]);

  const createPanResponder = useCallback((carriage: DraggableCarriage) => {
    return PanResponder.create({
      onStartShouldSetPanResponder: () => !isProcessing && carriage.isAvailable,
      onMoveShouldSetPanResponder: () => !isProcessing && carriage.isAvailable,
      onPanResponderGrant: () => {
        Animated.spring(carriage.scale, {
          toValue: 1.1,
          useNativeDriver: Platform.OS !== 'web',
        }).start();
      },
      onPanResponderMove: (_, gestureState) => {
        carriage.position.setValue({
          x: gestureState.dx,
          y: gestureState.dy,
        });
      },
      onPanResponderRelease: (_, gestureState) => {
        Animated.spring(carriage.scale, {
          toValue: 1,
          useNativeDriver: Platform.OS !== 'web',
        }).start();

        handleCarriageDrop(carriage, gestureState);
      },
    });
  }, [isProcessing, handleCarriageDrop]);

  const handleCarriageTap = useCallback((carriage: DraggableCarriage) => {
    if (isProcessing || !carriage.isAvailable) return;

    if (selectedChoice === carriage.emoji) {
      // Attempt to place on train
      const mockGestureState = {
        moveX: trainZoneLayout.x + trainZoneLayout.width / 2,
        moveY: trainZoneLayout.y + trainZoneLayout.height / 2,
        dx: 0,
        dy: -100,
        vx: 0,
        vy: 0,
        numberActiveTouches: 1,
      } as PanResponderGestureState;
      handleCarriageDrop(carriage, mockGestureState);
      setSelectedChoice(null);
    } else {
      setSelectedChoice(carriage.emoji);
      Animated.sequence([
        Animated.timing(carriage.scale, {
          toValue: 1.15,
          duration: 100,
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.spring(carriage.scale, {
          toValue: 1.1,
          useNativeDriver: Platform.OS !== 'web',
        }),
      ]).start();
    }
  }, [isProcessing, selectedChoice, trainZoneLayout, handleCarriageDrop]);

  const milestoneMessage = useMemo(() => {
    const messages = t('games.patternTrain.milestone.messages', { returnObjects: true }) as string[];
    if (Array.isArray(messages) && messages.length > 0) {
      const index = Math.floor(Math.random() * messages.length);
      return messages[index];
    }
    return t('games.patternTrain.milestone.default');
  }, [completedRounds, t]);

  const handleMilestoneContinue = useCallback(() => {
    setShowMilestoneModal(false);
    startNewRound();
  }, [startNewRound]);

  return (
    <AppScreen>
      <AppHeader
        title={t('games.patternTrain.title')}
        onBack={() => navigation.goBack()}
      />

      <View style={styles.content}>
        <Text style={styles.subtitle} accessibilityRole="header">
          {t('games.patternTrain.subtitle')}
        </Text>

        <Text style={styles.meta}>
          {settings.difficulty === 'easy' ? t('games.patternTrain.difficulty.easy.label') : settings.difficulty === 'medium' ? t('games.patternTrain.difficulty.medium.label') : t('games.patternTrain.difficulty.hard.label')}
        </Text>

        {/* Train Zone */}
        <View
          ref={trainZoneRef}
          style={styles.trainZone}
          onLayout={measureTrainZone}
          accessibilityLabel={t('games.patternTrain.train.accessibilityLabel')}
          accessibilityRole="text"
        >
          <Animated.View
            style={[
              styles.trainContainer,
              { 
                transform: [{ translateX: trainPosition }],
                opacity: trainOpacity,
              },
            ]}
          >
            {/* Engine */}
            <View style={styles.trainPart}>
              <TrainEngine size={64} />
            </View>

            {/* Carriages */}
            {pattern?.carriages.map((carriage, index) => (
              <View key={index} style={styles.trainPart}>
                <Carriage
                  size={56}
                  isMissing={carriage.isMissing && !attachedCarriage}
                  isHighlighted={carriage.isMissing && !attachedCarriage}
                />
                {/* Show emoji for regular carriages or attached carriage */}
                {(!carriage.isMissing || attachedCarriage) && (
                  <View style={[styles.carriageContent, { top: '15%' }]}>
                    <Text style={[styles.emojiText, { fontSize: 22 }]}>
                      {carriage.isMissing ? attachedCarriage : carriage.emoji}
                    </Text>
                  </View>
                )}
              </View>
            ))}
          </Animated.View>
        </View>

        {/* Feedback */}
        <Animated.Text
          style={[
            styles.feedback,
            feedbackType === 'correct' && styles.feedbackCorrect,
            feedbackType === 'incorrect' && styles.feedbackIncorrect,
            feedbackType === 'reveal' && styles.feedbackReveal,
            { opacity: feedbackOpacity },
          ]}
          accessibilityLiveRegion="assertive"
          accessibilityRole="text"
        >
          {feedback}
        </Animated.Text>

        {/* Platform with draggable carriages */}
        <AppCard variant="elevated" style={styles.platformCard}>
          <Text style={styles.platformLabel}>
            {t('games.patternTrain.platform.label')}
          </Text>

          <View
            ref={platformRef}
            style={styles.platform}
            accessibilityLabel={t('games.patternTrain.platform.accessibilityLabel', { count: draggableCarriages.filter(c => c.isAvailable).length })}
          >
            {draggableCarriages.map((carriage, index) => {
              const panResponder = createPanResponder(carriage);
              const isSelected = selectedChoice === carriage.emoji;

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
                      zIndex: isSelected ? 100 : 10,
                    },
                    isSelected && styles.selectedCarriage,
                  ]}
                  {...panResponder.panHandlers}
                >
                  <TouchableOpacity
                    onPress={() => handleCarriageTap(carriage)}
                    disabled={!carriage.isAvailable || isProcessing}
                    accessibilityLabel={t('games.patternTrain.carriage.accessibilityLabel', { emoji: carriage.emoji })}
                    accessibilityHint={t('games.patternTrain.carriage.accessibilityHint')}
                    style={styles.carriageButton}
                  >
                    <Carriage
                      content={carriage.emoji}
                      size={64}
                      isHighlighted={isSelected}
                    />
                  </TouchableOpacity>
                </Animated.View>
              );
            })}
          </View>

          <Text style={styles.instructions}>
            {t('games.patternTrain.instructions')}
          </Text>
        </AppCard>

        {/* Stats */}
        <Text
          style={styles.meta}
          accessibilityLabel={t('games.patternTrain.roundsAccessibilityLabel', { count: completedRounds })}
        >
          {t('games.patternTrain.completedRounds')}: {completedRounds}
        </Text>
      </View>

      {/* Difficulty Selector Modal */}
      <AppModal
        visible={showDifficultySelector}
        onClose={handleCloseDifficultyModal}
        title={t('games.patternTrain.title')}
        showClose
        closeLabel={t('common.cancel')}
      >
        <Text style={styles.modalSubtitle}>
          {t('difficulty.title')}
          {settings.difficulty && ` (${t('games.memorySnap.lastUsed')}: ${getDifficultyLabel(settings.difficulty)})`}
        </Text>
        <View style={styles.optionsList}>
          {difficultyOptions.map(({ value, label }) => (
            <AppButton
              key={value}
              label={label}
              variant={settings.difficulty === value ? 'primary' : 'ghost'}
              size="md"
              fullWidth
              onPress={() => handleDifficultySelect(value)}
              style={{ marginBottom: Space.sm }}
              accessibilityLabel={`${label} difficulty`}
            />
          ))}
        </View>
      </AppModal>

      {/* Milestone Modal */}
      <AppModal
        visible={showMilestoneModal}
        title={t('games.patternTrain.milestone.title', { count: completedRounds })}
        onClose={() => undefined}
        showClose={false}
        dismissOnBackdropPress={false}
      >
        <Text style={styles.milestoneText} accessibilityRole="text">
          {milestoneMessage}
        </Text>
        <Text style={styles.milestoneCount} accessibilityRole="text">
          {t('games.patternTrain.milestone.rounds', { count: completedRounds })}
        </Text>
        <AppButton
          label={t('games.patternTrain.milestone.continue')}
          variant="primary"
          onPress={handleMilestoneContinue}
          accessibilityHint={t('games.patternTrain.milestone.continueHint')}
        />
      </AppModal>
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
    meta: {
      ...TypeStyle.label,
      color: colors.text,
      marginBottom: Space.sm,
    },
    trainZone: {
      width: '100%',
      height: 100,
      justifyContent: 'center',
      alignItems: 'center',
      marginVertical: Space.md,
      overflow: 'hidden',
    },
    trainContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: Space.md,
    },
    trainPart: {
      flexDirection: 'row',
      alignItems: 'center',
      position: 'relative',
    },
    carriageContent: {
      position: 'absolute',
      top: '20%',
      left: 0,
      right: 0,
      alignItems: 'center',
      justifyContent: 'center',
    },
    emojiText: {
      fontSize: 28,
    },
    feedback: {
      ...TypeStyle.bodySm,
      color: colors.textLight,
      textAlign: 'center',
      marginVertical: Space.sm,
      minHeight: 24,
    },
    feedbackCorrect: {
      color: colors.success,
      fontWeight: '600',
    },
    feedbackIncorrect: {
      color: colors.danger,
    },
    feedbackReveal: {
      color: colors.text,
      fontStyle: 'italic',
    },
    platformCard: {
      width: '100%',
      marginVertical: Space.base,
      alignItems: 'center',
    },
    platformLabel: {
      ...TypeStyle.label,
      color: colors.textLight,
      marginBottom: Space.sm,
    },
    platform: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'center',
      gap: Space.base,
      padding: Space.sm,
      minHeight: 80,
    },
    draggableCarriage: {
      zIndex: 10,
    },
    selectedCarriage: {
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.5,
      shadowRadius: 8,
      elevation: 8,
    },
    carriageButton: {
      padding: 0,
      backgroundColor: 'transparent',
    },
    instructions: {
      ...TypeStyle.bodySm,
      color: colors.textLight,
      textAlign: 'center',
      marginTop: Space.sm,
      fontStyle: 'italic',
    },
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
    modalSubtitle: {
      ...TypeStyle.bodySm,
      color: colors.textLight,
      textAlign: 'center',
      marginBottom: Space.base,
    },
    optionsList: {
      marginBottom: Space.sm,
    },
  });
