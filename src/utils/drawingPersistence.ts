import type { HistoryEntry, Point, Stroke, ErasedRegion } from '../components/DrawingCanvas';

/** Documented limits keep drawing state, SVG work, and AsyncStorage writes bounded. */
export const DRAWING_HISTORY_MAX_ACTIONS = 256;
export const DRAWING_HISTORY_MAX_POINTS = 16_000;
export const DRAWING_HISTORY_MAX_POINTS_PER_ENTRY = 1_200;
export const DRAWING_HISTORY_MAX_SERIALIZED_BYTES = 256 * 1024;
export const DRAWING_HISTORY_MAX_COORDINATE = 100_000;
export const DRAWING_MAX_ACTIONS = DRAWING_HISTORY_MAX_ACTIONS;
export const DRAWING_MAX_POINTS = DRAWING_HISTORY_MAX_POINTS;
export const DRAWING_MAX_SERIALIZED_BYTES = DRAWING_HISTORY_MAX_SERIALIZED_BYTES;
export const MAX_DRAWING_ACTIONS = DRAWING_HISTORY_MAX_ACTIONS;
export const MAX_DRAWING_POINTS = DRAWING_HISTORY_MAX_POINTS;
export const MAX_DRAWING_POINTS_PER_ENTRY = DRAWING_HISTORY_MAX_POINTS_PER_ENTRY;
export const MAX_DRAWING_SERIALIZED_BYTES = DRAWING_HISTORY_MAX_SERIALIZED_BYTES;

export const DRAWING_HISTORY_BUDGET = Object.freeze({
  maxActions: DRAWING_HISTORY_MAX_ACTIONS,
  maxPoints: DRAWING_HISTORY_MAX_POINTS,
  maxPointsPerEntry: DRAWING_HISTORY_MAX_POINTS_PER_ENTRY,
  maxSerializedBytes: DRAWING_HISTORY_MAX_SERIALIZED_BYTES,
  maxCoordinate: DRAWING_HISTORY_MAX_COORDINATE,
});

export type DrawingHistoryBudget = {
  maxActions: number;
  maxPoints: number;
  maxPointsPerEntry: number;
  maxSerializedBytes: number;
  maxCoordinate: number;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);
const isFiniteNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value);
const isPoint = (value: unknown): value is Point =>
  isRecord(value) &&
  isFiniteNumber(value.x) &&
  isFiniteNumber(value.y) &&
  Math.abs(value.x) <= DRAWING_HISTORY_MAX_COORDINATE &&
  Math.abs(value.y) <= DRAWING_HISTORY_MAX_COORDINATE;
const hasCommonFields = (entry: Record<string, unknown>): boolean =>
  typeof entry.id === 'string' &&
  entry.id.length > 0 &&
  (entry.actionId === undefined || typeof entry.actionId === 'string');
const isHistoryEntry = (value: unknown): value is HistoryEntry => {
  if (!isRecord(value) || !hasCommonFields(value)) return false;
  if (value.kind === 'stroke')
    return (
      Array.isArray(value.points) &&
      value.points.every(isPoint) &&
      typeof value.color === 'string' &&
      isFiniteNumber(value.width) &&
      value.width > 0
    );
  if (value.kind === 'erase')
    return (
      Array.isArray(value.points) &&
      value.points.every(isPoint) &&
      isFiniteNumber(value.width) &&
      value.width > 0
    );
  if (value.kind === 'shape')
    return (
      (value.type === 'circle' || value.type === 'square' || value.type === 'triangle') &&
      isFiniteNumber(value.x) &&
      isFiniteNumber(value.y) &&
      Math.abs(value.x) <= DRAWING_HISTORY_MAX_COORDINATE &&
      Math.abs(value.y) <= DRAWING_HISTORY_MAX_COORDINATE &&
      isFiniteNumber(value.size) &&
      value.size > 0 &&
      typeof value.color === 'string'
    );
  if (value.kind === 'stamp')
    return (
      isFiniteNumber(value.x) &&
      isFiniteNumber(value.y) &&
      Math.abs(value.x) <= DRAWING_HISTORY_MAX_COORDINATE &&
      Math.abs(value.y) <= DRAWING_HISTORY_MAX_COORDINATE &&
      isFiniteNumber(value.size) &&
      value.size > 0 &&
      typeof value.color === 'string'
    );
  return false;
};

const clampBudget = (budget: DrawingHistoryBudget): DrawingHistoryBudget => ({
  maxActions: Math.max(1, Math.floor(budget.maxActions)),
  maxPoints: Math.max(2, Math.floor(budget.maxPoints)),
  maxPointsPerEntry: Math.max(2, Math.floor(budget.maxPointsPerEntry)),
  maxSerializedBytes: Math.max(1, Math.floor(budget.maxSerializedBytes)),
  maxCoordinate: Math.max(1, budget.maxCoordinate),
});
const pointCount = (entry: HistoryEntry): number =>
  entry.kind === 'stroke' || entry.kind === 'erase' ? entry.points.length : 0;
export const countDrawingPoints = (history: HistoryEntry[]): number =>
  history.reduce((total, entry) => total + pointCount(entry), 0);

