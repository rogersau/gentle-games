import React, { useEffect, useRef, useState } from 'react';
import { AppState, LayoutChangeEvent, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useSettings } from '../../context/SettingsContext';
import {
  speakOffline,
  stopOfflineNarration,
  useOfflineSpeechAvailable,
} from '../../utils/offlineNarration';
import { useThemeColors } from '../../utils/theme';
import { Radius, Space, TypeStyle } from '../tokens';
import { AppButton } from './AppButton';
import { AppModal } from './AppModal';
import { AppScreen } from './AppScreen';
import { GameHeader } from './GameHeader';

interface GameShellProps {
  title: string;
  prompt: string;
  onHome: () => void;
  children: React.ReactNode;
  actions?: React.ReactNode;
  more?: (close: () => void) => React.ReactNode;
  stageStyle?: ViewStyle;
  onMoreClose?: () => void;
  onLayout?: (event: LayoutChangeEvent) => void;
  testID?: string;
}

export const GameShell: React.FC<GameShellProps> = ({
  title,
  prompt,
  onHome,
  children,
  actions,
  more,
  stageStyle,
  onMoreClose,
  onLayout,
  testID,
}) => {
  const { t } = useTranslation();
  const { colors } = useThemeColors();
  const [moreOpen, setMoreOpen] = useState(false);
  const closeMore = () => {
    setMoreOpen(false);
    onMoreClose?.();
  };

  return (
    <AppScreen
      scroll
      onLayout={onLayout}
      testID={testID}
      contentContainerStyle={styles.body}
      header={
        <>
          <GameHeader title={title} onBack={onHome} />
          <View style={styles.promptWrap}>
            <GamePrompt prompt={prompt} />
          </View>
        </>
      }
      footer={
        actions || more ? (
          <View
            style={[styles.actions, { backgroundColor: colors.background }]}
            testID='game-action-bar'
          >
            {actions}
            {more && (
              <AppButton
                size='sm'
                variant='ghost'
                icon='more'
                label={t('common.more')}
                accessibilityState={{ expanded: moreOpen }}
                onPress={() => setMoreOpen(true)}
                testID='game-more'
              />
            )}
          </View>
        ) : undefined
      }
    >
      <View
        style={[
          styles.stage,
          { backgroundColor: colors.surface, borderColor: colors.outline },
          stageStyle,
        ]}
        testID='game-play-surface'
      >
        {children}
      </View>
      {more && (
        <AppModal
          visible={moreOpen}
          placement='bottom'
          onClose={closeMore}
          title={t('common.more')}
        >
          <View style={styles.sheetItems}>{more(closeMore)}</View>
        </AppModal>
      )}
    </AppScreen>
  );
};

export const GamePrompt: React.FC<{ prompt: string }> = ({ prompt }) => {
  const { colors } = useThemeColors();
  const { t } = useTranslation();
  const { settings } = useSettings();
  const owner = useRef(Symbol('game-prompt')).current;
  const audible = settings.soundEnabled && settings.soundVolume > 0;
  const speechAvailable = useOfflineSpeechAvailable(settings.language, audible);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state !== 'active') stopOfflineNarration(owner);
    });
    return () => {
      subscription.remove();
      stopOfflineNarration(owner);
    };
  }, [owner, prompt, audible, settings.language]);

  return (
    <View style={[styles.prompt, { backgroundColor: colors.surface, borderColor: colors.line }]}>
      {speechAvailable && (
        <AppButton
          size='sm'
          variant='secondary'
          icon='sound'
          label={t('common.hearIt')}
          testID='game-hear-prompt'
          onPress={() => speakOffline(prompt, settings.language, settings.soundVolume, owner)}
        />
      )}
      <Text
        style={[TypeStyle.prompt, styles.promptText, { color: colors.text }]}
        accessibilityLiveRegion='polite'
      >
        {prompt}
      </Text>
    </View>
  );
};

export const GameCompletion: React.FC<{
  message: string;
  onReplay: () => void;
  onHome: () => void;
  testID?: string;
}> = ({ message, onReplay, onHome, testID }) => {
  const { t } = useTranslation();
  const { colors } = useThemeColors();
  return (
    <View
      style={[styles.completion, { backgroundColor: colors.sage, borderColor: colors.sageInk }]}
      testID={testID}
    >
      <Text
        style={[TypeStyle.prompt, styles.completionText, { color: colors.sageInk }]}
        accessibilityLiveRegion='polite'
      >
        {message}
      </Text>
      <View style={styles.completionActions}>
        <AppButton label={t('common.playAgain')} icon='repeat' onPress={onReplay} size='sm' />
        <AppButton label={t('common.home')} variant='ghost' onPress={onHome} size='sm' />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  body: { alignItems: 'center', paddingHorizontal: Space.md, paddingBottom: Space.sm },
  promptWrap: { paddingHorizontal: Space.md },
  prompt: {
    width: '100%',
    maxWidth: 760,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: Space.sm,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    paddingHorizontal: Space.md,
    minHeight: 54,
    paddingVertical: Space.xs,
    marginBottom: Space.sm,
  },
  promptText: { flex: 1 },
  stage: {
    width: '100%',
    maxWidth: 760,
    borderRadius: Radius.playSurface,
    borderWidth: 1.5,
    padding: Space.sm,
    alignItems: 'center',
    overflow: 'hidden',
  },
  actions: {
    width: '100%',
    maxWidth: 760,
    alignSelf: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Space.sm,
    padding: Space.md,
  },
  sheetItems: { gap: Space.sm },
  completion: {
    width: '100%',
    maxWidth: 460,
    borderRadius: Radius.xl,
    borderWidth: 1.5,
    padding: Space.base,
    gap: Space.sm,
    alignItems: 'center',
    marginVertical: Space.sm,
  },
  completionText: { textAlign: 'center' },
  completionActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: Space.sm,
  },
});
