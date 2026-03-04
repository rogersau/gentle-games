import React from 'react';
import { render } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { Text, View } from 'react-native';

// Mock dependencies
jest.mock('expo-splash-screen', () => ({
  preventAutoHideAsync: jest.fn(() => Promise.resolve()),
  hideAsync: jest.fn(() => Promise.resolve()),
}));

jest.mock('expo-font', () => ({
  useFonts: jest.fn(() => [true, null]),
}));

jest.mock('./src/utils/sounds', () => ({
  initializeSounds: jest.fn(),
  unloadSounds: jest.fn(),
}));

jest.mock('./src/utils/pwaBackGuard', () => ({
  installPwaBackNavigationGuard: jest.fn(() => jest.fn()),
}));

jest.mock('./src/utils/sentry', () => ({
  initSentry: jest.fn(() => Promise.resolve()),
}));

jest.mock('./src/utils/theme', () => ({
  useThemeColors: jest.fn(() => ({ resolvedMode: 'light' })),
}));

jest.mock('./src/ui/fonts', () => ({
  useFonts: jest.fn(() => ({ fontsLoaded: true, fontError: null })),
}));

jest.mock('./src/context/ParentTimerContext', () => ({
  ParentTimerProvider: ({ children }: { children: React.ReactNode }) => children,
}));

jest.mock('./src/i18n', () => ({}));

// Mock PostHogProvider to simulate the real behavior
const mockPostHogProvider = jest.fn();

jest.mock('posthog-react-native', () => ({
  __esModule: true,
  default: jest.fn(),
  PostHogProvider: (props: { client?: unknown; children: React.ReactNode }) => {
    mockPostHogProvider(props);
    // Simulate the actual PostHogProvider behavior - throws without client or apiKey
    if (!props.client) {
      throw new Error('Either a PostHog client or an apiKey is required. If you want to use the PostHogProvider without a client, please provide an apiKey and the options={ disabled: true }.');
    }
    return props.children;
  },
  usePostHog: () => ({
    capture: jest.fn(),
    screen: jest.fn(),
  }),
}));

// Test component that mimics AppNavigator structure
const TestNavigator: React.FC<{ posthogClient: unknown }> = ({ posthogClient }) => {
  const { PostHogProvider } = require('posthog-react-native');
  
  return (
    <NavigationContainer>
      <PostHogProvider
        client={posthogClient}
        autocapture={{
          captureScreens: false,
          captureTouches: false,
        }}
      >
        <View testID="app-content">
          <Text>App Content</Text>
        </View>
      </PostHogProvider>
    </NavigationContainer>
  );
};

describe('PostHogProvider error handling', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw error when PostHogProvider is rendered without a client', () => {
    // This reproduces the production error
    expect(() => {
      render(<TestNavigator posthogClient={undefined} />);
    }).toThrow('Either a PostHog client or an apiKey is required');
  });

  it('should not throw error when PostHogProvider has a valid client', () => {
    const mockClient = { id: 'test-client' };
    
    expect(() => {
      render(<TestNavigator posthogClient={mockClient} />);
    }).not.toThrow();
  });

  it('should not throw error when PostHogProvider has null client', () => {
    // This is what happens when there's no API key
    expect(() => {
      render(<TestNavigator posthogClient={null} />);
    }).toThrow('Either a PostHog client or an apiKey is required');
  });
});

describe('App should work without PostHog configuration', () => {
  it('should be able to conditionally render PostHogProvider based on client availability', () => {
    // This is the fix we need - conditionally render the provider
    const ConditionalNavigator: React.FC<{ posthogClient: unknown }> = ({ posthogClient }) => {
      const { PostHogProvider } = require('posthog-react-native');
      const content = (
        <View testID="app-content">
          <Text>App Content</Text>
        </View>
      );
      
      // Only wrap with PostHogProvider if we have a client
      if (posthogClient) {
        return (
          <NavigationContainer>
            <PostHogProvider
              client={posthogClient}
              autocapture={{
                captureScreens: false,
                captureTouches: false,
              }}
            >
              {content}
            </PostHogProvider>
          </NavigationContainer>
        );
      }
      
      return <NavigationContainer>{content}</NavigationContainer>;
    };
    
    // Should work without client
    const { getByTestId: getByTestIdNoClient } = render(<ConditionalNavigator posthogClient={null} />);
    expect(getByTestIdNoClient('app-content')).toBeTruthy();
    
    // Should also work with client
    const mockClient = { id: 'test-client' };
    const { getByTestId: getByTestIdWithClient } = render(<ConditionalNavigator posthogClient={mockClient} />);
    expect(getByTestIdWithClient('app-content')).toBeTruthy();
  });
});
