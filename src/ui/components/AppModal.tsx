import React, { useMemo } from 'react';
import {
  AccessibilityState,
  StyleSheet,
  View,
  Text,
  Modal,
  TouchableOpacity,
  ViewStyle,
} from 'react-native';
import { useThemeColors } from '../../utils/theme';
import { Space, Radius, Shadow, TypeStyle, HitTarget } from '../tokens';
import { ThemeColors } from '../../types';
import { useTranslation } from 'react-i18next';

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
  /** Disable modal controls while an action is being completed */
  disabled?: boolean;
  accessibilityState?: AccessibilityState;
}

export const AppModal: React.FC<AppModalProps> = ({
  visible,
  onClose,
  title,
  children,
  contentStyle,
  showClose = true,
  closeLabel,
  dismissOnBackdropPress = true,
  disabled = false,
  accessibilityState,
}) => {
  const { colors } = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { t } = useTranslation();

  const displayedCloseLabel = closeLabel ?? t('common.close');

  return (
    <Modal
      animationType='fade'
      transparent
      visible={visible}
      onRequestClose={disabled ? () => undefined : onClose}
      accessibilityViewIsModal
    >
      <View style={styles.overlay}>
        {dismissOnBackdropPress && (
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            onPress={onClose}
            disabled={disabled}
            activeOpacity={1}
            accessibilityLabel={t('common.close')}
            accessibilityRole='button'
            accessibilityState={{ ...accessibilityState, disabled }}
          />
        )}
        <View style={[styles.content, contentStyle]}>
          {title && (
            <Text style={styles.title} accessibilityRole='header'>
              {title}
            </Text>
          )}
          {children}
          {showClose && (
            <TouchableOpacity
              style={[styles.closeButton, disabled && styles.disabled]}
              onPress={onClose}
              disabled={disabled}
              accessibilityLabel={displayedCloseLabel}
              accessibilityRole='button'
              accessibilityState={{ ...accessibilityState, disabled }}
            >
              <Text style={styles.closeText}>{displayedCloseLabel}</Text>
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
    disabled: {
      opacity: 0.5,
    },
    closeText: {
      ...TypeStyle.button,
      color: colors.text,
    },
  });
