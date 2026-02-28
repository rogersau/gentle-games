import React, { useCallback, useMemo, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  CATEGORY_MATCH_LAND,
  CATEGORY_MATCH_CATEGORIES,
  CATEGORY_MATCH_OCEAN,
  CATEGORY_MATCH_SKY,
  CategoryMatchCategory,
  CategoryMatchItem,
  ThemeColors,
} from '../types';
import { CategoryMatchBoard } from '../components/CategoryMatchBoard';
import { ResolvedThemeMode, useThemeColors } from '../utils/theme';

export const CategoryMatchScreen: React.FC = () => {
  const navigation = useNavigation();
  const { colors, resolvedMode } = useThemeColors();
  const styles = useMemo(() => createStyles(colors, resolvedMode), [colors, resolvedMode]);
  const [correctCount, setCorrectCount] = useState(0);
  const [streakCount, setStreakCount] = useState(0);
  const [showPreview, setShowPreview] = useState(true);
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();

  const boardSize = useMemo(() => {
    const width = Math.max(280, screenWidth - 24);
    const height = Math.max(360, Math.min(screenHeight * 0.7, screenHeight - 220));
    return { width, height };
  }, [screenHeight, screenWidth]);

  const categoryExamples = useMemo(
    () => ({
      sky: CATEGORY_MATCH_SKY.slice(0, 2).map((item) => item.emoji).join(' '),
      land: CATEGORY_MATCH_LAND.slice(0, 2).map((item) => item.emoji).join(' '),
      ocean: CATEGORY_MATCH_OCEAN.slice(0, 2).map((item) => item.emoji).join(' '),
    }),
    []
  );

  const handleCorrectMatch = useCallback(
    (_item: CategoryMatchItem, _category: CategoryMatchCategory) => {
      setCorrectCount((count) => count + 1);
      setStreakCount((current) => current + 1);
    },
    []
  );

  const handleIncorrectMatch = useCallback(() => {
    setStreakCount(0);
  }, []);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Category Match</Text>
        <View style={styles.backPlaceholder} />
      </View>

      <View style={styles.content}>
        <Text style={styles.subtitle}>Sort each emoji into Sky, Land, or Ocean.</Text>
        <Text style={styles.counter}>Correct: {correctCount}</Text>
        {streakCount >= 3 ? <Text style={styles.encouragement}>You're on a roll! ✨</Text> : null}

        {showPreview ? (
          <View style={styles.previewCard}>
            <Text style={styles.previewTitle}>Quick Preview</Text>
            <Text style={styles.previewText}>Drag each emoji into the matching category.</Text>
            {CATEGORY_MATCH_CATEGORIES.map((category) => (
              <View key={category.id} style={styles.previewRow}>
                <Text style={styles.previewCategoryLabel}>
                  {category.icon} {category.label}
                </Text>
                <Text style={styles.previewExamples}>{categoryExamples[category.id]}</Text>
              </View>
            ))}
            <TouchableOpacity style={styles.startButton} onPress={() => setShowPreview(false)}>
              <Text style={styles.startButtonText}>Start Sorting</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.boardWrap}>
            <CategoryMatchBoard
              width={boardSize.width}
              height={boardSize.height}
              onCorrectMatch={handleCorrectMatch}
              onIncorrectMatch={handleIncorrectMatch}
            />
          </View>
        )}
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
    encouragement: {
      fontSize: 16,
      color: colors.success,
      fontWeight: '700',
      marginBottom: 12,
    },
    boardWrap: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    previewCard: {
      width: '95%',
      backgroundColor: colors.cardFront,
      borderRadius: 18,
      borderWidth: 2,
      borderColor: colors.cardBack,
      padding: 16,
      gap: 10,
    },
    previewTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: resolvedMode === 'dark' ? colors.background : colors.text,
      textAlign: 'center',
    },
    previewText: {
      fontSize: 14,
      color: resolvedMode === 'dark' ? colors.background : colors.textLight,
      textAlign: 'center',
      marginBottom: 6,
    },
    previewRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 4,
    },
    previewCategoryLabel: {
      fontSize: 16,
      fontWeight: '600',
      color: resolvedMode === 'dark' ? colors.background : colors.text,
    },
    previewExamples: {
      fontSize: 20,
      color: resolvedMode === 'dark' ? colors.background : colors.text,
    },
    startButton: {
      marginTop: 6,
      backgroundColor: colors.primary,
      borderRadius: 22,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 12,
    },
    startButtonText: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.cardFront,
    },
  });
