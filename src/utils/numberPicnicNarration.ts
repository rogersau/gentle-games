import { AccessibilityInfo } from 'react-native';

export interface NumberPicnicNarrationOptions {
  spokenCounting: boolean;
  soundEnabled: boolean;
  narrate?: (count: number) => void;
}

export const shouldNarrateNumberPicnicCount = (
  spokenCounting: boolean,
  soundEnabled: boolean,
): boolean => spokenCounting && soundEnabled;

export const narrateNumberPicnicCount = (
  count: number,
  options: NumberPicnicNarrationOptions,
): void => {
  if (!shouldNarrateNumberPicnicCount(options.spokenCounting, options.soundEnabled)) return;
  if (options.narrate) {
    options.narrate(count);
    return;
  }
  AccessibilityInfo.announceForAccessibility(String(count));
};
