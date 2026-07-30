import React from 'react';
import { fireEvent, render, within } from '@testing-library/react-native';
import type { PracticeHistoryContextValue } from '../context/PracticeHistoryContext';
import type { PracticeResult } from '../utils/practiceHistory';
import { PracticeHistoryScreen } from './PracticeHistoryScreen';

const mockGoBack = jest.fn();
const mockUpdateSettings = jest.fn().mockResolvedValue(undefined);
const mockDeleteAllRecords = jest.fn().mockResolvedValue(undefined);

const mockRecords: PracticeResult[] = [
  {
    game: 'pattern-train',
    targetSkill: 'continue-repeating-pattern',
    level: 'easy',
    response: 'independent',
    attempts: 1,
    occurredAt: '2026-01-31T11:00:00.000Z',
    selectedConfiguration: 'pattern-train:easy',
  },
  {
    game: 'category-match',
    targetSkill: 'sort-by-stated-category',
    level: '2-groups',
    response: 'after-visual-hint',
    attempts: 2,
    occurredAt: '2026-01-31T10:00:00.000Z',
  },
  {
    game: 'pattern-train',
    targetSkill: 'continue-repeating-pattern',
    level: 'medium',
    response: 'after-model',
    attempts: 3,
    occurredAt: '2026-01-31T09:00:00.000Z',
  },
  {
    game: 'category-match',
    targetSkill: 'sort-by-stated-category',
    level: '3-groups',
    response: 'corrected',
    attempts: 3,
    occurredAt: '2026-01-31T08:00:00.000Z',
  },
  {
    game: 'pattern-train',
    targetSkill: 'continue-repeating-pattern',
    level: 'easy',
    response: 'skipped',
    attempts: 0,
    occurredAt: '2026-01-31T07:00:00.000Z',
  },
];

let mockHistoryValue: PracticeHistoryContextValue;

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ goBack: mockGoBack }),
}));

jest.mock('../context/PracticeHistoryContext', () => ({
  usePracticeHistory: () => mockHistoryValue,
}));

jest.mock('../context/SettingsContext', () => ({
  useSettings: () => ({
    settings: { colorMode: 'light', reducedMotionEnabled: false },
  }),
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) => {
      const translations: Record<string, string> = {
        'common.back': 'Back',
        'common.cancel': 'Cancel',
        'common.close': 'Close',
        'common.loading': 'Loading',
        'common.on': 'on',
        'common.off': 'off',
        'settings.saving': 'Saving',
        'settings.saved': 'Saved',
        'practiceHistory.title': 'Practice summaries',
        'practiceHistory.description': 'Local caregiver summaries',
        'practiceHistory.gate.title': 'Caregiver check',
        'practiceHistory.gate.description': 'Solve the question',
        'practiceHistory.gate.answerLabel': 'Challenge answer',
        'practiceHistory.gate.error': 'Try again',
        'practiceHistory.gate.continue': 'View summaries',
        'practiceHistory.enable.label': 'Keep local practice summaries',
        'practiceHistory.enable.description': 'Off by default',
        'practiceHistory.retention.title': 'Keep summaries for',
        'practiceHistory.retention.days': '{{count}} days',
        'practiceHistory.summary.title': 'Support summary',
        'practiceHistory.responses.independent': 'Independent',
        'practiceHistory.responses.after-visual-hint': 'After a visual hint',
        'practiceHistory.responses.after-model': 'After a model',
        'practiceHistory.responses.corrected': 'Corrected',
        'practiceHistory.responses.skipped': 'Skipped',
        'practiceHistory.recent.title': 'Recent guided practice',
        'practiceHistory.recent.empty': 'No summaries',
        'practiceHistory.games.pattern-train': 'Pattern Train',
        'practiceHistory.games.category-match': 'Category Match',
        'practiceHistory.skills.continue-repeating-pattern': 'Continue a repeating pattern',
        'practiceHistory.skills.sort-by-stated-category': 'Sort by a stated category',
        'practiceHistory.configurations.patternTrain.easy': 'Easy patterns',
        'practiceHistory.configurations.patternTrain.medium': 'Medium patterns',
        'practiceHistory.configurations.categoryMatch.twoGroups': '2 groups',
        'practiceHistory.configurations.categoryMatch.threeGroups': '3 groups',
        'practiceHistory.attempts': 'Attempts: {{count}}',
        'practiceHistory.deleteAll': 'Delete all practice summaries',
        'practiceHistory.deleteConfirm.title': 'Delete all summaries?',
        'practiceHistory.deleteConfirm.description': 'Remove every summary',
        'practiceHistory.deleteConfirm.action': 'Delete all',
      };
      let value = translations[key] ?? key;
      Object.entries(options ?? {}).forEach(([name, replacement]) => {
        value = value.replace(`{{${name}}}`, String(replacement));
      });
      return value;
    },
  }),
}));

describe('PracticeHistoryScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Math, 'random').mockReturnValue(0);
    mockHistoryValue = {
      records: mockRecords,
      settings: { enabled: false, retentionDays: 30 },
      recordResult: jest.fn().mockResolvedValue(undefined),
      updateSettings: mockUpdateSettings,
      deleteAllRecords: mockDeleteAllRecords,
      clearHistory: mockDeleteAllRecords,
      isLoading: false,
      isSaving: false,
      persistenceError: null,
    };
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  const unlock = (screen: ReturnType<typeof render>) => {
    fireEvent.changeText(screen.getByTestId('caregiver-answer'), '23');
    fireEvent.press(screen.getByTestId('caregiver-unlock'));
  };

  it('keeps summaries gated and shows every support classification after unlock', () => {
    const screen = render(<PracticeHistoryScreen />);
    expect(screen.queryByText('Support summary')).toBeNull();

    unlock(screen);

    expect(screen.getByText('Support summary')).toBeTruthy();
    expect(within(screen.getByTestId('practice-summary-independent')).getByText('1')).toBeTruthy();
    expect(screen.getByText('After a visual hint')).toBeTruthy();
    expect(screen.getByText('After a model')).toBeTruthy();
    expect(screen.getByText('Corrected')).toBeTruthy();
    expect(screen.getByText('Skipped')).toBeTruthy();
    expect(screen.getAllByTestId('practice-record-details')[0].props.children).toContain(
      'Easy patterns',
    );
    expect(screen.getAllByTestId('practice-record-details')[1].props.children).toContain(
      '2 groups',
    );
    expect(screen.queryByText(/rank|percentile|streak/i)).toBeNull();
  });

  it('updates opt-in and retention controls without deleting existing records', () => {
    const screen = render(<PracticeHistoryScreen />);
    unlock(screen);

    fireEvent(
      screen.getByRole('switch', { name: 'Keep local practice summaries, off' }),
      'valueChange',
      true,
    );
    fireEvent.press(screen.getByRole('radio', { name: '7 days' }));

    expect(mockUpdateSettings).toHaveBeenNthCalledWith(1, { enabled: true });
    expect(mockUpdateSettings).toHaveBeenNthCalledWith(2, { retentionDays: 7 });
    expect(mockDeleteAllRecords).not.toHaveBeenCalled();
  });

  it('requires confirmation before explicitly deleting all records', () => {
    const screen = render(<PracticeHistoryScreen />);
    unlock(screen);

    fireEvent.press(screen.getByTestId('delete-practice-history'));
    expect(screen.getByText('Delete all summaries?')).toBeTruthy();
    expect(mockDeleteAllRecords).not.toHaveBeenCalled();

    fireEvent.press(screen.getByTestId('confirm-delete-practice-history'));
    expect(mockDeleteAllRecords).toHaveBeenCalledTimes(1);
  });
});
