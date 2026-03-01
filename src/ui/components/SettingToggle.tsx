import React, { useMemo } from 'react';
import { StyleSheet, View, Text, Switch } from 'react-native';
import { useThemeColors } from '../../utils/theme';
import { Space, TypeStyle } from '../tokens';
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
          accessibilityLabel={`${label}, ${value ? 'on' : 'off'}`}
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
