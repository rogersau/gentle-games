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

const getPoolLimitForRound = (roundsCompleted: number): number => {
  if (roundsCompleted < 6) return 4;
  if (roundsCompleted < 15) return 8;
  return Number.POSITIVE_INFINITY;
};

const getNextCategory = (
  previousCategory: CategoryMatchCategory | undefined,
  random: () => number
): CategoryMatchCategory => {
  if (!previousCategory) {
    const startIndex = Math.floor(random() * CATEGORY_SEQUENCE.length);
    return CATEGORY_SEQUENCE[startIndex];
  }

  const eligible = CATEGORY_SEQUENCE.filter((category) => category !== previousCategory);
  const nextIndex = Math.floor(random() * eligible.length);
  return eligible[nextIndex];
};

const getRoundItem = (
  previousItem: CategoryMatchItem | undefined,
  roundsCompleted: number,
  random: () => number
): CategoryMatchItem => {
  const nextCategory = getNextCategory(previousItem?.category, random);
  const inCategoryPool = CATEGORY_ITEMS[nextCategory];
  const poolLimit = getPoolLimitForRound(roundsCompleted);
  const tierPool = Number.isFinite(poolLimit) ? inCategoryPool.slice(0, poolLimit) : inCategoryPool;
  const pool = previousItem ? tierPool.filter((item) => item.name !== previousItem.name) : tierPool;
  const selectedPool = pool.length > 0 ? pool : inCategoryPool;

  const index = Math.floor(random() * selectedPool.length);
  return selectedPool[index];
};

export const createCategoryMatchRound = (
  previousItem?: CategoryMatchItem,
  roundsCompleted: number = 0,
  random: () => number = Math.random
): CategoryMatchRound => ({
  item: getRoundItem(previousItem, roundsCompleted, random),
  categories: [...CATEGORY_MATCH_CATEGORIES],
});

export const isCategoryMatchCorrect = (
  item: CategoryMatchItem,
  droppedCategory: CategoryMatchCategory
): boolean => item.category === droppedCategory;

