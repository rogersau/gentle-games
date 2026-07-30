import {
  CATEGORY_MATCH_CATEGORIES_2,
  CATEGORY_MATCH_CATEGORIES_3,
  CATEGORY_MATCH_ITEMS,
  CategoryMatchCategory,
  CategoryMatchCategoryConfig,
  CategoryMatchCategoryCount,
  CategoryMatchItem,
} from '../types';

export interface CategoryMatchRound {
  item: CategoryMatchItem;
  categories: CategoryMatchCategoryConfig[];
  sortingAttribute: 'type';
}

const getCategories = (categoryCount: CategoryMatchCategoryCount): CategoryMatchCategoryConfig[] =>
  categoryCount === 3 ? [...CATEGORY_MATCH_CATEGORIES_3] : [...CATEGORY_MATCH_CATEGORIES_2];

export const getCategoryMatchItems = (
  categoryCount: CategoryMatchCategoryCount = 2,
): CategoryMatchItem[] => {
  const categoryIds = new Set(getCategories(categoryCount).map((category) => category.id));
  return CATEGORY_MATCH_ITEMS.filter((item) => categoryIds.has(item.category));
};

export const createCategoryMatchRound = (
  previousItem?: CategoryMatchItem,
  _roundsCompleted = 0,
  random: () => number = Math.random,
  categoryCount: CategoryMatchCategoryCount = 2,
): CategoryMatchRound => {
  const pool = getCategoryMatchItems(categoryCount).filter((item) => item.id !== previousItem?.id);
  const availableItems = pool.length > 0 ? pool : getCategoryMatchItems(categoryCount);

  return {
    item: availableItems[Math.floor(random() * availableItems.length)],
    categories: getCategories(categoryCount),
    sortingAttribute: 'type',
  };
};

export const isCategoryMatchCorrect = (
  item: CategoryMatchItem,
  droppedCategory: CategoryMatchCategory,
): boolean => item.category === droppedCategory;
