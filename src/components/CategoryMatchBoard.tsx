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
import { CategoryMatchCategory, CategoryMatchItem, ThemeColors } from '../types';
import { createCategoryMatchRound, isCategoryMatchCorrect } from '../utils/categoryMatchLogic';
import { ResolvedThemeMode, useThemeColors } from '../utils/theme';
import { useSettings } from '../context/SettingsContext';
import { useAnimationEnabled } from '../ui/animations';
import { playFlipSound, playMatchSound } from '../utils/sounds';
import { Radius, Space, TypeStyle } from '../ui/tokens';
import { useTranslation } from 'react-i18next';

interface CategoryMatchBoardProps {
  width: number;
  height: number;
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

type Feedback = { message: string; isSuccess: boolean } | null;

const FEEDBACK_DURATION_MS = 850;

export const CategoryMatchBoard: React.FC<CategoryMatchBoardProps> = ({
  width,
  height,
  onCorrectMatch,
  onIncorrectMatch,
}) => {
  const { settings } = useSettings();
  const animationsEnabled = useAnimationEnabled();
  const { t } = useTranslation();
  const { colors, resolvedMode } = useThemeColors();
  const styles = useMemo(() => createStyles(colors, resolvedMode), [colors, resolvedMode]);
  const [round, setRound] = useState(() => createCategoryMatchRound(undefined, 0));
  const [, setRoundsCompleted] = useState(0);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [isTokenSelected, setIsTokenSelected] = useState(false);
  const [activeDropCategory, setActiveDropCategory] = useState<CategoryMatchCategory | null>(null);
  const activeDropCategoryRef = useRef<CategoryMatchCategory | null>(null);
  const dragPosition = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const tokenScale = useRef(new Animated.Value(1)).current;
  const feedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const boardPadding = 12;
  const zoneGap = 10;
  const tokenSize = Math.max(72, Math.min(104, Math.floor(width * 0.24)));
  const tokenStartX = (width - tokenSize) / 2;
  const tokenStartY = Math.max(20, Math.floor(height * 0.14));
  const tokenCenterX = tokenStartX + tokenSize / 2;
  const tokenCenterY = tokenStartY + tokenSize / 2;

  const zoneHeight = Math.max(90, Math.min(130, Math.floor(height * 0.29)));
  const zoneTop = height - zoneHeight - boardPadding;
  const zoneWidth = (width - boardPadding * 2 - zoneGap * 2) / 3;

  const zones: DropZone[] = useMemo(
    () =>
      round.categories.map((category, index) => ({
        category: category.id,
        label: category.label,
        icon: category.icon,
        x: boardPadding + index * (zoneWidth + zoneGap),
        y: zoneTop,
        width: zoneWidth,
        height: zoneHeight,
      })),
    [boardPadding, round.categories, zoneHeight, zoneTop, zoneWidth, zoneGap],
  );

  useEffect(
    () => () => {
      if (feedbackTimerRef.current) {
        clearTimeout(feedbackTimerRef.current);
      }
    },
    [],
  );

  const snapTokenBack = () => {
    dragPosition.setValue({ x: 0, y: 0 });
  };

  const springTokenBack = () => {
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
  };

  const showFeedback = (message: string, isSuccess: boolean) => {
    setFeedback({ message, isSuccess });
    try {
      void AccessibilityInfo.announceForAccessibility(message);
    } catch {
      // Some hosts do not provide native accessibility announcements.
    }
    if (feedbackTimerRef.current) {
      clearTimeout(feedbackTimerRef.current);
    }
    feedbackTimerRef.current = setTimeout(() => {
      setFeedback(null);
      feedbackTimerRef.current = null;
    }, FEEDBACK_DURATION_MS);
  };

  const playCorrectPulse = () => {
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
  };

  const getDropTarget = useCallback(
    (x: number, y: number): DropZone | undefined =>
      zones.find(
        (zone) =>
          x >= zone.x && x <= zone.x + zone.width && y >= zone.y && y <= zone.y + zone.height,
      ),
    [zones],
  );

  const handleCategoryAnswer = useCallback(
    (category: CategoryMatchCategory) => {
      if (isCategoryMatchCorrect(round.item, category)) {
        const matchedItem = round.item;
        snapTokenBack();
        setIsTokenSelected(false);
        showFeedback(t('games.categoryMatch.greatMatch'), true);
        void playMatchSound(settings);
        playCorrectPulse();
        setRoundsCompleted((previousCount) => {
          const nextCount = previousCount + 1;
          setRound((previousRound) => createCategoryMatchRound(previousRound.item, nextCount));
          return nextCount;
        });
        onCorrectMatch?.(matchedItem, category);
      } else {
        showFeedback(t('games.categoryMatch.tryDifferent'), false);
        void playFlipSound(settings);
        onIncorrectMatch?.();
        springTokenBack();
      }
    },
    [onCorrectMatch, onIncorrectMatch, round.item, settings, t],
  );

  const handleTokenPress = useCallback(() => {
    setIsTokenSelected(true);
    showFeedback(t('games.categoryMatch.itemSelected', { item: round.item.name }), true);
  }, [round.item.name, t]);

  const handleCategoryPress = useCallback(
    (category: CategoryMatchCategory) => {
      if (!isTokenSelected) {
        showFeedback(t('games.categoryMatch.selectItemFirst'), false);
        return;
      }
      handleCategoryAnswer(category);
    },
    [handleCategoryAnswer, isTokenSelected, t],
  );

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => false,
        onMoveShouldSetPanResponder: (_, gestureState) =>
          Math.abs(gestureState.dx) > 8 || Math.abs(gestureState.dy) > 8,
        onPanResponderMove: (_, gestureState) => {
          dragPosition.setValue({ x: gestureState.dx, y: gestureState.dy });
          const hoverX = tokenCenterX + gestureState.dx;
          const hoverY = tokenCenterY + gestureState.dy;
          const hoveredZone = getDropTarget(hoverX, hoverY);
          const nextActive = hoveredZone?.category ?? null;
          if (nextActive !== activeDropCategoryRef.current) {
            activeDropCategoryRef.current = nextActive;
            setActiveDropCategory(nextActive);
          }
        },
        onPanResponderRelease: (_, gestureState) => {
          const dropX = tokenCenterX + gestureState.dx;
          const dropY = tokenCenterY + gestureState.dy;
          const droppedZone = getDropTarget(dropX, dropY);
          activeDropCategoryRef.current = null;
          setActiveDropCategory(null);

          if (!droppedZone) {
            springTokenBack();
            return;
          }
          handleCategoryAnswer(droppedZone.category);
        },
        onPanResponderTerminate: () => {
          activeDropCategoryRef.current = null;
          setActiveDropCategory(null);
          springTokenBack();
        },
      }),
    [dragPosition, getDropTarget, handleCategoryAnswer, tokenCenterX, tokenCenterY],
  );

  return (
    <View
      style={[styles.container, { width, height }]}
      accessibilityLabel={t('games.categoryMatch.accessibilityLabel')}
    >
      <Text style={styles.promptText} accessibilityRole='text'>
        {isTokenSelected
          ? t('games.categoryMatch.selectionInstruction')
          : t('games.categoryMatch.interactionInstruction')}
      </Text>

      <Pressable
        testID='category-draggable-token'
        accessibilityRole='button'
        accessibilityLabel={t('games.categoryMatch.itemAccessibilityLabel', {
          item: round.item.name,
        })}
        accessibilityHint={
          isTokenSelected
            ? t('games.categoryMatch.selectedItemHint')
            : t('games.categoryMatch.selectItemHint')
        }
        accessibilityState={{ selected: isTokenSelected }}
        onPress={handleTokenPress}
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
              position: 'absolute',
              left: 0,
              top: 0,
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

      {feedback && (
        <Text
          accessibilityRole='text'
          accessibilityLiveRegion='polite'
          importantForAccessibility='yes'
          style={[
            feedback.isSuccess ? styles.successText : styles.errorText,
            { marginTop: tokenStartY + tokenSize - 12 },
          ]}
        >
          {feedback.message}
        </Text>
      )}

      <View style={[styles.zoneRow, { top: zoneTop, left: boardPadding, right: boardPadding }]}>
        {zones.map((zone) => (
          <Pressable
            key={zone.category}
            onPress={() => handleCategoryPress(zone.category)}
            accessibilityRole='button'
            accessibilityLabel={t('games.categoryMatch.categoryAccessibilityLabel', {
              category: zone.label,
            })}
            accessibilityHint={
              isTokenSelected
                ? t('games.categoryMatch.categoryActivationHint')
                : t('games.categoryMatch.categorySelectFirstHint')
            }
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
    },
    promptText: {
      marginTop: Space.sm,
      textAlign: 'center',
      color: resolvedMode === 'dark' ? colors.text : colors.textLight,
      ...TypeStyle.bodySm,
    },
    draggableToken: {
      position: 'absolute',
      borderRadius: Radius.xl,
      backgroundColor: colors.cardFront,
      borderWidth: 2,
      borderColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 2,
      elevation: 2,
    },
    emojiText: {
      textAlign: 'center',
    },
    successText: {
      textAlign: 'center',
      color: colors.success,
      ...TypeStyle.button,
    },
    errorText: {
      textAlign: 'center',
      color: resolvedMode === 'dark' ? colors.secondary : '#B76A7C',
      ...TypeStyle.button,
    },
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
    zoneIcon: {
      fontSize: 30,
      marginBottom: Space.xxs,
    },
    zoneLabel: {
      color: resolvedMode === 'dark' ? colors.background : colors.text,
      ...TypeStyle.button,
      textAlign: 'center',
    },
  });
