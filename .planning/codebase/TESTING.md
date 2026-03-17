# Testing Patterns

**Analysis Date:** 2026-03-17

## Test Framework

**Runner:**
- Jest 29 with the Expo preset via `jest-expo`, configured in `jest.config.js`
- Config: `jest.config.js`

**Assertion Library:**
- Jest assertions with `@testing-library/react-native` query and event helpers, as used in `App.test.tsx`, `src/screens/HomeScreen.test.tsx`, and `src/context/SettingsContext.test.tsx`

**Run Commands:**
```bash
npm test                     # Run all Jest tests
npm run test:watch           # Run Jest in watch mode
npm run test:ci              # Run Jest in CI mode with coverage
npm run test:single          # Run Jest serially
npm run test:i18n            # Run only translation validation tests
npm run smoke:android:test   # Run Maestro smoke flow
npm run smoke:android:ci     # Build, install, and run Android smoke flow
```

## Test File Organization

**Location:**
- Tests are mostly co-located with the source file under `src/`, for example `src/screens/HomeScreen.test.tsx`, `src/utils/gameLogic.test.ts`, and `src/ui/components/VolumeControl.test.tsx`.
- Root-level entry behavior is tested in `App.test.tsx`.
- Build-script behavior is also tested in place, for example `scripts/prepare-pwa.test.js`.
- Device smoke coverage lives in `.maestro/` with flows such as `.maestro/smoke-home.yml`, `.maestro/settings-flow.yml`, and `.maestro/accessibility-flow.yml`.

**Naming:**
- Use `*.test.tsx` for component and screen tests.
- Use `*.test.ts` for hooks and pure utilities.
- Keep the test file next to the implementation unless the subject is a root script or app entry point.

**Structure:**
```text
src/
  screens/
    HomeScreen.tsx
    HomeScreen.test.tsx
  utils/
    gameLogic.ts
    gameLogic.test.ts
  ui/components/
    VolumeControl.tsx
    VolumeControl.test.tsx
scripts/
  prepare-pwa.js
  prepare-pwa.test.js
```

## Test Structure

**Suite Organization:**
```typescript
describe('HomeScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows difficulty modal for Memory Snap and navigates to Game after selection', async () => {
    const screen = render(<HomeScreen />);

    const memorySnapCard = screen.getAllByRole('button').find(
      (el: any) => el.props.accessibilityLabel?.includes('Memory Snap')
    );
    fireEvent.press(memorySnapCard!);

    const hardButton = screen.getAllByRole('button').find(
      (el: any) => el.props.accessibilityLabel?.includes('Hard')
    );
    fireEvent.press(hardButton!);

    await waitFor(() => {
      expect(mockUpdateSettings).toHaveBeenCalledWith({ difficulty: 'hard' });
      expect(mockNavigate).toHaveBeenCalledWith('Game');
    });
  });
});
```
- This pattern comes directly from `src/screens/HomeScreen.test.tsx`.

**Patterns:**
- Reset mock state in `beforeEach` with `jest.clearAllMocks()`, as in `App.test.tsx`, `src/screens/SettingsScreen.test.tsx`, and `src/utils/analytics.test.ts`.
- Use `render(...)` plus Testing Library queries for components and screens, as in `src/ui/components/SelectBox.test.tsx` and `src/components/GentleErrorBoundary.test.tsx`.
- Use `waitFor(...)` for async storage loads, modal appearance, and delayed state changes, as in `src/context/SettingsContext.test.tsx`, `src/screens/DrawingScreen.test.tsx`, and `src/ui/components/SelectBox.test.tsx`.
- Use `renderHook(...)` and `act(...)` for custom hooks, as in `src/screens/usePatternTrainGame.test.ts`.
- Use `jest.useFakeTimers()` and `jest.advanceTimersByTime(...)` for timer-driven logic, as in `src/context/ParentTimerContext.test.tsx` and `src/screens/usePatternTrainGame.test.ts`.

## Mocking

**Framework:** Jest module mocks and spies

