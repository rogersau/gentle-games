import React from 'react';
import Svg, { Path } from 'react-native-svg';

const paths = {
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
} as const;

export type ControlIconName = keyof typeof paths;

export const ControlIcon: React.FC<{ name: ControlIconName; color: string }> = ({
  name,
  color,
}) => (
  <Svg width={22} height={22} viewBox='0 0 24 24' aria-hidden accessible={false}>
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
