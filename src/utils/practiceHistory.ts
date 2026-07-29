/**
 * Local practice history deliberately has a small, bounded schema. It is not
 * an analytics event and is never sent outside this device.
 */
export const PRACTICE_HISTORY_STORAGE_KEY = 'gentleGames.practiceHistory';
export const PRACTICE_HISTORY_SCHEMA_VERSION = 1;
export const PRACTICE_HISTORY_MAX_RECORDS = 250;
export const PRACTICE_HISTORY_MAX_TEXT_LENGTH = 80;
export const PRACTICE_HISTORY_MAX_CONFIGURATION_LENGTH = 64;
export const PRACTICE_HISTORY_RETENTION_DAYS = [7, 30, 90] as const;

export type PracticeHistoryRetentionDays = (typeof PRACTICE_HISTORY_RETENTION_DAYS)[number];
export type PracticeResponse =
  | 'independent'
  | 'after-visual-hint'
  | 'after-model'
  | 'corrected'
  | 'skipped';

export type PracticeGame = 'pattern-train' | 'category-match' | 'number-picnic';

export interface PracticeResult {
  game: PracticeGame;
  targetSkill: string;
  level: string;
  response: PracticeResponse;
  attempts: number;
  occurredAt: string;
  /** A short, non-identifying label such as "3 pairs" or "1-5". */
  selectedConfiguration?: string;
}

export interface PracticeHistorySettings {
  enabled: boolean;
  retentionDays: PracticeHistoryRetentionDays;
}

export interface PracticeHistoryStorage {
  schemaVersion: typeof PRACTICE_HISTORY_SCHEMA_VERSION;
  settings: PracticeHistorySettings;
  records: PracticeResult[];
}

export const DEFAULT_PRACTICE_HISTORY_SETTINGS: PracticeHistorySettings = {
  enabled: false,
  retentionDays: 30,
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isRetentionDays = (value: unknown): value is PracticeHistoryRetentionDays =>
  value === 7 || value === 30 || value === 90;

const boundedString = (value: unknown, maxLength: number): string | null => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.slice(0, maxLength);
};

const isPracticeResponse = (value: unknown): value is PracticeResponse =>
  value === 'independent' ||
  value === 'after-visual-hint' ||
  value === 'after-model' ||
  value === 'corrected' ||
  value === 'skipped';

const isPracticeGame = (value: unknown): value is PracticeGame =>
  value === 'pattern-train' || value === 'category-match' || value === 'number-picnic';

const occurredAtMilliseconds = (value: unknown): number | null => {
  if (typeof value !== 'string' || !value || !Number.isFinite(Date.parse(value))) return null;
  return Date.parse(value);
};

/** Sanitize one result without accepting identifiers or unbounded strings. */
export const sanitizePracticeResult = (value: unknown): PracticeResult | null => {
  if (!isRecord(value)) return null;
  const targetSkill = boundedString(value.targetSkill, PRACTICE_HISTORY_MAX_TEXT_LENGTH);
  const level = boundedString(value.level, PRACTICE_HISTORY_MAX_TEXT_LENGTH);
  const occurredAt = occurredAtMilliseconds(value.occurredAt);
  if (
    !isPracticeGame(value.game) ||
    !targetSkill ||
    !level ||
    !isPracticeResponse(value.response) ||
    occurredAt === null
  ) {
    return null;
  }
  if (
    typeof value.attempts !== 'number' ||
    !Number.isInteger(value.attempts) ||
    value.attempts < 0 ||
    value.attempts > 1000
  ) {
    return null;
  }

  const selectedConfiguration = boundedString(
    value.selectedConfiguration,
    PRACTICE_HISTORY_MAX_CONFIGURATION_LENGTH,
  );
  return {
    game: value.game,
    targetSkill,
    level,
    response: value.response,
    attempts: value.attempts,
    occurredAt: new Date(occurredAt).toISOString(),
    ...(selectedConfiguration ? { selectedConfiguration } : {}),
  };
};

/** Keep recent records newest first and enforce both retention and capacity. */
export const prunePracticeResults = (
  values: unknown[],
  retentionDays: PracticeHistoryRetentionDays,
  now = Date.now(),
): PracticeResult[] => {
  const cutoff = now - retentionDays * 24 * 60 * 60 * 1000;
  return values
    .map(sanitizePracticeResult)
    .filter((value): value is PracticeResult => value !== null)
    .filter((value) => {
      const occurredAt = Date.parse(value.occurredAt);
      return occurredAt >= cutoff && occurredAt <= now;
    })
    .sort((left, right) => Date.parse(right.occurredAt) - Date.parse(left.occurredAt))
    .slice(0, PRACTICE_HISTORY_MAX_RECORDS);
};

const sanitizeSettings = (value: unknown): PracticeHistorySettings => {
  if (!isRecord(value)) return DEFAULT_PRACTICE_HISTORY_SETTINGS;
  return {
    enabled: value.enabled === true,
    retentionDays: isRetentionDays(value.retentionDays)
      ? value.retentionDays
      : DEFAULT_PRACTICE_HISTORY_SETTINGS.retentionDays,
  };
};

const storageValue = (
  settings: PracticeHistorySettings,
  records: PracticeResult[],
): PracticeHistoryStorage => ({
  schemaVersion: PRACTICE_HISTORY_SCHEMA_VERSION,
  settings,
  records,
});

export interface ParsedPracticeHistory {
  value: PracticeHistoryStorage;
  shouldPersist: boolean;
}

/**
 * Parse current and explicitly supported legacy shapes. Unknown future
 * versions are rejected rather than guessed at, so new fields cannot be
 * silently interpreted with old privacy or retention rules.
 */
export const parsePracticeHistoryStorage = (
  raw: string | null,
  now = Date.now(),
): ParsedPracticeHistory | null => {
  if (raw === null) {
    return {
      value: storageValue(DEFAULT_PRACTICE_HISTORY_SETTINGS, []),
      shouldPersist: false,
    };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }

  if (Array.isArray(parsed)) {
    const settings = DEFAULT_PRACTICE_HISTORY_SETTINGS;
    return {
      value: storageValue(settings, prunePracticeResults(parsed, settings.retentionDays, now)),
      shouldPersist: true,
    };
  }
  if (!isRecord(parsed)) return null;

  const schemaVersion = parsed.schemaVersion;
  if (schemaVersion !== undefined && schemaVersion !== 0 && schemaVersion !== 1) return null;

  // Version zero allowed the settings to be top-level. This is the only
  // legacy shape accepted; all other shapes recover as malformed storage.
  const settingsSource = isRecord(parsed.settings)
    ? parsed.settings
    : schemaVersion === 0
      ? parsed
      : null;
  const recordsSource = Array.isArray(parsed.records)
    ? parsed.records
    : schemaVersion === 0 && Array.isArray(parsed.results)
      ? parsed.results
      : null;
  if (!settingsSource || !recordsSource) return null;

  const settings = sanitizeSettings(settingsSource);
  const value = storageValue(
    settings,
    prunePracticeResults(recordsSource, settings.retentionDays, now),
  );
  return { value, shouldPersist: JSON.stringify(value) !== JSON.stringify(parsed) };
};

export const serializePracticeHistory = (
  settings: PracticeHistorySettings,
  records: PracticeResult[],
  now = Date.now(),
): string =>
  JSON.stringify(
    storageValue(settings, prunePracticeResults(records, settings.retentionDays, now)),
  );
