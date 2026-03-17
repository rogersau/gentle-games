import { renderHook, act } from '@testing-library/react-native';
import {
  generateNumberPicnicPrompt,
  getNumberPicnicMaxCount,
  isNumberPicnicPromptComplete,
  updateNumberPicnicCount,
  useNumberPicnicGame,
} from './numberPicnicLogic';

describe('numberPicnicLogic', () => {
  describe('utility functions', () => {
    it('returns max count bands by difficulty', () => {
      expect(getNumberPicnicMaxCount('easy')).toBe(5);
      expect(getNumberPicnicMaxCount('medium')).toBe(8);
      expect(getNumberPicnicMaxCount('hard')).toBe(10);
    });

    it('generates prompt count inside difficulty range', () => {
      const prompt = generateNumberPicnicPrompt('medium', () => 0.5);
      expect(prompt.targetCount).toBeGreaterThanOrEqual(1);
      expect(prompt.targetCount).toBeLessThanOrEqual(8);
    });

    it('updates basket count with clamping and completion check', () => {
      expect(updateNumberPicnicCount(0, -1)).toBe(0);
      expect(updateNumberPicnicCount(11, 4)).toBe(12);
      const prompt = { itemEmoji: '🍎', itemName: 'apples', targetCount: 4, visualDots: ['🟢','🟢','🟢','🟢'] };
      expect(isNumberPicnicPromptComplete(4, prompt)).toBe(true);
      expect(isNumberPicnicPromptComplete(3, prompt)).toBe(false);
    });
  });

  describe('useNumberPicnicGame', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('initializes with correct state', () => {
      const { result } = renderHook(() => useNumberPicnicGame('easy'));

      expect(result.current.basketCount).toBe(0);
      expect(result.current.completedPicnics).toBe(0);
      expect(result.current.isSuccess).toBe(false);
      expect(result.current.isProcessing).toBe(false);
      expect(result.current.basketItems).toEqual([]);
      expect(result.current.prompt.targetCount).toBeGreaterThanOrEqual(1);
      expect(result.current.prompt.targetCount).toBeLessThanOrEqual(5);
    });

    it('adds item to basket when dropped', () => {
      const { result } = renderHook(() => useNumberPicnicGame('easy'));
      const initialCount = result.current.blanketItemCount;

      act(() => {
        result.current.handleItemDrop(0);
      });

      act(() => {
        jest.advanceTimersByTime(300);
      });

      expect(result.current.basketCount).toBe(1);
      expect(result.current.blanketItemCount).toBe(initialCount - 1);
    });

    it('ignores drop when processing', () => {
      const { result } = renderHook(() => useNumberPicnicGame('easy'));

      // First drop starts processing
      act(() => {
        result.current.handleItemDrop(0);
      });

      // Second drop should be ignored while processing
      act(() => {
        result.current.handleItemDrop(1);
      });

      // Only first item should be added
      expect(result.current.basketCount).toBe(1);
    });

    it('ignores drop when basket is full', () => {
      const { result } = renderHook(() => useNumberPicnicGame('easy'));
      const maxCount = getNumberPicnicMaxCount('easy');

      // Fill the basket
      for (let i = 0; i < maxCount; i++) {
        act(() => {
          result.current.handleItemDrop(i);
        });
        act(() => {
          jest.advanceTimersByTime(300);
        });
      }

      expect(result.current.basketCount).toBe(maxCount);

      // Try to add one more - should be ignored
      act(() => {
        result.current.handleItemDrop(maxCount);
      });

      expect(result.current.basketCount).toBe(maxCount);
    });

    it('marks success when target count is reached', () => {
      const { result } = renderHook(() => useNumberPicnicGame('easy'));
      const targetCount = result.current.prompt.targetCount;

      // Add items until target is reached
      for (let i = 0; i < targetCount; i++) {
        act(() => {
          result.current.handleItemDrop(i);
        });
        act(() => {
          jest.advanceTimersByTime(300);
        });
      }

      expect(result.current.isComplete).toBe(true);
      expect(result.current.isSuccess).toBe(true);
    });

    it('starts new round correctly', () => {
      const { result } = renderHook(() => useNumberPicnicGame('easy'));
      const firstPrompt = result.current.prompt;
      const initialBlanketCount = result.current.blanketItemCount;

      // Add some items
      act(() => {
        result.current.handleItemDrop(0);
      });
      act(() => {
        jest.advanceTimersByTime(300);
      });

      expect(result.current.basketCount).toBe(1);
      expect(result.current.completedPicnics).toBe(0);

      // Start new round
      act(() => {
        result.current.startNewRound();
      });

      expect(result.current.basketCount).toBe(0);
      expect(result.current.completedPicnics).toBe(1);
      expect(result.current.isSuccess).toBe(false);
      expect(result.current.blanketItemCount).toBe(initialBlanketCount);
      // Prompt should be regenerated (may be same by chance, so just verify it exists)
      expect(result.current.prompt).toBeDefined();
      expect(result.current.prompt.itemName).toBeDefined();
    });

    it('updates dragging state', () => {
      const { result } = renderHook(() => useNumberPicnicGame('easy'));

      expect(result.current.isDragging).toBe(false);
      expect(result.current.isOverBasket).toBe(false);

      act(() => {
        result.current.handleDropStart();
      });

      expect(result.current.isDragging).toBe(true);
      expect(result.current.isOverBasket).toBe(false);

      act(() => {
        result.current.handleDragOverBasket(true);
      });

      expect(result.current.isDragging).toBe(true);
      expect(result.current.isOverBasket).toBe(true);

      act(() => {
        result.current.handleDropEnd();
      });

      expect(result.current.isDragging).toBe(false);
      expect(result.current.isOverBasket).toBe(false);
      expect(result.current.basketCount).toBe(0);
    });

    it('cleans up transient drag state after a successful drop', () => {
      const { result } = renderHook(() => useNumberPicnicGame('easy'));

      act(() => {
        result.current.handleDropStart();
        result.current.handleDragOverBasket(true);
        result.current.handleDropEnd();
        result.current.handleItemDrop(0);
      });

      act(() => {
        jest.advanceTimersByTime(300);
      });

      expect(result.current.basketCount).toBe(1);
      expect(result.current.isDragging).toBe(false);
      expect(result.current.isOverBasket).toBe(false);
    });

    it('generates basket items based on count', () => {
      const { result } = renderHook(() => useNumberPicnicGame('easy'));

      expect(result.current.basketItems).toEqual([]);

      act(() => {
        result.current.handleItemDrop(0);
      });
      act(() => {
        jest.advanceTimersByTime(300);
      });

      expect(result.current.basketItems).toHaveLength(1);
      expect(result.current.basketItems[0]).toBe(result.current.prompt.itemEmoji);
    });

    it('respects different difficulty levels', () => {
      const { result: easyResult } = renderHook(() => useNumberPicnicGame('easy'));
      const { result: hardResult } = renderHook(() => useNumberPicnicGame('hard'));

      expect(easyResult.current.prompt.targetCount).toBeLessThanOrEqual(5);
      expect(hardResult.current.prompt.targetCount).toBeLessThanOrEqual(10);
    });
  });
});
