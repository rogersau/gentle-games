import React from 'react';
import { StyleSheet, View, ScrollView, ViewStyle, Platform } from 'react-native';
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
  const isWeb = Platform.OS === 'web';

  const containerStyle = [styles.container, { backgroundColor: colors.background }, style];

  if (scroll) {
    const scrollContent = (
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, contentContainerStyle]}
        showsVerticalScrollIndicator
        keyboardShouldPersistTaps="handled"
      >
        {children}
      </ScrollView>
    );

    if (isWeb) {
      return (
        <View style={containerStyle} testID={testID}>
          {scrollContent}
        </View>
      );
    }

    return (
      <SafeAreaView style={containerStyle} edges={edges} testID={testID}>
        {scrollContent}
      </SafeAreaView>
    );
  }

  if (isWeb) {
    return (
      <View style={containerStyle} testID={testID}>
        <View style={styles.inner}>{children}</View>
      </View>
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
    height: '100%',
  },
  inner: {
    flex: 1,
    minHeight: 0,
    overflow: 'hidden',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
});
