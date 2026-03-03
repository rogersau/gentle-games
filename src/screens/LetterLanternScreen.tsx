import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { ThemeColors } from '../types';
import { useSettings } from '../context/SettingsContext';
import { generateLetterLanternRound, isLetterLanternMatch } from '../utils/letterLanternLogic';
import { useThemeColors } from '../utils/theme';
import { AppScreen, AppHeader, AppButton, AppCard } from '../ui/components';
import { Space, TypeStyle } from '../ui/tokens';

export const LetterLanternScreen: React.FC = () => {
  const navigation = useNavigation();
  const { settings } = useSettings();
  const { colors } = useThemeColors();
  const { t } = useTranslation();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [round, setRound] = useState(() => generateLetterLanternRound(settings.difficulty));
  const [litCount, setLitCount] = useState(0);
  const [feedback, setFeedback] = useState(t('games.letterLanterns.feedback.initial'));

  const handleSelectLetter = (letter: string) => {
    if (isLetterLanternMatch(round, letter)) {
      setFeedback(t('games.letterLanterns.feedback.correct', { letter }));
      setLitCount((count) => count + 1);
    } else {
      setFeedback(t('games.letterLanterns.feedback.incorrect'));
    }
  };

  const nextRound = () => {
    setRound(generateLetterLanternRound(settings.difficulty));
    setFeedback(t('games.letterLanterns.feedback.initial'));
  };

  return (
    <AppScreen>
      <AppHeader title={t('games.letterLanterns.title')} onBack={() => navigation.goBack()} />
      <View style={styles.content}>
        <Text style={styles.subtitle}>{t('games.letterLanterns.subtitle', { letter: round.targetLetter })}</Text>

        <AppCard variant="elevated" style={styles.targetCard}>
          <Text style={styles.targetLabel}>{t('games.letterLanterns.targetLabel')}</Text>
          <Text style={styles.targetLetter}>{round.targetLetter}</Text>
          <Text style={styles.hintItems}>
            {round.hintItems.join(' ')}
          </Text>
          <Text style={styles.feedback}>{feedback}</Text>
        </AppCard>

        <View style={styles.choicesGrid}>
          {round.choices.map((letter) => (
            <AppButton
              key={letter}
              label={letter}
              variant="secondary"
              onPress={() => handleSelectLetter(letter)}
              style={styles.choiceButton}
            />
          ))}
        </View>

        <Text style={styles.litCount}>{t('games.letterLanterns.lanternsLit')}: {litCount}</Text>
        <AppButton label={t('games.letterLanterns.nextLetter')} variant="ghost" onPress={nextRound} style={styles.nextButton} />
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
    targetCard: {
      width: '100%',
      alignItems: 'center',
      marginBottom: Space.md,
      gap: Space.xs,
    },
    targetLabel: {
      ...TypeStyle.caption,
      color: colors.textLight,
    },
    targetLetter: {
      ...TypeStyle.h1,
      color: colors.primary,
    },
    hintItems: {
      fontSize: 28,
      textAlign: 'center',
      marginTop: Space.xs,
    },
    feedback: {
      ...TypeStyle.bodySm,
      color: colors.textLight,
      textAlign: 'center',
    },
    choicesGrid: {
      width: '100%',
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'center',
      gap: Space.sm,
      marginBottom: Space.base,
    },
    choiceButton: {
      minWidth: 64,
    },
    litCount: {
      ...TypeStyle.label,
      color: colors.text,
      marginBottom: Space.sm,
    },
    nextButton: {
      width: '100%',
    },
  });

