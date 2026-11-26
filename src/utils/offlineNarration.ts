import { useEffect, useState } from 'react';
import { AppState, Platform } from 'react-native';
import { requireOptionalNativeModule } from 'expo';

type NativeNarration = {
  hasVoice: (locale: string) => Promise<boolean>;
  speak: (text: string, locale: string, volume: number, queue: boolean) => Promise<void>;
  stop: () => Promise<void>;
};

const getNative = () =>
  Platform.OS === 'web' ? null : requireOptionalNativeModule<NativeNarration>('CalmNarration');
const getSpeech = () =>
  Platform.OS === 'web' && typeof window !== 'undefined' && window.SpeechSynthesisUtterance
    ? window.speechSynthesis
    : undefined;

export const findOfflineVoice = (speech: SpeechSynthesis, locale: string) => {
  const language = locale.toLowerCase();
  const family = language.split('-')[0];
  const voices = speech.getVoices().filter((voice) => voice.localService);
  return (
    voices.find((voice) => voice.lang.toLowerCase() === language) ??
    voices.find((voice) => voice.lang.toLowerCase().split('-')[0] === family)
  );
};

export const useOfflineSpeechAvailable = (locale: string, enabled = true) => {
  const [availableLocale, setAvailableLocale] = useState<string | null>(null);
  useEffect(() => {
    if (!enabled) {
      setAvailableLocale(null);
      return;
    }
    const speech = getSpeech();
    const native = getNative();
    let active = true;
    let generation = 0;
    const update = () => {
      const current = ++generation;
      const report = (available: boolean) => {
        if (active && current === generation) setAvailableLocale(available ? locale : null);
      };
      if (speech) report(!!findOfflineVoice(speech, locale));
      else if (native) void native.hasVoice(locale).then(report, () => report(false));
      else report(false);
    };
    speech?.addEventListener('voiceschanged', update);
    const app = native
      ? AppState.addEventListener('change', (state) => {
          if (state === 'active') update();
        })
      : undefined;
    update();
    return () => {
      active = false;
      speech?.removeEventListener('voiceschanged', update);
      app?.remove();
    };
  }, [locale, enabled]);
  return enabled && availableLocale === locale;
};

let activeOwner: symbol | undefined;

export const stopOfflineNarration = (owner: symbol) => {
  if (activeOwner !== owner) return;
  activeOwner = undefined;
  activeUtterance = undefined;
  getSpeech()?.cancel();
  void getNative()
    ?.stop()
    .catch(() => undefined);
};

export const speakOffline = (
  text: string,
  locale: string,
  volume: number,
  owner: symbol,
  queue = false,
) => {
  if (!text || volume <= 0) return;
  const speech = getSpeech();
  if (speech) {
    const voice = findOfflineVoice(speech, locale);
    if (!voice) return;
    if (activeOwner && (!queue || activeOwner !== owner)) stopOfflineNarration(activeOwner);
    activeOwner = owner;
    const utterance = new window.SpeechSynthesisUtterance(text);
    utterance.voice = voice;
    utterance.lang = voice.lang;
    utterance.volume = Math.min(volume, 1);
    utterance.onend = utterance.onerror = () => {
      if (activeUtterance === utterance) {
        activeUtterance = undefined;
        activeOwner = undefined;
      }
    };
    activeUtterance = utterance;
    try {
      speech.speak(utterance);
    } catch {
      activeUtterance = undefined;
      activeOwner = undefined;
    }
  } else {
    const native = getNative();
    if (!native) return;
    if (activeOwner && activeOwner !== owner) stopOfflineNarration(activeOwner);
    activeOwner = owner;
    void native.speak(text, locale, Math.min(volume, 1), queue).catch(() => undefined);
  }
};

let activeUtterance: SpeechSynthesisUtterance | undefined;
