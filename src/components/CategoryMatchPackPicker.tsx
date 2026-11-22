import React from 'react';
import { useTranslation } from 'react-i18next';
import { useSettings } from '../context/SettingsContext';
import { getGameSettings } from '../games/settings';
import { SegmentedControl } from '../ui/components/SegmentedControl';

export function CategoryMatchPackPicker() {
  const { t } = useTranslation();
  const { settings, updateGameSettings } = useSettings();
  const { pack } = getGameSettings(settings, 'category-match');
  return (
    <SegmentedControl
      wrap
      options={(['everyday', 'town', 'outdoors'] as const).map((value) => ({
        value,
        label: t(`settings.categoryMatch.pack.${value}`),
      }))}
      value={pack}
      onValueChange={(pack) => updateGameSettings('category-match', { pack })}
    />
  );
}
