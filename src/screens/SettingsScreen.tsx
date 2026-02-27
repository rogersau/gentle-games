import React, { useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Switch,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSettings } from '../context/SettingsContext';
import { ColorMode, ThemeColors } from '../types';
import { ResolvedThemeMode, useThemeColors } from '../utils/theme';

const COLOR_MODE_OPTIONS: { value: ColorMode; label: string }[] = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'system', label: 'System' },
];

export const SettingsScreen: React.FC = () => {
  const navigation = useNavigation();
  const { settings, updateSettings } = useSettings();
  const { colors, resolvedMode } = useThemeColors();
  const styles = useMemo(() => createStyles(colors, resolvedMode), [colors, resolvedMode]);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Settings</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Appearance</Text>
          <View style={styles.modeOptions}>
            {COLOR_MODE_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.modeButton,
                  settings.colorMode === option.value ? styles.modeButtonActive : undefined,
                ]}
                onPress={() => updateSettings({ colorMode: option.value })}
              >
                <Text
                  style={[
                    styles.modeButtonText,
                    settings.colorMode === option.value ? styles.modeButtonTextActive : undefined,
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.description}>Soft pastel tones are used in both light and dark modes</Text>
        </View>

        <View style={styles.section}>
          <View style={styles.toggleRow}>
            <Text style={styles.sectionTitle}>Show Card Preview</Text>
            <Switch
              value={!!settings.showCardPreview}
              onValueChange={(value) => updateSettings({ showCardPreview: value })}
              trackColor={{ false: colors.cardBack, true: colors.primary }}
              thumbColor={colors.cardFront}
            />
          </View>
          <Text style={styles.description}>Show all cards for 2 seconds before the game starts</Text>
        </View>

        <View style={styles.section}>
          <View style={styles.toggleRow}>
            <Text style={styles.sectionTitle}>Animations</Text>
            <Switch
              value={!!settings.animationsEnabled}
              onValueChange={(value) => updateSettings({ animationsEnabled: value })}
              trackColor={{ false: colors.cardBack, true: colors.primary }}
              thumbColor={colors.cardFront}
            />
          </View>
          <Text style={styles.description}>Enable card flip animations</Text>
        </View>

        <View style={styles.section}>
          <View style={styles.toggleRow}>
            <Text style={styles.sectionTitle}>Sound</Text>
            <Switch
              value={!!settings.soundEnabled}
              onValueChange={(value) => updateSettings({ soundEnabled: value })}
              trackColor={{ false: colors.cardBack, true: colors.primary }}
              thumbColor={colors.cardFront}
            />
          </View>
          <Text style={styles.description}>Enable gentle sound effects</Text>
        </View>

        {settings.soundEnabled && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Volume</Text>
            <View style={styles.volumeRow}>
              <TouchableOpacity
                style={styles.volumeButton}
                onPress={() =>
                  updateSettings({
                    soundVolume: Math.max(0, Math.round((settings.soundVolume - 0.1) * 10) / 10),
                  })
                }
                disabled={settings.soundVolume <= 0}
              >
                <Text style={styles.volumeButtonText}>−</Text>
              </TouchableOpacity>

              <View style={styles.volumeBarTrack}>
                {[0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0].map((step) => (
                  <TouchableOpacity
                    key={step}
                    style={[
                      styles.volumeSegment,
                      settings.soundVolume >= step ? styles.volumeSegmentFilled : undefined,
                    ]}
                    onPress={() => updateSettings({ soundVolume: step })}
                  />
                ))}
              </View>

              <TouchableOpacity
                style={styles.volumeButton}
                onPress={() =>
                  updateSettings({
                    soundVolume: Math.min(1, Math.round((settings.soundVolume + 0.1) * 10) / 10),
                  })
                }
                disabled={settings.soundVolume >= 1}
              >
                <Text style={styles.volumeButtonText}>+</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.description}>{Math.round(settings.soundVolume * 100)}%</Text>
          </View>
        )}

        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>Back to Home</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const createStyles = (colors: ThemeColors, resolvedMode: ResolvedThemeMode) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scrollContent: {
      padding: 24,
    },
    title: {
      fontSize: 32,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 32,
      textAlign: 'center',
    },
    section: {
      marginBottom: 32,
    },
    sectionTitle: {
      fontSize: 20,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 12,
    },
    toggleRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    description: {
      fontSize: 14,
      color: colors.textLight,
      marginTop: 4,
    },
    modeOptions: {
      flexDirection: 'row',
      gap: 8,
      marginTop: 4,
    },
    modeButton: {
      flex: 1,
      backgroundColor: colors.cardFront,
      borderWidth: 2,
      borderColor: colors.cardBack,
      borderRadius: 12,
      paddingVertical: 10,
      alignItems: 'center',
    },
    modeButtonActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    modeButtonText: {
      fontSize: 15,
      fontWeight: '600',
      color: resolvedMode === 'dark' ? colors.background : colors.text,
    },
    modeButtonTextActive: {
      color: resolvedMode === 'dark' ? colors.background : colors.cardFront,
    },
    volumeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginTop: 4,
    },
    volumeButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: colors.cardFront,
      borderWidth: 2,
      borderColor: colors.cardBack,
      justifyContent: 'center',
      alignItems: 'center',
    },
    volumeButtonText: {
      fontSize: 20,
      fontWeight: '600',
      color: resolvedMode === 'dark' ? colors.background : colors.text,
      lineHeight: 22,
    },
    volumeBarTrack: {
      flex: 1,
      flexDirection: 'row',
      gap: 3,
      alignItems: 'center',
    },
    volumeSegment: {
      flex: 1,
      height: 20,
      borderRadius: 4,
      backgroundColor: colors.cardBack,
    },
    volumeSegmentFilled: {
      backgroundColor: colors.primary,
    },
    backButton: {
      backgroundColor: colors.secondary,
      paddingHorizontal: 32,
      paddingVertical: 16,
      borderRadius: 25,
      alignItems: 'center',
      marginTop: 16,
    },
    backButtonText: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.cardFront,
    },
  });

