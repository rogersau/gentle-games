import React from 'react';
import { AccessibilityState, Pressable, StyleSheet, Text, ViewStyle } from 'react-native';
import { useThemeColors } from '../../utils/theme';
import { Space, TypeStyle } from '../tokens';
import { GameArtwork } from './GameArtwork';
import { useTranslation } from 'react-i18next';
import type { GameId } from '../../games/registry';
import type { ThemeColors } from '../../types';

const tileColors: Record<GameId, keyof ThemeColors> = {
  'memory-snap': 'sky',
  drawing: 'rose',
  'glitter-fall': 'lavender',
  'bubble-pop': 'sage',
  'category-match': 'butter',
  'keepy-uppy': 'peach',
  'breathing-garden': 'sage',
  'pattern-train': 'sky',
  'number-picnic': 'butter',
};

interface GameCardProps {
  gameId: GameId;
  title: string;
  description: string;
  onPress: () => void;
  artworkSize?: number;
  style?: ViewStyle;
  accessibilityState?: AccessibilityState;
  disabled?: boolean;
  testID?: string;
}

export const GameCard: React.FC<GameCardProps> = ({
  gameId,
  title,
  description,
  onPress,
  artworkSize = 90,
  style,
  accessibilityState,
  disabled,
  testID,
}) => {
  const { colors, resolvedMode } = useThemeColors();
  const { t } = useTranslation();
  const subtleBorder =
    resolvedMode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(61, 68, 77, 0.07)';

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: colors[tileColors[gameId]],
          borderColor: pressed ? colors.skyInk : subtleBorder,
          opacity: pressed ? 0.92 : 1,
        },
        style,
      ]}
      accessibilityLabel={t('accessibility.gameCardLabel', { title, description })}
      accessibilityHint={t('accessibility.gameCardHint')}
      accessibilityRole='button'
      accessibilityState={{ ...accessibilityState, disabled }}
      disabled={disabled}
      testID={testID}
    >
      <GameArtwork gameId={gameId} size={artworkSize} />
      <Text style={[TypeStyle.prompt, styles.title, { color: colors.text }]}>{title}</Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: Space.xs + 2,
    borderRadius: 22,
    borderWidth: 1.5,
    paddingVertical: Space.md,
    paddingHorizontal: Space.sm,
    flex: 1,
  },
  title: { fontSize: 15, lineHeight: 20, textAlign: 'center' },
});
