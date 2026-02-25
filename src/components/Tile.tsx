import React from 'react';
import { TouchableOpacity, Text, StyleSheet, Animated } from 'react-native';
import { Tile as TileType } from '../types';
import { useSettings } from '../context/SettingsContext';

interface TileProps {
  tile: TileType;
  onPress: () => void;
  size: number;
}

export const Tile: React.FC<TileProps> = ({ tile, onPress, size }) => {
  const { settings } = useSettings();
  const flipAnim = React.useRef(new Animated.Value(tile.isFlipped ? 1 : 0)).current;
  
  const emojiSize = Math.floor(size * 0.6);
  const minEmojiSize = 20;
  const maxEmojiSize = 60;
  const finalEmojiSize = Math.max(minEmojiSize, Math.min(maxEmojiSize, emojiSize));
  
  const questionSize = Math.floor(finalEmojiSize * 0.8);

  React.useEffect(() => {
    if (settings.animationsEnabled) {
      Animated.spring(flipAnim, {
        toValue: tile.isFlipped ? 1 : 0,
        friction: 8,
        tension: 10,
        useNativeDriver: true,
      }).start();
    } else {
      flipAnim.setValue(tile.isFlipped ? 1 : 0);
    }
  }, [tile.isFlipped, settings.animationsEnabled]);

  const frontInterpolate = flipAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  const backInterpolate = flipAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['180deg', '360deg'],
  });

  const frontAnimatedStyle = {
    transform: [{ rotateY: frontInterpolate }],
  };

  const backAnimatedStyle = {
    transform: [{ rotateY: backInterpolate }],
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={tile.isFlipped || tile.isMatched}
      style={[styles.container, { width: size, height: size }]}
      activeOpacity={0.8}
    >
      <Animated.View
        style={[
          styles.tile,
          styles.front,
          frontAnimatedStyle,
          { opacity: tile.isFlipped ? 0 : 1 },
        ]}
      >
        <Text style={[styles.backText, { fontSize: questionSize }]}>?</Text>
      </Animated.View>

      <Animated.View
        style={[
          styles.tile,
          styles.back,
          backAnimatedStyle,
          { opacity: tile.isFlipped ? 1 : 0 },
          tile.isMatched && styles.matched,
        ]}
      >
        <Text style={[styles.emoji, { fontSize: finalEmojiSize }, tile.isMatched && styles.matchedEmoji]}>
          {tile.value}
        </Text>
      </Animated.View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    margin: 4,
  },
  tile: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backfaceVisibility: 'hidden',
  },
  front: {
    backgroundColor: '#E8E4E1',
    borderWidth: 2,
    borderColor: '#D4D0CD',
  },
  back: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E8E4E1',
  },
  matched: {
    backgroundColor: '#F0F0F0',
    borderColor: '#D3D3D3',
    opacity: 0.6,
  },
  backText: {
    fontSize: 32,
    color: '#B8B8B8',
    fontWeight: '600',
  },
  emoji: {
    fontSize: 40,
  },
  matchedEmoji: {
    opacity: 0.5,
  },
});
