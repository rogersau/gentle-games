import { CATEGORY_MATCH_ITEMS } from '../types';
import { createCategoryMatchRound, isCategoryMatchCorrect } from './categoryMatchLogic';

describe('categoryMatchLogic', () => {
  it('creates a round with one item and three categories', () => {
    const round = createCategoryMatchRound(undefined, 0, () => 0.2);

    expect(round.item).toBeTruthy();
    expect(round.categories).toHaveLength(3);
    expect(round.categories.map((category) => category.id)).toEqual(['animals', 'objects', 'shapes']);
  });

  it('avoids repeating the same item in consecutive rounds', () => {
    const previousItem = CATEGORY_MATCH_ITEMS[0];
    const nextRound = createCategoryMatchRound(previousItem, 0, () => 0);

    expect(nextRound.item.name).not.toBe(previousItem.name);
  });

  it('validates category drops correctly', () => {
    const item = CATEGORY_MATCH_ITEMS.find((entry) => entry.category === 'animals');
    expect(item).toBeTruthy();
    if (!item) {
      return;
    }

    expect(isCategoryMatchCorrect(item, 'animals')).toBe(true);
    expect(isCategoryMatchCorrect(item, 'shapes')).toBe(false);
  });

  it('does not repeat category on consecutive rounds', () => {
    let round = createCategoryMatchRound(undefined, 0, () => 0);

    for (let i = 0; i < 12; i++) {
      const nextRound = createCategoryMatchRound(round.item, i + 1, () => 0);
      expect(nextRound.item.category).not.toBe(round.item.category);
      round = nextRound;
    }
  });

  it('uses an even item split and keeps sky emojis out of shapes', () => {
    const counts = CATEGORY_MATCH_ITEMS.reduce<Record<string, number>>((acc, item) => {
      acc[item.category] = (acc[item.category] ?? 0) + 1;
      return acc;
    }, {});

    expect(counts.animals).toBe(counts.objects);
    expect(counts.objects).toBe(counts.shapes);

    const shapeNames = CATEGORY_MATCH_ITEMS.filter((item) => item.category === 'shapes').map(
      (item) => item.name
    );
    expect(shapeNames).not.toContain('sun');
    expect(shapeNames).not.toContain('moon');
    expect(shapeNames).not.toContain('cloud');

    const objectNames = CATEGORY_MATCH_ITEMS.filter((item) => item.category === 'objects').map(
      (item) => item.name
    );
    expect(objectNames).toContain('sun');
    expect(objectNames).toContain('moon');
    expect(objectNames).toContain('cloud');
  });

  it('widens the per-category pool as rounds progress', () => {
    const previousShape = CATEGORY_MATCH_ITEMS.find((item) => item.category === 'shapes');
    const objectPool = CATEGORY_MATCH_ITEMS.filter((item) => item.category === 'objects');
    const earlyObjectNames = objectPool.slice(0, 4).map((item) => item.name);
    expect(previousShape).toBeTruthy();
    if (!previousShape) {
      return;
    }

    const earlyRound = createCategoryMatchRound(previousShape, 0, () => 0.99);
    const laterRound = createCategoryMatchRound(previousShape, 20, () => 0.99);

    expect(earlyRound.item.category).toBe('objects');
    expect(laterRound.item.category).toBe('objects');
    expect(earlyObjectNames).toContain(earlyRound.item.name);
    expect(earlyObjectNames).not.toContain(laterRound.item.name);
  });
});

