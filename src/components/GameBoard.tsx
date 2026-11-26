import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { ThemeColors, Tile as TileType } from '../types';
import {
  checkGameComplete,
  checkMatch,
  calculateMemorySnapBoardSize,
  formatTime,
  generateTiles,
} from '../utils/gameLogic';
import { playCompleteSound, playFlipSound, playMatchSound } from '../utils/sounds';
import { Tile } from './Tile';
import { useSettings } from '../context/SettingsContext';
import { useThemeColors } from '../utils/theme';
import { AppButton } from '../ui/components';
import { GameCompletion } from '../ui/components/GameShell';
import { Space, TypeStyle } from '../ui/tokens';
import { useTranslation } from 'react-i18next';
import { useTrackedTimeouts } from '../utils/useTrackedTimeouts';
import { getGameSettings, MemorySnapPreviewMode } from '../games/settings';

interface GameBoardProps {
  onGameComplete: (time: number) => void;
  onBackPress?: () => void;
  bottomInset?: number;
  renderStats?: (stats: { time: string; moves: number }) => React.ReactNode;
  onPositiveEvent?: () => void;
  renderShell?: (
    prompt: string,
    action: React.ReactNode,
    board: React.ReactNode,
  ) => React.ReactNode;
}

const previewDuration = (mode: MemorySnapPreviewMode): number | null => {
  if (mode === '4-seconds') return 4000;
  if (mode === '8-seconds') return 8000;
  return null;
};

interface MemorySnapRound {
  tiles: TileType[];
  selectedTileIds: string[];
  seenTileIds: string[];
  hintedTileId: string | null;
  isPreview: boolean;
  startTime: number | null;
  endTime: number | null;
  moves: number;
}

const emptyRound: MemorySnapRound = {
  tiles: [],
  selectedTileIds: [],
  seenTileIds: [],
  hintedTileId: null,
  isPreview: false,
  startTime: null,
  endTime: null,
  moves: 0,
};

