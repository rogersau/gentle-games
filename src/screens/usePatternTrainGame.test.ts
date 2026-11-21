import { act, renderHook } from '@testing-library/react-native';
import { usePatternTrainGame } from './usePatternTrainGame';
import * as patternTrainLogic from '../utils/patternTrainLogic';

jest.mock('../utils/patternTrainLogic', () => ({
  generateTrainPattern: jest.fn(),
  generateTransferPattern: jest.fn(),
  isTrainChoiceCorrect: jest.fn(),
}));

const mockT = (key: string): string => key;
const pattern = {
  carriages: [
    { emoji: '🌟', isMissing: false },
    { emoji: '🌈', isMissing: true },
    { emoji: '🌟', isMissing: false },
  ],
  answer: '🌈',
  choices: ['🌈', '🌸'],
  patternLabel: 'AB pattern',
  repeatUnit: ['🌟', '🌈'],
  templateId: 'ab',
  missingIndex: 1,
  difficulty: 'easy' as const,
};

describe('usePatternTrainGame', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (patternTrainLogic.generateTrainPattern as jest.Mock).mockReturnValue(pattern);
    (patternTrainLogic.generateTransferPattern as jest.Mock).mockReturnValue({
      ...pattern,
      repeatUnit: ['🌸', '☁️'],
      answer: '☁️',
      choices: ['☁️', '🫧'],
    });
  });

  it('starts at the saved level without a setup interruption', () => {
    const { result } = renderHook(() => usePatternTrainGame({ difficulty: 'easy', t: mockT }));

    expect(result.current.state.pattern).toBe(pattern);
    expect(result.current.state.showDifficultySelector).toBe(false);
    expect(patternTrainLogic.generateTrainPattern).toHaveBeenCalledWith('easy');
    expect(result.current.state.guidedRound.phase).toBe('independent');
    expect(result.current.state.completedRounds).toBe(0);
  });

  it('generates the selected independent level', () => {
    const { result } = renderHook(() => usePatternTrainGame({ difficulty: 'easy', t: mockT }));

    act(() => result.current.actions.handleDifficultySelect('medium'));

    expect(patternTrainLogic.generateTrainPattern).toHaveBeenCalledWith('medium');
    expect(result.current.state.pattern).toBe(pattern);
    expect(result.current.state.showDifficultySelector).toBe(false);
  });

  it('stages a hint, then a model, and requires a corrected response', () => {
    const { result } = renderHook(() => usePatternTrainGame({ difficulty: 'easy', t: mockT }));
    act(() => result.current.actions.handleDifficultySelect('easy'));

    (patternTrainLogic.isTrainChoiceCorrect as jest.Mock).mockReturnValue(false);
    act(() => result.current.actions.submitChoice('🌸'));
    expect(result.current.state.guidedRound.phase).toBe('hinted');

    act(() => result.current.actions.submitChoice('🌸'));
    expect(result.current.state.guidedRound.phase).toBe('modelled');

    act(() => result.current.actions.startNewRound());
    expect(result.current.state.pattern).toBe(pattern);
    expect(result.current.state.guidedRound.phase).toBe('modelled');

    (patternTrainLogic.isTrainChoiceCorrect as jest.Mock).mockReturnValue(true);
    act(() => result.current.actions.submitChoice('🌈'));
    expect(result.current.state.guidedRound.phase).toBe('corrected');
  });

  it('shows a child-requested hint without recording an error', () => {
    const { result } = renderHook(() => usePatternTrainGame({ difficulty: 'easy', t: mockT }));
    act(() => result.current.actions.handleDifficultySelect('easy'));

    act(() => result.current.actions.showHint());

    expect(result.current.state.guidedRound).toMatchObject({
      phase: 'hinted',
      incorrectAttempts: 0,
    });
  });

  it('keeps all choices after an incorrect response', () => {
    const { result } = renderHook(() => usePatternTrainGame({ difficulty: 'easy', t: mockT }));
    act(() => result.current.actions.handleDifficultySelect('easy'));
    (patternTrainLogic.isTrainChoiceCorrect as jest.Mock).mockReturnValue(false);

    act(() => result.current.actions.submitChoice('🌸'));

    expect(result.current.state.pattern?.choices).toEqual(['🌈', '🌸']);
    expect(result.current.state.guidedRound.incorrectAttempts).toBe(1);
  });

  it('uses the same template with new symbols after Next', () => {
    const { result } = renderHook(() => usePatternTrainGame({ difficulty: 'easy', t: mockT }));
    act(() => result.current.actions.handleDifficultySelect('easy'));
    (patternTrainLogic.isTrainChoiceCorrect as jest.Mock).mockReturnValue(true);
    act(() => result.current.actions.submitChoice('🌈'));
    act(() => result.current.actions.startNewRound());

    expect(patternTrainLogic.generateTransferPattern).toHaveBeenCalledWith(pattern);
    expect(result.current.state.guidedRound.phase).toBe('independent');
    expect(result.current.state.pattern?.templateId).toBe(pattern.templateId);
    expect(result.current.state.pattern?.repeatUnit).not.toEqual(pattern.repeatUnit);
  });

  it('moves to a fresh rule after the transfer example', () => {
    const { result } = renderHook(() => usePatternTrainGame({ difficulty: 'easy', t: mockT }));
    act(() => result.current.actions.handleDifficultySelect('easy'));
    (patternTrainLogic.isTrainChoiceCorrect as jest.Mock).mockReturnValue(true);

    act(() => result.current.actions.submitChoice('🌈'));
    act(() => result.current.actions.startNewRound());
    act(() => result.current.actions.submitChoice('☁️'));
    act(() => result.current.actions.startNewRound());

    expect(patternTrainLogic.generateTransferPattern).toHaveBeenCalledTimes(1);
    expect(patternTrainLogic.generateTrainPattern).toHaveBeenLastCalledWith('easy');
  });

  it('allows Skip to advance without completing the response', () => {
    const { result } = renderHook(() => usePatternTrainGame({ difficulty: 'easy', t: mockT }));
    act(() => result.current.actions.handleDifficultySelect('easy'));
    act(() => result.current.actions.skipRound());
    expect(result.current.state.guidedRound.phase).toBe('independent');
    expect(result.current.state.guidedRound.exampleNumber).toBe(2);
    expect(result.current.state.completedRounds).toBe(0);
  });

  it('accepts a correct choice once even when two submissions reach the same render', () => {
    const { result } = renderHook(() => usePatternTrainGame({ difficulty: 'easy', t: mockT }));
    (patternTrainLogic.isTrainChoiceCorrect as jest.Mock).mockReturnValue(true);
    const { submitChoice } = result.current.actions;

    act(() => {
      expect(submitChoice('🌈')?.isCorrect).toBe(true);
      expect(submitChoice('🌈')).toBeNull();
    });

    expect(result.current.state.completedRounds).toBe(1);
  });

  it('ignores a drop callback that arrives after the child skips its train', () => {
    const { result } = renderHook(() => usePatternTrainGame({ difficulty: 'easy', t: mockT }));
    const { submitChoice, skipRound } = result.current.actions;

    act(() => {
      skipRound();
      expect(submitChoice('🌈')).toBeNull();
    });

    expect(result.current.state.attachedCarriage).toBeNull();
    expect(result.current.state.guidedRound).toMatchObject({
      phase: 'independent',
      exampleNumber: 2,
    });
    expect(result.current.state.completedRounds).toBe(0);
    expect(patternTrainLogic.isTrainChoiceCorrect).not.toHaveBeenCalled();
  });
});
