import { CATEGORY_MATCH_ITEMS } from '../types';
import { createCategoryMatchRound, isCategoryMatchCorrect } from './categoryMatchLogic';

describe('categoryMatchLogic', () => {
  it('creates a round with one item and three categories', () => {
    const round = createCategoryMatchRound(undefined, 0, () => 0.2);

    expect(round.item).toBeTruthy();
    expect(round.categories).toHaveLength(3);
    expect(round.categories.map((category) => category.id)).toEqual(['sky', 'land', 'ocean']);
  });

  it('avoids repeating the same item in consecutive rounds', () => {
    const previousItem = CATEGORY_MATCH_ITEMS[0];
    const nextRound = createCategoryMatchRound(previousItem, 0, () => 0);

    expect(nextRound.item.name).not.toBe(previousItem.name);
  });

  it('validates category drops correctly', () => {
    const item = CATEGORY_MATCH_ITEMS.find((entry) => entry.category === 'sky');
    expect(item).toBeTruthy();
    if (!item) {
      return;
    }

    expect(isCategoryMatchCorrect(item, 'sky')).toBe(true);
    expect(isCategoryMatchCorrect(item, 'ocean')).toBe(false);
  });

  it('does not repeat category on consecutive rounds', () => {
    let round = createCategoryMatchRound(undefined, 0, () => 0);

    for (let i = 0; i < 12; i++) {
      const nextRound = createCategoryMatchRound(round.item, i + 1, () => 0);
      expect(nextRound.item.category).not.toBe(round.item.category);
      round = nextRound;
    }
  });

  it('uses an even item split with younger sky/land/ocean sets', () => {
    const counts = CATEGORY_MATCH_ITEMS.reduce<Record<string, number>>((acc, item) => {
      acc[item.category] = (acc[item.category] ?? 0) + 1;
      return acc;
    }, {});

    expect(counts.sky).toBe(counts.land);
    expect(counts.land).toBe(counts.ocean);

    const skyNames = CATEGORY_MATCH_ITEMS.filter((item) => item.category === 'sky').map(
      (item) => item.name
    );
    expect(skyNames).toContain('sun');
    expect(skyNames).toContain('cloud');
    expect(skyNames).toContain('moon');

    const landNames = CATEGORY_MATCH_ITEMS.filter((item) => item.category === 'land').map(
      (item) => item.name
    );
    expect(landNames).toContain('apple');
    expect(landNames).toContain('carrot');
    expect(landNames).toContain('broccoli');

    const oceanNames = CATEGORY_MATCH_ITEMS.filter((item) => item.category === 'ocean').map(
      (item) => item.name
    );
    expect(oceanNames).toContain('fish');
    expect(oceanNames).toContain('dolphin');
    expect(oceanNames).toContain('wave');
  });

  it('widens the per-category pool as rounds progress', () => {
    const previousOcean = CATEGORY_MATCH_ITEMS.find((item) => item.category === 'ocean');
    const landPool = CATEGORY_MATCH_ITEMS.filter((item) => item.category === 'land');
    const earlyLandNames = landPool.slice(0, 4).map((item) => item.name);
    expect(previousOcean).toBeTruthy();
    if (!previousOcean) {
      return;
    }

    const earlyRound = createCategoryMatchRound(previousOcean, 0, () => 0.99);
    const laterRound = createCategoryMatchRound(previousOcean, 20, () => 0.99);

    expect(earlyRound.item.category).toBe('land');
    expect(laterRound.item.category).toBe('land');
    expect(earlyLandNames).toContain(earlyRound.item.name);
    expect(earlyLandNames).not.toContain(laterRound.item.name);
  });
});