**Patterns:**
```typescript
jest.mock('../context/SettingsContext', () => ({
  useSettings: () => ({
    settings: mockSettings,
    updateSettings: mockUpdateSettings,
  }),
}));

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: mockNavigate,
  }),
}));
```
- This pattern is used throughout `src/screens/HomeScreen.test.tsx`, `src/screens/SettingsScreen.test.tsx`, and `src/context/ParentTimerContext.test.tsx`.

```typescript
jest.unmock('./SettingsContext');

const storage = AsyncStorage as unknown as {
  getItem: jest.Mock;
  setItem: jest.Mock;
  removeItem: jest.Mock;
};
```
- Use this pattern from `src/context/SettingsContext.test.tsx` when a file normally receives a global mock from `jest.setup.ts` but one suite needs the real implementation.

```typescript
beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});
```
- Use fake timers when testing interval or timeout orchestration, as in `src/context/ParentTimerContext.test.tsx` and `src/screens/usePatternTrainGame.test.ts`.

**Global setup:**
- `jest.setup.ts` provides default mocks for `@react-native-async-storage/async-storage`, `react-i18next`, `posthog-react-native`, `expo-sensors`, `expo-audio`, `@sentry/react-native`, `expo-constants`, and selected app modules like `./src/utils/sounds` and `./src/context/SettingsContext`.
- `jest.setup.ts` also suppresses expected console noise for i18n notices, intentional drawing-storage warnings, and React `act(...)` warnings.
- `jest.setup.ts` installs deterministic browser-like globals for animation and performance APIs with mocked `requestAnimationFrame`, `cancelAnimationFrame`, and `performance.now`.

**What to Mock:**
- Mock navigation hooks in screen tests, as in `src/screens/HomeScreen.test.tsx`, `src/screens/SettingsScreen.test.tsx`, and `src/screens/DrawingScreen.test.tsx`.
- Mock native or Expo SDK boundaries such as storage, audio, sensors, and safe area APIs, as in `jest.setup.ts` and `src/screens/DrawingScreen.test.tsx`.
- Mock analytics and observability integrations in tests that verify graceful degradation, as in `App.test.tsx`, `src/utils/analytics.test.ts`, and `src/utils/sentry.test.ts`.
- Mock complex child components when the parent test only needs contract verification, such as `src/screens/DrawingScreen.test.tsx` mocking `src/components/DrawingCanvas.tsx`.

**What NOT to Mock:**
- Keep pure game logic real and assert its outputs directly, as in `src/utils/gameLogic.test.ts`, `src/utils/categoryMatchLogic.test.ts`, and `src/utils/numberPicnicLogic.test.ts`.
- Keep small local test helpers real unless the test is specifically about their integration boundaries, as in `src/test-utils/infiniteLoopDetection.test.ts`.

## Fixtures and Factories

**Test Data:**
```typescript
const createMockPattern = (overrides = {}) => ({
  carriages: [
    { emoji: '🚂', isMissing: false },
    { emoji: '🚃', isMissing: false },
    { emoji: '🚃', isMissing: true },
  ],
  answer: '🚃',
  choices: ['🚃', '🚂', '🚕', '🚗'],
  patternLabel: 'AB pattern',
  ...overrides,
});
```
- This inline factory pattern comes from `src/screens/usePatternTrainGame.test.ts`.

```typescript
let mockSettings = {
  animationsEnabled: true,
  soundEnabled: true,
  soundVolume: 0.5,
  difficulty: 'medium' as const,
  theme: 'mixed' as const,
  showCardPreview: true,
  keepyUppyEasyMode: true,
  colorMode: 'system' as const,
  hiddenGames: [] as string[],
  parentTimerMinutes: 0,
};
```
- Shared mutable test fixtures are often declared at module scope and reset in `beforeEach`, as in `src/screens/HomeScreen.test.tsx` and `src/screens/SettingsScreen.test.tsx`.

**Location:**
- There is no central fixtures directory.
- Keep lightweight fixtures inside the test file closest to the feature under test.

## Coverage

**Requirements:** Coverage is collected by `npm run test:ci`, but no minimum coverage thresholds are enforced in `jest.config.js`.

**View Coverage:**
```bash
npm run test:ci
```

## Test Types

