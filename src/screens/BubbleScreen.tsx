import React, { useCallback, useMemo, useState } from 'react';
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { BubbleField } from '../components/BubbleField';
import { ThemeColors } from '../types';
import { useSettings } from '../context/SettingsContext';
import { playBubblePopSound } from '../utils/sounds';
import { useThemeColors } from '../utils/theme';
import { AppScreen, AppHeader } from '../ui/components';
import { Space, TypeStyle } from '../ui/tokens';

export const BubbleScreen: React.FC = () => {
  const navigation = useNavigation();
  const { settings } = useSettings();
  const { colors } = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [poppedCount, setPoppedCount] = useState(0);
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();

  const boardSize = useMemo(() => {
    const width = Math.max(260, screenWidth - 24);
    const height = Math.max(320, Math.min(screenHeight * 0.72, screenHeight - 220));
    return { width, height };
  }, [screenHeight, screenWidth]);

  const handleBubblePop = useCallback(() => {
    setPoppedCount((count) => count + 1);
    void playBubblePopSound(settings);
  }, [settings]);

  return (
    <AppScreen>
      <AppHeader title="Bubble Pop" onBack={() => navigation.goBack()} />

      <View style={styles.content}>
        <Text style={styles.subtitle} accessibilityRole="text">
          Tap the falling bubbles to pop them.
        </Text>
        <Text style={styles.counter} accessibilityLabel={`Popped ${poppedCount} bubbles`}>
          Popped: {poppedCount}
        </Text>

        <View style={styles.boardWrap}>
          <BubbleField
            width={boardSize.width}
            height={boardSize.height}
            minActiveBubbles={2}
            maxActiveBubbles={12}
            onBubblePop={handleBubblePop}
          />
        </View>
      </View>
    </AppScreen>
  );
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    content: {
      flex: 1,
      alignItems: 'center',
      paddingHorizontal: Space.md,
      paddingTop: Space.base,
      paddingBottom: Space.md,
    },
    subtitle: {
      ...TypeStyle.bodySm,
      color: colors.textLight,
      textAlign: 'center',
      marginBottom: Space.sm,
    },
    counter: {
      ...TypeStyle.label,
      color: colors.text,
      marginBottom: Space.md,
    },
    boardWrap: {
      alignItems: 'center',
      justifyContent: 'center',
    },
  });

