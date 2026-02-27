import React from 'react';
import { render } from '@testing-library/react-native';
import { PanResponder, View } from 'react-native';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { GlitterGlobe } from './GlitterGlobe';

const mockIsAvailableAsync: jest.MockedFunction<() => Promise<boolean>> = jest.fn();
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

describe('GlitterGlobe', () => {
  const originalRequestAnimationFrame = globalThis.requestAnimationFrame;
  const originalCancelAnimationFrame = globalThis.cancelAnimationFrame;

  beforeAll(() => {
    globalThis.requestAnimationFrame = jest.fn(() => 1) as typeof globalThis.requestAnimationFrame;
    globalThis.cancelAnimationFrame = jest.fn() as typeof globalThis.cancelAnimationFrame;
  });

  afterAll(() => {
    globalThis.requestAnimationFrame = originalRequestAnimationFrame;
    globalThis.cancelAnimationFrame = originalCancelAnimationFrame;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockIsAvailableAsync.mockResolvedValue(false);
    mockAddListener.mockReturnValue({ remove: jest.fn() });
    jest
      .spyOn(PanResponder, 'create')
      .mockImplementation((handlers: any) => ({ panHandlers: handlers } as any));
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('reads nativeEvent only once in grant handler', () => {
    const screen = render(<GlitterGlobe width={320} height={320} />);

    const touchLayer = screen
      .UNSAFE_getAllByType(View)
      .find((node) => typeof node.props.onPanResponderGrant === 'function');

    expect(touchLayer).toBeTruthy();

    let canReadNativeEvent = true;
    const pooledEvent: { nativeEvent?: { locationX: number; locationY: number } | null } = {};

    Object.defineProperty(pooledEvent, 'nativeEvent', {
      get: () => {
        if (!canReadNativeEvent) {
          return null;
        }
        canReadNativeEvent = false;
        return {
          locationX: 160,
          locationY: 160,
        };
      },
    });

    expect(() => touchLayer?.props.onPanResponderGrant(pooledEvent)).not.toThrow();
  });
});
