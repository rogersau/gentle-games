import React, { Component, ReactNode } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import * as Sentry from '@sentry/react-native';
import { useNavigation } from '@react-navigation/native';
import { ThemeColors, PASTEL_COLORS, DARK_PASTEL_COLORS } from '../types';
import { useThemeColors } from '../utils/theme';
import { AppButton } from '../ui/components';
import { Space, TypeStyle } from '../ui/tokens';

interface Props {
  children: ReactNode;
  screenName: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Gentle error fallback UI - child-friendly and non-scary.
 * Consistent with app's calm, sensory-friendly design.
 */
const GentleErrorFallback: React.FC<{ onReset: () => void; screenName: string }> = ({ 
  onReset, 
  screenName 
}) => {
  const navigation = useNavigation();
  const { colors, resolvedMode } = useThemeColors();
  const styles = createStyles(colors, resolvedMode);

  const handleGoHome = () => {
    // Navigate home and clear the error state
    navigation.navigate('Home' as never);
    onReset();
  };

  return (
    <View style={styles.container} testID="error-boundary-fallback">
      <View style={styles.content}>
        <Text style={styles.icon} accessibilityLabel="Gentle cloud icon">
          ☁️
        </Text>
        <Text style={styles.title} accessibilityRole="header">
          Oops, something went soft
        </Text>
        <Text style={styles.message}>
          Don&apos;t worry! Let&apos;s go back home and try again.
        </Text>
        <AppButton
          label="🏠 Go Home"
          variant="primary"
          size="lg"
          onPress={handleGoHome}
          accessibilityLabel="Return to home screen"
          accessibilityHint="Navigate back to the main menu"
        />
      </View>
    </View>
  );
};

/**
 * Error boundary that catches React errors and reports to Sentry.
 * Wraps individual screens to isolate crashes.
 */
export class GentleErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Report to Sentry with screen context
    Sentry.captureException(error, {
      tags: {
        screen: this.props.screenName,
        errorBoundary: 'GentleErrorBoundary',
      },
      contexts: {
        react: {
          componentStack: errorInfo.componentStack,
        },
      },
    });

    // Add breadcrumb for debugging
    Sentry.addBreadcrumb({
      category: 'error',
      message: `Error caught in ${this.props.screenName}`,
      level: 'error',
      data: {
        screen: this.props.screenName,
        errorMessage: error.message,
      },
    });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <GentleErrorFallback 
          onReset={this.handleReset} 
          screenName={this.props.screenName} 
        />
      );
    }

    return this.props.children;
  }
}

const createStyles = (colors: ThemeColors, resolvedMode: 'light' | 'dark') =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
      justifyContent: 'center',
      alignItems: 'center',
      padding: Space.xl,
    },
    content: {
      alignItems: 'center',
      maxWidth: 400,
    },
    icon: {
      fontSize: 64,
      marginBottom: Space.lg,
      opacity: 0.8,
    },
    title: {
      ...TypeStyle.h2,
      color: colors.text,
      textAlign: 'center',
      marginBottom: Space.base,
    },
    message: {
      ...TypeStyle.body,
      color: colors.textLight,
      textAlign: 'center',
      marginBottom: Space.xl,
      lineHeight: 24,
    },
  });
