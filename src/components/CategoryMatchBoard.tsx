import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Animated,
  PanResponder,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type {
  CategoryMatchCategory,
  CategoryMatchCategoryCount,
  CategoryMatchItem,
  ThemeColors,
} from '../types';
import { createCategoryMatchRound, isCategoryMatchCorrect } from '../utils/categoryMatchLogic';
import { ResolvedThemeMode, useThemeColors } from '../utils/theme';
import { useSettings } from '../context/SettingsContext';
import { useAnimationEnabled } from '../ui/animations';
import { playMatchSound } from '../utils/sounds';
import { Radius, Space, TypeStyle } from '../ui/tokens';
import { useTranslation } from 'react-i18next';
import { createGuidedRoundController, GuidedRoundState } from '../guided-practice/controller';
import { GuidedPracticePrompt } from '../ui/components/GuidedPracticePrompt';
import { AppButton } from '../ui/components';

interface CategoryMatchBoardProps {
  width: number;
  height: number;
  categoryCount?: CategoryMatchCategoryCount;
  onCorrectMatch?: (item: CategoryMatchItem, category: CategoryMatchCategory) => void;
  onIncorrectMatch?: () => void;
}

interface DropZone {
  category: CategoryMatchCategory;
  label: string;
  icon: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export const CategoryMatchBoard: React.FC<CategoryMatchBoardProps> = ({
  width,
  height,
  categoryCount = 2,
  onCorrectMatch,
  onIncorrectMatch,
}) => {
  const { settings } = useSettings();
  const animationsEnabled = useAnimationEnabled();
  const { t } = useTranslation();
  const translate = t as unknown as (key: string, options?: Record<string, unknown>) => string;
  const { colors, resolvedMode } = useThemeColors();
  const styles = useMemo(() => createStyles(colors, resolvedMode), [colors, resolvedMode]);
  const controllerRef = useRef(createGuidedRoundController({ hintAfter: 1, modelAfter: 2 }));
  const answerLockRef = useRef(false);
  const [guidedRound, setGuidedRound] = useState<GuidedRoundState>(() =>
    controllerRef.current.getState(),
  );
  const [round, setRound] = useState(() =>
    createCategoryMatchRound(undefined, 0, Math.random, categoryCount),
  );
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isTokenSelected, setIsTokenSelected] = useState(false);
  const [activeDropCategory, setActiveDropCategory] = useState<CategoryMatchCategory | null>(null);
  const activeDropCategoryRef = useRef<CategoryMatchCategory | null>(null);
  const dragPosition = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const tokenScale = useRef(new Animated.Value(1)).current;

  const boardPadding = 12;
  const zoneGap = 10;
  const zoneHeight = Math.max(90, Math.min(130, Math.floor(height * 0.29)));
  const tokenSize = Math.max(72, Math.min(104, Math.floor(width * 0.24)));
  const tokenStartX = (width - tokenSize) / 2;
  const zoneTop = height - zoneHeight - boardPadding;
  const tokenStartY = Math.min(286, Math.max(190, zoneTop - tokenSize - Space.lg));
  const tokenCenterX = tokenStartX + tokenSize / 2;
  const tokenCenterY = tokenStartY + tokenSize / 2;
  const zoneWidth = (width - boardPadding * 2 - zoneGap * (categoryCount - 1)) / categoryCount;

  const zones: DropZone[] = useMemo(
    () =>
      round.categories.map((category, index) => ({
        category: category.id,
        label: translate(`games.categoryMatch.categories.${category.id}`),
        icon: category.icon,
        x: boardPadding + index * (zoneWidth + zoneGap),
        y: zoneTop,
        width: zoneWidth,
        height: zoneHeight,
      })),
    [round.categories, translate, zoneWidth, zoneTop, zoneHeight],
  );

  const itemLabel = translate(`games.categoryMatch.items.${round.item.name}`, {
    defaultValue: round.item.name,
  });
  const categoryLabel = translate(`games.categoryMatch.categories.${round.item.category}`);
  const instruction = t('games.categoryMatch.sortingInstruction', {
    categories: zones.map((zone) => zone.label).join(', '),
  });
  const roundFinished = guidedRound.phase === 'corrected' || guidedRound.phase === 'skipped';

  useEffect(() => {
    answerLockRef.current = false;
  }, [guidedRound]);

  const announce = useCallback((message: string) => {
    setFeedback(message);
    try {
      void AccessibilityInfo.announceForAccessibility(message);
    } catch {
      // Native accessibility announcements are not available on every host.
    }
  }, []);

  const springTokenBack = useCallback(() => {
    if (animationsEnabled) {
      Animated.spring(dragPosition, {
        toValue: { x: 0, y: 0 },
        friction: 7,
        tension: 80,
        useNativeDriver: Platform.OS !== 'web',
      }).start();
    } else {
      dragPosition.setValue({ x: 0, y: 0 });
    }
  }, [animationsEnabled, dragPosition]);

