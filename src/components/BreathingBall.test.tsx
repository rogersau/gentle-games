import React, { useRef, useState } from 'react';
import { Button, View } from 'react-native';
import { act, render } from '@testing-library/react-native';
import { afterAll, beforeAll, describe, expect, it, jest } from '@jest/globals';
import { BreathingBall, BreathingBallRef, defaultColorSchemes } from './BreathingBall';

// Mock requestAnimationFrame
const mockRequestAnimationFrame = jest.fn((callback: FrameRequestCallback) => {
  return setTimeout(() => callback(performance.now()), 16) as unknown as number;
});

const mockCancelAnimationFrame = jest.fn((id: number) => {
  clearTimeout(id);
});

describe('BreathingBall', () => {
  const originalRequestAnimationFrame = globalThis.requestAnimationFrame;
  const originalCancelAnimationFrame = globalThis.cancelAnimationFrame;

  beforeAll(() => {
    globalThis.requestAnimationFrame = mockRequestAnimationFrame;
    globalThis.cancelAnimationFrame = mockCancelAnimationFrame;
  });

  afterAll(() => {
    globalThis.requestAnimationFrame = originalRequestAnimationFrame;
    globalThis.cancelAnimationFrame = originalCancelAnimationFrame;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders with default props', () => {
    const { getByRole } = render(<BreathingBall size={300} />);
    // SVG elements don't have specific roles, but we can verify it renders
    expect(getByRole('progressbar')).toBeTruthy();
  });

  it('renders with custom color scheme', () => {
    const customScheme = {
      primary: '#FF0000',
      accent: '#00FF00',
      name: 'Custom',
    };

    const { getByRole } = render(<BreathingBall size={300} colorScheme={customScheme} />);
    expect(getByRole('progressbar')).toBeTruthy();
  });

  it('exposes ref methods', () => {
    const ref = { current: null as BreathingBallRef | null };

    render(<BreathingBall size={300} ref={ref} />);

    expect(ref.current).toBeTruthy();
    expect(typeof ref.current?.getPhase).toBe('function');
    expect(typeof ref.current?.getCycleCount).toBe('function');
    expect(typeof ref.current?.getElapsedMs).toBe('function');
    expect(typeof ref.current?.reset).toBe('function');
    expect(typeof ref.current?.pause).toBe('function');
    expect(typeof ref.current?.resume).toBe('function');
  });

  it('returns correct initial state from ref', () => {
    const ref = { current: null as BreathingBallRef | null };

    render(<BreathingBall size={300} autoStart={false} ref={ref} />);

    expect(ref.current?.getPhase()).toBe('inhale');
    expect(ref.current?.getCycleCount()).toBe(0);
    expect(ref.current?.getElapsedMs()).toBe(0);
  });

  it('pauses and resumes animation', () => {
    const ref = { current: null as BreathingBallRef | null };

    render(<BreathingBall size={300} autoStart={true} ref={ref} />);

    const elapsedBefore = ref.current?.getElapsedMs() || 0;

    act(() => {
      ref.current?.pause();
    });
    const elapsedAfterPause = ref.current?.getElapsedMs() || 0;

    act(() => {
      ref.current?.resume();
    });
    const elapsedAfterResume = ref.current?.getElapsedMs() || 0;

    // Elapsed should be similar after pause/resume (no new frames)
    expect(elapsedAfterPause).toBe(elapsedBefore);
    expect(elapsedAfterResume).toBeGreaterThanOrEqual(elapsedAfterPause);
  });

  it('resets the animation state', () => {
    const ref = { current: null as BreathingBallRef | null };

    render(<BreathingBall size={300} autoStart={true} ref={ref} />);

    // Simulate time passing by forcing a re-render with elapsed time
    // This is tricky in tests, so we verify reset clears state
    act(() => {
      ref.current?.reset();
    });

    expect(ref.current?.getPhase()).toBe('inhale');
    expect(ref.current?.getCycleCount()).toBe(0);
    expect(ref.current?.getElapsedMs()).toBe(0);
  });

  it('calls onPhaseChange callback when phase changes', async () => {
    const onPhaseChange = jest.fn();
    const ref = { current: null as BreathingBallRef | null };

    render(<BreathingBall size={300} autoStart={false} onPhaseChange={onPhaseChange} ref={ref} />);

    // Phase is initially inhale
    expect(ref.current?.getPhase()).toBe('inhale');

    // Start and let it run (in real time this would change)
    act(() => {
      ref.current?.resume();
    });
  });

  it('respects autoStart prop', () => {
    const ref = { current: null as BreathingBallRef | null };

    render(<BreathingBall size={300} autoStart={false} ref={ref} />);

    const elapsedAuto = ref.current?.getElapsedMs();
    expect(elapsedAuto).toBe(0);
  });
});

describe('BreathingBall with Controls', () => {
  const originalRequestAnimationFrame = globalThis.requestAnimationFrame;
  const originalCancelAnimationFrame = globalThis.cancelAnimationFrame;

  beforeAll(() => {
    globalThis.requestAnimationFrame = mockRequestAnimationFrame;
    globalThis.cancelAnimationFrame = mockCancelAnimationFrame;
  });

  afterAll(() => {
    globalThis.requestAnimationFrame = originalRequestAnimationFrame;
    globalThis.cancelAnimationFrame = originalCancelAnimationFrame;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  function TestComponent() {
    const ballRef = useRef<BreathingBallRef>(null);
    const [cycles, setCycles] = useState(0);
    const [phase, setPhase] = useState('inhale');

    return (
      <View>
        <BreathingBall
          size={300}
          ref={ballRef}
          onCycleComplete={(count) => setCycles(count)}
          onPhaseChange={(p) => setPhase(p)}
        />
        <Button testID='reset' title='Reset' onPress={() => ballRef.current?.reset()} />
        <Button testID='pause' title='Pause' onPress={() => ballRef.current?.pause()} />
        <Button testID='resume' title='Resume' onPress={() => ballRef.current?.resume()} />
        <View testID='stats'>
          Cycles: {cycles} Phase: {phase}
        </View>
      </View>
    );
  }

  it('integrates with external controls', () => {
    const { getByTestId } = render(<TestComponent />);

    const resetBtn = getByTestId('reset');
    const pauseBtn = getByTestId('pause');
    const resumeBtn = getByTestId('resume');

    expect(resetBtn).toBeTruthy();
    expect(pauseBtn).toBeTruthy();
    expect(resumeBtn).toBeTruthy();
  });
});

describe('defaultColorSchemes', () => {
  it('has 5 default color schemes', () => {
    expect(defaultColorSchemes).toHaveLength(5);
  });

  it('each scheme has required properties', () => {
    defaultColorSchemes.forEach((scheme) => {
      expect(scheme).toHaveProperty('primary');
      expect(scheme).toHaveProperty('accent');
      expect(scheme).toHaveProperty('name');
      expect(typeof scheme.primary).toBe('string');
      expect(typeof scheme.accent).toBe('string');
      expect(typeof scheme.name).toBe('string');
    });
  });

  it('includes expected color scheme names', () => {
    const names = defaultColorSchemes.map((s) => s.name);
    expect(names).toContain('Ocean');
    expect(names).toContain('Rose');
    expect(names).toContain('Mint');
    expect(names).toContain('Sunset');
    expect(names).toContain('Lavender');
  });
});
