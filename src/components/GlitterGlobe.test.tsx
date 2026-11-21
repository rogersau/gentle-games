import React, { createRef } from 'react';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import { PanResponder, View } from 'react-native';
import { Circle, Polygon, Rect } from 'react-native-svg';
import { GlitterGlobe, GlitterGlobeRef, resolveParticleCollisions } from './GlitterGlobe';
import { GLITTER_PRESETS } from '../games/glitterSettings';

const mockIsAvailableAsync = jest.fn<Promise<boolean>, []>();
const mockSetUpdateInterval = jest.fn();
const mockAddListener = jest.fn();

jest.mock('expo-sensors', () => ({
  Accelerometer: {
    isAvailableAsync: () => mockIsAvailableAsync(),
    setUpdateInterval: (...args: unknown[]) => mockSetUpdateInterval(...args),
    addListener: (...args: unknown[]) => mockAddListener(...args),
  },
}));

jest.mock('../utils/theme', () => ({
  useReducedMotion: () => false,
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
      if (key === 'games.glitterFall.accessibility') {
        return 'Glitter globe';
      }
      return key;
    },
  }),
}));

describe('GlitterGlobe', () => {
  const originalMathRandom = Math.random;
  const originalRequestAnimationFrame = globalThis.requestAnimationFrame;
  const originalCancelAnimationFrame = globalThis.cancelAnimationFrame;

  let frameCallbacks = new Map<number, FrameRequestCallback>();
  let nextFrameId = 0;

  const getWakeRipples = (
    screen: ReturnType<typeof render>,
  ): { props: React.ComponentProps<typeof Circle> }[] =>
    screen.UNSAFE_root.findAllByType(Circle).filter(
      (node: any) => node.props.fill === 'none' && node.props.strokeWidth === 1.5,
    );

  const getParticleNodes = (screen: ReturnType<typeof render>) => [
    ...screen.UNSAFE_root.findAllByType(Circle).filter(
      (node: any) => node.props.fill && node.props.fill !== 'none' && node.props.strokeWidth !== 3,
    ),
    ...screen.UNSAFE_root.findAllByType(Rect),
    ...screen.UNSAFE_root.findAllByType(Polygon),
  ];

  const getTouchLayer = (screen: ReturnType<typeof render>) =>
    screen.UNSAFE_getAllByType(View).find((node) => node.props.onPanResponderGrant);

  const touch = (x: number, y: number) => ({ nativeEvent: { locationX: x, locationY: y } });

  const advanceFrame = (timestamp: number) => {
    act(() => {
      const callbacks = [...frameCallbacks.values()];
      frameCallbacks.clear();
      callbacks.forEach((callback) => callback(timestamp));
    });
  };

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
    Math.random = jest.fn(() => 0);
    mockIsAvailableAsync.mockResolvedValue(false);
    mockAddListener.mockReturnValue({ remove: jest.fn() });
    jest
      .spyOn(PanResponder, 'create')
      .mockImplementation((handlers: any) => ({ panHandlers: handlers }) as any);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  afterAll(() => {
    Math.random = originalMathRandom;
    globalThis.requestAnimationFrame = originalRequestAnimationFrame;
    globalThis.cancelAnimationFrame = originalCancelAnimationFrame;
  });

  it('cleans up its animation frame and accelerometer listener on unmount', async () => {
    const removeListener = jest.fn();
    mockIsAvailableAsync.mockResolvedValue(true);
    mockAddListener.mockReturnValue({ remove: removeListener });

    const screen = render(
      <GlitterGlobe width={220} height={220} initialCount={0} config={GLITTER_PRESETS.full} />,
    );

    await waitFor(() => {
      expect(mockAddListener).toHaveBeenCalledTimes(1);
    });

    screen.unmount();

    expect(globalThis.cancelAnimationFrame).toHaveBeenCalledWith(0);
    expect(removeListener).toHaveBeenCalledTimes(1);
  });

  it('skips accelerometer setup when the sensor is unavailable', async () => {
    const screen = render(
      <GlitterGlobe width={220} height={220} initialCount={0} config={GLITTER_PRESETS.full} />,
    );

    await waitFor(() => {
      expect(mockIsAvailableAsync).toHaveBeenCalledTimes(1);
    });

    expect(mockAddListener).not.toHaveBeenCalled();
    screen.unmount();
  });

  it('recolors existing pieces and applies the quieter density when changing styles', () => {
    Math.random = jest.fn(() => 0.9);
    const screen = render(
      <GlitterGlobe width={220} height={220} config={GLITTER_PRESETS.full} reducedMotion />,
    );
    expect(getParticleNodes(screen)).toHaveLength(68);
    expect(getParticleNodes(screen)[0].props.fill).toBe('#FF9E5E');

    screen.rerender(
      <GlitterGlobe width={220} height={220} config={GLITTER_PRESETS.settle} reducedMotion />,
    );
    const remaining = getParticleNodes(screen);
    expect(remaining).toHaveLength(10);
    expect(remaining.map((particle) => particle.props.fill)).toEqual(Array(10).fill('#FF5D8F'));
  });

  it.each([{ reducedMotion: true }, { motionEnabled: false }])(
    'lets children add still glitter when the motion policy is %p',
    (motionProps) => {
      const ref = createRef<GlitterGlobeRef>();
      const screen = render(
        <GlitterGlobe
          width={220}
          height={220}
          ref={ref}
          config={GLITTER_PRESETS.full}
          {...motionProps}
        />,
      );

      act(() => {
        ref.current?.addGlitter(2);
      });

      expect(screen.getByRole('image', { name: 'Glitter globe' })).toBeTruthy();
      fireEvent.press(screen.getByTestId('glitter-still-surface'), touch(100, 100));
      expect(getParticleNodes(screen)).toHaveLength(71);
      fireEvent.press(screen.getByTestId('glitter-still-surface'), touch(0, 0));
      expect(getParticleNodes(screen)).toHaveLength(71);
      fireEvent.press(screen.getByTestId('glitter-still-surface'), {
        nativeEvent: { offsetX: 120, offsetY: 90 },
      });
      expect(getParticleNodes(screen)).toHaveLength(72);
      expect(getTouchLayer(screen)).toBeUndefined();
      expect(getWakeRipples(screen)).toHaveLength(0);
      expect(frameCallbacks.size).toBe(0);
      expect(mockIsAvailableAsync).not.toHaveBeenCalled();
    },
  );

  it('reacts to a gentle tap in the default style and leaves corner touches for scrolling', () => {
    const onInteraction = jest.fn();
    const screen = render(
      <GlitterGlobe width={220} height={220} initialCount={1} onInteraction={onInteraction} />,
    );
    const pan = getTouchLayer(screen)!.props;
    const initialY = getParticleNodes(screen)[0].props.cy;
    expect(pan.onStartShouldSetPanResponder(touch(0, 0))).toBe(false);
    expect(pan.onStartShouldSetPanResponder(touch(75, 75))).toBe(true);

    act(() => pan.onPanResponderGrant(touch(75, 75)));
    advanceFrame(0);
    advanceFrame(34);

    expect(onInteraction).toHaveBeenCalledTimes(1);
    expect(getWakeRipples(screen)).toHaveLength(0);
    expect(getParticleNodes(screen)[0].props.cy).toBeLessThan(initialY);
  });

  it('draws tap and drag ripples in the same batch and fades them after touch ends', () => {
    const ref = createRef<GlitterGlobeRef>();
    const nowSpy = jest.spyOn(Date, 'now');

    const screen = render(
      <GlitterGlobe
        width={220}
        height={220}
        initialCount={0}
        ref={ref}
        config={GLITTER_PRESETS.explore}
      />,
    );

    expect(getParticleNodes(screen)).toHaveLength(0);
    expect(getWakeRipples(screen)).toHaveLength(0);
    const pan = getTouchLayer(screen)!.props;

    act(() => {
      ref.current?.addGlitter(2);
      nowSpy.mockReturnValue(1000);
      pan.onPanResponderGrant(touch(100, 100));
      nowSpy.mockReturnValue(1060);
      pan.onPanResponderMove(touch(108, 108));
      pan.onPanResponderRelease();
    });

    expect(getParticleNodes(screen)).toHaveLength(2);
    expect(getWakeRipples(screen).map((node) => node.props.cx)).toEqual([110, 118]);
    advanceFrame(0);
    advanceFrame(100);
    expect(getWakeRipples(screen)[0].props.opacity).toBeLessThan(0.32);
    for (let timestamp = 200; timestamp <= 500; timestamp += 100) advanceFrame(timestamp);
    expect(getWakeRipples(screen)).toHaveLength(0);

    act(() => ref.current?.clearGlitter());
    expect(getParticleNodes(screen)).toHaveLength(0);
  });

  it('holds the globe still after Settle until the child touches it again', async () => {
    const ref = createRef<GlitterGlobeRef>();
    const removeListener = jest.fn();
    mockIsAvailableAsync.mockResolvedValue(true);
    mockAddListener.mockReturnValue({ remove: removeListener });
    const screen = render(
      <GlitterGlobe
        width={220}
        height={220}
        ref={ref}
        initialCount={1}
        config={GLITTER_PRESETS.full}
      />,
    );
    await waitFor(() => expect(mockAddListener).toHaveBeenCalledTimes(1));

    const pan = getTouchLayer(screen)!.props;
    act(() => pan.onPanResponderGrant(touch(75, 75)));
    act(() => pan.onPanResponderRelease());
    expect(getWakeRipples(screen)).toHaveLength(1);

    act(() => ref.current?.settle());
    expect(frameCallbacks.size).toBe(0);
    expect(getWakeRipples(screen)).toHaveLength(0);
    expect(removeListener).toHaveBeenCalledTimes(1);
    const still = getParticleNodes(screen)[0].props.cy;
    advanceFrame(100);
    expect(getParticleNodes(screen)[0].props.cy).toBe(still);

    act(() => pan.onPanResponderGrant(touch(75, 75)));
    advanceFrame(200);
    advanceFrame(234);
    expect(getParticleNodes(screen)[0].props.cy).toBeLessThan(still);
    await waitFor(() => expect(mockAddListener).toHaveBeenCalledTimes(2));
  });

  it('does not subscribe to shake sensors when the preset disables shake response', async () => {
    render(
      <GlitterGlobe width={220} height={220} initialCount={0} config={GLITTER_PRESETS.settle} />,
    );

    await waitFor(() => {
      expect(mockIsAvailableAsync).not.toHaveBeenCalled();
    });
  });
});

describe('resolveParticleCollisions', () => {
  const makeParticle = (id: number, x: number, y: number, vx: number, vy: number, radius = 5) => ({
    id,
    x,
    y,
    vx,
    vy,
    radius,
    shape: 'circle' as const,
    color: '#FF0000',
    opacity: 1,
  });

  it('separates overlapping particles without producing NaN values', () => {
    const result = resolveParticleCollisions([
      makeParticle(0, 50, 50, -3, 0),
      makeParticle(1, 50, 50, 3, 0),
    ]);

    expect(Number.isNaN(result[0].x)).toBe(false);
    expect(Number.isNaN(result[1].x)).toBe(false);
    expect(result[0].x).not.toBe(result[1].x);
  });
});
