import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { TFunction } from 'i18next';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { BubbleField } from '../components/BubbleField';
import { ThemeColors } from '../types';
import { useSettings } from '../context/SettingsContext';
import { playBubblePopSound } from '../utils/sounds';
import { useReducedMotion, useThemeColors } from '../utils/theme';
import { AppButton, AppScreen, AppHeader, SegmentedControl, SettingToggle } from '../ui/components';
import { Space, TypeStyle, Radius } from '../ui/tokens';
import { calculateGameBoardSize, useMeasuredGameViewport } from '../ui/gameLayout';
import {
  Bubble,
  BubbleGuidedConcept,
  BubbleGuidedRound,
  BubbleSensoryConfig,
  bubbleDensityLimits,
  bubbleSpeedMultiplier,
  createGuidedRound,
  DEFAULT_BUBBLE_SENSORY_CONFIG,
  evaluateGuidedResponse,
  getBubbleColourName,
  resolveBubbleSensoryConfig,
} from '../utils/bubbleLogic';
import { getGameSettings } from '../games/settings';

const GUIDE_CONCEPTS: BubbleGuidedConcept[] = ['colour', 'size', 'count', 'direction'];

const translate = (
  t: TFunction,
  key: string,
  fallback: string,
  variables: Record<string, unknown> = {},
) => t(key, { ...variables, defaultValue: fallback });

