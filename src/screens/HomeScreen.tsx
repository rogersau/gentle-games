import React, { useCallback, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useTranslation } from 'react-i18next';
import { useSettings } from '../context/SettingsContext';
import { ThemeColors } from '../types';
import { APP_ROUTES, AppStackParamList } from '../types/navigation';
import { ResolvedThemeMode, useThemeColors } from '../utils/theme';
import { openExternalUrl } from '../utils/externalLinks';
import { AppScreen, AppButton, AppModal, GameCard, MochiPresence } from '../ui/components';
import { useMochi } from '../hooks/useMochi';
import { GameDefinition, getGameRoute, getVisibleGames } from '../games/registry';
import { useGameSelection } from '../hooks/useGameSelection';
import { Space, TypeStyle } from '../ui/tokens';
import { useLayout } from '../ui/useLayout';
import { getGameSettings, MemorySnapPairCount, pairCountToDifficulty } from '../games/settings';

export const HomeScreen: React.FC = () => {
  const navigation = useNavigation<StackNavigationProp<AppStackParamList>>();
  const { settings, updateGameSettings } = useSettings();
  const memorySettings = getGameSettings(settings, 'memory-snap');
  const { colors, resolvedMode } = useThemeColors();
  const styles = useMemo(() => createStyles(colors, resolvedMode), [colors, resolvedMode]);
  const { contentWidth, isTablet } = useLayout();
  const { t } = useTranslation();
  const { celebrate, showMochi } = useMochi();
  const {
    selectedGame,
    showDifficultySelector,
    handleGameSelect: onGameSelect,
    handleDifficultySelect: onDifficultySelect,
    handleCloseModal: onCloseModal,
  } = useGameSelection();
  const [showWebsiteFallback, setShowWebsiteFallback] = useState(false);
  const [isLaunching, setIsLaunching] = useState(false);
  const isLaunchingRef = useRef(false);
  const isMountedRef = useRef(true);

  React.useEffect(() => {
    return () => {
      isMountedRef.current = false;
      isLaunchingRef.current = false;
    };
  }, []);

  useFocusEffect(
    useCallback(() => {
      isLaunchingRef.current = false;
      setIsLaunching(false);
    }, []),
  );

  React.useEffect(() => {
    showMochi('mascot.greeting', 'floating');
  }, [showMochi]);

  const difficultyOptions: {
    value: MemorySnapPairCount;
    label: string;
    description: string;
  }[] = [
    {
      value: 6,
      label: t('difficulty.easy.label'),
      description: t('difficulty.easy.description'),
    },
    {
      value: 10,
      label: t('difficulty.medium.label'),
      description: t('difficulty.medium.description'),
    },
    {
      value: 15,
      label: t('difficulty.hard.label'),
      description: t('difficulty.hard.description'),
    },
  ];

  const visibleGames = useMemo(
    () =>
      getVisibleGames({
        hiddenGames: settings.hiddenGames,
        enableUnfinishedGames: settings.enableUnfinishedGames,
      }),
    [settings.hiddenGames, settings.enableUnfinishedGames],
  );

  const handleGameSelect = (game: GameDefinition) => {
    if (!isMountedRef.current || isLaunchingRef.current) {
      return;
    }

    if (game.launchMode === 'difficulty-select') {
      onGameSelect(game);
      return;
    }

    isLaunchingRef.current = true;
    setIsLaunching(true);

    try {
      onGameSelect(game);
      celebrate();
      if (isMountedRef.current) {
        navigation.navigate(getGameRoute(game.id));
      }
    } catch {
      if (isMountedRef.current) {
        isLaunchingRef.current = false;
        setIsLaunching(false);
      }
    }
  };

  const handleDifficultySelect = async (pairCount: MemorySnapPairCount) => {
    if (!isMountedRef.current || isLaunchingRef.current) {
      return;
    }

    const selectedGameRoute = selectedGame ? getGameRoute(selectedGame.id) : APP_ROUTES.Game;
    isLaunchingRef.current = true;
    setIsLaunching(true);

    try {
      await updateGameSettings('memory-snap', { pairCount });
      if (!isMountedRef.current) {
        return;
      }

      await onDifficultySelect(pairCountToDifficulty(pairCount));
      if (!isMountedRef.current) {
        return;
      }

      navigation.navigate(selectedGameRoute);
    } catch {
      if (isMountedRef.current) {
        isLaunchingRef.current = false;
        setIsLaunching(false);
      }
    }
  };

  const handleCloseModal = () => {
    if (!isLaunchingRef.current) {
      onCloseModal();
    }
  };

  const handleWebsitePress = async () => {
    const result = await openExternalUrl('https://gentlegames.org');

    if (result !== 'opened') {
      setShowWebsiteFallback(true);
    }
  };

  const getDifficultyLabel = (pairCount: MemorySnapPairCount) => {
    const option = difficultyOptions.find((opt) => opt.value === pairCount);
    return option?.label || String(pairCount);
  };

  return (
    <AppScreen testID='home-screen'>
      <View
        style={[
          styles.content,
          isTablet && {
            maxWidth: Math.min(contentWidth, 640),
            alignSelf: 'center',
            width: '100%',
          },
        ]}
      >
        <View style={styles.titleArea}>
          <View style={styles.titleCopy}>
            <Text
              style={styles.title}
              accessibilityRole='header'
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.8}
            >
              {t('home.title')}
            </Text>
            <Text style={styles.subtitle}>{t('home.subtitle')}</Text>
          </View>
          <MochiPresence size='sm' showPhrase={false} style={styles.mochiInHeader} />
        </View>

        <View style={styles.gamesContainer} testID='home-games-container'>
          {visibleGames.length > 0 ? (
            <ScrollView
              style={styles.gamesScroll}
              contentContainerStyle={styles.gamesScrollContent}
              showsVerticalScrollIndicator
              persistentScrollbar
            >
              {visibleGames.map((game) => (
                <View key={game.id}>
                  <GameCard
                    gameId={game.id}
                    icon={game.icon}
                    title={t(game.nameKey)}
                    description={t(game.descriptionKey)}
                    onPress={() => handleGameSelect(game)}
                    accentColor={game.accentColor}
                    disabled={isLaunching}
                    accessibilityState={{ busy: isLaunching }}
                    testID={`home-game-${game.id}`}
                  />
                </View>
              ))}
            </ScrollView>
          ) : (
            <Text style={styles.emptyGamesText}>{t('home.emptyGames')}</Text>
          )}
        </View>

        <View style={styles.footer}>
          <AppButton
            label={t('home.settingsButton')}
            variant='ghost'
            size='lg'
            fullWidth
            onPress={() => navigation.navigate(APP_ROUTES.Settings)}
            accessibilityHint={t('home.settingsHint')}
          />
          <TouchableOpacity
            onPress={handleWebsitePress}
            style={styles.websiteLinkContainer}
            accessibilityRole='link'
            accessibilityLabel={t('home.websiteLink')}
          >
            <Text style={styles.websiteLinkText}>{t('home.websiteLink')}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <AppModal
        visible={showDifficultySelector}
        onClose={handleCloseModal}
        disabled={isLaunching}
        accessibilityState={{ busy: isLaunching }}
        title={selectedGame ? t(selectedGame.nameKey) : undefined}
        showClose
        closeLabel={t('common.cancel')}
      >
        <Text style={styles.modalSubtitle}>
          {t('difficulty.title')}
          {` (${t('games.memorySnap.lastUsed')}: ${getDifficultyLabel(memorySettings.pairCount)})`}
        </Text>
        <View style={styles.optionsList}>
          {difficultyOptions.map(({ value, label, description }) => (
            <AppButton
              key={value}
              label={t('difficulty.optionLabel', { label, description })}
              variant={memorySettings.pairCount === value ? 'primary' : 'ghost'}
              size='md'
              fullWidth
              onPress={() => handleDifficultySelect(value)}
              disabled={isLaunching}
              accessibilityState={{ busy: isLaunching }}
              style={{ marginBottom: Space.sm }}
              accessibilityLabel={t('difficulty.accessibilityLabel', { label })}
            />
          ))}
        </View>
      </AppModal>

      <AppModal
        visible={showWebsiteFallback}
        onClose={() => setShowWebsiteFallback(false)}
        title={t('home.websiteLinkFallback.title')}
      >
        <Text style={styles.modalSubtitle}>{t('home.websiteLinkFallback.message')}</Text>
      </AppModal>
    </AppScreen>
  );
};

