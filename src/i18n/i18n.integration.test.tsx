import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Text } from 'react-native';
import i18n, { resources } from './index';
import type { TranslationKey } from './types';
import { LANGUAGE_OPTIONS } from '../types/i18n';
import { SettingsProvider, useSettings } from '../context/SettingsContext';
import { VolumeControl } from '../ui/components/VolumeControl';

jest.unmock('react-i18next');
jest.unmock('../context/SettingsContext');

function SoundSettings() {
  const { settings, isLoading, updateSettings } = useSettings();
  if (isLoading) return <Text>Loading</Text>;
  return (
    <VolumeControl
      value={settings.soundVolume}
      onValueChange={(soundVolume) => {
        void updateSettings({ soundVolume });
      }}
    />
  );
}

function stringLeaves(value: unknown, prefix = ''): string[] {
  if (typeof value === 'string') return [prefix];
  return Object.entries(value as Record<string, unknown>).flatMap(([key, child]) =>
    stringLeaves(child, prefix ? `${prefix}.${key}` : key),
  );
}

describe('real i18n and settings integration', () => {
  beforeEach(() => jest.clearAllMocks());

  for (const { value: language } of LANGUAGE_OPTIONS) {
    it(`resolves every ${language} translation without falling back to another locale or raw keys`, async () => {
      await i18n.changeLanguage(language);
      for (const key of stringLeaves(resources[language].translation)) {
        expect({ key, exists: i18n.exists(key, { lng: language, fallbackLng: false }) }).toEqual({
          key,
          exists: true,
        });
        expect(typeof i18n.t(key as TranslationKey, { lng: language, fallbackLng: false })).toBe(
          'string',
        );
        expect(i18n.t(key as TranslationKey, { lng: language, fallbackLng: false })).not.toBe(key);
      }
    });

    it(`hydrates ${language} settings and renders interpolated accessible controls using the production providers`, async () => {
      jest
        .mocked(AsyncStorage.getItem)
        .mockResolvedValue(JSON.stringify({ language, soundVolume: 0.4 }));
      const screen = render(
        <SettingsProvider>
          <SoundSettings />
        </SettingsProvider>,
      );
      await waitFor(() => {
        expect(i18n.language).toBe(language);
        expect(screen.getByRole('adjustable', { name: 'Volume 40%' })).toBeTruthy();
        expect(screen.getByRole('button', { name: 'Increase volume' })).toBeTruthy();
      });
      expect(screen.queryByText(/settings\.volume/)).toBeNull();
    });
  }
});
