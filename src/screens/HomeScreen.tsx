import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSettings } from '../context/SettingsContext';
import { Difficulty, PASTEL_COLORS, ThemeColors } from '../types';
import { ResolvedThemeMode, useThemeColors } from '../utils/theme';
import { AppScreen, AppButton, AppModal, GameCard, SegmentedControl } from '../ui/components';
import { Space, TypeStyle } from '../ui/tokens';
import { useLayout } from '../ui/useLayout';

interface Game {
  id: string;
  name: string;
  description: string;
  icon: string;
  accentColor?: string;
}

const GAMES: Game[] = [
  {
    id: 'memory-snap',
    name: 'Memory Snap',
    description: 'A calm memory matching game',
    icon: '🧩',
    accentColor: PASTEL_COLORS.primary,
  },
  {
    id: 'drawing',
    name: 'Drawing Pad',
    description: 'Draw with colors and erase',
    icon: '🎨',
    accentColor: PASTEL_COLORS.secondary,
  },
  {
    id: 'glitter-fall',
    name: 'Glitter Fall',
    description: 'Snow globe glitter play',
    icon: '✨',
    accentColor: PASTEL_COLORS.accent,
  },
  {
    id: 'bubble-pop',
    name: 'Bubble Pop',
    description: 'Tap falling bubbles',
    icon: '🫧',
    accentColor: PASTEL_COLORS.success,
  },
  {
    id: 'category-match',
    name: 'Category Match',
    description: 'Drag to sort by category',
    icon: '🗂️',
    accentColor: PASTEL_COLORS.cardBack,
  },
  {
    id: 'keepy-uppy',
    name: 'Keepy Uppy',
    description: 'Tap balloons in the backyard',
    icon: '🎈',
    accentColor: PASTEL_COLORS.secondary,
  },
];

const DIFFICULTY_OPTIONS: { value: Difficulty; label: string; description: string }[] = [
  { value: 'easy', label: 'Easy', description: '3×4 grid (12 cards)' },
  { value: 'medium', label: 'Medium', description: '4×5 grid (20 cards)' },
  { value: 'hard', label: 'Hard', description: '5×6 grid (30 cards)' },
];

const ROUTE_MAP: Record<string, string> = {
  'memory-snap': 'Game',
  drawing: 'Drawing',
  'glitter-fall': 'Glitter',
  'bubble-pop': 'Bubble',
  'category-match': 'CategoryMatch',
  'keepy-uppy': 'KeepyUppy',
};

export const HomeScreen: React.FC = () => {
  const navigation = useNavigation();
  const { settings, updateSettings } = useSettings();
  const { colors, resolvedMode } = useThemeColors();
  const styles = useMemo(() => createStyles(colors, resolvedMode), [colors, resolvedMode]);
  const { gridColumns, contentWidth, isTablet } = useLayout();
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [showDifficultySelector, setShowDifficultySelector] = useState(false);

  const visibleGames = useMemo(
    () => GAMES.filter((game) => !settings.hiddenGames.includes(game.id)),
    [settings.hiddenGames]
  );

  const handleGameSelect = (game: Game) => {
    setSelectedGame(game);
    if (game.id === 'memory-snap') {
      setShowDifficultySelector(true);
    } else {
      const route = ROUTE_MAP[game.id];
      if (route) navigation.navigate(route as never);
      setSelectedGame(null);
    }
  };

  const handleDifficultySelect = async (difficulty: Difficulty) => {
    await updateSettings({ difficulty });
    setShowDifficultySelector(false);
    navigation.navigate('Game' as never);
    setSelectedGame(null);
  };

  const handleCloseModal = () => {
    setShowDifficultySelector(false);
    setSelectedGame(null);
  };

  const getDifficultyLabel = (difficulty: Difficulty) => {
    const option = DIFFICULTY_OPTIONS.find(opt => opt.value === difficulty);
    return option?.label || difficulty;
  };

  return (
    <AppScreen testID="home-screen">
      <View style={[styles.content, isTablet && { maxWidth: contentWidth, alignSelf: 'center', width: '100%' }]}>
        <View style={styles.titleArea}>
          <Text style={styles.title} accessibilityRole="header">Gentle Games</Text>
          <Text style={styles.subtitle}>Calm games for little ones</Text>
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
                  style={isTablet ? { width: `${Math.floor(100 / gridColumns)}%`, paddingHorizontal: Space.xs } : undefined}
                >
                  <GameCard
                    icon={game.icon}
                    title={game.name}
                    description={game.description}
                    onPress={() => handleGameSelect(game)}
                    accentColor={game.accentColor}
                  />
                </View>
              ))}
            </ScrollView>
          ) : (
            <Text style={styles.emptyGamesText}>
              All games are hidden. Enable one in Settings.
            </Text>
          )}
        </View>

        <View style={styles.footer}>
          <AppButton
            label="⚙️  Settings"
            variant="secondary"
            size="lg"
            onPress={() => navigation.navigate('Settings' as never)}
            accessibilityHint="Opens app settings"
          />
        </View>
      </View>

      <AppModal
        visible={showDifficultySelector}
        onClose={handleCloseModal}
        title={selectedGame?.name}
        showClose
        closeLabel="Cancel"
      >
        <Text style={styles.modalSubtitle}>
          Select difficulty
          {settings.difficulty && ` (last: ${getDifficultyLabel(settings.difficulty)})`}
        </Text>
        <View style={styles.optionsList}>
          {DIFFICULTY_OPTIONS.map(({ value, label, description }) => (
            <AppButton
              key={value}
              label={`${label}  ·  ${description}`}
              variant={settings.difficulty === value ? 'primary' : 'ghost'}
              size="md"
              fullWidth
              onPress={() => handleDifficultySelect(value)}
              style={{ marginBottom: Space.sm }}
              accessibilityLabel={`${label} difficulty, ${description}`}
            />
          ))}
        </View>
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
    alignItems: 'center',
    marginBottom: Space['2xl'],
  },
  title: {
    ...TypeStyle.h1,
    color: colors.text,
    textAlign: 'center',
    marginBottom: Space.xs,
  },
  subtitle: {
    ...TypeStyle.body,
    color: colors.textLight,
    textAlign: 'center',
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
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  emptyGamesText: {
    ...TypeStyle.body,
    textAlign: 'center',
    color: colors.textLight,
    marginTop: Space.lg,
  },
  footer: {
    alignItems: 'center',
    paddingBottom: Space.sm,
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