export const BubbleScreen: React.FC = () => {
  const navigation = useNavigation();
  const [isFocused, setIsFocused] = useState(() => navigation.isFocused?.() ?? true);
  useEffect(() => {
    const focusSubscription = navigation.addListener?.('focus', () => setIsFocused(true));
    const blurSubscription = navigation.addListener?.('blur', () => setIsFocused(false));
    return () => {
      focusSubscription?.();
      blurSubscription?.();
    };
  }, [navigation]);

  const { settings, updateGameSettings } = useSettings();
  const { colors } = useThemeColors();
  const { t } = useTranslation();
  const reducedMotion = useReducedMotion();
  const { viewport, onLayout } = useMeasuredGameViewport();
  const persistedSettings = getGameSettings(settings, 'bubble-pop');
  const initialConfig = useMemo(
    () =>
      resolveBubbleSensoryConfig({
        ...DEFAULT_BUBBLE_SENSORY_CONFIG,
        motion: reducedMotion
          ? 'still'
          : persistedSettings.motion === 'moving'
            ? 'floating'
            : 'still',
        density: persistedSettings.density,
        speed: persistedSettings.speed,
        size: persistedSettings.size,
      }),
    [
      persistedSettings.density,
      persistedSettings.motion,
      persistedSettings.size,
      persistedSettings.speed,
      reducedMotion,
    ],
  );
  const [sensoryConfig, setSensoryConfig] = useState<BubbleSensoryConfig>(initialConfig);
  const [concept, setConcept] = useState<BubbleGuidedConcept | 'free'>('free');
  const [round, setRound] = useState<BubbleGuidedRound>();
  const availableBubblesRef = useRef<Bubble[]>([]);
  const [roundCount, setRoundCount] = useState(0);
  const [roundComplete, setRoundComplete] = useState(false);
  const [announcement, setAnnouncement] = useState('');
  const styles = useMemo(() => createStyles(colors), [colors]);

  const boardSize = useMemo(
    () =>
      calculateGameBoardSize(viewport, {
        horizontalPadding: Space.md * 2,
        verticalReserve: 300,
        compactMinHeight: 220,
        maxHeightRatio: 0.72,
      }),
    [viewport],
  );

  const updateConfig = <K extends keyof BubbleSensoryConfig>(
    key: K,
    value: BubbleSensoryConfig[K],
  ) => {
    setSensoryConfig((current) => ({ ...current, [key]: value }));
    void updateGameSettings('bubble-pop', {
      [key]: key === 'motion' ? (value === 'floating' ? 'moving' : 'still') : value,
    });
  };

  const selectConcept = (nextConcept: BubbleGuidedConcept | 'free') => {
    setConcept(nextConcept);
    setRoundCount(0);
    setRoundComplete(false);
    setRound(
      nextConcept === 'free'
        ? undefined
        : nextConcept === 'count'
          ? { concept: nextConcept, targetCount: 3, fieldWidth: boardSize.width }
          : createGuidedRound(nextConcept, availableBubblesRef.current, boardSize.width),
    );
    setAnnouncement(
      nextConcept === 'free'
        ? translate(t, 'games.bubblePop.freePlaySelected', 'Free play. Choose any bubble.')
        : translate(t, `games.bubblePop.guided.${nextConcept}.prompt`, guidedPrompt(nextConcept)),
    );
  };

  const handleBubblePop = useCallback(
    (bubble: Bubble): boolean => {
      if (!round) {
        if (persistedSettings.sound) void playBubblePopSound(settings);
        return true;
      }

      const response = evaluateGuidedResponse(round, bubble, roundCount);
      if (!response.accepted) {
        setAnnouncement(
          response.reason === 'locked'
            ? translate(
                t,
                'games.bubblePop.guided.count.locked',
                'That count is complete. Choose Next round or Exit.',
              )
            : translate(
                t,
                'games.bubblePop.guided.tryAgain',
                'That was okay. Try again when you are ready.',
              ),
        );
        return false;
      }

      setRoundCount(response.nextCount);
      setAnnouncement(
        response.completed
          ? round.concept === 'count'
            ? translate(
                t,
                'games.bubblePop.guided.count.complete',
                'You counted exactly {{count}} bubbles.',
                {
                  count: round.targetCount,
                },
              )
            : translate(t, 'games.bubblePop.guided.correct', 'Yes. Try a new example when ready.')
          : translate(t, 'games.bubblePop.guided.correct', 'Yes. Keep going when you are ready.'),
      );
      if (response.completed) setRoundComplete(true);
      if (persistedSettings.sound) void playBubblePopSound(settings);
      return true;
    },
    [persistedSettings.sound, round, roundCount, settings, t],
  );

  const nextRound = () => {
    setRoundCount(0);
    setRoundComplete(false);
    if (concept !== 'free') {
      setRound(
        concept === 'count'
          ? { concept, targetCount: 3, fieldWidth: boardSize.width }
          : createGuidedRound(concept, availableBubblesRef.current, boardSize.width),
      );
    }
    setAnnouncement(
      translate(t, 'games.bubblePop.guided.next', 'A new round is ready. Take your time.'),
    );
  };

  const densityLimits = bubbleDensityLimits[sensoryConfig.density];
  const modeOptions = [
    { value: 'free' as const, label: translate(t, 'games.bubblePop.freePlay', 'Free play') },
    ...GUIDE_CONCEPTS.map((value) => ({
      value,
      label: translate(t, `games.bubblePop.guided.${value}.label`, guidedLabel(value)),
    })),
  ];
  const prompt = round ? guidedPrompt(concept as BubbleGuidedConcept, round) : '';

  return (
    <AppScreen scroll onLayout={onLayout} testID='bubble-screen'>
      <AppHeader title={t('games.bubblePop.title')} onBack={() => navigation.goBack()} />
      <View style={styles.content}>
        <Text style={styles.subtitle} accessibilityRole='text'>
          {t('games.bubblePop.subtitle')}
        </Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {translate(t, 'games.bubblePop.sensory.title', 'Sensory profile')}
          </Text>
          <Text style={styles.sectionDescription}>
            {translate(
              t,
              'games.bubblePop.sensory.description',
              'Choose a calm way to play. You can change it at any time.',
            )}
          </Text>
          <Text style={styles.controlLabel}>
            {translate(t, 'games.bubblePop.sensory.motion', 'Motion')}
          </Text>
          <SegmentedControl
            options={[
              {
                value: 'still' as const,
                label: translate(t, 'games.bubblePop.sensory.still', 'Still'),
              },
              {
                value: 'floating' as const,
                label: translate(t, 'games.bubblePop.sensory.floating', 'Floating'),
              },
            ]}
            value={sensoryConfig.motion}
            onValueChange={(value) => updateConfig('motion', value)}
          />
          {reducedMotion ? (
            <Text style={styles.recommendation}>
              {translate(
                t,
                'games.bubblePop.sensory.reducedMotion',
                'Still is recommended for reduced motion. Floating is still available if you choose it.',
              )}
            </Text>
          ) : null}
          <Text style={styles.controlLabel}>
            {translate(t, 'games.bubblePop.sensory.speed', 'Speed')}
          </Text>
          <SegmentedControl
            options={(['slow', 'medium', 'fast'] as const).map((value) => ({
              value,
              label: translate(t, `games.bubblePop.sensory.${value}`, value),
            }))}
            value={sensoryConfig.speed}
            onValueChange={(value) => updateConfig('speed', value)}
          />
          <Text style={styles.controlLabel}>
            {translate(t, 'games.bubblePop.sensory.density', 'Bubbles')}
          </Text>
          <SegmentedControl
            options={(['sparse', 'medium', 'full'] as const).map((value) => ({
              value,
              label: translate(t, `games.bubblePop.sensory.${value}`, value),
            }))}
            value={sensoryConfig.density}
            onValueChange={(value) => updateConfig('density', value)}
          />
          <Text style={styles.controlLabel}>
            {translate(t, 'games.bubblePop.sensory.size', 'Bubble size')}
          </Text>
          <SegmentedControl
            options={(['small', 'medium', 'large'] as const).map((value) => ({
              value,
              label: translate(t, `games.bubblePop.sensory.${value}`, value),
            }))}
            value={sensoryConfig.size}
            onValueChange={(value) => updateConfig('size', value)}
          />
          <SettingToggle
            label={translate(t, 'games.bubblePop.sensory.sound', 'Bubble sounds')}
            description={translate(
              t,
              'games.bubblePop.sensory.soundDescription',
              'Play a gentle sound when a bubble is popped.',
            )}
            value={persistedSettings.sound}
            onValueChange={(sound) => void updateGameSettings('bubble-pop', { sound })}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {translate(t, 'games.bubblePop.freePlayTitle', 'Free play')}
          </Text>
          <Text style={styles.sectionDescription}>
            {translate(
              t,
              'games.bubblePop.freePlayDescription',
              'Pop any bubble. There is no score, timer, or finish line.',
            )}
          </Text>
          <View style={styles.modeRow}>
            <SegmentedControl
              options={modeOptions}
              value={concept}
              onValueChange={selectConcept}
              wrap
            />
          </View>
        </View>

        {round ? (
          <View style={styles.promptCard} accessibilityRole='text'>
            <Text style={styles.promptTitle}>
              {translate(t, 'games.bubblePop.guided.title', 'Try this')}
            </Text>
            <Text style={styles.prompt}>{prompt}</Text>
            <View
              testID='bubble-guided-visual'
              style={[
                styles.promptVisual,
                concept === 'colour' && { backgroundColor: round.targetColour ?? colors.primary },
              ]}
              accessibilityLabel={prompt}
            >
              {concept === 'direction' ? (
                <Text style={styles.visualSymbol}>
                  {round.targetDirection === 'left' ? '←' : '→'}
                </Text>
              ) : concept === 'count' ? (
                <Text style={styles.visualSymbol}>
                  {'• '.repeat(round.targetCount ?? 3).trim()}
                </Text>
              ) : concept === 'size' ? (
                <Text
                  style={[
                    styles.visualBubble,
                    {
                      fontSize:
                        round.targetSize === 'large' ? 42 : round.targetSize === 'small' ? 22 : 32,
                    },
                  ]}
                >
                  ●
                </Text>
              ) : (
                <Text style={styles.visualSymbol}>●</Text>
              )}
            </View>
            {concept === 'count' ? (
              <Text style={styles.progress}>
                {translate(
                  t,
                  'games.bubblePop.guided.count.progress',
                  '{{current}} of {{target}}',
                  {
                    current: roundCount,
                    target: round.targetCount,
                  },
                )}
              </Text>
            ) : null}
          </View>
        ) : null}

        <View style={styles.boardWrap}>
          <BubbleField
            width={boardSize.width}
            height={boardSize.height}
            minActiveBubbles={densityLimits.min}
            maxActiveBubbles={densityLimits.max}
            onBubblePop={handleBubblePop}
            onBubblesChange={(bubbles) => {
              availableBubblesRef.current = bubbles;
            }}
            motionEnabled={sensoryConfig.motion === 'floating'}
            speedMultiplier={bubbleSpeedMultiplier[sensoryConfig.speed]}
            bubbleSize={sensoryConfig.size}
            isFocused={isFocused}
          />
        </View>

        <Text
          testID='bubble-guidance-announcement'
          style={styles.announcement}
          accessibilityRole='text'
          accessibilityLiveRegion='polite'
          accessibilityLabel={announcement}
        >
          {announcement}
        </Text>

        {roundComplete ? (
          <View style={styles.completionActions}>
            <AppButton
              label={translate(t, 'games.bubblePop.guided.nextRound', 'Next round')}
              onPress={nextRound}
              testID='bubble-next-round'
            />
            <AppButton
              label={translate(t, 'games.bubblePop.guided.exit', 'Exit guided play')}
              onPress={() => selectConcept('free')}
              variant='ghost'
              testID='bubble-exit-guided'
            />
          </View>
        ) : null}
      </View>
    </AppScreen>
  );
};

