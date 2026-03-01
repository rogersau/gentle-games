import React, { useMemo } from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { useThemeColors } from '../../utils/theme';
import { Space, TypeStyle } from '../tokens';
import { ThemeColors } from '../../types';

interface SectionHeaderProps {
  title: string;
  style?: ViewStyle;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({ title, style }) => {
  const { colors } = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={[styles.container, style]}>
      <Text style={styles.title} accessibilityRole="header">
        {title}
      </Text>
    </View>
  );
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      marginBottom: Space.md,
      paddingBottom: Space.sm,
      borderBottomWidth: 1,
      borderBottomColor: colors.borderSubtle,
    },
    title: {
      ...TypeStyle.h4,
      color: colors.text,
    },
  });
