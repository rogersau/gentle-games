import React, { useMemo, useRef, useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  useWindowDimensions,
  Modal,
  BackHandler,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DrawingCanvas, DrawingCanvasRef, HistoryEntry } from '../components/DrawingCanvas';
import { ThemeColors } from '../types';
import { ResolvedThemeMode, useThemeColors } from '../utils/theme';

const DRAWING_STORAGE_KEY = '@gentle_match_saved_drawing';
export const DRAWING_HEADER_HEIGHT = 60;
export const DRAWING_TOOLBAR_HEIGHT = 140;
export const DRAWING_LAYOUT_PADDING = 32;

export const DrawingScreen: React.FC = () => {
  const navigation = useNavigation();
  const { colors, resolvedMode } = useThemeColors();
  const styles = useMemo(() => createStyles(colors, resolvedMode), [colors, resolvedMode]);
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const canvasRef = useRef<DrawingCanvasRef>(null);
  
  const [savedHistory, setSavedHistory] = useState<HistoryEntry[]>([]);
  const [showContinueModal, setShowContinueModal] = useState(false);
  const [hasCheckedSaved, setHasCheckedSaved] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const canvasDimensions = useMemo(() => {
    const availableWidth = screenWidth - DRAWING_LAYOUT_PADDING;
    const availableHeight =
      screenHeight -
      insets.top -
      insets.bottom -
      DRAWING_HEADER_HEIGHT -
      DRAWING_TOOLBAR_HEIGHT -
      DRAWING_LAYOUT_PADDING;

    return {
      width: availableWidth,
      height: Math.max(0, availableHeight),
    };
  }, [screenWidth, screenHeight, insets.top, insets.bottom]);

  // Check for saved drawing on mount
  useEffect(() => {
    const checkSavedDrawing = async () => {
      try {
        const saved = await AsyncStorage.getItem(DRAWING_STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
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
      if (history && history.length > 0) {
        await AsyncStorage.setItem(DRAWING_STORAGE_KEY, JSON.stringify(history));
      } else {
        await AsyncStorage.removeItem(DRAWING_STORAGE_KEY);
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
      await saveDrawing();
      
      // Now navigate
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
      if (history.length > 0) {
        await AsyncStorage.setItem(DRAWING_STORAGE_KEY, JSON.stringify(history));
      } else {
        await AsyncStorage.removeItem(DRAWING_STORAGE_KEY);
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
          <Text style={styles.backButtonText}>← Back</Text>
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
            canvasBackgroundColor={colors.surfaceGame}
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

const createStyles = (colors: ThemeColors, resolvedMode: ResolvedThemeMode) =>
  StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 18,
    color: colors.text,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.cardBack,
    height: DRAWING_HEADER_HEIGHT,
  },
  backButton: {
    minWidth: 92,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: colors.cardBack,
    backgroundColor: colors.cardFront,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: resolvedMode === 'dark' ? colors.background : colors.text,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
  },
  placeholder: {
    width: 92,
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
    backgroundColor: colors.background,
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
    color: colors.text,
    textAlign: 'center',
    marginBottom: 16,
  },
  modalText: {
    fontSize: 16,
    color: colors.text,
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
    backgroundColor: colors.cardBack,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 25,
    flex: 1,
  },
  newButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
  },
  continueButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 25,
    flex: 1,
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.cardFront,
    textAlign: 'center',
  },
});
