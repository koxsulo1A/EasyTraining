import type { Core } from '../index';

/**
 * Integracja ze zdrowiem (ADR-010): aplikacja NIGDY nie zna modeli urządzeń —
 * pobiera dane wyłącznie przez Apple Health / Health Connect. Tu jest sama
 * abstrakcja + orkiestrator importu biegów; konkretny provider (natywny plugin)
 * wstrzykuje UI (js/health.js). Główny cel: import biegów → RunFinished → silniki.
 */

export interface HealthWorkout {
  externalId?: string;      // stabilny id z Health (dedup)
  startTs: number;          // epoch ms
  distanceKm?: number;
  durationMin?: number;
  avgHr?: number;
  source?: string;
}

export interface HealthProvider {
  isAvailable(): Promise<boolean>;
  requestAuth(): Promise<boolean>;
  getRunningWorkouts(sinceTs: number): Promise<HealthWorkout[]>;
}

export interface ImportedRun {
  externalId: string;
  distance: number;
  duration: number;
  avgHr?: number;
  date: string;             // YYYY-MM-DD
  source: string;
}

export interface HealthSyncResult {
  available: boolean;
  authorized: boolean;
  imported: number;
  skipped: number;
  lastTs: number;
}

const CURSOR = 'health_cursor';
const IMPORTS = 'health_imports';

/**
 * Import biegów z providera. Idempotentny (dedup po externalId), inkrementalny
 * (kursor lastTs). Każdy nowy bieg: dopisany przez `onRun` (do UI store) i
 * opublikowany jako RunFinished (Running Engine liczy tempo/ryzyko).
 */
export async function syncRunningWorkouts(
  core: Core,
  provider: HealthProvider,
  onRun?: (run: ImportedRun) => void,
): Promise<HealthSyncResult> {
  const cursor = core.storage.get<{ id: string; lastTs: number }>(CURSOR, 'apple') ?? { id: 'apple', lastTs: 0 };
  const result: HealthSyncResult = { available: false, authorized: false, imported: 0, skipped: 0, lastTs: cursor.lastTs };

  if (!(await provider.isAvailable())) return result;
  result.available = true;
  if (!(await provider.requestAuth())) return result;
  result.authorized = true;

  const workouts = await provider.getRunningWorkouts(cursor.lastTs);
  let maxTs = cursor.lastTs;

  for (const w of workouts) {
    maxTs = Math.max(maxTs, w.startTs);
    const extId = w.externalId ?? `${w.startTs}_${w.distanceKm ?? 0}`;
    if (core.storage.get(IMPORTS, extId)) { result.skipped++; continue; }
    core.storage.put(IMPORTS, { id: extId });

    const run: ImportedRun = {
      externalId: extId,
      distance: Math.round((w.distanceKm ?? 0) * 100) / 100,
      duration: Math.round(w.durationMin ?? 0),
      avgHr: w.avgHr,
      date: new Date(w.startTs).toISOString().slice(0, 10),
      source: w.source ?? 'apple-health',
    };
    onRun?.(run);
    core.bus.publish('RunFinished', { distance: run.distance, duration: run.duration, avgHr: run.avgHr }, 'system');
    result.imported++;
  }

  core.storage.put(CURSOR, { id: 'apple', lastTs: maxTs });
  result.lastTs = maxTs;
  return result;
}
