import React, { useState } from 'react';
import { Image, ImageSourcePropType, StyleSheet } from 'react-native';
import type { GameId } from '../../games/registry';
import { GameIcon } from './GameIcon';

interface GameArtworkProps {
  gameId: GameId;
  size?: number;
  fallbackColor?: string;
  testID?: string;
}

const GAME_ARTWORK = {
  'memory-snap': require('../../assets/game-icons/memory-snap.png'),
  drawing: require('../../assets/game-icons/drawing.png'),
  'glitter-fall': require('../../assets/game-icons/glitter-fall.png'),
  'bubble-pop': require('../../assets/game-icons/bubble-pop.png'),
  'category-match': require('../../assets/game-icons/category-match.png'),
  'keepy-uppy': require('../../assets/game-icons/keepy-uppy.png'),
  'breathing-garden': require('../../assets/game-icons/breathing-garden.png'),
  'pattern-train': require('../../assets/game-icons/pattern-train.png'),
  'number-picnic': require('../../assets/game-icons/number-picnic.png'),
} satisfies Record<GameId, ImageSourcePropType>;

export const GameArtwork: React.FC<GameArtworkProps> = ({
  gameId,
  size = 64,
  fallbackColor,
  testID = `game-artwork-${gameId}`,
}) => {
  const [loadFailed, setLoadFailed] = useState(false);

  if (loadFailed) {
    return (
      <GameIcon gameId={gameId} color={fallbackColor} size={size} testID={`${testID}-fallback`} />
    );
  }

  return (
    <Image
      source={GAME_ARTWORK[gameId]}
      style={[styles.image, { width: size, height: size }]}
      resizeMode='contain'
      fadeDuration={0}
      accessible={false}
      testID={testID}
      onError={() => setLoadFailed(true)}
    />
  );
};

const styles = StyleSheet.create({
  image: {
    flexShrink: 0,
  },
});
