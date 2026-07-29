import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { PicnicBasket } from './PicnicBasket';

jest.mock('../../utils/theme', () => ({
  useThemeColors: () => ({
    colors: {
      surface: '#FFFFFF',
      border: '#E8E4E1',
      primary: '#A8D8EA',
      success: '#B8E6B8',
      danger: '#E8A0A0',
      text: '#5A5A5A',
      textLight: '#8A8A8A',
    },
  }),
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) =>
      options ? `${key}:${String(options.index ?? options.count ?? '')}` : key,
  }),
}));

describe('PicnicBasket', () => {
  it('shows the exact count and exposes each placed item as a remove control', () => {
    const onItemPress = jest.fn();
    const { getByText, getByTestId } = render(
      <PicnicBasket
        items={['🍎', '🍎']}
        itemIds={[3, 7]}
        targetCount={3}
        onPress={jest.fn()}
        onItemPress={onItemPress}
      />,
    );

    expect(getByText('2/3')).toBeTruthy();
    fireEvent.press(getByTestId('picnic-placed-item-7'));
    expect(onItemPress).toHaveBeenCalledWith(7);
  });

  it('does not auto-advance after completion', () => {
    const onAnimationComplete = jest.fn();
    const { getByText } = render(
      <PicnicBasket
        items={['🍎']}
        targetCount={1}
        onPress={jest.fn()}
        isSuccess
        onAnimationComplete={onAnimationComplete}
      />,
    );

    expect(getByText('1/1')).toBeTruthy();
    expect(onAnimationComplete).not.toHaveBeenCalled();
  });

  it('does not present prefilled items as remove controls', () => {
    const onItemPress = jest.fn();
    const { getByTestId } = render(
      <PicnicBasket
        items={['🍎', '🍎']}
        itemIds={[0, 1]}
        removableItemIds={[1]}
        targetCount={3}
        onPress={jest.fn()}
        onItemPress={onItemPress}
      />,
    );

    expect(getByTestId('picnic-placed-item-0').props.accessibilityRole).toBeUndefined();
    fireEvent.press(getByTestId('picnic-placed-item-1'));
    expect(onItemPress).toHaveBeenCalledWith(1);
  });
});
