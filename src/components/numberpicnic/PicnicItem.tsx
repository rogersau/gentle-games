import React, { useEffect, useRef, useMemo } from 'react';
import {
  Animated,
  TouchableOpacity,
  StyleSheet,
  Text,
  View,
  ViewStyle,
  Easing,
} from 'react-native';
import { useSettings } from '../../context/SettingsContext';
import { Space } from '../../ui/tokens';

interface PicnicItemProps {
  emoji: string;
  onPress: () => void;
  isAnimating: boolean;
  onAnimationComplete?: () => void;
  style?: ViewStyle;
  accessible?: boolean;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  testID?: string;
}

export const PicnicItem: React.FC<PicnicItemProps> = ({
  emoji,
  onPress,
  isAnimating,
  onAnimationComplete,
  style,
  accessible = true,
  accessibilityLabel,
  accessibilityHint,
  testID,
}) => {
  const { settings } = useSettings();
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    if (isAnimating) return;
    onPress();
  };

  useEffect(() => {
    if (isAnimating) {
      const duration = settings.animationsEnabled && !settings.reducedMotionEnabled ? 300 : 50;

      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 0,
          duration,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: -50,
          duration,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration,
          useNativeDriver: true,
        }),
      ]).start(() => {
        // Reset for next use
        scaleAnim.setValue(1);
        translateY.setValue(0);
        opacity.setValue(1);
        onAnimationComplete?.();
      });
    }
  }, [isAnimating, settings.animationsEnabled, settings.reducedMotionEnabled, onAnimationComplete]);

  const animatedStyle = useMemo(
    () => ({
      transform: [{ scale: scaleAnim }, { translateY }],
      opacity,
    }),
    [scaleAnim, translateY, opacity],
  );

  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.7}
      disabled={isAnimating}
      accessible={accessible}
      accessibilityLabel={accessibilityLabel || emoji}
      accessibilityRole='button'
      accessibilityHint={accessibilityHint}
      testID={testID}
    >
      <Animated.View style={[styles.container, animatedStyle, style]}>
        <Text style={styles.emoji} selectable={false}>
          {emoji}
        </Text>
      </Animated.View>
    </TouchableOpacity>
  );
};

interface PicnicItemPlaceholderProps {
  style?: ViewStyle;
}

export const PicnicItemPlaceholder: React.FC<PicnicItemPlaceholderProps> = ({ style }) => (
  <View style={[styles.container, styles.placeholder, style]}>
    <View style={styles.placeholderInner} />
  </View>
);

const styles = StyleSheet.create({
  container: {
    width: 56,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    margin: Space.xs,
  },
  emoji: {
    fontSize: 36,
    textAlign: 'center',
  },
  placeholder: {
    backgroundColor: 'rgba(0, 0, 0, 0.03)',
    borderRadius: 12,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  placeholderInner: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
});
