import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Mochi, MochiVariant, MochiSize } from './Mochi';
import { useMochiContext } from '../context/MochiContext';
import { useThemeColors, useReducedMotion } from '../utils/theme';
import { Space, TypeStyle } from '../ui/tokens';

interface MochiPresenceProps {
  size?: MochiSize;
  style?: object;
  testID?: string;
}

export const MochiPresence: React.FC<MochiPresenceProps> = ({
  size = 'md',
  style,
  testID = 'mochi-presence',
}) => {
  const { resolvedMode } = useThemeColors();
  const reducedMotion = useReducedMotion();
  const { t } = useTranslation();
  const { mochiProps } = useMochiContext();

  const { variant = 'idle', visible, phrase } = mochiProps;

  const mochiColor = resolvedMode === 'dark' ? '#9B7BB0' : '#D4A5E8';
  const highlightColor = resolvedMode === 'dark' ? '#B89CC8' : '#EDE0F5';
  const shadowColor = resolvedMode === 'dark' ? '#7A5E94' : '#C496D8';
  const blushColor = resolvedMode === 'dark' ? '#C890B0' : '#F0C0D8';

  if (!visible) return null;

  return (
    <View style={[styles.container, style]} testID={testID}>
      {phrase && (
        <View style={styles.phraseContainer}>
          <Text style={styles.phraseText}>{t(phrase)}</Text>
        </View>
      )}
      <Mochi
        variant={variant}
        size={size}
        color={mochiColor}
        highlightColor={highlightColor}
        shadowColor={shadowColor}
        blushColor={blushColor}
        animate={!reducedMotion}
        testID={`${testID}-mochi`}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  phraseContainer: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 12,
    paddingHorizontal: Space.sm,
    paddingVertical: Space.xs,
    marginBottom: Space.xs,
  },
  phraseText: {
    ...TypeStyle.bodySm,
    color: '#5A5A5A',
    textAlign: 'center',
  },
});