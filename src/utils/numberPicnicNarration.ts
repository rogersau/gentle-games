import { useEffect, useState } from 'react';
import { AccessibilityInfo, Platform } from 'react-native';

export interface NumberPicnicNarrationOptions {
  spokenCounting: boolean;
  soundEnabled: boolean;
  volume: number;
  locale: string;
  narrate?: (count: number) => void;
}

const getSpeech = () =>
  Platform.OS === 'web' && typeof window !== 'undefined' && window.SpeechSynthesisUtterance
    ? window.speechSynthesis
    : undefined;

const findOfflineVoice = (speech: SpeechSynthesis, locale: string) => {
  const language = locale.toLowerCase();
  const family = language.split('-')[0];
  const voices = speech.getVoices().filter((voice) => voice.localService);
  return (
    voices.find((voice) => voice.lang.toLowerCase() === language) ??
    voices.find((voice) => voice.lang.toLowerCase().split('-')[0] === family)
  );
};

export const useNumberPicnicSpeechAvailable = (locale: string) => {
  const isAvailable = () => {
    if (Platform.OS !== 'web') return true;
    const speech = getSpeech();
    return Boolean(speech && findOfflineVoice(speech, locale));
  };
  const [available, setAvailable] = useState(isAvailable);
  useEffect(() => {
    const speech = getSpeech();
    const updateAvailability = () =>
      setAvailable(Platform.OS !== 'web' || Boolean(speech && findOfflineVoice(speech, locale)));
    speech?.addEventListener('voiceschanged', updateAvailability);
    updateAvailability();
    return () => speech?.removeEventListener('voiceschanged', updateAvailability);
  }, [locale]);
  return available;
};

const pendingCounts = new Set<SpeechSynthesisUtterance>();

export const stopNumberPicnicNarration = () => {
  if (!pendingCounts.size) return;
  pendingCounts.clear();
  getSpeech()?.cancel();
};

export const narrateNumberPicnicCount = (
  count: number,
  options: NumberPicnicNarrationOptions,
): void => {
  if (!options.spokenCounting || !options.soundEnabled || options.volume <= 0) return;
  if (options.narrate) {
    options.narrate(count);
    return;
  }
  if (Platform.OS !== 'web') {
    AccessibilityInfo.announceForAccessibility(String(count));
    return;
  }
  const speech = getSpeech();
  const voice = speech && findOfflineVoice(speech, options.locale);
  if (!speech || !voice) return;

  const utterance = new window.SpeechSynthesisUtterance(String(count));
  utterance.voice = voice;
  utterance.lang = voice.lang;
  utterance.volume = options.volume;
  utterance.onend = utterance.onerror = () => pendingCounts.delete(utterance);
  pendingCounts.add(utterance);
  try {
    speech.speak(utterance);
  } catch {
    pendingCounts.delete(utterance);
  }
};
