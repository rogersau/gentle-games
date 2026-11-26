import React, { useCallback, useRef, useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useTranslation } from 'react-i18next';
import { useSettings } from '../context/SettingsContext';
import { APP_ROUTES, AppStackParamList } from '../types/navigation';
import { useThemeColors } from '../utils/theme';
import { AppScreen, GameCard } from '../ui/components';
import { useGrownUpsGate } from '../ui/components/GrownUpsGate';
import { Mochi } from '../components/Mochi';
import { getGameRoute, getVisibleGames } from '../games/registry';
import { Breakpoint, Space, TypeStyle } from '../ui/tokens';
import { useLayout } from '../ui/useLayout';

export const HomeScreen: React.FC = () => {
  const navigation = useNavigation<StackNavigationProp<AppStackParamList>>();
  const { settings } = useSettings();
  const { colors } = useThemeColors();
  const { screenWidth } = useLayout();
  const { t } = useTranslation();
  const [isLaunching, setIsLaunching] = useState(false);
  const isLaunchingRef = useRef(false);
  const [active, setActive] = useState(true);

  useFocusEffect(
    useCallback(() => {
      isLaunchingRef.current = false;
      setIsLaunching(false);
      setActive(true);
      return () => {
        isLaunchingRef.current = true;
        setActive(false);
      };
    }, []),
  );

  const visibleGames = getVisibleGames({
    hiddenGames: settings.hiddenGames,
    enableUnfinishedGames: settings.enableUnfinishedGames,
  });
  const columns = screenWidth >= Breakpoint.expanded ? 4 : screenWidth >= Breakpoint.medium ? 3 : 2;
  const rows = Array.from({ length: Math.ceil(visibleGames.length / columns) }, (_, row) =>
    visibleGames.slice(row * columns, (row + 1) * columns),
  );
  const launch = (route: keyof AppStackParamList) => {
    if (isLaunchingRef.current) return;
    isLaunchingRef.current = true;
    setIsLaunching(true);
    try {
      navigation.navigate(route);
    } catch {
      isLaunchingRef.current = false;
      setIsLaunching(false);
    }
  };

  const { pill: grownUpsPill, overlays: grownUpsOverlays } = useGrownUpsGate({
    enabled: settings.grownUpsHoldGate !== false,
    active,
    onOpen: () => launch(APP_ROUTES.Settings),
  });

  return (
    <AppScreen testID='home-screen'>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        testID='home-games-container'
        showsVerticalScrollIndicator
      >
        <View style={styles.greeting}>
          <View
            accessibilityElementsHidden
            importantForAccessibility='no-hide-descendants'
            aria-hidden
          >
            <Mochi size='sm' animate={false} />
          </View>
          <View style={styles.copy}>
            <Text style={[TypeStyle.title, { color: colors.text }]} accessibilityRole='header'>
              {t('home.greeting')}
            </Text>
            <Text style={[TypeStyle.body, { color: colors.textLight }]}>
              {t('home.invitation')}
            </Text>
          </View>
          <View style={styles.gateWrap}>{grownUpsPill}</View>
        </View>
        {rows.map((row) => (
          <View key={row[0].id} style={styles.row}>
            {row.map((game) => (
              <View key={game.id} style={styles.cell}>
                <GameCard
                  gameId={game.id}
                  title={t(game.nameKey)}
                  description={t(game.descriptionKey)}
                  onPress={() => launch(getGameRoute(game.id))}
                  artworkSize={columns > 2 ? 96 : 88}
                  disabled={isLaunching}
                  accessibilityState={{ busy: isLaunching }}
                  testID={`home-game-${game.id}`}
                />
              </View>
            ))}
            {Array.from({ length: columns - row.length }, (_, index) => (
              <View key={index} style={styles.cell} />
            ))}
          </View>
        ))}
        {!rows.length && (
          <Text style={[TypeStyle.body, { color: colors.textLight }]}>{t('home.emptyGames')}</Text>
        )}
      </ScrollView>
      {grownUpsOverlays}
    </AppScreen>
  );
};

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: {
    width: '100%',
    maxWidth: 920,
    alignSelf: 'center',
    paddingHorizontal: Space.base,
    paddingTop: Space.sm,
    paddingBottom: Space.lg,
    gap: Space.md,
  },
  greeting: {
    minHeight: 72,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Space.sm,
  },
  copy: { flex: 1 },
  gateWrap: { alignSelf: 'flex-start', paddingTop: Space.xs },
  row: { flexDirection: 'row', gap: Space.md },
  cell: { flex: 1, minWidth: 0 },
});
