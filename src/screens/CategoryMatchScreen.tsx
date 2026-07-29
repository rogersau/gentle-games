import React, { useCallback, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
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
import { useSettings } from '../context/SettingsContext';
import { getGamePresentationPolicy } from '../utils/gamePresentationPolicy';
import { AppScreen, AppHeader, AppButton, AppCard } from '../ui/components';
import { Space, TypeStyle } from '../ui/tokens';
import { calculateGameBoardSize, useMeasuredGameViewport } from '../ui/gameLayout';
import { getGameSettings } from '../games/settings';

export const CategoryMatchScreen: React.FC = () => {
  const navigation = useNavigation();
  const { colors } = useThemeColors();
  const { settings } = useSettings();
  const { showPressureMetrics } = getGamePresentationPolicy(settings);
  const { t } = useTranslation();
  const translate = t as unknown as (key: string, options?: Record<string, unknown>) => string;
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [correctCount, setCorrectCount] = useState(0);
  const [streakCount, setStreakCount] = useState(0);
  const [showPreview, setShowPreview] = useState(
    () => getGameSettings(settings, 'category-match').showPreview,
  );
  const { viewport, onLayout } = useMeasuredGameViewport();

  const boardSize = useMemo(() => {
    return calculateGameBoardSize(viewport, {
      horizontalPadding: Space.md * 2,
      verticalReserve: 214,
      compactMinHeight: 240,
      maxHeightRatio: 0.7,
    });
  }, [viewport]);

  const categoryExamples = useMemo(
    () => ({
      sky: CATEGORY_MATCH_SKY.slice(0, 2)
        .map((item) => item.emoji)
        .join(' '),
      land: CATEGORY_MATCH_LAND.slice(0, 2)
        .map((item) => item.emoji)
        .join(' '),
      ocean: CATEGORY_MATCH_OCEAN.slice(0, 2)
        .map((item) => item.emoji)
        .join(' '),
    }),
    [],
  );

  const handleCorrectMatch = useCallback(
    (_item: CategoryMatchItem, _category: CategoryMatchCategory) => {
      setCorrectCount((count) => count + 1);
      setStreakCount((current) => current + 1);
    },
    [],
  );

  const handleIncorrectMatch = useCallback(() => {
    setStreakCount(0);
  }, []);

  return (
    <AppScreen scroll onLayout={onLayout} testID='category-match-screen'>
      <AppHeader title={t('games.categoryMatch.title')} onBack={() => navigation.goBack()} />

      <View style={styles.content}>
        <Text style={styles.subtitle} accessibilityRole='text'>
          {t('games.categoryMatch.subtitle')}
        </Text>
        {showPressureMetrics ? (
          <Text
            style={styles.counter}
            accessibilityLabel={`${correctCount} ${t('games.categoryMatch.correct')}`}
          >
            {t('games.categoryMatch.correct')}: {correctCount}
          </Text>
        ) : null}
        {showPressureMetrics && streakCount >= 3 ? (
          <Text
            style={styles.encouragement}
            accessibilityLabel={t('games.categoryMatch.greatStreak')}
          >
            {t('games.categoryMatch.streakMessage')} ✨
          </Text>
        ) : null}

        {showPreview ? (
          <AppCard variant='outlined' style={styles.previewCard}>
            <Text style={styles.previewTitle} accessibilityRole='header'>
              {t('games.categoryMatch.quickPreview')}
            </Text>
            <Text style={styles.previewText}>{t('games.categoryMatch.dragInstruction')}</Text>
            {CATEGORY_MATCH_CATEGORIES.map((category) => (
              <View key={category.id} style={styles.previewRow}>
                <Text style={styles.previewCategoryLabel}>
                  {category.icon} {translate('games.categoryMatch.categories.' + category.id)}
                </Text>
                <Text style={styles.previewExamples}>{categoryExamples[category.id]}</Text>
              </View>
            ))}
            <AppButton
              label={t('games.categoryMatch.startSorting')}
              variant='primary'
              onPress={() => setShowPreview(false)}
              fullWidth
              accessibilityHint={t('games.categoryMatch.startSortingHint')}
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