  const pulseToken = useCallback(() => {
    if (animationsEnabled) {
      Animated.sequence([
        Animated.timing(tokenScale, {
          toValue: 1.08,
          duration: 90,
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.timing(tokenScale, {
          toValue: 1,
          duration: 120,
          useNativeDriver: Platform.OS !== 'web',
        }),
      ]).start();
    } else {
      tokenScale.setValue(1);
    }
  }, [animationsEnabled, tokenScale]);

  const getDropTarget = useCallback(
    (x: number, y: number): DropZone | undefined =>
      zones.find(
        (zone) =>
          x >= zone.x && x <= zone.x + zone.width && y >= zone.y && y <= zone.y + zone.height,
      ),
    [zones],
  );

  // Tap, keyboard activation, and drag release all call this same answer path.
  const answerCategory = useCallback(
    (category: CategoryMatchCategory) => {
      if (
        answerLockRef.current ||
        guidedRound.phase === 'corrected' ||
        guidedRound.phase === 'skipped'
      ) {
        return;
      }
      answerLockRef.current = true;

      const isCorrect = isCategoryMatchCorrect(round.item, category);
      const nextState = controllerRef.current.attempt(isCorrect);
      setGuidedRound(nextState);
      setIsTokenSelected(false);
      dragPosition.setValue({ x: 0, y: 0 });

      if (isCorrect) {
        announce(
          t('games.categoryMatch.correctFeedback', {
            item: itemLabel,
            category: categoryLabel,
          }),
        );
        void playMatchSound(settings);
        pulseToken();
        onCorrectMatch?.(round.item, category);
      } else {
        announce(
          t('games.categoryMatch.incorrectFeedback', {
            item: itemLabel,
            chosenCategory: translate(`games.categoryMatch.categories.${category}`),
            correctCategory: categoryLabel,
          }),
        );
        onIncorrectMatch?.();
        springTokenBack();
      }
    },
    [
      announce,
      categoryLabel,
      dragPosition,
      guidedRound.phase,
      itemLabel,
      onCorrectMatch,
      onIncorrectMatch,
      pulseToken,
      round.item,
      settings,
      springTokenBack,
      t,
      translate,
    ],
  );

  const handleNextRound = useCallback(() => {
    if (guidedRound.phase !== 'corrected' && guidedRound.phase !== 'skipped') return;
    const nextState = controllerRef.current.startNextExample();
    setGuidedRound(nextState);
    setRound((previousRound) =>
      createCategoryMatchRound(
        previousRound.item,
        nextState.exampleNumber,
        Math.random,
        categoryCount,
      ),
    );
    setFeedback(null);
    setIsTokenSelected(false);
    answerLockRef.current = false;
  }, [categoryCount, guidedRound.phase]);

  const handleHint = useCallback(() => {
    setGuidedRound(controllerRef.current.showHint());
  }, []);

  const handleReplay = useCallback(() => {
    setGuidedRound(controllerRef.current.replayInstructions());
    announce(instruction);
  }, [announce, instruction]);

  const handleSkip = useCallback(() => {
    const nextState = controllerRef.current.skip();
    setGuidedRound(nextState);
    setIsTokenSelected(false);
    announce(t('games.categoryMatch.skippedFeedback', { item: itemLabel }));
    springTokenBack();
  }, [announce, itemLabel, springTokenBack, t]);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => false,
        onMoveShouldSetPanResponder: (_, gestureState) =>
          Math.abs(gestureState.dx) > 8 || Math.abs(gestureState.dy) > 8,
        onPanResponderMove: (_, gestureState) => {
          dragPosition.setValue({ x: gestureState.dx, y: gestureState.dy });
          const hoveredZone = getDropTarget(
            tokenCenterX + gestureState.dx,
            tokenCenterY + gestureState.dy,
          );
          const nextActive = hoveredZone?.category ?? null;
          if (nextActive !== activeDropCategoryRef.current) {
            activeDropCategoryRef.current = nextActive;
            setActiveDropCategory(nextActive);
          }
        },
        onPanResponderRelease: (_, gestureState) => {
          const droppedZone = getDropTarget(
            tokenCenterX + gestureState.dx,
            tokenCenterY + gestureState.dy,
          );
          activeDropCategoryRef.current = null;
          setActiveDropCategory(null);
          if (!droppedZone) {
            springTokenBack();
            return;
          }
          answerCategory(droppedZone.category);
        },
        onPanResponderTerminate: () => {
          activeDropCategoryRef.current = null;
          setActiveDropCategory(null);
          springTokenBack();
        },
      }),
    [answerCategory, dragPosition, getDropTarget, springTokenBack, tokenCenterX, tokenCenterY],
  );

  return (
    <View style={[styles.container, { width, height }]} testID='category-match-board'>
      <GuidedPracticePrompt
        state={guidedRound}
        instruction={instruction}
        hint={t('games.categoryMatch.hint')}
        model={
          <Text
            style={styles.modelText}
            accessibilityLabel={t('games.categoryMatch.modelAccessibilityLabel', {
              item: itemLabel,
              category: categoryLabel,
            })}
          >
            {t('games.categoryMatch.model', { item: itemLabel, category: categoryLabel })}
          </Text>
        }
        replayLabel={t('games.categoryMatch.replay')}
        skipLabel={t('games.categoryMatch.skip')}
        onReplay={handleReplay}
        onHint={handleHint}
        hintLabel={t('games.categoryMatch.showHint')}
        onSkip={handleSkip}
      />
      <Text style={styles.interactionText}>{t('games.categoryMatch.interactionInstruction')}</Text>

      {feedback ? (
        <Text
          testID='category-match-feedback'
          accessibilityRole='text'
          accessibilityLiveRegion='polite'
          style={styles.feedback}
        >
          {feedback}
        </Text>
      ) : null}

      <Pressable
        testID='category-draggable-token'
        accessibilityRole='button'
        accessibilityLabel={t('games.categoryMatch.itemAccessibilityLabel', { item: itemLabel })}
        accessibilityHint={t('games.categoryMatch.selectItemHint')}
        accessibilityState={{
          selected: isTokenSelected,
          disabled: roundFinished,
        }}
        disabled={roundFinished}
        onPress={() => setIsTokenSelected(true)}
        style={{
          position: 'absolute',
          left: tokenStartX,
          top: tokenStartY,
          width: tokenSize,
          height: tokenSize,
        }}
        {...panResponder.panHandlers}
      >
        <Animated.View
          style={[
            styles.draggableToken,
            {
              width: '100%',
              height: '100%',
              transform: [...dragPosition.getTranslateTransform(), { scale: tokenScale }],
            },
          ]}
        >
          <Text style={[styles.emojiText, { fontSize: Math.floor(tokenSize * 0.5) }]}>
            {round.item.emoji}
          </Text>
        </Animated.View>
      </Pressable>

      {!roundFinished ? (
        <View style={[styles.zoneRow, { top: zoneTop, left: boardPadding, right: boardPadding }]}>
          {zones.map((zone) => (
            <Pressable
              key={zone.category}
              onPress={() => {
                if (!isTokenSelected) {
                  announce(t('games.categoryMatch.selectItemFirst'));
                  return;
                }
                answerCategory(zone.category);
              }}
              accessibilityRole='button'
              accessibilityLabel={t('games.categoryMatch.categoryAccessibilityLabel', {
                category: zone.label,
              })}
              accessibilityHint={t('games.categoryMatch.categoryActivationHint')}
              accessibilityState={{ disabled: roundFinished }}
              disabled={roundFinished}
              testID={`category-zone-${zone.category}`}
              style={[
                styles.zoneCard,
                { width: zone.width, height: zone.height },
                activeDropCategory === zone.category ? styles.zoneCardActive : undefined,
              ]}
            >
              <Text style={styles.zoneIcon}>{zone.icon}</Text>
              <Text style={styles.zoneLabel}>{zone.label}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}

      {roundFinished ? (
        <AppButton
          label={t('games.categoryMatch.next')}
          onPress={handleNextRound}
          testID='category-match-next'
          accessibilityHint={t('games.categoryMatch.nextHint')}
          fullWidth
          style={styles.nextButton}
        />
      ) : null}
    </View>
  );
};

const createStyles = (colors: ThemeColors, resolvedMode: ResolvedThemeMode) =>
  StyleSheet.create({
    container: {
      borderRadius: Radius.xl,
      overflow: 'hidden',
      backgroundColor: colors.surfaceGame,
      borderWidth: 2,
      borderColor: colors.cardBack,
      padding: Space.sm,
    },
    modelText: {
      ...TypeStyle.bodySm,
      color: colors.text,
      textAlign: 'center',
    },
    interactionText: {
      ...TypeStyle.bodySm,
      color: colors.textLight,
      textAlign: 'center',
      marginTop: Space.xs,
    },
    feedback: {
      ...TypeStyle.bodySm,
      color: colors.text,
      textAlign: 'center',
      marginTop: Space.xs,
    },
    draggableToken: {
      borderRadius: Radius.xl,
      backgroundColor: colors.cardFront,
      borderWidth: 2,
      borderColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 2,
      elevation: 2,
    },
    emojiText: { textAlign: 'center' },
    zoneRow: {
      position: 'absolute',
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    zoneCard: {
      borderRadius: Radius.lg,
      borderWidth: 2,
      borderColor: colors.cardBack,
      backgroundColor: colors.cardFront,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: Space.xs,
    },
    zoneCardActive: {
      borderColor: colors.primary,
      backgroundColor: resolvedMode === 'dark' ? colors.primary : colors.matched,
    },
    zoneIcon: { fontSize: 30, marginBottom: Space.xxs },
    zoneLabel: {
      color: resolvedMode === 'dark' ? colors.background : colors.text,
      ...TypeStyle.button,
      textAlign: 'center',
    },
    nextButton: { position: 'absolute', left: Space.md, right: Space.md, bottom: Space.sm },
  });
