import React from 'react';
import Svg, { Circle, Ellipse, G, Path, Polygon, Rect } from 'react-native-svg';
import type { GameId } from '../../games/registry';

export interface GameIconProps {
  gameId: GameId;
  size?: number;
  color?: string;
  testID?: string;
}

const SOFT_PINK = '#F5D8D7';
const SOFT_YELLOW = '#F7E7B5';
const SOFT_GREEN = '#CFE4D4';
const SOFT_BLUE = '#D8E7F2';
const INK = '#5C6B7A';

/** A small, calm, offline-first illustration for the home game cards. */
export const GameIcon: React.FC<GameIconProps> = ({
  gameId,
  size = 64,
  color = '#7A9CC6',
  testID,
}) => {
  return (
    <Svg
      width={size}
      height={size}
      viewBox='0 0 64 64'
      testID={testID ?? `game-icon-${gameId}`}
      accessible={false}
    >
      {renderGameIcon(gameId, color)}
    </Svg>
  );
};

function renderGameIcon(gameId: GameId, color: string): React.ReactNode {
  switch (gameId) {
    case 'memory-snap':
      return (
        <G>
          <Rect
            x='9'
            y='14'
            width='27'
            height='34'
            rx='5'
            fill={SOFT_BLUE}
            stroke={INK}
            strokeWidth='2'
          />
          <Rect
            x='28'
            y='16'
            width='27'
            height='34'
            rx='5'
            fill={color}
            opacity={0.9}
            stroke={INK}
            strokeWidth='2'
          />
          <Circle cx='41.5' cy='33' r='7' fill={SOFT_YELLOW} stroke={INK} strokeWidth='1.5' />
          <Path
            d='M39 33l2 2 4-5'
            fill='none'
            stroke={INK}
            strokeWidth='2'
            strokeLinecap='round'
            strokeLinejoin='round'
          />
          <Circle cx='18' cy='23' r='3' fill={SOFT_PINK} />
        </G>
      );
    case 'drawing':
      return (
        <G>
          <Circle cx='28' cy='34' r='18' fill={SOFT_YELLOW} stroke={INK} strokeWidth='2' />
          <Circle cx='20' cy='27' r='2.5' fill={color} />
          <Circle cx='28' cy='22' r='2.5' fill={SOFT_PINK} />
          <Circle cx='35' cy='27' r='2.5' fill={SOFT_GREEN} />
          <Path
            d='M18 39c5 5 12 7 19 1'
            fill='none'
            stroke={color}
            strokeWidth='3'
            strokeLinecap='round'
          />
          <Path
            d='M39 14l11 11-14 14-6-1 1-6z'
            fill={color}
            stroke={INK}
            strokeWidth='2'
            strokeLinejoin='round'
          />
          <Path d='M45 20l4 4' stroke={SOFT_PINK} strokeWidth='2' strokeLinecap='round' />
          <Path d='M32 36l5 3' stroke={INK} strokeWidth='1.5' />
        </G>
      );
    case 'glitter-fall':
      return (
        <G>
          <Path
            d='M12 47c7-8 14-4 20-11 6-8 11-5 20-13'
            fill='none'
            stroke={SOFT_BLUE}
            strokeWidth='5'
            strokeLinecap='round'
          />
          <Polygon
            points='18,12 20,18 26,18 21,22 23,28 18,24 13,28 15,22 10,18 16,18'
            fill={color}
          />
          <Polygon
            points='43,30 45,35 51,35 46,39 48,44 43,41 38,44 40,39 35,35 41,35'
            fill={SOFT_YELLOW}
          />
          <Circle cx='31' cy='17' r='3' fill={SOFT_PINK} />
          <Circle cx='30' cy='46' r='2.5' fill={SOFT_GREEN} />
          <Circle cx='53' cy='16' r='2' fill={SOFT_GREEN} />
        </G>
      );
    case 'bubble-pop':
      return (
        <G>
          <Circle cx='22' cy='35' r='12' fill={color} opacity={0.82} stroke={INK} strokeWidth='2' />
          <Circle cx='42' cy='28' r='13' fill={SOFT_BLUE} stroke={INK} strokeWidth='2' />
          <Circle cx='40' cy='47' r='7' fill={SOFT_PINK} stroke={INK} strokeWidth='1.5' />
          <Circle cx='18' cy='30' r='3' fill='#FFFFFF' opacity={0.75} />
          <Circle cx='38' cy='22' r='3.5' fill='#FFFFFF' opacity={0.8} />
          <Circle cx='38' cy='45' r='1.8' fill='#FFFFFF' opacity={0.75} />
          <Path d='M10 53h44' stroke={SOFT_GREEN} strokeWidth='3' strokeLinecap='round' />
        </G>
      );
    case 'category-match':
      return (
        <G>
          <Rect
            x='10'
            y='12'
            width='18'
            height='18'
            rx='4'
            fill={SOFT_BLUE}
            stroke={INK}
            strokeWidth='2'
          />
          <Rect
            x='36'
            y='12'
            width='18'
            height='18'
            rx='4'
            fill={SOFT_GREEN}
            stroke={INK}
            strokeWidth='2'
          />
          <Rect
            x='10'
            y='37'
            width='18'
            height='18'
            rx='4'
            fill={color}
            opacity={0.85}
            stroke={INK}
            strokeWidth='2'
          />
          <Rect
            x='36'
            y='37'
            width='18'
            height='18'
            rx='4'
            fill={SOFT_YELLOW}
            stroke={INK}
            strokeWidth='2'
          />
          <Path
            d='M19 30v7M45 30v7M28 21h8M28 46h8'
            stroke={color}
            strokeWidth='2.5'
            strokeLinecap='round'
          />
          <Circle cx='19' cy='21' r='4' fill={color} />
          <Circle cx='45' cy='21' r='4' fill={SOFT_PINK} />
          <Circle cx='19' cy='46' r='4' fill={SOFT_BLUE} />
          <Circle cx='45' cy='46' r='4' fill={SOFT_GREEN} />
        </G>
      );
    case 'keepy-uppy':
      return (
        <G>
          <Path
            d='M32 38c0 7-1 11-6 15'
            fill='none'
            stroke={INK}
            strokeWidth='2'
            strokeLinecap='round'
          />
          <Path
            d='M25 53c4 1 8 1 12 0'
            fill='none'
            stroke={INK}
            strokeWidth='2'
            strokeLinecap='round'
          />
          <Path
            d='M32 10c-8 0-14 6-14 14 0 10 11 15 14 17 3-2 14-7 14-17 0-8-6-14-14-14z'
            fill={color}
            opacity={0.9}
            stroke={INK}
            strokeWidth='2'
          />
          <Path
            d='M32 11v29M19 24h26'
            fill='none'
            stroke='#FFFFFF'
            strokeWidth='1.5'
            opacity={0.6}
          />
          <Circle cx='51' cy='17' r='3' fill={SOFT_YELLOW} />
          <Circle cx='12' cy='32' r='2.5' fill={SOFT_PINK} />
        </G>
      );
    case 'breathing-garden':
      return (
        <G>
          <Circle cx='32' cy='30' r='13' fill={SOFT_PINK} stroke={INK} strokeWidth='2' />
          <Circle cx='32' cy='30' r='5' fill={SOFT_YELLOW} stroke={INK} strokeWidth='1.5' />
          <Ellipse
            cx='18'
            cy='43'
            rx='9'
            ry='5'
            fill={SOFT_GREEN}
            stroke={INK}
            strokeWidth='1.5'
            transform='rotate(-28 18 43)'
          />
          <Ellipse
            cx='46'
            cy='43'
            rx='9'
            ry='5'
            fill={SOFT_GREEN}
            stroke={INK}
            strokeWidth='1.5'
            transform='rotate(28 46 43)'
          />
          <Path d='M32 43v13M12 56h40' stroke={color} strokeWidth='2.5' strokeLinecap='round' />
          <Path
            d='M17 19c3-7 9-10 15-10s12 3 15 10'
            fill='none'
            stroke={color}
            strokeWidth='2'
            strokeLinecap='round'
            opacity={0.7}
          />
        </G>
      );
    case 'pattern-train':
      return (
        <G>
          <Rect
            x='8'
            y='27'
            width='22'
            height='18'
            rx='4'
            fill={color}
            stroke={INK}
            strokeWidth='2'
          />
          <Path
            d='M11 27V20h11l8 7'
            fill={color}
            stroke={INK}
            strokeWidth='2'
            strokeLinejoin='round'
          />
          <Rect
            x='32'
            y='31'
            width='13'
            height='14'
            rx='3'
            fill={SOFT_BLUE}
            stroke={INK}
            strokeWidth='2'
          />
          <Rect
            x='47'
            y='34'
            width='9'
            height='11'
            rx='2'
            fill={SOFT_YELLOW}
            stroke={INK}
            strokeWidth='2'
          />
          <Circle cx='16' cy='47' r='4' fill={SOFT_PINK} stroke={INK} strokeWidth='2' />
          <Circle cx='26' cy='47' r='4' fill={SOFT_PINK} stroke={INK} strokeWidth='2' />
          <Circle cx='38' cy='47' r='4' fill={SOFT_PINK} stroke={INK} strokeWidth='2' />
          <Circle cx='51' cy='47' r='4' fill={SOFT_PINK} stroke={INK} strokeWidth='2' />
          <Rect
            x='15'
            y='23'
            width='7'
            height='7'
            rx='2'
            fill={SOFT_BLUE}
            stroke={INK}
            strokeWidth='1.5'
          />
          <Path d='M4 55h56' stroke={SOFT_GREEN} strokeWidth='3' strokeLinecap='round' />
        </G>
      );
    case 'number-picnic':
      return (
        <G>
          <Path
            d='M17 31h30l-4 23H21z'
            fill={color}
            opacity={0.82}
            stroke={INK}
            strokeWidth='2'
            strokeLinejoin='round'
          />
          <Path
            d='M23 31c0-10 4-15 9-15s9 5 9 15'
            fill='none'
            stroke={INK}
            strokeWidth='3'
            strokeLinecap='round'
          />
          <Path
            d='M15 34h34M19 41h26M20 48h24'
            stroke={SOFT_YELLOW}
            strokeWidth='2'
            opacity={0.8}
          />
          <Circle cx='26' cy='24' r='4' fill={SOFT_PINK} stroke={INK} strokeWidth='1.5' />
          <Circle cx='39' cy='23' r='4' fill={SOFT_GREEN} stroke={INK} strokeWidth='1.5' />
          <Circle cx='32' cy='18' r='3' fill={SOFT_YELLOW} stroke={INK} strokeWidth='1.5' />
          <Path d='M9 55h46' stroke={SOFT_GREEN} strokeWidth='3' strokeLinecap='round' />
        </G>
      );
    default:
      return assertNever(gameId);
  }
}

function assertNever(value: never): never {
  throw new Error(`Unhandled game icon: ${String(value)}`);
}
