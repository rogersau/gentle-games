import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Modal,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSettings } from '../context/SettingsContext';
import { PairCount } from '../types';

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
];

export const HomeScreen: React.FC = () => {
  const navigation = useNavigation();
  const { settings, updateSettings } = useSettings();
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [showPairSelector, setShowPairSelector] = useState(false);

  const pairOptions: { count: PairCount; label: string }[] = [
    { count: 6, label: '6 Pairs (Easy)' },
    { count: 8, label: '8 Pairs (Easy)' },
    { count: 10, label: '10 Pairs (Easy)' },
    { count: 12, label: '12 Pairs (Medium)' },
    { count: 15, label: '15 Pairs (Medium)' },
    { count: 18, label: '18 Pairs (Medium)' },
    { count: 20, label: '20 Pairs (Hard)' },
    { count: 24, label: '24 Pairs (Hard)' },
    { count: 30, label: '30 Pairs (Hard)' },
  ];

  const handleGameSelect = (game: Game) => {
    setSelectedGame(game);
    if (game.id === 'drawing') {
      navigation.navigate('Drawing' as never);
      setSelectedGame(null);
    } else {
      setShowPairSelector(true);
    }
  };

  const handlePairSelect = async (count: PairCount) => {
    await updateSettings({ pairCount: count });
    setShowPairSelector(false);
    if (selectedGame?.id === 'memory-snap') {
      navigation.navigate('Game' as never);
    }
    setSelectedGame(null);
  };

  const handleCloseModal = () => {
    setShowPairSelector(false);
    setSelectedGame(null);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Gentle Games</Text>
        <Text style={styles.subtitle}>Calm games for kids</Text>

        <View style={styles.gamesContainer}>
          <Text style={styles.sectionTitle}>Choose a Game</Text>
          
          {GAMES.map((game) => (
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
        visible={showPairSelector}
        onRequestClose={handleCloseModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{selectedGame?.name}</Text>
            <Text style={styles.modalSubtitle}>
              Select number of pairs
              {settings.pairCount && ` (last played: ${settings.pairCount})`}
            </Text>
            
            <ScrollView style={styles.optionsList}>
              {pairOptions.map(({ count, label }) => (
                <TouchableOpacity
                  key={count}
                  style={[
                    styles.optionButton,
                    settings.pairCount === count && styles.optionButtonActive,
                  ]}
                  onPress={() => handlePairSelect(count)}
                >
                  <Text
                    style={[
                      styles.optionText,
                      settings.pairCount === count && styles.optionTextActive,
                    ]}
                  >
                    {label}
                  </Text>
                  {settings.pairCount === count && (
                    <Text style={styles.lastPlayedBadge}>Last Played</Text>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>

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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFEF7',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  title: {
    fontSize: 42,
    fontWeight: '700',
    color: '#5A5A5A',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: '#8A8A8A',
    marginBottom: 48,
    textAlign: 'center',
  },
  gamesContainer: {
    width: '100%',
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#5A5A5A',
    marginBottom: 16,
    textAlign: 'center',
  },
  gameCard: {
    backgroundColor: '#FFFFFF',
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
    color: '#5A5A5A',
    marginBottom: 4,
  },
  gameDescription: {
    fontSize: 14,
    color: '#8A8A8A',
  },
  settingsButton: {
    backgroundColor: '#FFB6C1',
    paddingHorizontal: 48,
    paddingVertical: 18,
    borderRadius: 30,
    shadowColor: '#FFB6C1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  settingsButtonText: {
    fontSize: 22,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFFEF7',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#5A5A5A',
    textAlign: 'center',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#8A8A8A',
    textAlign: 'center',
    marginBottom: 20,
  },
  optionsList: {
    maxHeight: 300,
  },
  optionButton: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E8E4E1',
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  optionButtonActive: {
    backgroundColor: '#A8D8EA',
    borderColor: '#A8D8EA',
  },
  optionText: {
    fontSize: 18,
    color: '#5A5A5A',
    fontWeight: '500',
  },
  optionTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  lastPlayedBadge: {
    fontSize: 12,
    color: '#FFFFFF',
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  closeButton: {
    backgroundColor: '#E8E4E1',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 25,
    marginTop: 16,
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#5A5A5A',
  },
});
