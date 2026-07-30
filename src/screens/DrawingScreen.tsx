import React, { useMemo, useRef, useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  useWindowDimensions,
  BackHandler,
  TouchableOpacity,
} from 'react-native';
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
import { useMochi } from '../hooks/useMochi';
import { useSettings } from '../context/SettingsContext';
import { sanitizeDrawingHistory } from '../utils/drawingPersistence';
import {
  createDrawingGuidedConfig,
  type CopyContinueActivity,
  type DrawingMode,
  type GentleTrailPattern,
} from '../utils/drawingGuidedModes';
import { getGameSettings } from '../games/settings';

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
  const hasShownWelcomeMochiRef = useRef(false);
  const hasStartedSavedCheckRef = useRef(false);
  const latestFreeHistoryRef = useRef<HistoryEntry[]>([]);

  const { settings, updateGameSettings } = useSettings();
  const drawingSettings = getGameSettings(settings, 'drawing');
  const { showMochi } = useMochi();

  const [savedHistory, setSavedHistory] = useState<HistoryEntry[]>([]);
  const [showContinueModal, setShowContinueModal] = useState(false);
  const [hasCheckedSaved, setHasCheckedSaved] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showSaveNotice, setShowSaveNotice] = useState(false);
  const [drawingMode, setDrawingMode] = useState<DrawingMode>(drawingSettings.mode);
  const [trailPattern, setTrailPattern] = useState<GentleTrailPattern>(
    drawingSettings.trailPattern,
  );
  const [guidedTolerance, setGuidedTolerance] = useState(drawingSettings.tolerance);
  const [guidedWidePath, setGuidedWidePath] = useState(drawingSettings.pathWidth);
  const [copyActivity, setCopyActivity] = useState<CopyContinueActivity>(
    drawingSettings.copyActivity,
  );

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
            latestFreeHistoryRef.current = parsed;
            setShowContinueModal(true);
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
    const latestHistory =
      drawingMode === 'free-draw'
        ? (canvasRef.current?.getHistory() ?? [])
        : latestFreeHistoryRef.current;
    scheduleSave(latestHistory);
    await flushPendingSave();
  }, [drawingMode, flushPendingSave, scheduleSave]);

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
      latestFreeHistoryRef.current = [];
      canvasRef.current?.clear();
    } catch (error) {
      console.warn('Error clearing saved drawing:', error);
    }
    setShowContinueModal(false);
  };

  const handleHistoryChange = useCallback(
    (history: HistoryEntry[]) => {
      if (drawingMode !== 'free-draw') return;
      latestFreeHistoryRef.current = history;
      scheduleSave(history);
    },
    [drawingMode, scheduleSave],
  );

  const handleModeChange = (mode: DrawingMode) => {
    if (mode === 'free-draw') {
      setSavedHistory([...latestFreeHistoryRef.current]);
    }
    setDrawingMode(mode);
    void updateGameSettings('drawing', { mode });
  };

  const textOrFallback = (key: string, fallback: string) =>
    String(t(key as never, { defaultValue: fallback } as never));

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
        <View style={styles.modeSection} accessibilityRole='tablist'>
          <Text style={styles.modeHeading}>
            {textOrFallback('games.drawing.guided.chooseMode', 'Choose a calm drawing space')}
          </Text>
          <View style={styles.modeButtons}>
            {(
              [
                ['free-draw', textOrFallback('games.drawing.guided.modes.freeDraw', 'Free Draw')],
                [
                  'gentle-trails',
                  textOrFallback('games.drawing.guided.modes.gentleTrails', 'Gentle Trails'),
                ],
                [
                  'copy-and-continue',
                  textOrFallback('games.drawing.guided.modes.copyContinue', 'Copy and Continue'),
                ],
                [
                  'prompted-drawing',
                  textOrFallback('games.drawing.guided.modes.prompted', 'Prompted Drawing'),
                ],
              ] as Array<[DrawingMode, string]>
            ).map(([mode, label]) => (
              <TouchableOpacity
                key={mode}
                testID={`drawing-mode-${mode}`}
                style={[
                  styles.modeButton,
                  drawingMode === mode ? styles.modeButtonActive : undefined,
                ]}
                onPress={() => handleModeChange(mode)}
                accessibilityRole='button'
                accessibilityLabel={label}
                accessibilityState={{ selected: drawingMode === mode }}
              >
                <Text style={styles.modeButtonText}>{label}</Text>
              </TouchableOpacity>
            ))}
          </View>
          {drawingMode === 'gentle-trails' && (
            <View style={styles.patternButtons}>
              {(
                ['straight', 'wave', 'spiral', 'zigzag', 'shape', 'road'] as GentleTrailPattern[]
              ).map((pattern) => (
                <TouchableOpacity
                  key={pattern}
                  testID={`drawing-trail-${pattern}`}
                  style={[
                    styles.patternButton,
                    trailPattern === pattern ? styles.modeButtonActive : undefined,
                  ]}
                  onPress={() => {
                    setTrailPattern(pattern);
                    void updateGameSettings('drawing', { trailPattern: pattern });
                  }}
                  accessibilityRole='button'
                  accessibilityLabel={textOrFallback(
                    `games.drawing.guided.patterns.${pattern}`,
                    `${pattern} trail`,
                  )}
                  accessibilityState={{ selected: trailPattern === pattern }}
                >
                  <Text style={styles.patternButtonText}>
                    {textOrFallback(`games.drawing.guided.patterns.${pattern}`, pattern)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
          {drawingMode === 'copy-and-continue' && (
            <View style={styles.patternButtons}>
              {(['copy-line', 'complete-picture', 'continue-pattern'] as const).map((activity) => (
                <TouchableOpacity
                  key={activity}
                  testID={`drawing-copy-${activity}`}
                  style={[
                    styles.patternButton,
                    copyActivity === activity ? styles.modeButtonActive : undefined,
                  ]}
                  onPress={() => {
                    setCopyActivity(activity);
                    void updateGameSettings('drawing', { copyActivity: activity });
                  }}
                  accessibilityRole='button'
                  accessibilityLabel={t(`games.drawing.guided.copyActivities.${activity}` as never)}
                  accessibilityState={{ selected: copyActivity === activity }}
                >
                  <Text style={styles.patternButtonText}>
                    {t(`games.drawing.guided.copyActivities.${activity}` as never)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
          {drawingMode !== 'free-draw' && drawingMode !== 'prompted-drawing' && (
            <View style={styles.guidedSettings}>
              <Text style={styles.guidedSettingsLabel}>
                {textOrFallback('games.drawing.guided.pathWidth', 'Wide path')}
              </Text>
              {([48, 68, 88] as const).map((value) => (
                <TouchableOpacity
                  key={`wide-${value}`}
                  testID={`drawing-wide-path-${value}`}
                  style={[
                    styles.settingButton,
                    guidedWidePath === value ? styles.modeButtonActive : undefined,
                  ]}
                  onPress={() => {
                    setGuidedWidePath(value);
                    void updateGameSettings('drawing', { pathWidth: value });
                  }}
                  accessibilityRole='button'
                  accessibilityLabel={t('games.drawing.guided.pathWidthValue', { value })}
                  accessibilityState={{ selected: guidedWidePath === value }}
                >
                  <Text style={styles.settingButtonText}>{value}</Text>
                </TouchableOpacity>
              ))}
              <Text style={styles.guidedSettingsLabel}>
                {textOrFallback('games.drawing.guided.tolerance', 'Tolerance')}
              </Text>
              {([24, 40, 56] as const).map((value) => (
                <TouchableOpacity
                  key={`tolerance-${value}`}
                  testID={`drawing-tolerance-${value}`}
                  style={[
                    styles.settingButton,
                    guidedTolerance === value ? styles.modeButtonActive : undefined,
                  ]}
                  onPress={() => {
                    setGuidedTolerance(value);
                    void updateGameSettings('drawing', { tolerance: value });
                  }}
                  accessibilityRole='button'
                  accessibilityLabel={t('games.drawing.guided.toleranceValue', { value })}
                  accessibilityState={{ selected: guidedTolerance === value }}
                >
                  <Text style={styles.settingButtonText}>{value}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
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
            key={`canvas-${drawingMode}-${trailPattern}-${copyActivity}-${savedHistory.length}`}
            ref={canvasRef}
            width={canvasDimensions.width}
            height={canvasDimensions.height}
            canvasBackgroundColor={colors.surfaceGame}
            bottomInset={insets.bottom}
            initialHistory={drawingMode === 'free-draw' ? savedHistory : []}
            onHistoryChange={handleHistoryChange}
            mode={drawingMode}
            guidedConfig={createDrawingGuidedConfig(drawingMode, {
              pattern: trailPattern,
              copyActivity,
              tolerance: guidedTolerance,
              widePath: guidedWidePath,
            })}
            reducedMotion={settings.reducedMotionEnabled || !settings.animationsEnabled}
            initialStrokeWidth={drawingSettings.strokeWidth}
            initialSmoothing={drawingSettings.smoothing ? 0.7 : 0}
            onStrokeWidthChange={(strokeWidth) =>
              void updateGameSettings('drawing', { strokeWidth })
            }
            onSmoothingChange={(smoothing) => void updateGameSettings('drawing', { smoothing })}
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
    modeSection: {
      width: '100%',
      marginBottom: Space.sm,
    },
    modeHeading: {
      ...TypeStyle.body,
      color: colors.text,
      textAlign: 'center',
      marginBottom: Space.xs,
    },
    modeButtons: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'center',
      gap: Space.xs,
    },
    modeButton: {
      borderWidth: 1,
      borderColor: colors.cardBack,
      borderRadius: 18,
      paddingHorizontal: Space.sm,
      paddingVertical: 6,
      backgroundColor: colors.surfaceGame,
    },
    modeButtonActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    modeButtonText: {
      ...TypeStyle.caption,
      color: colors.text,
    },
    patternButtons: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'center',
      gap: Space.xs,
      marginTop: Space.xs,
    },
    patternButton: {
      borderWidth: 1,
      borderColor: colors.cardBack,
      borderRadius: 14,
      paddingHorizontal: Space.sm,
      paddingVertical: 4,
    },
    patternButtonText: {
      ...TypeStyle.caption,
      color: colors.text,
      textTransform: 'capitalize',
    },
    guidedSettings: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      alignItems: 'center',
      justifyContent: 'center',
      gap: Space.xs,
      marginTop: Space.xs,
    },
    guidedSettingsLabel: {
      ...TypeStyle.caption,
      color: colors.textLight,
      marginLeft: Space.xs,
    },
    settingButton: {
      minWidth: 32,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.cardBack,
      borderRadius: 14,
      paddingHorizontal: Space.xs,
      paddingVertical: 4,
    },
    settingButtonText: {
      ...TypeStyle.caption,
      color: colors.text,
    },
    modalText: {
      ...TypeStyle.body,
      color: colors.text,
      textAlign: 'center',
      marginBottom: Space.lg,
    },
    saveNotice: {
      ...TypeStyle.body,
      color: colors.textLight,
      textAlign: 'center',
      marginBottom: Space.sm,
    },
    modalButtons: {
      flexDirection: 'row',
      gap: Space.md,
    },
  });
