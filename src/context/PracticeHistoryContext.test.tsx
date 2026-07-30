import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PRACTICE_HISTORY_STORAGE_KEY, PracticeResult } from '../utils/practiceHistory';
import { PracticeHistoryProvider, usePracticeHistory } from './PracticeHistoryContext';

jest.unmock('./PracticeHistoryContext');

const storage = AsyncStorage as unknown as {
  getItem: jest.Mock;
  setItem: jest.Mock;
  removeItem: jest.Mock;
};

const practiceResult: PracticeResult = {
  game: 'number-picnic',
  targetSkill: 'counting',
  level: '1-5',
  response: 'independent',
  attempts: 1,
  occurredAt: '2026-01-31T11:00:00.000Z',
  selectedConfiguration: 'five',
};

const TestConsumer = () => {
  const {
    records,
    settings,
    isLoading,
    isSaving,
    persistenceError,
    recordResult,
    updateSettings,
    deleteAllRecords,
  } = usePracticeHistory();

  return (
    <View>
      <Text testID='loading'>{String(isLoading)}</Text>
      <Text testID='saving'>{String(isSaving)}</Text>
      <Text testID='enabled'>{String(settings.enabled)}</Text>
      <Text testID='retention'>{String(settings.retentionDays)}</Text>
      <Text testID='count'>{String(records.length)}</Text>
      <Text testID='error'>{persistenceError ?? ''}</Text>
      <TouchableOpacity testID='enable' onPress={() => updateSettings({ enabled: true })} />
      <TouchableOpacity testID='disable' onPress={() => updateSettings({ enabled: false })} />
      <TouchableOpacity
        testID='short-retention'
        onPress={() => updateSettings({ retentionDays: 7 })}
      />
      <TouchableOpacity testID='record' onPress={() => recordResult(practiceResult)} />
      <TouchableOpacity testID='delete' onPress={() => deleteAllRecords()} />
    </View>
  );
};

const renderHistory = async () => {
  const screen = render(
    <PracticeHistoryProvider>
      <TestConsumer />
    </PracticeHistoryProvider>,
  );
  await waitFor(() => expect(screen.getByTestId('loading').props.children).toBe('false'));
  return screen;
};

describe('PracticeHistoryContext', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-01-31T12:00:00.000Z'));
    jest.clearAllMocks();
    storage.getItem.mockResolvedValue(null);
    storage.setItem.mockResolvedValue(undefined);
    storage.removeItem.mockResolvedValue(undefined);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('is local and disabled by default, so recording does nothing', async () => {
    const screen = await renderHistory();
    expect(screen.getByTestId('enabled').props.children).toBe('false');
    fireEvent.press(screen.getByTestId('record'));
    await act(async () => {
      await Promise.resolve();
    });
    expect(screen.getByTestId('count').props.children).toBe('0');
    expect(storage.setItem).not.toHaveBeenCalled();
  });

  it('enables recording, persists results under the namespaced key, and exposes saving state', async () => {
    const screen = await renderHistory();
    fireEvent.press(screen.getByTestId('enable'));
    await waitFor(() => expect(screen.getByTestId('enabled').props.children).toBe('true'));
    fireEvent.press(screen.getByTestId('record'));
    await waitFor(() => expect(screen.getByTestId('count').props.children).toBe('1'));
    expect(storage.setItem).toHaveBeenLastCalledWith(
      PRACTICE_HISTORY_STORAGE_KEY,
      expect.stringContaining('number-picnic'),
    );
    expect(JSON.parse(storage.setItem.mock.calls.at(-1)[1]).records).toEqual([practiceResult]);
  });

  it('disabling preserves records but prevents later writes from recordResult', async () => {
    const screen = await renderHistory();
    fireEvent.press(screen.getByTestId('enable'));
    await waitFor(() => expect(screen.getByTestId('enabled').props.children).toBe('true'));
    fireEvent.press(screen.getByTestId('record'));
    await waitFor(() => expect(screen.getByTestId('count').props.children).toBe('1'));
    const writesBeforeDisable = storage.setItem.mock.calls.length;

    fireEvent.press(screen.getByTestId('disable'));
    await waitFor(() => expect(screen.getByTestId('enabled').props.children).toBe('false'));
    expect(screen.getByTestId('count').props.children).toBe('1');
    fireEvent.press(screen.getByTestId('record'));
    await act(async () => {
      await Promise.resolve();
    });
    expect(screen.getByTestId('count').props.children).toBe('1');
    expect(storage.setItem.mock.calls.length).toBe(writesBeforeDisable + 1);
  });

  it('updates retention, prunes on writes, and explicitly deletes all records', async () => {
    storage.getItem.mockResolvedValueOnce(
      JSON.stringify({
        schemaVersion: 1,
        settings: { enabled: true, retentionDays: 30 },
        records: [{ ...practiceResult, occurredAt: '2025-01-01T00:00:00.000Z' }, practiceResult],
      }),
    );
    const screen = await renderHistory();
    expect(screen.getByTestId('count').props.children).toBe('1');
    fireEvent.press(screen.getByTestId('short-retention'));
    await waitFor(() => expect(screen.getByTestId('retention').props.children).toBe('7'));
    expect(screen.getByTestId('count').props.children).toBe('1');
    fireEvent.press(screen.getByTestId('delete'));
    await waitFor(() => expect(screen.getByTestId('count').props.children).toBe('0'));
    expect(JSON.parse(storage.setItem.mock.calls.at(-1)[1]).records).toEqual([]);
  });

  it('removes malformed storage and hydrates safely', async () => {
    storage.getItem.mockResolvedValueOnce('{bad json');
    const screen = await renderHistory();
    expect(screen.getByTestId('count').props.children).toBe('0');
    expect(storage.removeItem).toHaveBeenCalledWith(PRACTICE_HISTORY_STORAGE_KEY);
  });

  it('reports a save failure while keeping the local state usable', async () => {
    storage.setItem.mockRejectedValueOnce(new Error('disk full'));
    const screen = await renderHistory();
    fireEvent.press(screen.getByTestId('enable'));
    await waitFor(() => expect(screen.getByTestId('error').props.children).toBe('disk full'));
    expect(screen.getByTestId('enabled').props.children).toBe('true');
  });
});
