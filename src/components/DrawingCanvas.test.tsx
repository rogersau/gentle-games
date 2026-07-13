import React from 'react';
import { act, fireEvent, render } from '@testing-library/react-native';
import { PanResponder, StyleSheet, View } from 'react-native';
import { DrawingCanvas, DrawingCanvasRef, HistoryEntry } from './DrawingCanvas';

const findTouchLayer = (screen: ReturnType<typeof render>) =>
  screen
    .UNSAFE_getAllByType(View)
    .find((node) => typeof node.props.onPanResponderGrant === 'function');

const drawGesture = (
  screen: ReturnType<typeof render>,
  start: { x: number; y: number },
  moves: Array<{ x: number; y: number }> = [],
) => {
  const touchLayer = findTouchLayer(screen);
  expect(touchLayer).toBeTruthy();

  act(() => {
    touchLayer?.props.onPanResponderGrant?.({
      nativeEvent: { locationX: start.x, locationY: start.y },
    });

    moves.forEach((move) => {
      touchLayer?.props.onPanResponderMove?.({
        nativeEvent: { locationX: move.x, locationY: move.y },
      });
    });

    touchLayer?.props.onPanResponderRelease?.();
  });
};

describe('DrawingCanvas', () => {
  beforeEach(() => {
    jest
      .spyOn(PanResponder, 'create')
      .mockImplementation((handlers: any) => ({ panHandlers: handlers }) as any);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('does not add duplicate palette colors when confirming the current color', () => {
    const initialHistory: HistoryEntry[] = [];

    const { getByTestId, getAllByTestId } = render(
      <DrawingCanvas width={320} height={280} initialHistory={initialHistory} />,
    );

    const initialPaletteCount = getAllByTestId('palette-color-button').length;

    fireEvent.press(getByTestId('open-color-picker'));
    fireEvent.press(getByTestId('confirm-custom-color'));

    expect(getAllByTestId('palette-color-button')).toHaveLength(initialPaletteCount);
  });

  it('applies a custom canvas background color', () => {
    const initialHistory: HistoryEntry[] = [];
    const { getByTestId } = render(
      <DrawingCanvas
        width={320}
        height={280}
        initialHistory={initialHistory}
        canvasBackgroundColor='#3F444D'
      />,
    );

    const containerStyle = StyleSheet.flatten(getByTestId('drawing-canvas-container').props.style);
    expect(containerStyle.backgroundColor).toBe('#3F444D');
  });

  it('shows confirmation before clearing and clears on confirm', () => {
    const initialHistory: HistoryEntry[] = [
      { kind: 'shape', id: 'shape-1', type: 'circle', x: 40, y: 40, size: 24, color: '#FF0000' },
    ];
    const ref = React.createRef<DrawingCanvasRef>();

    const { getByTestId } = render(
      <DrawingCanvas ref={ref} width={320} height={280} initialHistory={initialHistory} />,
    );

    expect(ref.current?.getHistory()).toHaveLength(1);
    fireEvent.press(getByTestId('clear-drawing-button'));
    expect(getByTestId('clear-confirm-accept')).toBeTruthy();
    fireEvent.press(getByTestId('clear-confirm-accept'));

    expect(ref.current?.getHistory()).toHaveLength(0);
  });

  it('undoes the full mirrored stroke batch in half symmetry mode', () => {
    const ref = React.createRef<DrawingCanvasRef>();
    const screen = render(<DrawingCanvas ref={ref} width={320} height={280} initialHistory={[]} />);

    fireEvent.press(screen.getByLabelText('games.drawing.symmetry'));
    drawGesture(screen, { x: 40, y: 60 }, [
      { x: 70, y: 90 },
      { x: 100, y: 120 },
    ]);

    expect(ref.current?.getHistory()).toHaveLength(2);

    fireEvent.press(screen.getByLabelText('games.drawing.undo'));

    expect(ref.current?.getHistory()).toHaveLength(0);
  });

  it('undoes the latest quarter-symmetry batch even after the symmetry mode changes', () => {
    const ref = React.createRef<DrawingCanvasRef>();
    const screen = render(<DrawingCanvas ref={ref} width={320} height={280} initialHistory={[]} />);

    fireEvent.press(screen.getByLabelText('games.drawing.symmetry'));
    fireEvent.press(screen.getByLabelText('games.drawing.symmetry'));

    drawGesture(screen, { x: 48, y: 56 }, [
      { x: 72, y: 88 },
      { x: 96, y: 112 },
    ]);

    expect(ref.current?.getHistory()).toHaveLength(4);

    fireEvent.press(screen.getByLabelText('games.drawing.symmetry'));
    fireEvent.press(screen.getByLabelText('games.drawing.undo'));

    expect(ref.current?.getHistory()).toHaveLength(0);
  });

  it('keeps batch-aware undo semantics for shapes and eraser actions', () => {
    const shapeRef = React.createRef<DrawingCanvasRef>();
    const shapeScreen = render(
      <DrawingCanvas ref={shapeRef} width={320} height={280} initialHistory={[]} />,
    );

    fireEvent.press(shapeScreen.getByLabelText('games.drawing.symmetry'));
    fireEvent.press(
      shapeScreen.getByLabelText('games.drawing.shapeTool, games.drawing.shape.circle'),
    );
    fireEvent.press(shapeScreen.getAllByText('games.drawing.shape.circle')[0]);

    drawGesture(shapeScreen, { x: 80, y: 100 });

    expect(shapeRef.current?.getHistory()).toHaveLength(2);

    fireEvent.press(shapeScreen.getByLabelText('games.drawing.undo'));

    expect(shapeRef.current?.getHistory()).toHaveLength(0);

    const eraseRef = React.createRef<DrawingCanvasRef>();
    const eraseScreen = render(
      <DrawingCanvas ref={eraseRef} width={320} height={280} initialHistory={[]} />,
    );

    fireEvent.press(eraseScreen.getByLabelText('games.drawing.symmetry'));
    fireEvent.press(eraseScreen.getByLabelText('games.drawing.symmetry'));
    fireEvent.press(eraseScreen.getByLabelText('games.drawing.eraserTool'));

    drawGesture(eraseScreen, { x: 120, y: 120 }, [
      { x: 140, y: 135 },
      { x: 160, y: 150 },
    ]);

    expect(eraseRef.current?.getHistory()).toHaveLength(4);

    fireEvent.press(eraseScreen.getByLabelText('games.drawing.undo'));

    expect(eraseRef.current?.getHistory()).toHaveLength(0);
  });
});
