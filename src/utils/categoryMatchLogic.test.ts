import { CATEGORY_MATCH_ITEMS } from '../types';
import { createCategoryMatchRound, isCategoryMatchCorrect } from './categoryMatchLogic';

describe('categoryMatchLogic', () => {
  it('creates a round with one item and three categories', () => {
    const round = createCategoryMatchRound(undefined, () => 0.2);

    expect(round.item).toBeTruthy();
    expect(round.categories).toHaveLength(3);
    expect(round.categories.map((category) => category.id)).toEqual(['animals', 'objects', 'shapes']);
  });

  it('avoids repeating the same item in consecutive rounds', () => {
    const previousItem = CATEGORY_MATCH_ITEMS[0];
    const nextRound = createCategoryMatchRound(previousItem, () => 0);

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

  it('cycles categories to keep rounds balanced at one-third each', () => {
    const categories: string[] = [];
    let round = createCategoryMatchRound(undefined, () => 0);

    for (let i = 0; i < 9; i++) {
      categories.push(round.item.category);
      round = createCategoryMatchRound(round.item, () => 0);
    }

    expect(categories).toEqual([
      'animals',
      'objects',
      'shapes',
      'animals',
      'objects',
      'shapes',
      'animals',
      'objects',
      'shapes',
    ]);
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
});

