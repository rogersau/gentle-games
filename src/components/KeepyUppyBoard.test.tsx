import React from 'react';
import { act, fireEvent, render } from '@testing-library/react-native';
import { KeepyUppyBoard, KeepyUppyBoardRef } from './KeepyUppyBoard';
import { MAX_BALLOONS } from '../utils/keepyUppyLogic';

const mockOnScoreChange = jest.fn();
const mockOnBalloonCountChange = jest.fn();
const mockOnPoppedChange = jest.fn();

jest.mock('../utils/theme', () => ({
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
    },
    resolvedMode: 'light',
    colorMode: 'light',
  }),
}));

describe('KeepyUppyBoard', () => {
  const defaultBounds = { width: 400, height: 600 };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('publishes committed initial and reset values without timer flushing', () => {
    const ref = React.createRef<KeepyUppyBoardRef>();

    render(
      <KeepyUppyBoard
        ref={ref}
        bounds={defaultBounds}
        onScoreChange={mockOnScoreChange}
        onBalloonCountChange={mockOnBalloonCountChange}
        onPoppedChange={mockOnPoppedChange}
      />
    );

    expect(mockOnScoreChange).toHaveBeenLastCalledWith(0);
    expect(mockOnBalloonCountChange).toHaveBeenLastCalledWith(1);
    expect(mockOnPoppedChange).toHaveBeenLastCalledWith(0);

    act(() => {
      ref.current?.resetBalloons();
    });

    expect(ref.current?.getBalloonCount()).toBe(1);
    expect(mockOnScoreChange).toHaveBeenLastCalledWith(0);
    expect(mockOnBalloonCountChange).toHaveBeenLastCalledWith(1);
    expect(mockOnPoppedChange).toHaveBeenLastCalledWith(0);
  });

  it('keeps callback payloads aligned across repeated add and reset interactions', () => {
    const ref = React.createRef<KeepyUppyBoardRef>();

    render(
      <KeepyUppyBoard
        ref={ref}
        bounds={defaultBounds}
        onScoreChange={mockOnScoreChange}
        onBalloonCountChange={mockOnBalloonCountChange}
        onPoppedChange={mockOnPoppedChange}
      />
    );

    expect(ref.current?.getBalloonCount()).toBe(1);
    act(() => {
      ref.current?.addBalloon();
    });

    expect(ref.current?.getBalloonCount()).toBe(2);
    expect(mockOnBalloonCountChange).toHaveBeenLastCalledWith(2);

    act(() => {
      ref.current?.addBalloon();
    });

    expect(ref.current?.getBalloonCount()).toBe(3);
    expect(mockOnBalloonCountChange).toHaveBeenLastCalledWith(3);

    act(() => {
      ref.current?.resetBalloons();
    });

    expect(ref.current?.getBalloonCount()).toBe(1);
    expect(mockOnScoreChange).toHaveBeenLastCalledWith(0);
    expect(mockOnPoppedChange).toHaveBeenLastCalledWith(0);
    expect(mockOnBalloonCountChange).toHaveBeenLastCalledWith(1);
  });

  it('preserves the imperative ref API, balloon cap, and easy-mode taps', () => {
    const ref = React.createRef<KeepyUppyBoardRef>();
    const { getAllByTestId } = render(
      <KeepyUppyBoard
        ref={ref}
        bounds={defaultBounds}
        easyMode={true}
        onScoreChange={mockOnScoreChange}
        onBalloonCountChange={mockOnBalloonCountChange}
      />
    );

    expect(typeof ref.current?.addBalloon).toBe('function');
    expect(typeof ref.current?.resetBalloons).toBe('function');
    expect(typeof ref.current?.getBalloonCount).toBe('function');
    expect(ref.current?.getBalloonCount()).toBe(1);

    act(() => {
      for (let count = 0; count < MAX_BALLOONS + 2; count += 1) {
        ref.current?.addBalloon();
      }
    });

    const balloon = getAllByTestId(/balloon-/)[0];

    fireEvent(balloon, 'pressIn', {
      nativeEvent: {
        locationX: 50,
        locationY: 50,
        pageX: 100,
        pageY: 100,
      },
    });

    expect(ref.current?.getBalloonCount()).toBe(MAX_BALLOONS);
    expect(mockOnBalloonCountChange).toHaveBeenLastCalledWith(MAX_BALLOONS);
    expect(mockOnScoreChange).toHaveBeenLastCalledWith(1);
  });
});
