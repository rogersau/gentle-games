import { LayoutChangeEvent, useWindowDimensions } from 'react-native';
import { useCallback, useState } from 'react';

export interface GameViewport {
  width: number;
  height: number;
}

/**
 * Keep the dimensions used by a game tied to the space its content actually
 * receives.  Window dimensions include headers, safe areas and browser chrome,
 * so using them directly can make a board extend underneath controls.
 */
export const useMeasuredGameViewport = () => {
  const windowDimensions = useWindowDimensions();
  const [measured, setMeasured] = useState<GameViewport | null>(null);

  const onLayout = useCallback((event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
      return;
    }

    setMeasured((previous) =>
      previous?.width === width && previous.height === height ? previous : { width, height },
    );
  }, []);

  return { viewport: measured ?? windowDimensions, onLayout };
};

export interface GameBoardSizeOptions {
  /** Space consumed by the content's horizontal padding. */
  horizontalPadding: number;
  /** Space consumed by text, counters and controls above/below the board. */
  verticalReserve: number;
  /** Keep a compact board usable when a short viewport has to scroll. */
  compactMinHeight: number;
  /** Fraction of the measured viewport height available to the board. */
  maxHeightRatio: number;
}

/**
 * Calculate a board that fits the measured width and available height. The
 * compact minimum is intentionally lower than the old hard minimums; when the
 * viewport is shorter than it, AppScreen's scroll view keeps the full game
 * reachable instead of clipping it.
 */
export const calculateGameBoardSize = (
  viewport: GameViewport,
  options: GameBoardSizeOptions,
): GameViewport => {
  const width = Math.max(1, viewport.width - options.horizontalPadding);
  const availableHeight = Math.max(1, viewport.height - options.verticalReserve);
  const proportionalHeight = Math.max(1, viewport.height * options.maxHeightRatio);
  const height = Math.max(
    options.compactMinHeight,
    Math.min(availableHeight, proportionalHeight),
  );

  return { width, height };
};

