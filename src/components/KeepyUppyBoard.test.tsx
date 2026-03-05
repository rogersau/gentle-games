import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { KeepyUppyBoard } from './KeepyUppyBoard';

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

  it('renders with initial balloon', async () => {
    render(
      <KeepyUppyBoard
        bounds={defaultBounds}
        onScoreChange={mockOnScoreChange}
        onBalloonCountChange={mockOnBalloonCountChange}
      />
    );

    // Wait for setTimeout to execute
    act(() => {
      jest.advanceTimersByTime(0);
    });

    await waitFor(() => {
      expect(mockOnBalloonCountChange).toHaveBeenCalledWith(1);
    });
  });

  it('adds balloon via ref', async () => {
    const ref = React.createRef<{
      addBalloon: () => void;
      resetBalloons: () => void;
      getBalloonCount: () => number;
    }>();

    render(
      <KeepyUppyBoard
        ref={ref}
        bounds={defaultBounds}
        onBalloonCountChange={mockOnBalloonCountChange}
      />
    );

    // Wait for initial callback
    act(() => {
      jest.advanceTimersByTime(0);
    });

    await waitFor(() => {
      expect(ref.current?.getBalloonCount()).toBe(1);
    });

    act(() => {
      ref.current?.addBalloon();
    });

    await waitFor(() => {
      expect(ref.current?.getBalloonCount()).toBe(2);
    });

    // Wait for callback
    act(() => {
      jest.advanceTimersByTime(0);
    });

    await waitFor(() => {
      expect(mockOnBalloonCountChange).toHaveBeenCalledWith(2);
    });
  });

  it('limits balloons to max of 3', async () => {
    const ref = React.createRef<{
      addBalloon: () => void;
      resetBalloons: () => void;
      getBalloonCount: () => number;
    }>();

    render(
      <KeepyUppyBoard
        ref={ref}
        bounds={defaultBounds}
        onBalloonCountChange={mockOnBalloonCountChange}
      />
    );

    await waitFor(() => {
      expect(ref.current?.getBalloonCount()).toBe(1);
    });

    act(() => {
      ref.current?.addBalloon();
    });

    await waitFor(() => {
      expect(ref.current?.getBalloonCount()).toBe(2);
    });

    act(() => {
      ref.current?.addBalloon();
    });

    await waitFor(() => {
      expect(ref.current?.getBalloonCount()).toBe(3);
    });

    act(() => {
      ref.current?.addBalloon();
    });

    await waitFor(() => {
      expect(ref.current?.getBalloonCount()).toBe(3);
    });
  });

  it('resets balloons via ref', async () => {
    const ref = React.createRef<{
      addBalloon: () => void;
      resetBalloons: () => void;
      getBalloonCount: () => number;
    }>();

    render(
      <KeepyUppyBoard
        ref={ref}
        bounds={defaultBounds}
        onScoreChange={mockOnScoreChange}
        onBalloonCountChange={mockOnBalloonCountChange}
        onPoppedChange={mockOnPoppedChange}
      />
    );

    await waitFor(() => {
      expect(ref.current?.getBalloonCount()).toBe(1);
    });

    act(() => {
      ref.current?.addBalloon();
    });

    await waitFor(() => {
      expect(ref.current?.getBalloonCount()).toBe(2);
    });

    act(() => {
      ref.current?.resetBalloons();
    });

    // Wait for setTimeout callbacks
    act(() => {
      jest.advanceTimersByTime(0);
    });

    await waitFor(() => {
      expect(ref.current?.getBalloonCount()).toBe(1);
    });

    await waitFor(() => {
      expect(mockOnScoreChange).toHaveBeenCalledWith(0);
      expect(mockOnPoppedChange).toHaveBeenCalledWith(0);
      expect(mockOnBalloonCountChange).toHaveBeenLastCalledWith(1);
    });
  });

  it('increments score when balloon is tapped', async () => {
    const { getByTestId } = render(
      <KeepyUppyBoard
        bounds={defaultBounds}
        onScoreChange={mockOnScoreChange}
      />
    );

    const balloon = getByTestId(/balloon-/);
    fireEvent(balloon, 'pressIn', {
      nativeEvent: {
        locationX: 50,
        locationY: 50,
        pageX: 100,
        pageY: 100,
      },
    });

    // Wait for setTimeout callback
    act(() => {
      jest.advanceTimersByTime(0);
    });

    await waitFor(() => {
      expect(mockOnScoreChange).toHaveBeenCalledWith(1);
    });
  });
});
