import {
  advanceGuidedProgress,
  createCopyAndContinueGuide,
  createDrawingGuidedConfig,
  createGuidedPath,
  isGuidedPathComplete,
} from './drawingGuidedModes';

describe('guided drawing modes', () => {
  it('keeps the local defaults stable and configurable', () => {
    const config = createDrawingGuidedConfig('gentle-trails', {
      tolerance: 60,
      widePath: 84,
    });

    expect(config.mode).toBe('gentle-trails');
    expect(config.tolerance).toBe(60);
    expect(config.widePath).toBe(84);
  });

  it('advances through a wide tolerance without emitting a failure or resetting', () => {
    const path = createGuidedPath('straight', 300, 200);
    const progress = advanceGuidedProgress(path, 0, [{ x: path[4].x, y: path[4].y + 20 }], 24);
    const interrupted = advanceGuidedProgress(path, progress, [{ x: 5, y: 5 }], 24);
    const resumed = advanceGuidedProgress(path, interrupted, [path[path.length - 1]], 24);

    expect(progress).toBeGreaterThan(0);
    expect(interrupted).toBe(progress);
    expect(resumed).toBe(path.length - 1);
    expect(isGuidedPathComplete(path, resumed)).toBe(true);
  });

  it('supports a single tap as a non-drag path sample', () => {
    const path = createGuidedPath('straight', 300, 200);
    const progress = advanceGuidedProgress(path, 0, [path[0]], 10);
    expect(progress).toBeGreaterThanOrEqual(0);
  });

  it.each(['copy-line', 'complete-picture', 'continue-pattern'] as const)(
    'creates a visible model and a separate continuation for %s',
    (activity) => {
      const guide = createCopyAndContinueGuide(activity, 300, 200);

      expect(guide.model.length).toBeGreaterThan(1);
      expect(guide.continuation.length).toBeGreaterThan(1);
      expect(guide.model).not.toEqual(guide.continuation);
    },
  );
});
