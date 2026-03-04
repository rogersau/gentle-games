/**
 * Test utilities for detecting infinite render loops in React Native components.
 * 
 * Usage:
 * ```typescript
 * import { withInfiniteLoopDetection } from '../test-utils/infiniteLoopDetection';
 * 
 * it('renders without infinite loop errors', () => {
 *   withInfiniteLoopDetection(() => {
 *     render(<MyComponent />);
 *   });
 * });
 * ```
 */

/**
 * Wraps a test callback and monitors for "Maximum update depth exceeded" errors.
 * Fails the test if such an error is detected.
 * 
 * @param testFn - The test function to wrap
 * @param options - Configuration options
 * @returns The result of the test function
 */
export function withInfiniteLoopDetection<T>(
  testFn: () => T,
  options: { shouldThrow?: boolean } = {}
): T {
  const { shouldThrow = true } = options;
  const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  
  try {
    const result = testFn();
    
    const maxUpdateDepthErrors = consoleErrorSpy.mock.calls.filter(
      (call) =>
        call[0] &&
        typeof call[0] === 'string' &&
        call[0].includes('Maximum update depth exceeded')
    );
    
    if (maxUpdateDepthErrors.length > 0) {
      const errorMessage = 
        `Detected "Maximum update depth exceeded" error(s). This usually means a useEffect ` +
        `dependency array includes a value that changes on every render (like an Animated.Value). ` +
        `Remove mutable refs/Animated.Values from dependency arrays and add eslint-disable-next-line ` +
        `react-hooks/exhaustive-deps comment if needed.`;
      
      if (shouldThrow) {
        throw new Error(errorMessage);
      }
    }
    
    return result;
  } finally {
    consoleErrorSpy.mockRestore();
  }
}

/**
 * Asserts that no "Maximum update depth exceeded" errors occurred during a test.
 * Call this after rendering to check for infinite loops.
 * 
 * @param consoleErrorSpy - The spy created before the test
 */
export function assertNoInfiniteLoops(consoleErrorSpy: jest.SpyInstance): void {
  const maxUpdateDepthErrors = consoleErrorSpy.mock.calls.filter(
    (call) =>
      call[0] &&
      typeof call[0] === 'string' &&
      call[0].includes('Maximum update depth exceeded')
  );
  
  expect(maxUpdateDepthErrors).toHaveLength(0);
}

/**
 * Creates a spy on console.error for infinite loop detection.
 * Remember to restore this spy in afterEach!
 * 
 * @returns jest.SpyInstance that can be passed to assertNoInfiniteLoops
 */
export function createInfiniteLoopSpy(): jest.SpyInstance {
  return jest.spyOn(console, 'error').mockImplementation(() => {});
}
