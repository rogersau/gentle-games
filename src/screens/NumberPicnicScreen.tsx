import React, { useMemo, useRef, useState } from 'react';
import { StyleSheet, Text, View, ScrollView, Dimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { ThemeColors } from '../types';
import { useSettings } from '../context/SettingsContext';
import { useNumberPicnicGame } from '../utils/numberPicnicLogic';
import { useThemeColors } from '../utils/theme';
import { AppScreen, AppHeader, AppCard } from '../ui/components';
import { Space, TypeStyle } from '../ui/tokens';
import { PicnicBasket, PicnicBlanket } from '../components/numberpicnic';

const { width: _SCREEN_WIDTH } = Dimensions.get('window');

interface WindowRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export const NumberPicnicScreen: React.FC = () => {
  const navigation = useNavigation();
  const { settings } = useSettings();
  const { colors } = useThemeColors();
  const { t } = useTranslation();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const scrollViewRef = useRef<ScrollView>(null);
  const [basketLayout, setBasketLayout] = useState<WindowRect | null>(null);

  const {
    prompt,
    basketCount,
    completedPicnics,
    isProcessing,
    isDragging,
    isOverBasket,
    isSuccess,
    blanketItemCount,
    basketItems,
    isComplete,
    handleDropStart,
    handleItemDrop,
    handleDropEnd,
    handleDragOverBasket,
    startNewRound,
  } = useNumberPicnicGame(settings.difficulty);

  return (
    <AppScreen>
      <AppHeader title={t('games.numberPicnic.title')} onBack={() => navigation.goBack()} />
      <ScrollView 
        ref={scrollViewRef}
        testID="number-picnic-scroll"
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        scrollEnabled={!isDragging}
      >
        <Text style={styles.subtitle}>{t('games.numberPicnic.subtitle')}</Text>

        {/* Instructions Card */}
        <AppCard variant="elevated" style={styles.promptCard}>
          <Text style={styles.promptText}>
            {t('games.numberPicnic.place')} <Text style={styles.promptStrong}>{prompt.targetCount}</Text> {prompt.itemName}
          </Text>
          <Text style={styles.visualDots}>
            {prompt.visualDots.join(' ')}
          </Text>
        </AppCard>

        {/* Picnic Basket with animation */}
        <View style={styles.basketContainer}>
          <PicnicBasket
            key={`basket-${prompt.targetCount}-${completedPicnics}`}
            items={basketItems}
            targetCount={prompt.targetCount}
            onPress={() => {}}
            onDropZoneLayout={setBasketLayout}
            isDropTarget={isOverBasket}
            isSuccess={isSuccess}
            onAnimationComplete={startNewRound}
            style={styles.basket}
            accessibilityLabel={`Basket with ${basketCount} ${prompt.itemName}`}
            accessibilityHint="Drag items from the blanket to fill the basket"
            testID="picnic-basket"
          />
        </View>

        {/* Feedback Text */}
        <Text style={[
          styles.feedback,
          isComplete && styles.feedbackComplete
        ]}>
          {isComplete 
            ? t('games.numberPicnic.feedback.complete') 
            : t('games.numberPicnic.feedback.incomplete')
          }
        </Text>

        {/* Picnic Blanket with draggable items */}
        <PicnicBlanket
          itemEmoji={prompt.itemEmoji}
          itemCount={blanketItemCount}
          targetCount={prompt.targetCount}
          onItemDrop={handleItemDrop}
          onDropStart={handleDropStart}
          onDragOverBasket={handleDragOverBasket}
          dropZoneLayout={basketLayout}
          onDropEnd={handleDropEnd}
          isProcessing={isProcessing}
          style={styles.blanket}
          testID="picnic-blanket"
        />

        {/* Completed Count */}
        <Text style={styles.completed}>
          {t('games.numberPicnic.completed')}: {completedPicnics}
        </Text>
      </ScrollView>
    </AppScreen>
  );
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      alignItems: 'center',
      paddingHorizontal: Space.md,
      paddingTop: Space.base,
      paddingBottom: Space.xl,
    },
    subtitle: {
      ...TypeStyle.bodySm,
      color: colors.textLight,
      textAlign: 'center',
      marginBottom: Space.sm,
    },
    promptCard: {
      width: '100%',
      alignItems: 'center',
      marginBottom: Space.md,
      gap: Space.sm,
    },
    promptText: {
      ...TypeStyle.body,
      color: colors.text,
      textAlign: 'center',
    },
    promptStrong: {
      ...TypeStyle.h3,
      color: colors.primary,
    },
    visualDots: {
      fontSize: 32,
      textAlign: 'center',
      color: colors.success,
      marginVertical: Space.xs,
    },
    basketContainer: {
      width: '100%',
      alignItems: 'center',
      marginBottom: Space.md,
      // Lower zIndex so blanket items can appear above when dragged
      zIndex: 1,
    },
    basket: {
      // Basket styles
    },
    blanket: {
      marginBottom: Space.md,
    },
    feedback: {
      ...TypeStyle.body,
      color: colors.textLight,
      textAlign: 'center',
      marginBottom: Space.sm,
      minHeight: 24,
    },
    feedbackComplete: {
      color: colors.success,
      fontWeight: 'bold',
    },
    completed: {
      ...TypeStyle.label,
      color: colors.text,
      marginBottom: Space.sm,
    },
  });
