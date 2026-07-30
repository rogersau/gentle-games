import {
  generatePatternTrainRound,
  generateTrainPattern,
  generateTransferPattern,
  isPatternTrainChoiceCorrect,
  isTrainChoiceCorrect,
} from './patternTrainLogic';

describe('patternTrainLogic', () => {
  it.each([
    ['easy', 2],
    ['medium', 3],
    ['hard', 4],
  ] as const)('uses the expected choice count at the %s level', (difficulty, choiceCount) => {
    const pattern = generateTrainPattern(difficulty, () => 0.42);

    expect(pattern.choices).toHaveLength(choiceCount);
    expect(new Set(pattern.choices).size).toBe(choiceCount);
    expect(pattern.choices).toContain(pattern.answer);
    expect(pattern.choices.filter((choice) => choice !== pattern.answer)).toHaveLength(
      choiceCount - 1,
    );
  });

  it('uses the AB rule at starter level', () => {
    const pattern = generateTrainPattern('easy', () => 0.2);

    expect(pattern.templateId).toBe('ab');
    expect(pattern.patternLabel).toContain('AB');
    expect(pattern.repeatUnit).toHaveLength(2);
    expect(pattern.carriages).toHaveLength(4);
  });

  it('shows the complete repeating unit for rules with repeated symbols', () => {
    const pattern = generateTrainPattern('medium', () => 0.5);

    expect(pattern.templateId).toBe('aab');
    expect(pattern.repeatUnit).toHaveLength(3);
    expect(pattern.repeatUnit[0]).toBe(pattern.repeatUnit[1]);
    expect(pattern.repeatUnit[2]).not.toBe(pattern.repeatUnit[0]);
  });

  it('varies missing positions and includes middle positions', () => {
    const positions = new Set(
      [0.01, 0.25, 0.5, 0.75, 0.99].map(
        (value) => generateTrainPattern('hard', () => value).missingIndex,
      ),
    );

    expect(positions.size).toBeGreaterThan(1);
    expect([...positions].some((position) => position > 1 && position < 5)).toBe(true);
    positions.forEach((position) => expect(position).toBeGreaterThan(0));
  });

  it('does not eliminate a distractor from the generated choices', () => {
    const pattern = generateTrainPattern('medium', () => 0.42);
    const initialChoices = [...pattern.choices];

    expect(pattern.choices).toEqual(initialChoices);
    expect(pattern.choices).not.toEqual([pattern.answer]);
  });

  it('reuses the rule and template for transfer with different symbols', () => {
    const first = generateTrainPattern('hard', () => 0.1);
    const transfer = generateTransferPattern(first, () => 0.1);

    expect(transfer.templateId).toBe(first.templateId);
    expect(transfer.patternLabel).toBe(first.patternLabel);
    expect(transfer.repeatUnit).toHaveLength(first.repeatUnit.length);
    expect(transfer.repeatUnit).not.toEqual(first.repeatUnit);
    expect(transfer.choices).toHaveLength(first.choices.length);
    expect(transfer.carriages.map(({ emoji }) => emoji)).not.toEqual(
      first.carriages.map(({ emoji }) => emoji),
    );
  });

  it('validates answers for the current and legacy shapes', () => {
    const pattern = generateTrainPattern('easy', () => 0.42);
    const round = generatePatternTrainRound('easy', () => 0.42);

    expect(isTrainChoiceCorrect(pattern, pattern.answer)).toBe(true);
    expect(
      isTrainChoiceCorrect(pattern, pattern.choices.find((choice) => choice !== pattern.answer)!),
    ).toBe(false);
    expect(isPatternTrainChoiceCorrect(round, round.answer)).toBe(true);
  });
});
