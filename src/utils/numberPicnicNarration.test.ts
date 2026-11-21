import { Platform } from 'react-native';
import { act, renderHook } from '@testing-library/react-native';
import { useNumberPicnicGame } from './numberPicnicLogic';
import { stopNumberPicnicNarration, useNumberPicnicSpeechAvailable } from './numberPicnicNarration';

const australian = { lang: 'en-AU', localService: true };
const american = { lang: 'en-US', localService: true };
const remote = { lang: 'en-AU', localService: false };

describe('Number Picnic web speech', () => {
  let platform: ReturnType<typeof jest.replaceProperty>;
  let originalBrowser: PropertyDescriptor | undefined;
  let voices: (typeof australian)[];
  let voiceChange: () => void;
  const speech = {
    getVoices: () => voices,
    speak: jest.fn(),
    cancel: jest.fn(),
    addEventListener: jest.fn((_event: string, listener: () => void) => {
      voiceChange = listener;
    }),
    removeEventListener: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    platform = jest.replaceProperty(Platform, 'OS', 'web');
    originalBrowser = Object.getOwnPropertyDescriptor(globalThis, 'window');
    voices = [remote, american, australian];
    Object.defineProperty(globalThis, 'window', {
      configurable: true,
      value: {
        speechSynthesis: speech,
        SpeechSynthesisUtterance: class {
          constructor(readonly text: string) {}
        },
      },
    });
  });

  afterEach(() => {
    stopNumberPicnicNarration();
    if (originalBrowser) Object.defineProperty(globalThis, 'window', originalBrowser);
    else Reflect.deleteProperty(globalThis, 'window');
    platform.restore();
  });

  it('speaks only successful new counts, at the selected volume, and clears speech on mute', () => {
    const { result, rerender } = renderHook(
      ({ soundEnabled }: { soundEnabled: boolean }) =>
        useNumberPicnicGame('6-10', {
          rng: () => 0,
          spokenCounting: true,
          settings: { soundEnabled, language: 'en-AU', soundVolume: 0.2 },
        }),
      { initialProps: { soundEnabled: true } },
    );

    const [first, second, third] = result.current.blanketItemIds;
    act(() => {
      result.current.handleItemDrop(first);
      result.current.handleItemDrop(first);
      result.current.handleItemDrop(second);
    });
    expect(speech.speak.mock.calls.map(([utterance]) => utterance.text)).toEqual(['1', '2']);
    expect(speech.speak).toHaveBeenLastCalledWith(
      expect.objectContaining({ voice: australian, lang: 'en-AU', volume: 0.2 }),
    );

    rerender({ soundEnabled: false });
    expect(speech.cancel).toHaveBeenCalledTimes(1);
    act(() => result.current.handleItemDrop(third));
    expect(result.current.basketCount).toBe(3);
    expect(speech.speak).toHaveBeenCalledTimes(2);
  });

  it('updates availability when offline voices arrive and skips speech at zero volume', () => {
    voices = [remote];
    const availability = renderHook(() => useNumberPicnicSpeechAvailable('en-AU'));
    expect(availability.result.current).toBe(false);
    voices = [remote, american];
    act(() => voiceChange());
    expect(availability.result.current).toBe(true);

    const game = renderHook(() =>
      useNumberPicnicGame('6-10', {
        spokenCounting: true,
        settings: { soundEnabled: true, soundVolume: 0 },
      }),
    );
    act(() => game.result.current.handleItemDrop(game.result.current.blanketItemIds[0]));
    expect(game.result.current.basketCount).toBe(1);
    expect(speech.speak).not.toHaveBeenCalled();
  });
});
