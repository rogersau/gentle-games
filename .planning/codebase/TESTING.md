# Testing Patterns

**Analysis Date:** 2026-03-03

## Test Framework

**Runner:**
- Jest v29.7.0
- Preset: `jest-expo` (v54.0.12)
- Config: `jest.config.js`

**Assertion Library:**
- `@testing-library/react-native` (v13.3.3)
- Built-in Jest matchers

**Run Commands:**
```bash
npm test                   # Run all tests
npm run test:watch         # Watch mode
npm run test:ci            # CI mode with coverage (--ci --runInBand --coverage --watchAll=false)
npm run test:single        # Run single file (--runInBand)
npm run test:i18n          # Run translation validation tests
```

## Test File Organization

**Location:**
- Co-located with source files in same directory
- Tests in `src/` alongside implementation

**Naming:**
- `.test.ts` for TypeScript utility tests
- `.test.tsx` for React component tests

**Structure:**
```
src/
├── utils/
│   ├── gameLogic.ts
│   └── gameLogic.test.ts
├── screens/
│   ├── HomeScreen.tsx
│   └── HomeScreen.test.tsx
├── components/
│   ├── GameCard.tsx
│   └── GameCard.test.tsx
└── context/
    ├── SettingsContext.tsx
    └── SettingsContext.test.tsx
```

## Test Structure

**Suite Organization:**
```typescript
import { ANIMALS, SHAPES, Tile } from '../types';
import { checkGameComplete, checkMatch, formatTime, generateTiles, getGridConfig } from './gameLogic';

describe('gameLogic', () => {
  it('returns expected grid config by difficulty', () => {
    expect(getGridConfig('easy')).toEqual({ cols: 3, rows: 4, pairs: 6 });
    expect(getGridConfig('medium')).toEqual({ cols: 4, rows: 5, pairs: 10 });
    expect(getGridConfig('hard')).toEqual({ cols: 5, rows: 6, pairs: 15 });
  });
  
  // More tests...
});
```

**Patterns:**
- `describe()` blocks group related tests
- `it()` or `test()` for individual test cases
- Use `beforeEach()` for setup that runs before each test
- `jest.clearAllMocks()` in beforeEach to reset mocks

## Mocking

**Framework:** Jest (`jest.mock`, `jest.fn`)

**Global Mocks (`jest.setup.ts`):**
```typescript
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(() => Promise.resolve(null)),
  setItem: jest.fn(() => Promise.resolve()),
  removeItem: jest.fn(() => Promise.resolve()),
  // ... other methods
}));

jest.mock('./src/context/SettingsContext', () => {
  const actual = jest.requireActual('./src/context/SettingsContext');
  return {
    ...actual,
    useSettings: () => ({
      settings: {
        difficulty: 'medium',
        theme: 'animals',
        soundEnabled: true,
        // ... default settings
      },
      updateSettings: jest.fn(),
    }),
  };
});

// Mock react-i18next
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) => { /* ... */ },
    i18n: { changeLanguage: jest.fn(), language: 'en-AU' },
  }),
  I18nextProvider: ({ children }: { children: React.ReactNode }) => children,
}));
```

**Component Test Mocks:**
```typescript
const mockNavigate = jest.fn();

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: mockNavigate,
  }),
}));

jest.mock('../context/SettingsContext', () => ({
  useSettings: () => ({
    settings: mockSettings,
    updateSettings: mockUpdateSettings,
  }),
}));
```

**What to Mock:**
- `@react-native-async-storage/async-storage` - Async storage is mocked globally
- `@react-navigation/native` - Navigation hooks return mock functions
- `react-i18next` - Translation function returns English strings
- Context providers - Return mock settings and functions

**What NOT to Mock:**
- Test the actual component/logic being tested
- Don't mock utilities unless specifically testing error handling

## Fixtures and Factories

**Test Data:**
- Inline data in test files for specific test cases
- Use actual data from types file (e.g., `ANIMALS`, `SHAPES`)

**Example from `src/utils/gameLogic.test.ts`:**
```typescript
const tiles: Tile[] = [
  { id: '1a', value: '🐰', type: 'animal', isFlipped: true, isMatched: false },
  { id: '1b', value: '🐰', type: 'animal', isFlipped: true, isMatched: false },
  { id: '2a', value: '🐶', type: 'animal', isFlipped: false, isMatched: false },
];

expect(checkMatch(tiles, ['1a', '1b'])).toBe(true);
```

## Coverage

**Requirements:** None explicitly enforced

**View Coverage:**
```bash
npm run test:ci
# Coverage report output after test run
```

## Test Types

**Unit Tests:**
- Test utility functions in isolation
- Pure functions with no side effects
- Example: `src/utils/gameLogic.test.ts` tests `generateTiles`, `checkMatch`, etc.

**Integration Tests:**
- Test React components with context
- Mock navigation and storage
- Example: `src/screens/HomeScreen.test.tsx` tests screen interactions

**Component Tests:**
- Use `@testing-library/react-native`
- Test user interactions with `fireEvent`
- Test rendered output with `getByText`, `getByTestId`

**Example Component Test:**
```typescript
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { HomeScreen } from './HomeScreen';

it('navigates directly to Drawing screen when Drawing Pad is selected', () => {
  const screen = render(<HomeScreen />);
  fireEvent.press(screen.getByText('Drawing Pad'));
  
  expect(mockNavigate).toHaveBeenCalledWith('Drawing');
});

it('shows difficulty modal for Memory Snap', async () => {
  const screen = render(<HomeScreen />);
  const memorySnapCard = screen.getAllByRole('button').find(
    (el: any) => el.props.accessibilityLabel?.includes('Memory Snap')
  );
  fireEvent.press(memorySnapCard!);
  expect(screen.getByText(/Select difficulty/)).toBeTruthy();
});
```

## Common Patterns

**Async Testing:**
```typescript
// Use waitFor for async state changes
await waitFor(() => {
  expect(screen.queryByTestId('loading')).toBeNull();
});

// For async functions
await waitFor(() => {
  expect(storage.setItem).toHaveBeenCalledWith(
    'gentleMatchSettings',
    expect.any(String)
  );
});
```

**Error Testing:**
```typescript
// Spy on console.warn
const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

// Test error handling
await waitFor(() => {
  expect(storage.removeItem).toHaveBeenCalledWith('gentleMatchSettings');
});

// Restore spy
warnSpy.mockRestore();
```

**Mock Reset:**
```typescript
beforeEach(() => {
  jest.clearAllMocks();
});
```

**Unmock for Specific Tests:**
```typescript
// Override global mock for specific test
jest.unmock('./SettingsContext');
import { SettingsProvider, useSettings } from './SettingsContext';
```

---

*Testing analysis: 2026-03-03*
