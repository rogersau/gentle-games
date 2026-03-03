import { generateTrainPattern, isTrainChoiceCorrect, removeWrongChoices, generatePatternTrainRound, isPatternTrainChoiceCorrect } from './patternTrainLogic';

const rng = () => 0.42;

describe('patternTrainLogic', () => {
  describe('generateTrainPattern', () => {
    it('generates a solvable easy pattern with train structure', () => {
      const pattern = generateTrainPattern('easy', rng);
      
      // Should have carriages array
      expect(pattern.carriages).toBeDefined();
      expect(pattern.carriages.length).toBeGreaterThan(1);
      
      // First carriage should have an emoji (not missing)
      expect(pattern.carriages[0].isMissing).toBe(false);
      expect(pattern.carriages[0].emoji).toBeTruthy();
      
      // Exactly one carriage should be missing
      const missingCarriages = pattern.carriages.filter(c => c.isMissing);
      expect(missingCarriages.length).toBe(1);
      
      // Should have 4 choices
      expect(pattern.choices).toHaveLength(4);
      expect(pattern.choices).toContain(pattern.answer);
    });

    it('generates medium pattern with longer train', () => {
      const pattern = generateTrainPattern('medium', rng);
      
      // Medium should have more carriages than easy
      expect(pattern.carriages.length).toBeGreaterThanOrEqual(3);
      
      // Should have choices
      expect(pattern.choices).toHaveLength(4);
    });

    it('generates hard pattern with longest train', () => {
      const pattern = generateTrainPattern('hard', rng);
      
      // Hard should have the most carriages
      expect(pattern.carriages.length).toBeGreaterThanOrEqual(4);
      
      // Should have choices
      expect(pattern.choices).toHaveLength(4);
    });

    it('validates answer selection', () => {
      const pattern = generateTrainPattern('hard', rng);
      expect(isTrainChoiceCorrect(pattern, pattern.answer)).toBe(true);
      
      const wrongChoice = pattern.choices.find((choice) => choice !== pattern.answer) ?? '';
      expect(isTrainChoiceCorrect(pattern, wrongChoice)).toBe(false);
    });
  });

  describe('removeWrongChoices', () => {
    it('removes wrong choices correctly', () => {
      const choices = ['🚂', '🌟', '🌈', '🌸'];
      const answer = '🚂';
      
      const afterOneRemoval = removeWrongChoices(choices, answer, 1);
      expect(afterOneRemoval).toHaveLength(3);
      expect(afterOneRemoval).toContain(answer);
      
      const afterTwoRemovals = removeWrongChoices(choices, answer, 2);
      expect(afterTwoRemovals).toHaveLength(2);
      expect(afterTwoRemovals).toContain(answer);
      
      const afterThreeRemovals = removeWrongChoices(choices, answer, 3);
      expect(afterThreeRemovals).toHaveLength(1);
      expect(afterThreeRemovals[0]).toBe(answer);
    });
  });

  describe('generatePatternTrainRound (legacy)', () => {
    it('generates a solvable easy round with one blank', () => {
      const round = generatePatternTrainRound('easy', rng);
      expect(round.display.filter((item) => item === '❔')).toHaveLength(1);
      expect(round.choices).toContain(round.answer);
      expect(round.choices).toHaveLength(4);
    });

    it('generates a medium round with longer sequence', () => {
      const round = generatePatternTrainRound('medium', rng);
      expect(round.sequence.length).toBeGreaterThanOrEqual(4);
      expect(round.display[round.display.length - 1]).toBe('❔');
    });

    it('generates a hard round with longest sequence', () => {
      const round = generatePatternTrainRound('hard', rng);
      expect(round.sequence.length).toBeGreaterThanOrEqual(5);
      expect(round.display[round.display.length - 1]).toBe('❔');
    });

    it('validates answer selection (legacy)', () => {
      const round = generatePatternTrainRound('hard', rng);
      expect(isPatternTrainChoiceCorrect(round, round.answer)).toBe(true);
      const wrongChoice = round.choices.find((choice) => choice !== round.answer) ?? '';
      expect(isPatternTrainChoiceCorrect(round, wrongChoice)).toBe(false);
    });
  });

  describe('pattern variety', () => {
    it('generates different patterns within same difficulty', () => {
      const patterns = Array.from({ length: 10 }, () => generateTrainPattern('medium', Math.random));
      const uniqueLabels = new Set(patterns.map(p => p.patternLabel));
      expect(uniqueLabels.size).toBeGreaterThan(1);
    });
  });

  describe('easy mode missing position randomization', () => {
    it('can have missing carriage at position 2 or 3 in easy mode', () => {
      // Run multiple times to test randomization
      const missingPositions: number[] = [];
      
      for (let i = 0; i < 20; i++) {
        const pattern = generateTrainPattern('easy', Math.random);
        const missingIndex = pattern.carriages.findIndex(c => c.isMissing);
        missingPositions.push(missingIndex);
      }
      
      // Should have both position 2 and 3 (0-indexed)
      expect(missingPositions).toContain(2);
      expect(missingPositions).toContain(3);
    });

    it('has exactly one missing carriage', () => {
      const pattern = generateTrainPattern('easy', rng);
      const missingCount = pattern.carriages.filter(c => c.isMissing).length;
      expect(missingCount).toBe(1);
    });
  });

  describe('difficulty-specific patterns', () => {
    it('easy has AB pattern type', () => {
      const pattern = generateTrainPattern('easy', rng);
      expect(pattern.patternLabel).toContain('AB');
    });

    it('medium has ABC, AAB, or ABB patterns', () => {
      const pattern = generateTrainPattern('medium', rng);
      expect(['ABC', 'AAB', 'ABB']).toContain(pattern.patternLabel.split(' ')[0]);
    });

    it('hard has AABB, ABBA, or ABCB patterns', () => {
      const pattern = generateTrainPattern('hard', rng);
      expect(['AABB', 'ABBA', 'ABCB']).toContain(pattern.patternLabel.split(' ')[0]);
    });
  });
});
