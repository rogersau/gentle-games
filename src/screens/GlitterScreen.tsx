import React, { useMemo, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { GlitterGlobe, GlitterGlobeRef } from '../components/GlitterGlobe';
import {
  GLITTER_PARTICLE_COUNTS,
  GLITTER_PRESETS,
  GlitterPreset,
  resolveGlitterSettings,
} from '../games/glitterSettings';
import { getGameSettings } from '../games/settings';
import { ThemeColors } from '../types';
import { useThemeColors, useReducedMotion } from '../utils/theme';
import { AppScreen, AppHeader, AppButton } from '../ui/components';
import { Space, TypeStyle } from '../ui/tokens';
import { useSettings } from '../context/SettingsContext';
import { calculateGameBoardSize, useMeasuredGameViewport } from '../ui/gameLayout';
import { useAnimationEnabled } from '../ui/animations';
import { playBubblePopSound } from '../utils/sounds';

const PRESETS: GlitterPreset[] = ['settle', 'watch', 'explore', 'full'];

export const GlitterScreen: React.FC = () => {
  const navigation = useNavigation();
  const { colors } = useThemeColors();
  const { t } = useTranslation();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const globeRef = useRef<GlitterGlobeRef>(null);
  const { viewport, onLayout } = useMeasuredGameViewport();
  const { settings, updateGameSettings } = useSettings();
  const reducedMotion = useReducedMotion();
  const motionEnabled = useAnimationEnabled();
  const translate = t as unknown as (key: string) => string;
  const config = resolveGlitterSettings(getGameSettings(settings, 'glitter-fall'));
  const [selectedPreset, setSelectedPreset] = useState<GlitterPreset>(config.preset);

  const globeSize = useMemo(() => {
    const { width, height } = calculateGameBoardSize(viewport, {
      horizontalPadding: Space.base * 2,
      verticalReserve: 276,
      compactMinHeight: 180,
      maxHeightRatio: 0.58,
    });
    return Math.min(width, height);
  }, [viewport]);

  const savePreset = (preset: GlitterPreset) => {
    setSelectedPreset(preset);
    void updateGameSettings('glitter-fall', GLITTER_PRESETS[preset]);
  };

  const addGlitter = () => {
    globeRef.current?.addGlitter(6);
    if (config.sound) void playBubblePopSound(settings);
  };

  return (
    <AppScreen scroll onLayout={onLayout} testID='glitter-screen'>
      <AppHeader title={t('games.glitterFall.title')} onBack={() => navigation.goBack()} />

      <View style={styles.content}>
        <Text style={styles.subtitle} accessibilityRole='text'>
          {t('games.glitterFall.subtitle')}
        </Text>

        <View style={styles.globeWrap}>
          <GlitterGlobe
            ref={globeRef}
            width={globeSize}
            height={globeSize}
            config={config}
            maxParticles={GLITTER_PARTICLE_COUNTS.dense + 20}
            reducedMotion={reducedMotion}
            motionEnabled={motionEnabled}
          />
        </View>

        <View style={styles.profile}>
          <Text style={styles.profileTitle} accessibilityRole='header'>
            {translate('games.glitterFall.profileTitle')}
          </Text>
          <View style={styles.presetRow} accessibilityRole='radiogroup'>
            {PRESETS.map((preset) => (
              <AppButton
                key={preset}
                label={translate(`games.glitterFall.preset.${preset}`)}
                variant={selectedPreset === preset ? 'primary' : 'ghost'}
                size='sm'
                onPress={() => savePreset(preset)}
                accessibilityRole='radio'
                accessibilityState={{ checked: selectedPreset === preset }}
                aria-checked={selectedPreset === preset}
                testID={`glitter-preset-${preset}`}
                style={styles.presetButton}
              />
            ))}
          </View>
        </View>

        <View style={styles.controls} testID='glitter-controls'>
          <View testID='glitter-add-button' style={styles.controlWrapper}>
            <AppButton
              label={translate('games.glitterFall.controls.addFew')}
              variant='secondary'
              onPress={addGlitter}
              fullWidth
              testID='glitter-add-few-button'
              style={styles.controlButton}
            />
          </View>
          <View style={styles.controlWrapper}>
            <AppButton
              label={translate('games.glitterFall.controls.swirl')}
              variant='primary'
              onPress={() => globeRef.current?.swirl()}
              fullWidth
              testID='glitter-swirl-button'
              style={styles.controlButton}
            />
          </View>
          <View testID='glitter-clear-button' style={styles.controlWrapper}>
            <AppButton
              label={translate('games.glitterFall.controls.settle')}
              variant='ghost'
              onPress={() => globeRef.current?.settle()}
              fullWidth
              testID='glitter-settle-button'
              style={styles.controlButton}
            />
          </View>
        </View>
      </View>
    </AppScreen>
  );
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    content: {
      flex: 1,
      alignItems: 'center',
      paddingHorizontal: Space.base,
      paddingTop: Space.base,
      paddingBottom: Space.md,
    },
    subtitle: {
      ...TypeStyle.bodySm,
      color: colors.textLight,
      textAlign: 'center',
      marginBottom: Space.md,
    },
    globeWrap: {
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: Space.md,
    },
    profile: {
      width: '100%',
      alignItems: 'center',
      marginBottom: Space.md,
    },
    profileTitle: {
      ...TypeStyle.label,
      color: colors.text,
      marginBottom: Space.sm,
    },
    presetRow: {
      width: '100%',
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'center',
      gap: Space.xs,
    },
    presetButton: {
      flexGrow: 1,
      minWidth: '22%',
    },
    controls: {
      width: '100%',
      flexDirection: 'row',
      justifyContent: 'center',
      gap: Space.sm,
    },
    controlButton: {
      minHeight: 68,
      paddingHorizontal: Space.sm,
    },
    controlWrapper: {
      flex: 1,
    },
  });
