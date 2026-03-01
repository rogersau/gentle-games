import React from 'react';
import { TouchableOpacity, Text, StyleSheet, Animated, View } from 'react-native';
import { ThemeColors, Tile as TileType } from '../types';
import { useSettings } from '../context/SettingsContext';
import { useThemeColors } from '../utils/theme';
import { Radius } from '../ui/tokens';

interface TileProps {
  tile: TileType;
  onPress: () => void;
  size: number;
}

const TileComponent: React.FC<TileProps> = ({ tile, onPress, size }) => {
  const { settings } = useSettings();
  const { colors } = useThemeColors();
  const styles = React.useMemo(() => createStyles(colors), [colors]);
  const scaleAnim = React.useRef(new Animated.Value(1)).current;

  const emojiSize = Math.floor(size * 0.6);
  const minEmojiSize = 20;
  const maxEmojiSize = 60;
  const finalEmojiSize = Math.max(minEmojiSize, Math.min(maxEmojiSize, emojiSize));

  const [showFront, setShowFront] = React.useState(!tile.isFlipped);

  React.useEffect(() => {
    if (settings.animationsEnabled) {
      Animated.timing(scaleAnim, {
        toValue: 0,
        duration: 120,
        useNativeDriver: true,
      }).start(() => {
        setShowFront(!tile.isFlipped);
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 120,
          useNativeDriver: true,
        }).start();
      });
    } else {
      setShowFront(!tile.isFlipped);
      scaleAnim.setValue(1);
    }
  }, [tile.isFlipped, settings.animationsEnabled]);

  const tileStyle = tile.isMatched ? styles.tileMatched : (showFront ? styles.tileFront : styles.tileBack);

  const accessibilityLabel = tile.isMatched
    ? `${tile.value}, matched`
    : tile.isFlipped
    ? `${tile.value}, face up`
    : 'Card, face down';

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={tile.isFlipped || tile.isMatched}
      style={[styles.container, { width: size, height: size }]}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={!tile.isFlipped && !tile.isMatched ? 'Double tap to flip this card' : undefined}
    >
      <Animated.View
        style={[
          styles.tile,
          tileStyle,
          { transform: [{ scaleX: scaleAnim }] },
        ]}
      >
        {showFront ? (
          <View style={styles.cardBack}>
            <View style={styles.swirlBackground}>
              <View style={[styles.swirl, styles.swirl1]} />
              <View style={[styles.swirl, styles.swirl2]} />
              <View style={[styles.swirl, styles.swirl3]} />
            </View>
            <Text style={styles.questionMark}>?</Text>
          </View>
        ) : (
          <Text style={[styles.emoji, { fontSize: finalEmojiSize }, tile.isMatched ? styles.matchedEmoji : undefined]}>
            {tile.value}
          </Text>
        )}
      </Animated.View>
    </TouchableOpacity>
  );
};

export const Tile = React.memo(TileComponent);

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      margin: 4,
    },
    tile: {
      width: '100%',
      height: '100%',
      borderRadius: Radius.md,
      justifyContent: 'center',
      alignItems: 'center',
      overflow: 'hidden',
    },
    tileFront: {
      backgroundColor: colors.cardBack,
      borderWidth: 2,
      borderColor: colors.matched,
    },
    tileBack: {
      backgroundColor: colors.cardFront,
      borderWidth: 2,
      borderColor: colors.cardBack,
    },
    tileMatched: {
      backgroundColor: colors.matched,
      borderWidth: 2,
      borderColor: colors.cardBack,
      opacity: 0.65,
    },
    cardBack: {
      flex: 1,
      width: '100%',
      height: '100%',
      justifyContent: 'center',
      alignItems: 'center',
      position: 'relative',
    },
    swirlBackground: {
      position: 'absolute',
      width: '100%',
      height: '100%',
      opacity: 0.4,
    },
    swirl: {
      position: 'absolute',
      borderRadius: 100,
    },
    swirl1: {
      width: '80%',
      height: '80%',
      backgroundColor: colors.secondary,
      top: '-20%',
      left: '-20%',
      transform: [{ rotate: '45deg' }],
    },
    swirl2: {
      width: '60%',
      height: '60%',
      backgroundColor: colors.primary,
      bottom: '-10%',
      right: '-10%',
      transform: [{ rotate: '-30deg' }],
    },
    swirl3: {
      width: '50%',
      height: '50%',
      backgroundColor: colors.cardFront,
      top: '25%',
      left: '25%',
      transform: [{ rotate: '60deg' }],
    },
    questionMark: {
      fontSize: 42,
      color: colors.text,
      fontWeight: '700',
      textShadowColor: 'rgba(255, 255, 255, 0.5)',
      textShadowOffset: { width: 1, height: 1 },
      textShadowRadius: 2,
      zIndex: 10,
    },
    emoji: {
      fontSize: 40,
    },
    matchedEmoji: {},
  });
