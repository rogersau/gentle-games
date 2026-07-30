import React from 'react';
import { Text } from 'react-native';
import { fireEvent, render } from '@testing-library/react-native';
import { CaregiverGate } from './CaregiverGate';

describe('CaregiverGate', () => {
  beforeEach(() => {
    jest.spyOn(Math, 'random').mockReturnValue(0);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('keeps caregiver content hidden until the full challenge answer matches', () => {
    const screen = render(
      <CaregiverGate>
        <Text>Caregiver content</Text>
      </CaregiverGate>,
    );

    expect(screen.getByTestId('caregiver-challenge').props.children).toEqual(['12 + 11', ' = ?']);
    expect(screen.queryByText('Caregiver content')).toBeNull();

    fireEvent.changeText(screen.getByTestId('caregiver-answer'), '23-');
    fireEvent.press(screen.getByTestId('caregiver-unlock'));
    expect(screen.getByText('practiceHistory.gate.error')).toBeTruthy();
    expect(screen.queryByText('Caregiver content')).toBeNull();

    fireEvent.changeText(screen.getByTestId('caregiver-answer'), '23');
    fireEvent.press(screen.getByTestId('caregiver-unlock'));
    expect(screen.getByText('Caregiver content')).toBeTruthy();
  });
});
