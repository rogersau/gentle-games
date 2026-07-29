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

  it('starts without a round until a level is chosen', () => {
    const { result } = renderHook(() => usePatternTrainGame({ difficulty: 'easy', t: mockT }));

    expect(result.current.state.pattern).toBeNull();
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
    expect(result.current.state.wrongAttempts).toBe(1);
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
    expect(result.current.state.guidedRound.phase).toBe('skipped');

    act(() => result.current.actions.startNewRound());
    expect(result.current.state.guidedRound.phase).toBe('independent');
  });

  it('keeps normal milestones child-controlled and suppresses them in pressure-free mode', () => {
    const { result } = renderHook(() =>
      usePatternTrainGame({ difficulty: 'easy', t: mockT, showMilestones: true }),
    );
    act(() => result.current.actions.handleDifficultySelect('easy'));
    (patternTrainLogic.isTrainChoiceCorrect as jest.Mock).mockReturnValue(true);

    for (let round = 0; round < 5; round += 1) {
      act(() => result.current.actions.submitChoice('🌈'));
      if (round < 4) act(() => result.current.actions.startNewRound());
    }

    expect(result.current.state.showMilestoneModal).toBe(true);
    act(() => result.current.actions.handleMilestoneContinue());
    expect(result.current.state.showMilestoneModal).toBe(false);
    expect(result.current.state.guidedRound.phase).toBe('independent');

    const pressureFree = renderHook(() =>
      usePatternTrainGame({ difficulty: 'easy', t: mockT, showMilestones: false }),
    );
    act(() => pressureFree.result.current.actions.handleDifficultySelect('easy'));
    act(() => pressureFree.result.current.actions.submitChoice('🌈'));
    expect(pressureFree.result.current.state.showMilestoneModal).toBe(false);
  });
});
