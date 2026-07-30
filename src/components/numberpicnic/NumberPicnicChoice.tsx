import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import type { NumberPicnicChoice as Choice } from '../../types';
import { NumberPicnicRepresentation } from './NumberPicnicRepresentation';
import { Space, TypeStyle } from '../../ui/tokens';
import { useThemeColors } from '../../utils/theme';

interface NumberPicnicChoiceProps {
  choice: Choice;
  label: string;
  display: 'quantity' | 'numeral';
  onPress: () => void;
  disabled?: boolean;
  accessibilityHint: string;
  testID?: string;
}

export const NumberPicnicChoice: React.FC<NumberPicnicChoiceProps> = ({
  choice,
  label,
  display,
  onPress,
  disabled = false,
  accessibilityHint,
  testID,
}) => {
  const { colors } = useThemeColors();

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole='button'
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled }}
      style={[
        styles.choice,
        { borderColor: colors.border, backgroundColor: colors.surface },
        disabled && styles.disabled,
      ]}
      testID={testID}
    >
      {display === 'numeral' ? (
        <Text style={[styles.numeral, { color: colors.primary }]}>{choice.numeral}</Text>
      ) : (
        <NumberPicnicRepresentation
          representation={choice.representation}
          accessibilityLabel={label}
          showNumeral={false}
          testID={testID ? `${testID}-representation` : undefined}
        />
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  choice: {
    flex: 1,
    minWidth: 108,
    minHeight: 150,
    borderWidth: 2,
    borderRadius: 16,
    padding: Space.sm,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Space.xs,
  },
  numeral: { ...TypeStyle.h2, fontWeight: 'bold', textAlign: 'center' },
  disabled: { opacity: 0.55 },
});
