import React from 'react';
import { Animated, Image } from 'react-native';
import { gamePictures } from '../assets/game-pictures';
import { fireEvent, render } from '@testing-library/react-native';
import '../i18n';
import { Tile } from './Tile';

jest.unmock('react-i18next');

const tile = {
  id: 'pair-a',
  value: '🐰',
  name: 'bunny',
  type: 'animal' as const,
  isFlipped: false,
  isMatched: false,
};

describe('Tile', () => {
  it('reveals the shared illustration only when its card is face up', () => {
    const card = { ...tile, type: 'shape' as const, value: '🧣', name: 'scarf' };
    const screen = render(<Tile tile={card} onPress={jest.fn()} size={48} position={1} />);
    expect(screen.UNSAFE_queryByType(Image)).toBeNull();
    screen.rerender(
      <Tile tile={{ ...card, isFlipped: true }} onPress={jest.fn()} size={48} position={1} />,
    );
    expect(screen.UNSAFE_getByType(Image).props.source).toEqual(gamePictures.scarf);
    expect(screen.getByRole('button', { name: 'Card 1, scarf, face up' })).toBeTruthy();
  });

  it('keeps a matched card face up with a visible check mark and accessible name', () => {
    const screen = render(
      <Tile tile={{ ...tile, isMatched: true }} onPress={jest.fn()} size={80} position={2} />,
    );

    expect(screen.UNSAFE_getByType(Image).props.source).toEqual(gamePictures.bunny);
    expect(screen.getByText('✓', { includeHiddenElements: true })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Card 2, bunny, matched' })).toBeDisabled();
  });

  it('names cards by position and changes the tap action when a mismatch can be dismissed', () => {
    const onPress = jest.fn();
    const screen = render(<Tile tile={tile} onPress={onPress} size={48} position={3} locked />);
    const hidden = screen.getByRole('button', { name: 'Card 3, face down' });
    expect(hidden).toBeDisabled();
    expect(
      screen.queryByTestId('memory-mismatch-tap-cue', { includeHiddenElements: true }),
    ).toBeNull();
    fireEvent.press(hidden);
    expect(onPress).not.toHaveBeenCalled();

    screen.rerender(
      <Tile
        tile={{ ...tile, isFlipped: true }}
        onPress={onPress}
        size={48}
        position={3}
        locked
        canDismissMismatch
      />,
    );
    const revealed = screen.getByRole('button', { name: 'Card 3, bunny, face up' });
    expect(revealed).toBeEnabled();
    expect(
      screen.getByTestId('memory-mismatch-tap-cue', { includeHiddenElements: true }),
    ).toBeTruthy();
    expect(revealed).toHaveProp('accessibilityHint', 'Turn both cards back over');
    fireEvent.press(revealed);
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('leaves the starting board still and updates the picture immediately on a flip', () => {
    const timing = jest.spyOn(Animated, 'timing');
    try {
      const screen = render(<Tile tile={tile} onPress={jest.fn()} size={48} position={1} />);
      expect(timing).not.toHaveBeenCalled();
      screen.rerender(
        <Tile tile={{ ...tile, isFlipped: true }} onPress={jest.fn()} size={48} position={1} />,
      );
      expect(screen.UNSAFE_getByType(Image).props.source).toEqual(gamePictures.bunny);
      expect(timing).toHaveBeenCalledWith(
        expect.any(Animated.Value),
        expect.objectContaining({ duration: 160, toValue: 1 }),
      );
      screen.unmount();
    } finally {
      timing.mockRestore();
    }
  });
});
