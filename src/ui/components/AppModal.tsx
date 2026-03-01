import React, { useMemo } from 'react';
import { StyleSheet, View, Text, Modal, TouchableOpacity, ViewStyle } from 'react-native';
import { useThemeColors } from '../../utils/theme';
import { Space, Radius, Shadow, TypeStyle, HitTarget } from '../tokens';
import { ThemeColors } from '../../types';

interface AppModalProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  /** Additional style for the content area */
  contentStyle?: ViewStyle;
  /** Whether to show the close button */
  showClose?: boolean;
  closeLabel?: string;
  /** Whether tapping backdrop should dismiss modal */
  dismissOnBackdropPress?: boolean;
}

export const AppModal: React.FC<AppModalProps> = ({
  visible,
  onClose,
  title,
  children,
  contentStyle,
  showClose = true,
  closeLabel = 'Close',
  dismissOnBackdropPress = true,
}) => {
  const { colors } = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <Modal
      animationType="fade"
      transparent
      visible={visible}
      onRequestClose={onClose}
      accessibilityViewIsModal
    >
      <View style={styles.overlay}>
        {dismissOnBackdropPress && (
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            onPress={onClose}
            activeOpacity={1}
            accessibilityLabel="Close dialog"
            accessibilityRole="button"
          />
        )}
        <View style={[styles.content, contentStyle]}>
          {title && (
            <Text style={styles.title} accessibilityRole="header">
              {title}
            </Text>
          )}
          {children}
          {showClose && (
            <TouchableOpacity
              style={styles.closeButton}
              onPress={onClose}
              accessibilityLabel={closeLabel}
              accessibilityRole="button"
            >
              <Text style={styles.closeText}>{closeLabel}</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: colors.overlay,
      justifyContent: 'center',
      alignItems: 'center',
      padding: Space.lg,
    },
    content: {
      backgroundColor: colors.background,
      borderRadius: Radius['2xl'],
      padding: Space.xl,
      width: '100%',
      maxWidth: 420,
      ...Shadow.lg,
    },
    title: {
      ...TypeStyle.h3,
      color: colors.text,
      textAlign: 'center',
      marginBottom: Space.base,
    },
    closeButton: {
      backgroundColor: colors.border,
      paddingHorizontal: Space['2xl'],
      paddingVertical: Space.md,
      borderRadius: Radius.full,
      alignItems: 'center',
      marginTop: Space.base,
      minHeight: HitTarget.min,
      justifyContent: 'center',
    },
    closeText: {
      ...TypeStyle.button,
      color: colors.text,
    },
  });
