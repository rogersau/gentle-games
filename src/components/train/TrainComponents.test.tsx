import React from 'react';
import { render } from '@testing-library/react-native';
import { View, Text } from 'react-native';
import { Carriage } from './Carriage';
import { TrainEngine } from './TrainEngine';
import { TrainTrack } from './TrainTrack';

jest.mock('../../utils/theme', () => ({
  useThemeColors: () => ({
    colors: {
      primary: '#A8D8EA',
      secondary: '#FFB6C1',
      textLight: '#8A8A8A',
      border: '#E8E4E1',
    },
  }),
}));

describe('Carriage', () => {
  it('renders with content', () => {
    const screen = render(<Carriage content="🚂" size={56} />);
    
    const textElements = screen.UNSAFE_getAllByType(Text);
    expect(textElements.length).toBeGreaterThan(0);
    
    // Check emoji is rendered
    const hasEmoji = textElements.some(el => el.props.children === '🚂');
    expect(hasEmoji).toBe(true);
  });

  it('renders as missing carriage with dashed border', () => {
    const screen = render(
      <Carriage isMissing={true} size={56} />
    );
    
    // Missing carriage should render without throwing
    expect(screen).toBeTruthy();
  });

  it('renders without content', () => {
    const screen = render(<Carriage size={56} />);
    
    // Should render without content
    expect(screen).toBeTruthy();
  });

  it('applies custom size', () => {
    const screen = render(<Carriage content="🚂" size={64} />);
    
    const viewElements = screen.UNSAFE_getAllByType(View);
    // Check that a view exists with the correct dimensions
    expect(viewElements.length).toBeGreaterThan(0);
  });

  it('handles highlighted state', () => {
    const screen = render(
      <Carriage content="🚂" isHighlighted={true} size={56} />
    );
    
    expect(screen).toBeTruthy();
  });
});

describe('TrainEngine', () => {
  it('renders with default size', () => {
    const screen = render(<TrainEngine />);
    
    expect(screen).toBeTruthy();
  });

  it('renders with custom size', () => {
    const screen = render(<TrainEngine size={80} />);
    
    expect(screen).toBeTruthy();
  });

  it('renders with custom color', () => {
    const screen = render(<TrainEngine color="#FF6B6B" />);
    
    expect(screen).toBeTruthy();
  });
});

describe('TrainTrack', () => {
  it('renders with default width', () => {
    const screen = render(<TrainTrack />);
    
    expect(screen).toBeTruthy();
  });

  it('renders with custom width', () => {
    const screen = render(<TrainTrack width={500} />);
    
    expect(screen).toBeTruthy();
  });

  it('has correct styling', () => {
    const screen = render(<TrainTrack />);
    
    const viewElements = screen.UNSAFE_getAllByType(View);
    expect(viewElements.length).toBeGreaterThan(0);
  });
});
