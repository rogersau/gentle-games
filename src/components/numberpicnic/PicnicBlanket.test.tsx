import React from 'react';
import { PanResponder } from 'react-native';
import { act, render } from '@testing-library/react-native';
import { PicnicBlanket } from './PicnicBlanket';

let mockSettings = {
  animationsEnabled: false,
  reducedMotionEnabled: false,
};

jest.mock('../../context/SettingsContext', () => ({
  useSettings: () => ({
    settings: mockSettings,
  }),
}));

jest.mock('../../utils/theme', () => ({
  useThemeColors: () => ({
    colors: {
      background: '#FFFEF7',
      cardBack: '#E8E4E1',
      cardFront: '#FFFFFF',
      text: '#5A5A5A',
      textLight: '#8A8A8A',
      primary: '#A8D8EA',
      secondary: '#FFB6C1',
      success: '#B8E6B8',
      matched: '#D3D3D3',
      surfaceGame: '#FFFFFF',
      surface: '#FFFFFF',
      surfaceElevated: '#FFFFFF',
      border: '#E8E4E1',
      borderSubtle: '#F0EDE9',
      overlay: 'rgba(90, 90, 90, 0.4)',
      accent: '#D4A9E6',
      danger: '#E8A0A0',
    },
  }),
}));

describe('PicnicBlanket', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSettings = {
      animationsEnabled: false,
      reducedMotionEnabled: false,
    };
    jest.spyOn(PanResponder, 'create').mockImplementation(
      (handlers: any) =>
        ({
          panHandlers: handlers,
        }) as any
    );
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders only the available draggable items', () => {
    const { queryAllByTestId } = render(
      <PicnicBlanket itemEmoji="🍎" itemCount={2} targetCount={5} onItemDrop={jest.fn()} />
    );

    expect(queryAllByTestId(/picnic-item-/)).toHaveLength(2);
  });

  it('rebuilds item labels when emoji changes between rounds', () => {
    const { getByTestId, rerender } = render(
      <PicnicBlanket itemEmoji="🍓" itemCount={1} targetCount={3} onItemDrop={jest.fn()} />
    );

    expect(getByTestId('picnic-item-0').props.accessibilityLabel).toContain('🍓');

    rerender(<PicnicBlanket itemEmoji="🥕" itemCount={1} targetCount={3} onItemDrop={jest.fn()} />);

    expect(getByTestId('picnic-item-0').props.accessibilityLabel).toContain('🥕');
  });

  it('drops item when dragged upward past threshold', () => {
    const onItemDrop = jest.fn();
    const onDropStart = jest.fn();
    const onDropEnd = jest.fn();

    const { getByTestId } = render(
      <PicnicBlanket
        itemEmoji="🍌"
        itemCount={1}
        targetCount={3}
        onItemDrop={onItemDrop}
        onDropStart={onDropStart}
        onDropEnd={onDropEnd}
      />
    );

    const item = getByTestId('picnic-item-0');
    const startShouldSet = item.props.onStartShouldSetPanResponder;
    const moveShouldSet = item.props.onMoveShouldSetPanResponder;
    const onGrant = item.props.onPanResponderGrant;
    const onMove = item.props.onPanResponderMove;
    const onRelease = item.props.onPanResponderRelease;

    expect(startShouldSet()).toBe(true);
    expect(moveShouldSet()).toBe(true);

    act(() => {
      onGrant?.({}, {});
      onMove?.({}, { dx: 0, dy: -250 });
      onRelease?.({}, { dx: 0, dy: -250 });
    });

    expect(onDropStart).toHaveBeenCalledTimes(1);
    expect(onDropEnd).toHaveBeenCalledTimes(1);
    expect(onItemDrop).toHaveBeenCalledWith(0);
  });

  it('does not drop item when release is below threshold', () => {
    const onItemDrop = jest.fn();

    const { getByTestId } = render(
      <PicnicBlanket itemEmoji="🍇" itemCount={1} targetCount={3} onItemDrop={onItemDrop} />
    );

    const item = getByTestId('picnic-item-0');

    act(() => {
      item.props.onPanResponderGrant?.({}, {});
      item.props.onPanResponderMove?.({}, { dx: 0, dy: -80 });
      item.props.onPanResponderRelease?.({}, { dx: 0, dy: -80 });
    });

    expect(onItemDrop).not.toHaveBeenCalled();
  });
});
