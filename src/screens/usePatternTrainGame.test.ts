import { renderHook, act } from '@testing-library/react-native';
import { usePatternTrainGame } from './usePatternTrainGame';
import * as patternTrainLogic from '../utils/patternTrainLogic';

// Mock the patternTrainLogic module
jest.mock('../utils/patternTrainLogic', () => ({
  generateTrainPattern: jest.fn(),
  isTrainChoiceCorrect: jest.fn(),
  removeWrongChoices: jest.fn(),
}));

const mockT = (key: string, options?: Record<string, unknown>): string => {
  const translations: Record<string, string> = {
    'games.patternTrain.feedback.initial': 'Drag a carriage to complete the train',
    'games.patternTrain.feedback.correct': 'Correct! Well done!',
    'games.patternTrain.feedback.incorrect': 'Not quite right. Try again!',
    'games.patternTrain.feedback.correctOptions': 'Great job! Wonderful! Perfect!',
    'games.patternTrain.feedback.incorrectOptions': 'Try again! Keep trying! Almost!',
    'games.patternTrain.feedback.reveal': 'The answer was {{answer}}',
  };

  let result = translations[key] || key;
  if (options && typeof options === 'object') {
    Object.entries(options).forEach(([k, v]) => {
      result = result.replace(`{{${k}}}`, String(v));
    });
  }
  return result;
};

const createMockPattern = (overrides = {}) => ({
  carriages: [
    { emoji: '🚂', isMissing: false },
    { emoji: '🚃', isMissing: false },
    { emoji: '🚃', isMissing: true },
  ],
  answer: '🚃',
  choices: ['🚃', '🚂', '🚕', '🚗'],
  patternLabel: 'AB pattern',
  ...overrides,
});

