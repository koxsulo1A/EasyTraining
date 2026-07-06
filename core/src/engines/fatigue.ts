import type { Core } from '../index';
import type { EngineManifest } from '../types';
import type { WorkoutAnalysis } from './workout';

/**
 * Fatigue Engine (spec sekcja 2 + werdykt deduplikacji #1/#2):
 * JEDYNY właściciel pojęcia "zmęczenie". Konsumuje fakty z Workout Engine
 * (kolekcja workout_analysis) i liczy kroczące obciążenie per partia:
 *   acute  = suma z 7 dni, chronic = suma z 28 dni / 4 (jak ACWR).
 * Zmęczenie partii = acute/chronic znormalizowane do 0-100.
 */

export interface FatigueResult {
  ts: number;
  perGroup: Record<string, { acute: number; chronic: number; ratio: number; fatiguePct: number }>;
  overallPct: number;                 // 0-100
  level: 'niskie' | 'srednie' | 'duze';
}

const DAY = 86400000;

/** RPE moduluje obciążenie: 7 = neutralne (×1), 10 ≈ ×1.4, brak RPE = ×1. */
function rpeFactor(avgRpe: number | null | undefined): number {
  if (avgRpe == null) return 1;
  return Math.max(0.7, Math.min(1.4, avgRpe / 7));
}

/** Czysta funkcja: analizy sesji → zmęczenie. `now` wstrzykiwane dla testów. */
export function computeFatigue(analyses: readonly WorkoutAnalysis[], now: number): FatigueResult {
  const acute: Record<string, number> = {};
  const chronic: Record<string, number> = {};

  for (const a of analyses) {
    const age = now - a.ts;
    if (age < 0 || age > 28 * DAY) continue;
    const f = rpeFactor(a.avgRpe);
    for (const [g, v0] of Object.entries(a.perGroup ?? {})) {
      const v = v0 * f;   // obciążenie ważone intensywnością (RPE)
      chronic[g] = (chronic[g] ?? 0) + v;
      if (age <= 7 * DAY) acute[g] = (acute[g] ?? 0) + v;
    }
  }

  const perGroup: FatigueResult['perGroup'] = {};
  let sumPct = 0, n = 0;
  for (const g of Object.keys(chronic)) {
    const ch = (chronic[g] ?? 0) / 4;               // średnia tygodniowa z 28 dni
    const ac = acute[g] ?? 0;
    const ratio = ch > 0 ? ac / ch : 0;
    // ratio 1.0 (norma) → ~50; 2.0+ → 100; 0 → 0. Liniowo, wyjaśnialnie.
    const pct = Math.max(0, Math.min(100, Math.round(ratio * 50)));
    perGroup[g] = {
      acute: Math.round(ac * 10) / 10,
      chronic: Math.round(ch * 10) / 10,
      ratio: Math.round(ratio * 100) / 100,
      fatiguePct: pct,
    };
    sumPct += pct; n++;
  }

  const overall = n ? Math.round(sumPct / n) : 0;
  return {
    ts: now,
    perGroup,
    overallPct: overall,
    level: overall < 40 ? 'niskie' : overall < 70 ? 'srednie' : 'duze',
  };
}

export const FATIGUE_ENGINE_MANIFEST: EngineManifest = {
  id: 'fatigue-engine',
  version: '1.0.0',
  listensTo: ['WorkoutAnalyzed'],
  emits: ['FatigueUpdated'],
  dependsOn: ['workout-engine'],       // wyłącznie przez jego artefakty (nie wywołania)
};

export function registerFatigueEngine(core: Core): void {
  core.registry.register(FATIGUE_ENGINE_MANIFEST, {
    WorkoutAnalyzed: () => {
      const analyses = core.storage.getAll<WorkoutAnalysis>('workout_analysis');
      const result = computeFatigue(analyses, Date.now());
      core.scores.put('fatigue-engine', 'overall', result.overallPct, analyses.length >= 8 ? 0.85 : 0.5);
      core.storage.put('fatigue_snapshots', { id: 'latest', ...result });
      core.bus.publish('FatigueUpdated', result, 'system');
    },
  });
}

export function latestFatigue(core: Core): (FatigueResult & { id: string }) | null {
  return core.storage.get('fatigue_snapshots', 'latest');
}
