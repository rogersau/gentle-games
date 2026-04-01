/**
 * Test utilities for detecting "Cannot update a component while rendering a different component" errors.
 *
 * Usage:
 * ```typescript
 * import { createSetStateDuringRenderSpy, assertNoSetStateDuringRender } from '../test-utils/setStateDetection';
 *
 * it('renders without setState during render errors', () => {
 *   const spy = createSetStateDuringRenderSpy();
 *   render(<MyComponent />);
 *   assertNoSetStateDuringRender(spy);
 *   spy.mockRestore();
 * });
 * ```
 */

/**
 * Creates a spy on console.error to detect setState during render errors.
 * Remember to call mockRestore() in afterEach!
 *
 * @returns jest.SpyInstance that can be passed to assertNoSetStateDuringRender
 */
export function createSetStateDuringRenderSpy(): jest.SpyInstance {
  return jest.spyOn(console, 'error').mockImplementation(() => {});
}

/**
 * Asserts that no "Cannot update a component while rendering" errors occurred.
 * Call this after rendering to check for setState during render issues.
 *
 * @param consoleErrorSpy - The spy created by createSetStateDuringRenderSpy
 */
export function assertNoSetStateDuringRender(consoleErrorSpy: jest.SpyInstance): void {
  const setStateDuringRenderErrors = consoleErrorSpy.mock.calls.filter(
    (call) =>
      call[0] && typeof call[0] === 'string' && call[0].includes('Cannot update a component'),
  );

  expect(setStateDuringRenderErrors).toHaveLength(0);
}
