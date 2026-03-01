import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { View, StyleSheet, Text, useWindowDimensions } from 'react-native';
import { ThemeColors, Tile as TileType } from '../types';
import { generateTiles, checkMatch, checkGameComplete, formatTime, calculateGridDimensions } from '../utils/gameLogic';
import { playFlipSound, playMatchSound, playCompleteSound } from '../utils/sounds';
import { Tile } from './Tile';
import { useSettings } from '../context/SettingsContext';
import { ResolvedThemeMode, useThemeColors } from '../utils/theme';
import { AppHeader, AppButton, AppModal } from '../ui/components';
import { Space, TypeStyle } from '../ui/tokens';

interface GameBoardProps {
  onGameComplete: (time: number) => void;
  onBackPress: () => void;
  bottomInset?: number;
}

export const GameBoard: React.FC<GameBoardProps> = ({ onGameComplete, onBackPress, bottomInset = 0 }) => {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const { settings } = useSettings();
  const { colors, resolvedMode } = useThemeColors();
  const styles = useMemo(() => createStyles(colors, resolvedMode), [colors, resolvedMode]);
  const [tiles, setTiles] = useState<TileType[]>([]);
  const [selectedTiles, setSelectedTiles] = useState<string[]>([]);
  const [isGameComplete, setIsGameComplete] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [endTime, setEndTime] = useState<number | null>(null);
  const [moves, setMoves] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentTime, setCurrentTime] = useState<number>(Date.now());
  const [isPreviewPhase, setIsPreviewPhase] = useState(false);
  const previewTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const padding = Space.base;
  const headerHeight = 60;
  const tileMargin = 4;

  const { cols, boardWidth, boardHeight, tileSize } = useMemo(() => {
    const { cols, rows } = calculateGridDimensions(settings.difficulty, screenWidth, screenHeight);

    const maxBoardWidth = screenWidth - padding * 2;
    const maxBoardHeight = screenHeight - padding * 2 - headerHeight - 40 - bottomInset;

    const widthLimitedTileSize = Math.floor((maxBoardWidth - tileMargin * 2 * cols) / cols);
    const heightLimitedTileSize = Math.floor((maxBoardHeight - tileMargin * 2 * rows) / rows);
    const calculatedTileSize = Math.max(1, Math.min(widthLimitedTileSize, heightLimitedTileSize));

    const boardWidth = cols * (calculatedTileSize + tileMargin * 2);
    const boardHeight = rows * (calculatedTileSize + tileMargin * 2);

    return { cols, boardWidth, boardHeight, tileSize: calculatedTileSize };
  }, [bottomInset, screenWidth, screenHeight, settings.difficulty]);

  useEffect(() => {
    startNewGame();
  }, [settings.difficulty, settings.theme]);

  // Cleanup preview timer on unmount
  useEffect(() => {
    return () => {
      if (previewTimerRef.current) {
        clearTimeout(previewTimerRef.current);
      }
    };
  }, []);

  // Timer effect - updates every second while game is active
  useEffect(() => {
    if (!startTime || isGameComplete || endTime) return;

    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);

    return () => clearInterval(interval);
  }, [startTime, isGameComplete, endTime]);

  const startNewGame = () => {
    if (previewTimerRef.current) {
      clearTimeout(previewTimerRef.current);
      previewTimerRef.current = null;
    }

    const newTiles = generateTiles(settings.difficulty, settings.theme);
    setSelectedTiles([]);
    setIsGameComplete(false);
    setStartTime(null);
    setEndTime(null);
    setMoves(0);
    setIsProcessing(false);
    setCurrentTime(Date.now());

    if (settings.showCardPreview) {
      setTiles(newTiles.map(tile => ({ ...tile, isFlipped: true })));
      setIsPreviewPhase(true);
      previewTimerRef.current = setTimeout(() => {
        setTiles(newTiles);
        setIsPreviewPhase(false);
        previewTimerRef.current = null;
      }, 2000);
    } else {
      setTiles(newTiles);
      setIsPreviewPhase(false);
    }
  };

  const handleTilePress = useCallback(async (tileId: string) => {
    if (isPreviewPhase || isProcessing || selectedTiles.length >= 2) return;
    if (selectedTiles.includes(tileId)) return;

    await playFlipSound(settings);

    // Start timer on first flip
    if (!startTime) {
      setStartTime(Date.now());
    }

    const newSelected = [...selectedTiles, tileId];
    setSelectedTiles(newSelected);

    setTiles(prev =>
      prev.map(tile =>
        tile.id === tileId ? { ...tile, isFlipped: true } : tile
      )
    );

    if (newSelected.length === 2) {
      setIsProcessing(true);
      setMoves(prev => prev + 1);

      // Use functional updater to read latest tiles, avoiding stale closure
      setTiles(prev => {
        const isMatch = checkMatch(prev, newSelected);

        if (isMatch) {
          playMatchSound(settings);

          const updatedTiles = prev.map(tile =>
            newSelected.includes(tile.id) ? { ...tile, isMatched: true } : tile
          );

          setTimeout(() => {
            setTiles(updatedTiles);
            setSelectedTiles([]);
            setIsProcessing(false);

            if (checkGameComplete(updatedTiles)) {
              const end = Date.now();
              setEndTime(end);
              setIsGameComplete(true);
              playCompleteSound(settings);
              setStartTime(st => {
                onGameComplete(end - (st || end));
                return st;
              });
            }
          }, 500);
        } else {
          setTimeout(() => {
            setTiles(p =>
              p.map(tile =>
                newSelected.includes(tile.id) ? { ...tile, isFlipped: false } : tile
              )
            );
            setSelectedTiles([]);
            setIsProcessing(false);
          }, 1000);
        }

        // Return prev unchanged here — the real update happens in the setTimeout
        return prev;
      });
    }
  }, [selectedTiles, isProcessing, isPreviewPhase, settings, startTime, onGameComplete]);

  const elapsed = endTime
    ? endTime - (startTime || 0)
    : startTime
    ? currentTime - startTime
    : 0;

  return (
    <View style={styles.container}>
      <AppHeader
        title=""
        onBack={onBackPress}
        rightAction={
          <View style={styles.headerInfo}>
            <Text style={styles.timerText} accessibilityLabel={startTime ? `Time ${formatTime(elapsed)}` : 'Timer not started'}>
              {startTime ? formatTime(elapsed) : '—'}
            </Text>
            <Text style={styles.movesText} accessibilityLabel={`${moves} moves`}>
              Moves: {moves}
            </Text>
          </View>
        }
      />

      <View
        testID="memory-board"
        style={[
          styles.board,
          {
            width: boardWidth,
            height: boardHeight,
          },
        ]}
      >
        {tiles.map(tile => (
          <Tile
            key={tile.id}
            tile={tile}
            onPress={() => handleTilePress(tile.id)}
            size={tileSize}
          />
        ))}
      </View>

      <AppModal
        visible={isGameComplete}
        title="Well Done! 🎉"
        onClose={() => undefined}
        showClose={false}
        dismissOnBackdropPress={false}
      >
        <Text style={styles.completeText} accessibilityRole="text">
          You finished in {formatTime(elapsed)}!
        </Text>
        <AppButton
          label="Play Again"
          variant="primary"
          onPress={startNewGame}
          accessibilityHint="Start a new game"
        />
      </AppModal>
    </View>
  );
};

const createStyles = (colors: ThemeColors, resolvedMode: ResolvedThemeMode) =>
  StyleSheet.create({
    container: {
      flex: 1,
      alignItems: 'center',
      padding: Space.base,
    },
    headerInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Space.md,
    },
    timerText: {
      ...TypeStyle.h3,
      color: colors.text,
      textAlign: 'center',
    },
    movesText: {
      ...TypeStyle.body,
      color: colors.textLight,
      textAlign: 'right',
    },
    board: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'center',
      alignItems: 'center',
    },
    completeText: {
      ...TypeStyle.body,
      color: colors.text,
      textAlign: 'center',
      marginBottom: Space.lg,
    },
  });
