import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ThemeColors } from '../types';
import { useSettings } from '../context/SettingsContext';
import {
  generateNumberPicnicPrompt,
  isNumberPicnicPromptComplete,
  updateNumberPicnicCount,
} from '../utils/numberPicnicLogic';
import { useThemeColors } from '../utils/theme';
import { AppScreen, AppHeader, AppButton, AppCard } from '../ui/components';
import { Space, TypeStyle } from '../ui/tokens';

export const NumberPicnicScreen: React.FC = () => {
  const navigation = useNavigation();
  const { settings } = useSettings();
  const { colors } = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [prompt, setPrompt] = useState(() => generateNumberPicnicPrompt(settings.difficulty));
  const [basketCount, setBasketCount] = useState(0);
  const [completedPicnics, setCompletedPicnics] = useState(0);

  const isComplete = isNumberPicnicPromptComplete(basketCount, prompt);

  const adjustCount = (delta: number) => {
    setBasketCount((current) => updateNumberPicnicCount(current, delta));
  };

  const nextPicnic = () => {
    setPrompt(generateNumberPicnicPrompt(settings.difficulty));
    setBasketCount(0);
    setCompletedPicnics((current) => current + 1);
  };

  return (
    <AppScreen>
      <AppHeader title="Number Picnic" onBack={() => navigation.goBack()} />
      <View style={styles.content}>
        <Text style={styles.subtitle}>Count and place items in the picnic basket.</Text>

        <AppCard variant="elevated" style={styles.promptCard}>
          <Text style={styles.promptText}>
            Place <Text style={styles.promptStrong}>{prompt.targetCount}</Text> {prompt.itemName}
          </Text>
          <Text style={styles.basketCount} accessibilityLabel={`Basket count ${basketCount}`}>
            Basket: {basketCount}
          </Text>
          <Text style={styles.previewItems}>
            {basketCount > 0 ? `${prompt.itemEmoji} `.repeat(Math.min(12, basketCount)).trim() : '—'}
          </Text>
          <Text style={styles.feedback}>
            {isComplete ? 'Great counting! Your picnic is ready.' : 'Tap plus or minus to match the count.'}
          </Text>
        </AppCard>

        <View style={styles.controls}>
          <AppButton label="− Remove" variant="secondary" onPress={() => adjustCount(-1)} style={styles.controlButton} />
          <AppButton label="+ Add" variant="primary" onPress={() => adjustCount(1)} style={styles.controlButton} />
        </View>

        <Text style={styles.completed}>Picnics completed: {completedPicnics}</Text>
        {isComplete && (
          <AppButton label="Next Picnic" variant="ghost" onPress={nextPicnic} style={styles.nextButton} />
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
    basketCount: {
      ...TypeStyle.h4,
      color: colors.text,
    },
    previewItems: {
      fontSize: 28,
      textAlign: 'center',
      color: colors.text,
      minHeight: 40,
    },
    feedback: {
      ...TypeStyle.bodySm,
      color: colors.textLight,
      textAlign: 'center',
    },
    controls: {
      width: '100%',
      flexDirection: 'row',
      justifyContent: 'center',
      gap: Space.sm,
      marginBottom: Space.base,
    },
    controlButton: {
      flex: 1,
    },
    completed: {
      ...TypeStyle.label,
      color: colors.text,
      marginBottom: Space.sm,
    },
    nextButton: {
      width: '100%',
    },
  });

