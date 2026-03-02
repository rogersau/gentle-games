import React, { useMemo, useRef, useState } from 'react';
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useSettings } from '../context/SettingsContext';
import { KeepyUppyBoard, KeepyUppyBoardRef } from '../components/KeepyUppyBoard';
import { KeepyUppyBounds, MAX_BALLOONS } from '../utils/keepyUppyLogic';
import { ThemeColors } from '../types';
import { useThemeColors } from '../utils/theme';
import { AppScreen, AppHeader, AppButton } from '../ui/components';
import { Space, TypeStyle } from '../ui/tokens';

export const KeepyUppyScreen: React.FC = () => {
  const navigation = useNavigation();
  const { settings } = useSettings();
  const { colors } = useThemeColors();
  const { t } = useTranslation();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const boardRef = useRef<KeepyUppyBoardRef>(null);
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const [score, setScore] = useState(0);
  const [balloonCount, setBalloonCount] = useState(1);
  const [popped, setPopped] = useState(0);

  const bounds = useMemo<KeepyUppyBounds>(() => {
    const width = Math.max(260, screenWidth - 24);
    const height = Math.max(320, Math.min(screenHeight * 0.68, screenHeight - 220));
    return { width, height };
  }, [screenHeight, screenWidth]);

  const handleAddBalloon = () => {
    boardRef.current?.addBalloon();
  };

  return (
    <AppScreen>
      <AppHeader title={t('games.keepyUppy.title')} onBack={() => navigation.goBack()} />

      <View style={styles.content}>
        <Text style={styles.subtitle} accessibilityRole="text">
          {t('games.keepyUppy.subtitle')}
        </Text>
        <View style={styles.statsRow}>
          <Text style={styles.statText} accessibilityLabel={`${score} taps`}>Taps: {score}</Text>
          <Text style={styles.statText} accessibilityLabel={`${balloonCount} balloons`}>Balloons: {balloonCount}</Text>
          <Text style={styles.statText} accessibilityLabel={`${popped} popped`}>Popped: {popped}</Text>
        </View>
        <AppButton
          label={t('games.keepyUppy.addBalloon')}
          variant="secondary"
          size="sm"
          onPress={handleAddBalloon}
          disabled={balloonCount >= MAX_BALLOONS}
          accessibilityHint={t('games.keepyUppy.addBalloonHint')}
          style={{ marginBottom: Space.sm }}
        />

        <KeepyUppyBoard
          ref={boardRef}
          bounds={bounds}
          onScoreChange={setScore}
          onBalloonCountChange={setBalloonCount}
          onPoppedChange={setPopped}
          easyMode={settings.keepyUppyEasyMode}
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
    statsRow: {
      flexDirection: 'row',
      gap: Space.md,
      marginBottom: Space.md,
    },
    statText: {
      ...TypeStyle.buttonSm,
      color: colors.text,
    },
  });
