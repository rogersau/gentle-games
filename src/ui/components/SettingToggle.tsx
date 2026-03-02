import React, { useMemo } from 'react';
import { StyleSheet, View, Text, Switch } from 'react-native';
import { useThemeColors } from '../../utils/theme';
import { Space, TypeStyle } from '../tokens';
import { useTranslation } from 'react-i18next';
import { ThemeColors } from '../../types';

interface SettingToggleProps {
  label: string;
  description?: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
}

export const SettingToggle: React.FC<SettingToggleProps> = ({
  label,
  description,
  value,
  onValueChange,
  disabled = false,
}) => {
  const { colors } = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <View style={styles.labelContainer}>
          <Text style={styles.label}>{label}</Text>
          {description && <Text style={styles.description}>{description}</Text>}
        </View>
        <Switch
          value={value}
          onValueChange={onValueChange}
          disabled={disabled}
          trackColor={{ false: colors.border, true: colors.primary }}
          thumbColor={colors.surface}
          accessibilityLabel={`${label}, ${value ? t('common.on') : t('common.off')}` }
          accessibilityRole="switch"
          accessibilityState={{ checked: value, disabled }}
        />
      </View>
    </View>
  );
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      paddingVertical: Space.md,
    },
    row: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: Space.base,
    },
    labelContainer: {
      flex: 1,
    },
    label: {
      ...TypeStyle.label,
      color: colors.text,
    },
    description: {
      ...TypeStyle.bodySm,
      color: colors.textLight,
      marginTop: Space.xxs,
    },
  });
