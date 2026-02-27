import {
  CATEGORY_MATCH_CATEGORIES,
  CATEGORY_MATCH_ITEMS,
  CategoryMatchCategory,
  CategoryMatchCategoryConfig,
  CategoryMatchItem,
} from '../types';

export interface CategoryMatchRound {
  item: CategoryMatchItem;
  categories: CategoryMatchCategoryConfig[];
}

const CATEGORY_SEQUENCE: CategoryMatchCategory[] = CATEGORY_MATCH_CATEGORIES.map(
  (category) => category.id
);

const CATEGORY_ITEMS: Record<CategoryMatchCategory, CategoryMatchItem[]> = {
  animals: CATEGORY_MATCH_ITEMS.filter((item) => item.category === 'animals'),
  objects: CATEGORY_MATCH_ITEMS.filter((item) => item.category === 'objects'),
  shapes: CATEGORY_MATCH_ITEMS.filter((item) => item.category === 'shapes'),
};

const getNextCategory = (
  previousCategory: CategoryMatchCategory | undefined,
  random: () => number
): CategoryMatchCategory => {
  if (!previousCategory) {
    const startIndex = Math.floor(random() * CATEGORY_SEQUENCE.length);
    return CATEGORY_SEQUENCE[startIndex];
  }

  const previousIndex = CATEGORY_SEQUENCE.indexOf(previousCategory);
  const nextIndex = (previousIndex + 1) % CATEGORY_SEQUENCE.length;
  return CATEGORY_SEQUENCE[nextIndex];
};

const getRoundItem = (
  previousItem: CategoryMatchItem | undefined,
  random: () => number
): CategoryMatchItem => {
  const nextCategory = getNextCategory(previousItem?.category, random);
  const inCategoryPool = CATEGORY_ITEMS[nextCategory];
  const pool = previousItem
    ? inCategoryPool.filter((item) => item.name !== previousItem.name)
    : inCategoryPool;
  const selectedPool = pool.length > 0 ? pool : inCategoryPool;

  const index = Math.floor(random() * selectedPool.length);
  return selectedPool[index];
};

export const createCategoryMatchRound = (
  previousItem?: CategoryMatchItem,
  random: () => number = Math.random
): CategoryMatchRound => ({
  item: getRoundItem(previousItem, random),
  categories: [...CATEGORY_MATCH_CATEGORIES],
});

export const isCategoryMatchCorrect = (
  item: CategoryMatchItem,
  droppedCategory: CategoryMatchCategory
): boolean => item.category === droppedCategory;

