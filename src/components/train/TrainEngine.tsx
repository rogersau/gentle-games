import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Rect, Circle } from 'react-native-svg';
import { useThemeColors } from '../../utils/theme';

interface TrainEngineProps {
  size?: number;
  color?: string;
}

export const TrainEngine: React.FC<TrainEngineProps> = ({ size = 64, color }) => {
  const { colors } = useThemeColors();
  const trainColor = color || colors.primary;

  return (
    <View style={[styles.container, { width: size, height: size * 0.75 }]}>
      <Svg width={size} height={size * 0.75} viewBox='0 0 80 60'>
        {/* Main body */}
        <Rect x='10' y='20' width='50' height='30' rx='4' fill={trainColor} />

        {/* Cabin */}
        <Rect x='50' y='10' width='20' height='40' rx='3' fill={trainColor} />

        {/* Window */}
        <Rect x='55' y='15' width='10' height='10' rx='2' fill='#FFFFFF' opacity='0.8' />

        {/* Chimney */}
        <Rect x='35' y='5' width='8' height='15' rx='2' fill={trainColor} />
        <Rect x='33' y='2' width='12' height='6' rx='2' fill={trainColor} />

        {/* Wheels */}
        <Circle cx='20' cy='52' r='8' fill='#4A4A4A' />
        <Circle cx='20' cy='52' r='4' fill='#666666' />
        <Circle cx='50' cy='52' r='8' fill='#4A4A4A' />
        <Circle cx='50' cy='52' r='4' fill='#666666' />
        <Circle cx='70' cy='52' r='6' fill='#4A4A4A' />
        <Circle cx='70' cy='52' r='3' fill='#666666' />
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});
