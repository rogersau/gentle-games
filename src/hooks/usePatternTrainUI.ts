import { useState, useCallback, useRef, useEffect } from 'react';

const CELEBRATION_PHRASES = [
  'games.patternTrain.celebration.phrase1',
  'games.patternTrain.celebration.phrase2',
  'games.patternTrain.celebration.phrase3',
  'games.patternTrain.celebration.phrase4',
  'games.patternTrain.celebration.phrase5',
];

interface UsePatternTrainUIOptions {
  milestoneInterval?: number;
  celebrationsEnabled?: boolean;
}

export function usePatternTrainUI(options: UsePatternTrainUIOptions = {}) {
  const { milestoneInterval = 5, celebrationsEnabled = true } = options;
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationPhrase, setCelebrationPhrase] = useState('');
  const [milestoneCount, setMilestoneCount] = useState(0);
  const phraseIndexRef = useRef(0);
  const milestoneCountRef = useRef(0);
  const celebrationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!celebrationsEnabled) setShowCelebration(false);
    return () => {
      if (celebrationTimerRef.current !== null) {
        clearTimeout(celebrationTimerRef.current);
        celebrationTimerRef.current = null;
      }
    };
  }, [celebrationsEnabled]);

  const triggerCelebration = useCallback(() => {
    const phrase = CELEBRATION_PHRASES[phraseIndexRef.current % CELEBRATION_PHRASES.length];
    phraseIndexRef.current += 1;
    setCelebrationPhrase(phrase);
    setShowCelebration(true);

    if (celebrationTimerRef.current !== null) clearTimeout(celebrationTimerRef.current);
    celebrationTimerRef.current = setTimeout(() => {
      celebrationTimerRef.current = null;
      setShowCelebration(false);
    }, 3000);
  }, []);

  const onPatternComplete = useCallback(() => {
    const next = ++milestoneCountRef.current;
    setMilestoneCount(next);
    if (celebrationsEnabled && next % milestoneInterval === 0) triggerCelebration();
  }, [celebrationsEnabled, milestoneInterval, triggerCelebration]);

  return {
    showCelebration,
    celebrationPhrase,
    milestoneCount,
    onPatternComplete,
  };
}
