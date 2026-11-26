import React, { useMemo, useRef } from 'react';
import { View } from 'react-native';
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
import { useReducedMotion } from '../utils/theme';
import { AppButton, SectionHeader, SegmentedControl } from '../ui/components';
import { GameShell } from '../ui/components/GameShell';
import { Space } from '../ui/tokens';
import { useSettings } from '../context/SettingsContext';
import { calculateGameBoardSize, useMeasuredGameViewport } from '../ui/gameLayout';
import { useAnimationEnabled } from '../ui/animations';
import { playBubblePopSound } from '../utils/sounds';

const PRESETS: GlitterPreset[] = ['settle', 'watch', 'explore', 'full'];

export const GlitterScreen: React.FC = () => {
  const navigation = useNavigation();
  const { t } = useTranslation();
  const globeRef = useRef<GlitterGlobeRef>(null);
  const { viewport, onLayout } = useMeasuredGameViewport();
  const { settings, updateGameSettings } = useSettings();
  const lively = useAnimationEnabled();
  const motionEnabled = !useReducedMotion();
  const translate = t as unknown as (key: string) => string;
  const config = resolveGlitterSettings(getGameSettings(settings, 'glitter-fall'));
  const motionConfig = useMemo(
    () => (lively ? config : { ...config, backgroundMotion: false, shakeResponse: false }),
    [config, lively],
  );

  const globeSize = useMemo(() => {
    const { width, height } = calculateGameBoardSize(viewport, {
      horizontalPadding: (Space.md + Space.sm) * 2 + 3,
      verticalReserve: 32,
      compactMinHeight: 180,
      maxHeightRatio: 0.9,
    });
    return Math.min(width, height);
  }, [viewport]);

  const savePreset = (preset: GlitterPreset) => {
    void updateGameSettings('glitter-fall', GLITTER_PRESETS[preset]);
  };

  const addGlitter = () => {
    if (globeRef.current?.addGlitter(6) && config.sound) void playBubblePopSound(settings);
  };

  return (
    <GameShell
      onLayout={onLayout}
      testID='glitter-screen'
      title={t('games.glitterFall.title')}
      onHome={() => navigation.goBack()}
      prompt={t(motionEnabled ? 'games.glitterFall.subtitle' : 'games.glitterFall.stillSubtitle')}
      actions={
        <View
          testID='glitter-controls'
          style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: Space.xs,
            justifyContent: 'center',
          }}
        >
          <AppButton
            icon='add'
            label={translate('games.glitterFall.controls.addFew')}
            onPress={addGlitter}
            size='sm'
            testID='glitter-add-few-button'
          />
          {motionEnabled && (
            <AppButton
              icon='swirl'
              label={translate('games.glitterFall.controls.swirl')}
              variant='secondary'
              size='sm'
              onPress={() => globeRef.current?.swirl()}
              testID='glitter-swirl-button'
            />
          )}
        </View>
      }
      more={(close) => (
        <>
          <AppButton
            icon='settle'
            label={translate('games.glitterFall.controls.settle')}
            variant='ghost'
            onPress={() => {
              globeRef.current?.settle();
              close();
            }}
            disabled={!motionEnabled}
            testID='glitter-settle-button'
          />
          <SectionHeader title={t('games.glitterFall.profileTitle')} />
          <SegmentedControl
            wrap
            options={PRESETS.map((value) => ({
              value,
              testID: 'glitter-preset-' + value,
              label: translate(`games.glitterFall.preset.${value}`),
            }))}
            value={config.preset}
            onValueChange={(preset) => {
              savePreset(preset);
              close();
            }}
          />
        </>
      )}
    >
      <GlitterGlobe
        ref={globeRef}
        width={globeSize}
        height={globeSize}
        config={motionConfig}
        maxParticles={GLITTER_PARTICLE_COUNTS.dense + 20}
        motionEnabled={motionEnabled}
      />
    </GameShell>
  );
};
