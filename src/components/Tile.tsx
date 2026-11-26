import React from 'react';
import { TouchableOpacity, Text, StyleSheet, Animated, Platform, View } from 'react-native';
import { GamePicture } from '../ui/components/GamePicture';
import { ThemeColors, Tile as TileType } from '../types';
import { useAnimationEnabled } from '../ui/animations';
import { useThemeColors } from '../utils/theme';
import { ON_ACCENT_TEXT, Radius } from '../ui/tokens';
import { useTranslation } from 'react-i18next';
import { ControlIcon } from '../ui/components/ControlIcon';

interface TileProps {
  tile: TileType;
  onPress: () => void;
  size: number;
  position: number;
  locked?: boolean;
  canDismissMismatch?: boolean;
}

const TileComponent: React.FC<TileProps> = ({
  tile,
  onPress,
  size,
  position,
  locked,
  canDismissMismatch,
}) => {
  const animationsEnabled = useAnimationEnabled();
  const { colors } = useThemeColors();
  const { t } = useTranslation();
  const translate = t as unknown as (key: string, options?: Record<string, unknown>) => string;
  const styles = React.useMemo(() => createStyles(colors), [colors]);
  const [scaleAnim] = React.useState(() => new Animated.Value(1));
  const isFaceUp = tile.isFlipped || tile.isMatched;
  const wasFaceUp = React.useRef(isFaceUp);
  const disabled = !canDismissMismatch && (locked || isFaceUp);

  React.useEffect(() => {
    const changed = wasFaceUp.current !== isFaceUp;
    wasFaceUp.current = isFaceUp;
    if (!animationsEnabled || !changed) {
      scaleAnim.setValue(1);
      return;
    }
    scaleAnim.setValue(0.95);
    const animation = Animated.timing(scaleAnim, {
      toValue: 1,
      duration: 160,
      useNativeDriver: Platform.OS !== 'web',
    });
    animation.start();
    return () => animation.stop();
  }, [isFaceUp, animationsEnabled, scaleAnim]);

  const tileStyle = tile.isMatched
    ? styles.tileMatched
    : isFaceUp
      ? styles.tileFaceUp
      : styles.tileFaceDown;

  const value = tile.name
    ? translate('games.memorySnap.cardValues.' + tile.name, { defaultValue: tile.name })
    : tile.value;
  const accessibilityLabel = tile.isMatched
    ? t('games.memorySnap.tileMatched', { position, value })
    : isFaceUp
      ? t('games.memorySnap.tileFaceUp', { position, value })
      : t('games.memorySnap.tileFaceDown', { position });
  const accessibilityHint = canDismissMismatch
    ? t('games.memorySnap.tileDismissHint')
    : disabled
      ? undefined
      : t('games.memorySnap.tileFlipHint');

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      style={[styles.container, { width: size, height: size }]}
      hitSlop={4}
      activeOpacity={0.8}
      accessibilityRole='button'
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled }}
    >
      <Animated.View
        style={[
          styles.tile,
          tileStyle,
          canDismissMismatch && styles.tileRetry,
          { transform: [{ scale: scaleAnim }] },
        ]}
        accessibilityElementsHidden
        importantForAccessibility='no-hide-descendants'
        aria-hidden
      >
        {isFaceUp ? (
          <GamePicture name={tile.name ?? tile.value} size={Math.min(60, Math.floor(size * 0.6))} />
        ) : (
          <Text
            allowFontScaling={false}
            style={[
              styles.questionMark,
              { fontSize: Math.max(15, Math.min(34, Math.floor(size * 0.5))) },
            ]}
          >
            ?
          </Text>
        )}
        {tile.isMatched ? (
          <Text allowFontScaling={false} style={styles.matchMark}>
            ✓
          </Text>
        ) : null}
        {canDismissMismatch ? (
          <View style={styles.tapCue} testID='memory-mismatch-tap-cue'>
            <ControlIcon name='tap' color={colors.text} size={Math.min(22, size / 3)} />
          </View>
        ) : null}
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
    tileFaceDown: {
      backgroundColor: colors.cardBack,
      borderWidth: 2,
      borderColor: colors.border,
    },
    tileFaceUp: {
      backgroundColor: colors.cardFront,
      borderWidth: 2,
      borderColor: colors.cardBack,
    },
    tileMatched: {
      backgroundColor: colors.matched,
      borderWidth: 2,
      borderColor: colors.cardBack,
    },
    tileRetry: { borderColor: colors.primary },
    tapCue: {
      position: 'absolute',
      top: 2,
      right: 2,
      borderRadius: Radius.full,
      backgroundColor: colors.surface,
      padding: 2,
    },
    questionMark: {
      color: colors.text,
      fontWeight: '700',
    },
    matchMark: {
      position: 'absolute',
      top: 1,
      right: 3,
      color: ON_ACCENT_TEXT,
      fontSize: 15,
      fontWeight: '700',
    },
  });
