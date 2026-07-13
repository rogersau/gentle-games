import { useState, useCallback, useRef } from 'react';

const CELEBRATION_PHRASES = [
  'games.patternTrain.celebration.phrase1',
  'games.patternTrain.celebration.phrase2',
  'games.patternTrain.celebration.phrase3',
  'games.patternTrain.celebration.phrase4',
  'games.patternTrain.celebration.phrase5',
];

interface UsePatternTrainUIOptions {
  milestoneInterval?: number;
}

export function usePatternTrainUI(options: UsePatternTrainUIOptions = {}) {
  const { milestoneInterval = 5 } = options;
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationPhrase, setCelebrationPhrase] = useState('');
  const [milestoneCount, setMilestoneCount] = useState(0);
  const phraseIndexRef = useRef(0);

  const triggerCelebration = useCallback(() => {
    const phrase = CELEBRATION_PHRASES[phraseIndexRef.current % CELEBRATION_PHRASES.length];
    phraseIndexRef.current += 1;
    setCelebrationPhrase(phrase);
    setShowCelebration(true);

    setTimeout(() => {
      setShowCelebration(false);
    }, 3000);
  }, []);

  const onPatternComplete = useCallback(() => {
    setMilestoneCount((prev) => {
      const next = prev + 1;
      if (next % milestoneInterval === 0) {
        triggerCelebration();
      }
      return next;
    });
  }, [milestoneInterval, triggerCelebration]);

  return {
    showCelebration,
    celebrationPhrase,
    milestoneCount,
    onPatternComplete,
  };
}
