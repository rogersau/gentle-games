import type { HistoryEntry, Point } from '../components/DrawingCanvas';

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value);

const isPoint = (value: unknown): value is Point =>
  isRecord(value) && isFiniteNumber(value.x) && isFiniteNumber(value.y);

const hasCommonFields = (entry: Record<string, unknown>): boolean =>
  typeof entry.id === 'string' &&
  entry.id.length > 0 &&
  (entry.actionId === undefined || typeof entry.actionId === 'string');

const isHistoryEntry = (value: unknown): value is HistoryEntry => {
  if (!isRecord(value) || !hasCommonFields(value)) {
    return false;
  }

  if (value.kind === 'stroke') {
    return (
      Array.isArray(value.points) &&
      value.points.every(isPoint) &&
      typeof value.color === 'string' &&
      isFiniteNumber(value.width) &&
      value.width > 0
    );
  }

  if (value.kind === 'erase') {
    return (
      Array.isArray(value.points) &&
      value.points.every(isPoint) &&
      isFiniteNumber(value.width) &&
      value.width > 0
    );
  }

  if (value.kind === 'shape') {
    return (
      (value.type === 'circle' || value.type === 'square' || value.type === 'triangle') &&
      isFiniteNumber(value.x) &&
      isFiniteNumber(value.y) &&
      isFiniteNumber(value.size) &&
      value.size > 0 &&
      typeof value.color === 'string'
    );
  }

  return false;
};

export const sanitizeDrawingHistory = (value: unknown): HistoryEntry[] | null => {
  if (!Array.isArray(value) || !value.every(isHistoryEntry)) {
    return null;
  }

  return value;
};
