import React from 'react';
import { StyleSheet } from 'react-native';
import { render } from '@testing-library/react-native';
import { NumberPicnicRepresentation } from './NumberPicnicRepresentation';
import { createNumberPicnicRepresentation } from '../../utils/numberPicnicLogic';

describe('NumberPicnicRepresentation', () => {
  it('exposes a frame, numeral, dots, and an accessible quantity label', () => {
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
    expect(screen.getByText('🟢 🟢 🟢 🟢 🟢 🟢 🟢')).toBeTruthy();
    expect(screen.getAllByTestId(/representation-cell-/)).toHaveLength(10);
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
