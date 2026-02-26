import React, { useMemo, useRef, useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  useWindowDimensions,
  Modal,
  Alert,
  BackHandler,
} from 'react-native';
import { useNavigation, useFocusEffect, useRoute } from '@react-navigation/native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DrawingCanvas, DrawingCanvasRef, HistoryEntry } from '../components/DrawingCanvas';

const DRAWING_STORAGE_KEY = '@gentle_match_saved_drawing';

export const DrawingScreen: React.FC = () => {
  const navigation = useNavigation();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const canvasRef = useRef<DrawingCanvasRef>(null);
  
  const [savedHistory, setSavedHistory] = useState<HistoryEntry[]>([]);
  const [showContinueModal, setShowContinueModal] = useState(false);
  const [hasCheckedSaved, setHasCheckedSaved] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const canvasDimensions = useMemo(() => {
    const headerHeight = 60;
    const toolbarHeight = 140;
    const padding = 32;
    
    const availableWidth = screenWidth - padding;
    const availableHeight = screenHeight - insets.top - insets.bottom - headerHeight - toolbarHeight - padding;

    return {
      width: availableWidth,
      height: Math.max(260, availableHeight),
    };
  }, [screenWidth, screenHeight, insets.top, insets.bottom]);

  // Check for saved drawing on mount
  useEffect(() => {
    const checkSavedDrawing = async () => {
      try {
        const saved = await AsyncStorage.getItem(DRAWING_STORAGE_KEY);
        console.log('Loaded saved drawing:', saved ? 'found' : 'not found');
        if (saved) {
          const parsed = JSON.parse(saved);
          console.log('Parsed drawing entries:', parsed.length);
          if (parsed && Array.isArray(parsed) && parsed.length > 0) {
            setSavedHistory(parsed);
            setShowContinueModal(true);
          }
        }
      } catch (error) {
        console.warn('Error loading saved drawing:', error);
        // Clear corrupted drawing data
        await AsyncStorage.removeItem(DRAWING_STORAGE_KEY);
      } finally {
        setHasCheckedSaved(true);
        setIsLoading(false);
      }
    };

    checkSavedDrawing();
  }, []);

  // Save drawing function
  const saveDrawing = useCallback(async () => {
    try {
      const history = canvasRef.current?.getHistory();
      console.log('Saving drawing, entries:', history?.length || 0);
      if (history && history.length > 0) {
        await AsyncStorage.setItem(DRAWING_STORAGE_KEY, JSON.stringify(history));
        console.log('Save successful');
      } else {
        await AsyncStorage.removeItem(DRAWING_STORAGE_KEY);
        console.log('Removed empty drawing');
      }
    } catch (error) {
      console.warn('Error saving drawing:', error);
    }
  }, []);

  // Handle back button - let beforeRemove listener handle the save
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      // Return false to let the beforeRemove listener handle it
      return false;
    });

    return () => backHandler.remove();
  }, []);

  // Intercept navigation and save before leaving
  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', async (e) => {
      // Prevent default navigation
      e.preventDefault();
      
      // Save the drawing
      console.log('Navigation intercepted, saving...');
      await saveDrawing();
      
      // Now navigate
      console.log('Save complete, navigating...');
      navigation.dispatch(e.data.action);
    });

    return unsubscribe;
  }, [navigation, saveDrawing]);

  const handleContinue = () => {
    setShowContinueModal(false);
  };

  const handleNewDrawing = async () => {
    try {
      await AsyncStorage.removeItem(DRAWING_STORAGE_KEY);
      setSavedHistory([]);
      canvasRef.current?.clear();
    } catch (error) {
      console.warn('Error clearing saved drawing:', error);
    }
    setShowContinueModal(false);
  };

  // Auto-save whenever drawing changes
  const handleHistoryChange = useCallback(async (history: HistoryEntry[]) => {
    try {
      console.log('Auto-saving drawing, entries:', history.length);
      if (history.length > 0) {
        await AsyncStorage.setItem(DRAWING_STORAGE_KEY, JSON.stringify(history));
        console.log('Auto-save successful');
      } else {
        await AsyncStorage.removeItem(DRAWING_STORAGE_KEY);
        console.log('Removed saved drawing (empty)');
      }
    } catch (error) {
      console.warn('Error auto-saving drawing:', error);
    }
  }, []);

  const handleBackPress = async () => {
    await saveDrawing();
    navigation.goBack();
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={handleBackPress}
          style={styles.backButton}
        >
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Drawing Pad</Text>
        <View style={styles.placeholder} />
      </View>
      
      <View style={styles.content}>
        {hasCheckedSaved && (
          <DrawingCanvas 
            key={`canvas-${savedHistory.length}`}
            ref={canvasRef}
            width={canvasDimensions.width}
            height={canvasDimensions.height}
            bottomInset={insets.bottom}
            initialHistory={savedHistory}
            onHistoryChange={handleHistoryChange}
          />
        )}
      </View>

      {/* Continue/New Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={showContinueModal}
        onRequestClose={handleContinue}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          onPress={handleContinue}
          activeOpacity={1}
        >
          <TouchableOpacity 
            style={styles.modalContent} 
            onPress={(e) => e.stopPropagation()}
            activeOpacity={1}
          >
            <Text style={styles.modalTitle}>Welcome Back! 🎨</Text>
            <Text style={styles.modalText}>
              You have a saved drawing. Would you like to continue where you left off?
            </Text>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.newButton}
                onPress={handleNewDrawing}
              >
                <Text style={styles.newButtonText}>New Drawing</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.continueButton}
                onPress={handleContinue}
              >
                <Text style={styles.continueButtonText}>Continue</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFEF7',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 18,
    color: '#5A5A5A',
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
    padding: 32,
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
    color: '#5A5A5A',
    textAlign: 'center',
    marginBottom: 16,
  },
  modalText: {
    fontSize: 16,
    color: '#5A5A5A',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'center',
  },
  newButton: {
    backgroundColor: '#E8E4E1',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 25,
    flex: 1,
  },
  newButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#5A5A5A',
    textAlign: 'center',
  },
  continueButton: {
    backgroundColor: '#A8D8EA',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 25,
    flex: 1,
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
  },
});
