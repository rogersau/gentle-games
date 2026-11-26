import React, { useCallback, useMemo, useRef, useState } from 'react';
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
import { GamePicture } from '../ui/components/GamePicture';
import type { GestureResponderEvent, LayoutRectangle, ViewStyle } from 'react-native';
import { useTranslation } from 'react-i18next';
import type {
  CategoryMatchCategory,
  CategoryMatchCategoryCount,
  CategoryMatchPack,
  CategoryMatchItem,
  ThemeColors,
} from '../types';
import { createCategoryMatchRound, isCategoryMatchCorrect } from '../utils/categoryMatchLogic';
import { useThemeColors } from '../utils/theme';
import type { ResolvedThemeMode } from '../utils/theme';
import { useSettings } from '../context/SettingsContext';
import { useAnimationEnabled } from '../ui/animations';
import { playMatchSound } from '../utils/sounds';
import { Radius, Space, TypeStyle } from '../ui/tokens';
import { createGuidedRoundController } from '../guided-practice/controller';
import { GuidedPracticePrompt } from '../ui/components/GuidedPracticePrompt';
import { ControlIcon } from '../ui/components/ControlIcon';
import { webGameDragSurface } from '../utils/pwaInteractionGuards';
import { AppButton } from '../ui/components';

interface CategoryMatchBoardProps {
  renderShell?: (
    prompt: string,
    action: React.ReactNode,
    board: React.ReactNode,
    more?: (close: () => void) => React.ReactNode,
  ) => React.ReactNode;
  width: number;
  height: number;
  pack?: CategoryMatchPack;
  categoryCount?: CategoryMatchCategoryCount;
  onCorrectMatch?: (item: CategoryMatchItem, category: CategoryMatchCategory) => void;
  onIncorrectMatch?: () => void;
}

interface DragStart {
  pageX: number;
  pageY: number;
  x: number;
  y: number;
  dragging: boolean;
}

const DRAG_THRESHOLD = 8;
const DRAG_HOME = { x: 0, y: 0 };
const webDragStyle = Platform.OS === 'web' ? ({ touchAction: 'none' } as ViewStyle) : undefined;

