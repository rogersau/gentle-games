import React from 'react';
import { Alert, StyleSheet } from 'react-native';
import { act, fireEvent, render } from '@testing-library/react-native';
import { DrawingCanvas, DrawingCanvasRef, HistoryEntry } from './DrawingCanvas';

describe('DrawingCanvas', () => {
  it('does not add duplicate palette colors when confirming the current color', () => {
    const initialHistory: HistoryEntry[] = [];

    const { getByTestId, getAllByTestId } = render(
      <DrawingCanvas width={320} height={280} initialHistory={initialHistory} />
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
        canvasBackgroundColor="#3F444D"
      />
    );

    const containerStyle = StyleSheet.flatten(getByTestId('drawing-canvas-container').props.style);
    expect(containerStyle.backgroundColor).toBe('#3F444D');
  });

  it('shows confirmation before clearing and clears on confirm', () => {
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    const initialHistory: HistoryEntry[] = [
      { kind: 'shape', id: 'shape-1', type: 'circle', x: 40, y: 40, size: 24, color: '#FF0000' },
    ];
    const ref = React.createRef<DrawingCanvasRef>();

    const { getByTestId } = render(
      <DrawingCanvas ref={ref} width={320} height={280} initialHistory={initialHistory} />
    );

    expect(ref.current?.getHistory()).toHaveLength(1);
    fireEvent.press(getByTestId('clear-drawing-button'));
    expect(alertSpy).toHaveBeenCalledTimes(1);

    const buttons = alertSpy.mock.calls[0]?.[2];
    const clearButton = buttons?.find((button) => button.text === 'Clear');
    act(() => clearButton?.onPress?.());

    expect(ref.current?.getHistory()).toHaveLength(0);
    alertSpy.mockRestore();
  });
});

