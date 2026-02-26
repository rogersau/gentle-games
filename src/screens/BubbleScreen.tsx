import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BubbleField } from '../components/BubbleField';
import { PASTEL_COLORS } from '../types';

export const BubbleScreen: React.FC = () => {
  const navigation = useNavigation();
  const [poppedCount, setPoppedCount] = useState(0);
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();

  const boardSize = useMemo(() => {
    const width = Math.max(260, screenWidth - 24);
    const height = Math.max(320, Math.min(screenHeight * 0.72, screenHeight - 220));
    return { width, height };
  }, [screenHeight, screenWidth]);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Bubble Pop</Text>
        <View style={styles.backPlaceholder} />
      </View>

      <View style={styles.content}>
        <Text style={styles.subtitle}>Tap the falling bubbles to pop them.</Text>
        <Text style={styles.counter}>Popped: {poppedCount}</Text>

        <View style={styles.boardWrap}>
          <BubbleField
            width={boardSize.width}
            height={boardSize.height}
            minActiveBubbles={2}
            maxActiveBubbles={12}
            onBubblePop={() => setPoppedCount((count) => count + 1)}
          />
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: PASTEL_COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: PASTEL_COLORS.cardBack,
  },
  backButton: {
    width: 40,
    padding: 8,
  },
  backButtonText: {
    fontSize: 24,
    color: PASTEL_COLORS.text,
  },
  backPlaceholder: {
    width: 40,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: PASTEL_COLORS.text,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingTop: 16,
    paddingBottom: 12,
  },
  subtitle: {
    fontSize: 14,
    color: PASTEL_COLORS.textLight,
    textAlign: 'center',
    marginBottom: 8,
  },
  counter: {
    fontSize: 18,
    color: PASTEL_COLORS.text,
    fontWeight: '600',
    marginBottom: 14,
  },
  boardWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

