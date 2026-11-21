import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import type { NumberPicnicRepresentation as Representation } from '../../types';
import { NumberPicnicRepresentation } from './NumberPicnicRepresentation';
import { Space, TypeStyle } from '../../ui/tokens';
import { useThemeColors } from '../../utils/theme';

interface NumberPicnicChoiceProps {
  representation: Representation;
  label: string;
  title?: string;
  display: 'quantity' | 'numeral';
  onPress: () => void;
  disabled?: boolean;
  accessibilityHint: string;
  testID?: string;
}

export const NumberPicnicChoice: React.FC<NumberPicnicChoiceProps> = ({
  representation,
  label,
  title,
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
      {title && <Text style={[styles.title, { color: colors.text }]}>{title}</Text>}
      {display === 'numeral' ? (
        <Text style={[styles.numeral, { color: colors.text }]}>{representation.numeral}</Text>
      ) : (
        <NumberPicnicRepresentation
          representation={representation}
          showNumeral={false}
          testID={testID ? `${testID}-representation` : undefined}
        />
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  choice: {
    flexGrow: 1,
    flexBasis: 132,
    maxWidth: 180,
    minHeight: 96,
    borderWidth: 2,
    borderRadius: 16,
    padding: Space.sm,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Space.xs,
  },
  title: { ...TypeStyle.label, textAlign: 'center' },
  numeral: { ...TypeStyle.h2, fontWeight: 'bold', textAlign: 'center' },
  disabled: { opacity: 0.85 },
});
