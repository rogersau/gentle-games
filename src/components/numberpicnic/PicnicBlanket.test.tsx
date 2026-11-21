import React from 'react';
import { PanResponder, View } from 'react-native';
import { act, fireEvent, render } from '@testing-library/react-native';
import { isNumberPicnicDropValid, PicnicBlanket } from './PicnicBlanket';

type MeasureCallback = Parameters<View['measureInWindow']>[0];

const dragGesture = { dx: 5, dy: -70, moveX: 115, moveY: 220 };
const itemBounds = [100, 300, 56, 56] as const;
const basketBounds = [120, 100, 150, 150] as const;

function setup({
  measureItem = (callback: MeasureCallback) => callback(...itemBounds),
  measureBasket = (callback: MeasureCallback) => callback(...basketBounds),
  firstItemId = 0,
} = {}) {
  const props = {
    itemEmoji: '🍎',
    itemName: 'apple',
    itemIds: [firstItemId, firstItemId + 2],
    firstItemId,
    poolSize: firstItemId + 3,
    onItemDrop: jest.fn(),
    onDropStart: jest.fn(),
    onDropEnd: jest.fn(),
    onDragOverBasket: jest.fn(),
    basketRef: { current: { measureInWindow: jest.fn(measureBasket) } as unknown as View },
    isComplete: false,
  };
  jest.spyOn(View.prototype, 'measureInWindow').mockImplementation(measureItem);
  const screen = render(<PicnicBlanket {...props} />);
  return { ...screen, props };
}

describe('PicnicBlanket', () => {
  beforeEach(() => {
    jest
      .spyOn(PanResponder, 'create')
      .mockImplementation(
        (handlers) =>
          ({ panHandlers: handlers }) as unknown as ReturnType<typeof PanResponder.create>,
      );
  });

  afterEach(() => jest.restoreAllMocks());

  it('keeps only the source slots in add-one-more and makes available fruit tappable', () => {
    const { getAllByTestId, getByTestId, props, rerender } = setup({ firstItemId: 6 });

    expect(getAllByTestId(/^picnic-drag-/)).toHaveLength(3);
    expect(getAllByTestId(/^picnic-item-/)).toHaveLength(2);
    fireEvent.press(getByTestId('picnic-item-8'));
    expect(props.onItemDrop).toHaveBeenCalledWith(8);

    rerender(<PicnicBlanket {...props} itemIds={[6]} />);
    expect(getAllByTestId(/^picnic-drag-/)).toHaveLength(3);
    expect(getAllByTestId(/^picnic-item-/)).toHaveLength(1);

    rerender(<PicnicBlanket {...props} isComplete />);
    expect(getByTestId('picnic-item-6')).toBeDisabled();
  });

  it('grants a drag from the stationary slot after an upward move and keeps its responder through rerenders', () => {
    const measureItem = jest.fn((callback: MeasureCallback) => callback(...itemBounds));
    const { getByTestId, rerender, props } = setup({ measureItem });
    const slot = getByTestId('picnic-drag-0');
    const { onMoveShouldSetPanResponder, onPanResponderGrant } = slot.props;

    expect(onMoveShouldSetPanResponder({}, { dx: 1, dy: -3 })).toBe(false);
    expect(onMoveShouldSetPanResponder({}, { dx: 1, dy: 20 })).toBe(false);
    expect(onMoveShouldSetPanResponder({}, { dx: 1, dy: -10 })).toBe(true);

    act(() => onPanResponderGrant());
    rerender(<PicnicBlanket {...props} />);
    expect(getByTestId('picnic-drag-0').props.onPanResponderGrant).toBe(onPanResponderGrant);

    act(() => {
      getByTestId('picnic-drag-0').props.onPanResponderMove({}, dragGesture);
      getByTestId('picnic-drag-0').props.onPanResponderRelease();
    });

    expect(measureItem).toHaveBeenCalledTimes(1);
    expect(props.onDropStart).toHaveBeenCalledTimes(1);
    expect(props.onDropEnd).toHaveBeenCalledTimes(1);
    expect(props.onDragOverBasket).toHaveBeenLastCalledWith(true);
    expect(props.onItemDrop).toHaveBeenCalledTimes(1);
    expect(props.onItemDrop).toHaveBeenCalledWith(0);
  });

  it('remeasures the basket for each gesture after scrolling', () => {
    let basketY = 600;
    const { getByTestId, props } = setup({
      measureBasket: (callback) => callback(120, basketY, 150, 150),
    });
    const slot = getByTestId('picnic-drag-0');

    const drag = () => {
      slot.props.onPanResponderGrant();
      slot.props.onPanResponderMove({}, dragGesture);
      slot.props.onPanResponderRelease();
    };
    act(drag);
    expect(props.onItemDrop).not.toHaveBeenCalled();

    basketY = 100;
    act(drag);
    expect(props.onItemDrop).toHaveBeenCalledTimes(1);
    expect(props.onItemDrop).toHaveBeenCalledWith(0);
  });

  it('clears a cancelled drag and ignores its delayed measurements and release', () => {
    let completeMeasurement: MeasureCallback | undefined;
    const { getByTestId, props } = setup({
      measureItem: (callback) => {
        completeMeasurement = callback;
      },
    });
    const {
      onPanResponderGrant,
      onPanResponderMove,
      onPanResponderTerminate,
      onPanResponderRelease,
    } = getByTestId('picnic-drag-0').props;

    act(() => {
      onPanResponderGrant();
      onPanResponderMove({}, dragGesture);
      onPanResponderTerminate();
      completeMeasurement?.(...itemBounds);
      onPanResponderRelease();
    });

    expect(props.onDragOverBasket).toHaveBeenCalledTimes(1);
    expect(props.onDragOverBasket).toHaveBeenCalledWith(false);
    expect(props.onDropEnd).toHaveBeenCalledTimes(1);
    expect(props.onItemDrop).not.toHaveBeenCalled();
  });

  it('accepts visible item overlap even when the pointer is outside the basket', () => {
    expect(
      isNumberPicnicDropValid(
        { x: 50, y: 150, width: 56, height: 56 },
        { x: 100, y: 100, width: 100, height: 100 },
        { dx: 45, dy: 0, moveX: 95, moveY: 210 },
      ),
    ).toBe(true);
  });
});