export const GameBoard: React.FC<GameBoardProps> = ({
  onGameComplete,
  onBackPress,
  bottomInset = 0,
  renderStats,
  onPositiveEvent,
  renderShell,
}) => {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const { settings } = useSettings();
  const { colors } = useThemeColors();
  const { t } = useTranslation();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { pairCount, previewMode, mismatchDuration, hintEnabled } = getGameSettings(
    settings,
    'memory-snap',
  );
  const { theme, pressureFreeMode } = settings;
  const { queueTimeout, clearAllTimeouts } = useTrackedTimeouts();

  const [round, setRound] = useState(emptyRound);
  const [currentTime, setCurrentTime] = useState(Date.now);
  const roundRef = useRef(round);
  const commitRound = useCallback((nextRound: MemorySnapRound) => {
    // A second tap can arrive before React renders the result of the first.
    roundRef.current = nextRound;
    setRound(nextRound);
  }, []);
  const { tiles, selectedTileIds, isPreview, startTime, endTime, moves } = round;
  const isGameComplete = endTime !== null;
  const isMismatch = selectedTileIds.length === 2;
  const canDismissMismatch = isMismatch && pressureFreeMode;
  const hintCandidate =
    hintEnabled && !isPreview && !isGameComplete && !selectedTileIds.length && !round.hintedTileId
      ? tiles.find(
          (tile) => !tile.isFlipped && !tile.isMatched && round.seenTileIds.includes(tile.id),
        )
      : undefined;

  const {
    tileSize,
    width: boardWidth,
    height: boardHeight,
  } = calculateMemorySnapBoardSize(
    { width: screenWidth - (renderShell ? 20 : 0), height: screenHeight },
    pairCount,
    bottomInset,
  );

  useEffect(() => {
    if (startTime === null || isGameComplete || pressureFreeMode) return;
    const interval = setInterval(() => setCurrentTime(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [isGameComplete, pressureFreeMode, startTime]);

  const finishPreview = useCallback(() => {
    const current = roundRef.current;
    if (!current.isPreview) return;
    commitRound({
      ...current,
      isPreview: false,
      tiles: current.tiles.map((tile) => ({ ...tile, isFlipped: false })),
    });
  }, [commitRound]);

  const startNewGame = useCallback(() => {
    clearAllTimeouts();
    const newTiles = generateTiles(pairCount, theme);
    const isPreview = previewMode !== 'none';
    commitRound({
      ...emptyRound,
      isPreview,
      tiles: isPreview ? newTiles.map((tile) => ({ ...tile, isFlipped: true })) : newTiles,
      seenTileIds: isPreview ? newTiles.map((tile) => tile.id) : [],
    });
    const duration = previewDuration(previewMode);
    if (duration !== null) queueTimeout(finishPreview, duration);
  }, [clearAllTimeouts, commitRound, finishPreview, pairCount, previewMode, queueTimeout, theme]);

  useEffect(() => {
    startNewGame();
    return () => clearAllTimeouts();
  }, [clearAllTimeouts, startNewGame]);

  const handleReady = () => {
    if (!roundRef.current.isPreview) return;
    clearAllTimeouts();
    finishPreview();
  };

  const handleHint = () => {
    const current = roundRef.current;
    if (!hintCandidate || current !== round) return;
    const id = hintCandidate.id;
    commitRound({
      ...current,
      hintedTileId: id,
      tiles: current.tiles.map((tile) => (tile.id === id ? { ...tile, isFlipped: true } : tile)),
    });
    queueTimeout(() => {
      const latest = roundRef.current;
      if (latest.hintedTileId !== id) return;
      commitRound({
        ...latest,
        hintedTileId: null,
        tiles: latest.tiles.map((tile) => (tile.id === id ? { ...tile, isFlipped: false } : tile)),
      });
    }, mismatchDuration);
  };

  const dismissMismatch = useCallback(() => {
    const current = roundRef.current;
    commitRound({
      ...current,
      selectedTileIds: [],
      tiles: current.tiles.map((tile) =>
        current.selectedTileIds.includes(tile.id) ? { ...tile, isFlipped: false } : tile,
      ),
    });
  }, [commitRound]);

  useEffect(() => {
    if (selectedTileIds.length !== 2 || pressureFreeMode) return;
    const timeout = setTimeout(() => {
      if (roundRef.current.selectedTileIds === selectedTileIds) dismissMismatch();
    }, mismatchDuration);
    return () => clearTimeout(timeout);
  }, [dismissMismatch, mismatchDuration, pressureFreeMode, selectedTileIds]);

  const handleTilePress = (tileId: string) => {
    const current = roundRef.current;
    if (current.isPreview || current.endTime !== null) return;
    if (current.selectedTileIds.length === 2) {
      if (pressureFreeMode && current.selectedTileIds.includes(tileId)) dismissMismatch();
      return;
    }
    const tile = current.tiles.find((item) => item.id === tileId);
    if (!tile || tile.isFlipped || tile.isMatched) return;
    if (current.hintedTileId !== null) clearAllTimeouts();

    const now = Date.now();
    const startTime = current.startTime ?? now;
    if (current.startTime === null) setCurrentTime(now);
    const selection = [...current.selectedTileIds, tileId];
    const isTurn = selection.length === 2;
    const matched = isTurn && checkMatch(current.tiles, selection);
    const nextTiles = current.tiles.map((item) => {
      if (matched && selection.includes(item.id))
        return { ...item, isFlipped: true, isMatched: true };
      if (item.id === current.hintedTileId) return { ...item, isFlipped: false };
      return item.id === tileId ? { ...item, isFlipped: true } : item;
    });
    const complete = matched && checkGameComplete(nextTiles);
    commitRound({
      ...current,
      tiles: nextTiles,
      hintedTileId: null,
      startTime,
      endTime: complete ? now : null,
      selectedTileIds: matched ? [] : selection,
      seenTileIds: current.seenTileIds.includes(tileId)
        ? current.seenTileIds
        : [...current.seenTileIds, tileId],
      moves: current.moves + Number(isTurn),
    });

    if (complete) {
      void playCompleteSound(settings);
      onGameComplete(Math.max(0, now - startTime));
    } else if (matched) {
      void playMatchSound(settings);
      onPositiveEvent?.();
    } else {
      void playFlipSound(settings);
    }
  };

  const elapsed = startTime === null ? 0 : Math.max(0, (endTime ?? currentTime) - startTime);
  const timeString = startTime === null ? t('games.memorySnap.notStarted') : formatTime(elapsed);
  let instruction = t('games.memorySnap.instruction');
  if (isPreview) {
    instruction = t(
      previewMode === 'until-ready'
        ? 'games.memorySnap.previewUntilReady'
        : 'games.memorySnap.previewShowing',
    );
  } else if (isMismatch) {
    instruction = t(
      canDismissMismatch ? 'games.memorySnap.mismatchTap' : 'games.memorySnap.mismatchWaiting',
    );
  } else if (selectedTileIds.length === 1) {
    instruction = t('games.memorySnap.chooseSecond');
  } else if (isGameComplete) {
    instruction = t('common.againPrompt');
  }
  const defaultStats = ({ time, moves: moveCount }: { time: string; moves: number }) => (
    <View style={styles.headerInfo}>
      <Text
        style={styles.timerText}
        accessibilityLabel={t('games.memorySnap.timeLabel', { time })}
        testID='memory-snap-timer'
      >
        {time}
      </Text>
      <Text
        style={styles.movesText}
        accessibilityLabel={t('games.memorySnap.moves', { count: moveCount })}
        testID='memory-snap-moves'
      >
        {t('games.memorySnap.moves', { count: moveCount })}
      </Text>
    </View>
  );

  const action = (
    <>
      {isPreview ? (
        <AppButton
          icon='play'
          label={t('games.memorySnap.ready')}
          onPress={handleReady}
          accessibilityHint={t('games.memorySnap.readyHint')}
          testID='memory-snap-ready'
        />
      ) : null}
      {!isPreview && !isGameComplete && hintEnabled ? (
        <AppButton
          label={t('games.memorySnap.hint')}
          variant='secondary'
          onPress={handleHint}
          disabled={!hintCandidate}
          disabledLabel={renderShell ? t('games.memorySnap.hintUnavailable') : undefined}
          accessibilityHint={t('games.memorySnap.hintHint')}
          testID='memory-snap-hint'
        />
      ) : null}
    </>
  );
  const board = (
    <View style={styles.container}>
      {renderStats
        ? renderStats({ time: timeString, moves })
        : !pressureFreeMode
          ? defaultStats({ time: timeString, moves })
          : null}
      {!renderShell && (
        <View style={styles.instructionArea}>
          <Text style={styles.instruction} accessibilityLiveRegion='polite' aria-live='polite'>
            {instruction}
          </Text>
        </View>
      )}
      <View
        style={[styles.board, { width: boardWidth, height: boardHeight }]}
        testID='memory-board'
      >
        {tiles.map((tile, index) => (
          <Tile
            key={tile.id}
            tile={tile}
            onPress={() => handleTilePress(tile.id)}
            size={tileSize}
            position={index + 1}
            locked={isPreview || isMismatch}
            canDismissMismatch={canDismissMismatch && selectedTileIds.includes(tile.id)}
          />
        ))}
      </View>
      {!renderShell && <View style={styles.controls}>{action}</View>}

      {isGameComplete ? (
        <GameCompletion
          testID='memory-complete'
          message={t(
            pressureFreeMode ? 'games.memorySnap.completed' : 'games.memorySnap.completedIn',
            { time: formatTime(elapsed) },
          )}
          onHome={() => onBackPress?.()}
          onReplay={startNewGame}
        />
      ) : null}
    </View>
  );
  return renderShell ? renderShell(instruction, action, board) : board;
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: { flex: 1, alignItems: 'center' },
    headerInfo: { flexDirection: 'row', alignItems: 'center', gap: Space.md },
    timerText: { ...TypeStyle.h3, color: colors.text, textAlign: 'center' },
    movesText: { ...TypeStyle.body, color: colors.textLight, textAlign: 'right' },
    instructionArea: {
      minHeight: TypeStyle.body.lineHeight * 2,
      justifyContent: 'center',
      marginBottom: Space.xs,
    },
    instruction: { ...TypeStyle.body, color: colors.textLight, textAlign: 'center' },
    board: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'center',
      alignItems: 'center',
    },
    controls: {
      justifyContent: 'center',
      alignItems: 'center',
      paddingTop: Space.sm,
    },
  });
