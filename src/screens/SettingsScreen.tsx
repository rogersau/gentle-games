import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useSettings } from '../context/SettingsContext';
import { ColorMode, ThemeColors, UNFINISHED_GAMES } from '../types';
import { ResolvedThemeMode, useThemeColors } from '../utils/theme';
import { LANGUAGE_OPTIONS } from '../types/i18n';
import {
  AppScreen,
  AppHeader,
  AppButton,
  SettingToggle,
  SegmentedControl,
  SelectBox,
  VolumeControl,
  SectionHeader,
} from '../ui/components';
import { Space, TypeStyle } from '../ui/tokens';
import { useLayout } from '../ui/useLayout';

const ALL_GAMES: { id: string; nameKey: string; icon: string }[] = [
  { id: 'memory-snap', nameKey: 'games.memorySnap.name', icon: '🧩' },
  { id: 'drawing', nameKey: 'games.drawing.name', icon: '🎨' },
  { id: 'glitter-fall', nameKey: 'games.glitterFall.name', icon: '✨' },
  { id: 'bubble-pop', nameKey: 'games.bubblePop.name', icon: '🫧' },
  { id: 'category-match', nameKey: 'games.categoryMatch.name', icon: '🗂️' },
  { id: 'keepy-uppy', nameKey: 'games.keepyUppy.name', icon: '🎈' },
  { id: 'breathing-garden', nameKey: 'games.breathingGarden.name', icon: '🌸' },
  { id: 'pattern-train', nameKey: 'games.patternTrain.name', icon: '🚂' },
  { id: 'number-picnic', nameKey: 'games.numberPicnic.name', icon: '🧺' },
  { id: 'letter-lanterns', nameKey: 'games.letterLanterns.name', icon: '🏮' },
  { id: 'star-path', nameKey: 'games.starPath.name', icon: '⭐' },
];

export const SettingsScreen: React.FC = () => {
  const navigation = useNavigation();
  const { settings, updateSettings } = useSettings();
  const { colors, resolvedMode } = useThemeColors();
  const styles = useMemo(() => createStyles(colors, resolvedMode), [colors, resolvedMode]);
  const { contentWidth, isTablet } = useLayout();
  const { t } = useTranslation();

  const colorModeOptions: { value: ColorMode; label: string }[] = [
    { value: 'light', label: t('settings.appearance.light') },
    { value: 'dark', label: t('settings.appearance.dark') },
    { value: 'system', label: t('settings.appearance.system') },
  ];

  const timerOptions: { value: number; label: string }[] = [
    { value: 0, label: t('settings.parentTimer.off') },
    { value: 5, label: '5 min' },
    { value: 10, label: '10 min' },
    { value: 15, label: '15 min' },
    { value: 20, label: '20 min' },
    { value: 30, label: '30 min' },
  ];

  return (
    <AppScreen>
      <AppHeader
        title={t('settings.title')}
        onBack={() => navigation.goBack()}
        rightAction={
          <AppButton
            label={t('common.save')}
            variant="primary"
            size="sm"
            onPress={() => navigation.goBack()}
            accessibilityHint={t('settings.saveHint')}
          />
        }
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          isTablet && { maxWidth: contentWidth, alignSelf: 'center', width: '100%' },
        ]}
      >
        {/* Language */}
        <View style={styles.section}>
          <SectionHeader title={t('settings.language.title')} />
          <SelectBox
            options={LANGUAGE_OPTIONS}
            value={settings.language}
            onValueChange={(value) => updateSettings({ language: value })}
          />
          <Text style={styles.description}>
            {t('settings.language.description')}
          </Text>
        </View>

        {/* Appearance */}
        <View style={styles.section}>
          <SectionHeader title={t('settings.appearance.title')} />
          <SegmentedControl
            options={colorModeOptions}
            value={settings.colorMode}
            onValueChange={(value) => updateSettings({ colorMode: value })}
          />
          <Text style={styles.description}>
            {t('settings.appearance.description')}
          </Text>
        </View>

        {/* Card Preview */}
        <View style={styles.section}>
          <SettingToggle
            label={t('settings.cardPreview.label')}
            description={t('settings.cardPreview.description')}
            value={!!settings.showCardPreview}
            onValueChange={(value) => updateSettings({ showCardPreview: value })}
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
            value={!!settings.keepyUppyEasyMode}
            onValueChange={(value) => updateSettings({ keepyUppyEasyMode: value })}
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
          {ALL_GAMES
            .filter((game) => settings.enableUnfinishedGames || !UNFINISHED_GAMES.includes(game.id))
            .map((game) => {
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
            })}
          <Text style={styles.description}>
            {t('settings.gamesOnHomeScreen.description')}
          </Text>
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
          <Text style={styles.description}>
            {t('settings.parentTimer.description')}
          </Text>
        </View>

        <View style={styles.bottomAction}>
          <AppButton
            label={t('common.back')}
            variant="secondary"
            onPress={() => navigation.goBack()}
            accessibilityHint={t('settings.backHint')}
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
    bottomAction: {
      alignItems: 'center',
      marginTop: Space.base,
      marginBottom: Space.xl,
    },
  });