**Unit Tests:**
- Pure logic and utility modules receive direct unit coverage in `src/utils/gameLogic.test.ts`, `src/utils/theme.test.ts`, `src/utils/glitterMotion.test.ts`, `src/utils/music.test.ts`, and `src/test-utils/infiniteLoopDetection.test.ts`.
- These tests assert deterministic outputs and avoid rendering when possible.

**Integration Tests:**
- Context and stateful hook behavior is tested with real React rendering in `src/context/SettingsContext.test.tsx`, `src/context/ParentTimerContext.test.tsx`, and `src/screens/usePatternTrainGame.test.ts`.
- Screen tests verify screen-level contracts against mocked navigation and child dependencies, as in `src/screens/DrawingScreen.test.tsx`, `src/screens/HomeScreen.test.tsx`, and `src/screens/SettingsScreen.test.tsx`.

**E2E Tests:**
- E2E coverage is lightweight and handled with Maestro flows in `.maestro/smoke-home.yml`, `.maestro/game-flow.yml`, `.maestro/settings-flow.yml`, `.maestro/parent-gate.yml`, and `.maestro/accessibility-flow.yml`.
- CI executes the Android smoke path via `.github/workflows/ci.yml` and the `npm run smoke:android:ci` script in `package.json`.

## Common Patterns

**Async Testing:**
```typescript
const screen = render(
  <SettingsProvider>
    <TestConsumer />
  </SettingsProvider>
);

await waitFor(() => expect(screen.queryByTestId('loading')).toBeNull());
fireEvent.press(screen.getByTestId('set-hard'));

await waitFor(() => {
  expect(storage.setItem).toHaveBeenCalledWith(
    'gentleMatchSettings',
    expect.any(String)
  );
});
```
- This pattern comes from `src/context/SettingsContext.test.tsx`.

**Error Testing:**
```typescript
const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

await expect(initSentry()).resolves.not.toThrow();

warnSpy.mockRestore();
```
- This pattern appears in `src/utils/sentry.test.ts` and similar console-spy tests in `src/screens/DrawingScreen.test.tsx`.

```typescript
expect(() => {
  render(
    <GentleErrorBoundary screenName="TestScreen">
      <ThrowError />
    </GentleErrorBoundary>
  );
}).not.toThrow();
```
- Use this pattern from `src/components/GentleErrorBoundary.test.tsx` when verifying fallback rendering around intentional exceptions.

## Verification Commands

**Local verification:**
```bash
npm run typecheck
npm test
npm run test:ci
npm run test:i18n
```

**CI verification:**
- `.github/workflows/ci.yml` runs `npm run ci:shared`, which expands to `npm run test:ci && npm run typecheck`.
- `.github/workflows/ci.yml` also validates web, Android, and iOS exports and then runs Android smoke tests with Maestro.

## Notable Gaps

- No lint-focused test or formatting enforcement is wired into Jest or CI. Quality gates in `.github/workflows/ci.yml` currently rely on `npm run test:ci` and `npm run typecheck`, not ESLint or Prettier.
- Several reusable UI primitives and composition helpers do not have direct co-located tests, including `src/ui/components/AppButton.tsx`, `src/ui/components/AppCard.tsx`, `src/ui/components/AppHeader.tsx`, `src/ui/components/AppModal.tsx`, `src/ui/components/SegmentedControl.tsx`, and `src/ui/components/GameCard.tsx`.
- Translation runtime setup files `src/i18n/index.ts` and `src/i18n/types.ts` are only partially covered. `src/utils/translationValidation.test.ts` exercises key validation, but full i18n initialization behavior is not directly tested.
- Core composition files such as `src/screens/GameScreen.tsx`, `src/components/BubbleField.tsx`, `src/components/CategoryMatchBoard.tsx`, and `src/components/train/TrainEngine.tsx` do not have matching direct tests.
- E2E coverage is smoke-level only. `.maestro/` covers happy-path navigation and accessibility checks, but there is no broad multi-platform end-to-end suite for every game flow.
- Test data is mostly inline per file. There is no shared fixture or factory library, which keeps tests simple but can duplicate setup across `src/screens/*.test.tsx` and `src/utils/*.test.ts`.

---

*Testing analysis: 2026-03-17*
