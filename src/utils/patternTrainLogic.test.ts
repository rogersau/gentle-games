import { generatePatternTrainRound, isPatternTrainChoiceCorrect } from './patternTrainLogic';

const rng = () => 0.42;

describe('patternTrainLogic', () => {
  it('generates a solvable easy round with one blank', () => {
    const round = generatePatternTrainRound('easy', rng);
    expect(round.display.filter((item) => item === '❔')).toHaveLength(1);
    expect(round.choices).toContain(round.answer);
    expect(round.patternLabel).toContain('AB');
  });

  it('generates a medium round with longer sequence', () => {
    const round = generatePatternTrainRound('medium', rng);
    expect(round.sequence.length).toBe(6);
    expect(round.display[round.display.length - 1]).toBe('❔');
  });

  it('validates answer selection', () => {
    const round = generatePatternTrainRound('hard', rng);
    expect(isPatternTrainChoiceCorrect(round, round.answer)).toBe(true);
    const wrongChoice = round.choices.find((choice) => choice !== round.answer) ?? '';
    expect(isPatternTrainChoiceCorrect(round, wrongChoice)).toBe(false);
  });
});

