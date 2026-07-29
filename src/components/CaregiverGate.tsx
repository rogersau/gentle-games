import React, { useState } from 'react';
import { StyleSheet, Text, TextInput } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useThemeColors } from '../utils/theme';
import { AppButton, AppCard } from '../ui/components';
import { Space, TypeStyle } from '../ui/tokens';

const createChallenge = () => {
  const first = Math.floor(Math.random() * 30) + 12;
  const second = Math.floor(Math.random() * 20) + 11;
  return { prompt: `${first} + ${second}`, answer: first + second };
};

export const CaregiverGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { t } = useTranslation();
  const { colors } = useThemeColors();
  const [challenge, setChallenge] = useState(createChallenge);
  const [answer, setAnswer] = useState('');
  const [hasError, setHasError] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);

  if (isUnlocked) return <>{children}</>;

  const unlock = () => {
    if (answer !== '' && Number(answer) === challenge.answer) {
      setIsUnlocked(true);
      setHasError(false);
      return;
    }
    setAnswer('');
    setHasError(true);
    setChallenge(createChallenge());
  };

  return (
    <AppCard variant='outlined' style={styles.card}>
      <Text accessibilityRole='header' style={[styles.title, { color: colors.text }]}>
        {t('practiceHistory.gate.title')}
      </Text>
      <Text style={[styles.description, { color: colors.textLight }]}>
        {t('practiceHistory.gate.description')}
      </Text>
      <Text testID='caregiver-challenge' style={[styles.challenge, { color: colors.text }]}>
        {challenge.prompt} = ?
      </Text>
      <TextInput
        testID='caregiver-answer'
        value={answer}
        onChangeText={(value) => {
          setAnswer(value.replace(/[^0-9-]/g, ''));
          setHasError(false);
        }}
        onSubmitEditing={unlock}
        keyboardType='number-pad'
        accessibilityLabel={t('practiceHistory.gate.answerLabel')}
        style={[
          styles.input,
          { color: colors.text, borderColor: colors.border, backgroundColor: colors.surface },
        ]}
      />
      {hasError ? (
        <Text accessibilityRole='alert' style={[styles.error, { color: colors.danger }]}>
          {t('practiceHistory.gate.error')}
        </Text>
      ) : null}
      <AppButton
        label={t('practiceHistory.gate.continue')}
        onPress={unlock}
        testID='caregiver-unlock'
      />
    </AppCard>
  );
};

const styles = StyleSheet.create({
  card: { width: '100%', maxWidth: 480, alignSelf: 'center', gap: Space.sm },
  title: { ...TypeStyle.h3, textAlign: 'center' },
  description: { ...TypeStyle.bodySm, textAlign: 'center' },
  challenge: { ...TypeStyle.h2, textAlign: 'center', marginTop: Space.sm },
  input: {
    ...TypeStyle.h3,
    alignSelf: 'center',
    minWidth: 140,
    minHeight: 52,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: Space.md,
    textAlign: 'center',
  },
  error: { ...TypeStyle.bodySm, textAlign: 'center' },
});
