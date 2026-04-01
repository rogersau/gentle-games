import { renderHook, waitFor } from '@testing-library/react-native';
import { AccessibilityInfo } from 'react-native';
import { useReducedMotion } from './theme';

let mockSettings = {
  colorMode: 'system' as const,
  reducedMotionEnabled: false,
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
      colorMode: 'system',
      reducedMotionEnabled: false,
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
    mockSettings.reducedMotionEnabled = true;
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
