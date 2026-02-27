import React from 'react';
import { StyleSheet } from 'react-native';
import { fireEvent, render } from '@testing-library/react-native';
import { DrawingCanvas, HistoryEntry } from './DrawingCanvas';

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
});

