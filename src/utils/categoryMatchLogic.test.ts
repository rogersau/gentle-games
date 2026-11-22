import { gamePictures } from '../assets/game-pictures';
import {
  CATEGORY_MATCH_ITEMS,
  MEMORY_SNAP_OBJECTS,
  ANIMALS,
  CATEGORY_MATCH_PACKS,
  pictureNameByValue,
  PATTERN_TRAIN_EMOJIS,
  NUMBER_PICNIC_ITEMS,
  CATEGORY_MATCH_CATEGORIES_2,
  CATEGORY_MATCH_CATEGORIES_3,
} from '../types';
import {
  createCategoryMatchRound,
  getCategoryMatchItems,
  isCategoryMatchCorrect,
} from './categoryMatchLogic';

describe('categoryMatchLogic', () => {
  it('keeps every reviewed item in exactly one explicit category with metadata', () => {
    const memory = [...ANIMALS, ...MEMORY_SNAP_OBJECTS];
    expect(Object.keys(gamePictures).sort()).toEqual(memory.map((item) => item.name).sort());
    expect(new Set(CATEGORY_MATCH_ITEMS.map((item) => item.id)).size).toBe(
      CATEGORY_MATCH_ITEMS.length,
    );
    for (const item of CATEGORY_MATCH_ITEMS) {
      expect(item.id).toBe(item.name);
      expect(gamePictures[item.name]).toBeDefined();
      expect(memory.filter((card) => card.emoji === item.emoji).map((card) => card.name)).toEqual([
        item.name,
      ]);
      expect(
        Object.values(CATEGORY_MATCH_PACKS)
          .flat()
          .some((group) => group.id === item.category),
      ).toBe(true);
      expect(item.color).toMatch(/^#/);
    }
  });

  it('uses exactly two unambiguous starter groups and keeps clothes advanced-only', () => {
    expect(CATEGORY_MATCH_CATEGORIES_2.map((category) => category.id)).toEqual(['food', 'toys']);
    expect(getCategoryMatchItems(2).every((item) => item.category !== 'clothes')).toBe(true);
    expect(getCategoryMatchItems(2)).toHaveLength(16);
  });

  it('adds the third group only for the explicit three-group setting', () => {
    expect(CATEGORY_MATCH_CATEGORIES_3.map((category) => category.id)).toEqual([
      'food',
      'toys',
      'clothes',
    ]);
    expect(getCategoryMatchItems(3)).toHaveLength(24);
  });

  it('returns the sorting attribute and current categories before every round', () => {
    const round = createCategoryMatchRound(undefined, 0, () => 0, 2);
    expect(round.sortingAttribute).toBe('type');
    expect(round.categories).toHaveLength(2);
    expect(round.item.category).toBe('food');
  });

  it('uses the same rule for a later transfer item without eliminating items', () => {
    const first = createCategoryMatchRound(undefined, 0, () => 0, 2);
    const next = createCategoryMatchRound(first.item, 1, () => 0, 2);
    expect(next.item.category).toBe('food');
    expect(next.item.id).not.toBe(first.item.id);

    const foodItems = getCategoryMatchItems(2).filter((item) => item.category === 'food');
    const laterItems = Array.from({ length: foodItems.length * 2 }, (_, index) =>
      createCategoryMatchRound(
        index === 0 ? undefined : foodItems[(index - 1) % foodItems.length],
        index,
        () => 0,
        2,
      ),
    );
    expect(new Set(laterItems.map((round) => round.item.id)).size).toBeGreaterThan(1);
  });

  it('uses only the selected picture set and visible groups for sorting', () => {
    for (const pack of ['town', 'outdoors', 'everyday'] as const) {
      for (const count of [2, 3] as const) {
        const groups = CATEGORY_MATCH_PACKS[pack].slice(0, count);
        const items = getCategoryMatchItems(count, pack);
        expect(new Set(items.map((item) => item.category))).toEqual(
          new Set(groups.map((group) => group.id)),
        );
        items.forEach((item, i) => {
          const round = createCategoryMatchRound(
            undefined,
            0,
            () => (i + 0.5) / items.length,
            count,
            pack,
          );
          expect(round.item).toEqual(item);
          expect(round.categories).toEqual(groups);
        });
      }
    }
  });

  it('provides app artwork for every train and picnic piece', () => {
    for (const symbol of [
      ...PATTERN_TRAIN_EMOJIS,
      ...NUMBER_PICNIC_ITEMS.map((item) => item.emoji),
    ]) {
      expect(gamePictures[pictureNameByValue.get(symbol)!]).toBeDefined();
    }
  });

  it('shares one membership answer function for every category', () => {
    for (const item of CATEGORY_MATCH_ITEMS) {
      expect(isCategoryMatchCorrect(item, item.category)).toBe(true);
      for (const category of ['food', 'toys', 'clothes'] as const) {
        if (category !== item.category) expect(isCategoryMatchCorrect(item, category)).toBe(false);
      }
    }
  });
});
