import React, { useCallback, useMemo, useState } from 'react';
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
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
import { useThemeColors } from '../utils/theme';
import { AppScreen, AppHeader, AppButton, AppCard } from '../ui/components';
import { Space, TypeStyle } from '../ui/tokens';

export const CategoryMatchScreen: React.FC = () => {
  const navigation = useNavigation();
  const { colors } = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
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
    <AppScreen>
      <AppHeader title="Category Match" onBack={() => navigation.goBack()} />

      <View style={styles.content}>
        <Text style={styles.subtitle} accessibilityRole="text">
          Sort each emoji into Sky, Land, or Ocean.
        </Text>
        <Text style={styles.counter} accessibilityLabel={`${correctCount} correct matches`}>
          Correct: {correctCount}
        </Text>
        {streakCount >= 3 ? (
          <Text style={styles.encouragement} accessibilityLabel="Great streak!">
            You're on a roll! ✨
          </Text>
        ) : null}

        {showPreview ? (
          <AppCard variant="outlined" style={styles.previewCard}>
            <Text style={styles.previewTitle} accessibilityRole="header">
              Quick Preview
            </Text>
            <Text style={styles.previewText}>
              Drag each emoji into the matching category.
            </Text>
            {CATEGORY_MATCH_CATEGORIES.map((category) => (
              <View key={category.id} style={styles.previewRow}>
                <Text style={styles.previewCategoryLabel}>
                  {category.icon} {category.label}
                </Text>
                <Text style={styles.previewExamples}>{categoryExamples[category.id]}</Text>
              </View>
            ))}
            <AppButton
              label="Start Sorting"
              variant="primary"
              onPress={() => setShowPreview(false)}
              fullWidth
              accessibilityHint="Begin the category sorting game"
            />
          </AppCard>
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
    encouragement: {
      ...TypeStyle.bodyMedium,
      color: colors.success,
      marginBottom: Space.md,
    },
    boardWrap: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    previewCard: {
      width: '95%',
      gap: Space.sm,
    },
    previewTitle: {
      ...TypeStyle.h4,
      color: colors.text,
      textAlign: 'center',
    },
    previewText: {
      ...TypeStyle.bodySm,
      color: colors.textLight,
      textAlign: 'center',
      marginBottom: Space.xs,
    },
    previewRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: Space.xs,
    },
    previewCategoryLabel: {
      ...TypeStyle.bodyMedium,
      color: colors.text,
    },
    previewExamples: {
      fontSize: 20,
      color: colors.text,
    },
  });
