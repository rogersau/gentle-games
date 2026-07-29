import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useSettings } from '../context/SettingsContext';
import {
  CategoryMatchCategoryCount,
  ColorMode,
  NumberPicnicMode,
  NumberPicnicStage,
  ThemeColors,
} from '../types';
import { GAME_REGISTRY } from '../games/registry';
import { ResolvedThemeMode, useThemeColors } from '../utils/theme';
import { LANGUAGE_OPTIONS } from '../types/i18n';
import {
  AppScreen,
  AppHeader,
  SettingToggle,
  SegmentedControl,
  SelectBox,
  VolumeControl,
  SectionHeader,
  AppButton,
} from '../ui/components';
import { Space, TypeStyle } from '../ui/tokens';
import { useLayout } from '../ui/useLayout';
import {
  getGameSettings,
  MemorySnapMismatchDuration,
  MemorySnapPairCount,
  MemorySnapPreviewMode,
  stageToMaxQuantity,
} from '../games/settings';
import {
  GLITTER_PRESETS,
  GlitterColorCount,
  GlitterFallSpeed,
  GlitterParticleDensity,
} from '../games/glitterSettings';

export const SettingsScreen: React.FC = () => {
  const navigation = useNavigation();
  const { settings, updateSettings, updateGameSettings, isSaving, persistenceError } =
    useSettings();
  const { colors, resolvedMode } = useThemeColors();
  const styles = useMemo(() => createStyles(colors, resolvedMode), [colors, resolvedMode]);
  const { contentWidth, isTablet } = useLayout();
  const { t } = useTranslation();
  const glitterSettings = getGameSettings(settings, 'glitter-fall');
  const memorySettings = getGameSettings(settings, 'memory-snap');
  const categorySettings = getGameSettings(settings, 'category-match');
  const numberPicnicSettings = getGameSettings(settings, 'number-picnic');

  const memoryPairOptions: { value: MemorySnapPairCount; label: string }[] = [
    { value: 2, label: t('settings.memorySnap.pairs.two') },
    { value: 3, label: t('settings.memorySnap.pairs.three') },
    { value: 4, label: t('settings.memorySnap.pairs.four') },
    { value: 6, label: t('settings.memorySnap.pairs.six') },
    { value: 10, label: t('settings.memorySnap.pairs.ten') },
    { value: 15, label: t('settings.memorySnap.pairs.fifteen') },
  ];
  const memoryPreviewOptions: { value: MemorySnapPreviewMode; label: string }[] = [
    { value: 'none', label: t('settings.memorySnap.preview.none') },
    { value: 'until-ready', label: t('settings.memorySnap.preview.untilReady') },
    { value: '4-seconds', label: t('settings.memorySnap.preview.fourSeconds') },
    { value: '8-seconds', label: t('settings.memorySnap.preview.eightSeconds') },
  ];
  const memoryMismatchOptions: { value: MemorySnapMismatchDuration; label: string }[] = [
    { value: 1000, label: t('settings.memorySnap.mismatch.oneSecond') },
    { value: 2000, label: t('settings.memorySnap.mismatch.twoSeconds') },
    { value: 3000, label: t('settings.memorySnap.mismatch.threeSeconds') },
  ];
  const categoryCountOptions: { value: CategoryMatchCategoryCount; label: string }[] = [
    { value: 2, label: t('settings.categoryMatch.categories.two') },
    { value: 3, label: t('settings.categoryMatch.categories.three') },
  ];
  const numberPicnicStageOptions: { value: NumberPicnicStage; label: string }[] = [
    { value: '1-3', label: t('settings.numberPicnic.stage.oneToThree') },
    { value: '1-5', label: t('settings.numberPicnic.stage.oneToFive') },
    { value: '6-10', label: t('settings.numberPicnic.stage.sixToTen') },
  ];
  const numberPicnicModeOptions: { value: NumberPicnicMode; label: string }[] = [
    { value: 'make-amount', label: t('settings.numberPicnic.modes.makeAmount') },
    { value: 'find-amount', label: t('settings.numberPicnic.modes.findAmount') },
    { value: 'match-numeral', label: t('settings.numberPicnic.modes.matchNumeral') },
    { value: 'more-fewer', label: t('settings.numberPicnic.modes.moreFewer') },
    { value: 'add-one-more', label: t('settings.numberPicnic.modes.addOneMore') },
  ];

  const glitterDensityOptions: { value: GlitterParticleDensity; label: string }[] = [
    { value: 'very-sparse', label: t('settings.glitterFall.density.verySparse') },
    { value: 'sparse', label: t('settings.glitterFall.density.sparse') },
    { value: 'medium', label: t('settings.glitterFall.density.medium') },
    { value: 'dense', label: t('settings.glitterFall.density.dense') },
  ];
  const glitterSpeedOptions: { value: GlitterFallSpeed; label: string }[] = [
    { value: 'very-slow', label: t('settings.glitterFall.speed.verySlow') },
    { value: 'slow', label: t('settings.glitterFall.speed.slow') },
    { value: 'normal', label: t('settings.glitterFall.speed.normal') },
  ];
  const glitterColorOptions: { value: GlitterColorCount; label: string }[] = [
    { value: 1, label: t('settings.glitterFall.colors.one') },
    { value: 3, label: t('settings.glitterFall.colors.three') },
    { value: 6, label: t('settings.glitterFall.colors.six') },
  ];

  const colorModeOptions: { value: ColorMode; label: string }[] = [
    { value: 'light', label: t('settings.appearance.light') },
    { value: 'dark', label: t('settings.appearance.dark') },
    { value: 'system', label: t('settings.appearance.system') },
  ];

  const timerOptions: { value: number; label: string }[] = [
    { value: 0, label: t('settings.parentTimer.off') },
    { value: 5, label: t('settings.parentTimer.duration', { count: 5 } as any) },
    { value: 10, label: t('settings.parentTimer.duration', { count: 10 } as any) },
    { value: 15, label: t('settings.parentTimer.duration', { count: 15 } as any) },
    { value: 20, label: t('settings.parentTimer.duration', { count: 20 } as any) },
    { value: 30, label: t('settings.parentTimer.duration', { count: 30 } as any) },
  ];

  return (
    <AppScreen>
      <AppHeader title={t('settings.title')} onBack={() => navigation.goBack()} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          isTablet && { maxWidth: contentWidth, alignSelf: 'center', width: '100%' },
        ]}
      >
        <Text
          testID='settings-persistence-status'
          accessibilityRole={persistenceError && !isSaving ? 'alert' : 'text'}
          accessibilityLiveRegion={persistenceError && !isSaving ? 'polite' : 'none'}
          style={persistenceError && !isSaving ? styles.errorMessage : styles.persistenceStatus}
        >
          {isSaving
            ? t('settings.saving')
            : persistenceError
              ? t('settings.persistenceError')
              : t('settings.saved')}
        </Text>

        {/* Language */}
        <View style={styles.section}>
          <SectionHeader title={t('settings.language.title')} />
          <SelectBox
            options={LANGUAGE_OPTIONS}
            value={settings.language}
            onValueChange={(value) => updateSettings({ language: value })}
          />
          <Text style={styles.description}>{t('settings.language.description')}</Text>
        </View>

        {/* Appearance */}
        <View style={styles.section}>
          <SectionHeader title={t('settings.appearance.title')} />
          <SegmentedControl
            options={colorModeOptions}
            value={settings.colorMode}
            onValueChange={(value) => updateSettings({ colorMode: value })}
          />
          <Text style={styles.description}>{t('settings.appearance.description')}</Text>
        </View>

        {/* Reduced Motion */}
        <View style={styles.section}>
          <SettingToggle
            label={t('settings.reducedMotion.label')}
            description={t('settings.reducedMotion.description')}
            value={!!settings.reducedMotionEnabled}
            onValueChange={(value) => updateSettings({ reducedMotionEnabled: value })}
          />
        </View>

        {/* Show Mochi in Games */}
        <View style={styles.section}>
          <SettingToggle
            label={t('settings.showMochiInGames.label')}
            description={t('settings.showMochiInGames.description')}
            value={!!settings.showMochiInGames}
            onValueChange={(value) => updateSettings({ showMochiInGames: value })}
          />
        </View>

        {/* Pressure-free Play */}
        <View style={styles.section}>
          <SettingToggle
            label={t('settings.pressureFreeMode.label')}
            description={t('settings.pressureFreeMode.description')}
            value={!!settings.pressureFreeMode}
            onValueChange={(value) => updateSettings({ pressureFreeMode: value })}
          />
        </View>

        {/* Memory Snap */}
        <View style={styles.section}>
          <SectionHeader title={t('settings.memorySnap.title')} />
          <Text style={styles.controlLabel}>{t('settings.memorySnap.pairs.title')}</Text>
          <SegmentedControl
            options={memoryPairOptions}
            value={memorySettings.pairCount}
            onValueChange={(pairCount) => updateGameSettings('memory-snap', { pairCount })}
            wrap
          />
          <Text style={styles.description}>{t('settings.memorySnap.pairs.description')}</Text>
          <Text style={styles.controlLabel}>{t('settings.memorySnap.preview.title')}</Text>
          <SegmentedControl
            options={memoryPreviewOptions}
            value={memorySettings.previewMode}
            onValueChange={(previewMode) => updateGameSettings('memory-snap', { previewMode })}
            wrap
          />
          <Text style={styles.description}>{t('settings.memorySnap.preview.description')}</Text>
          <Text style={styles.controlLabel}>{t('settings.memorySnap.mismatch.title')}</Text>
          <SegmentedControl
            options={memoryMismatchOptions}
            value={memorySettings.mismatchDuration}
            onValueChange={(mismatchDuration) =>
              updateGameSettings('memory-snap', { mismatchDuration })
            }
          />
          <Text style={styles.description}>{t('settings.memorySnap.mismatch.description')}</Text>
          <SettingToggle
            label={t('settings.memorySnap.hint.label')}
            description={t('settings.memorySnap.hint.description')}
            value={memorySettings.hintEnabled}
            onValueChange={(hintEnabled) => updateGameSettings('memory-snap', { hintEnabled })}
          />
        </View>

        {/* Category Match */}
        <View style={styles.section}>
          <SectionHeader title={t('settings.categoryMatch.title')} />
          <Text style={styles.controlLabel}>{t('settings.categoryMatch.categories.title')}</Text>
          <SegmentedControl
            options={categoryCountOptions}
            value={categorySettings.categoryCount}
            onValueChange={(categoryCount) =>
              updateGameSettings('category-match', { categoryCount })
            }
          />
          <Text style={styles.description}>
            {t('settings.categoryMatch.categories.description')}
          </Text>
        </View>

        {/* Number Picnic */}
        <View style={styles.section}>
          <SectionHeader title={t('settings.numberPicnic.title')} />
          <Text style={styles.controlLabel}>{t('settings.numberPicnic.stage.title')}</Text>
          <SegmentedControl
            options={numberPicnicStageOptions}
            value={numberPicnicSettings.stage}
            onValueChange={(stage) =>
              updateGameSettings('number-picnic', {
                stage,
                maxQuantity: stageToMaxQuantity(stage),
                mode:
                  stage === '6-10'
                    ? numberPicnicSettings.mode
                    : numberPicnicSettings.mode === 'add-one-more'
                      ? 'make-amount'
                      : numberPicnicSettings.mode,
              })
            }
            wrap
          />
          <Text style={styles.description}>{t('settings.numberPicnic.stage.description')}</Text>
          <Text style={styles.controlLabel}>{t('settings.numberPicnic.mode.title')}</Text>
          <SegmentedControl
            options={numberPicnicModeOptions.filter(
              (option) => option.value !== 'add-one-more' || numberPicnicSettings.stage === '6-10',
            )}
            value={numberPicnicSettings.mode}
            onValueChange={(mode) => updateGameSettings('number-picnic', { mode })}
            wrap
          />
          <Text style={styles.description}>{t('settings.numberPicnic.mode.description')}</Text>
          <SettingToggle
            label={t('settings.numberPicnic.spokenCounting.label')}
            description={t('settings.numberPicnic.spokenCounting.description')}
            value={numberPicnicSettings.spokenCounting}
            onValueChange={(spokenCounting) =>
              updateGameSettings('number-picnic', { spokenCounting })
            }
          />
        </View>

        {/* Animations */}
        <View style={styles.section}>
          <SettingToggle
            label={t('settings.animations.label')}
            description={t('settings.animations.description')}
            value={!!settings.animationsEnabled}
            onValueChange={(value) => updateSettings({ animationsEnabled: value })}
          />
        </View>

        {/* Keepy Uppy Easy Mode */}
        <View style={styles.section}>
          <SettingToggle
            label={t('settings.keepyUppyEasyMode.label')}
            description={t('settings.keepyUppyEasyMode.description')}
            value={getGameSettings(settings, 'keepy-uppy').liftMode === 'gentle'}
            onValueChange={(value) =>
              updateGameSettings('keepy-uppy', { liftMode: value ? 'gentle' : 'precise' })
            }
          />
        </View>

        {/* Sensory game controls */}
        <View style={styles.section}>
          <SectionHeader title={t('settings.bubblePop.title')} />
          <SettingToggle
            label={t('settings.bubblePop.moving.label')}
            description={t('settings.bubblePop.moving.description')}
            value={getGameSettings(settings, 'bubble-pop').motion === 'moving'}
            onValueChange={(value) =>
              updateGameSettings('bubble-pop', { motion: value ? 'moving' : 'still' })
            }
          />
          <SettingToggle
            label={t('settings.bubblePop.fullField.label')}
            description={t('settings.bubblePop.fullField.description')}
            value={getGameSettings(settings, 'bubble-pop').density === 'full'}
            onValueChange={(value) =>
              updateGameSettings('bubble-pop', { density: value ? 'full' : 'sparse' })
            }
          />
        </View>

        <View style={styles.section}>
          <SectionHeader title={t('settings.glitterFall.title')} />
          <Text style={styles.controlLabel}>{t('settings.glitterFall.density.title')}</Text>
          <SegmentedControl
            options={glitterDensityOptions}
            value={glitterSettings.particleDensity}
            onValueChange={(particleDensity) =>
              updateGameSettings('glitter-fall', { particleDensity })
            }
            wrap
          />
          <Text style={styles.controlLabel}>{t('settings.glitterFall.speed.title')}</Text>
          <SegmentedControl
            options={glitterSpeedOptions}
            value={glitterSettings.fallSpeed}
            onValueChange={(fallSpeed) => updateGameSettings('glitter-fall', { fallSpeed })}
          />
          <Text style={styles.controlLabel}>{t('settings.glitterFall.colors.title')}</Text>
          <SegmentedControl
            options={glitterColorOptions}
            value={glitterSettings.colorCount}
            onValueChange={(colorCount) => updateGameSettings('glitter-fall', { colorCount })}
          />
          <SettingToggle
            label={t('settings.glitterFall.ripples')}
            value={glitterSettings.ripples}
            onValueChange={(ripples) => updateGameSettings('glitter-fall', { ripples })}
          />
          <SettingToggle
            label={t('settings.glitterFall.shakeResponse')}
            value={glitterSettings.shakeResponse}
            onValueChange={(shakeResponse) => updateGameSettings('glitter-fall', { shakeResponse })}
          />
          <SettingToggle
            label={t('settings.glitterFall.backgroundMotion')}
            value={glitterSettings.backgroundMotion}
            onValueChange={(backgroundMotion) =>
              updateGameSettings('glitter-fall', { backgroundMotion })
            }
          />
          <SettingToggle
            label={t('settings.glitterFall.sound')}
            description={t('settings.glitterFall.soundDescription')}
            value={glitterSettings.sound}
            onValueChange={(sound) => updateGameSettings('glitter-fall', { sound })}
          />
          <AppButton
            label={t('settings.glitterFall.resetPreset')}
            variant='ghost'
            size='sm'
            onPress={() =>
              updateGameSettings('glitter-fall', GLITTER_PRESETS[glitterSettings.preset])
            }
          />
        </View>

        {/* Enable Unfinished Games */}
        <View style={styles.section}>
          <SettingToggle
            label={t('settings.unfinishedGames.label')}
            description={t('settings.unfinishedGames.description')}
            value={!!settings.enableUnfinishedGames}
            onValueChange={(value) => updateSettings({ enableUnfinishedGames: value })}
          />
        </View>

        {/* Sound */}
        <View style={styles.section}>
          <SettingToggle
            label={t('settings.sound.label')}
            description={t('settings.sound.description')}
            value={!!settings.soundEnabled}
            onValueChange={(value) => updateSettings({ soundEnabled: value })}
          />
        </View>

        {/* Volume */}
        {settings.soundEnabled && (
          <View style={styles.section}>
            <SectionHeader title={t('settings.volume.title')} />
            <VolumeControl
              value={settings.soundVolume}
              onValueChange={(value) => updateSettings({ soundVolume: value })}
            />
            <Text style={styles.description}>{Math.round(settings.soundVolume * 100)}%</Text>
          </View>
        )}

        {/* Games on Home Screen */}
        <View style={styles.section}>
          <SectionHeader title={t('settings.gamesOnHomeScreen.title')} />
          {GAME_REGISTRY.filter((game) => settings.enableUnfinishedGames || !game.isUnfinished).map(
            (game) => {
              const isVisible = !settings.hiddenGames.includes(game.id);
              return (
                <SettingToggle
                  key={game.id}
                  label={`${game.icon}  ${t(game.nameKey)}`}
                  value={isVisible}
                  onValueChange={(value) => {
                    const updated = value
                      ? settings.hiddenGames.filter((id) => id !== game.id)
                      : [...settings.hiddenGames, game.id];
                    updateSettings({ hiddenGames: updated });
                  }}
                />
              );
            },
          )}
          <Text style={styles.description}>{t('settings.gamesOnHomeScreen.description')}</Text>
        </View>

        {/* Parent Timer */}
        <View style={styles.section}>
          <SectionHeader title={t('settings.parentTimer.title')} />
          <SegmentedControl
            options={timerOptions}
            value={settings.parentTimerMinutes}
            onValueChange={(value) => updateSettings({ parentTimerMinutes: value })}
            wrap
          />
          <Text style={styles.description}>{t('settings.parentTimer.description')}</Text>
        </View>

        {/* Telemetry */}
        <View style={styles.section}>
          <SettingToggle
            label={t('settings.telemetry.label')}
            description={t('settings.telemetry.description')}
            value={!!settings.telemetryEnabled}
            onValueChange={(value) => updateSettings({ telemetryEnabled: value })}
          />
        </View>
      </ScrollView>
    </AppScreen>
  );
};

const createStyles = (colors: ThemeColors, _resolvedMode: ResolvedThemeMode) =>
  StyleSheet.create({
    scrollContent: {
      padding: Space.xl,
    },
    scroll: {
      flex: 1,
      minHeight: 0,
    },
    section: {
      marginBottom: Space.xl,
    },
    description: {
      ...TypeStyle.bodySm,
      color: colors.textLight,
      marginTop: Space.xs,
    },
    controlLabel: {
      ...TypeStyle.label,
      color: colors.text,
      marginTop: Space.base,
      marginBottom: Space.xs,
    },
    errorMessage: {
      ...TypeStyle.bodySm,
      color: colors.danger,
      marginBottom: Space.base,
    },
    persistenceStatus: {
      ...TypeStyle.bodySm,
      color: colors.textLight,
      marginBottom: Space.base,
    },
  });
