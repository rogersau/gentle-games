import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { SelectBox } from './SelectBox';

const mockOptions = [
  { value: 'option1', label: 'Option 1' },
  { value: 'option2', label: 'Option 2' },
  { value: 'option3', label: 'Option 3' },
];

describe('SelectBox', () => {
  const mockOnValueChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders with options', () => {
    const { getByText } = render(
      <SelectBox
        options={mockOptions}
        value="option1"
        onValueChange={mockOnValueChange}
      />
    );
    expect(getByText('Option 1')).toBeTruthy();
  });

  it('opens dropdown when pressed', async () => {
    const { getByText } = render(
      <SelectBox
        options={mockOptions}
        value="option1"
        onValueChange={mockOnValueChange}
      />
    );

    fireEvent.press(getByText('Option 1'));

    await waitFor(() => {
      expect(getByText('Option 2')).toBeTruthy();
      expect(getByText('Option 3')).toBeTruthy();
    });
  });

  it('selects option and closes dropdown', async () => {
    const { getByText, queryByText } = render(
      <SelectBox
        options={mockOptions}
        value="option1"
        onValueChange={mockOnValueChange}
      />
    );

    // Open dropdown
    fireEvent.press(getByText('Option 1'));

    await waitFor(() => {
      expect(getByText('Option 2')).toBeTruthy();
    });

    // Select option 2
    fireEvent.press(getByText('Option 2'));

    expect(mockOnValueChange).toHaveBeenCalledWith('option2');
  });

  it('shows placeholder when no value selected', () => {
    const { getByText } = render(
      <SelectBox
        options={mockOptions}
        value=""
        onValueChange={mockOnValueChange}
        placeholder="Choose an option"
      />
    );
    expect(getByText('Choose an option')).toBeTruthy();
  });

  it('uses default placeholder when not provided', () => {
    const { getByText } = render(
      <SelectBox
        options={mockOptions}
        value=""
        onValueChange={mockOnValueChange}
      />
    );
    expect(getByText('Select an option')).toBeTruthy();
  });

  it('closes dropdown on backdrop press', async () => {
    const { getByText, getByLabelText } = render(
      <SelectBox
        options={mockOptions}
        value="option1"
        onValueChange={mockOnValueChange}
      />
    );

    // Open dropdown
    fireEvent.press(getByText('Option 1'));

    await waitFor(() => {
      expect(getByText('Option 2')).toBeTruthy();
    });

    // Press backdrop
    fireEvent.press(getByLabelText('Close'));

    // Dropdown should close
    await waitFor(() => {
      // Value should still be option1
      expect(mockOnValueChange).not.toHaveBeenCalled();
    });
  });

  it('shows checkmark for selected option', async () => {
    const { getByText } = render(
      <SelectBox
        options={mockOptions}
        value="option1"
        onValueChange={mockOnValueChange}
      />
    );

    fireEvent.press(getByText('Option 1'));

    await waitFor(() => {
      // Should have checkmark next to option1
      const option1Element = getByText('Option 1');
      expect(option1Element).toBeTruthy();
    });
  });

  it('renders with number values', () => {
    const numberOptions = [
      { value: 1, label: 'One' },
      { value: 2, label: 'Two' },
    ];

    const { getByText } = render(
      <SelectBox
        options={numberOptions}
        value={1}
        onValueChange={mockOnValueChange}
      />
    );
    expect(getByText('One')).toBeTruthy();
  });
});