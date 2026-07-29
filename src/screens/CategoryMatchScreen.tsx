import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import type { ThemeColors } from '../types';
import { CategoryMatchBoard } from '../components/CategoryMatchBoard';
import { useThemeColors } from '../utils/theme';
import { useSettings } from '../context/SettingsContext';
import { AppScreen, AppHeader, AppButton, AppCard } from '../ui/components';
import { Space, TypeStyle } from '../ui/tokens';
import { calculateGameBoardSize, useMeasuredGameViewport } from '../ui/gameLayout';
import { getGameSettings } from '../games/settings';
import { getCategoryMatchItems } from '../utils/categoryMatchLogic';
import { usePracticeHistory } from '../context/PracticeHistoryContext';

export const CategoryMatchScreen: React.FC = () => {
  const navigation = useNavigation();
  const { colors } = useThemeColors();
  const { settings } = useSettings();
  const { t } = useTranslation();
  const { recordResult } = usePracticeHistory();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const categorySettings = getGameSettings(settings, 'category-match');
  const [showPreview, setShowPreview] = useState(categorySettings.showPreview);
  const { viewport, onLayout } = useMeasuredGameViewport();

  const boardSize = useMemo(
    () =>
      calculateGameBoardSize(viewport, {
        horizontalPadding: Space.md * 2,
        verticalReserve: 214,
        compactMinHeight: 540,
        maxHeightRatio: 0.7,
      }),
    [viewport],
  );

  const categories = useMemo(
    () =>
      categorySettings.categoryCount === 3
        ? (['food', 'toys', 'clothes'] as const)
        : (['food', 'toys'] as const),
    [categorySettings.categoryCount],
  );
  const examples = useMemo(() => {
    const items = getCategoryMatchItems(categorySettings.categoryCount);
    return categories.map((category) => ({
      category,
      example: items.find((item) => item.category === category)?.emoji ?? '',
    }));
  }, [categories, categorySettings.categoryCount]);

  return (
    <AppScreen scroll onLayout={onLayout} testID='category-match-screen'>
      <AppHeader title={t('games.categoryMatch.title')} onBack={() => navigation.goBack()} />
      <View style={styles.content}>
        {showPreview ? (
          <AppCard variant='outlined' style={styles.previewCard}>
            <Text style={styles.previewTitle} accessibilityRole='header'>
              {t('games.categoryMatch.quickPreview')}
            </Text>
            <Text style={styles.previewText}>{t('games.categoryMatch.previewInstruction')}</Text>
            {examples.map(({ category, example }) => (
              <View key={category} style={styles.previewRow}>
                <Text style={styles.previewCategoryLabel}>
                  {t(`games.categoryMatch.categories.${category}`)}
                </Text>
                <Text style={styles.previewExamples}>{example}</Text>
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
              categoryCount={categorySettings.categoryCount}
              onPracticeResult={(result) => void recordResult(result)}
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
    boardWrap: { alignItems: 'center', justifyContent: 'center' },
    previewCard: { width: '95%', gap: Space.sm },
    previewTitle: { ...TypeStyle.h4, color: colors.text, textAlign: 'center' },
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
    previewCategoryLabel: { ...TypeStyle.bodyMedium, color: colors.text },
    previewExamples: { fontSize: 20, color: colors.text },
  });
