import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useTranslation } from 'react-i18next';
import { useSettings } from '../../context/SettingsContext';
import { useThemeColors } from '../../utils/theme';
import { Space, TypeStyle } from '../tokens';

/** The same visible exit and sound control in every activity. */
export const GameHeader: React.FC<{ title: string; onBack: () => void }> = ({ title, onBack }) => {
  const { t } = useTranslation();
  const { colors } = useThemeColors();
  const { settings, updateSettings } = useSettings();
  const soundEnabled = settings.soundEnabled === true;
  const controlStyle = [
    styles.control,
    { backgroundColor: colors.surface, borderColor: colors.border },
  ];

  return (
    <View
      style={[
        styles.header,
        { backgroundColor: colors.background, borderBottomColor: colors.borderSubtle },
      ]}
    >
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
        style={controlStyle}
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
            stroke={colors.text}
            strokeWidth={1.8}
            strokeLinejoin='round'
          />
          <Path
            d={soundEnabled ? 'M16 8q4 4 0 8 M19 4q7 8 0 16' : 'M16 9l6 6 M22 9l-6 6'}
            fill='none'
            stroke={colors.text}
            strokeWidth={1.8}
            strokeLinecap='round'
          />
        </Svg>
        <Text style={[styles.label, { color: colors.text }]}>
          {t(soundEnabled ? 'common.soundOn' : 'common.soundOff')}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    minHeight: 68,
    flexShrink: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Space.sm,
    paddingVertical: Space.xs,
    borderBottomWidth: 1,
    gap: Space.xs,
  },
  control: {
    minWidth: 68,
    minHeight: 56,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    borderWidth: 1,
    padding: Space.xs,
  },
  label: { ...TypeStyle.buttonSm, fontSize: 12, textAlign: 'center' },
  title: { ...TypeStyle.h3, fontSize: 19, flex: 1, textAlign: 'center' },
});
