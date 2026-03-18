import React from 'react';
import { Text } from 'react-native';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { AppButton } from './AppButton';
import { AppCard } from './AppCard';
import { AppHeader } from './AppHeader';
import { AppModal } from './AppModal';
import { GameCard } from './GameCard';
import { IconBadge } from './IconBadge';
import { SectionHeader } from './SectionHeader';
import { SegmentedControl } from './SegmentedControl';
import { SettingToggle } from './SettingToggle';

// Mocks for grouped tests
jest.mock('../../utils/theme', () => ({
  useThemeColors: () => ({
    colors: {
      background: '#FFFEF7',
      surface: '#FFFFFF',
      surfaceElevated: '#F5F5F5',
      primary: '#A8D8EA',
      secondary: '#FFB6C1',
      danger: '#FF6B6B',
      text: '#5A5A5A',
      textLight: '#8A8A8A',
      border: '#E8E4E1',
      borderSubtle: '#F0EDE9',
    },
    resolvedMode: 'light',
    colorMode: 'light',
  }),
}));

describe('UI Components', () => {
  describe('AppButton', () => {
    it('renders with label', () => {
      const { getByText } = render(
        <AppButton label="Press Me" onPress={jest.fn()} />
      );
      expect(getByText('Press Me')).toBeTruthy();
    });

    it('calls onPress when pressed', () => {
      const onPress = jest.fn();
      const { getByText } = render(
        <AppButton label="Press Me" onPress={onPress} />
      );
      fireEvent.press(getByText('Press Me'));
      expect(onPress).toHaveBeenCalled();
    });

    it('does not call onPress when disabled', () => {
      const onPress = jest.fn();
      const { getByText } = render(
        <AppButton label="Press Me" onPress={onPress} disabled />
      );
      fireEvent.press(getByText('Press Me'));
      expect(onPress).not.toHaveBeenCalled();
    });

    it('renders different variants', () => {
      const { getByText } = render(
        <AppButton label="Primary" onPress={jest.fn()} variant="primary" />
      );
      expect(getByText('Primary')).toBeTruthy();
    });

    it('renders different sizes', () => {
      const { getByText } = render(
        <AppButton label="Small" onPress={jest.fn()} size="sm" />
      );
      expect(getByText('Small')).toBeTruthy();
    });

    it('applies custom testID', () => {
      const { getByTestId } = render(
        <AppButton label="Test" onPress={jest.fn()} testID="test-button" />
      );
      expect(getByTestId('test-button')).toBeTruthy();
    });
  });

  describe('AppCard', () => {
    it('renders children', () => {
      const { getByText } = render(
        <AppCard><Text>Card Content</Text></AppCard>
      );
      expect(getByText('Card Content')).toBeTruthy();
    });

    it('handles press when onPress provided', () => {
      const onPress = jest.fn();
      const { getByText } = render(
        <AppCard onPress={onPress}><Text>Pressable</Text></AppCard>
      );
      fireEvent.press(getByText('Pressable'));
      expect(onPress).toHaveBeenCalled();
    });

    it('renders different variants', () => {
      const { getByText } = render(
        <AppCard variant="outlined"><Text>Outlined</Text></AppCard>
      );
      expect(getByText('Outlined')).toBeTruthy();
    });

    it('applies accent color', () => {
      const { getByText } = render(
        <AppCard accentColor="#FF0000"><Text>Accent Card</Text></AppCard>
      );
      expect(getByText('Accent Card')).toBeTruthy();
    });
  });

  describe('AppHeader', () => {
    it('renders title', () => {
      const { getByText } = render(<AppHeader title="Page Title" />);
      expect(getByText('Page Title')).toBeTruthy();
    });

    it('shows back button when onBack provided', () => {
      const onBack = jest.fn();
      const { getByText } = render(<AppHeader title="Title" onBack={onBack} />);
      fireEvent.press(getByText('← Back'));
      expect(onBack).toHaveBeenCalled();
    });

    it('renders with custom back label', () => {
      const { getByText } = render(
        <AppHeader title="Title" onBack={jest.fn()} backLabel="Go Back" />
      );
      expect(getByText('Go Back')).toBeTruthy();
    });

    it('renders right action', () => {
      const { getByText } = render(
        <AppHeader title="Title" rightAction={<Text>Action</Text>} />
      );
      expect(getByText('Action')).toBeTruthy();
    });
  });

  describe('AppModal', () => {
    it('renders when visible', () => {
      const { getByText } = render(
        <AppModal visible={true} onClose={jest.fn()} title="Modal Title">
          <Text>Modal Content</Text>
        </AppModal>
      );
      expect(getByText('Modal Title')).toBeTruthy();
      expect(getByText('Modal Content')).toBeTruthy();
    });

    it('does not render when not visible', () => {
      const { queryByText } = render(
        <AppModal visible={false} onClose={jest.fn()} title="Modal Title">
          <Text>Modal Content</Text>
        </AppModal>
      );
      expect(queryByText('Modal Title')).toBeNull();
    });

    it('calls onClose when close button pressed', () => {
      const onClose = jest.fn();
      const { getAllByLabelText } = render(
        <AppModal visible={true} onClose={onClose} title="Title">
          <Text>Content</Text>
        </AppModal>
      );
      // Get the close button (second element with 'Close' label - backdrop is first)
      const closeButtons = getAllByLabelText('Close');
      fireEvent.press(closeButtons[closeButtons.length - 1]);
      expect(onClose).toHaveBeenCalled();
    });

    it('calls onClose when backdrop pressed', async () => {
      const onClose = jest.fn();
      const { getAllByLabelText } = render(
        <AppModal visible={true} onClose={onClose} dismissOnBackdropPress={true}>
          <Text>Content</Text>
        </AppModal>
      );
      // Get the backdrop (first element with 'Close' label)
      const closeButtons = getAllByLabelText('Close');
      fireEvent.press(closeButtons[0]);
      await waitFor(() => expect(onClose).toHaveBeenCalled());
    });

    it('renders without close button', () => {
      const { queryAllByLabelText } = render(
        <AppModal visible={true} onClose={jest.fn()} showClose={false}>
          <Text>Content</Text>
        </AppModal>
      );
      // Only backdrop should have 'Close' label
      expect(queryAllByLabelText('Close').length).toBeLessThanOrEqual(1);
    });
  });

  describe('GameCard', () => {
    it('renders game info', () => {
      const { getByText } = render(
        <GameCard
          icon="🎮"
          title="Game Title"
          description="Game description"
          onPress={jest.fn()}
        />
      );
      expect(getByText('Game Title')).toBeTruthy();
      expect(getByText('Game description')).toBeTruthy();
    });

    it('calls onPress when pressed', () => {
      const onPress = jest.fn();
      const { getByText } = render(
        <GameCard
          icon="🎮"
          title="Game"
          description="Desc"
          onPress={onPress}
        />
      );
      fireEvent.press(getByText('Game'));
      expect(onPress).toHaveBeenCalled();
    });

    it('applies accent color', () => {
      const { getByText } = render(
        <GameCard
          icon="🎮"
          title="Game"
          description="Desc"
          onPress={jest.fn()}
          accentColor="#FF0000"
        />
      );
      expect(getByText('Game')).toBeTruthy();
    });
  });

  describe('IconBadge', () => {
    it('renders icon', () => {
      const { getByText } = render(<IconBadge icon="🎮" />);
      expect(getByText('🎮')).toBeTruthy();
    });

    it('renders different sizes', () => {
      const { getByText } = render(<IconBadge icon="🎮" size="sm" />);
      expect(getByText('🎮')).toBeTruthy();
    });

    it('renders without border', () => {
      const { getByText } = render(<IconBadge icon="🎮" showBorder={false} />);
      expect(getByText('🎮')).toBeTruthy();
    });

    it('applies custom background color', () => {
      const { getByText } = render(<IconBadge icon="🎮" backgroundColor="#FF0000" />);
      expect(getByText('🎮')).toBeTruthy();
    });
  });

  describe('SectionHeader', () => {
    it('renders title', () => {
      const { getByText } = render(<SectionHeader title="Section Title" />);
      expect(getByText('Section Title')).toBeTruthy();
    });
  });

  describe('SegmentedControl', () => {
    const mockOptions = [
      { value: 'a', label: 'Option A' },
      { value: 'b', label: 'Option B' },
    ];

    it('renders options', () => {
      const { getByText } = render(
        <SegmentedControl
          options={mockOptions}
          value="a"
          onValueChange={jest.fn()}
        />
      );
      expect(getByText('Option A')).toBeTruthy();
      expect(getByText('Option B')).toBeTruthy();
    });

    it('calls onValueChange when option pressed', () => {
      const onValueChange = jest.fn();
      const { getByText } = render(
        <SegmentedControl
          options={mockOptions}
          value="a"
          onValueChange={onValueChange}
        />
      );
      fireEvent.press(getByText('Option B'));
      expect(onValueChange).toHaveBeenCalledWith('b');
    });

    it('renders with wrap option', () => {
      const { getByText } = render(
        <SegmentedControl
          options={mockOptions}
          value="a"
          onValueChange={jest.fn()}
          wrap
        />
      );
      expect(getByText('Option A')).toBeTruthy();
    });
  });

  describe('SettingToggle', () => {
    it('renders label', () => {
      const { getByText } = render(
        <SettingToggle
          label="Setting Label"
          value={true}
          onValueChange={jest.fn()}
        />
      );
      expect(getByText('Setting Label')).toBeTruthy();
    });

    it('renders description', () => {
      const { getByText } = render(
        <SettingToggle
          label="Label"
          description="Setting description"
          value={true}
          onValueChange={jest.fn()}
        />
      );
      expect(getByText('Setting description')).toBeTruthy();
    });

    it('calls onValueChange when toggled', () => {
      const onValueChange = jest.fn();
      const { getByRole } = render(
        <SettingToggle
          label="Toggle"
          value={false}
          onValueChange={onValueChange}
        />
      );
      fireEvent(getByRole('switch'), 'valueChange', true);
      expect(onValueChange).toHaveBeenCalledWith(true);
    });

    it('renders when disabled', () => {
      const { getByRole } = render(
        <SettingToggle
          label="Disabled"
          value={true}
          onValueChange={jest.fn()}
          disabled
        />
      );
      expect(getByRole('switch')).toBeTruthy();
    });
  });
});