import React, { useMemo } from 'react';
import {
  AccessibilityState,
  StyleSheet,
  View,
  Text,
  Modal,
  ScrollView,
  TouchableOpacity,
  ViewStyle,
} from 'react-native';
import { useThemeColors } from '../../utils/theme';
import { Space, Radius, Shadow, TypeStyle, HitTarget } from '../tokens';
import { ThemeColors } from '../../types';
import { useTranslation } from 'react-i18next';
import { useAnimationEnabled } from '../animations';

interface AppModalProps {
  visible: boolean;
  placement?: 'center' | 'bottom';
  onClose: () => void;
  title?: string;
  headerContent?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
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
  placement = 'center',
  onClose,
  title,
  headerContent,
  children,
  footer,
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
  const animationsEnabled = useAnimationEnabled();

  const displayedCloseLabel = closeLabel ?? t('common.close');

  // Do not leave an invisible portal/focus trap waiting for a CSS animation-end event.
  if (!visible) return null;

  return (
    <Modal
      animationType={animationsEnabled ? 'fade' : 'none'}
      transparent
      visible={visible}
      onRequestClose={disabled ? () => undefined : onClose}
      accessibilityViewIsModal
    >
      <View style={[styles.overlay, placement === 'bottom' && styles.sheetOverlay]}>
        {dismissOnBackdropPress && (
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            onPress={onClose}
            disabled={disabled}
            activeOpacity={1}
            accessible={!showClose}
            aria-hidden={showClose}
            accessibilityLabel={showClose ? undefined : t('common.close')}
            accessibilityRole={showClose ? undefined : 'button'}
            accessibilityState={{ ...accessibilityState, disabled }}
          />
        )}
        <View
          style={[styles.content, placement === 'bottom' && styles.sheet, contentStyle]}
          accessibilityViewIsModal
        >
          {title && (
            <Text style={styles.title} accessibilityRole='header'>
              {title}
            </Text>
          )}
          {headerContent}
          <ScrollView
            style={styles.body}
            contentContainerStyle={styles.bodyContent}
            showsVerticalScrollIndicator
            keyboardShouldPersistTaps='handled'
            bounces={false}
          >
            {children}
          </ScrollView>
          {footer}
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
    sheetOverlay: { justifyContent: 'flex-end', padding: 0 },
    sheet: {
      maxWidth: 760,
      maxHeight: '85%',
      borderBottomLeftRadius: 0,
      borderBottomRightRadius: 0,
      paddingBottom: Space['2xl'],
    },
    content: {
      backgroundColor: colors.background,
      borderRadius: Radius['2xl'],
      padding: Space.xl,
      width: '100%',
      maxWidth: 420,
      maxHeight: '100%',
      ...Shadow.lg,
    },
    body: {
      flexShrink: 1,
      minHeight: 0,
    },
    bodyContent: {
      flexGrow: 0,
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
