import React, { useMemo, useRef, useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  useWindowDimensions,
  BackHandler,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DrawingCanvas, DrawingCanvasRef, HistoryEntry } from '../components/DrawingCanvas';
import { ThemeColors } from '../types';
import { useThemeColors } from '../utils/theme';
import { AppScreen, AppHeader, AppButton, AppModal } from '../ui/components';
import { Space, TypeStyle } from '../ui/tokens';

const DRAWING_STORAGE_KEY = '@gentle_match_saved_drawing';
export const DRAWING_HEADER_HEIGHT = 60;
export const DRAWING_TOOLBAR_HEIGHT = 140;
export const DRAWING_LAYOUT_PADDING = 32;

export const DrawingScreen: React.FC = () => {
  const navigation = useNavigation();
  const { colors } = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
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
        await AsyncStorage.removeItem(DRAWING_STORAGE_KEY);
      } finally {
        setHasCheckedSaved(true);
        setIsLoading(false);
      }
    };

    checkSavedDrawing();
  }, []);

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

  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => false);
    return () => backHandler.remove();
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', async (e) => {
      e.preventDefault();
      await saveDrawing();
      navigation.dispatch(e.data.action);
    });
    return unsubscribe;
  }, [navigation, saveDrawing]);

  const handleContinue = () => setShowContinueModal(false);

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
      <AppScreen>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </AppScreen>
    );
  }

  return (
    <AppScreen>
      <AppHeader
        title="Drawing Pad"
        onBack={handleBackPress}
      />
      
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

      <AppModal
        visible={showContinueModal}
        onClose={handleContinue}
        title="Welcome Back! 🎨"
        showClose={false}
      >
        <Text style={styles.modalText}>
          You have a saved drawing. Would you like to continue where you left off?
        </Text>
        <View style={styles.modalButtons}>
          <AppButton
            label="New Drawing"
            variant="ghost"
            onPress={handleNewDrawing}
            style={{ flex: 1 }}
            accessibilityHint="Start a blank canvas"
          />
          <AppButton
            label="Continue"
            variant="primary"
            onPress={handleContinue}
            style={{ flex: 1 }}
            accessibilityHint="Resume your saved drawing"
          />
        </View>
      </AppModal>
    </AppScreen>
  );
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    ...TypeStyle.body,
    color: colors.text,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingHorizontal: Space.base,
    paddingTop: Space.base,
  },
  modalText: {
    ...TypeStyle.body,
    color: colors.text,
    textAlign: 'center',
    marginBottom: Space.lg,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: Space.md,
  },
});
