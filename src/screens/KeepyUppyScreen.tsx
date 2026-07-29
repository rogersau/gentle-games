import React, { useMemo, useRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useSettings } from '../context/SettingsContext';
import { KeepyUppyBoard, KeepyUppyBoardRef } from '../components/KeepyUppyBoard';
import {
  KEEPY_UPPY_PROFILES,
  KeepyUppyBounds,
  KeepyUppyProfile,
  resolveKeepyUppyConfig,
} from '../utils/keepyUppyLogic';
import { ThemeColors } from '../types';
import { useThemeColors } from '../utils/theme';
import { AppScreen, AppHeader, AppButton, SegmentedControl } from '../ui/components';
import { Space, TypeStyle } from '../ui/tokens';
import { useAnimationEnabled } from '../ui/animations';
import { calculateGameBoardSize, useMeasuredGameViewport } from '../ui/gameLayout';
import { getGameSettings } from '../games/settings';

const PROFILES: KeepyUppyProfile[] = [
  'large-and-slow',
  'tap-anywhere',
  'direct-touch',
  'target-zones',
  'left-and-right',
  'more-balloons',
];

export const KeepyUppyScreen: React.FC = () => {
  const navigation = useNavigation();
  const { settings, updateGameSettings } = useSettings();
  const { colors } = useThemeColors();
  const motionEnabled = useAnimationEnabled();
  const { t } = useTranslation();
  const persistedSettings = getGameSettings(settings, 'keepy-uppy');
  const keepyConfig = useMemo(
    () =>
      resolveKeepyUppyConfig({
        profile: persistedSettings.profile,
        balloonSize: persistedSettings.balloonSize,
        gravity: persistedSettings.gravity,
        targetSize: persistedSettings.targetSize,
        balloonCount: persistedSettings.balloonCount,
        reducedMotion: !motionEnabled,
      }),
    [motionEnabled, persistedSettings],
  );
  const styles = useMemo(() => createStyles(colors), [colors]);
  const boardRef = useRef<KeepyUppyBoardRef>(null);
  const { viewport, onLayout } = useMeasuredGameViewport();

  const bounds = useMemo<KeepyUppyBounds>(() => {
    return calculateGameBoardSize(viewport, {
      horizontalPadding: Space.md * 2,
      verticalReserve: 208,
      compactMinHeight: 220,
      maxHeightRatio: 0.68,
    });
  }, [viewport]);

  const textOrFallback = (key: string, fallback: string) => {
    const translated = t(key, { defaultValue: fallback });
    return translated === key ? fallback : translated;
  };
  const selectProfile = (profile: KeepyUppyProfile) => {
    const next = KEEPY_UPPY_PROFILES[profile];
    void updateGameSettings('keepy-uppy', {
      profile,
      balloonSize: next.balloonSize,
      gravity: next.gravity,
      targetSize: next.targetSize,
      balloonCount: Math.min(3, next.balloonCount) as 1 | 2 | 3,
    });
  };

  return (
    <AppScreen scroll onLayout={onLayout} testID='keepy-uppy-screen'>
      <AppHeader title={t('games.keepyUppy.title')} onBack={() => navigation.goBack()} />

      <View style={styles.content}>
        <Text style={styles.subtitle} accessibilityRole='text'>
          {t('games.keepyUppy.subtitle')}
        </Text>
        <Text style={styles.controlLabel}>
          {textOrFallback('games.keepyUppy.profile.title', 'Choose how to play')}
        </Text>
        <SegmentedControl
          options={PROFILES.map((profile) => ({
            value: profile,
            label: textOrFallback(
              `games.keepyUppy.profile.${profile}`,
              profile.replaceAll('-', ' '),
            ),
          }))}
          value={keepyConfig.profile}
          onValueChange={selectProfile}
          wrap
        />
        <AppButton
          label={textOrFallback('games.keepyUppy.restart', 'Start again')}
          variant='ghost'
          size='sm'
          onPress={() => boardRef.current?.resetBalloons()}
          accessibilityHint={textOrFallback(
            'games.keepyUppy.restartHint',
            'Start with a fresh balloon. Nothing is lost when a balloon rests.',
          )}
          style={{ marginBottom: Space.sm }}
        />

        <KeepyUppyBoard
          key={keepyConfig.profile}
          ref={boardRef}
          bounds={bounds}
          config={keepyConfig}
          easyMode={persistedSettings.liftMode === 'gentle'}
          motionEnabled={motionEnabled}
        />
      </View>
    </AppScreen>
  );
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    content: {
      flex: 1,
      alignItems: 'center',
      paddingHorizontal: Space.md,
      paddingTop: Space.base,
      paddingBottom: Space.md,
    },
    subtitle: {
      ...TypeStyle.bodySm,
      color: colors.textLight,
      textAlign: 'center',
      marginBottom: Space.sm,
    },
    controlLabel: {
      ...TypeStyle.label,
      color: colors.text,
      alignSelf: 'stretch',
      marginBottom: Space.xs,
    },
  });
