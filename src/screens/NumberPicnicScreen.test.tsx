import React from 'react';
import { PanResponder, View } from 'react-native';
import { act, fireEvent, render, within } from '@testing-library/react-native';
import { NumberPicnicScreen } from './NumberPicnicScreen';
import type { NumberPicnicMode, NumberPicnicStage } from '../types';

let mockMode: NumberPicnicMode;
let mockStage: NumberPicnicStage;

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ goBack: jest.fn() }),
}));

jest.mock('../context/SettingsContext', () => ({
  useSettings: () => ({
    settings: {
      animationsEnabled: false,
      reducedMotionEnabled: false,
      gameSettings: {
        'number-picnic': {
          maxQuantity: 5,
          stage: mockStage,
          mode: mockMode,
          spokenCounting: false,
        },
      },
    },
  }),
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) => {
      const { getTranslationSafe } = jest.requireActual('../i18n/types');
      const value: string = getTranslationSafe(key) ?? key;
      return value.replace(/{{(\w+)}}/g, (_, token: string) => String(options?.[token] ?? ''));
    },
  }),
}));

describe('NumberPicnicScreen', () => {
  beforeEach(() => {
    mockMode = 'make-amount';
    mockStage = '1-5';
    jest.spyOn(Math, 'random').mockReturnValue(0);
  });

  afterEach(() => jest.restoreAllMocks());

  it('lets a child fill the basket by touch, undo, and choose when to start the next round', () => {
    jest.spyOn(Math, 'random').mockReturnValueOnce(0).mockReturnValueOnce(0.2);
    const { getByTestId, getByText, queryByTestId } = render(<NumberPicnicScreen />);

    expect(getByText('Make 2 berries in the basket')).toBeTruthy();
    expect(getByText('Tap an item or drag it up to the basket')).toBeTruthy();
    expect(getByTestId('number-picnic-target-representation')).toBeTruthy();

    act(() => {
      fireEvent.press(getByTestId('picnic-item-0'));
      fireEvent.press(getByTestId('picnic-item-1'));
    });
    expect(getByText('2/2').props.accessibilityLabel).toBe('Basket with 2 berries. Target 2.');
    expect(getByTestId('number-picnic-completion-announcement')).toHaveTextContent(
      'You found the right amount.',
    );
    expect(getByTestId('picnic-item-2')).toBeDisabled();

    fireEvent.press(getByTestId('number-picnic-undo'));
    expect(getByText('1/2')).toBeTruthy();
    expect(getByTestId('picnic-item-1')).toBeEnabled();
    expect(queryByTestId('number-picnic-completion-announcement')).toBeNull();

    fireEvent.press(getByTestId('picnic-item-1'));
    fireEvent.press(getByTestId('number-picnic-next'));
    expect(getByText('0/1')).toBeTruthy();
  });

  it('lets a child leave a partially filled picnic in one tap', () => {
    jest.spyOn(Math, 'random').mockReturnValueOnce(0).mockReturnValueOnce(0.2);
    const { getByTestId, getByText } = render(<NumberPicnicScreen />);

    fireEvent.press(getByTestId('picnic-item-0'));
    expect(getByText('1/2')).toBeTruthy();
    fireEvent.press(getByTestId('number-picnic-next'));
    expect(getByText('0/1')).toBeTruthy();
  });

  it('keeps prefilled items in place and restores only the added item with Reset', () => {
    mockMode = 'add-one-more';
    mockStage = '6-10';
    const { getByTestId, getByText, getAllByTestId } = render(<NumberPicnicScreen />);

    expect(getByText('There are 6 berries. Add one more to make 7')).toBeTruthy();
    expect(getByTestId('picnic-placed-item-0').props.accessibilityRole).toBeUndefined();
    expect(getAllByTestId(/^picnic-item-/)).toHaveLength(3);
    fireEvent.press(getByTestId('picnic-item-6'));
    expect(getByText('7/7')).toBeTruthy();
    fireEvent.press(getByTestId('number-picnic-reset'));
    expect(getByText('6/7')).toBeTruthy();
    expect(getByTestId('picnic-item-6')).toBeEnabled();
  });

  it('uses both More or Fewer cards as the answer controls and confirms a correct selection', () => {
    mockMode = 'more-fewer';
    const { getAllByRole, getByRole, getByText, queryByText, queryByTestId } = render(
      <NumberPicnicScreen />,
    );

    const left = getByRole('button', { name: 'Left group showing 1 item' });
    const right = getByRole('button', { name: 'Right group showing 2 items' });
    expect(within(left).getByText('Left group')).toBeTruthy();
    expect(within(right).getByText('Right group')).toBeTruthy();
    expect(getAllByRole('button', { name: /group showing/ })).toHaveLength(2);

    expect(queryByTestId('number-picnic-comparison-example')).toBeNull();
    fireEvent.press(getByRole('button', { name: 'Show an example' }));
    expect(getByRole('image', { name: /six is more/i })).toBeTruthy();
    expect(left).toBeEnabled();
    expect(right).toBeEnabled();
    fireEvent.press(getByRole('button', { name: 'Hide the example' }));
    expect(queryByTestId('number-picnic-comparison-example')).toBeNull();

    fireEvent.press(left);
    expect(getByText('That group does not have more items. You can try again.')).toBeTruthy();
    fireEvent.press(right);
    expect(getByText('You found the right amount.')).toBeTruthy();
    expect(queryByText('That group does not have more items. You can try again.')).toBeNull();
    expect(right).toBeDisabled();
  });

  it('keeps the numeral hidden on the prompt and advances an unfinished guided example in one tap', () => {
    mockMode = 'match-numeral';
    jest.spyOn(Math, 'random').mockReturnValueOnce(0).mockReturnValueOnce(0.2);
    const { getByTestId, getByRole, getByText, queryByText } = render(<NumberPicnicScreen />);

    const quantity = getByTestId('number-picnic-match-quantity');
    expect(quantity.props.accessibilityLabel).toMatch(/2 items shown in a frame/);
    expect(within(quantity).queryByText('2')).toBeNull();

    fireEvent.press(getByRole('button', { name: 'Numeral 1' }));
    expect(getByText('That numeral does not match the group. You can try again.')).toBeTruthy();

    fireEvent.press(getByRole('button', { name: 'Try a new example' }));
    expect(quantity.props.accessibilityLabel).toMatch(/1 item shown in a frame/);
    expect(queryByText('That numeral does not match the group. You can try again.')).toBeNull();
    expect(getByTestId('number-picnic-hint')).toBeEnabled();
  });

  it('locks scrolling only while dragging and adds one item when released over the basket', () => {
    jest
      .spyOn(PanResponder, 'create')
      .mockImplementation(
        (handlers) =>
          ({ panHandlers: handlers }) as unknown as ReturnType<typeof PanResponder.create>,
      );
    type MeasureCallback = Parameters<View['measureInWindow']>[0];
    jest.spyOn(View.prototype, 'measureInWindow').mockImplementation(function (
      this: View,
      callback: MeasureCallback,
    ) {
      if (this.props.testID === 'picnic-basket-drop-zone') {
        callback(100, 100, 150, 150);
      } else callback(100, 300, 56, 56);
    });
    const { getByTestId, getByText } = render(<NumberPicnicScreen />);

    const scroll = getByTestId('number-picnic-scroll');
    const { onPanResponderGrant, onPanResponderMove, onPanResponderRelease } =
      getByTestId('picnic-drag-0').props;
    expect(scroll.props.scrollEnabled).toBe(true);
    act(() => onPanResponderGrant());
    expect(scroll.props.scrollEnabled).toBe(false);
    expect(getByTestId('number-picnic-next')).toBeDisabled();

    act(() => {
      onPanResponderMove({}, { dx: 0, dy: -80, moveX: 110, moveY: 220 });
      onPanResponderRelease();
    });

    expect(scroll.props.scrollEnabled).toBe(true);
    expect(getByText('1/1')).toBeTruthy();
  });
});
