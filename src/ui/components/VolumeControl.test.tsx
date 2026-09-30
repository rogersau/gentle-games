import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { VolumeControl } from './VolumeControl';
import { StyleSheet } from 'react-native';
import { HitTarget } from '../tokens';

describe('VolumeControl', () => {
  const mockOnValueChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders with initial volume', () => {
    const { getByLabelText } = render(
      <VolumeControl value={0.5} onValueChange={mockOnValueChange} />,
    );
    expect(getByLabelText('Volume 50%')).toBeTruthy();
  });

  it('decreases volume when minus button pressed', () => {
    const { getByLabelText } = render(
      <VolumeControl value={0.5} onValueChange={mockOnValueChange} />,
    );

    fireEvent.press(getByLabelText('Decrease volume'));
    expect(mockOnValueChange).toHaveBeenCalledWith(0.4);
  });

  it('increases volume when plus button pressed', () => {
    const { getByLabelText } = render(
      <VolumeControl value={0.5} onValueChange={mockOnValueChange} />,
    );

    fireEvent.press(getByLabelText('Increase volume'));
    expect(mockOnValueChange).toHaveBeenCalledWith(0.6);
  });

  it('does not decrease below 0', () => {
    const { getByLabelText } = render(
      <VolumeControl value={0} onValueChange={mockOnValueChange} />,
    );

    const decreaseButton = getByLabelText('Decrease volume');
    expect(decreaseButton.props.accessibilityState?.disabled).toBe(true);
  });

  it('does not increase above 1', () => {
    const { getByLabelText } = render(
      <VolumeControl value={1} onValueChange={mockOnValueChange} />,
    );

    const increaseButton = getByLabelText('Increase volume');
    expect(increaseButton.props.accessibilityState?.disabled).toBe(true);
  });

  it('sets volume directly on the full adjustable track', () => {
    const { getByRole } = render(<VolumeControl value={0.2} onValueChange={mockOnValueChange} />);

    const track = getByRole('adjustable');
    fireEvent(track, 'layout', { nativeEvent: { layout: { width: 200 } } });
    fireEvent.press(track, { nativeEvent: { locationX: 140 } });
    expect(mockOnValueChange).toHaveBeenCalledWith(0.7);
  });

  it('offers screen-reader adjustments and keeps every interactive control at the touch-target minimum', () => {
    const { getByRole, getAllByRole } = render(
      <VolumeControl value={0.5} onValueChange={mockOnValueChange} />,
    );
    const track = getByRole('adjustable');
    expect(track.props.accessibilityValue).toEqual({ min: 0, max: 100, now: 50 });
    fireEvent(track, 'accessibilityAction', { nativeEvent: { actionName: 'increment' } });
    expect(mockOnValueChange).toHaveBeenLastCalledWith(0.6);
    fireEvent(track, 'accessibilityAction', { nativeEvent: { actionName: 'decrement' } });
    expect(mockOnValueChange).toHaveBeenLastCalledWith(0.4);
    for (const control of [track, ...getAllByRole('button')]) {
      const style = StyleSheet.flatten(control.props.style);
      expect(style.height ?? style.minHeight).toBeGreaterThanOrEqual(HitTarget.min);
      expect(style.width ?? style.minWidth).toBeGreaterThanOrEqual(HitTarget.min);
    }
  });

  it('renders with custom step count', () => {
    const { getByLabelText } = render(
      <VolumeControl value={0.5} onValueChange={mockOnValueChange} steps={5} />,
    );
    expect(getByLabelText('Volume 50%')).toBeTruthy();
  });

  it('updates volume with different step counts', () => {
    const { getByLabelText } = render(
      <VolumeControl value={0.4} onValueChange={mockOnValueChange} steps={5} />,
    );

    fireEvent.press(getByLabelText('Increase volume'));
    expect(mockOnValueChange).toHaveBeenCalledWith(0.6);
  });
});
