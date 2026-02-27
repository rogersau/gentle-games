import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, PanResponder, StyleSheet, Text, View } from 'react-native';
import { CategoryMatchCategory, CategoryMatchItem, ThemeColors } from '../types';
import { createCategoryMatchRound, isCategoryMatchCorrect } from '../utils/categoryMatchLogic';
import { ResolvedThemeMode, useThemeColors } from '../utils/theme';

interface CategoryMatchBoardProps {
  width: number;
  height: number;
  onCorrectMatch?: (item: CategoryMatchItem, category: CategoryMatchCategory) => void;
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
}) => {
  const { colors, resolvedMode } = useThemeColors();
  const styles = useMemo(() => createStyles(colors, resolvedMode), [colors, resolvedMode]);
  const [round, setRound] = useState(() => createCategoryMatchRound());
  const [feedback, setFeedback] = useState<Feedback>(null);
  const dragPosition = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
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
    [boardPadding, round.categories, zoneHeight, zoneTop, zoneWidth, zoneGap]
  );

  useEffect(
    () => () => {
      if (feedbackTimerRef.current) {
        clearTimeout(feedbackTimerRef.current);
      }
    },
    []
  );

  const snapTokenBack = () => {
    dragPosition.setValue({ x: 0, y: 0 });
  };

  const springTokenBack = () => {
    Animated.spring(dragPosition, {
      toValue: { x: 0, y: 0 },
      friction: 7,
      tension: 80,
      useNativeDriver: true,
    }).start();
  };

  const showFeedback = (message: string, isSuccess: boolean) => {
    setFeedback({ message, isSuccess });
    if (feedbackTimerRef.current) {
      clearTimeout(feedbackTimerRef.current);
    }
    feedbackTimerRef.current = setTimeout(() => {
      setFeedback(null);
      feedbackTimerRef.current = null;
    }, FEEDBACK_DURATION_MS);
  };

  const getDropTarget = (x: number, y: number): DropZone | undefined =>
    zones.find(
      (zone) =>
        x >= zone.x &&
        x <= zone.x + zone.width &&
        y >= zone.y &&
        y <= zone.y + zone.height
    );

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderMove: (_, gestureState) => {
          dragPosition.setValue({ x: gestureState.dx, y: gestureState.dy });
        },
        onPanResponderRelease: (_, gestureState) => {
          const dropX = tokenCenterX + gestureState.dx;
          const dropY = tokenCenterY + gestureState.dy;
          const droppedZone = getDropTarget(dropX, dropY);

          if (!droppedZone) {
            springTokenBack();
            return;
          }

          if (isCategoryMatchCorrect(round.item, droppedZone.category)) {
            const matchedItem = round.item;
            snapTokenBack();
            showFeedback('Great match!', true);
            setRound((previousRound) => createCategoryMatchRound(previousRound.item));
            onCorrectMatch?.(matchedItem, droppedZone.category);
          } else {
            showFeedback('Try a different category', false);
            springTokenBack();
          }
        },
        onPanResponderTerminate: () => {
          springTokenBack();
        },
      }),
    [dragPosition, onCorrectMatch, round.item, tokenCenterX, tokenCenterY, zones]
  );

  return (
    <View style={[styles.container, { width, height }]}>
      <Text style={styles.promptText}>Drag to the matching category</Text>

      <Animated.View
        testID="category-draggable-token"
        style={[
          styles.draggableToken,
          {
            left: tokenStartX,
            top: tokenStartY,
            width: tokenSize,
            height: tokenSize,
            transform: dragPosition.getTranslateTransform(),
          },
        ]}
        {...panResponder.panHandlers}
      >
        <Text style={[styles.emojiText, { fontSize: Math.floor(tokenSize * 0.5) }]}>
          {round.item.emoji}
        </Text>
      </Animated.View>

      {feedback && (
        <Text
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
          <View key={zone.category} style={[styles.zoneCard, { width: zone.width, height: zone.height }]}>
            <Text style={styles.zoneIcon}>{zone.icon}</Text>
            <Text style={styles.zoneLabel}>{zone.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
};

const createStyles = (colors: ThemeColors, resolvedMode: ResolvedThemeMode) =>
  StyleSheet.create({
    container: {
      borderRadius: 18,
      overflow: 'hidden',
      backgroundColor: colors.surfaceGame,
      borderWidth: 2,
      borderColor: colors.cardBack,
    },
    promptText: {
      marginTop: 12,
      textAlign: 'center',
      color: resolvedMode === 'dark' ? colors.text : colors.textLight,
      fontSize: 14,
      fontWeight: '500',
    },
    draggableToken: {
      position: 'absolute',
      borderRadius: 20,
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
      fontSize: 16,
      fontWeight: '700',
    },
    errorText: {
      textAlign: 'center',
      color: resolvedMode === 'dark' ? colors.secondary : '#B76A7C',
      fontSize: 16,
      fontWeight: '700',
    },
    zoneRow: {
      position: 'absolute',
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    zoneCard: {
      borderRadius: 16,
      borderWidth: 2,
      borderColor: colors.cardBack,
      backgroundColor: colors.cardFront,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 8,
    },
    zoneIcon: {
      fontSize: 30,
      marginBottom: 6,
    },
    zoneLabel: {
      color: resolvedMode === 'dark' ? colors.background : colors.text,
      fontSize: 16,
      fontWeight: '600',
      textAlign: 'center',
    },
  });

