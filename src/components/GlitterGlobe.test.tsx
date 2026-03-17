import React, { createRef } from 'react';
import { act, render, waitFor } from '@testing-library/react-native';
import { PanResponder, View } from 'react-native';
import { Accelerometer } from 'expo-sensors';
import { Circle, Polygon, Rect } from 'react-native-svg';
import { GlitterGlobe, GlitterGlobeRef, resolveParticleCollisions } from './GlitterGlobe';

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
        return 'Glitter globe, shake or swipe to interact';
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

  const getWakeRipples = (screen: ReturnType<typeof render>) =>
    screen.UNSAFE_root
      .findAllByType(Circle)
      .filter((node: any) => node.props.fill === 'none' && node.props.strokeWidth === 1.5);

  const getParticleNodes = (screen: ReturnType<typeof render>) => [
    ...screen.UNSAFE_root
      .findAllByType(Circle)
      .filter(
        (node: any) =>
          node.props.fill !== 'none' &&
          node.props.fill !== 'url(#globeFill)' &&
          node.props.strokeWidth !== 3
      ),
    ...screen.UNSAFE_root.findAllByType(Rect),
    ...screen.UNSAFE_root.findAllByType(Polygon),
  ];

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
      .mockImplementation((handlers: any) => ({ panHandlers: handlers } as any));
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

    const screen = render(<GlitterGlobe width={220} height={220} initialCount={0} />);

    await waitFor(() => {
      expect(mockAddListener).toHaveBeenCalledTimes(1);
    });

    screen.unmount();

    expect(globalThis.cancelAnimationFrame).toHaveBeenCalledWith(0);
    expect(removeListener).toHaveBeenCalledTimes(1);
  });

  it('keeps imperative add/clear controls and wake ripples working after updates publish together', async () => {
    const ref = createRef<GlitterGlobeRef>();
    const nowSpy = jest.spyOn(Date, 'now');
    nowSpy.mockReturnValueOnce(1000).mockReturnValueOnce(1060);

    const screen = render(<GlitterGlobe width={220} height={220} initialCount={0} ref={ref} />);

    await waitFor(() => {
      expect(ref.current).toBeTruthy();
    });

    expect(getParticleNodes(screen)).toHaveLength(0);
    expect(getWakeRipples(screen)).toHaveLength(0);

    act(() => {
      ref.current?.addGlitter(2);
    });

    expect(getParticleNodes(screen)).toHaveLength(2);

    const touchLayer = screen.UNSAFE_getAllByType(View).find(
      (node) =>
        typeof node.props.onPanResponderGrant === 'function' &&
        typeof node.props.onPanResponderMove === 'function'
    );

    act(() => {
      touchLayer?.props.onPanResponderGrant({
        nativeEvent: {
          locationX: 110,
          locationY: 110,
        },
      });
    });

    expect(getWakeRipples(screen)).toHaveLength(1);

    act(() => {
      touchLayer?.props.onPanResponderMove({
        nativeEvent: {
          locationX: 118,
          locationY: 118,
        },
      });
    });

    expect(getWakeRipples(screen)).toHaveLength(2);

    act(() => {
      ref.current?.clearGlitter();
    });

    expect(getParticleNodes(screen)).toHaveLength(0);
    expect(getWakeRipples(screen)).toHaveLength(0);
  });
});

describe('resolveParticleCollisions', () => {
  const makeParticle = (
    id: number,
    x: number,
    y: number,
    vx: number,
    vy: number,
    radius = 5
  ) => ({
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
