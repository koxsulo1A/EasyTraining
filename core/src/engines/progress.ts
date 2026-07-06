import type { Core } from '../index';
import type { EngineManifest } from '../types';
import type { WorkoutAnalysis } from './workout';

/**
 * Progress Engine (spec sekcja 2): analizuje tempo progresu per ćwiczenie
 * (trend e1RM kg/tydzień) i klasyfikuje: progres / szybki / nierealny /
 * stagnacja / plateau / regres. Konsumuje artefakty Workout Engine.
 */

export type ProgressStatus = 'progres' | 'szybki' | 'nierealny' | 'stagnacja' | 'plateau' | 'regres' | 'za-malo-danych';

export interface ExerciseProgress {
  exercise: string;
  points: number;                 // liczba sesji z tym ćwiczeniem (okno 12 tyg.)
  currentE1rm: number;
  trendPerWeek: number;           // kg/tydzień (regresja liniowa)
  status: ProgressStatus;
}

export interface ProgressResult {
  ts: number;
  perExercise: ExerciseProgress[];
  progressingPct: number;         // % ćwiczeń z dodatnim trendem (Score)
}

const DAY = 86400000;
const WINDOW = 84 * DAY; // 12 tygodni

/** Nachylenie regresji liniowej (kg/tydzień) dla punktów (ts, e1rm). */
function slopePerWeek(pts: ReadonlyArray<{ ts: number; v: number }>): number {
  const n = pts.length;
  if (n < 2) return 0;
  const xs = pts.map((p) => p.ts / (7 * DAY)); // oś w tygodniach
  const ys = pts.map((p) => p.v);
  const mx = xs.reduce((a, b) => a + b, 0) / n;
  const my = ys.reduce((a, b) => a + b, 0) / n;
  let num = 0, den = 0;
  for (let i = 0; i < n; i++) { num += (xs[i]! - mx) * (ys[i]! - my); den += (xs[i]! - mx) ** 2; }
  return den > 0 ? num / den : 0;
}

function classify(trend: number, current: number, points: number, spanDays: number): ProgressStatus {
  if (points < 2 || spanDays < 3) return 'za-malo-danych'; // sesje z <3 dni nie dają wiarygodnego trendu tygodniowego
  const pctPerWeek = current > 0 ? (trend / current) * 100 : 0;
  if (pctPerWeek > 5) return 'nierealny';       // >5%/tydz. — podejrzane dane
  if (pctPerWeek > 1.5) return 'szybki';
  if (trend < -0.25) return 'regres';
  if (Math.abs(pctPerWeek) <= 0.3) return points >= 4 ? 'plateau' : 'stagnacja';
  return 'progres';
}

/** Czysta funkcja: historia analiz → trendy per ćwiczenie. */
export function computeProgress(analyses: readonly WorkoutAnalysis[], now: number): ProgressResult {
  const series = new Map<string, Array<{ ts: number; v: number }>>();
  for (const a of analyses) {
    if (now - a.ts > WINDOW || now - a.ts < 0) continue;
    for (const [name, st] of Object.entries(a.perExercise ?? {})) {
      if (st.e1rm <= 0) continue;
      let arr = series.get(name);
      if (!arr) { arr = []; series.set(name, arr); }
      arr.push({ ts: a.ts, v: st.e1rm });
    }
  }

  const perExercise: ExerciseProgress[] = [];
  let positive = 0, classified = 0;
  for (const [exercise, ptsRaw] of series) {
    const pts = ptsRaw.sort((a, b) => a.ts - b.ts);
    const current = pts[pts.length - 1]!.v;
    const spanDays = (pts[pts.length - 1]!.ts - pts[0]!.ts) / DAY;
    const status0 = classify(0, current, pts.length, spanDays);
    const trend = status0 === 'za-malo-danych' ? 0 : Math.round(slopePerWeek(pts) * 100) / 100;
    const status = classify(trend, current, pts.length, spanDays);
    perExercise.push({ exercise, points: pts.length, currentE1rm: current, trendPerWeek: trend, status });
    if (status !== 'za-malo-danych') {
      classified++;
      if (status === 'progres' || status === 'szybki') positive++;
    }
  }
  perExercise.sort((a, b) => b.points - a.points);

  return {
    ts: now,
    perExercise,
    progressingPct: classified ? Math.round((positive / classified) * 100) : 0,
  };
}

export const PROGRESS_ENGINE_MANIFEST: EngineManifest = {
  id: 'progress-engine',
  version: '1.0.0',
  listensTo: ['WorkoutAnalyzed'],
  emits: ['ProgressUpdated'],
  dependsOn: ['workout-engine'],
};

export function registerProgressEngine(core: Core): void {
  core.registry.register(PROGRESS_ENGINE_MANIFEST, {
    WorkoutAnalyzed: () => {
      const analyses = core.storage.getAll<WorkoutAnalysis>('workout_analysis');
      const result = computeProgress(analyses, Date.now());
      const classified = result.perExercise.filter((p) => p.status !== 'za-malo-danych').length;
      core.scores.put('progress-engine', 'progressing', result.progressingPct, classified >= 3 ? 0.8 : 0.4);
      core.storage.put('progress_snapshots', { id: 'latest', ...result });
      core.bus.publish('ProgressUpdated', result, 'system');
    },
  });
}

export function latestProgress(core: Core): (ProgressResult & { id: string }) | null {
  return core.storage.get('progress_snapshots', 'latest');
}
