import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { Mochi } from './Mochi';

describe('Mochi', () => {
  it('renders with sm size', () => {
    render(<Mochi variant='idle' size='sm' animate={false} />);
    expect(screen.getByTestId('mochi')).toBeTruthy();
  });

  it('renders floating variant', () => {
    render(<Mochi variant='floating' size='md' animate={false} />);
    expect(screen.getByTestId('mochi')).toBeTruthy();
  });

  it('renders happy variant', () => {
    render(<Mochi variant='happy' size='lg' animate={false} />);
    expect(screen.getByTestId('mochi')).toBeTruthy();
  });
});
