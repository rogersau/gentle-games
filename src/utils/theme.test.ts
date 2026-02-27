import { getThemeColors, resolveThemeMode } from './theme';

jest.mock('../context/SettingsContext', () => ({
  useSettings: () => ({
    settings: {
      colorMode: 'system',
    },
  }),
}));

describe('theme utilities', () => {
  it('resolves explicit color mode overrides', () => {
    expect(resolveThemeMode('light', 'dark')).toBe('light');
    expect(resolveThemeMode('dark', 'light')).toBe('dark');
  });

  it('resolves system mode from color scheme', () => {
    expect(resolveThemeMode('system', 'dark')).toBe('dark');
    expect(resolveThemeMode('system', 'light')).toBe('light');
    expect(resolveThemeMode('system', null)).toBe('light');
  });

  it('returns a palette with gameplay surface color', () => {
    expect(getThemeColors('light').surfaceGame).toBeTruthy();
    expect(getThemeColors('dark').surfaceGame).toBeTruthy();
    expect(getThemeColors('dark').surfaceGame).not.toBe(getThemeColors('light').surfaceGame);
  });
});

