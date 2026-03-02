import {
  generateLetterLanternRound,
  getLetterLanternChoiceCount,
  isLetterLanternMatch,
} from './letterLanternLogic';

describe('letterLanternLogic', () => {
  it('returns choice counts by difficulty', () => {
    expect(getLetterLanternChoiceCount('easy')).toBe(6);
    expect(getLetterLanternChoiceCount('medium')).toBe(8);
    expect(getLetterLanternChoiceCount('hard')).toBe(10);
  });

  it('creates rounds containing the target letter', () => {
    const round = generateLetterLanternRound('medium', () => 0.35);
    expect(round.choices).toContain(round.targetLetter);
    expect(round.choices).toHaveLength(8);
  });

  it('validates correct letter choice', () => {
    const round = { targetLetter: 'B', choices: ['A', 'B', 'C'] };
    expect(isLetterLanternMatch(round, 'B')).toBe(true);
    expect(isLetterLanternMatch(round, 'A')).toBe(false);
  });
});

