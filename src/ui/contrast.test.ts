import { DARK_PASTEL_COLORS, PASTEL_COLORS } from '../types';
import { ON_ACCENT_TEXT, SWITCH_ON_THUMB, SWITCH_ON_TRACK } from './tokens';

const luminance = (hex: string) => {
  const channels = hex
    .slice(1)
    .match(/../g)!
    .map((channel) => {
      const value = parseInt(channel, 16) / 255;
      return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
    });
  return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
};

const contrast = (foreground: string, background: string) => {
  const values = [luminance(foreground), luminance(background)].sort((a, b) => b - a);
  return (values[0] + 0.05) / (values[1] + 0.05);
};

describe.each([
  ['light', PASTEL_COLORS, PASTEL_COLORS.text],
  ['dark', DARK_PASTEL_COLORS, ON_ACCENT_TEXT],
] as const)('%s theme readability', (_name, colors, primaryButtonText) => {
  it.each([
    ['skyInk', 'sky'],
    ['lavenderInk', 'lavender'],
    ['sageInk', 'sage'],
    ['peachInk', 'peach'],
    ['text', 'background'],
    ['text', 'surface'],
    ['textLight', 'background'],
    ['textLight', 'surfaceGame'],
    ['textLight', 'sunken'],
    ['text', 'rose'],
    ['text', 'butter'],
  ] as const)('gives %s text on %s at least 4.5:1 contrast', (ink, fill) => {
    expect(contrast(colors[ink], colors[fill])).toBeGreaterThanOrEqual(4.5);
  });

  it('keeps the primary button label readable', () => {
    expect(contrast(primaryButtonText, colors.primary)).toBeGreaterThanOrEqual(4.5);
  });

  it('keeps the switch track, switch thumb and selected border perceivable', () => {
    expect(contrast(colors.outline, colors.background)).toBeGreaterThanOrEqual(3);
    expect(contrast(colors.outline, colors.surface)).toBeGreaterThanOrEqual(3);
    expect(contrast(colors.skyInk, colors.surface)).toBeGreaterThanOrEqual(3);
    expect(contrast(colors.skyInk, colors.sky)).toBeGreaterThanOrEqual(3);
    expect(contrast(SWITCH_ON_THUMB, SWITCH_ON_TRACK)).toBeGreaterThanOrEqual(3);
  });
});
