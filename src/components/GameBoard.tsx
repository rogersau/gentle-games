import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, useWindowDimensions } from 'react-native';
import { Tile as TileType } from '../types';
import { generateTiles, checkMatch, checkGameComplete, formatTime, calculateGridDimensions } from '../utils/gameLogic';
import { playFlipSound, playMatchSound, playCompleteSound } from '../utils/sounds';
import { Tile } from './Tile';
import { useSettings } from '../context/SettingsContext';

interface GameBoardProps {
  onGameComplete: (time: number) => void;
  onBackPress: () => void;
}

export const GameBoard: React.FC<GameBoardProps> = ({ onGameComplete, onBackPress }) => {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const { settings } = useSettings();
  const [tiles, setTiles] = useState<TileType[]>([]);
  const [selectedTiles, setSelectedTiles] = useState<string[]>([]);
  const [isGameComplete, setIsGameComplete] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [endTime, setEndTime] = useState<number | null>(null);
  const [moves, setMoves] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentTime, setCurrentTime] = useState<number>(Date.now());

  const padding = 16;
  const headerHeight = 60;
  const gap = 8;
  const tileMargin = 4;

  const { cols, rows, boardSize, tileSize } = useMemo(() => {
    const { cols, rows } = calculateGridDimensions(settings.pairCount, screenWidth, screenHeight);
    
    const maxBoardWidth = screenWidth - padding * 2;
    const maxBoardHeight = screenHeight - padding * 2 - headerHeight - 40;
    const boardSize = Math.min(maxBoardWidth, maxBoardHeight);
    
    const calculatedTileSize = Math.floor(
      (boardSize - gap * (cols - 1) - tileMargin * 2 * cols) / cols
    );
    
    return { cols, rows, boardSize, tileSize: calculatedTileSize };
  }, [screenWidth, screenHeight, settings.pairCount]);

  useEffect(() => {
    startNewGame();
  }, [settings.pairCount, settings.theme]);

  // Timer effect - updates every 100ms while game is active
  useEffect(() => {
    if (!startTime || isGameComplete || endTime) return;
    
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 100);
    
    return () => clearInterval(interval);
  }, [startTime, isGameComplete, endTime]);

  const startNewGame = () => {
    const newTiles = generateTiles(settings.pairCount, settings.theme);
    setTiles(newTiles);
    setSelectedTiles([]);
    setIsGameComplete(false);
    setStartTime(Date.now());
    setEndTime(null);
    setMoves(0);
    setIsProcessing(false);
  };

  const handleTilePress = useCallback(async (tileId: string) => {
    if (isProcessing || selectedTiles.length >= 2) return;
    if (selectedTiles.includes(tileId)) return;

    await playFlipSound(settings);

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

      const isMatch = checkMatch(tiles, newSelected);

      if (isMatch) {
        await playMatchSound(settings);
        
        setTimeout(() => {
          setTiles(prev =>
            prev.map(tile =>
              newSelected.includes(tile.id)
                ? { ...tile, isMatched: true }
                : tile
            )
          );
          setSelectedTiles([]);
          setIsProcessing(false);

          // Check if game is complete
          const updatedTiles = tiles.map(tile =>
            newSelected.includes(tile.id)
              ? { ...tile, isMatched: true }
              : tile
          );
          
          if (checkGameComplete(updatedTiles)) {
            const end = Date.now();
            setEndTime(end);
            setIsGameComplete(true);
            playCompleteSound(settings);
            onGameComplete(end - (startTime || end));
          }
        }, 500);
      } else {
        setTimeout(() => {
          setTiles(prev =>
            prev.map(tile =>
              newSelected.includes(tile.id)
                ? { ...tile, isFlipped: false }
                : tile
            )
          );
          setSelectedTiles([]);
          setIsProcessing(false);
        }, 1000);
      }
    }
  }, [selectedTiles, tiles, isProcessing, settings, startTime, onGameComplete]);

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
        <Text style={styles.timerText}>{formatTime(elapsed)}</Text>
        <Text style={styles.movesText}>Moves: {moves}</Text>
      </View>

      <View
        style={[
          styles.board,
          {
            width: boardSize,
            height: boardSize,
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

const styles = StyleSheet.create({
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
    color: '#5A5A5A',
  },
  timerText: {
    flex: 1,
    fontSize: 24,
    fontWeight: '600',
    color: '#5A5A5A',
    textAlign: 'center',
  },
  movesText: {
    fontSize: 18,
    color: '#8A8A8A',
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
    backgroundColor: 'rgba(255, 254, 247, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  completeText: {
    fontSize: 28,
    fontWeight: '600',
    color: '#5A5A5A',
    textAlign: 'center',
    marginBottom: 24,
  },
  playAgainButton: {
    backgroundColor: '#A8D8EA',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 25,
  },
  playAgainText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
