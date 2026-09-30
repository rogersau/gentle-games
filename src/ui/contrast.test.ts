import { DARK_PASTEL_COLORS, PASTEL_COLORS } from '../types';
import { ON_ACCENT_TEXT } from './tokens';

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
  ['light', PASTEL_COLORS],
  ['dark', DARK_PASTEL_COLORS],
] as const)('%s theme readability', (_name, colors) => {
  it.each(['primary', 'secondary', 'danger'] as const)(
    'keeps %s button labels readable',
    (fill) => {
      expect(contrast(ON_ACCENT_TEXT, colors[fill])).toBeGreaterThanOrEqual(4.5);
    },
  );
  it('keeps secondary instructions readable on game surfaces', () => {
    expect(contrast(colors.textLight, colors.background)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(colors.textLight, colors.surfaceGame)).toBeGreaterThanOrEqual(4.5);
  });
});
