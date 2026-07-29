import {
  DRAWING_HISTORY_BUDGET,
  DRAWING_HISTORY_MAX_POINTS_PER_ENTRY,
  compactDrawingHistory,
  countDrawingPoints,
  sanitizeDrawingHistory,
  serializeDrawingHistory,
  serializedDrawingHistoryBytes,
  DrawingPersistenceError,
} from './drawingPersistence';
import type { HistoryEntry, Stroke, Shape } from '../components/DrawingCanvas';

const stroke = (id: string, actionId: string, count: number): Stroke => ({
  kind: 'stroke',
  id,
  actionId,
  points: Array.from({ length: count }, (_, index) => ({ x: index, y: index * 2 })),
  color: '#ff0000',
  width: 5,
});

describe('drawing persistence budgets', () => {
  it('compacts oversized legacy strokes while preserving endpoints', () => {
    const original = stroke('legacy', 'legacy-action', DRAWING_HISTORY_MAX_POINTS_PER_ENTRY + 800);
    const migrated = sanitizeDrawingHistory([original]);
    expect(migrated).not.toBeNull();
    if (!migrated) throw new Error('migration unexpectedly failed');
    expect(migrated[0].kind).toBe('stroke');
    const points = (migrated[0] as Stroke).points;
    expect(points.length).toBeLessThanOrEqual(DRAWING_HISTORY_MAX_POINTS_PER_ENTRY);
    expect(points[0]).toEqual(original.points[0]);
    expect(points.at(-1)).toEqual(original.points.at(-1));
  });

  it('drops complete old action groups, retaining symmetry undo batches', () => {
    const history: HistoryEntry[] = [
      stroke('old-a', 'old', 2),
      stroke('old-b', 'old', 2),
      stroke('new-a', 'new', 2),
      stroke('new-b', 'new', 2),
      stroke('latest-a', 'latest', 2),
      stroke('latest-b', 'latest', 2),
    ];
    const compacted = compactDrawingHistory(history, { ...DRAWING_HISTORY_BUDGET, maxActions: 2 });
    expect(compacted.map((entry) => entry.actionId)).toEqual(['new', 'new', 'latest', 'latest']);
  });

  it('enforces total points and serialized byte budgets', () => {
    const history = [stroke('a', 'a', 200), stroke('b', 'b', 200), stroke('c', 'c', 200)];
    const compacted = compactDrawingHistory(history, {
      ...DRAWING_HISTORY_BUDGET,
      maxPoints: 80,
      maxSerializedBytes: 1_000_000,
    });
    expect(countDrawingPoints(compacted)).toBeLessThanOrEqual(80);
    const shape: Shape = {
      kind: 'shape',
      id: 'shape',
      type: 'circle',
      x: 1,
      y: 1,
      size: 10,
      color: '#f00',
    };
    const bytes = compactDrawingHistory([shape, shape], {
      ...DRAWING_HISTORY_BUDGET,
      maxActions: 1,
      maxSerializedBytes: 1000,
    });
    expect(serializedDrawingHistoryBytes(bytes)).toBeLessThanOrEqual(1000);
  });

  it('reports an impossible single payload instead of deleting canvas data', () => {
    const impossible: Shape = {
      kind: 'shape',
      id: 'shape',
      type: 'circle',
      x: 1,
      y: 1,
      size: 10,
      color: '#f00',
    };
    expect(() =>
      serializeDrawingHistory([impossible], { ...DRAWING_HISTORY_BUDGET, maxSerializedBytes: 10 }),
    ).toThrow(DrawingPersistenceError);
  });

  it('accepts temporary stamp actions without changing free-draw storage shape', () => {
    const stamp: HistoryEntry = {
      kind: 'stamp',
      id: 'stamp-1',
      actionId: 'stamp-action',
      x: 12,
      y: 18,
      size: 16,
      color: '#00ff00',
    };

    expect(sanitizeDrawingHistory([stamp])).toEqual([stamp]);
  });
});
