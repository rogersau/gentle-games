import React, { useMemo, useRef, useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, useWindowDimensions, BackHandler } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DrawingCanvas, DrawingCanvasRef, HistoryEntry } from '../components/DrawingCanvas';
import { ThemeColors } from '../types';
import { useThemeColors } from '../utils/theme';
import { AppScreen, GameHeader } from '../ui/components';
import { Space, TypeStyle } from '../ui/tokens';
import {
  DEFAULT_DRAWING_SAVE_DEBOUNCE_MS,
  useDebouncedDrawingSave,
} from './useDebouncedDrawingSave';
import { useMochi } from '../hooks/useMochi';
import { useSettings } from '../context/SettingsContext';
import { sanitizeDrawingHistory } from '../utils/drawingPersistence';

const DRAWING_STORAGE_KEY = '@gentle_match_saved_drawing';
export const DRAWING_HEADER_HEIGHT = 68;
export const DRAWING_TOOLBAR_HEIGHT = 304;
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
  const hasShownWelcomeMochiRef = useRef(false);
  const hasStartedSavedCheckRef = useRef(false);

  const { settings } = useSettings();
  const { showMochi } = useMochi();

  const [savedHistory, setSavedHistory] = useState<HistoryEntry[]>([]);
  const [hasCheckedSaved, setHasCheckedSaved] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showSaveNotice, setShowSaveNotice] = useState(false);

  const canvasDimensions = useMemo(() => {
    const availableWidth = screenWidth - DRAWING_LAYOUT_PADDING;
    const availableHeight =
      screenHeight -
      insets.top -
      insets.bottom -
      DRAWING_HEADER_HEIGHT -
      DRAWING_TOOLBAR_HEIGHT -
      DRAWING_LAYOUT_PADDING;

    // The larger toolbar must not hide marks in drawings saved with a taller canvas.
    const savedContentHeight = savedHistory.reduce((bottom, entry) => {
      if (entry.kind === 'shape') return Math.max(bottom, entry.y + entry.size / 2 + Space.sm);
      return entry.points.reduce(
        (edge, point) => Math.max(edge, point.y + entry.width / 2 + Space.sm),
        bottom,
      );
    }, 0);

    return {
      width: availableWidth,
      height: Math.max(160, availableHeight, savedContentHeight),
    };
  }, [screenWidth, screenHeight, insets.top, insets.bottom, savedHistory]);

  useEffect(() => {
    if (hasStartedSavedCheckRef.current) {
      return;
    }

    hasStartedSavedCheckRef.current = true;

    const checkSavedDrawing = async () => {
      try {
        const saved = await AsyncStorage.getItem(DRAWING_STORAGE_KEY);
        if (saved) {
          const parsed = sanitizeDrawingHistory(JSON.parse(saved));
          if (parsed === null) {
            await AsyncStorage.removeItem(DRAWING_STORAGE_KEY);
          } else if (parsed.length > 0) {
            setSavedHistory(parsed);
            if (settings.showMochiInGames && !hasShownWelcomeMochiRef.current) {
              hasShownWelcomeMochiRef.current = true;
              const phrases = t('mascot.drawingWelcomePhrases', {
                returnObjects: true,
              }) as string[];
              const phrase = phrases[Math.floor(Math.random() * phrases.length)];
              showMochi(phrase, 'happy');
            }
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
  }, [settings.showMochiInGames, showMochi, t]);

  const handleSaveError = useCallback((error: unknown) => {
    console.warn('Error saving drawing:', error);
    setShowSaveNotice(true);
  }, []);

  const handleSaveSuccess = useCallback(() => {
    setShowSaveNotice(false);
  }, []);

  const { scheduleSave, flushPendingSave } = useDebouncedDrawingSave({
    storageKey: DRAWING_STORAGE_KEY,
    debounceMs: DRAWING_SAVE_DEBOUNCE_MS,
    onError: handleSaveError,
    onSuccess: handleSaveSuccess,
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
    <AppScreen
      scroll
      header={<GameHeader title={t('games.drawing.title')} onBack={handleBackPress} />}
    >
      <View style={styles.content}>
        {showSaveNotice && (
          <Text
            testID='drawing-save-notice'
            accessibilityRole='alert'
            accessibilityLiveRegion='polite'
            style={styles.saveNotice}
          >
            {t('games.drawing.saveError')}
          </Text>
        )}
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
    saveNotice: {
      ...TypeStyle.body,
      color: colors.textLight,
      textAlign: 'center',
      marginBottom: Space.sm,
    },
  });