const createStyles = (colors: ThemeColors, _resolvedMode: ResolvedThemeMode) =>
  StyleSheet.create({
    content: {
      flex: 1,
      padding: Space.xl,
      paddingTop: Space.lg,
    },
    titleArea: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: Space.base,
      marginBottom: Space.xl,
      minHeight: 72,
    },
    titleCopy: {
      flex: 1,
      alignItems: 'flex-start',
    },
    mochiInHeader: {
      flexShrink: 0,
    },
    title: {
      ...TypeStyle.h1,
      color: colors.text,
      textAlign: 'left',
      marginBottom: Space.xs,
    },
    subtitle: {
      ...TypeStyle.body,
      color: colors.text,
      textAlign: 'left',
    },
    gamesContainer: {
      flex: 1,
      flexShrink: 1,
      minHeight: 0,
      marginBottom: Space.lg,
    },
    gamesScroll: {
      flex: 1,
    },
    gamesScrollContent: {
      paddingBottom: Space.base,
    },
    emptyGamesText: {
      ...TypeStyle.body,
      textAlign: 'center',
      color: colors.textLight,
      marginTop: Space.lg,
    },
    footer: {
      alignItems: 'stretch',
      paddingBottom: Space.sm,
      gap: Space.sm,
    },
    websiteLinkContainer: {
      alignSelf: 'center',
      paddingVertical: Space.xs,
    },
    websiteLinkText: {
      ...TypeStyle.bodySm,
      color: colors.text,
      textDecorationLine: 'underline',
    },
    modalSubtitle: {
      ...TypeStyle.bodySm,
      color: colors.textLight,
      textAlign: 'center',
      marginBottom: Space.base,
    },
    optionsList: {
      marginBottom: Space.sm,
    },
  });
