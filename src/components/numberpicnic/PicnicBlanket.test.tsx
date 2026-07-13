import React from 'react';
import { PanResponder } from 'react-native';
import { act, render } from '@testing-library/react-native';
import { PicnicBlanket } from './PicnicBlanket';

type NodeMockElement = React.ReactElement<unknown>;

let mockSettings = {
  animationsEnabled: false,
  reducedMotionEnabled: false,
};

let mockMeasuredLayout = {
  x: 10,
  y: 100,
  width: 56,
  height: 56,
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
    mockMeasuredLayout = {
      x: 10,
      y: 100,
      width: 56,
      height: 56,
    };
    jest.spyOn(PanResponder, 'create').mockImplementation(
      (handlers: any) =>
        ({
          panHandlers: handlers,
        }) as any,
    );
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders only the available draggable items', () => {
    const { queryAllByTestId } = render(
      <PicnicBlanket itemEmoji='🍎' itemCount={2} targetCount={5} onItemDrop={jest.fn()} />,
    );

    expect(queryAllByTestId(/picnic-item-/)).toHaveLength(2);
  });

  it('rebuilds item labels when emoji changes between rounds', () => {
    const { getByTestId, rerender } = render(
      <PicnicBlanket itemEmoji='🍓' itemCount={1} targetCount={3} onItemDrop={jest.fn()} />,
    );

    expect(getByTestId('picnic-item-0').props.accessibilityLabel).toContain('🍓');

    rerender(<PicnicBlanket itemEmoji='🥕' itemCount={1} targetCount={3} onItemDrop={jest.fn()} />);

    expect(getByTestId('picnic-item-0').props.accessibilityLabel).toContain('🥕');
  });

  it('drops item when dragged into the measured basket overlap area', () => {
    const onItemDrop = jest.fn();
    const onDropStart = jest.fn();
    const onDropEnd = jest.fn();

    const { getByTestId } = render(
      <PicnicBlanket
        itemEmoji='🍌'
        itemCount={1}
        targetCount={3}
        onItemDrop={onItemDrop}
        onDropStart={onDropStart}
        onDropEnd={onDropEnd}
        dropZoneLayout={{ x: 20, y: 50, width: 120, height: 120 }}
      />,
      {
        createNodeMock: (element: NodeMockElement) =>
          (element.props as { testID?: string }).testID === 'picnic-item-0'
            ? {
                measureInWindow: (
                  callback: (x: number, y: number, width: number, height: number) => void,
                ) =>
                  callback(
                    mockMeasuredLayout.x,
                    mockMeasuredLayout.y,
                    mockMeasuredLayout.width,
                    mockMeasuredLayout.height,
                  ),
              }
            : {},
      },
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
      item.props.onLayout?.({
        nativeEvent: {
          layout: mockMeasuredLayout,
        },
      });
      onGrant?.({}, {});
      onMove?.({}, { dx: 20, dy: -40 });
      onRelease?.({}, { dx: 20, dy: -40 });
    });

    expect(onDropStart).toHaveBeenCalledTimes(1);
    expect(onDropEnd).toHaveBeenCalledTimes(1);
    expect(onItemDrop).toHaveBeenCalledWith(0);
  });

  it('does not drop item when release does not overlap the basket bounds', () => {
    const onItemDrop = jest.fn();

    const { getByTestId } = render(
      <PicnicBlanket
        itemEmoji='🍇'
        itemCount={1}
        targetCount={3}
        onItemDrop={onItemDrop}
        dropZoneLayout={{ x: 220, y: 20, width: 100, height: 100 }}
      />,
      {
        createNodeMock: (element: NodeMockElement) =>
          (element.props as { testID?: string }).testID === 'picnic-item-0'
            ? {
                measureInWindow: (
                  callback: (x: number, y: number, width: number, height: number) => void,
                ) =>
                  callback(
                    mockMeasuredLayout.x,
                    mockMeasuredLayout.y,
                    mockMeasuredLayout.width,
                    mockMeasuredLayout.height,
                  ),
              }
            : {},
      },
    );

    const item = getByTestId('picnic-item-0');

    act(() => {
      item.props.onLayout?.({
        nativeEvent: {
          layout: mockMeasuredLayout,
        },
      });
      item.props.onPanResponderGrant?.({}, {});
      item.props.onPanResponderMove?.({}, { dx: 15, dy: -30 });
      item.props.onPanResponderRelease?.({}, { dx: 15, dy: -30 });
    });

    expect(onItemDrop).not.toHaveBeenCalled();
  });
});
