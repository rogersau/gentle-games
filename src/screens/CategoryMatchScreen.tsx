import { CategoryMatchPackPicker } from '../components/CategoryMatchPackPicker';
import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { GamePicture } from '../ui/components/GamePicture';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import type { ThemeColors } from '../types';
import { CategoryMatchBoard } from '../components/CategoryMatchBoard';
import { useThemeColors } from '../utils/theme';
import { useSettings } from '../context/SettingsContext';
import { AppButton } from '../ui/components';
import { GameShell } from '../ui/components/GameShell';
import { Space, TypeStyle } from '../ui/tokens';
import { calculateGameBoardSize, useMeasuredGameViewport } from '../ui/gameLayout';
import { getGameSettings } from '../games/settings';
import { getCategoryMatchCategories } from '../utils/categoryMatchLogic';

export const CategoryMatchScreen: React.FC = () => {
  const navigation = useNavigation();
  const { colors } = useThemeColors();
  const { settings } = useSettings();
  const { t } = useTranslation();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const categorySettings = getGameSettings(settings, 'category-match');
  const [showPreview, setShowPreview] = useState(categorySettings.showPreview);
  const { viewport, onLayout } = useMeasuredGameViewport();

  const boardSize = useMemo(
    () =>
      calculateGameBoardSize(viewport, {
        horizontalPadding: (Space.md + Space.sm) * 2 + 3,
        verticalReserve: 30,
        compactMinHeight: 300,
        maxHeightRatio: 0.7,
      }),
    [viewport],
  );

  const categories = getCategoryMatchCategories(
    categorySettings.categoryCount,
    categorySettings.pack,
  );

  const pictureSet = (close: () => void) => (
    <>
      <Text style={styles.previewTitle}>{t('games.categoryMatch.choosePictureSet')}</Text>
      <CategoryMatchPackPicker onSelected={close} />
    </>
  );
  const title = t('games.categoryMatch.title');
  const onHome = () => navigation.goBack();
  const shell = (
    prompt: string,
    actions: React.ReactNode,
    body: React.ReactNode,
    roundMore?: (close: () => void) => React.ReactNode,
  ) => (
    <GameShell
      title={title}
      prompt={prompt}
      actions={actions}
      onHome={onHome}
      onLayout={onLayout}
      testID='category-match-screen'
      more={(close) => (
        <>
          {pictureSet(close)}
          {roundMore?.(close)}
        </>
      )}
    >
      {body}
    </GameShell>
  );
  if (showPreview)
    return shell(
      t('games.categoryMatch.previewInstruction'),
      <AppButton
        icon='play'
        label={t('games.categoryMatch.startSorting')}
        onPress={() => setShowPreview(false)}
        accessibilityHint={t('games.categoryMatch.startSortingHint')}
      />,
      <View style={styles.previewCard}>
        <Text style={styles.previewTitle} accessibilityRole='header'>
          {t('games.categoryMatch.quickPreview')}
        </Text>
        {categories.map(({ id: category, example }) => (
          <View key={category} style={styles.previewRow}>
            <Text style={styles.previewCategoryLabel}>
              {t(`games.categoryMatch.categories.${category}`)}
            </Text>
            <GamePicture
              name={example.name}
              size={32}
              label={t(`games.categoryMatch.items.${example.name}`, {
                defaultValue: example.name,
              })}
            />
          </View>
        ))}
      </View>,
    );
  return (
    <CategoryMatchBoard
      width={boardSize.width}
      height={boardSize.height}
      key={categorySettings.pack + categorySettings.categoryCount}
      pack={categorySettings.pack}
      categoryCount={categorySettings.categoryCount}
      renderShell={shell}
    />
  );
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    previewCard: { width: '100%', gap: Space.sm, padding: Space.md },
    previewTitle: { ...TypeStyle.title, color: colors.text, textAlign: 'center' },
    previewRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: Space.xs,
    },
    previewCategoryLabel: { ...TypeStyle.bodyMedium, color: colors.text },
  });
