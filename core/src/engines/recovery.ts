import type { Core } from '../index';
import type { EngineManifest, Stored } from '../types';
import { uuid } from '../types';

/**
 * Recovery Engine (spec sekcja 2 + werdykt deduplikacji #2):
 * właściciel pojęcia "Gotowość treningowa" (0-100).
 * Konsumuje zdarzenia SleepLogged i WellbeingLogged (7-dniowe okno).
 * Fatigue mierzy obciążenie — Recovery mierzy zdolność do jego przyjęcia.
 */

export interface SleepSample extends Stored { ts: number; durationH: number; quality?: number }   // quality 1-10
export interface WellbeingSample extends Stored { ts: number; energy?: number; stress?: number; mood?: number; motivation?: number } // 1-10

export interface RecoveryResult {
  ts: number;
  readinessPct: number;   // 0-100
  components: { sleep?: number; quality?: number; energy?: number; stress?: number; mood?: number; motivation?: number }; // 0-1
  samples: { sleep: number; wellbeing: number };
}

const DAY = 86400000;
const clamp01 = (n: number): number => Math.max(0, Math.min(1, n));

/** Czysta funkcja. Składowe znormalizowane 0-1; brakujące pomijane (nie zerują wyniku). */
export function computeRecovery(
  sleep: readonly SleepSample[],
  wellbeing: readonly WellbeingSample[],
  now: number,
): RecoveryResult {
  const recentS = sleep.filter((s) => now - s.ts <= 7 * DAY && now - s.ts >= 0);
  const recentW = wellbeing.filter((w) => now - w.ts <= 7 * DAY && now - w.ts >= 0);

  const avg = (xs: number[]): number | undefined =>
    xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : undefined;

  const durationH = avg(recentS.map((s) => s.durationH).filter((x): x is number => x != null));
  const quality = avg(recentS.map((s) => s.quality).filter((x): x is number => x != null));
  const energy = avg(recentW.map((w) => w.energy).filter((x): x is number => x != null));
  const stress = avg(recentW.map((w) => w.stress).filter((x): x is number => x != null));
  const mood = avg(recentW.map((w) => w.mood).filter((x): x is number => x != null));
  const motivation = avg(recentW.map((w) => w.motivation).filter((x): x is number => x != null));

  const components: RecoveryResult['components'] = {};
  if (durationH != null) components.sleep = clamp01(durationH / 8);          // 8h = pełnia
  if (quality != null) components.quality = clamp01(quality / 10);
  if (energy != null) components.energy = clamp01(energy / 10);
  if (stress != null) components.stress = clamp01((10 - stress) / 10);       // odwrócony
  if (mood != null) components.mood = clamp01(mood / 10);
  if (motivation != null) components.motivation = clamp01(motivation / 10);

  const vals = Object.values(components);
  const readiness = vals.length ? Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 100) : 0;

  return {
    ts: now,
    readinessPct: readiness,
    components,
    samples: { sleep: recentS.length, wellbeing: recentW.length },
  };
}

export const RECOVERY_ENGINE_MANIFEST: EngineManifest = {
  id: 'recovery-engine',
  version: '1.0.0',
  listensTo: ['SleepLogged', 'WellbeingLogged'],
  emits: ['RecoveryUpdated'],
  dependsOn: [],
};

const SLEEP_COL = 'sleep_samples';
const WB_COL = 'wellbeing_samples';

export function registerRecoveryEngine(core: Core): void {
  const recompute = (): void => {
    const result = computeRecovery(
      core.storage.getAll<SleepSample>(SLEEP_COL),
      core.storage.getAll<WellbeingSample>(WB_COL),
      Date.now(),
    );
    const n = result.samples.sleep + result.samples.wellbeing;
    core.scores.put('recovery-engine', 'readiness', result.readinessPct, n >= 5 ? 0.85 : 0.5);
    core.storage.put('recovery_snapshots', { id: 'latest', ...result });
    core.bus.publish('RecoveryUpdated', result, 'system');
  };

  core.registry.register(RECOVERY_ENGINE_MANIFEST, {
    SleepLogged: (evt) => {
      const p = (evt as { payload: { duration?: number; quality?: number } }).payload;
      core.storage.put<SleepSample>(SLEEP_COL, { id: uuid(), ts: Date.now(), durationH: p.duration ?? 0, quality: p.quality });
      recompute();
    },
    WellbeingLogged: (evt) => {
      const p = (evt as { payload: { energy?: number; stress?: number; mood?: number; motivation?: number } }).payload;
      core.storage.put<WellbeingSample>(WB_COL, { id: uuid(), ts: Date.now(), ...p });
      recompute();
    },
  });
}

export function latestRecovery(core: Core): (RecoveryResult & { id: string }) | null {
  return core.storage.get('recovery_snapshots', 'latest');
}
