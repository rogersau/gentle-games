import React, { useEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  AppState,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useTranslation } from 'react-i18next';
import { generateMathQuestion, isMathAnswer } from '../../utils/grownUpsChallenge';
import { useThemeColors } from '../../utils/theme';
import { AppButton } from './AppButton';
import { AppModal } from './AppModal';
import { ControlIcon } from './ControlIcon';
import { Radius, Space, TypeStyle } from '../tokens';

const HOLD_MS = 3000;
const RING_LENGTH = 2 * Math.PI * 45;
const PILL_HIT_SLOP = { top: 8, bottom: 8, left: 8, right: 8 };

export const useGrownUpsGate = ({
  enabled,
  onOpen,
  active = true,
}: {
  enabled: boolean;
  onOpen: () => void;
  active?: boolean;
}) => {
  const { t } = useTranslation();
  const { colors, resolvedMode } = useThemeColors();
  const [screenReader, setScreenReader] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);
  const [challenge, setChallenge] = useState<ReturnType<typeof generateMathQuestion> | null>(null);
  const [answer, setAnswer] = useState('');
  const [error, setError] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const stopTimer = () => {
    if (timer.current !== null) clearInterval(timer.current);
    timer.current = null;
  };
  const cancelHold = () => {
    stopTimer();
    setProgress(null);
  };

  useEffect(() => {
    let mounted = true;
    let changed = false;
    // Browsers do not expose screen reader state. Their accessible activation is a
    // keyboard event or a click without a pointer, covered by the handlers below.
    if (Platform.OS !== 'web') {
      void Promise.resolve(AccessibilityInfo.isScreenReaderEnabled())
        .then((value) => {
          if (mounted && !changed) setScreenReader(value === true);
        })
        .catch(() => undefined);
    }
    const subscription =
      Platform.OS === 'web'
        ? undefined
        : AccessibilityInfo.addEventListener('screenReaderChanged', (value) => {
            changed = true;
            setScreenReader(value === true);
          });
    const app = AppState.addEventListener('change', (state) => {
      if (state !== 'active') cancelHold();
    });
    return () => {
      mounted = false;
      subscription?.remove();
      app.remove();
      stopTimer();
    };
  }, []);

  useEffect(() => {
    if (!active || !enabled || screenReader) cancelHold();
  }, [active, enabled, screenReader]);

  const startHold = () => {
    if (!enabled || !active || screenReader || challenge || timer.current !== null) return;
    const started = Date.now();
    setProgress(0);
    timer.current = setInterval(
      () => setProgress(Math.min((Date.now() - started) / HOLD_MS, 1)),
      33,
    );
  };
  const openChallenge = () => {
    if (!enabled) {
      onOpen();
      return;
    }
    cancelHold();
    setAnswer('');
    setError(false);
    setChallenge((current) => current ?? generateMathQuestion());
  };
  const submitAnswer = () => {
    if (!challenge) return;
    if (isMathAnswer(answer, challenge.answer)) {
      setChallenge(null);
      onOpen();
    } else {
      setChallenge(generateMathQuestion());
      setAnswer('');
      setError(true);
    }
  };
  const webKeyboard =
    Platform.OS === 'web'
      ? {
          onKeyDown: (event: React.KeyboardEvent) => {
            if (event.key !== 'Enter' && event.key !== ' ') return;
            event.preventDefault();
            if (!event.repeat) openChallenge();
          },
        }
      : {};

  const holdVeilColor =
    resolvedMode === 'dark' ? 'rgba(38, 42, 49, 0.94)' : 'rgba(251, 248, 241, 0.94)';

  const renderPill = (floating = false) => (
    <Pressable
      {...webKeyboard}
      hitSlop={PILL_HIT_SLOP}
      style={({ pressed }) => [
        styles.pill,
        floating && styles.pillFloating,
        {
          backgroundColor: progress !== null ? colors.sky : colors.sunken,
          borderColor: progress !== null ? colors.skyInk : 'transparent',
          opacity: pressed && progress === null ? 0.85 : 1,
        },
      ]}
      accessibilityRole='button'
      accessibilityLabel={t('settings.title')}
      accessibilityHint={
        enabled ? t(screenReader ? 'home.gateSumHint' : 'home.gateHoldHint') : undefined
      }
      onPress={(event) => {
        // Keyboard and assistive technology generate an activation without a physical click.
        const webActivation =
          Platform.OS === 'web' &&
          (event.nativeEvent as { detail?: number } | undefined)?.detail === 0;
        if (!enabled || screenReader || webActivation) openChallenge();
      }}
      onAccessibilityTap={openChallenge}
      accessibilityActions={[{ name: 'activate', label: t('settings.title') }]}
      onAccessibilityAction={(event) => {
        if (event.nativeEvent.actionName === 'activate') openChallenge();
      }}
      onPressIn={startHold}
      onPressOut={cancelHold}
      onLongPress={
        enabled && !screenReader
          ? () => {
              if (timer.current !== null) {
                cancelHold();
                onOpen();
              }
            }
          : undefined
      }
      delayLongPress={HOLD_MS}
      testID='home-grown-ups'
    >
      {enabled && (
        <ControlIcon
          name='lock'
          color={progress !== null ? colors.skyInk : colors.textLight}
          size={14}
        />
      )}
      <Text
        style={[styles.pillLabel, { color: progress !== null ? colors.skyInk : colors.textLight }]}
      >
        {t('settings.title')}
      </Text>
    </Pressable>
  );

  const overlays = (
    <>
      <AppModal
        visible={challenge !== null}
        title={t('parentTimer.challengeLabel')}
        onClose={() => setChallenge(null)}
      >
        {challenge && (
          <View style={styles.challenge}>
            <Text style={[TypeStyle.title, { color: colors.text }]}>
              {t('home.gateQuestion', { question: challenge.question })}
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  color: colors.text,
                  borderColor: colors.outline,
                  backgroundColor: colors.surface,
                },
              ]}
              value={answer}
              onChangeText={(value) => {
                setAnswer(value.replace(/\D/g, ''));
                setError(false);
              }}
              keyboardType='number-pad'
              accessibilityLabel={t('parentTimer.answerLabel', { question: challenge.question })}
              placeholder={t('parentTimer.answerPlaceholder')}
              placeholderTextColor={colors.textLight}
              onSubmitEditing={submitAnswer}
              testID='grown-ups-answer'
            />
            {error && (
              <Text
                accessibilityLiveRegion='polite'
                style={[TypeStyle.body, { color: colors.peachInk }]}
              >
                {t('parentTimer.error')}
              </Text>
            )}
            <AppButton label={t('parentTimer.continue')} onPress={submitAnswer} fullWidth />
          </View>
        )}
      </AppModal>
      {progress !== null && (
        <View
          pointerEvents='none'
          style={[styles.hold, { backgroundColor: holdVeilColor }]}
          aria-hidden
          accessibilityElementsHidden
          importantForAccessibility='no-hide-descendants'
        >
          <View style={styles.ring}>
            <Svg width={104} height={104} viewBox='0 0 104 104'>
              <Circle
                cx={52}
                cy={52}
                r={45}
                stroke={colors.line}
                strokeWidth={8}
                fill={colors.surface}
              />
              <Circle
                cx={52}
                cy={52}
                r={45}
                stroke={colors.skyInk}
                strokeWidth={8}
                fill='none'
                strokeDasharray={RING_LENGTH}
                strokeDashoffset={RING_LENGTH * (1 - progress)}
                rotation={-90}
                originX={52}
                originY={52}
              />
            </Svg>
            <View style={styles.lock}>
              <ControlIcon name='lock' size={32} color={colors.skyInk} />
            </View>
          </View>
          <Text style={[TypeStyle.title, { color: colors.text }]}>{t('home.gateHolding')}</Text>
          <Text style={[TypeStyle.body, styles.center, { color: colors.textLight }]}>
            {t('home.gateHoldingDescription')}
          </Text>
        </View>
      )}
    </>
  );

  return { pill: renderPill(false), floatingPill: renderPill(true), overlays };
};

export const GrownUpsGate: React.FC<{ enabled: boolean; onOpen: () => void; active?: boolean }> = ({
  enabled,
  onOpen,
  active = true,
}) => {
  const { floatingPill, overlays } = useGrownUpsGate({ enabled, onOpen, active });
  return (
    <>
      {floatingPill}
      {overlays}
    </>
  );
};

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    gap: 5,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderRadius: Radius.full,
    paddingHorizontal: Space.md,
    paddingVertical: Space.sm,
    minHeight: 36,
  },
  pillFloating: {
    position: 'absolute',
    right: Space.base,
    top: Space.sm,
  },
  pillLabel: {
    ...TypeStyle.helper,
    fontWeight: '700',
  },
  hold: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Space.sm,
    padding: Space.xl,
  },
  ring: { width: 104, height: 104 },
  lock: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  center: { textAlign: 'center' },
  challenge: { gap: Space.md },
  input: {
    ...TypeStyle.label,
    borderWidth: 1.5,
    borderRadius: Radius.md,
    minHeight: 48,
    paddingHorizontal: Space.md,
  },
});
