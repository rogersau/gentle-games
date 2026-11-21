import React from 'react';
import { render } from '@testing-library/react-native';
import { NumberPicnicChoice } from './NumberPicnicChoice';
import { createNumberPicnicRepresentation } from '../../utils/numberPicnicLogic';

const representation = createNumberPicnicRepresentation(4);

describe('NumberPicnicChoice', () => {
  it('shows a quantity pattern without a visible answer label or numeral', () => {
    const screen = render(
      <NumberPicnicChoice
        representation={representation}
        display='quantity'
        label='Group showing 4 items'
        accessibilityHint='Choose this group'
        onPress={jest.fn()}
        testID='quantity-choice'
      />,
    );

    expect(screen.queryByText('Group showing 4 items')).toBeNull();
    expect(screen.queryByText('4')).toBeNull();
    expect(
      screen.getByTestId('quantity-choice-representation', { includeHiddenElements: true }),
    ).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Group showing 4 items' })).toBeTruthy();
    expect(screen.queryByRole('image')).toBeNull();
    expect(screen.queryByText(/🟢/)).toBeNull();
  });

  it('shows only the numeral for a numeral-matching choice', () => {
    const screen = render(
      <NumberPicnicChoice
        representation={representation}
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
