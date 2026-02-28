import React, { useCallback, useMemo, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BubbleField } from '../components/BubbleField';
import { ThemeColors } from '../types';
import { useSettings } from '../context/SettingsContext';
import { playBubblePopSound } from '../utils/sounds';
import { ResolvedThemeMode, useThemeColors } from '../utils/theme';

export const BubbleScreen: React.FC = () => {
  const navigation = useNavigation();
  const { settings } = useSettings();
  const { colors, resolvedMode } = useThemeColors();
  const styles = useMemo(() => createStyles(colors, resolvedMode), [colors, resolvedMode]);
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
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Bubble Pop</Text>
        <View style={styles.backPlaceholder} />
      </View>

      <View style={styles.content}>
        <Text style={styles.subtitle}>Tap the falling bubbles to pop them.</Text>
        <Text style={styles.counter}>Popped: {poppedCount}</Text>

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
    </SafeAreaView>
  );
};

const createStyles = (colors: ThemeColors, resolvedMode: ResolvedThemeMode) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.cardBack,
    },
    backButton: {
      minWidth: 92,
      height: 40,
      borderRadius: 20,
      borderWidth: 2,
      borderColor: colors.cardBack,
      backgroundColor: colors.cardFront,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 12,
    },
    backButtonText: {
      fontSize: 16,
      fontWeight: '700',
      color: resolvedMode === 'dark' ? colors.background : colors.text,
    },
    backPlaceholder: {
      width: 92,
    },
    title: {
      fontSize: 22,
      fontWeight: '700',
      color: colors.text,
    },
    content: {
      flex: 1,
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingTop: 16,
      paddingBottom: 12,
    },
    subtitle: {
      fontSize: 14,
      color: colors.textLight,
      textAlign: 'center',
      marginBottom: 8,
    },
    counter: {
      fontSize: 18,
      color: colors.text,
      fontWeight: '600',
      marginBottom: 14,
    },
    boardWrap: {
      alignItems: 'center',
      justifyContent: 'center',
    },
  });

