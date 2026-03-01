import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ThemeColors } from '../types';
import { useSettings } from '../context/SettingsContext';
import { generatePatternTrainRound, isPatternTrainChoiceCorrect } from '../utils/patternTrainLogic';
import { useThemeColors } from '../utils/theme';
import { AppScreen, AppHeader, AppButton, AppCard } from '../ui/components';
import { Space, TypeStyle } from '../ui/tokens';

export const PatternTrainScreen: React.FC = () => {
  const navigation = useNavigation();
  const { settings } = useSettings();
  const { colors } = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [round, setRound] = useState(() => generatePatternTrainRound(settings.difficulty));
  const [feedback, setFeedback] = useState('Find the missing train car pattern.');
  const [completedRounds, setCompletedRounds] = useState(0);

  const handleChoice = (choice: string) => {
    if (isPatternTrainChoiceCorrect(round, choice)) {
      setFeedback('Perfect pattern! Ready for another train.');
      setCompletedRounds((current) => current + 1);
    } else {
      setFeedback('Nice try. Look for the repeating rhythm.');
    }
  };

  const nextRound = () => {
    setRound(generatePatternTrainRound(settings.difficulty));
    setFeedback('Find the missing train car pattern.');
  };

  return (
    <AppScreen>
      <AppHeader title="Pattern Train" onBack={() => navigation.goBack()} />
      <View style={styles.content}>
        <Text style={styles.subtitle}>Complete the pattern with a gentle tap.</Text>
        <Text style={styles.meta}>Mode: {round.patternLabel}</Text>

        <AppCard variant="elevated" style={styles.sequenceCard}>
          <View style={styles.sequenceRow}>
            {round.display.map((item, index) => (
              <View key={`${item}-${index}`} style={styles.sequenceItem}>
                <Text style={styles.sequenceText}>{item}</Text>
              </View>
            ))}
          </View>
          <Text style={styles.feedback}>{feedback}</Text>
        </AppCard>

        <View style={styles.choiceGrid}>
          {round.choices.map((choice) => (
            <AppButton
              key={choice}
              label={choice}
              variant="secondary"
              onPress={() => handleChoice(choice)}
              style={styles.choiceButton}
            />
          ))}
        </View>

        <Text style={styles.meta}>Completed rounds: {completedRounds}</Text>
        <AppButton label="Next Pattern" variant="primary" onPress={nextRound} style={styles.nextButton} />
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
    meta: {
      ...TypeStyle.label,
      color: colors.text,
      marginBottom: Space.sm,
    },
    sequenceCard: {
      width: '100%',
      marginBottom: Space.base,
      gap: Space.sm,
    },
    sequenceRow: {
      flexDirection: 'row',
      justifyContent: 'center',
      gap: Space.xs,
      flexWrap: 'wrap',
    },
    sequenceItem: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: colors.surfaceElevated,
      borderWidth: 2,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    sequenceText: {
      fontSize: 24,
    },
    feedback: {
      ...TypeStyle.bodySm,
      color: colors.textLight,
      textAlign: 'center',
    },
    choiceGrid: {
      width: '100%',
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'center',
      gap: Space.sm,
      marginBottom: Space.base,
    },
    choiceButton: {
      minWidth: 92,
    },
    nextButton: {
      width: '100%',
    },
  });

