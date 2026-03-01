import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Platform, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Accelerometer } from 'expo-sensors';
import { ThemeColors } from '../types';
import {
  applyStarPathTilt,
  clampStarPathPoint,
  collectStarPathItems,
  createStarPathCollectibles,
} from '../utils/starPathLogic';
import { useThemeColors } from '../utils/theme';
import { AppScreen, AppHeader, AppButton } from '../ui/components';
import { Space, TypeStyle } from '../ui/tokens';

export const StarPathScreen: React.FC = () => {
  const navigation = useNavigation();
  const { colors } = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const [tiltEnabled, setTiltEnabled] = useState(false);
  const [tiltAvailable, setTiltAvailable] = useState(false);
  const boardWidth = Math.max(280, screenWidth - 28);
  const boardHeight = Math.max(340, Math.min(screenHeight * 0.68, screenHeight - 220));
  const initialStar = useMemo(() => ({ x: boardWidth / 2, y: boardHeight - 42 }), [boardWidth, boardHeight]);
  const [starPoint, setStarPoint] = useState(initialStar);
  const [collectibles, setCollectibles] = useState(() => createStarPathCollectibles(boardWidth, boardHeight, 7));
  const [collectedCount, setCollectedCount] = useState(0);

  const resetScene = useCallback(() => {
    setStarPoint(initialStar);
    setCollectibles(createStarPathCollectibles(boardWidth, boardHeight, 7));
    setCollectedCount(0);
  }, [boardHeight, boardWidth, initialStar]);

  useEffect(() => {
    resetScene();
  }, [resetScene]);

  useEffect(() => {
    let isDisposed = false;
    if (Platform.OS === 'web') {
      setTiltAvailable(false);
      return;
    }

    Accelerometer.isAvailableAsync()
      .then((available) => {
        if (!isDisposed) {
          setTiltAvailable(available);
        }
      })
      .catch(() => {
        if (!isDisposed) {
          setTiltAvailable(false);
        }
      });

    return () => {
      isDisposed = true;
    };
  }, []);

  const updateStarPoint = useCallback(
    (nextPoint: { x: number; y: number }) => {
      const clampedPoint = clampStarPathPoint(nextPoint, boardWidth, boardHeight);
      setStarPoint(clampedPoint);
      setCollectibles((previous) => {
        const result = collectStarPathItems(previous, clampedPoint, 34);
        if (result.collectedNow > 0) {
          setCollectedCount((current) => current + result.collectedNow);
        }
        return result.items;
      });
    },
    [boardHeight, boardWidth]
  );

  useEffect(() => {
    if (!tiltEnabled || !tiltAvailable || Platform.OS === 'web') {
      return;
    }

    Accelerometer.setUpdateInterval(120);
    const subscription = Accelerometer.addListener((reading) => {
      setStarPoint((current) => {
        const moved = applyStarPathTilt(
          current,
          reading.x,
          -reading.y,
          8,
          boardWidth,
          boardHeight
        );
        setCollectibles((previous) => {
          const result = collectStarPathItems(previous, moved, 34);
          if (result.collectedNow > 0) {
            setCollectedCount((count) => count + result.collectedNow);
          }
          return result.items;
        });
        return moved;
      });
    });

    return () => {
      subscription.remove();
    };
  }, [boardHeight, boardWidth, tiltAvailable, tiltEnabled]);

  const totalCollectibles = collectibles.length;
  const isComplete = totalCollectibles > 0 && collectedCount >= totalCollectibles;

  return (
    <AppScreen>
      <AppHeader title="Star Path" onBack={() => navigation.goBack()} />
      <View style={styles.content}>
        <Text style={styles.subtitle}>Guide the star to collect every moonlight token.</Text>
        <View style={styles.metaRow}>
          <Text style={styles.metaText}>Collected: {collectedCount}/{totalCollectibles}</Text>
          <Text style={styles.metaText}>
            Tilt: {tiltEnabled && tiltAvailable ? 'On' : 'Off'}
          </Text>
        </View>

        <View
          style={[styles.board, { width: boardWidth, height: boardHeight }]}
          onStartShouldSetResponder={() => true}
          onResponderGrant={(event) =>
            updateStarPoint({ x: event.nativeEvent.locationX, y: event.nativeEvent.locationY })
          }
          onResponderMove={(event) =>
            updateStarPoint({ x: event.nativeEvent.locationX, y: event.nativeEvent.locationY })
          }
        >
          {collectibles.map((item) => (
            <View
              key={item.id}
              style={[
                styles.collectible,
                {
                  left: item.x - 12,
                  top: item.y - 12,
                  opacity: item.collected ? 0.2 : 1,
                },
              ]}
            >
              <Text style={styles.collectibleText}>🌙</Text>
            </View>
          ))}

          <View style={[styles.star, { left: starPoint.x - 16, top: starPoint.y - 16 }]}>
            <Text style={styles.starText}>⭐</Text>
          </View>
        </View>

        <View style={styles.actions}>
          <AppButton label="Reset Path" variant="secondary" onPress={resetScene} style={styles.actionButton} />
          <AppButton
            label={tiltEnabled ? 'Tilt Off' : 'Tilt On'}
            variant="ghost"
            onPress={() => setTiltEnabled((current) => !current)}
            disabled={!tiltAvailable}
            style={styles.actionButton}
          />
        </View>
        {isComplete && (
          <Text style={styles.completeText}>You found all the moonlight tokens. Beautiful guiding! ✨</Text>
        )}
      </View>
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
    metaRow: {
      flexDirection: 'row',
      gap: Space.lg,
      marginBottom: Space.sm,
    },
    metaText: {
      ...TypeStyle.buttonSm,
      color: colors.text,
    },
    board: {
      backgroundColor: colors.surfaceGame,
      borderRadius: 18,
      borderWidth: 2,
      borderColor: colors.border,
      overflow: 'hidden',
      marginBottom: Space.base,
    },
    collectible: {
      position: 'absolute',
      width: 24,
      height: 24,
      alignItems: 'center',
      justifyContent: 'center',
    },
    collectibleText: {
      fontSize: 18,
    },
    star: {
      position: 'absolute',
      width: 32,
      height: 32,
      alignItems: 'center',
      justifyContent: 'center',
    },
    starText: {
      fontSize: 26,
    },
    actions: {
      width: '100%',
      flexDirection: 'row',
      gap: Space.sm,
      marginBottom: Space.sm,
    },
    actionButton: {
      flex: 1,
    },
    completeText: {
      ...TypeStyle.bodySm,
      color: colors.success,
      textAlign: 'center',
    },
  });

