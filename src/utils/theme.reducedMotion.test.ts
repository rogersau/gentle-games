import { renderHook, waitFor } from '@testing-library/react-native';
import { AccessibilityInfo } from 'react-native';
import { useReducedMotion } from './theme';

let mockSettings = {
  movement: 'gentle',
  colorMode: 'system' as const,
};

jest.mock('../context/SettingsContext', () => ({
  useSettings: () => ({
    settings: mockSettings,
  }),
}));

describe('useReducedMotion', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSettings = {
      movement: 'gentle',
      colorMode: 'system',
    };
  });

  it('uses system reduced-motion preference when user setting is off', async () => {
    jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(true);
    jest.spyOn(AccessibilityInfo, 'addEventListener').mockReturnValue({
      remove: jest.fn(),
    } as any);

    const { result } = renderHook(() => useReducedMotion());

    await waitFor(() => {
      expect(result.current).toBe(true);
    });
  });

  it('returns true when user explicitly enables reduced motion', async () => {
    mockSettings.movement = 'still';
    jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(false);
    jest.spyOn(AccessibilityInfo, 'addEventListener').mockReturnValue({
      remove: jest.fn(),
    } as any);

    const { result } = renderHook(() => useReducedMotion());

    await waitFor(() => {
      expect(result.current).toBe(true);
    });
  });

  it('handles platform query failures gracefully', async () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockRejectedValue(new Error('fail'));
    jest.spyOn(AccessibilityInfo, 'addEventListener').mockReturnValue({
      remove: jest.fn(),
    } as any);

    const { result } = renderHook(() => useReducedMotion());

    await waitFor(() => {
      expect(warnSpy).toHaveBeenCalledWith(
        'Unable to read system reduced motion preference.',
        expect.any(Error),
      );
      expect(result.current).toBe(false);
    });
  });
});
