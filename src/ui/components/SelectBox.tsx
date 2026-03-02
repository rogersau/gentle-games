import React, { useState, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
} from 'react-native';
import { useThemeColors } from '../../utils/theme';
import { Space, Radius, TypeStyle, HitTarget, Shadow } from '../tokens';
import { ThemeColors } from '../../types';
import { ResolvedThemeMode } from '../../utils/theme';
import { useTranslation } from 'react-i18next';

interface SelectOption<T extends string | number> {
  value: T;
  label: string;
}

interface SelectBoxProps<T extends string | number> {
  options: SelectOption<T>[];
  value: T;
  onValueChange: (value: T) => void;
  placeholder?: string;
}

export const SelectBox = <T extends string | number>({
  options,
  value,
  onValueChange,
  placeholder,
}: SelectBoxProps<T>) => {
  const [isOpen, setIsOpen] = useState(false);
  const { colors, resolvedMode } = useThemeColors();
  const styles = useMemo(() => createStyles(colors, resolvedMode), [colors, resolvedMode]);
  const { t } = useTranslation();
  const effectivePlaceholder = placeholder ?? t('common.selectOption');

  const selectedOption = options.find((option) => option.value === value);
  const displayValue = selectedOption?.label ?? effectivePlaceholder;

  const handleSelect = (newValue: T) => {
    onValueChange(newValue);
    setIsOpen(false);
  };

  return (
    <View>
      <TouchableOpacity
        style={styles.selectBox}
        onPress={() => setIsOpen(true)}
        accessibilityRole="button"
        accessibilityLabel={displayValue}
        accessibilityHint={t('common.openOptions') }
      >
        <Text style={styles.selectText} numberOfLines={1}>
          {displayValue}
        </Text>
        <Text style={styles.chevron}>▼</Text>
      </TouchableOpacity>

      <Modal
        animationType="fade"
        transparent
        visible={isOpen}
        onRequestClose={() => setIsOpen(false)}
        accessibilityViewIsModal
      >
        <View style={styles.overlay}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            onPress={() => setIsOpen(false)}
            activeOpacity={1}
            accessibilityLabel={t('common.close') }
          />
          <View style={styles.modalContent}>
            <ScrollView style={styles.optionsList}>
              {options.map((option) => {
                const isSelected = option.value === value;
                return (
                  <TouchableOpacity
                    key={String(option.value)}
                    style={[
                      styles.option,
                      isSelected && styles.optionSelected,
                    ]}
                    onPress={() => handleSelect(option.value)}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: isSelected }}
                    accessibilityLabel={option.label}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        isSelected && styles.optionTextSelected,
                      ]}
                      numberOfLines={1}
                    >
                      {option.label}
                    </Text>
                    {isSelected && (
                      <Text style={styles.checkmark}>✓</Text>
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const createStyles = (colors: ThemeColors, resolvedMode: ResolvedThemeMode) =>
  StyleSheet.create({
    selectBox: {
      backgroundColor: colors.surface,
      borderWidth: 2,
      borderColor: colors.border,
      borderRadius: Radius.md,
      paddingVertical: Space.sm + 2,
      paddingHorizontal: Space.md,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      minHeight: HitTarget.min,
    },
    selectText: {
      ...TypeStyle.buttonSm,
      color: colors.text,
      flex: 1,
    },
    chevron: {
      ...TypeStyle.body,
      color: colors.textLight,
      marginLeft: Space.sm,
    },
    overlay: {
      flex: 1,
      backgroundColor: colors.overlay,
      justifyContent: 'center',
      alignItems: 'center',
      padding: Space.lg,
    },
    modalContent: {
      backgroundColor: colors.background,
      borderRadius: Radius['2xl'],
      width: '100%',
      maxWidth: 360,
      maxHeight: '70%',
      padding: Space.md,
      ...Shadow.lg,
    },
    optionsList: {
      maxHeight: 300,
    },
    option: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: Space.md,
      paddingHorizontal: Space.base,
      borderRadius: Radius.md,
      marginBottom: Space.xs,
      minHeight: HitTarget.min,
    },
    optionSelected: {
      backgroundColor: colors.primary,
    },
    optionText: {
      ...TypeStyle.buttonSm,
      color: colors.text,
      flex: 1,
    },
    optionTextSelected: {
      color: colors.surface,
    },
    checkmark: {
      ...TypeStyle.buttonSm,
      color: colors.surface,
      marginLeft: Space.sm,
    },
  });
