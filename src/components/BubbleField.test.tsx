import React, { Profiler } from 'react';
import { act, fireEvent, render } from '@testing-library/react-native';
import { AccessibilityInfo, PanResponder, View } from 'react-native';
import { Circle, Text as SvgText } from 'react-native-svg';
import { BubbleField } from './BubbleField';

jest.mock('../utils/theme', () => ({
  useThemeColors: () => ({
    colors: {
      background: '#FFFEF7',
      cardBack: '#E8E4E1',
      cardFront: '#FFFFFF',
      text: '#5A5A5A',
      textLight: '#8A8A8A',
      primary: '#A8D8EA',
      secondary: '#FFB6C1',
      success: '#B8E6B8',
      matched: '#D3D3D3',
      surfaceGame: '#FFFFFF',
    },
    resolvedMode: 'light',
    colorMode: 'light',
  }),
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      if (key === 'games.bubblePop.accessibility') {
        return 'Bubble field';
      }
      if (key === 'games.bubblePop.pop') {
        return 'POP';
      }
      return key;
    },
  }),
}));

jest.mock('../utils/bubbleLogic', () => {
  const makeBubble = (id: string, x: number, y: number) => ({
    id,
    x,
    y,
    radius: 20,
    targetRadius: 20,
    growthPerSecond: 0,
    speed: 12,
    color: '#A8D8EA',
    opacity: 0.5,
  });

  let nextBubbleIndex = 0;
  const createBubble = () => {
    const index = nextBubbleIndex++;
    return makeBubble(`bubble-${index}`, 60 + index * 70, 70 + index * 25);
  };

  return {
    ensureMinimumBubbles: (
      existing: ReturnType<typeof createBubble>[],
      minimum: number,
      _width: number,
      _height: number,
      maxBubbles: number,
    ) => {
      const next = [...existing];
      while (next.length < minimum && next.length < maxBubbles) {
        next.push(createBubble());
      }
      return next.slice(0, maxBubbles);
    },
    spawnBubbles: (
      existing: ReturnType<typeof createBubble>[],
      count: number,
      _width: number,
      _height: number,
    ) => {
      const next = [...existing];
      for (let index = 0; index < count; index += 1) {
        next.push(createBubble());
      }
      return next;
    },
    stepBubbles: (existing: ReturnType<typeof createBubble>[], deltaSeconds: number) =>
      existing.map((bubble) => ({
        ...bubble,
        y: bubble.y + deltaSeconds * bubble.speed,
      })),
  };
});

