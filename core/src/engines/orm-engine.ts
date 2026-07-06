/**
 * Część 4/5: Rejestracja ORM Engine w core (manifest + eventy + readers).
 *
 * Słucha: WorkoutFinished — wyciąga serie per ćwiczenie i oblicza 1RM.
 * Emituje: OrmUpdated { exerciseName, orm1rm, confidence, deltaFromPrevious, trendNote }
 * Zapisuje: snapshot 'orm_results/latest_{exerciseName}'
 */

import type { Core } from '../index';
import type { EngineManifest } from '../types';
import { computeOrm, buildTrendNote } from './orm-ensemble';
import type { OrmInput, OrmResult, ExerciseMeta } from './orm';

export const ORM_ENGINE_MANIFEST: EngineManifest = {
  id: 'orm-engine',
  version: '1.0.0',
  listensTo: ['WorkoutFinished'],
  emits: ['OrmUpdated'],
  dependsOn: ['fatigue-engine'],   // korzysta z Score 'overall' jeśli dostępny
};

// ─────────────────────────────────────────────────────────────────────────────
// Readers
// ─────────────────────────────────────────────────────────────────────────────

/** Ostatnia estymacja dla danego ćwiczenia (null = brak historii). */
export function latestOrm(core: Core, exerciseName: string): OrmResult | null {
  const key = snapshotKey(exerciseName);
  return core.storage.get<OrmResult>('orm_results', key);
}

/** Historia estymacji dla wykresu trendu (max N ostatnich). */
export function ormHistory(core: Core, exerciseName: string, limit = 10): OrmResult[] {
  const all = core.storage.getAll<OrmResult & { _ex: string }>('orm_history');
  return all
    .filter((r) => r._ex === exerciseName)
    .sort((a, b) => b.ts - a.ts)
    .slice(0, limit);
}

// ─────────────────────────────────────────────────────────────────────────────
// Rejestracja
// ─────────────────────────────────────────────────────────────────────────────

/** MetaResolver: zwraca czy ćwiczenie jest wielostawowe. */
export type CompoundResolver = (exerciseName: string) => boolean;

export function registerOrmEngine(core: Core, compoundResolver?: CompoundResolver): void {
  const isCompound = compoundResolver ?? defaultCompoundResolver;

  core.registry.register(ORM_ENGINE_MANIFEST, {
    WorkoutFinished: (evt) => {
      try {
        const payload = (evt as { payload: WorkoutFinishedPayload }).payload;
        handleWorkoutFinished(core, payload, isCompound);
      } catch (e) {
        console.error('[orm-engine] błąd:', e);
      }
    },
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Handler
// ─────────────────────────────────────────────────────────────────────────────

interface WorkoutFinishedPayload {
  exercises?: Array<{
    name: string;
    setsData?: Array<{
      weight?: number;
      reps?: number;
      done?: boolean;
      rpe?: number;
      rir?: number;         // planowany RIR z planu
    }>;
    plannedRIR?: number;    // domyślny RIR ćwiczenia (override per set)
  }>;
  fatigueScore?: number;    // z Fatigue Engine (opcjonalnie)
  sessionVolume?: number;
}

function handleWorkoutFinished(
  core: Core,
  payload: WorkoutFinishedPayload,
  isCompound: CompoundResolver,
): void {
  const exercises = payload.exercises ?? [];
  const fatigueScore = payload.fatigueScore ?? readFatigueScore(core);

  for (const ex of exercises) {
    if (!ex.name) continue;
    const sets = (ex.setsData ?? [])
      .filter((s) => s.done && s.weight && s.reps)
      .map((s) => ({
        weight: s.weight!,
        reps: s.reps!,
        plannedRIR: s.rir ?? ex.plannedRIR ?? 0,
        rpe: s.rpe ?? undefined,
      }));

    if (sets.length === 0) continue;

    const exercise: ExerciseMeta = { name: ex.name, isCompound: isCompound(ex.name) };
    const prev = latestOrm(core, ex.name);
    const history = ormHistory(core, ex.name, 5);
    const deltaHistory = history
      .filter((r) => r.deltaFromPrevious != null)
      .map((r) => r.deltaFromPrevious!)
      .reverse();

    const input: OrmInput = {
      sets,
      exercise,
      fatigueScore,
      sessionVolume: payload.sessionVolume,
      previousOrm: prev?.orm1rm,
    };

    const result = computeOrm(input, deltaHistory);

    // Zapisz snapshot (latest per ćwiczenie) + historia
    const snapId = snapshotKey(ex.name);
    core.storage.put('orm_results', { ...result, id: snapId });
    core.storage.put('orm_history', { ...result, id: result.id, _ex: ex.name });

    // Score (0-100) = orm1rm w stosunku do previousOrm
    // Jeśli brak historii: wartość absolutna (clamped) jako proxy
    const scoreValue = prev
      ? Math.min(100, Math.max(0, 50 + (result.orm1rm - prev.orm1rm) * 2))
      : Math.min(100, result.orm1rm / 3);
    core.scores.put('orm-engine', `1rm_${ex.name}`, scoreValue, result.confidence / 100);

    core.bus.publish('OrmUpdated', {
      exerciseName: ex.name,
      orm1rm: result.orm1rm,
      confidence: result.confidence,
      deltaFromPrevious: result.deltaFromPrevious,
      trendNote: result.trendNote,
      methodSummary: result.methodSummary,
    });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function snapshotKey(exerciseName: string): string {
  return 'orm_latest_' + exerciseName.replace(/\s+/g, '_').toLowerCase();
}

function readFatigueScore(core: Core): number {
  const s = core.scores.latest('fatigue-engine', 'overall');
  return s ? s.value : 0;
}

/** Podstawowa lista ćwiczeń wielostawowych — zastępowana przez resolver z UI. */
const COMPOUND_EXERCISES = new Set([
  'przysiad', 'squat', 'martwy ciąg', 'deadlift', 'wyciskanie', 'bench press',
  'wiosłowanie', 'row', 'podciąganie', 'pull-up', 'wyciskanie żołnierskie',
  'overhead press', 'hip thrust', 'lunges', 'wykroki',
]);

function defaultCompoundResolver(name: string): boolean {
  const lower = name.toLowerCase();
  return [...COMPOUND_EXERCISES].some((k) => lower.includes(k));
}
