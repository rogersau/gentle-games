import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Switch,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSettings } from '../context/SettingsContext';

export const SettingsScreen: React.FC = () => {
  const navigation = useNavigation();
  const { settings, updateSettings } = useSettings();

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Settings</Text>

        {/* Card Preview */}
        <View style={styles.section}>
          <View style={styles.toggleRow}>
            <Text style={styles.sectionTitle}>Show Card Preview</Text>
            <Switch
              value={!!settings.showCardPreview}
              onValueChange={(value) => updateSettings({ showCardPreview: value })}
              trackColor={{ false: '#D4D0CD', true: '#A8D8EA' }}
              thumbColor={settings.showCardPreview ? '#FFFFFF' : '#FFFFFF'}
            />
          </View>
          <Text style={styles.description}>Show all cards for 2 seconds before the game starts</Text>
        </View>

        {/* Animations */}
        <View style={styles.section}>
          <View style={styles.toggleRow}>
            <Text style={styles.sectionTitle}>Animations</Text>
            <Switch
              value={!!settings.animationsEnabled}
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
              value={!!settings.soundEnabled}
              onValueChange={(value) => updateSettings({ soundEnabled: value })}
              trackColor={{ false: '#D4D0CD', true: '#A8D8EA' }}
              thumbColor={settings.soundEnabled ? '#FFFFFF' : '#FFFFFF'}
            />
          </View>
          <Text style={styles.description}>Enable gentle sound effects</Text>
        </View>

        {/* Volume */}
        {settings.soundEnabled && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Volume</Text>
            <View style={styles.volumeRow}>
              <TouchableOpacity
                style={styles.volumeButton}
                onPress={() => updateSettings({ soundVolume: Math.max(0, Math.round((settings.soundVolume - 0.1) * 10) / 10) })}
                disabled={settings.soundVolume <= 0}
              >
                <Text style={styles.volumeButtonText}>−</Text>
              </TouchableOpacity>

              <View style={styles.volumeBarTrack}>
                {[0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0].map((step) => (
                  <TouchableOpacity
                    key={step}
                    style={[
                      styles.volumeSegment,
                      settings.soundVolume >= step ? styles.volumeSegmentFilled : undefined,
                    ]}
                    onPress={() => updateSettings({ soundVolume: step })}
                  />
                ))}
              </View>

              <TouchableOpacity
                style={styles.volumeButton}
                onPress={() => updateSettings({ soundVolume: Math.min(1, Math.round((settings.soundVolume + 0.1) * 10) / 10) })}
                disabled={settings.soundVolume >= 1}
              >
                <Text style={styles.volumeButtonText}>+</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.description}>{Math.round(settings.soundVolume * 100)}%</Text>
          </View>
        )}

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
  volumeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  volumeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E8E4E1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  volumeButtonText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#5A5A5A',
    lineHeight: 22,
  },
  volumeBarTrack: {
    flex: 1,
    flexDirection: 'row',
    gap: 3,
    alignItems: 'center',
  },
  volumeSegment: {
    flex: 1,
    height: 20,
    borderRadius: 4,
    backgroundColor: '#E8E4E1',
  },
  volumeSegmentFilled: {
    backgroundColor: '#A8D8EA',
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
