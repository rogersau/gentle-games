import {
  DEFAULT_PRACTICE_HISTORY_SETTINGS,
  parsePracticeHistoryStorage,
  PRACTICE_HISTORY_MAX_CONFIGURATION_LENGTH,
  PRACTICE_HISTORY_MAX_RECORDS,
  prunePracticeResults,
  sanitizePracticeResult,
} from './practiceHistory';

const now = Date.parse('2026-01-31T12:00:00.000Z');
const result = (overrides: Record<string, unknown> = {}) => ({
  game: 'number-picnic',
  targetSkill: 'counting',
  level: '1-5',
  response: 'independent',
  attempts: 1,
  occurredAt: '2026-01-31T11:00:00.000Z',
  ...overrides,
});

describe('practice history persistence rules', () => {
  it('accepts every supported response and bounds the optional configuration', () => {
    const responses = [
      'independent',
      'after-visual-hint',
      'after-model',
      'corrected',
      'skipped',
    ] as const;

    responses.forEach((response) => {
      const sanitized = sanitizePracticeResult(
        result({ response, selectedConfiguration: ` ${'x'.repeat(100)} ` }),
      );
      expect(sanitized?.response).toBe(response);
      expect(sanitized?.selectedConfiguration).toHaveLength(
        PRACTICE_HISTORY_MAX_CONFIGURATION_LENGTH,
      );
    });
  });

  it('accepts zero-attempt skips and rejects malformed or non-guided results', () => {
    expect(sanitizePracticeResult(null)).toBeNull();
    expect(sanitizePracticeResult(result({ response: 'helped' }))).toBeNull();
    expect(sanitizePracticeResult(result({ response: 'skipped', attempts: 0 }))).toMatchObject({
      response: 'skipped',
      attempts: 0,
    });
    expect(sanitizePracticeResult(result({ attempts: -1 }))).toBeNull();
    expect(sanitizePracticeResult(result({ occurredAt: 'not-a-date' }))).toBeNull();
    expect(sanitizePracticeResult(result({ game: 'bubble-pop' }))).toBeNull();
  });

  it('prunes old and invalid records, sorts newest first, and enforces capacity', () => {
    const records = [
      result({ occurredAt: '2026-01-24T12:00:00.000Z' }),
      result({ occurredAt: '2026-01-31T11:00:00.000Z', level: 'newest' }),
      result({ occurredAt: '2026-01-20T12:00:00.000Z' }),
      result({ occurredAt: '2026-02-01T12:00:00.000Z', level: 'future' }),
      result({ occurredAt: 'invalid' }),
    ];
    const retained = prunePracticeResults(records, 7, now);
    expect(retained.map((entry) => entry.level)).toEqual(['newest', '1-5']);

    const manyRecords = Array.from({ length: PRACTICE_HISTORY_MAX_RECORDS + 3 }, (_, index) =>
      result({
        occurredAt: new Date(now - index * 60_000).toISOString(),
        level: String(index),
      }),
    );
    const limited = prunePracticeResults(manyRecords, 90, now);
    expect(limited).toHaveLength(PRACTICE_HISTORY_MAX_RECORDS);
    expect(limited[0].level).toBe('0');
    expect(limited.at(-1)?.level).toBe(String(PRACTICE_HISTORY_MAX_RECORDS - 1));
  });

  it('migrates the supported legacy array and version-zero envelope', () => {
    const legacyArray = parsePracticeHistoryStorage(JSON.stringify([result()]), now);
    expect(legacyArray?.value.settings).toEqual(DEFAULT_PRACTICE_HISTORY_SETTINGS);
    expect(legacyArray?.value.records).toHaveLength(1);
    expect(legacyArray?.shouldPersist).toBe(true);

    const legacyEnvelope = parsePracticeHistoryStorage(
      JSON.stringify({
        schemaVersion: 0,
        enabled: true,
        retentionDays: 7,
        results: [result()],
      }),
      now,
    );
    expect(legacyEnvelope?.value.settings).toEqual({ enabled: true, retentionDays: 7 });
    expect(legacyEnvelope?.value.records).toHaveLength(1);
    expect(legacyEnvelope?.shouldPersist).toBe(true);
  });

  it('recovers malformed and unknown future storage without guessing', () => {
    expect(parsePracticeHistoryStorage('{bad json', now)).toBeNull();
    expect(parsePracticeHistoryStorage('', now)).toBeNull();
    expect(parsePracticeHistoryStorage(JSON.stringify({ schemaVersion: 99 }), now)).toBeNull();
    expect(
      parsePracticeHistoryStorage(JSON.stringify({ records: 'not-an-array' }), now),
    ).toBeNull();
  });

  it('prunes current storage during load and requests canonical persistence', () => {
    const parsed = parsePracticeHistoryStorage(
      JSON.stringify({
        schemaVersion: 1,
        settings: { enabled: true, retentionDays: 7 },
        records: [
          result({ occurredAt: '2026-01-01T12:00:00.000Z' }),
          result({ occurredAt: '2026-01-31T11:00:00.000Z' }),
        ],
      }),
      now,
    );
    expect(parsed?.value.records).toHaveLength(1);
    expect(parsed?.shouldPersist).toBe(true);
  });
});
