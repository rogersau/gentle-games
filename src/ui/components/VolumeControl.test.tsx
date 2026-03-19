import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { VolumeControl } from './VolumeControl';

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

  it('sets volume directly via segment press', () => {
    const { getByLabelText } = render(
      <VolumeControl value={0.2} onValueChange={mockOnValueChange} />,
    );

    fireEvent.press(getByLabelText('Set volume to 70%'));
    expect(mockOnValueChange).toHaveBeenCalledWith(0.7);
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
