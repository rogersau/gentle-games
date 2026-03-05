import {
  assertNoInfiniteLoops,
  createInfiniteLoopSpy,
  withInfiniteLoopDetection,
} from './infiniteLoopDetection';

describe('infiniteLoopDetection utilities', () => {
  it('returns callback result when no loop errors are logged', () => {
    const value = withInfiniteLoopDetection(() => 'ok');
    expect(value).toBe('ok');
  });

  it('throws when maximum update depth error is detected', () => {
    expect(() =>
      withInfiniteLoopDetection(() => {
        console.error('Warning: Maximum update depth exceeded in component');
      })
    ).toThrow('Detected "Maximum update depth exceeded" error(s).');
  });

  it('can suppress throwing when shouldThrow is false', () => {
    expect(() =>
      withInfiniteLoopDetection(
        () => {
          console.error('Maximum update depth exceeded');
        },
        { shouldThrow: false }
      )
    ).not.toThrow();
  });

  it('assertNoInfiniteLoops passes when no matching errors occurred', () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    console.error('Some unrelated warning');

    expect(() => assertNoInfiniteLoops(spy)).not.toThrow();
    spy.mockRestore();
  });

  it('assertNoInfiniteLoops fails when max depth errors occurred', () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    console.error('Maximum update depth exceeded while rendering');

    expect(() => assertNoInfiniteLoops(spy)).toThrow();
    spy.mockRestore();
  });

  it('createInfiniteLoopSpy returns a restorable console.error spy', () => {
    const spy = createInfiniteLoopSpy();
    expect(jest.isMockFunction(console.error)).toBe(true);
    spy.mockRestore();
  });
});
