import React, { useMemo, useRef, useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, useWindowDimensions, BackHandler } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DrawingCanvas, DrawingCanvasRef, HistoryEntry } from '../components/DrawingCanvas';
import { ThemeColors } from '../types';
import { useThemeColors } from '../utils/theme';
import { AppScreen, AppHeader, AppButton, AppModal } from '../ui/components';
import { Space, TypeStyle } from '../ui/tokens';
import {
  DEFAULT_DRAWING_SAVE_DEBOUNCE_MS,
  useDebouncedDrawingSave,
} from './useDebouncedDrawingSave';

const DRAWING_STORAGE_KEY = '@gentle_match_saved_drawing';
export const DRAWING_HEADER_HEIGHT = 60;
export const DRAWING_TOOLBAR_HEIGHT = 140;
export const DRAWING_LAYOUT_PADDING = 32;
export const DRAWING_SAVE_DEBOUNCE_MS = DEFAULT_DRAWING_SAVE_DEBOUNCE_MS;

export const DrawingScreen: React.FC = () => {
  const navigation = useNavigation();
  const { colors } = useThemeColors();
  const { t } = useTranslation();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const canvasRef = useRef<DrawingCanvasRef>(null);
  const allowNextBeforeRemoveRef = useRef(false);

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

  const handleSaveError = useCallback((error: unknown) => {
    console.warn('Error saving drawing:', error);
  }, []);

  const { scheduleSave, flushPendingSave } = useDebouncedDrawingSave({
    storageKey: DRAWING_STORAGE_KEY,
    debounceMs: DRAWING_SAVE_DEBOUNCE_MS,
    onError: handleSaveError,
  });

  const flushLatestHistory = useCallback(async () => {
    const latestHistory = canvasRef.current?.getHistory() ?? [];
    scheduleSave(latestHistory);
    await flushPendingSave();
  }, [flushPendingSave, scheduleSave]);

  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => false);
    return () => backHandler.remove();
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', async (e) => {
      if (allowNextBeforeRemoveRef.current) {
        allowNextBeforeRemoveRef.current = false;
        return;
      }

      e.preventDefault();
      await flushLatestHistory();
      allowNextBeforeRemoveRef.current = true;
      navigation.dispatch(e.data.action);
    });
    return unsubscribe;
  }, [flushLatestHistory, navigation]);

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

  const handleHistoryChange = useCallback(
    (history: HistoryEntry[]) => {
      scheduleSave(history);
    },
    [scheduleSave],
  );

  const handleBackPress = async () => {
    await flushLatestHistory();
    navigation.goBack();
  };

  if (isLoading) {
    return (
      <AppScreen>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>{t('common.loading')}</Text>
        </View>
      </AppScreen>
    );
  }

  return (
    <AppScreen>
      <AppHeader title={t('games.drawing.title')} onBack={handleBackPress} />

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
        title={t('games.drawing.welcomeBack')}
        showClose={false}
      >
        <Text style={styles.modalText}>{t('games.drawing.continuePrompt')}</Text>
        <View style={styles.modalButtons}>
          <AppButton
            label={t('games.drawing.newDrawing')}
            variant='ghost'
            onPress={handleNewDrawing}
            style={{ flex: 1 }}
            accessibilityHint={t('games.drawing.newDrawingHint')}
          />
          <AppButton
            label={t('games.drawing.continueDrawing')}
            variant='primary'
            onPress={handleContinue}
            style={{ flex: 1 }}
            accessibilityHint={t('games.drawing.continueHint')}
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
