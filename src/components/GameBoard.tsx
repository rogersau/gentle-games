import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, useWindowDimensions } from 'react-native';
import { ThemeColors, Tile as TileType } from '../types';
import { generateTiles, checkMatch, checkGameComplete, formatTime, calculateGridDimensions } from '../utils/gameLogic';
import { playFlipSound, playMatchSound, playCompleteSound } from '../utils/sounds';
import { Tile } from './Tile';
import { useSettings } from '../context/SettingsContext';
import { ResolvedThemeMode, useThemeColors } from '../utils/theme';

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

  const padding = 16;
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
      <View style={styles.header}>
        <TouchableOpacity onPress={onBackPress} style={styles.backButton}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.timerText}>{startTime ? formatTime(elapsed) : '—'}</Text>
        <Text style={styles.movesText}>Moves: {moves}</Text>
      </View>

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

      {isGameComplete && (
        <View style={styles.completeContainer}>
          <Text style={styles.completeText}>You finished in {formatTime(elapsed)}!</Text>
          <TouchableOpacity style={styles.playAgainButton} onPress={startNewGame}>
            <Text style={styles.playAgainText}>Play Again</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const createStyles = (colors: ThemeColors, resolvedMode: ResolvedThemeMode) =>
  StyleSheet.create({
    container: {
      flex: 1,
      alignItems: 'center',
      padding: 16,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      width: '100%',
      paddingHorizontal: 16,
      marginBottom: 16,
    },
    backButton: {
      padding: 8,
      marginRight: 8,
    },
    backButtonText: {
      fontSize: 24,
      color: colors.text,
    },
    timerText: {
      flex: 1,
      fontSize: 24,
      fontWeight: '600',
      color: colors.text,
      textAlign: 'center',
    },
    movesText: {
      fontSize: 18,
      color: colors.textLight,
      width: 80,
      textAlign: 'right',
    },
    board: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'center',
      alignItems: 'center',
    },
    completeContainer: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: resolvedMode === 'dark' ? 'rgba(47, 51, 59, 0.94)' : 'rgba(255, 254, 247, 0.95)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 32,
    },
    completeText: {
      fontSize: 28,
      fontWeight: '600',
      color: colors.text,
      textAlign: 'center',
      marginBottom: 24,
    },
    playAgainButton: {
      backgroundColor: colors.primary,
      paddingHorizontal: 32,
      paddingVertical: 16,
      borderRadius: 25,
    },
    playAgainText: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.cardFront,
    },
  });
