import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Switch,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSettings } from '../context/SettingsContext';

export const SettingsScreen: React.FC = () => {
  const navigation = useNavigation();
  const { settings, updateSettings } = useSettings();

  const themes: { value: 'animals' | 'shapes' | 'mixed'; label: string }[] = [
    { value: 'animals', label: 'Animals' },
    { value: 'shapes', label: 'Shapes' },
    { value: 'mixed', label: 'Mixed' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Settings</Text>

        {/* Theme */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Theme</Text>
          <View style={styles.optionsContainer}>
            {themes.map(({ value, label }) => (
              <TouchableOpacity
                key={value}
                style={[
                  styles.optionButton,
                  settings.theme === value && styles.optionButtonActive,
                ]}
                onPress={() => updateSettings({ theme: value })}
              >
                <Text
                  style={[
                    styles.optionText,
                    settings.theme === value && styles.optionTextActive,
                  ]}
                >
                  {label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Animations */}
        <View style={styles.section}>
          <View style={styles.toggleRow}>
            <Text style={styles.sectionTitle}>Animations</Text>
            <Switch
              value={settings.animationsEnabled}
              onValueChange={(value) => updateSettings({ animationsEnabled: value })}
              trackColor={{ false: '#D4D0CD', true: '#A8D8EA' }}
              thumbColor={settings.animationsEnabled ? '#FFFFFF' : '#FFFFFF'}
            />
          </View>
          <Text style={styles.description}>Enable card flip animations</Text>
        </View>

        {/* Sound */}
        <View style={styles.section}>
          <View style={styles.toggleRow}>
            <Text style={styles.sectionTitle}>Sound</Text>
            <Switch
              value={settings.soundEnabled}
              onValueChange={(value) => updateSettings({ soundEnabled: value })}
              trackColor={{ false: '#D4D0CD', true: '#A8D8EA' }}
              thumbColor={settings.soundEnabled ? '#FFFFFF' : '#FFFFFF'}
            />
          </View>
          <Text style={styles.description}>Enable gentle sound effects</Text>
        </View>

        {/* Back Button */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>Back to Home</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFEF7',
  },
  scrollContent: {
    padding: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#5A5A5A',
    marginBottom: 32,
    textAlign: 'center',
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#5A5A5A',
    marginBottom: 12,
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  optionButton: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#E8E4E1',
    marginRight: 8,
    marginBottom: 8,
  },
  optionButtonActive: {
    backgroundColor: '#A8D8EA',
    borderColor: '#A8D8EA',
  },
  optionText: {
    fontSize: 16,
    color: '#5A5A5A',
    fontWeight: '500',
  },
  optionTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  description: {
    fontSize: 14,
    color: '#8A8A8A',
    marginTop: 4,
  },
  backButton: {
    backgroundColor: '#FFB6C1',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 25,
    alignItems: 'center',
    marginTop: 16,
  },
  backButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
