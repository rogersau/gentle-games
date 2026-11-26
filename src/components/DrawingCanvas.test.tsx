import React from 'react';
import { act, fireEvent, render } from '@testing-library/react-native';
import { Modal, PanResponder, Platform, StyleSheet, View } from 'react-native';
import { Circle } from 'react-native-svg';
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
  it('exposes built-in palette colours as labeled buttons with selected state', () => {
    const screen = render(<DrawingCanvas width={320} height={280} initialHistory={[]} />);
    const paletteButtons = screen.getAllByTestId('palette-color-button');

    expect(paletteButtons[0].props.accessibilityRole).toBe('button');
    expect(paletteButtons[0].props.accessibilityLabel).toBe('Coral');
    expect(paletteButtons[0].props.accessibilityHint).toBe('Choose this colour for drawing');
    expect(paletteButtons[0].props.accessibilityState).toEqual({ selected: true });
    expect(paletteButtons[0].props.hitSlop).toBe(4);

    const addColourButton = screen.getByTestId('open-color-picker');
    expect(addColourButton.props.accessibilityRole).toBe('button');
    expect(addColourButton.props.accessibilityLabel).toBe('Add a custom colour');
    expect(addColourButton.props.accessibilityHint).toBe('Open colour choices');
  });

  it('keeps custom colours identifiable with their hex value', () => {
    const screen = render(<DrawingCanvas width={320} height={280} initialHistory={[]} />);

    fireEvent.press(screen.getByTestId('open-color-picker'));
    fireEvent.press(screen.getAllByTestId('color-picker-preset-button')[1]);
    fireEvent.press(screen.getByTestId('confirm-custom-color'));

    const customButton = screen.getAllByTestId('palette-color-button').at(-1);
    expect(customButton?.props.accessibilityRole).toBe('button');
    expect(customButton?.props.accessibilityLabel).toBe('Custom colour #FF4500');
    expect(customButton?.props.accessibilityState).toEqual({ selected: true });
  });
  it('switches to the pen and exposes the change when a colour is activated from eraser mode', () => {
    const screen = render(<DrawingCanvas width={320} height={280} initialHistory={[]} />);
    const paletteButton = screen.getAllByTestId('palette-color-button')[0];

    fireEvent.press(screen.getByLabelText('games.drawing.eraserTool'));
    expect(paletteButton.props.accessibilityState).toEqual({ selected: false });
    expect(paletteButton.props.accessibilityHint).toBe(
      'Choose this colour and switch back to the pen',
    );

    fireEvent.press(paletteButton);

    expect(screen.getByLabelText('games.drawing.penTool').props.accessibilityState).toEqual({
      selected: true,
    });
    expect(paletteButton.props.accessibilityState).toEqual({ selected: true });
    expect(screen.getByText('Pen tool is now active')).toBeTruthy();
  });
  it('exposes color-picker presets as labeled, selectable buttons', () => {
    const screen = render(<DrawingCanvas width={320} height={280} initialHistory={[]} />);

    fireEvent.press(screen.getByTestId('open-color-picker'));
    const presetButtons = screen.getAllByTestId('color-picker-preset-button');

    expect(presetButtons).toHaveLength(30);
    expect(presetButtons[0].props.accessibilityRole).toBe('button');
    expect(presetButtons[0].props.accessibilityLabel).toBe('Red');
    expect(presetButtons[0].props.accessibilityHint).toBe('Choose this colour');
    expect(presetButtons[0].props.accessibilityState.selected).toBe(false);
    fireEvent.press(presetButtons[0]);
    expect(presetButtons[0].props.accessibilityState.selected).toBe(true);
    expect(presetButtons[0].props.hitSlop).toBe(4);
  });
  it('exposes shape and size choices as labeled buttons with a clear selection', () => {
    const screen = render(<DrawingCanvas width={320} height={280} initialHistory={[]} />);

    fireEvent.press(screen.getByLabelText('games.drawing.shapeTool, games.drawing.shape.circle'));

    const circle = screen.getByTestId('shape-option-circle');
    const triangle = screen.getByTestId('shape-option-triangle');
    const medium = screen.getByTestId('shape-size-medium');

    expect(circle.props.accessibilityRole).toBe('button');
    expect(circle.props.accessibilityState).toEqual({ selected: true });
    expect(triangle.props.accessibilityLabel).toBe('games.drawing.shape.triangle');
    expect(medium.props.accessibilityRole).toBe('button');
    expect(medium.props.accessibilityState).toEqual({ selected: true });
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

  it('renders a tap as a dot and a tap with the eraser as a round erase mark', () => {
    const screen = render(
      <DrawingCanvas width={320} height={280} canvasBackgroundColor='#FFF5E6' />,
    );

    drawGesture(screen, { x: 10, y: 20 });
    expect(screen.UNSAFE_getByType(Circle).props).toMatchObject({
      cx: 10,
      cy: 20,
      r: 2.5,
      fill: '#FF6B6B',
    });

    fireEvent.press(screen.getByLabelText('games.drawing.eraserTool'));
    drawGesture(screen, { x: 10, y: 20 });
    expect(screen.UNSAFE_getAllByType(Circle)[1].props).toMatchObject({
      cx: 10,
      cy: 20,
      r: 15,
      fill: '#FFF5E6',
    });
  });

  it('discards the live preview when a gesture is interrupted', () => {
    const ref = React.createRef<DrawingCanvasRef>();
    const screen = render(<DrawingCanvas ref={ref} width={320} height={280} />);
    const touchLayer = findTouchLayer(screen);

    act(() =>
      touchLayer?.props.onPanResponderGrant({ nativeEvent: { locationX: 10, locationY: 20 } }),
    );
    expect(screen.UNSAFE_getByType(Circle).props).toMatchObject({ cx: 10, cy: 20 });
    expect(touchLayer?.props.onPanResponderTerminationRequest()).toBe(false);
    act(() => {
      touchLayer?.props.onPanResponderTerminate();
      touchLayer?.props.onPanResponderRelease();
    });

    expect(screen.UNSAFE_queryByType(Circle)).toBeNull();
    expect(ref.current?.getHistory()).toEqual([]);
    expect(touchLayer?.props.onPanResponderTerminationRequest()).toBe(true);
  });

  it('keeps a stroke with the starting finger and saves the release point once', () => {
    const ref = React.createRef<DrawingCanvasRef>();
    const screen = render(<DrawingCanvas ref={ref} width={320} height={280} />);
    const touchLayer = findTouchLayer(screen);

    const start = { identifier: '1', locationX: 0, locationY: 20 };
    const other = { identifier: '2', locationX: 200, locationY: 180 };
    const move = { ...start, locationX: 12 };
    const end = { ...start, locationX: 26 };
    act(() => {
      touchLayer?.props.onPanResponderGrant({ nativeEvent: { ...start, changedTouches: [start] } });
      touchLayer?.props.onPanResponderMove({ nativeEvent: { ...other, changedTouches: [other] } });
      touchLayer?.props.onPanResponderMove({
        nativeEvent: { ...other, changedTouches: [other, move] },
      });
      touchLayer?.props.onPanResponderRelease({ nativeEvent: { ...end, changedTouches: [end] } });
      touchLayer?.props.onPanResponderRelease({ nativeEvent: { ...end, changedTouches: [end] } });
    });

    expect(ref.current?.getHistory()).toEqual([
      expect.objectContaining({
        kind: 'stroke',
        points: [
          { x: 0, y: 20 },
          { x: 12, y: 20 },
          { x: 26, y: 20 },
        ],
      }),
    ]);
  });

  it('uses the current canvas size when starting a mirrored gesture after resizing', () => {
    const ref = React.createRef<DrawingCanvasRef>();
    const screen = render(<DrawingCanvas ref={ref} width={320} height={280} />);
    fireEvent.press(screen.getByLabelText('games.drawing.symmetry'));

    screen.rerender(<DrawingCanvas ref={ref} width={240} height={280} />);
    drawGesture(screen, { x: 20, y: 30 });

    expect(ref.current?.getHistory()).toEqual([
      expect.objectContaining({ points: [{ x: 20, y: 30 }] }),
      expect.objectContaining({ points: [{ x: 220, y: 30 }] }),
    ]);
  });

  it('reserves browser touches on the drawing surface for drawing', () => {
    const platform = jest.replaceProperty(Platform, 'OS', 'web');
    try {
      const screen = render(<DrawingCanvas width={320} height={280} />);
      expect(StyleSheet.flatten(findTouchLayer(screen)?.props.style).touchAction).toBe('none');
    } finally {
      platform.restore();
    }
  });

  it('discards a colour preview when the system dismisses the picker', () => {
    const screen = render(<DrawingCanvas width={320} height={280} />);
    fireEvent.press(screen.getByLabelText('games.drawing.eraserTool'));
    fireEvent.press(screen.getByTestId('open-color-picker'));
    fireEvent.press(screen.getAllByTestId('color-picker-preset-button')[0]);

    fireEvent(screen.UNSAFE_getByType(Modal), 'requestClose');

    expect(screen.queryByTestId('confirm-custom-color')).toBeNull();
    expect(screen.getAllByTestId('palette-color-button')).toHaveLength(9);
    expect(screen.getByLabelText('games.drawing.eraserTool').props.accessibilityState).toEqual({
      selected: true,
    });
  });

  it('applies a shape and its size together only when the picker is confirmed', () => {
    const ref = React.createRef<DrawingCanvasRef>();
    const screen = render(<DrawingCanvas ref={ref} width={320} height={280} />);
    const shapeButton = screen.getByLabelText(
      'games.drawing.shapeTool, games.drawing.shape.circle',
    );
    fireEvent.press(shapeButton);
    fireEvent.press(screen.getByTestId('shape-option-square'));
    fireEvent.press(screen.getByTestId('shape-size-small'));
    fireEvent.press(screen.getByRole('button', { name: 'Cancel' }));

    expect(screen.getByLabelText('games.drawing.penTool').props.accessibilityState).toEqual({
      selected: true,
    });
    fireEvent.press(shapeButton);
    expect(screen.getByTestId('shape-option-circle').props.accessibilityState).toEqual({
      selected: true,
    });
    expect(screen.getByTestId('shape-size-medium').props.accessibilityState).toEqual({
      selected: true,
    });
    fireEvent.press(screen.getByTestId('shape-option-square'));
    fireEvent.press(screen.getByTestId('shape-size-large'));
    fireEvent.press(screen.getByRole('button', { name: 'Done' }));

    const touchLayer = findTouchLayer(screen);
    act(() => {
      touchLayer?.props.onPanResponderGrant({ nativeEvent: { locationX: 40, locationY: 50 } });
      touchLayer?.props.onPanResponderTerminate();
    });
    expect(ref.current?.getHistory()).toEqual([]);

    drawGesture(screen, { x: 50, y: 60 });
    expect(ref.current?.getHistory()).toEqual([
      expect.objectContaining({ kind: 'shape', type: 'square', size: 100, x: 50, y: 60 }),
    ]);
  });

  it('leaves the drawing on cancel and makes a confirmed clear one undoable action', () => {
    const initialHistory: HistoryEntry[] = [
      { kind: 'shape', id: 'shape-1', type: 'circle', x: 40, y: 40, size: 24, color: '#FF0000' },
      { kind: 'erase', id: 'erase-1', points: [{ x: 42, y: 40 }], width: 6 },
    ];
    const ref = React.createRef<DrawingCanvasRef>();

    const { getByTestId, getByLabelText } = render(
      <DrawingCanvas ref={ref} width={320} height={280} initialHistory={initialHistory} />,
    );

    const undo = () => getByLabelText('games.drawing.undo');
    fireEvent.press(getByTestId('clear-drawing-button'));
    fireEvent.press(getByTestId('clear-confirm-cancel'));
    expect(ref.current?.getHistory()).toEqual(initialHistory);
    fireEvent.press(getByTestId('clear-drawing-button'));
    fireEvent.press(getByTestId('clear-confirm-accept'));

    expect(ref.current?.getHistory()).toHaveLength(0);
    expect(getByTestId('clear-drawing-button')).toBeDisabled();
    expect(undo()).toBeEnabled();
    fireEvent.press(undo());
    expect(ref.current?.getHistory()).toEqual(initialHistory);
    fireEvent.press(undo());
    expect(ref.current?.getHistory()).toEqual(initialHistory.slice(0, 1));
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

  it('skips duplicate pointer samples and bounds long live strokes', () => {
    const ref = React.createRef<DrawingCanvasRef>();
    const screen = render(<DrawingCanvas ref={ref} width={320} height={280} initialHistory={[]} />);
    const moves = Array.from({ length: 2_000 }, (_, index) => ({
      x: (index % 300) + 1,
      y: (index % 200) + 1,
    }));
    drawGesture(screen, { x: 1, y: 1 }, [{ x: 1, y: 1 }, ...moves]);
    const history = ref.current?.getHistory() ?? [];
    expect(history).toHaveLength(1);
    expect(history[0].kind).toBe('stroke');
    expect((history[0] as any).points.length).toBeLessThanOrEqual(1_200);
    expect((history[0] as any).points[0]).toEqual({ x: 1, y: 1 });
    expect((history[0] as any).points.at(-1).x).toBeGreaterThan(150);
    expect((history[0] as any).points.at(-1).y).toBeGreaterThan(150);
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
    fireEvent.press(shapeScreen.getByRole('button', { name: 'Done' }));

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
