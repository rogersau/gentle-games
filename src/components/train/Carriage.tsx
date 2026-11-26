import { GamePicture } from '../../ui/components/GamePicture';
import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import Svg, { Rect, Circle } from 'react-native-svg';
import { useThemeColors } from '../../utils/theme';

interface CarriageProps {
  content?: string;
  size?: number;
  color?: string;
  isMissing?: boolean;
  isHighlighted?: boolean;
}

export const Carriage: React.FC<CarriageProps> = ({
  content,
  size = 56,
  color,
  isMissing = false,
  isHighlighted = false,
}) => {
  const { colors } = useThemeColors();
  const carriageColor = color || colors.secondary;

  return (
    <View
      style={[
        styles.container,
        { width: size, height: size * 0.8 },

        isHighlighted && styles.highlightedContainer,
      ]}
    >
      <Svg width={size} height={size * 0.8} viewBox='0 0 70 56'>
        {/* Main carriage body - outline style */}
        <Rect
          x='5'
          y='3'
          width='60'
          height='40'
          rx='6'
          fill={isMissing ? colors.sky : colors.surfaceGame}
          stroke={isMissing ? colors.skyInk : carriageColor}
          strokeWidth={isMissing ? 3 : 2}
          strokeDasharray={isMissing ? '8,4' : undefined}
        />

        {/* Wheels */}
        <Circle cx='18' cy='48' r='7' fill='#4A4A4A' />
        <Circle cx='18' cy='48' r='3.5' fill='#666666' />
        <Circle cx='52' cy='48' r='7' fill='#4A4A4A' />
        <Circle cx='52' cy='48' r='3.5' fill='#666666' />

        {/* Connector on left */}
        <Rect
          x='0'
          y='22'
          width='8'
          height='12'
          rx='2'
          fill='transparent'
          stroke={isMissing ? colors.skyInk : carriageColor}
          strokeWidth={isMissing ? 2 : 1}
        />

        {/* Connector on right */}
        <Rect
          x='62'
          y='22'
          width='8'
          height='12'
          rx='2'
          fill='transparent'
          stroke={isMissing ? colors.skyInk : carriageColor}
          strokeWidth={isMissing ? 2 : 1}
        />
      </Svg>

      {content && (
        <View style={styles.contentContainer}>
          {content === '?' ? (
            <Text
              allowFontScaling={false}
              style={[
                styles.contentText,
                { fontSize: Math.max(15, size * 0.41), color: colors.skyInk },
              ]}
            >
              ?
            </Text>
          ) : (
            <GamePicture name={content} size={size * 0.55} />
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  highlightedContainer: {
    transform: [{ scale: 1.05 }],
  },
  contentContainer: {
    position: 'absolute',
    top: '3%',
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentText: {
    textAlign: 'center',
  },
});
