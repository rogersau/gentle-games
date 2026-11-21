import React from 'react';
import { act, fireEvent, render } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';
import { KeepyUppyBoard, KeepyUppyBoardRef } from './KeepyUppyBoard';
import * as logic from '../utils/keepyUppyLogic';

const { MAX_BALLOONS } = logic;
const touch = (pageX: number, pageY: number) => ({
  nativeEvent: { pageX, pageY, locationX: 20, locationY: 30 },
});

const mockOnScoreChange = jest.fn();
const mockOnBalloonCountChange = jest.fn();
const mockOnPoppedChange = jest.fn();

jest.mock('../utils/theme', () => ({
  useReducedMotion: () => false,
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
    jest.spyOn(Math, 'random').mockReturnValue(0.5);
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
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
      />,
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
      />,
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
      />,
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

    const tap = jest.spyOn(logic, 'tapBalloon');
    fireEvent(balloon, 'pressIn', touch(100, 100));
    fireEvent.press(balloon, touch(106, 107));

    expect(ref.current?.getBalloonCount()).toBe(MAX_BALLOONS);
    expect(mockOnBalloonCountChange).toHaveBeenLastCalledWith(MAX_BALLOONS);
    expect(mockOnScoreChange).toHaveBeenLastCalledWith(1);
    const [target, x, , easyMode] = tap.mock.calls[0];
    expect(x).toBeLessThan(target.x);
    expect(easyMode).toBe(true);
  });

  it('applies one flick on a quick accepted press and no impulse on cancellation', () => {
    const flick = jest.spyOn(logic, 'flickBalloon');
    const tap = jest.spyOn(logic, 'tapBalloon');
    const { getByTestId } = render(
      <KeepyUppyBoard bounds={defaultBounds} onScoreChange={mockOnScoreChange} />,
    );
    const balloon = getByTestId(/balloon-/);

    fireEvent(balloon, 'pressIn', touch(100, 100));
    act(() => jest.advanceTimersByTime(100));
    fireEvent(balloon, 'pressOut', touch(120, 80));
    expect(flick).not.toHaveBeenCalled();
    expect(tap).not.toHaveBeenCalled();
    expect(mockOnScoreChange).toHaveBeenLastCalledWith(0);

    fireEvent(balloon, 'pressIn', touch(100, 100));
    act(() => jest.advanceTimersByTime(100));
    fireEvent.press(balloon, touch(120, 80));
    fireEvent(balloon, 'pressOut', touch(120, 80));
    expect(flick).toHaveBeenCalledTimes(1);
    expect(flick).toHaveBeenCalledWith(
      expect.objectContaining({ id: expect.any(String) }),
      20,
      -20,
      100,
    );
    expect(tap).not.toHaveBeenCalled();
    expect(mockOnScoreChange).toHaveBeenLastCalledWith(1);
  });

  it('centres a press without pointer coordinates and keeps the balloon visible', () => {
    const tap = jest.spyOn(logic, 'tapBalloon');
    const { getByTestId } = render(
      <KeepyUppyBoard bounds={defaultBounds} onScoreChange={mockOnScoreChange} />,
    );
    const balloon = getByTestId(/balloon-/);
    const before = StyleSheet.flatten(balloon.props.style);

    fireEvent(balloon, 'pressIn', touch(100, 100));
    fireEvent(balloon, 'pressOut', touch(120, 80));
    fireEvent.press(balloon, { nativeEvent: { pageX: 0, pageY: 0, detail: 0 } });
    act(() => jest.advanceTimersByTime(100));

    const [target, x, y] = tap.mock.calls[0];
    expect(x).toBe(target.x);
    expect(y).toBe(target.y);
    const after = StyleSheet.flatten(getByTestId(/balloon-/).props.style);
    expect(after.left).toBeCloseTo(before.left);
    expect(after.top).toBeLessThan(before.top);
    expect(mockOnScoreChange).toHaveBeenLastCalledWith(1);

    fireEvent.press(balloon);
    expect(mockOnScoreChange).toHaveBeenLastCalledWith(2);
  });

  it('lets a pressure-free balloon land, wait, and lift off again', () => {
    const { getByTestId } = render(
      <KeepyUppyBoard
        bounds={defaultBounds}
        allowPopping={false}
        onPoppedChange={mockOnPoppedChange}
      />,
    );
    const id = getByTestId(/balloon-/).props.testID;
    const top = () => StyleSheet.flatten(getByTestId(id).props.style).top;

    act(() => jest.advanceTimersByTime(3000));
    const groundTop = top();
    act(() => jest.advanceTimersByTime(10_000));
    expect(top()).toBe(groundTop);
    expect(mockOnPoppedChange).toHaveBeenLastCalledWith(0);

    fireEvent.press(getByTestId(id));
    act(() => jest.advanceTimersByTime(100));
    expect(top()).toBeLessThan(groundTop);
  });

  it('counts only active play time towards a timed pop and replaces the last balloon once', () => {
    const { getByTestId, queryByTestId, rerender } = render(
      <KeepyUppyBoard bounds={defaultBounds} onPoppedChange={mockOnPoppedChange} />,
    );
    const id = getByTestId(/balloon-/).props.testID;

    act(() => jest.advanceTimersByTime(2200));
    expect(StyleSheet.flatten(getByTestId(id).props.style).opacity).toBe(0.72);
    rerender(
      <KeepyUppyBoard
        bounds={defaultBounds}
        onPoppedChange={mockOnPoppedChange}
        motionEnabled={false}
      />,
    );
    act(() => jest.advanceTimersByTime(10_000));
    expect(getByTestId(id)).toBeTruthy();

    rerender(<KeepyUppyBoard bounds={defaultBounds} onPoppedChange={mockOnPoppedChange} />);
    act(() => jest.advanceTimersByTime(200));
    expect(getByTestId(id)).toBeTruthy();
    act(() => jest.advanceTimersByTime(logic.GROUND_POP_DELAY_MS));
    expect(queryByTestId(id)).toBeNull();
    expect(getByTestId(/balloon-/)).toBeTruthy();
    expect(mockOnPoppedChange.mock.calls).toEqual([[0], [1]]);
  });

  it('keeps still balloons apart, moves one on demand, and contains it after resizing', () => {
    const ref = React.createRef<KeepyUppyBoardRef>();
    const { getAllByTestId, getByTestId, rerender } = render(
      <KeepyUppyBoard ref={ref} bounds={defaultBounds} motionEnabled={false} />,
    );
    act(() => {
      ref.current?.addBalloon();
      ref.current?.addBalloon();
    });

    const balloons = getAllByTestId(/balloon-/);
    const positions = balloons.map((balloon) => StyleSheet.flatten(balloon.props.style).left);
    expect(new Set(positions).size).toBe(MAX_BALLOONS);
    const rightmost = balloons[positions.indexOf(Math.max(...positions))];
    const id = rightmost.props.testID;
    const layout = () => StyleSheet.flatten(getByTestId(id).props.style);
    const before = layout();

    fireEvent.press(rightmost);
    const moved = layout();
    expect(moved.top).toBeLessThan(before.top);
    act(() => jest.advanceTimersByTime(5000));
    expect(layout()).toEqual(moved);
    fireEvent.press(getByTestId(id));
    expect(layout().top).toBeGreaterThan(moved.top);

    const compact = { width: 220, height: 220 };
    rerender(<KeepyUppyBoard ref={ref} bounds={compact} motionEnabled={false} />);
    expect(layout().left + layout().width).toBeLessThanOrEqual(compact.width);
    expect(layout().top + layout().height).toBeLessThanOrEqual(compact.height);
    const resizedPositions = getAllByTestId(/balloon-/).map(
      (balloon) => StyleSheet.flatten(balloon.props.style).left,
    );
    expect(new Set(resizedPositions).size).toBe(MAX_BALLOONS);
  });
});
