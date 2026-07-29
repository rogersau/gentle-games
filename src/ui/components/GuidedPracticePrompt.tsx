import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { GuidedRoundState } from '../../guided-practice/controller';
import { AppButton } from './AppButton';
import { Space, TypeStyle } from '../tokens';
import { useThemeColors } from '../../utils/theme';

interface GuidedPracticePromptProps {
  state: GuidedRoundState;
  instruction: string;
  neutralFeedback?: string;
  hint?: string;
  model?: React.ReactNode;
  replayLabel: string;
  skipLabel: string;
  onReplay: () => void;
  onSkip: () => void;
}

export const GuidedPracticePrompt: React.FC<GuidedPracticePromptProps> = ({
  state,
  instruction,
  neutralFeedback,
  hint,
  model,
  replayLabel,
  skipLabel,
  onReplay,
  onSkip,
}) => {
  const { colors } = useThemeColors();
  const supportText = state.phase === 'hinted' ? hint : undefined;

  return (
    <View accessibilityRole='summary'>
      <Text style={[styles.instruction, { color: colors.text }]}>{instruction}</Text>
      {state.incorrectAttempts > 0 && neutralFeedback ? (
        <Text
          style={[styles.feedback, { color: colors.textLight }]}
          accessibilityLiveRegion='polite'
        >
          {neutralFeedback}
        </Text>
      ) : null}
      {supportText ? (
        <Text style={[styles.support, { color: colors.text }]}>{supportText}</Text>
      ) : null}
      {state.phase === 'modelled' ? <View style={styles.model}>{model}</View> : null}
      <View style={styles.actions}>
        <AppButton label={replayLabel} variant='ghost' size='sm' onPress={onReplay} />
        <AppButton label={skipLabel} variant='ghost' size='sm' onPress={onSkip} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  instruction: { ...TypeStyle.body, textAlign: 'center' },
  feedback: { ...TypeStyle.bodySm, marginTop: Space.xs, textAlign: 'center' },
  support: { ...TypeStyle.body, marginTop: Space.sm, textAlign: 'center' },
  model: { marginTop: Space.sm, alignItems: 'center' },
  actions: { marginTop: Space.base, gap: Space.sm },
});
