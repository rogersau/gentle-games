import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSettings } from '../context/SettingsContext';
import { Difficulty, ThemeColors } from '../types';
import { ResolvedThemeMode, useThemeColors } from '../utils/theme';

interface Game {
  id: string;
  name: string;
  description: string;
  icon: string;
}

const GAMES: Game[] = [
  {
    id: 'memory-snap',
    name: 'Memory Snap',
    description: 'A calm memory matching game',
    icon: '🧩',
  },
  {
    id: 'drawing',
    name: 'Drawing Pad',
    description: 'Draw with colors and erase',
    icon: '🎨',
  },
  {
    id: 'glitter-fall',
    name: 'Glitter Fall',
    description: 'Snow globe glitter play',
    icon: '✨',
  },
  {
    id: 'bubble-pop',
    name: 'Bubble Pop',
    description: 'Tap falling bubbles',
    icon: '🫧',
  },
  {
    id: 'category-match',
    name: 'Category Match',
    description: 'Drag to sort by category',
    icon: '🗂️',
  },
];

const DIFFICULTY_OPTIONS: { value: Difficulty; label: string; description: string }[] = [
  { value: 'easy', label: 'Easy', description: '3x4 grid (12 cards)' },
  { value: 'medium', label: 'Medium', description: '4x5 grid (20 cards)' },
  { value: 'hard', label: 'Hard', description: '5x6 grid (30 cards)' },
];

