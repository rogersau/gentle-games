import React from 'react';
import { render } from '@testing-library/react-native';
import { Tile } from './Tile';

describe('Tile', () => {
  it('keeps a matched card face up and settled', () => {
    const screen = render(
      <Tile
        tile={{
          id: 'pair-a',
          value: '🐰',
          name: 'bunny',
          type: 'animal',
          isFlipped: false,
          isMatched: true,
        }}
        onPress={jest.fn()}
        size={80}
      />,
    );

    expect(screen.getByText('🐰')).toBeTruthy();
    expect(screen.getByRole('button').props.accessibilityLabel).toContain('tileMatched');
  });
});
