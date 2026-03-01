import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSettings } from '../context/SettingsContext';
import { ColorMode, ThemeColors } from '../types';
import { ResolvedThemeMode, useThemeColors } from '../utils/theme';
import {
  AppScreen,
  AppHeader,
  AppButton,
  SettingToggle,
  SegmentedControl,
  VolumeControl,
  SectionHeader,
} from '../ui/components';
import { Space, TypeStyle } from '../ui/tokens';
import { useLayout } from '../ui/useLayout';

const COLOR_MODE_OPTIONS: { value: ColorMode; label: string }[] = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'system', label: 'System' },
];

const TIMER_OPTIONS: { value: number; label: string }[] = [
  { value: 0, label: 'Off' },
  { value: 5, label: '5 min' },
  { value: 10, label: '10 min' },
  { value: 15, label: '15 min' },
  { value: 20, label: '20 min' },
  { value: 30, label: '30 min' },
];

const ALL_GAMES: { id: string; name: string; icon: string }[] = [
  { id: 'memory-snap', name: 'Memory Snap', icon: '🧩' },
  { id: 'drawing', name: 'Drawing Pad', icon: '🎨' },
  { id: 'glitter-fall', name: 'Glitter Fall', icon: '✨' },
  { id: 'bubble-pop', name: 'Bubble Pop', icon: '🫧' },
  { id: 'category-match', name: 'Category Match', icon: '🗂️' },
  { id: 'keepy-uppy', name: 'Keepy Uppy', icon: '🎈' },
  { id: 'breathing-garden', name: 'Breathing Garden', icon: '🌸' },
  { id: 'pattern-train', name: 'Pattern Train', icon: '🚂' },
  { id: 'number-picnic', name: 'Number Picnic', icon: '🧺' },
  { id: 'letter-lanterns', name: 'Letter Lanterns', icon: '🏮' },
  { id: 'star-path', name: 'Star Path', icon: '⭐' },
];

export const SettingsScreen: React.FC = () => {
  const navigation = useNavigation();
  const { settings, updateSettings } = useSettings();
  const { colors, resolvedMode } = useThemeColors();
  const styles = useMemo(() => createStyles(colors, resolvedMode), [colors, resolvedMode]);
  const { contentWidth, isTablet } = useLayout();

  return (
    <AppScreen>
      <AppHeader
        title="Settings"
        onBack={() => navigation.goBack()}
        rightAction={
          <AppButton
            label="Save"
            variant="primary"
            size="sm"
            onPress={() => navigation.goBack()}
            accessibilityHint="Save settings and return home"
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
        {/* Appearance */}
        <View style={styles.section}>
          <SectionHeader title="Appearance" />
          <SegmentedControl
            options={COLOR_MODE_OPTIONS}
            value={settings.colorMode}
            onValueChange={(value) => updateSettings({ colorMode: value })}
          />
          <Text style={styles.description}>
            Soft pastel tones are used in both light and dark modes
          </Text>
        </View>

        {/* Card Preview */}
        <View style={styles.section}>
          <SettingToggle
            label="Show Card Preview"
            description="Show all cards for 2 seconds before the game starts"
            value={!!settings.showCardPreview}
            onValueChange={(value) => updateSettings({ showCardPreview: value })}
          />
        </View>

        {/* Animations */}
        <View style={styles.section}>
          <SettingToggle
            label="Animations"
            description="Enable card flip and UI animations"
            value={!!settings.animationsEnabled}
            onValueChange={(value) => updateSettings({ animationsEnabled: value })}
          />
        </View>

        {/* Keepy Uppy Easy Mode */}
        <View style={styles.section}>
          <SettingToggle
            label="Keepy Uppy Easy Mode"
            description="Any tap gives a gentle lift while good taps still go higher"
            value={!!settings.keepyUppyEasyMode}
            onValueChange={(value) => updateSettings({ keepyUppyEasyMode: value })}
          />
        </View>

        {/* Sound */}
        <View style={styles.section}>
          <SettingToggle
            label="Sound"
            description="Enable gentle sound effects"
            value={!!settings.soundEnabled}
            onValueChange={(value) => updateSettings({ soundEnabled: value })}
          />
        </View>

        {/* Volume */}
        {settings.soundEnabled && (
          <View style={styles.section}>
            <SectionHeader title="Volume" />
            <VolumeControl
              value={settings.soundVolume}
              onValueChange={(value) => updateSettings({ soundVolume: value })}
            />
            <Text style={styles.description}>{Math.round(settings.soundVolume * 100)}%</Text>
          </View>
        )}

        {/* Games on Home Screen */}
        <View style={styles.section}>
          <SectionHeader title="Games on Home Screen" />
          {ALL_GAMES.map((game) => {
            const isVisible = !settings.hiddenGames.includes(game.id);
            return (
              <SettingToggle
                key={game.id}
                label={`${game.icon}  ${game.name}`}
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
            Hide games you don't want on the home screen
          </Text>
        </View>

        {/* Parent Timer */}
        <View style={styles.section}>
          <SectionHeader title="Parent Timer" />
          <SegmentedControl
            options={TIMER_OPTIONS}
            value={settings.parentTimerMinutes}
            onValueChange={(value) => updateSettings({ parentTimerMinutes: value })}
            wrap
          />
          <Text style={styles.description}>
            After the set time, a maths question pauses play until a grown-up answers
          </Text>
        </View>

        <View style={styles.bottomAction}>
          <AppButton
            label="Back to Home"
            variant="secondary"
            onPress={() => navigation.goBack()}
            accessibilityHint="Return to the home screen"
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
