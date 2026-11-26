import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useTranslation } from 'react-i18next';
import { useSettings } from '../../context/SettingsContext';
import { useThemeColors } from '../../utils/theme';
import { Shadow, Space, TypeStyle } from '../tokens';

/** The same visible exit and sound control in every activity. */
export const GameHeader: React.FC<{ title: string; onBack: () => void }> = ({ title, onBack }) => {
  const { t } = useTranslation();
  const { colors } = useThemeColors();
  const { settings, updateSettings } = useSettings();
  const soundEnabled = settings.soundEnabled === true;
  const soundInk = soundEnabled ? colors.skyInk : colors.text;
  const controlStyle = [
    styles.control,
    Shadow.sm,
    { backgroundColor: colors.surface, borderColor: colors.line },
  ];

  return (
    <View style={[styles.header, { backgroundColor: colors.background }]}>
      <TouchableOpacity
        onPress={onBack}
        style={controlStyle}
        accessibilityRole='button'
        accessibilityLabel={t('common.home')}
        testID='game-home'
      >
        <Svg width={22} height={22} viewBox='0 0 24 24' aria-hidden accessible={false}>
          <Path
            d='M3 10 12 3 21 10 M5 9v12h5v-7h4v7h5V9'
            fill='none'
            stroke={colors.text}
            strokeWidth={1.8}
            strokeLinecap='round'
            strokeLinejoin='round'
          />
        </Svg>
        <Text style={[styles.label, { color: colors.text }]}>{t('common.home')}</Text>
      </TouchableOpacity>
      <Text
        style={[styles.title, { color: colors.text }]}
        accessibilityRole='header'
        numberOfLines={2}
      >
        {title}
      </Text>
      <TouchableOpacity
        onPress={() => void updateSettings({ soundEnabled: !soundEnabled })}
        style={[
          controlStyle,
          soundEnabled && {
            backgroundColor: colors.sky,
            borderColor: colors.skyInk,
            borderWidth: 2,
          },
        ]}
        accessibilityRole='switch'
        accessibilityState={{ checked: soundEnabled }}
        aria-checked={soundEnabled}
        accessibilityLabel={t('settings.sound.label')}
        accessibilityHint={t(soundEnabled ? 'common.muteSound' : 'common.enableSound')}
        testID='game-sound'
      >
        <Svg width={22} height={22} viewBox='0 0 24 24' aria-hidden accessible={false}>
          <Path
            d='M3 9h4l5-5v16l-5-5H3Z'
            fill='none'
            stroke={soundInk}
            strokeWidth={1.8}
            strokeLinejoin='round'
          />
          <Path
            d={soundEnabled ? 'M16 8q4 4 0 8 M19 4q7 8 0 16' : 'M16 9l6 6 M22 9l-6 6'}
            fill='none'
            stroke={soundInk}
            strokeWidth={1.8}
            strokeLinecap='round'
          />
        </Svg>
        <Text style={[styles.label, { color: soundInk }]}>{t('settings.sound.label')}</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    minHeight: 64,
    flexShrink: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Space.md,
    paddingTop: Space.xs,
    paddingBottom: Space.sm,
    gap: Space.xs,
  },
  control: {
    minWidth: 66,
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    borderWidth: 1.5,
    paddingHorizontal: Space.sm,
    paddingVertical: Space.xs,
  },
  label: { ...TypeStyle.buttonSm, fontSize: 13, lineHeight: 16, textAlign: 'center' },
  title: { ...TypeStyle.title, fontSize: 20, lineHeight: 26, flex: 1, textAlign: 'center' },
});
