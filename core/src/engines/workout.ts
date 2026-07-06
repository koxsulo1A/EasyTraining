import type { Core } from '../index';
import type { EngineManifest, Stored } from '../types';
import { uuid } from '../types';
import { engagementFromMuscles, muscleGroup } from '../knowledge/muscles';

/**
 * Workout Engine (spec sekcja 2): "matematyka treningu, nie AI".
 * Liczy fakty: objętość (łączna, per mięsień, per partia), serie, intensywność.
 * NIE liczy zmęczenia — to własność Fatigue Engine (werdykt deduplikacji #1).
 */

// ── Wejście: sesja w kształcie, jaki produkuje UI (strength.js) ────────────
export interface SetData { reps?: number; weight?: number; done?: boolean; rpe?: number }
export interface SessionExercise { name: string; setsData?: SetData[] }
export interface WorkoutSession {
  id?: number | string;
  date?: string;
  duration?: number;      // ms
  exercises?: SessionExercise[];
}

/** Dostawca wiedzy o ćwiczeniu (UI/baza podaje mięśnie; core nie zna window.ET). */
export type MuscleResolver = (exerciseName: string) => readonly string[];

// ── Wynik ──────────────────────────────────────────────────────────────────
export interface WorkoutAnalysis extends Stored {
  workoutId: string | number | null;
  date: string | null;
  ts: number;
  totalVolume: number;                    // kg (suma ciężar×powt. ukończonych serii)
  setsDone: number;
  setsTotal: number;
  completionPct: number;                  // 0-100
  avgLoadPerSet: number;                  // kg
  perMuscle: Record<string, number>;      // muscleId -> kg (ważone % zaangażowania)
  perGroup: Record<string, number>;       // partia -> kg
  perExercise: Record<string, { e1rm: number; bestWeight: number; volume: number; avgRpe: number | null }>;
  avgRpe: number | null;                  // średnie RPE sesji (intensywność subiektywna)
}

/** Epley — spójny z UI (strength.js calc1RM). */
export function e1rm(weight: number, reps: number): number {
  if (!weight || !reps) return 0;
  return Math.round(weight * (1 + reps / 30) * 10) / 10;
}

/** Czysta funkcja — pełna testowalność, zero zależności od storage. */
export function analyzeWorkout(session: WorkoutSession, resolve: MuscleResolver): WorkoutAnalysis {
  let totalVolume = 0, setsDone = 0, setsTotal = 0;
  const perMuscle: Record<string, number> = {};
  const perGroup: Record<string, number> = {};
  const perExercise: WorkoutAnalysis['perExercise'] = {};
  const sessionRpes: number[] = [];

  for (const ex of session.exercises ?? []) {
    const engagement = engagementFromMuscles(resolve(ex.name));
    const exStat = perExercise[ex.name] ?? { e1rm: 0, bestWeight: 0, volume: 0, avgRpe: null };
    const exRpes: number[] = [];
    for (const s of ex.setsData ?? []) {
      setsTotal++;
      if (!s.done) continue;
      setsDone++;
      const vol = (s.weight ?? 0) * (s.reps ?? 0);
      totalVolume += vol;
      exStat.volume += vol;
      exStat.e1rm = Math.max(exStat.e1rm, e1rm(s.weight ?? 0, s.reps ?? 0));
      exStat.bestWeight = Math.max(exStat.bestWeight, s.weight ?? 0);
      if (typeof s.rpe === 'number' && s.rpe > 0) { exRpes.push(s.rpe); sessionRpes.push(s.rpe); }
      for (const [mId, pct] of Object.entries(engagement)) {
        const share = (vol * pct) / 100;
        perMuscle[mId] = (perMuscle[mId] ?? 0) + share;
        const g = muscleGroup(mId);
        if (g) perGroup[g] = (perGroup[g] ?? 0) + share;
      }
    }
    exStat.avgRpe = exRpes.length ? Math.round((exRpes.reduce((a, b) => a + b, 0) / exRpes.length) * 10) / 10 : null;
    if (exStat.volume > 0) perExercise[ex.name] = exStat;
  }
  const avgRpe = sessionRpes.length ? Math.round((sessionRpes.reduce((a, b) => a + b, 0) / sessionRpes.length) * 10) / 10 : null;

  const round = (n: number): number => Math.round(n * 10) / 10;
  for (const k of Object.keys(perMuscle)) perMuscle[k] = round(perMuscle[k]!);
  for (const k of Object.keys(perGroup)) perGroup[k] = round(perGroup[k]!);

  return {
    id: uuid(),
    workoutId: session.id ?? null,
    date: session.date ?? null,
    ts: Date.now(),
    totalVolume: round(totalVolume),
    setsDone,
    setsTotal,
    completionPct: setsTotal ? Math.round((setsDone / setsTotal) * 100) : 0,
    avgLoadPerSet: setsDone ? round(totalVolume / setsDone) : 0,
    perMuscle,
    perGroup,
    perExercise,
    avgRpe,
  };
}

// ── Rejestracja w core (ADR-005): manifest + subskrypcja WorkoutFinished ──
export const WORKOUT_ENGINE_MANIFEST: EngineManifest = {
  id: 'workout-engine',
  version: '1.0.0',
  listensTo: ['WorkoutFinished'],
  emits: ['WorkoutAnalyzed'],
  dependsOn: [],
};

const ANALYSIS_COL = 'workout_analysis';

export function registerWorkoutEngine(core: Core, resolve: MuscleResolver): void {
  core.registry.register(WORKOUT_ENGINE_MANIFEST, {
    WorkoutFinished: (evt) => {
      const session = (evt as { payload: WorkoutSession }).payload;
      const analysis = analyzeWorkout(session, resolve);
      core.storage.put(ANALYSIS_COL, analysis);
      // Score (ADR-006): jakość sesji = % ukończenia serii — prosty, wyjaśnialny wskaźnik
      core.scores.put('workout-engine', 'session-completion', analysis.completionPct, 1, String(analysis.workoutId ?? ''));
      // Intensywność subiektywna z RPE (skala 1-10 → 0-100). Confidence niższy, gdy brak RPE.
      if (analysis.avgRpe != null) core.scores.put('workout-engine', 'intensity-rpe', analysis.avgRpe * 10, 0.9, String(analysis.workoutId ?? ''));
      core.bus.publish('WorkoutAnalyzed', analysis, 'system');
    },
  });
}

export function latestAnalysis(core: Core): WorkoutAnalysis | null {
  let best: WorkoutAnalysis | null = null;
  for (const a of core.storage.getAll<WorkoutAnalysis>(ANALYSIS_COL)) {
    if (!best || a.ts >= best.ts) best = a;
  }
  return best;
}
