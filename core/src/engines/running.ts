import type { Core } from '../index';
import type { EngineManifest, Stored } from '../types';
import { uuid } from '../types';

/**
 * Running Engine (spec sekcja 2): analizuje biegi — tempo, objętość tygodniową,
 * ryzyko przeciążenia (kroczący acute/chronic kilometraż, wzorzec jak Fatigue).
 * Zwraca dane innym silnikom wyłącznie przez zdarzenia i Scores.
 */

export interface RunSample extends Stored {
  ts: number;
  km: number;
  durationMin: number;
  avgHr?: number;
}

export interface RunAnalysis {
  ts: number;
  km: number;
  paceSecPerKm: number | null;
  weeklyKm: number;          // acute: ostatnie 7 dni (z tym biegiem)
  chronicWeeklyKm: number;   // średnia tygodniowa z 28 dni
  rampRatio: number;         // acute/chronic — >1.3 = ryzyko
  riskPct: number;           // 0-100 (ratio × 50, clamp)
}

const DAY = 86400000;

/** Czysta funkcja: nowy bieg + historia → analiza. */
export function analyzeRun(run: { km: number; durationMin: number; avgHr?: number }, history: readonly RunSample[], now: number): RunAnalysis {
  let acute = run.km, chronic = run.km;
  for (const s of history) {
    const age = now - s.ts;
    if (age < 0 || age > 28 * DAY) continue;
    chronic += s.km;
    if (age <= 7 * DAY) acute += s.km;
  }
  const chronicWeekly = chronic / 4;
  const ratio = chronicWeekly > 0 ? acute / chronicWeekly : 0;
  return {
    ts: now,
    km: run.km,
    paceSecPerKm: run.km > 0 && run.durationMin > 0 ? Math.round((run.durationMin * 60) / run.km) : null,
    weeklyKm: Math.round(acute * 10) / 10,
    chronicWeeklyKm: Math.round(chronicWeekly * 10) / 10,
    rampRatio: Math.round(ratio * 100) / 100,
    riskPct: Math.max(0, Math.min(100, Math.round(ratio * 50))),
  };
}

export const RUNNING_ENGINE_MANIFEST: EngineManifest = {
  id: 'running-engine',
  version: '1.0.0',
  listensTo: ['RunFinished'],
  emits: ['RunAnalyzed'],
  dependsOn: [],
};

const COL = 'run_samples';

export function registerRunningEngine(core: Core): void {
  core.registry.register(RUNNING_ENGINE_MANIFEST, {
    RunFinished: (evt) => {
      const p = (evt as { payload: { distance?: number; duration?: number; avgHr?: number } }).payload;
      const run = { km: p.distance ?? 0, durationMin: p.duration ?? 0, avgHr: p.avgHr };
      const history = core.storage.getAll<RunSample>(COL);
      const analysis = analyzeRun(run, history, Date.now());
      core.storage.put<RunSample>(COL, { id: uuid(), ts: analysis.ts, km: run.km, durationMin: run.durationMin, avgHr: run.avgHr });
      core.scores.put('running-engine', 'ramp-risk', analysis.riskPct, history.length >= 6 ? 0.8 : 0.4);
      core.storage.put('running_snapshots', { id: 'latest', ...analysis });
      core.bus.publish('RunAnalyzed', analysis, 'system');
    },
  });
}

export function latestRun(core: Core): (RunAnalysis & { id: string }) | null {
  return core.storage.get('running_snapshots', 'latest');
}
