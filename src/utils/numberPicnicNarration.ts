import { speakOffline, stopOfflineNarration, useOfflineSpeechAvailable } from './offlineNarration';

export interface NumberPicnicNarrationOptions {
  spokenCounting: boolean;
  soundEnabled: boolean;
  volume: number;
  locale: string;
  narrate?: (count: number) => void;
}

const owner = Symbol('number-picnic');

export const useNumberPicnicSpeechAvailable = useOfflineSpeechAvailable;
export const stopNumberPicnicNarration = () => stopOfflineNarration(owner);

export const narrateNumberPicnicCount = (
  count: number,
  options: NumberPicnicNarrationOptions,
): void => {
  if (!options.spokenCounting || !options.soundEnabled || options.volume <= 0) return;
  if (options.narrate) {
    options.narrate(count);
    return;
  }
  speakOffline(String(count), options.locale, options.volume, owner, true);
};
