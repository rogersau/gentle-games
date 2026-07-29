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
import { ResolvedThemeMode, useThemeColors } from '../utils/theme';
import { AppButton, AppModal } from '../ui/components';
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
}

const previewDuration = (mode: MemorySnapPreviewMode): number | null => {
  if (mode === '4-seconds') return 4000;
  if (mode === '8-seconds') return 8000;
  return null;
};

export const GameBoard: React.FC<GameBoardProps> = ({
  onGameComplete,
  onBackPress,
  bottomInset = 0,
  renderStats,
  onPositiveEvent,
}) => {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const { settings } = useSettings();
  const { colors, resolvedMode } = useThemeColors();
  const { t } = useTranslation();
  const styles = useMemo(() => createStyles(colors, resolvedMode), [colors, resolvedMode]);
  const memorySettings = useMemo(
    () => getGameSettings(settings, 'memory-snap'),
    [settings.difficulty, settings.gameSettings, settings.showCardPreview],
  );
  const { queueTimeout, clearAllTimeouts } = useTrackedTimeouts();

  const [tiles, setTiles] = useState<TileType[]>([]);
  const [selectedTiles, setSelectedTiles] = useState<string[]>([]);
  const [seenTileIds, setSeenTileIds] = useState<string[]>([]);
  const [hintedTileId, setHintedTileId] = useState<string | null>(null);
  const [isGameComplete, setIsGameComplete] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [endTime, setEndTime] = useState<number | null>(null);
  const [moves, setMoves] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [isPreviewPhase, setIsPreviewPhase] = useState(false);

  const selectedTilesRef = useRef(selectedTiles);
  const isProcessingRef = useRef(isProcessing);
  const hintedTileIdRef = useRef(hintedTileId);
  selectedTilesRef.current = selectedTiles;
  isProcessingRef.current = isProcessing;
  hintedTileIdRef.current = hintedTileId;

  const boardSize = useMemo(
    () =>
      calculateMemorySnapBoardSize(
        { width: screenWidth, height: screenHeight },
        memorySettings.pairCount,
        bottomInset,
      ),
    [bottomInset, memorySettings.pairCount, screenHeight, screenWidth],
  );
  const { tileSize, width: boardWidth, height: boardHeight } = boardSize;

  useEffect(() => {
    if (!startTime || isGameComplete || endTime) return;
    const interval = setInterval(() => setCurrentTime(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [endTime, isGameComplete, startTime]);

  const finishPreview = useCallback(() => {
    setTiles((current) => current.map((tile) => ({ ...tile, isFlipped: false })));
    setIsPreviewPhase(false);
  }, []);

  const startNewGame = useCallback(() => {
    clearAllTimeouts();
    const newTiles = generateTiles(memorySettings.pairCount, settings.theme);
    setTiles(newTiles);
    setSelectedTiles([]);
    selectedTilesRef.current = [];
    setSeenTileIds([]);
    setHintedTileId(null);
    setIsGameComplete(false);
    setStartTime(null);
    setEndTime(null);
    setMoves(0);
    setIsProcessing(false);
    isProcessingRef.current = false;
    setCurrentTime(Date.now());

    if (memorySettings.previewMode !== 'none') {
      setTiles(newTiles.map((tile) => ({ ...tile, isFlipped: true })));
      setIsPreviewPhase(true);
      const duration = previewDuration(memorySettings.previewMode);
      if (duration !== null) queueTimeout(finishPreview, duration);
    } else {
      setIsPreviewPhase(false);
    }
  }, [clearAllTimeouts, finishPreview, memorySettings, queueTimeout, settings.theme]);

  useEffect(() => {
    startNewGame();
    return () => clearAllTimeouts();
  }, [clearAllTimeouts, startNewGame]);

  const handleReady = useCallback(() => {
    if (isPreviewPhase && memorySettings.previewMode === 'until-ready') finishPreview();
  }, [finishPreview, isPreviewPhase, memorySettings.previewMode]);

  const handleHint = useCallback(() => {
    if (
      !memorySettings.hintEnabled ||
      isPreviewPhase ||
      isProcessing ||
      selectedTiles.length > 0 ||
      hintedTileId
    ) {
      return;
    }

    const candidate = tiles.find(
      (tile) => seenTileIds.includes(tile.id) && !tile.isMatched && !tile.isFlipped,
    );
    if (!candidate) return;

    setHintedTileId(candidate.id);
    setTiles((current) =>
      current.map((tile) => (tile.id === candidate.id ? { ...tile, isFlipped: true } : tile)),
    );
    queueTimeout(() => {
      if (
        hintedTileIdRef.current !== candidate.id ||
        selectedTilesRef.current.includes(candidate.id)
      ) {
        return;
      }
      setTiles((current) =>
        current.map((tile) =>
          tile.id === candidate.id && !tile.isMatched ? { ...tile, isFlipped: false } : tile,
        ),
      );
      setHintedTileId(null);
    }, memorySettings.mismatchDuration);
  }, [
    isPreviewPhase,
    isProcessing,
    memorySettings.hintEnabled,
    memorySettings.mismatchDuration,
    hintedTileId,
    queueTimeout,
    seenTileIds,
    selectedTiles,
    tiles,
  ]);

  const handleTilePress = useCallback(
    (tileId: string) => {
      const currentSelection = selectedTilesRef.current;
      if (isPreviewPhase || isProcessingRef.current || currentSelection.length >= 2) return;
      const tile = tiles.find((item) => item.id === tileId);
      if (
        !tile ||
        tile.isFlipped ||
        tile.isMatched ||
        hintedTileId === tileId ||
        currentSelection.includes(tileId)
      ) {
        return;
      }

      void playFlipSound(settings);
      const now = Date.now();
      if (!startTime) {
        setStartTime(now);
        setCurrentTime(now);
      }

      const newSelected = [...currentSelection, tileId];
      selectedTilesRef.current = newSelected;
      setSelectedTiles(newSelected);
      setSeenTileIds((current) => (current.includes(tileId) ? current : [...current, tileId]));
      setTiles((current) =>
        current.map((item) => (item.id === tileId ? { ...item, isFlipped: true } : item)),
      );

      if (newSelected.length !== 2) return;

      setIsProcessing(true);
      isProcessingRef.current = true;
      setMoves((current) => current + 1);
      const matched = checkMatch(tiles, newSelected);

      if (matched) {
        playMatchSound(settings);
        onPositiveEvent?.();
        const updatedTiles = tiles.map((item) =>
          newSelected.includes(item.id) ? { ...item, isFlipped: true, isMatched: true } : item,
        );
        setTiles(updatedTiles);
        setSelectedTiles([]);
        selectedTilesRef.current = [];
        setIsProcessing(false);
        isProcessingRef.current = false;

        if (checkGameComplete(updatedTiles)) {
          const end = Date.now();
          setEndTime(end);
          setIsGameComplete(true);
          playCompleteSound(settings);
          onGameComplete(end - (startTime ?? end));
        }
        return;
      }

      queueTimeout(() => {
        setTiles((current) =>
          current.map((item) =>
            newSelected.includes(item.id) && !item.isMatched ? { ...item, isFlipped: false } : item,
          ),
        );
        setSelectedTiles([]);
        selectedTilesRef.current = [];
        setIsProcessing(false);
        isProcessingRef.current = false;
      }, memorySettings.mismatchDuration);
    },
    [
      hintedTileId,
      isPreviewPhase,
      isProcessing,
      memorySettings.mismatchDuration,
      onGameComplete,
      onPositiveEvent,
      queueTimeout,
      settings,
      startTime,
      tiles,
    ],
  );

  const elapsed = endTime
    ? endTime - (startTime ?? endTime)
    : startTime
      ? Math.max(0, currentTime - startTime)
      : 0;
  const timeString = startTime ? formatTime(elapsed) : t('games.memorySnap.notStarted');
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

  return (
    <View style={styles.container}>
      {renderStats
        ? renderStats({ time: timeString, moves })
        : !settings.pressureFreeMode
          ? defaultStats({ time: timeString, moves })
          : null}
      {isPreviewPhase ? (
        <Text style={styles.previewStatus} accessibilityRole='text'>
          {t(
            memorySettings.previewMode === 'until-ready'
              ? 'games.memorySnap.previewUntilReady'
              : 'games.memorySnap.previewShowing',
          )}
        </Text>
      ) : null}
      <View
        style={[styles.board, { width: boardWidth, height: boardHeight }]}
        testID='memory-board'
      >
        {tiles.map((tile) => (
          <Tile
            key={tile.id}
            tile={tile}
            onPress={() => handleTilePress(tile.id)}
            size={tileSize}
          />
        ))}
      </View>
      <View style={styles.controls}>
        {isPreviewPhase && memorySettings.previewMode === 'until-ready' ? (
          <AppButton
            label={t('games.memorySnap.ready')}
            onPress={handleReady}
            accessibilityHint={t('games.memorySnap.readyHint')}
            testID='memory-snap-ready'
          />
        ) : null}
        {!isPreviewPhase && memorySettings.hintEnabled ? (
          <AppButton
            label={t('games.memorySnap.hint')}
            variant='ghost'
            onPress={handleHint}
            disabled={
              !seenTileIds.some((id) =>
                tiles.some((tile) => tile.id === id && !tile.isMatched && !tile.isFlipped),
              )
            }
            accessibilityHint={t('games.memorySnap.hintHint')}
            testID='memory-snap-hint'
          />
        ) : null}
      </View>

      <AppModal
        visible={isGameComplete}
        title={t(
          settings.pressureFreeMode
            ? 'games.memorySnap.completedTitle'
            : 'games.memorySnap.wellDone',
        )}
        onClose={() => undefined}
        showClose={false}
        dismissOnBackdropPress={false}
      >
        <Text style={styles.completeText} accessibilityRole='text'>
          {settings.pressureFreeMode
            ? t('games.memorySnap.completed')
            : t('games.memorySnap.completedIn', { time: formatTime(elapsed) })}
        </Text>
        <View style={styles.buttonRow}>
          <AppButton
            label={t('games.memorySnap.goHome')}
            variant='secondary'
            onPress={() => onBackPress?.()}
            accessibilityHint={t('games.memorySnap.goHomeHint')}
          />
          <View style={{ width: Space.md }} />
          <AppButton
            label={t('games.memorySnap.playAgain')}
            onPress={startNewGame}
            accessibilityHint={t('games.memorySnap.playAgainHint')}
          />
        </View>
      </AppModal>
    </View>
  );
};

const createStyles = (colors: ThemeColors, _resolvedMode: ResolvedThemeMode) =>
  StyleSheet.create({
    container: { flex: 1, alignItems: 'center' },
    headerInfo: { flexDirection: 'row', alignItems: 'center', gap: Space.md },
    timerText: { ...TypeStyle.h3, color: colors.text, textAlign: 'center' },
    movesText: { ...TypeStyle.body, color: colors.textLight, textAlign: 'right' },
    previewStatus: { ...TypeStyle.bodySm, color: colors.textLight, marginVertical: Space.sm },
    board: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'center',
      alignItems: 'center',
    },
    controls: {
      minHeight: 60,
      justifyContent: 'center',
      alignItems: 'center',
      paddingTop: Space.sm,
    },
    completeText: {
      ...TypeStyle.body,
      color: colors.text,
      textAlign: 'center',
      marginBottom: Space.lg,
    },
    buttonRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  });
