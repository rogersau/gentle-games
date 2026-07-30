import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { NumberPicnicRepresentation as Representation } from '../../types';
import { Space, TypeStyle } from '../../ui/tokens';
import { useThemeColors } from '../../utils/theme';

interface NumberPicnicRepresentationProps {
  representation: Representation;
  accessibilityLabel: string;
  showNumeral?: boolean;
  style?: ViewStyle;
  testID?: string;
}

export const NumberPicnicRepresentation: React.FC<NumberPicnicRepresentationProps> = ({
  representation,
  accessibilityLabel,
  showNumeral = true,
  style,
  testID,
}) => {
  const { colors } = useThemeColors();
  const { t } = useTranslation();
  const filled = new Set(representation.filledSlots);
  const frameAccessibilityLabel = t('games.numberPicnic.representation.frameAccessibilityLabel', {
    capacity: representation.frameCapacity,
    count: representation.quantity,
    spaceWord: t(
      `games.numberPicnic.representation.spaceCount.${representation.quantity === 1 ? 'one' : 'other'}`,
    ),
  });

  return (
    <View
      style={[styles.container, style]}
      accessible
      accessibilityRole='image'
      accessibilityLabel={`${accessibilityLabel}; ${frameAccessibilityLabel}`}
      testID={testID}
    >
      {showNumeral && (
        <Text style={[styles.numeral, { color: colors.primary }]}>{representation.numeral}</Text>
      )}
      <View
        style={[styles.frame, representation.frameCapacity === 10 && styles.tenFrame]}
        testID={testID ? `${testID}-frame` : undefined}
      >
        {Array.from({ length: representation.frameCapacity }, (_, index) => (
          <View
            key={index}
            style={[styles.cell, { borderColor: colors.borderSubtle }]}
            testID={testID ? `${testID}-cell-${index}` : undefined}
          >
            <View
              style={[
                styles.dot,
                { backgroundColor: colors.success },
                !filled.has(index) && styles.emptyDot,
              ]}
            />
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { alignItems: 'center', gap: Space.xs },
  numeral: { ...TypeStyle.h2, fontWeight: 'bold' },
  frame: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', maxWidth: 110 },
  tenFrame: { width: 110 },
  cell: {
    width: 18,
    height: 18,
    borderWidth: 1,
    borderRadius: 6,
    margin: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: { width: 12, height: 12, borderRadius: 6 },
  emptyDot: { opacity: 0 },
});
