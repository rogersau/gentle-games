import {
  CATEGORY_MATCH_PACKS,
  CategoryMatchPack,
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

export const getCategoryMatchCategories = (
  categoryCount: CategoryMatchCategoryCount,
  pack: CategoryMatchPack = 'everyday',
): CategoryMatchCategoryConfig[] => CATEGORY_MATCH_PACKS[pack].slice(0, categoryCount);

export const getCategoryMatchItems = (
  categoryCount: CategoryMatchCategoryCount = 2,
  pack: CategoryMatchPack = 'everyday',
): CategoryMatchItem[] => {
  const categoryIds = new Set(
    getCategoryMatchCategories(categoryCount, pack).map((category) => category.id),
  );
  return CATEGORY_MATCH_ITEMS.filter((item) => categoryIds.has(item.category));
};

export const createCategoryMatchRound = (
  previousItem?: CategoryMatchItem,
  _roundsCompleted = 0,
  random: () => number = Math.random,
  categoryCount: CategoryMatchCategoryCount = 2,
  pack: CategoryMatchPack = 'everyday',
): CategoryMatchRound => {
  const pool = getCategoryMatchItems(categoryCount, pack).filter(
    (item) => item.id !== previousItem?.id,
  );
  const availableItems = pool.length > 0 ? pool : getCategoryMatchItems(categoryCount, pack);

  return {
    item: availableItems[Math.floor(random() * availableItems.length)],
    categories: getCategoryMatchCategories(categoryCount, pack),
    sortingAttribute: 'type',
  };
};

export const isCategoryMatchCorrect = (
  item: CategoryMatchItem,
  droppedCategory: CategoryMatchCategory,
): boolean => item.category === droppedCategory;
