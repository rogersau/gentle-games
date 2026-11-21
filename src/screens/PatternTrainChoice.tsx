import React, { useMemo, useRef, useState } from 'react';
import {
  Animated,
  PanResponder,
  Platform,
  Pressable,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';
import { Carriage } from '../components/train';
import { HitTarget } from '../ui/tokens';

interface PatternTrainChoiceProps {
  emoji: string;
  label: string;
  hint: string;
  size: number;
  disabled: boolean;
  animationsEnabled: boolean;
  onChoose: (emoji: string) => void;
  onDrop: (emoji: string, x: number, y: number) => void;
}

export function PatternTrainChoice({
  emoji,
  label,
  hint,
  size,
  disabled,
  animationsEnabled,
  onChoose,
  onDrop,
}: PatternTrainChoiceProps) {
  const [position] = useState(() => new Animated.ValueXY());
  const dragged = useRef(false);
  const panResponder = useMemo(() => {
    const resetPosition = () => {
      if (animationsEnabled) {
        Animated.timing(position, {
          toValue: { x: 0, y: 0 },
          duration: 160,
          useNativeDriver: Platform.OS !== 'web',
        }).start();
      } else {
        position.setValue({ x: 0, y: 0 });
      }
    };

    return PanResponder.create({
      onStartShouldSetPanResponderCapture: (_, gesture) => {
        if (gesture.numberActiveTouches === 1) dragged.current = false;
        return false;
      },
      onMoveShouldSetPanResponder: (_, gesture) =>
        !disabled &&
        gesture.numberActiveTouches === 1 &&
        (Math.abs(gesture.dx) > 8 || Math.abs(gesture.dy) > 8),
      onPanResponderGrant: () => {
        dragged.current = true;
        position.setValue({ x: 0, y: 0 });
      },
      onPanResponderMove: (_, gesture) => {
        position.setValue({ x: gesture.dx, y: gesture.dy });
      },
      onPanResponderRelease: (event) => {
        const { pageX, pageY } = event.nativeEvent;
        resetPosition();
        if (Platform.OS === 'web') event.preventDefault();
        if (!disabled) onDrop(emoji, pageX, pageY);
      },
      onPanResponderTerminationRequest: () => false,
      onPanResponderTerminate: resetPosition,
    });
  }, [animationsEnabled, disabled, emoji, onDrop, position]);

  return (
    <View
      collapsable={false}
      style={Platform.OS === 'web' ? webDragStyle : undefined}
      {...panResponder.panHandlers}
    >
      <Pressable
        onPress={(event) => {
          // React Native Web can dispatch a pointer click after the drag has ended.
          const nativeEvent = event?.nativeEvent;
          if (
            dragged.current &&
            nativeEvent &&
            'detail' in nativeEvent &&
            typeof nativeEvent.detail === 'number' &&
            nativeEvent.detail > 0
          ) {
            return;
          }
          onChoose(emoji);
        }}
        disabled={disabled}
        accessibilityRole='button'
        accessibilityLabel={label}
        accessibilityHint={hint}
        accessibilityState={{ disabled }}
        style={({ pressed }) => [styles.button, pressed && styles.pressed]}
      >
        <Animated.View
          pointerEvents='none'
          style={{ transform: [{ translateX: position.x }, { translateY: position.y }] }}
        >
          <Carriage content={emoji} size={size} />
        </Animated.View>
      </Pressable>
    </View>
  );
}

const webDragStyle = { touchAction: 'none' } as ViewStyle;

const styles = StyleSheet.create({
  button: { minHeight: HitTarget.min, justifyContent: 'center' },
  pressed: { opacity: 0.85 },
});