describe('usePatternTrainGame', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    (patternTrainLogic.generateTrainPattern as jest.Mock).mockReturnValue(createMockPattern());
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Initial State', () => {
    it('should initialize with correct default state', () => {
      const { result } = renderHook(() => usePatternTrainGame({ difficulty: 'easy', t: mockT }));

      expect(result.current.state.pattern).toBeNull();
      expect(result.current.state.completedRounds).toBe(0);
      expect(result.current.state.wrongAttempts).toBe(0);
      expect(result.current.state.isProcessing).toBe(false);
      expect(result.current.state.showMilestoneModal).toBe(false);
      expect(result.current.state.showDifficultySelector).toBe(true);
      expect(result.current.state.selectedChoice).toBeNull();
      expect(result.current.state.attachedCarriage).toBeNull();
      expect(result.current.state.trainPhase).toBe('offscreen');
      expect(result.current.state.feedback).toBe('Drag a carriage to complete the train');
      expect(result.current.state.feedbackType).toBe('initial');
    });
  });

  describe('Difficulty Selection', () => {
    it('should handle difficulty selection and generate pattern', () => {
      const mockPattern = createMockPattern();
      (patternTrainLogic.generateTrainPattern as jest.Mock).mockReturnValue(mockPattern);

      const { result } = renderHook(() => usePatternTrainGame({ difficulty: 'easy', t: mockT }));

      act(() => {
        result.current.actions.handleDifficultySelect('medium');
      });

      expect(patternTrainLogic.generateTrainPattern).toHaveBeenCalledWith('medium');
      expect(result.current.state.pattern).toEqual(mockPattern);
      expect(result.current.state.showDifficultySelector).toBe(false);
    });

    it('should handle closing difficulty selector', () => {
      const { result } = renderHook(() => usePatternTrainGame({ difficulty: 'easy', t: mockT }));

      act(() => {
        result.current.actions.handleCloseDifficultySelector();
      });

      expect(result.current.state.showDifficultySelector).toBe(false);
    });
  });

  describe('Game Flow', () => {
    it('should start a new round with fresh state', () => {
      const mockPattern = createMockPattern();
      (patternTrainLogic.generateTrainPattern as jest.Mock).mockReturnValue(mockPattern);

      const { result } = renderHook(() => usePatternTrainGame({ difficulty: 'easy', t: mockT }));

      // Set some state first
      act(() => {
        result.current.actions.setWrongAttempts(2);
        result.current.actions.setSelectedChoice('🚃');
        result.current.actions.setAttachedCarriage('🚃');
        result.current.actions.setFeedbackType('incorrect');
      });

      act(() => {
        result.current.actions.startNewRound();
      });

      expect(patternTrainLogic.generateTrainPattern).toHaveBeenCalledWith('easy');
      expect(result.current.state.wrongAttempts).toBe(0);
      expect(result.current.state.selectedChoice).toBeNull();
      expect(result.current.state.attachedCarriage).toBeNull();
      expect(result.current.state.feedbackType).toBe('initial');
      expect(result.current.state.isProcessing).toBe(false);
    });

    it('should handle correct answer and increment rounds', () => {
      const { result } = renderHook(() => usePatternTrainGame({ difficulty: 'easy', t: mockT }));

      act(() => {
        result.current.actions.handleCorrectAnswer();
      });

      expect(result.current.state.completedRounds).toBe(1);
    });

    it('should trigger milestone modal every 5 rounds', () => {
      const { result } = renderHook(() => usePatternTrainGame({ difficulty: 'easy', t: mockT }));

      // Complete 4 rounds one at a time
      act(() => {
        result.current.actions.handleCorrectAnswer();
      });
      act(() => {
        result.current.actions.handleCorrectAnswer();
      });
      act(() => {
        result.current.actions.handleCorrectAnswer();
      });
      act(() => {
        result.current.actions.handleCorrectAnswer();
      });

      expect(result.current.state.completedRounds).toBe(4);
      expect(result.current.state.showMilestoneModal).toBe(false);

      // Complete the 5th round
      act(() => {
        result.current.actions.handleCorrectAnswer();
      });

      expect(result.current.state.completedRounds).toBe(5);
      expect(result.current.state.showMilestoneModal).toBe(true);
    });

    it('should handle incorrect answer and increment wrong attempts', () => {
      const mockPattern = createMockPattern();
      (patternTrainLogic.generateTrainPattern as jest.Mock).mockReturnValue(mockPattern);

      const { result } = renderHook(() => usePatternTrainGame({ difficulty: 'easy', t: mockT }));

      // First set a pattern
      act(() => {
        result.current.actions.handleDifficultySelect('easy');
      });

      act(() => {
        result.current.actions.handleIncorrectAnswer('🚕');
      });

      expect(result.current.state.wrongAttempts).toBe(1);
      expect(patternTrainLogic.removeWrongChoices).toHaveBeenCalled();
    });

    it('should track wrong attempts up to 3', () => {
      const mockPattern = createMockPattern();
      (patternTrainLogic.generateTrainPattern as jest.Mock).mockReturnValue(mockPattern);

      const { result } = renderHook(() => usePatternTrainGame({ difficulty: 'easy', t: mockT }));

      // Set a pattern first
      act(() => {
        result.current.actions.handleDifficultySelect('easy');
      });

      // Make 3 wrong attempts
      act(() => {
        result.current.actions.handleIncorrectAnswer('🚕');
      });
      act(() => {
        result.current.actions.handleIncorrectAnswer('🚗');
      });
      act(() => {
        result.current.actions.handleIncorrectAnswer('🚂');
      });

      expect(result.current.state.wrongAttempts).toBe(3);
    });
  });

  describe('Timeout Management', () => {
    it('should queue and execute timeouts', () => {
      const callback = jest.fn();
      const { result } = renderHook(() => usePatternTrainGame({ difficulty: 'easy', t: mockT }));

      act(() => {
        result.current.actions.queueTimeout(callback, 1000);
      });

      expect(callback).not.toHaveBeenCalled();

      act(() => {
        jest.advanceTimersByTime(1000);
      });

      expect(callback).toHaveBeenCalled();
    });

    it('should clear all timeouts', () => {
      const callback = jest.fn();
      const { result } = renderHook(() => usePatternTrainGame({ difficulty: 'easy', t: mockT }));

      act(() => {
        result.current.actions.queueTimeout(callback, 1000);
      });

      act(() => {
        result.current.actions.clearAllTimeouts();
      });

      act(() => {
        jest.advanceTimersByTime(1000);
      });

      expect(callback).not.toHaveBeenCalled();
    });

    it('should clear all timeouts when requested', () => {
      const callback = jest.fn();
      const { result } = renderHook(() => usePatternTrainGame({ difficulty: 'easy', t: mockT }));

      act(() => {
        result.current.actions.queueTimeout(callback, 1000);
      });

      act(() => {
        result.current.actions.clearAllTimeouts();
      });

      act(() => {
        jest.advanceTimersByTime(1000);
      });

      // Timeout should be cleared
      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe('Feedback', () => {
    it('should return random feedback for correct answers', () => {
      const { result } = renderHook(() => usePatternTrainGame({ difficulty: 'easy', t: mockT }));

      const feedback = result.current.actions.getRandomFeedback('correct');
      expect(feedback).toBeTruthy();
      expect(typeof feedback).toBe('string');
      // Should return the options string when returnObjects is used
      expect(feedback.length).toBeGreaterThan(0);
    });

    it('should return random feedback for incorrect answers', () => {
      const { result } = renderHook(() => usePatternTrainGame({ difficulty: 'easy', t: mockT }));

      const feedback = result.current.actions.getRandomFeedback('incorrect');
      expect(feedback).toBeTruthy();
      expect(typeof feedback).toBe('string');
      expect(feedback.length).toBeGreaterThan(0);
    });

    it('should fallback to default feedback when options array is empty', () => {
      const emptyT = () => '';
      const { result } = renderHook(() => usePatternTrainGame({ difficulty: 'easy', t: emptyT }));

      const feedback = result.current.actions.getRandomFeedback('correct');
      expect(feedback).toBe('');
    });
  });

  describe('State Setters', () => {
    it('should update showMilestoneModal', () => {
      const { result } = renderHook(() => usePatternTrainGame({ difficulty: 'easy', t: mockT }));

      act(() => {
        result.current.actions.setShowMilestoneModal(true);
      });

      expect(result.current.state.showMilestoneModal).toBe(true);
    });

    it('should update selectedChoice', () => {
      const { result } = renderHook(() => usePatternTrainGame({ difficulty: 'easy', t: mockT }));

      act(() => {
        result.current.actions.setSelectedChoice('🚃');
      });

      expect(result.current.state.selectedChoice).toBe('🚃');
    });

    it('should update attachedCarriage', () => {
      const { result } = renderHook(() => usePatternTrainGame({ difficulty: 'easy', t: mockT }));

      act(() => {
        result.current.actions.setAttachedCarriage('🚃');
      });

      expect(result.current.state.attachedCarriage).toBe('🚃');
    });

    it('should update feedback', () => {
      const { result } = renderHook(() => usePatternTrainGame({ difficulty: 'easy', t: mockT }));

      act(() => {
        result.current.actions.setFeedback('Great job!');
      });

      expect(result.current.state.feedback).toBe('Great job!');
    });

    it('should update feedbackType', () => {
      const { result } = renderHook(() => usePatternTrainGame({ difficulty: 'easy', t: mockT }));

      act(() => {
        result.current.actions.setFeedbackType('correct');
      });

      expect(result.current.state.feedbackType).toBe('correct');
    });

    it('should update trainPhase', () => {
      const { result } = renderHook(() => usePatternTrainGame({ difficulty: 'easy', t: mockT }));

      act(() => {
        result.current.actions.setTrainPhase('entering');
      });

      expect(result.current.state.trainPhase).toBe('entering');
    });

    it('should update isProcessing', () => {
      const { result } = renderHook(() => usePatternTrainGame({ difficulty: 'easy', t: mockT }));

      act(() => {
        result.current.actions.setIsProcessing(true);
      });

      expect(result.current.state.isProcessing).toBe(true);
    });
  });

  describe('Reset Game', () => {
    it('should reset all state to initial values', () => {
      const { result } = renderHook(() => usePatternTrainGame({ difficulty: 'easy', t: mockT }));

      // Set various state
      act(() => {
        result.current.actions.handleDifficultySelect('easy');
        result.current.actions.handleCorrectAnswer();
        result.current.actions.setWrongAttempts(2);
        result.current.actions.setSelectedChoice('🚃');
        result.current.actions.setAttachedCarriage('🚃');
        result.current.actions.setTrainPhase('waiting');
        result.current.actions.setIsProcessing(true);
      });

      act(() => {
        result.current.actions.resetGame();
      });

      expect(result.current.state.pattern).toBeNull();
      expect(result.current.state.completedRounds).toBe(0);
      expect(result.current.state.wrongAttempts).toBe(0);
      expect(result.current.state.showMilestoneModal).toBe(false);
      expect(result.current.state.showDifficultySelector).toBe(true);
      expect(result.current.state.selectedChoice).toBeNull();
      expect(result.current.state.attachedCarriage).toBeNull();
      expect(result.current.state.trainPhase).toBe('offscreen');
      expect(result.current.state.isProcessing).toBe(false);
      expect(result.current.state.feedback).toBe('Drag a carriage to complete the train');
      expect(result.current.state.feedbackType).toBe('initial');
    });
  });

  describe('Handle Reveal Answer', () => {
    it('should handle reveal answer', () => {
      const { result } = renderHook(() => usePatternTrainGame({ difficulty: 'easy', t: mockT }));

      // Just verify it doesn't throw
      act(() => {
        result.current.actions.handleRevealAnswer();
      });

      // This action currently doesn't modify state, just a placeholder
      expect(result.current.state).toBeDefined();
    });
  });
});
