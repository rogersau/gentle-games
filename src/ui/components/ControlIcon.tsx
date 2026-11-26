import React from 'react';
import Svg, { Path } from 'react-native-svg';

const paths = {
  lock: 'M5 11h14v10H5Z M8 11V8a4 4 0 1 1 8 0v3 M12 15v2',
  more: 'M6 12a1 1 0 1 1-2 0 1 1 0 1 1 2 0 M13 12a1 1 0 1 1-2 0 1 1 0 1 1 2 0 M20 12a1 1 0 1 1-2 0 1 1 0 1 1 2 0',
  sound: 'M3 9h4l5-5v16l-5-5H3Z M16 8q4 4 0 8 M19 4q7 8 0 16',
  back: 'm15 6-6 6 6 6',
  settings:
    'M3 6h5 M13 6h8 M3 12h11 M19 12h2 M3 18h3 M11 18h10 M13 6a2.5 2.5 0 1 1-5 0 2.5 2.5 0 1 1 5 0 M19 12a2.5 2.5 0 1 1-5 0 2.5 2.5 0 1 1 5 0 M11 18a2.5 2.5 0 1 1-5 0 2.5 2.5 0 1 1 5 0',
  eraser: 'M3 13l9-9a2 2 0 0 1 3 0l5 5a2 2 0 0 1 0 3l-8 8H8l-5-5a2 2 0 0 1 0-2Z M7 9l8 8 M12 20h9',
  undo: 'M9 4L3 10l6 5 M4 10h9c5 0 8 3 8 8v2',
  bin: 'M4 6h16 M9 6V3h6v3 M6 6l1 15h10l1-15 M10 10v6 M14 10v6',
  square: 'M4 4h16v16H4Z',
  triangle: 'M12 3l10 17H2Z',
  circle: 'M21 12a9 9 0 1 1-18 0 9 9 0 1 1 18 0Z',
  play: 'M8 4 20 12 8 20Z',
  pause: 'M8 4v16 M16 4v16',
  stop: 'M5 5h14v14H5Z',
  next: 'M4 12h15 M13 5l7 7-7 7',
  repeat: 'M4 10a8 8 0 1 1 0 5 M4 4v6h6',
  add: 'M12 4v16 M4 12h16',
  settle: 'M12 3v12 M7 10l5 5 5-5 M4 21h16',
  swirl: 'M12 12c4-5 10 1 6 6-5 6-15 1-14-6 1-7 8-10 14-6',
  eye: 'M2 12Q12 0 22 12Q12 24 2 12Z M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0',
  cards: 'M3 4h7v16H3Z M14 4h7v16h-7Z',
  check: 'M5 12l4 4 10-9',
  tap: 'M8 13V7a2 2 0 0 1 4 0v5h5a2 2 0 0 1 2 2v3l-2 4h-6l-5-6a2 2 0 0 1 2-2Z M4 6l-2-1 M10 2V1 M16 6l2-1',
} as const;

export type ControlIconName = keyof typeof paths;

export const ControlIcon: React.FC<{ name: ControlIconName; color: string; size?: number }> = ({
  name,
  color,
  size = 22,
}) => (
  <Svg width={size} height={size} viewBox='0 0 24 24' aria-hidden accessible={false}>
    <Path
      d={paths[name]}
      stroke={color}
      strokeWidth={1.8}
      fill='none'
      strokeLinecap='round'
      strokeLinejoin='round'
    />
  </Svg>
);