const guidedLabel = (concept: BubbleGuidedConcept): string =>
  ({
    colour: 'Colour',
    size: 'Biggest or smallest',
    count: 'Exact count',
    direction: 'Left or right',
  })[concept];

const guidedPrompt = (concept: BubbleGuidedConcept, round?: BubbleGuidedRound): string => {
  if (concept === 'colour')
    return `Pop the ${getBubbleColourName(round?.targetColour ?? '')} bubbles.`;
  if (concept === 'size') {
    return `Pop the ${round?.targetSizeGoal ?? (round?.targetSize === 'large' ? 'biggest' : 'smallest')} bubbles.`;
  }
  if (concept === 'count') return `Pop exactly ${round?.targetCount ?? 3} bubbles, then stop.`;
  return `Pop the bubbles on the ${round?.targetDirection ?? 'chosen'} side.`;
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    content: {
      flex: 1,
      alignItems: 'center',
      paddingHorizontal: Space.md,
      paddingTop: Space.base,
      paddingBottom: Space.md,
    },
    subtitle: {
      ...TypeStyle.bodySm,
      color: colors.textLight,
      textAlign: 'center',
      marginBottom: Space.md,
    },
    section: { width: '100%', marginBottom: Space.md },
    sectionTitle: { ...TypeStyle.h3, color: colors.text, marginBottom: Space.xs },
    sectionDescription: { ...TypeStyle.bodySm, color: colors.textLight, marginBottom: Space.sm },
    controlLabel: {
      ...TypeStyle.label,
      color: colors.text,
      marginTop: Space.sm,
      marginBottom: Space.xs,
    },
    recommendation: { ...TypeStyle.bodySm, color: colors.textLight, marginTop: Space.xs },
    modeRow: { width: '100%' },
    promptCard: {
      width: '100%',
      padding: Space.md,
      borderRadius: Radius.md,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: Space.md,
    },
    promptTitle: { ...TypeStyle.label, color: colors.textLight, marginBottom: Space.xs },
    prompt: { ...TypeStyle.body, color: colors.text, textAlign: 'center' },
    promptVisual: {
      width: 72,
      height: 52,
      marginTop: Space.sm,
      alignSelf: 'center',
      borderRadius: Radius.md,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    visualSymbol: { ...TypeStyle.h3, color: colors.text },
    visualBubble: { color: colors.text },
    progress: {
      ...TypeStyle.label,
      color: colors.textLight,
      textAlign: 'center',
      marginTop: Space.xs,
    },
    boardWrap: { alignItems: 'center', justifyContent: 'center' },
    announcement: {
      ...TypeStyle.bodySm,
      color: colors.textLight,
      textAlign: 'center',
      minHeight: 20,
      marginTop: Space.sm,
    },
    completionActions: { gap: Space.sm, alignItems: 'center', marginTop: Space.md },
  });