/** Return an even sample while retaining the first and last point. */
export const decimateDrawingPoints = (points: Point[], maxPoints: number): Point[] => {
  if (points.length <= maxPoints) return points;
  if (maxPoints <= 1) return [points[0]];
  const result: Point[] = [];
  const lastIndex = points.length - 1;
  for (let index = 0; index < maxPoints; index += 1) {
    const point = points[Math.round((index * lastIndex) / (maxPoints - 1))];
    if (result[result.length - 1] !== point) result.push(point);
  }
  return result;
};
const actionGroups = (history: HistoryEntry[]): HistoryEntry[][] => {
  const groups: HistoryEntry[][] = [];
  const byKey = new Map<string, HistoryEntry[]>();
  history.forEach((entry, index) => {
    const key = entry.actionId ? 'action:' + entry.actionId : 'entry:' + index;
    let group = byKey.get(key);
    if (!group) {
      group = [];
      byKey.set(key, group);
      groups.push(group);
    }
    group.push(entry);
  });
  return groups;
};
const flattenGroups = (groups: HistoryEntry[][]): HistoryEntry[] =>
  groups.flatMap((group) => group);
const compactEntryPoints = (entry: HistoryEntry, maxPoints: number): HistoryEntry => {
  if (entry.kind !== 'stroke' && entry.kind !== 'erase') return entry;
  return { ...entry, points: decimateDrawingPoints(entry.points, maxPoints) } as
    | Stroke
    | ErasedRegion;
};
const compactPointTotal = (history: HistoryEntry[], maxPoints: number): HistoryEntry[] => {
  if (countDrawingPoints(history) <= maxPoints) return history;
  const entries = history.filter(
    (entry): entry is Stroke | ErasedRegion => entry.kind === 'stroke' || entry.kind === 'erase',
  );
  if (!entries.length) return history;
  const originalTotal = countDrawingPoints(history);
  const available = Math.max(entries.length * 2, maxPoints);
  const targets = entries.map((entry) =>
    Math.max(
      2,
      Math.min(entry.points.length, Math.floor((entry.points.length / originalTotal) * available)),
    ),
  );
  let total = targets.reduce((sum, target) => sum + target, 0);
  while (total > maxPoints) {
    const index = targets.findIndex((target) => target > 2);
    if (index < 0) break;
    targets[index] -= 1;
    total -= 1;
  }
  let entryIndex = 0;
  return history.map((entry) => {
    if (entry.kind !== 'stroke' && entry.kind !== 'erase') return entry;
    return compactEntryPoints(entry, targets[entryIndex++] ?? 2);
  });
};

/** Compact live and persisted history, dropping only complete old logical actions. */
export const compactDrawingHistory = (
  history: HistoryEntry[],
  requestedBudget: DrawingHistoryBudget = DRAWING_HISTORY_BUDGET,
): HistoryEntry[] => {
  const budget = clampBudget(requestedBudget);
  let groups = actionGroups(history).map((group) =>
    group.map((entry) => compactEntryPoints(entry, budget.maxPointsPerEntry)),
  );
  while (groups.length > budget.maxActions) groups.shift();
  while (groups.length > 1 && countDrawingPoints(flattenGroups(groups)) > budget.maxPoints)
    groups.shift();
  let compacted = compactPointTotal(flattenGroups(groups), budget.maxPoints);
  while (
    compacted.length > 0 &&
    serializedDrawingHistoryBytes(compacted) > budget.maxSerializedBytes
  ) {
    const currentGroups = actionGroups(compacted);
    if (currentGroups.length > 1) {
      currentGroups.shift();
      compacted = flattenGroups(currentGroups);
      continue;
    }
    const next = compacted.map((entry) =>
      entry.kind === 'stroke' || entry.kind === 'erase'
        ? compactEntryPoints(entry, Math.max(2, Math.floor(entry.points.length * 0.8)))
        : entry,
    );
    if (countDrawingPoints(next) === countDrawingPoints(compacted)) break;
    compacted = next;
  }
  return compacted;
};

/** JSON byte estimate that works in React Native and Jest without Buffer. */
export const serializedDrawingHistoryBytes = (history: HistoryEntry[]): number => {
  const serialized = JSON.stringify(history);
  try {
    return encodeURIComponent(serialized).replace(/%[0-9A-F]{2}|./g, 'x').length;
  } catch {
    return serialized.length;
  }
};
export class DrawingPersistenceError extends Error {
  readonly code = 'size';
  constructor(message = 'Drawing is too large to save') {
    super(message);
    this.name = 'DrawingPersistenceError';
  }
}
export const serializeDrawingHistory = (
  history: HistoryEntry[],
  requestedBudget: DrawingHistoryBudget = DRAWING_HISTORY_BUDGET,
): string => {
  const budget = clampBudget(requestedBudget);
  const compacted = compactDrawingHistory(history, budget);
  const serialized = JSON.stringify(compacted);
  if (serializedDrawingHistoryBytes(compacted) > budget.maxSerializedBytes)
    throw new DrawingPersistenceError();
  return serialized;
};
export const sanitizeDrawingHistory = (
  value: unknown,
  budget: DrawingHistoryBudget = DRAWING_HISTORY_BUDGET,
): HistoryEntry[] | null => {
  if (!Array.isArray(value) || !value.every(isHistoryEntry)) return null;
  return compactDrawingHistory(value, budget);
};