export const CategoryMatchBoard: React.FC<CategoryMatchBoardProps> = ({
  renderShell,
  width,
  height,
  categoryCount = 2,
  pack = 'everyday',
  onCorrectMatch,
  onIncorrectMatch,
}) => {
  const { settings } = useSettings();
  const animationsEnabled = useAnimationEnabled();
  const { t } = useTranslation();
  const { colors, resolvedMode } = useThemeColors();
  const styles = useMemo(() => createStyles(colors, resolvedMode), [colors, resolvedMode]);
  const [controller] = useState(() => createGuidedRoundController({ hintAfter: 1, modelAfter: 2 }));
  const [guidedRound, setGuidedRound] = useState(controller.getState);
  const [round, setRound] = useState(() =>
    createCategoryMatchRound(undefined, 0, Math.random, categoryCount, pack),
  );
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isTokenSelected, setIsTokenSelected] = useState(false);
  const [hoveredCategory, setHoveredCategory] = useState<CategoryMatchCategory | null>(null);
  const [dragPosition] = useState(() => new Animated.ValueXY(DRAG_HOME));
  const dragStart = useRef<DragStart | null>(null);
  const tokenLayout = useRef<LayoutRectangle | null>(null);
  const rowLayout = useRef<LayoutRectangle | null>(null);
  const zoneLayouts = useRef<Partial<Record<CategoryMatchCategory, LayoutRectangle>>>({});

  const tokenSize = Math.max(72, Math.min(104, Math.floor(width * 0.24)));
  const zoneMinHeight = Math.max(88, Math.min(110, Math.floor(height * 0.18)));
  const itemLabel = t(`games.categoryMatch.items.${round.item.name}`, {
    defaultValue: round.item.name,
  });
  const categoryLabel = t(`games.categoryMatch.categories.${round.item.category}`);
  const roundFinished = guidedRound.phase === 'corrected' || guidedRound.phase === 'skipped';

  const showFeedback = useCallback((message: string) => {
    setFeedback(message);
    if (Platform.OS === 'ios') {
      AccessibilityInfo.announceForAccessibility(message);
    }
  }, []);

  const resetDrag = useCallback(
    (animate: boolean) => {
      const wasDragging = dragStart.current?.dragging;
      dragStart.current = null;
      setHoveredCategory(null);
      if (animate && wasDragging && animationsEnabled) {
        Animated.timing(dragPosition, {
          toValue: DRAG_HOME,
          duration: 150,
          useNativeDriver: Platform.OS !== 'web',
        }).start();
      } else {
        dragPosition.setValue(DRAG_HOME);
      }
    },
    [animationsEnabled, dragPosition],
  );

  // Taps, keyboard activation and drag release share the same answer path.
  const answerCategory = useCallback(
    (category: CategoryMatchCategory) => {
      if (roundFinished || controller.getState() !== guidedRound) return;

      const isCorrect = isCategoryMatchCorrect(round.item, category);
      setGuidedRound(controller.attempt(isCorrect));
      setIsTokenSelected(false);
      resetDrag(!isCorrect);

      if (isCorrect) {
        showFeedback(
          t('games.categoryMatch.correctFeedback', { item: itemLabel, category: categoryLabel }),
        );
        void playMatchSound(settings);
        onCorrectMatch?.(round.item, category);
      } else {
        showFeedback(t('games.categoryMatch.incorrectFeedback'));
        onIncorrectMatch?.();
      }
    },
    [
      categoryLabel,
      controller,
      guidedRound,
      itemLabel,
      onCorrectMatch,
      onIncorrectMatch,
      resetDrag,
      round.item,
      roundFinished,
      settings,
      showFeedback,
      t,
    ],
  );

  const handleNextRound = () => {
    if (!roundFinished || controller.getState() !== guidedRound) return;
    const nextState = controller.startNextExample();
    setGuidedRound(nextState);
    setRound(
      createCategoryMatchRound(
        round.item,
        nextState.exampleNumber,
        Math.random,
        categoryCount,
        pack,
      ),
    );
    setFeedback(null);
  };

  const handleHint = () => {
    setGuidedRound(controller.showHint());
  };

  const handleReplay = () => {
    setGuidedRound(controller.replayInstructions());
    showFeedback(t('games.categoryMatch.sortingInstruction'));
  };

  const handleSkip = () => {
    if (roundFinished || controller.getState() !== guidedRound) return;
    setGuidedRound(controller.skip());
    setIsTokenSelected(false);
    resetDrag(false);
    showFeedback(t('games.categoryMatch.skippedFeedback', { item: itemLabel }));
  };

  const panResponder = useMemo(() => {
    const getDropCategory = (x: number, y: number) => {
      const row = rowLayout.current;
      if (!row) return null;
      return (
        round.categories.find(({ id }) => {
          const zone = zoneLayouts.current[id];
          if (!zone) return false;
          const zoneX = row.x + zone.x;
          const zoneY = row.y + zone.y;
          return x >= zoneX && x <= zoneX + zone.width && y >= zoneY && y <= zoneY + zone.height;
        })?.id ?? null
      );
    };

    const moveToken = ({ nativeEvent }: GestureResponderEvent) => {
      const start = dragStart.current;
      if (!start) return;
      start.dragging = true;
      const x = nativeEvent.pageX - start.pageX;
      const y = nativeEvent.pageY - start.pageY;
      dragPosition.setValue({ x, y });
      setHoveredCategory(getDropCategory(start.x + x, start.y + y));
    };

    return PanResponder.create({
      onStartShouldSetPanResponderCapture: ({ nativeEvent }) => {
        const layout = tokenLayout.current;
        if (nativeEvent.touches.length !== 1) {
          if (dragStart.current) resetDrag(true);
        } else if (!roundFinished && layout) {
          // The view stays in place while its picture moves. Capture the finger's
          // position in the play area before PanResponder takes over from the tap.
          dragStart.current = {
            pageX: nativeEvent.pageX,
            pageY: nativeEvent.pageY,
            x: layout.x + nativeEvent.locationX,
            y: layout.y + nativeEvent.locationY,
            dragging: false,
          };
        }
        return false;
      },
      onMoveShouldSetPanResponder: ({ nativeEvent }) => {
        const start = dragStart.current;
        return (
          !roundFinished &&
          !!start &&
          Math.hypot(nativeEvent.pageX - start.pageX, nativeEvent.pageY - start.pageY) >
            DRAG_THRESHOLD
        );
      },
      onPanResponderGrant: moveToken,
      onPanResponderMove: moveToken,
      onPanResponderStart: ({ nativeEvent }) => {
        if (nativeEvent.touches.length > 1) resetDrag(true);
      },
      onPanResponderRelease: ({ nativeEvent }) => {
        const start = dragStart.current;
        const category = start?.dragging
          ? getDropCategory(
              start.x + nativeEvent.pageX - start.pageX,
              start.y + nativeEvent.pageY - start.pageY,
            )
          : null;
        if (category) {
          answerCategory(category);
        } else {
          resetDrag(true);
        }
      },
      onPanResponderTerminate: () => resetDrag(true),
    });
  }, [answerCategory, dragPosition, resetDrag, round.categories, roundFinished]);

  const next = (
    <AppButton
      icon='next'
      label={t('games.categoryMatch.next')}
      onPress={handleNextRound}
      testID='category-match-next'
      accessibilityHint={t('games.categoryMatch.nextHint')}
    />
  );
  const action = roundFinished ? (
    next
  ) : guidedRound.phase === 'independent' ? (
    <AppButton
      icon='eye'
      label={t('games.categoryMatch.showHint')}
      variant='secondary'
      onPress={handleHint}
    />
  ) : null;
  const more = roundFinished
    ? undefined
    : (close: () => void) => (
        <>
          <AppButton
            label={t('games.categoryMatch.replay')}
            variant='ghost'
            onPress={() => {
              handleReplay();
              close();
            }}
          />
          <AppButton
            label={t('games.categoryMatch.skip')}
            variant='ghost'
            onPress={() => {
              handleSkip();
              close();
            }}
          />
        </>
      );
  const prompt = t('games.categoryMatch.interactionInstruction');
  const board = (
    <View style={[styles.container, { width }]} testID='category-match-board'>
      {!renderShell && <Text style={styles.instruction}>{prompt}</Text>}

      <View>
        <View
          {...(!roundFinished && webGameDragSurface)}
          testID='category-drag-surface'
          onLayout={({ nativeEvent }) => {
            tokenLayout.current = nativeEvent.layout;
          }}
          style={[styles.dragSurface, { width: tokenSize, height: tokenSize }, webDragStyle]}
          {...panResponder.panHandlers}
        >
          <Pressable
            testID='category-draggable-token'
            accessibilityRole='button'
            accessibilityLabel={t('games.categoryMatch.itemAccessibilityLabel', {
              item: itemLabel,
            })}
            accessibilityHint={roundFinished ? undefined : t('games.categoryMatch.selectItemHint')}
            accessibilityState={{ selected: isTokenSelected, disabled: roundFinished }}
            disabled={roundFinished}
            onPress={() => setIsTokenSelected((selected) => !selected)}
            style={styles.tokenPressable}
          >
            <Animated.View
              pointerEvents='none'
              style={[
                styles.draggableToken,
                isTokenSelected && styles.selectedToken,
                { transform: dragPosition.getTranslateTransform() },
              ]}
            >
              <GamePicture name={round.item.name} size={Math.floor(tokenSize * 0.6)} />
            </Animated.View>
          </Pressable>
        </View>

        <View
          style={styles.zoneRow}
          testID='category-zone-row'
          onLayout={({ nativeEvent }) => {
            rowLayout.current = nativeEvent.layout;
          }}
        >
          {round.categories.map(({ id, example }) => {
            const label = t(`games.categoryMatch.categories.${id}`);
            const isMatch = id === round.item.category;
            const isMatched = isMatch && guidedRound.phase === 'corrected';
            const isModelled = isMatch && guidedRound.phase === 'modelled';
            return (
              <Pressable
                key={id}
                onLayout={({ nativeEvent }) => {
                  zoneLayouts.current[id] = nativeEvent.layout;
                }}
                onPress={() => answerCategory(id)}
                accessibilityRole='button'
                accessibilityLabel={t('games.categoryMatch.categoryAccessibilityLabel', {
                  category: label,
                })}
                accessibilityHint={
                  roundFinished ? undefined : t('games.categoryMatch.categoryActivationHint')
                }
                accessibilityState={{ disabled: roundFinished }}
                disabled={roundFinished}
                testID={`category-zone-${id}`}
                style={[
                  styles.zoneCard,
                  { minHeight: zoneMinHeight },
                  isModelled && styles.zoneCardModelled,
                  hoveredCategory === id && styles.zoneCardActive,
                  isMatched && styles.zoneCardMatched,
                ]}
              >
                {isMatched ? (
                  <Text aria-hidden style={styles.matchMark}>
                    ✓
                  </Text>
                ) : null}
                <GamePicture name={example.name} size={34} />
                <Text style={styles.zoneLabel}>{label}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View accessibilityLiveRegion={Platform.OS === 'ios' ? undefined : 'polite'}>
        {feedback ? (
          <View style={styles.feedbackRow}>
            {!roundFinished && guidedRound.incorrectAttempts > 0 && (
              <View testID='category-match-retry-cue'>
                <ControlIcon name='repeat' color={colors.text} size={18} />
              </View>
            )}
            <Text testID='category-match-feedback' style={styles.feedback}>
              {feedback}
            </Text>
          </View>
        ) : null}
      </View>

      {roundFinished ? (
        renderShell ? null : (
          next
        )
      ) : (
        <GuidedPracticePrompt
          state={guidedRound}
          hint={t('games.categoryMatch.hint')}
          model={
            <Text
              style={styles.feedback}
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
          hideActions={!!renderShell}
        />
      )}
    </View>
  );
  return renderShell ? renderShell(prompt, action, board, more) : board;
};

const createStyles = (colors: ThemeColors, resolvedMode: ResolvedThemeMode) => {
  const cardText = resolvedMode === 'dark' ? colors.background : colors.text;

  return StyleSheet.create({
    container: {
      borderRadius: Radius.xl,
      backgroundColor: colors.surfaceGame,
      borderWidth: 2,
      borderColor: colors.cardBack,
      padding: Space.md,
    },
    instruction: {
      ...TypeStyle.body,
      color: colors.text,
      textAlign: 'center',
      marginBottom: Space.md,
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
    dragSurface: { alignSelf: 'center', zIndex: 1, elevation: 1 },
    tokenPressable: { flex: 1 },
    draggableToken: {
      flex: 1,
      borderRadius: Radius.xl,
      backgroundColor: colors.cardFront,
      borderWidth: 3,
      borderColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    selectedToken: { borderColor: cardText },
    zoneRow: {
      flexDirection: 'row',
      gap: Space.sm,
      marginTop: Space.base,
    },
    zoneCard: {
      flex: 1,
      minWidth: 0,
      borderRadius: Radius.lg,
      borderWidth: 3,
      borderColor: colors.cardBack,
      backgroundColor: colors.cardFront,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: Space.xs,
      paddingVertical: Space.sm,
      gap: Space.xxs,
    },
    zoneCardActive: { borderColor: cardText },
    zoneCardModelled: { borderColor: cardText, borderStyle: 'dashed' },
    zoneCardMatched: { borderColor: cardText, backgroundColor: colors.success },
    zoneLabel: {
      ...TypeStyle.buttonSm,
      color: cardText,
      textAlign: 'center',
    },
    matchMark: {
      position: 'absolute',
      top: Space.xs,
      end: Space.sm,
      fontSize: 16,
      color: cardText,
    },
    nextButton: {
      marginTop: Space.md,
      alignSelf: 'center',
      maxWidth: 320,
    },
  });
};
