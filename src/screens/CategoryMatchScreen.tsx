import React, { useCallback, useMemo, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CategoryMatchCategory, CategoryMatchItem, ThemeColors } from '../types';
import { CategoryMatchBoard } from '../components/CategoryMatchBoard';
import { useThemeColors } from '../utils/theme';

export const CategoryMatchScreen: React.FC = () => {
  const navigation = useNavigation();
  const { colors } = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [correctCount, setCorrectCount] = useState(0);
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();

  const boardSize = useMemo(() => {
    const width = Math.max(280, screenWidth - 24);
    const height = Math.max(360, Math.min(screenHeight * 0.7, screenHeight - 220));
    return { width, height };
  }, [screenHeight, screenWidth]);

  const handleCorrectMatch = useCallback(
    (_item: CategoryMatchItem, _category: CategoryMatchCategory) => {
      setCorrectCount((count) => count + 1);
    },
    []
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Category Match</Text>
        <View style={styles.backPlaceholder} />
      </View>

      <View style={styles.content}>
        <Text style={styles.subtitle}>Sort each emoji into Animals, Objects, or Shapes.</Text>
        <Text style={styles.counter}>Correct: {correctCount}</Text>

        <View style={styles.boardWrap}>
          <CategoryMatchBoard
            width={boardSize.width}
            height={boardSize.height}
            onCorrectMatch={handleCorrectMatch}
          />
        </View>
      </View>
    </SafeAreaView>
  );
};

const createStyles = (colors: ThemeColors) =>
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
      width: 40,
      padding: 8,
    },
    backButtonText: {
      fontSize: 24,
      color: colors.text,
    },
    backPlaceholder: {
      width: 40,
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

