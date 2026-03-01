import { useRef, useCallback } from 'react';
import { Animated, Easing } from 'react-native';
import { useSettings } from '../context/SettingsContext';

/** Returns whether animations are enabled in user settings */
export const useAnimationEnabled = (): boolean => {
  const { settings } = useSettings();
  return settings.animationsEnabled;
};

/** Fade in from 0 to 1 */
export const useFadeIn = (duration = 300) => {
  const opacity = useRef(new Animated.Value(0)).current;
  const enabled = useAnimationEnabled();

  const fadeIn = useCallback(() => {
    if (!enabled) {
      opacity.setValue(1);
      return;
    }
    opacity.setValue(0);
    Animated.timing(opacity, {
      toValue: 1,
      duration,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();
  }, [opacity, duration, enabled]);

  return { opacity, fadeIn };
};

/** Gentle bounce scale (1 → 1.05 → 1) */
export const useGentleBounce = () => {
  const scale = useRef(new Animated.Value(1)).current;
  const enabled = useAnimationEnabled();

  const bounce = useCallback(() => {
    if (!enabled) return;
    Animated.sequence([
      Animated.timing(scale, {
        toValue: 1.05,
        duration: 120,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(scale, {
        toValue: 1,
        duration: 120,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start();
  }, [scale, enabled]);

  return { scale, bounce };
};

/** Scale press feedback (1 → 0.96 → 1) for buttons */
export const useScalePress = () => {
  const scale = useRef(new Animated.Value(1)).current;
  const enabled = useAnimationEnabled();

  const onPressIn = useCallback(() => {
    if (!enabled) return;
    Animated.timing(scale, {
      toValue: 0.96,
      duration: 80,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();
  }, [scale, enabled]);

  const onPressOut = useCallback(() => {
    if (!enabled) return;
    Animated.timing(scale, {
      toValue: 1,
      duration: 100,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();
  }, [scale, enabled]);

  return { scale, onPressIn, onPressOut };
};
