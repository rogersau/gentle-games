import { act, renderHook } from '@testing-library/react-native';
import {
  createNumberPicnicState,
  createNumberPicnicRepresentation,
  generateNumberPicnicPrompt,
  getNumberPicnicRange,
  getNumberPicnicMaxCount,
  getNumberPicnicPoolSize,
  isNumberPicnicModeAvailable,
  isNumberPicnicPromptComplete,
  numberPicnicReducer,
  useNumberPicnicGame,
} from './numberPicnicLogic';

const addAndUnlock = (result: { current: ReturnType<typeof useNumberPicnicGame> }, id: number) => {
  act(() => result.current.handleItemDrop(id));
  act(() => jest.advanceTimersByTime(300));
};

describe('numberPicnicLogic', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('keeps target quantities manageable and the source pool deliberately small', () => {
    expect(getNumberPicnicMaxCount('easy')).toBe(5);
    expect(getNumberPicnicMaxCount('medium')).toBe(8);
    expect(getNumberPicnicMaxCount('hard')).toBe(10);

    for (let target = 1; target <= 10; target += 1) {
      expect(getNumberPicnicPoolSize(target)).toBe(target + 2);
    }
  });

  it('keeps all stage boundaries inclusive and exact', () => {
    expect(getNumberPicnicRange('1-3')).toEqual({ min: 1, max: 3 });
    expect(getNumberPicnicRange('1-5')).toEqual({ min: 1, max: 5 });
    expect(getNumberPicnicRange('6-10')).toEqual({ min: 6, max: 10 });

    expect(generateNumberPicnicPrompt('1-3', () => 0).targetCount).toBe(1);
    expect(generateNumberPicnicPrompt('1-3', () => 0.999999).targetCount).toBe(3);
    expect(generateNumberPicnicPrompt('1-5', () => 0).targetCount).toBe(1);
    expect(generateNumberPicnicPrompt('1-5', () => 0.999999).targetCount).toBe(5);
    expect(generateNumberPicnicPrompt('6-10', () => 0).targetCount).toBe(6);
    expect(generateNumberPicnicPrompt('6-10', () => 0.999999).targetCount).toBe(10);
  });

  it('generates an exact frame representation and validates exact completion', () => {
    const prompt = generateNumberPicnicPrompt('1-5', () => 0.5);
    expect(prompt.targetCount).toBe(3);
    expect(prompt.representation.filledSlots).toHaveLength(3);
    expect(isNumberPicnicPromptComplete(3, prompt)).toBe(true);
    expect(isNumberPicnicPromptComplete(4, prompt)).toBe(false);
  });

  it('keeps numeral and frame occupancy equal for every quantity', () => {
    for (let quantity = 1; quantity <= 10; quantity += 1) {
      const representation = createNumberPicnicRepresentation(quantity);
      expect(representation.quantity).toBe(quantity);
      expect(representation.numeral).toBe(quantity);
      expect(representation.filledSlots).toHaveLength(quantity);
      expect(representation.frameCapacity).toBe(quantity <= 5 ? 5 : 10);
    }
  });

  it('generates every mode with a precise target and deterministic output', () => {
    const modes = [
      'make-amount',
      'find-amount',
      'match-numeral',
      'more-fewer',
      'add-one-more',
    ] as const;

    for (const mode of modes) {
      const first = generateNumberPicnicPrompt('6-10', () => 0.25, mode);
      const second = generateNumberPicnicPrompt('6-10', () => 0.25, mode);
      expect(second).toEqual(first);
      expect(first.mode).toBe(mode);
      if (mode === 'more-fewer') {
        expect(first.groups).toHaveLength(2);
        expect(first.groups[0].quantity).not.toBe(first.groups[1].quantity);
        expect(first.comparison).toMatch(/more|fewer/);
      } else if (mode === 'add-one-more') {
        expect(first.targetCount).toBeGreaterThan(6);
        expect(first.targetCount).toBeLessThanOrEqual(10);
      } else if (mode === 'find-amount' || mode === 'match-numeral') {
        expect(first.choices.map((choice) => choice.quantity)).toContain(first.targetCount);
      }
    }

    expect(isNumberPicnicModeAvailable('1-5', 'add-one-more')).toBe(false);
    expect(generateNumberPicnicPrompt('1-5', () => 0, 'add-one-more').mode).toBe('make-amount');
  });

  it('keeps every generated numeral, frame, choice, and group aligned with its quantity', () => {
    const samples = [0, 0.1, 0.25, 0.5, 0.75, 0.999999];
    const stages = ['1-3', '1-5', '6-10'] as const;
    const modes = [
      'make-amount',
      'find-amount',
      'match-numeral',
      'more-fewer',
      'add-one-more',
    ] as const;

    for (const stage of stages) {
      for (const mode of modes) {
        if (!isNumberPicnicModeAvailable(stage, mode)) continue;

        for (const sample of samples) {
          const prompt = generateNumberPicnicPrompt(stage, () => sample, mode);
          expect(prompt.representation.quantity).toBe(prompt.targetCount);
          expect(prompt.representation.numeral).toBe(prompt.targetCount);
          expect(prompt.representation.filledSlots).toHaveLength(prompt.targetCount);

          for (const choice of prompt.choices) {
            expect(choice.numeral).toBe(choice.quantity);
            expect(choice.representation.quantity).toBe(choice.quantity);
            expect(choice.representation.filledSlots).toHaveLength(choice.quantity);
          }

          for (const group of prompt.groups) {
            expect(group.representation.quantity).toBe(group.quantity);
            expect(group.representation.filledSlots).toHaveLength(group.quantity);
          }

          if (mode === 'find-amount' || mode === 'match-numeral') {
            expect(
              prompt.choices.filter(({ quantity }) => quantity === prompt.targetCount),
            ).toHaveLength(1);
          }
        }
      }
    }
  });

  it('does not expose the guided answer through a fixed first position', () => {
    for (const mode of ['find-amount', 'match-numeral'] as const) {
      const prompt = generateNumberPicnicPrompt('6-10', () => 0.25, mode);
      expect(prompt.choices[0].quantity).not.toBe(prompt.targetCount);
      expect(prompt.choices.map((choice) => choice.quantity)).toContain(prompt.targetCount);
    }
  });

  it('starts add-one-more with the initial quantity placed and one action remaining', () => {
    const prompt = generateNumberPicnicPrompt('6-10', () => 0, 'add-one-more');
    const initial = createNumberPicnicState(prompt);

    expect(initial.placedItemIds).toHaveLength(prompt.targetCount - 1);
    expect(initial.poolItemIds).toHaveLength(3);

    const fixedItemId = initial.placedItemIds[0];
    expect(numberPicnicReducer(initial, { type: 'remove', itemId: fixedItemId })).toBe(initial);

    const added = numberPicnicReducer(initial, { type: 'add', itemId: initial.poolItemIds[0] });
    expect(added.placedItemIds).toHaveLength(prompt.targetCount);
    expect(numberPicnicReducer(added, { type: 'undo' }).placedItemIds).toEqual(
      initial.placedItemIds,
    );
  });

  it('atomically adds, removes, undoes, and resets the same round', () => {
    const prompt = {
      itemEmoji: '🍎',
      itemName: 'apples',
      targetCount: 2,
      stage: '1-3' as const,
      mode: 'make-amount' as const,
      representation: {
        quantity: 2,
        numeral: 2,
        frameCapacity: 5 as const,
        filledSlots: [1, 3],
      },
      choices: [],
      groups: [],
      comparison: null,
    };
    const initial = createNumberPicnicState(prompt);
    const added = numberPicnicReducer(initial, { type: 'add', itemId: 0 });
    expect(added.placedItemIds).toEqual([0]);
    expect(added.poolItemIds).not.toContain(0);

    const removed = numberPicnicReducer(added, { type: 'remove', itemId: 0 });
    expect(removed.placedItemIds).toEqual([]);
    expect(removed.poolItemIds).toEqual(initial.poolItemIds);
    expect(numberPicnicReducer(added, { type: 'undo' }).placedItemIds).toEqual([]);

    const reset = numberPicnicReducer(added, { type: 'reset' });
    expect(reset.prompt).toEqual(prompt);
    expect(reset.round).toBe(initial.round);
    expect(reset.placedItemIds).toEqual([]);
    expect(reset.poolItemIds).toEqual(initial.poolItemIds);
  });

  it('shares add semantics between tap and drag paths', () => {
    const { result } = renderHook(() => useNumberPicnicGame('1-3'));
    const firstId = result.current.blanketItemIds[0];

    act(() => result.current.handleDropStart());
    act(() => result.current.handleDragOverBasket(true));
    addAndUnlock(result, firstId);

    expect(result.current.basketItemIds).toEqual([firstId]);
    expect(result.current.isDragging).toBe(false);
    expect(result.current.isOverBasket).toBe(false);
  });

  it('ignores rapid duplicate input and never overshoots the target', () => {
    const { result } = renderHook(() => useNumberPicnicGame('6-10'));
    const target = result.current.prompt.targetCount;
    const ids = [...result.current.blanketItemIds];

    act(() => {
      result.current.handleItemDrop(ids[0]);
      result.current.handleItemDrop(ids[0]);
    });
    expect(result.current.basketCount).toBe(1);
    act(() => jest.advanceTimersByTime(300));

    for (let index = 1; index < ids.length; index += 1) {
      addAndUnlock(result, ids[index]);
    }

    expect(result.current.basketCount).toBe(target);
    expect(result.current.isComplete).toBe(true);
  });

  it('announces completion once and requires deliberate Next', () => {
    const { result } = renderHook(() => useNumberPicnicGame('1-3'));
    const ids = [...result.current.blanketItemIds];

    for (let index = 0; index < result.current.prompt.targetCount; index += 1) {
      addAndUnlock(result, ids[index]);
    }

    expect(result.current.hasCompletionAnnouncement).toBe(true);
    const completedRound = result.current.completedPicnics;
    const prompt = result.current.prompt;
    act(() => result.current.startNewRound());
    expect(result.current.completedPicnics).toBe(completedRound + 1);
    expect(result.current.prompt).not.toBe(prompt);
    expect(result.current.basketCount).toBe(0);

    act(() => result.current.startNewRound());
    expect(result.current.completedPicnics).toBe(completedRound + 1);
  });

  it('supports safe reversal after completion and preserves count on rerender', () => {
    const { result, rerender, unmount } = renderHook(() => useNumberPicnicGame('1-3'));
    const ids = [...result.current.blanketItemIds];

    for (let index = 0; index < result.current.prompt.targetCount; index += 1) {
      addAndUnlock(result, ids[index]);
    }
    const completedPrompt = result.current.prompt;
    act(() => result.current.handleBasketItemPress(ids[0]));
    expect(result.current.basketCount).toBe(completedPrompt.targetCount - 1);
    expect(result.current.isComplete).toBe(false);

    addAndUnlock(result, ids[0]);
    const countBeforeRerender = result.current.basketCount;
    rerender(undefined);
    expect(result.current.basketCount).toBe(countBeforeRerender);
    expect(result.current.prompt.targetCount).toBe(completedPrompt.targetCount);
    unmount();
  });

  it('uses the shared guided sequence and requires corrected response before transfer', () => {
    const { result } = renderHook(() =>
      useNumberPicnicGame('1-5', { mode: 'find-amount', rng: () => 0.5 }),
    );
    const correctChoice = result.current.prompt.choices.find(
      (choice) => choice.quantity === result.current.prompt.targetCount,
    );
    const wrongChoice = result.current.prompt.choices.find(
      (choice) => choice.quantity !== result.current.prompt.targetCount,
    );
    expect(correctChoice).toBeDefined();
    expect(wrongChoice).toBeDefined();

    act(() => result.current.handleChoice(wrongChoice!.id));
    expect(result.current.guidedRound.phase).toBe('hinted');
    act(() => result.current.handleChoice(wrongChoice!.id));
    expect(result.current.guidedRound.phase).toBe('modelled');
    act(() => result.current.handleChoice(correctChoice!.id));
    expect(result.current.guidedRound.phase).toBe('corrected');
    expect(result.current.isComplete).toBe(true);
    const oldExample = result.current.guidedRound.exampleNumber;
    act(() => result.current.startNewRound());
    expect(result.current.guidedRound.exampleNumber).toBe(oldExample + 1);
    expect(result.current.guidedRound.phase).toBe('independent');
  });

  it('narrates placements only when per-game narration and global sound are enabled', () => {
    const narrate = jest.fn();
    const enabled = renderHook(() =>
      useNumberPicnicGame('1-3', {
        rng: () => 0,
        spokenCounting: true,
        settings: { soundEnabled: true },
        narrateCount: narrate,
      }),
    );
    act(() => enabled.result.current.handleItemDrop(enabled.result.current.blanketItemIds[0]));
    expect(narrate).toHaveBeenCalledWith(1);
    enabled.unmount();

    const mutedNarrate = jest.fn();
    const muted = renderHook(() =>
      useNumberPicnicGame('1-3', {
        rng: () => 0,
        spokenCounting: true,
        settings: { soundEnabled: false },
        narrateCount: mutedNarrate,
      }),
    );
    act(() => muted.result.current.handleItemDrop(muted.result.current.blanketItemIds[0]));
    expect(mutedNarrate).not.toHaveBeenCalled();
  });

  it('cancels its input unlock timer during teardown', () => {
    const { result, unmount } = renderHook(() => useNumberPicnicGame('1-3'));
    act(() => result.current.handleItemDrop(result.current.blanketItemIds[0]));
    expect(jest.getTimerCount()).toBe(1);
    unmount();
    expect(jest.getTimerCount()).toBe(0);
  });
});
