import React from 'react';
import { StyleSheet } from 'react-native';
import { render } from '@testing-library/react-native';
import { NumberPicnicRepresentation } from './NumberPicnicRepresentation';
import { createNumberPicnicRepresentation } from '../../utils/numberPicnicLogic';

jest.mock('react-i18next', () => {
  const actual = jest.requireActual('react-i18next');
  return {
    ...actual,
    useTranslation: () => ({
      t: (key: string, options?: Record<string, unknown>) => {
        if (key.endsWith('spaceCount.one')) return 'space';
        if (key.endsWith('spaceCount.other')) return 'spaces';
        if (key.endsWith('frameAccessibilityLabel')) {
          return `${String(options?.capacity)}-frame with ${String(options?.count)} filled ${String(options?.spaceWord)}`;
        }
        return key;
      },
    }),
  };
});

describe('NumberPicnicRepresentation', () => {
  it('shows the quantity once in the frame without a duplicate dot row', () => {
    const representation = createNumberPicnicRepresentation(7);
    const screen = render(
      <NumberPicnicRepresentation
        representation={representation}
        accessibilityLabel='7 items shown as a numeral, dots, and a frame'
        testID='representation'
      />,
    );

    expect(screen.getByTestId('representation')).toBeTruthy();
    expect(screen.getByText('7')).toBeTruthy();
    expect(screen.queryByText('🟢 🟢 🟢 🟢 🟢 🟢 🟢')).toBeNull();
    expect(screen.getAllByTestId(/representation-cell-/)).toHaveLength(10);
  });

  it('uses singular wording for a frame with one filled space', () => {
    const screen = render(
      <NumberPicnicRepresentation
        representation={createNumberPicnicRepresentation(1)}
        accessibilityLabel='1 item shown'
        testID='single-representation'
      />,
    );

    expect(screen.getByTestId('single-representation').props.accessibilityLabel).toContain(
      '1 filled space',
    );
  });

  it('keeps a ten-frame narrow enough for compact two-column cards', () => {
    const screen = render(
      <NumberPicnicRepresentation
        representation={createNumberPicnicRepresentation(10)}
        accessibilityLabel='10 items'
        testID='compact-representation'
      />,
    );

    const style = StyleSheet.flatten(
      screen.getByTestId('compact-representation-frame').props.style,
    );
    expect(style.width).toBeLessThanOrEqual(110);
  });
});