export const HomeScreen: React.FC = () => {
  const navigation = useNavigation();
  const { settings, updateSettings } = useSettings();
  const { colors, resolvedMode } = useThemeColors();
  const styles = useMemo(() => createStyles(colors, resolvedMode), [colors, resolvedMode]);
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [showDifficultySelector, setShowDifficultySelector] = useState(false);

  const visibleGames = useMemo(
    () => GAMES.filter((game) => !settings.hiddenGames.includes(game.id)),
    [settings.hiddenGames]
  );

  const handleGameSelect = (game: Game) => {
    setSelectedGame(game);
    if (game.id === 'drawing') {
      navigation.navigate('Drawing' as never);
      setSelectedGame(null);
    } else if (game.id === 'glitter-fall') {
      navigation.navigate('Glitter' as never);
      setSelectedGame(null);
    } else if (game.id === 'bubble-pop') {
      navigation.navigate('Bubble' as never);
      setSelectedGame(null);
    } else if (game.id === 'category-match') {
      navigation.navigate('CategoryMatch' as never);
      setSelectedGame(null);
    } else {
      setShowDifficultySelector(true);
    }
  };

  const handleDifficultySelect = async (difficulty: Difficulty) => {
    await updateSettings({ difficulty });
    setShowDifficultySelector(false);
    if (selectedGame?.id === 'memory-snap') {
      navigation.navigate('Game' as never);
    }
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
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.content}>
        <Text style={styles.title}>Gentle Games</Text>
        <Text style={styles.subtitle}>Calm games for kids</Text>

        <View style={styles.gamesContainer}>
          <Text style={styles.sectionTitle}>Choose a Game</Text>

          <ScrollView style={styles.gamesScroll} contentContainerStyle={styles.gamesScrollContent}>
            {visibleGames.map((game) => (
              <TouchableOpacity
                key={game.id}
                style={styles.gameCard}
                onPress={() => handleGameSelect(game)}
              >
                <Text style={styles.gameIcon}>{game.icon}</Text>
                <View style={styles.gameInfo}>
                  <Text style={styles.gameName}>{game.name}</Text>
                  <Text style={styles.gameDescription}>{game.description}</Text>
                </View>
              </TouchableOpacity>
            ))}
            {visibleGames.length === 0 ? (
              <Text style={styles.emptyGamesText}>All games are hidden. Enable one in Settings.</Text>
            ) : null}
          </ScrollView>
        </View>

        <TouchableOpacity
          style={styles.settingsButton}
          onPress={() => navigation.navigate('Settings' as never)}
        >
          <Text style={styles.settingsButtonText}>Settings</Text>
        </TouchableOpacity>
      </View>

      <Modal
        animationType="slide"
        transparent={true}
        visible={showDifficultySelector}
        onRequestClose={handleCloseModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{selectedGame?.name}</Text>
            <Text style={styles.modalSubtitle}>
              Select difficulty
              {settings.difficulty && ` (last played: ${getDifficultyLabel(settings.difficulty)})`}
            </Text>
            
            <View style={styles.optionsList}>
              {DIFFICULTY_OPTIONS.map(({ value, label, description }) => (
                <TouchableOpacity
                  key={value}
                  style={[
                    styles.optionButton,
                    settings.difficulty === value ? styles.optionButtonActive : undefined,
                  ]}
                  onPress={() => handleDifficultySelect(value)}
                >
                  <View style={styles.optionContent}>
                    <View style={styles.optionHeader}>
                      <Text
                        style={[
                          styles.optionLabel,
                          settings.difficulty === value ? styles.optionTextActive : undefined,
                        ]}
                      >
                        {label}
                      </Text>
                      {settings.difficulty === value && (
                        <Text style={styles.lastPlayedBadge}>Last Played</Text>
                      )}
                    </View>
                    <Text
                      style={[
                        styles.optionDescription,
                          settings.difficulty === value ? styles.optionTextActive : undefined,
                      ]}
                    >
                      {description}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={styles.closeButton}
              onPress={handleCloseModal}
            >
              <Text style={styles.closeButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const createStyles = (colors: ThemeColors, resolvedMode: ResolvedThemeMode) =>
  StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    padding: 32,
    paddingTop: 24,
  },
  title: {
    fontSize: 42,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: colors.textLight,
    marginBottom: 48,
    textAlign: 'center',
  },
  gamesContainer: {
    width: '100%',
    flex: 1,
    marginBottom: 32,
  },
  gamesScroll: {
    flex: 1,
  },
  gamesScrollContent: {
    paddingBottom: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 16,
    textAlign: 'center',
  },
  gameCard: {
    backgroundColor: colors.cardFront,
    borderRadius: 16,
    padding: 24,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  gameIcon: {
    fontSize: 48,
    marginRight: 16,
  },
  gameInfo: {
    flex: 1,
  },
  gameName: {
    fontSize: 22,
    fontWeight: '600',
    color: resolvedMode === 'dark' ? colors.background : colors.text,
    marginBottom: 4,
  },
  gameDescription: {
    fontSize: 14,
    color: resolvedMode === 'dark' ? colors.cardBack : colors.textLight,
  },
  emptyGamesText: {
    marginTop: 8,
    fontSize: 15,
    textAlign: 'center',
    color: colors.textLight,
  },
  settingsButton: {
    backgroundColor: colors.secondary,
    paddingHorizontal: 48,
    paddingVertical: 18,
    borderRadius: 30,
    shadowColor: colors.secondary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  settingsButtonText: {
    fontSize: 22,
    fontWeight: '600',
    color: colors.cardFront,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: colors.background,
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    color: colors.textLight,
    textAlign: 'center',
    marginBottom: 20,
  },
  optionsList: {
    marginBottom: 16,
  },
  optionButton: {
    backgroundColor: colors.cardFront,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.cardBack,
    marginBottom: 12,
  },
  optionButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  optionContent: {
    flexDirection: 'column',
  },
  optionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  optionLabel: {
    fontSize: 20,
    color: resolvedMode === 'dark' ? colors.background : colors.text,
    fontWeight: '600',
  },
  optionDescription: {
    fontSize: 14,
    color: resolvedMode === 'dark' ? colors.cardBack : colors.textLight,
  },
  optionTextActive: {
    color: colors.cardFront,
  },
  lastPlayedBadge: {
    fontSize: 12,
    color: colors.cardFront,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  closeButton: {
    backgroundColor: colors.cardBack,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 25,
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
});
