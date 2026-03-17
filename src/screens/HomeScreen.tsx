import React, { useMemo, useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { useTranslation } from "react-i18next";
import { useSettings } from "../context/SettingsContext";
import { Difficulty, PASTEL_COLORS, ThemeColors, UNFINISHED_GAMES } from "../types";
import { APP_ROUTES, AppStackParamList, HOME_GAME_ROUTES, HomeGameId } from "../types/navigation";
import { ResolvedThemeMode, useThemeColors } from "../utils/theme";
import { openExternalUrl } from "../utils/externalLinks";
import { TranslationKey } from "../i18n/types";
import {
  AppScreen,
  AppButton,
  AppModal,
  GameCard,
  SegmentedControl,
} from "../ui/components";
import { Space, TypeStyle } from "../ui/tokens";
import { useLayout } from "../ui/useLayout";

interface Game {
  id: HomeGameId;
  nameKey: TranslationKey;
  descriptionKey: TranslationKey;
  icon: string;
  accentColor?: string;
}

const GAMES: Game[] = [
  {
    id: "memory-snap",
    nameKey: "games.memorySnap.name",
    descriptionKey: "games.memorySnap.description",
    icon: "🧩",
    accentColor: PASTEL_COLORS.primary,
  },
  {
    id: "drawing",
    nameKey: "games.drawing.name",
    descriptionKey: "games.drawing.description",
    icon: "🎨",
    accentColor: PASTEL_COLORS.secondary,
  },
  {
    id: "glitter-fall",
    nameKey: "games.glitterFall.name",
    descriptionKey: "games.glitterFall.description",
    icon: "✨",
    accentColor: PASTEL_COLORS.accent,
  },
  {
    id: "bubble-pop",
    nameKey: "games.bubblePop.name",
    descriptionKey: "games.bubblePop.description",
    icon: "🫧",
    accentColor: PASTEL_COLORS.success,
  },
  {
    id: "category-match",
    nameKey: "games.categoryMatch.name",
    descriptionKey: "games.categoryMatch.description",
    icon: "🗂️",
    accentColor: PASTEL_COLORS.cardBack,
  },
  {
    id: "keepy-uppy",
    nameKey: "games.keepyUppy.name",
    descriptionKey: "games.keepyUppy.description",
    icon: "🎈",
    accentColor: PASTEL_COLORS.secondary,
  },
  {
    id: "breathing-garden",
    nameKey: "games.breathingGarden.name",
    descriptionKey: "games.breathingGarden.description",
    icon: "🌸",
    accentColor: PASTEL_COLORS.accent,
  },
  {
    id: "pattern-train",
    nameKey: "games.patternTrain.name",
    descriptionKey: "games.patternTrain.description",
    icon: "🚂",
    accentColor: PASTEL_COLORS.primary,
  },
  {
    id: "number-picnic",
    nameKey: "games.numberPicnic.name",
    descriptionKey: "games.numberPicnic.description",
    icon: "🧺",
    accentColor: PASTEL_COLORS.success,
  },
];

export const HomeScreen: React.FC = () => {
  const navigation = useNavigation<StackNavigationProp<AppStackParamList>>();
  const { settings, updateSettings } = useSettings();
  const { colors, resolvedMode } = useThemeColors();
  const styles = useMemo(
    () => createStyles(colors, resolvedMode),
    [colors, resolvedMode],
  );
  const { gridColumns, contentWidth, isTablet } = useLayout();
  const { t } = useTranslation();
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [showDifficultySelector, setShowDifficultySelector] = useState(false);
  const [showWebsiteFallback, setShowWebsiteFallback] = useState(false);

  const difficultyOptions: {
    value: Difficulty;
    label: string;
    description: string;
  }[] = [
      { value: "easy", label: t("difficulty.easy.label"), description: t("difficulty.easy.description") },
      { value: "medium", label: t("difficulty.medium.label"), description: t("difficulty.medium.description") },
      { value: "hard", label: t("difficulty.hard.label"), description: t("difficulty.hard.description") },
    ];

  const visibleGames = useMemo(
    () => GAMES.filter((game) => {
      if (settings.hiddenGames.includes(game.id)) return false;
      if (!settings.enableUnfinishedGames && UNFINISHED_GAMES.includes(game.id)) return false;
      return true;
    }),
    [settings.hiddenGames, settings.enableUnfinishedGames],
  );

  const handleGameSelect = (game: Game) => {
    setSelectedGame(game);
    if (game.id === "memory-snap") {
      setShowDifficultySelector(true);
    } else {
      navigation.navigate(HOME_GAME_ROUTES[game.id]);
      setSelectedGame(null);
    }
  };

  const handleDifficultySelect = async (difficulty: Difficulty) => {
    await updateSettings({ difficulty });
    setShowDifficultySelector(false);
    navigation.navigate(APP_ROUTES.Game);
    setSelectedGame(null);
  };

  const handleCloseModal = () => {
    setShowDifficultySelector(false);
    setSelectedGame(null);
  };

  const handleWebsitePress = async () => {
    const result = await openExternalUrl("https://gentlegames.org");

    if (result !== "opened") {
      setShowWebsiteFallback(true);
    }
  };

  const getDifficultyLabel = (difficulty: Difficulty) => {
    const option = difficultyOptions.find((opt) => opt.value === difficulty);
    return option?.label || difficulty;
  };

  return (
    <AppScreen testID="home-screen">
      <View
        style={[
          styles.content,
          isTablet && {
            maxWidth: contentWidth,
            alignSelf: "center",
            width: "100%",
          },
        ]}
      >
        <View style={styles.titleArea}>
          <Text style={styles.title} accessibilityRole="header">
            {t("home.title")}
          </Text>
          <Text style={styles.subtitle}>{t("home.subtitle")}</Text>
        </View>

        <View style={styles.gamesContainer} testID="home-games-container">
          {visibleGames.length > 0 ? (
            <ScrollView
              style={styles.gamesScroll}
              contentContainerStyle={[
                styles.gamesScrollContent,
                isTablet && styles.gamesGrid,
              ]}
              showsVerticalScrollIndicator
              persistentScrollbar
            >
              {visibleGames.map((game) => (
                <View
                  key={game.id}
                  style={
                    isTablet
                      ? {
                        width: `${Math.floor(100 / gridColumns)}%`,
                        paddingHorizontal: Space.xs,
                        justifyContent: "center",
                      }
                      : undefined
                  }
                >
                  <GameCard
                    icon={game.icon}
                    title={t(game.nameKey)}
                    description={t(game.descriptionKey)}
                    onPress={() => handleGameSelect(game)}
                    accentColor={game.accentColor}
                    style={
                      gridColumns === 1
                        ? { padding: Space.md }
                        : undefined
                    }
                  />
                </View>
              ))}
            </ScrollView>
          ) : (
            <Text style={styles.emptyGamesText}>
              {t("home.emptyGames")}
            </Text>
          )}
        </View>

        <View style={styles.footer}>
          <AppButton
            label={t("home.settingsButton")}
            variant="secondary"
            size="lg"
            onPress={() => navigation.navigate(APP_ROUTES.Settings)}
            accessibilityHint={t("home.settingsHint")}
          />
          <TouchableOpacity
            onPress={handleWebsitePress}
            style={styles.websiteLinkContainer}
            accessibilityRole="link"
            accessibilityLabel={t("home.websiteLink")}
          >
            <Text style={styles.websiteLinkText}>{t("home.websiteLink")}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <AppModal
        visible={showDifficultySelector}
        onClose={handleCloseModal}
        title={selectedGame ? t(selectedGame.nameKey) : undefined}
        showClose
        closeLabel={t("common.cancel")}
      >
        <Text style={styles.modalSubtitle}>
          {t("difficulty.title")}
          {settings.difficulty &&
            ` (${t("games.memorySnap.lastUsed")}: ${getDifficultyLabel(settings.difficulty)})`}
        </Text>
        <View style={styles.optionsList}>
          {difficultyOptions.map(({ value, label, description }) => (
            <AppButton
              key={value}
              label={`${label}  ·  ${description}`}
              variant={settings.difficulty === value ? "primary" : "ghost"}
              size="md"
              fullWidth
              onPress={() => handleDifficultySelect(value)}
              style={{ marginBottom: Space.sm }}
              accessibilityLabel={`${label} difficulty, ${description}`}
            />
          ))}
        </View>
      </AppModal>

      <AppModal
        visible={showWebsiteFallback}
        onClose={() => setShowWebsiteFallback(false)}
        title={t("home.websiteLinkFallback.title")}
      >
        <Text style={styles.modalSubtitle}>{t("home.websiteLinkFallback.message")}</Text>
      </AppModal>
    </AppScreen>
  );
};

const createStyles = (colors: ThemeColors, resolvedMode: ResolvedThemeMode) =>
  StyleSheet.create({
    content: {
      flex: 1,
      padding: Space.xl,
      paddingTop: Space.lg,
    },
    titleArea: {
      alignItems: "center",
      marginBottom: Space["2xl"],
    },
    title: {
      ...TypeStyle.h1,
      color: colors.text,
      textAlign: "center",
      marginBottom: Space.xs,
    },
    subtitle: {
      ...TypeStyle.body,
      color: colors.textLight,
      textAlign: "center",
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
      paddingBottom: Space.sm,
    },
    gamesGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
    },
    emptyGamesText: {
      ...TypeStyle.body,
      textAlign: "center",
      color: colors.textLight,
      marginTop: Space.lg,
    },
    footer: {
      alignItems: "center",
      paddingBottom: Space.sm,
      gap: Space.md,
    },
    websiteLinkContainer: {
      paddingVertical: Space.xs,
    },
    websiteLinkText: {
      ...TypeStyle.bodySm,
      color: colors.textLight,
      textDecorationLine: "underline",
      opacity: 0.6,
    },
    modalSubtitle: {
      ...TypeStyle.bodySm,
      color: colors.textLight,
      textAlign: "center",
      marginBottom: Space.base,
    },
    optionsList: {
      marginBottom: Space.sm,
    },
  });
