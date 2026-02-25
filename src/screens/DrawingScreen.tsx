import React, { useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  useWindowDimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { DrawingCanvas } from '../components/DrawingCanvas';

export const DrawingScreen: React.FC = () => {
  const navigation = useNavigation();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();

  const canvasDimensions = useMemo(() => {
    // Header height ~60px, bottom toolbar ~120px, padding ~32px
    const headerHeight = 60;
    const toolbarHeight = 140;
    const padding = 32;
    
    const availableWidth = screenWidth - padding;
    const availableHeight = screenHeight - headerHeight - toolbarHeight - padding;
    
    // Use the smaller dimension to keep it proportional
    const size = Math.min(availableWidth, availableHeight);
    
    return {
      width: availableWidth,
      height: availableHeight,
    };
  }, [screenWidth, screenHeight]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Drawing Pad</Text>
        <View style={styles.placeholder} />
      </View>
      
      <View style={styles.content}>
        <DrawingCanvas 
          width={canvasDimensions.width}
          height={canvasDimensions.height}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFEF7',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E8E4E1',
    height: 60,
  },
  backButton: {
    padding: 8,
    width: 40,
  },
  backButtonText: {
    fontSize: 24,
    color: '#5A5A5A',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#5A5A5A',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingHorizontal: 16,
    paddingTop: 16,
  },
});
