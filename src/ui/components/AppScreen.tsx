import React from 'react';
import { StyleSheet, View, ScrollView, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useThemeColors } from '../../utils/theme';

interface AppScreenProps {
  children: React.ReactNode;
  /** Whether content should scroll */
  scroll?: boolean;
  /** SafeAreaView edges to respect */
  edges?: ('top' | 'bottom' | 'left' | 'right')[];
  /** Additional style for the container */
  style?: ViewStyle;
  /** Additional style for scroll content */
  contentContainerStyle?: ViewStyle;
  testID?: string;
}

export const AppScreen: React.FC<AppScreenProps> = ({
  children,
  scroll = false,
  edges = ['top', 'bottom'],
  style,
  contentContainerStyle,
  testID,
}) => {
  const { colors } = useThemeColors();

  const containerStyle = [styles.container, { backgroundColor: colors.background }, style];

  if (scroll) {
    return (
      <SafeAreaView style={containerStyle} edges={edges} testID={testID}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.scrollContent, contentContainerStyle]}
          showsVerticalScrollIndicator
          keyboardShouldPersistTaps="handled"
        >
          {children}
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={containerStyle} edges={edges} testID={testID}>
      <View style={styles.inner}>{children}</View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  inner: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
});
