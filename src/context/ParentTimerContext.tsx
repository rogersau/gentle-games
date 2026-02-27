import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { ThemeColors } from '../types';
import { ResolvedThemeMode, useThemeColors } from '../utils/theme';
import { useSettings } from './SettingsContext';

interface ParentTimerContextType {
  /** Seconds remaining; 0 when disabled or paused */
  secondsRemaining: number;
  /** Whether the lock screen is currently showing */
  isLocked: boolean;
}

const ParentTimerContext = createContext<ParentTimerContextType>({
  secondsRemaining: 0,
  isLocked: false,
});

const generateMathQuestion = (): { question: string; answer: number } => {
  const a = Math.floor(Math.random() * 40) + 12;
  const b = Math.floor(Math.random() * 30) + 11;
  const useAddition = Math.random() > 0.4;
  if (useAddition) {
    return { question: `${a} + ${b}`, answer: a + b };
  }
  const big = Math.max(a, b);
  const small = Math.min(a, b);
  return { question: `${big} − ${small}`, answer: big - small };
};

export const ParentTimerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { settings } = useSettings();
  const { colors, resolvedMode } = useThemeColors();
  const [secondsRemaining, setSecondsRemaining] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [mathChallenge, setMathChallenge] = useState(generateMathQuestion);
  const [userAnswer, setUserAnswer] = useState('');
  const [shakeAnim] = useState(() => new Animated.Value(0));
  const [showError, setShowError] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Reset timer when setting changes
  useEffect(() => {
    if (settings.parentTimerMinutes > 0) {
      setSecondsRemaining(settings.parentTimerMinutes * 60);
      setIsLocked(false);
    } else {
      setSecondsRemaining(0);
      setIsLocked(false);
    }
  }, [settings.parentTimerMinutes]);

  // Countdown
  useEffect(() => {
    if (settings.parentTimerMinutes <= 0 || isLocked) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    intervalRef.current = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          setIsLocked(true);
          setMathChallenge(generateMathQuestion());
          setUserAnswer('');
          setShowError(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [settings.parentTimerMinutes, isLocked]);

  const handleUnlock = useCallback(() => {
    const parsed = parseInt(userAnswer.trim(), 10);
    if (parsed === mathChallenge.answer) {
      setIsLocked(false);
      setSecondsRemaining(settings.parentTimerMinutes * 60);
      setUserAnswer('');
      setShowError(false);
    } else {
      setShowError(true);
      setUserAnswer('');
      Animated.sequence([
        Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 8, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -8, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
      ]).start(() => {
        setMathChallenge(generateMathQuestion());
      });
    }
  }, [userAnswer, mathChallenge.answer, settings.parentTimerMinutes, shakeAnim]);

  const styles = React.useMemo(() => createStyles(colors, resolvedMode), [colors, resolvedMode]);

  return (
    <ParentTimerContext.Provider value={{ secondsRemaining, isLocked }}>
      {children}
      <Modal
        animationType="fade"
        transparent={false}
        visible={isLocked}
        onRequestClose={() => {}}
      >
        <View style={styles.lockContainer}>
          <Text style={styles.lockIcon}>⏰</Text>
          <Text style={styles.lockTitle}>Time for a Break!</Text>
          <Text style={styles.lockSubtitle}>
            Ask a grown-up to solve this to keep playing
          </Text>

          <Animated.View style={[styles.challengeCard, { transform: [{ translateX: shakeAnim }] }]}>
            <Text style={styles.challengeLabel}>What is</Text>
            <Text style={styles.challengeQuestion}>{mathChallenge.question} = ?</Text>
            <TextInput
              style={styles.answerInput}
              value={userAnswer}
              onChangeText={(text) => {
                setUserAnswer(text.replace(/[^0-9-]/g, ''));
                setShowError(false);
              }}
              keyboardType="number-pad"
              placeholder="Answer"
              placeholderTextColor={colors.textLight}
              autoFocus
              onSubmitEditing={handleUnlock}
              testID="parent-timer-answer-input"
            />
            {showError && (
              <Text style={styles.errorText}>Not quite — try again!</Text>
            )}
          </Animated.View>

          <TouchableOpacity
            style={styles.unlockButton}
            onPress={handleUnlock}
            testID="parent-timer-unlock-button"
          >
            <Text style={styles.unlockButtonText}>Continue Playing</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </ParentTimerContext.Provider>
  );
};

export const useParentTimer = () => useContext(ParentTimerContext);

const createStyles = (colors: ThemeColors, resolvedMode: ResolvedThemeMode) =>
  StyleSheet.create({
    lockContainer: {
      flex: 1,
      backgroundColor: colors.background,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 32,
    },
    lockIcon: {
      fontSize: 64,
      marginBottom: 16,
    },
    lockTitle: {
      fontSize: 28,
      fontWeight: '700',
      color: colors.text,
      textAlign: 'center',
      marginBottom: 8,
    },
    lockSubtitle: {
      fontSize: 16,
      color: colors.textLight,
      textAlign: 'center',
      marginBottom: 32,
    },
    challengeCard: {
      backgroundColor: colors.cardFront,
      borderRadius: 20,
      padding: 28,
      width: '100%',
      maxWidth: 340,
      alignItems: 'center',
      marginBottom: 28,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    challengeLabel: {
      fontSize: 16,
      color: resolvedMode === 'dark' ? colors.cardBack : colors.textLight,
      marginBottom: 8,
    },
    challengeQuestion: {
      fontSize: 36,
      fontWeight: '700',
      color: resolvedMode === 'dark' ? colors.background : colors.text,
      marginBottom: 20,
    },
    answerInput: {
      width: '80%',
      height: 52,
      borderRadius: 14,
      borderWidth: 2,
      borderColor: colors.primary,
      backgroundColor: resolvedMode === 'dark' ? colors.background : '#FFFFFF',
      fontSize: 24,
      fontWeight: '600',
      color: colors.text,
      textAlign: 'center',
      paddingHorizontal: 16,
    },
    errorText: {
      marginTop: 12,
      fontSize: 14,
      color: resolvedMode === 'dark' ? colors.secondary : '#B76A7C',
      fontWeight: '600',
    },
    unlockButton: {
      backgroundColor: colors.primary,
      paddingHorizontal: 40,
      paddingVertical: 16,
      borderRadius: 25,
    },
    unlockButtonText: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.cardFront,
    },
  });