describe('BubbleField', () => {
  const originalRequestAnimationFrame = globalThis.requestAnimationFrame;
  const originalCancelAnimationFrame = globalThis.cancelAnimationFrame;

  let frameCallbacks = new Map<number, FrameRequestCallback>();
  let nextFrameId = 0;

  const advanceFrame = (time: number) => {
    const callback = frameCallbacks.get(nextFrameId - 1);
    expect(callback).toBeDefined();
    act(() => {
      callback?.(time);
    });
  };

  const getBubbleCircles = (screen: ReturnType<typeof render>) =>
    screen.UNSAFE_root.findAllByType(Circle).filter(
      (node: any) => node.props.strokeWidth === 2 && node.props.fill !== 'none',
    );

  const getPopIndicators = (screen: ReturnType<typeof render>) =>
    screen.UNSAFE_root.findAllByType(Circle).filter(
      (node: any) => node.props.strokeWidth === 2 && node.props.fill === 'none',
    );

  const getPopIndicatorLabels = (screen: ReturnType<typeof render>) =>
    screen.UNSAFE_root.findAllByType(SvgText);

  beforeAll(() => {
    globalThis.requestAnimationFrame = jest.fn((callback: FrameRequestCallback) => {
      const frameId = nextFrameId++;
      frameCallbacks.set(frameId, callback);
      return frameId;
    }) as typeof globalThis.requestAnimationFrame;
    globalThis.cancelAnimationFrame = jest.fn((frameId: number) => {
      frameCallbacks.delete(frameId);
    }) as typeof globalThis.cancelAnimationFrame;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    frameCallbacks = new Map();
    nextFrameId = 0;
    jest
      .spyOn(PanResponder, 'create')
      .mockImplementation((handlers: any) => ({ panHandlers: handlers }) as any);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  afterAll(() => {
    globalThis.requestAnimationFrame = originalRequestAnimationFrame;
    globalThis.cancelAnimationFrame = originalCancelAnimationFrame;
  });

  it('keeps minimum bubbles and publishes spawned bubbles as frames advance', () => {
    const screen = render(
      <BubbleField
        width={240}
        height={220}
        minActiveBubbles={2}
        maxActiveBubbles={4}
        spawnIntervalMs={100}
      />,
    );

    expect(getBubbleCircles(screen)).toHaveLength(2);

    advanceFrame(0);
    advanceFrame(50);
    advanceFrame(100);
    advanceFrame(150);

    expect(getBubbleCircles(screen)).toHaveLength(3);
  });

  it('cancels its animation frame on unmount even when the first frame id is zero', () => {
    const screen = render(
      <BubbleField width={240} height={220} minActiveBubbles={1} maxActiveBubbles={2} />,
    );

    screen.unmount();

    expect(globalThis.cancelAnimationFrame).toHaveBeenCalledWith(0);
  });

  it('activates accessible buttons when a screen reader is enabled', async () => {
    jest.spyOn(AccessibilityInfo, 'isScreenReaderEnabled').mockResolvedValue(true);
    jest.spyOn(AccessibilityInfo, 'addEventListener').mockReturnValue({ remove: jest.fn() } as any);

    const screen = render(
      <BubbleField width={240} height={220} minActiveBubbles={2} maxActiveBubbles={3} />,
    );
    await act(async () => {
      await Promise.resolve();
    });

    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(2);
    expect(buttons[0].props.accessibilityLabel).toBe('games.bubblePop.bubbleAccessibilityLabel');
    expect(buttons[0].props.accessibilityHint).toBe('games.bubblePop.bubbleAccessibilityHint');
    expect(screen.UNSAFE_root.findAll((node: any) => typeof node.props.onPanResponderRelease === 'function')).toHaveLength(0);
  });

  it('uses accessible buttons when reduced-motion disables bubble movement', () => {
    const screen = render(
      <BubbleField width={240} height={220} minActiveBubbles={2} maxActiveBubbles={3} motionEnabled={false} />,
    );

    expect(screen.getAllByRole('button')).toHaveLength(2);
  });

  it('lets keyboard and switch users explicitly enable stationary buttons', () => {
    const screen = render(
      <BubbleField width={240} height={220} minActiveBubbles={2} maxActiveBubbles={3} />,
    );

    const toggle = screen.getByTestId('bubble-accessible-mode-toggle');
    expect(toggle.props.accessibilityState).toEqual({ selected: false });
    fireEvent.press(toggle);

    expect(screen.getAllByTestId(/^bubble-button-/)).toHaveLength(2);
    expect(screen.getByTestId('bubble-accessible-mode-toggle').props.accessibilityState).toEqual({
      selected: true,
    });
  });

  it('exposes stationary large buttons and shared pop behavior in accessible mode', () => {
    const onBubblePop = jest.fn();
    const screen = render(
      <BubbleField
        width={240}
        height={220}
        minActiveBubbles={2}
        maxActiveBubbles={3}
        motionEnabled={false}
        accessibleMode
        onBubblePop={onBubblePop}
      />,
    );

    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(2);
    expect(buttons[0].props.accessibilityRole).toBe('button');
    expect(buttons[0].props.accessibilityHint).toBe('games.bubblePop.bubbleAccessibilityHint');
    expect(buttons[0].props.style).toEqual(
      expect.arrayContaining([expect.objectContaining({ width: 64, height: 64 })]),
    );

    fireEvent.press(buttons[0]);
    expect(onBubblePop).toHaveBeenCalledTimes(1);
    expect(screen.getAllByRole('button')).toHaveLength(2);
    expect(screen.getByLabelText('games.bubblePop.newBubbleAnnouncement')).toBeTruthy();
  });

  it('does not commit a React render for every animation frame', () => {
    const commits: Array<string> = [];
    const screen = render(
      <Profiler id='bubble-field' onRender={() => commits.push('commit')}>
        <BubbleField
          width={240}
          height={220}
          minActiveBubbles={2}
          maxActiveBubbles={4}
          spawnIntervalMs={10_000}
        />
      </Profiler>,
    );

    for (let frame = 0; frame < 20; frame += 1) {
      advanceFrame(frame * 16);
    }

    expect(commits.length).toBeLessThanOrEqual(3);
    screen.unmount();
  });

  it('removes the tapped bubble, creates an indicator, and calls onBubblePop', () => {
    const onBubblePop = jest.fn();
    const screen = render(
      <BubbleField
        width={240}
        height={220}
        minActiveBubbles={1}
        maxActiveBubbles={2}
        onBubblePop={onBubblePop}
      />,
    );

    const touchLayer = screen
      .UNSAFE_getAllByType(View)
      .find((node) => typeof node.props.onPanResponderRelease === 'function');

    expect(getBubbleCircles(screen).length).toBeGreaterThan(0);

    const firstBubble = getBubbleCircles(screen)[0];
    const tappedBubblePosition = {
      x: firstBubble.props.cx,
      y: firstBubble.props.cy,
    };

    act(() => {
      touchLayer?.props.onPanResponderRelease({
        nativeEvent: {
          locationX: tappedBubblePosition.x,
          locationY: tappedBubblePosition.y,
        },
      });
    });

    expect(onBubblePop).toHaveBeenCalledTimes(1);
    expect(
      getBubbleCircles(screen).some(
        (node: any) =>
          node.props.cx === tappedBubblePosition.x && node.props.cy === tappedBubblePosition.y,
      ),
    ).toBe(false);
    expect(getBubbleCircles(screen)).toHaveLength(1);
    expect(getPopIndicators(screen)).toHaveLength(1);
    expect(getPopIndicatorLabels(screen)).toHaveLength(1);
  });
});
