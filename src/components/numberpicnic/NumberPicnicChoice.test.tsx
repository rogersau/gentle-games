import React from 'react';
import { render } from '@testing-library/react-native';
import { NumberPicnicChoice } from './NumberPicnicChoice';
import { createNumberPicnicRepresentation } from '../../utils/numberPicnicLogic';

const choice = {
  id: 'choice-0',
  quantity: 4,
  numeral: 4,
  representation: createNumberPicnicRepresentation(4),
};

describe('NumberPicnicChoice', () => {
  it('shows a quantity pattern without a visible answer label or numeral', () => {
    const screen = render(
      <NumberPicnicChoice
        choice={choice}
        display='quantity'
        label='Group showing 4 items'
        accessibilityHint='Choose this group'
        onPress={jest.fn()}
      />,
    );

    expect(screen.queryByText('Group showing 4 items')).toBeNull();
    expect(screen.queryByText('4')).toBeNull();
    expect(screen.getByText('🟢 🟢 🟢 🟢')).toBeTruthy();
  });

  it('shows only the numeral for a numeral-matching choice', () => {
    const screen = render(
      <NumberPicnicChoice
        choice={choice}
        display='numeral'
        label='Numeral 4'
        accessibilityHint='Choose this numeral'
        onPress={jest.fn()}
      />,
    );

    expect(screen.getByText('4')).toBeTruthy();
    expect(screen.queryByText('🟢 🟢 🟢 🟢')).toBeNull();
  });
});
