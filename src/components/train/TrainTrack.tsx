import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Line, Rect } from 'react-native-svg';
import { useThemeColors } from '../../utils/theme';

interface TrainTrackProps {
  width?: number;
}

export const TrainTrack: React.FC<TrainTrackProps> = ({ width = 400 }) => {
  const { colors } = useThemeColors();
  const tieSpacing = 40;
  const numTies = Math.ceil(width / tieSpacing);
  
  return (
    <View style={styles.container}>
      <Svg width={width} height="24" viewBox={`0 0 ${width} 24`}>
        {/* Rails */}
        <Line
          x1="0"
          y1="6"
          x2={width}
          y2="6"
          stroke={colors.textLight}
          strokeWidth="3"
          strokeLinecap="round"
        />
        <Line
          x1="0"
          y1="18"
          x2={width}
          y2="18"
          stroke={colors.textLight}
          strokeWidth="3"
          strokeLinecap="round"
        />
        
        {/* Railroad ties */}
        {Array.from({ length: numTies }, (_, i) => (
          <Rect
            key={i}
            x={i * tieSpacing + 10}
            y="2"
            width="8"
            height="20"
            rx="2"
            fill={colors.border}
            opacity="0.6"
          />
        ))}
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 24,
    justifyContent: 'center',
  },
});
