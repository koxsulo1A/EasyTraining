import type { Stored, StorageAdapter } from '../types';
import { uuid } from '../types';
import { VersionedRepo } from './versioned';

/** Kształt danych legacy (localStorage klucz et_v1) — tylko to, co migrujemy. */
interface LegacyStore {
  workouts?: Array<Record<string, unknown> & { id?: number | string; date?: string }>;
  runs?: Array<Record<string, unknown> & { id?: number | string; date?: string }>;
  measurements?: Array<Record<string, unknown> & { id?: number | string; date?: string }>;
  customPlans?: Array<Record<string, unknown> & { id?: number | string; name?: string }>;
  goals?: Array<Record<string, unknown> & { id?: number | string }>;
}

export interface MigrationReport {
  ran: boolean;            // false = już wcześniej zmigrowano
  workouts: number;
  runs: number;
  measurements: number;
  plans: number;
  goals: number;
}

interface MigrationFlag extends Stored { migratedAt: number; source: string; }

const FLAG_COL = 'migrations';
const FLAG_ID = 'et_v1';

/**
 * Jednorazowa migracja legacy localStorage (et_v1) do kolekcji core.
 * - dane płaskie (workouts/runs/measurements) → kolekcje z nowym UUID,
 *   stare id zachowane w polu legacyId (historia użytkownika nienaruszona)
 * - plany i cele → encje WERSJONOWANE (v1, changedBy: 'system')
 * - idempotentna: flaga w kolekcji migrations
 * - NIE kasuje et_v1 (istniejące UI dalej z niego korzysta w okresie przejściowym)
 */
export function migrateLegacy(storage: StorageAdapter, rawLegacyJson: string | null): MigrationReport {
  const empty: MigrationReport = { ran: false, workouts: 0, runs: 0, measurements: 0, plans: 0, goals: 0 };
  if (storage.get<MigrationFlag>(FLAG_COL, FLAG_ID)) return empty;

  let legacy: LegacyStore = {};
  if (rawLegacyJson) {
    try { legacy = JSON.parse(rawLegacyJson) as LegacyStore; } catch { legacy = {}; }
  }

  const report: MigrationReport = { ...empty, ran: true };

  const copyFlat = (items: Array<Record<string, unknown>> | undefined, col: string): number => {
    if (!items || !items.length) return 0;
    const mapped = items.map((it) => ({ ...it, id: uuid(), legacyId: it['id'] ?? null }));
    storage.putMany(col, mapped as unknown as Stored[]);
    return mapped.length;
  };

  report.workouts = copyFlat(legacy.workouts, 'workouts');
  report.runs = copyFlat(legacy.runs, 'runs');
  report.measurements = copyFlat(legacy.measurements, 'measurements');

  const plans = new VersionedRepo<Record<string, unknown>>(storage, 'plans');
  for (const p of legacy.customPlans ?? []) {
    plans.create({ ...p, legacyId: p.id ?? null }, { changedBy: 'system', reason: 'migracja et_v1' });
    report.plans++;
  }
  const goals = new VersionedRepo<Record<string, unknown>>(storage, 'goals');
  for (const g of legacy.goals ?? []) {
    goals.create({ ...g, legacyId: g.id ?? null }, { changedBy: 'system', reason: 'migracja et_v1' });
    report.goals++;
  }

  storage.put<MigrationFlag>(FLAG_COL, { id: FLAG_ID, migratedAt: Date.now(), source: 'et_v1' });
  return report;
}
