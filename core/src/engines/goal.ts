import type { Core } from '../index';
import type { EngineManifest } from '../types';
import type { ProgressResult } from './progress';

/**
 * Goal Engine (spec sekcja 2): cel ma postęp, prawdopodobieństwo i przewidywaną
 * datę. Konsumuje trendy z Progress Engine (artefakty) + cele dostarczane
 * przez UI (GoalProvider — core nie zna localStorage UI).
 */

export interface LinkedGoal {
  id: string | number;
  title: string;
  exercise?: string;      // nazwa ćwiczenia (cele siłowe powiązane)
  target: number;         // np. 100 (kg e1RM)
  current?: number;       // aktualna wartość, jeśli UI ją zna
}

export type GoalProvider = () => LinkedGoal[];

export interface GoalForecast {
  goalId: string | number;
  title: string;
  current: number;
  target: number;
  progressPct: number;      // 0-100
  trendPerWeek: number;     // kg/tydz. z Progress Engine
  probabilityPct: number;   // szansa osiągnięcia
  etaTs: number | null;     // przewidywana data (epoch ms) lub null
}

export interface GoalResult { ts: number; forecasts: GoalForecast[] }

const WEEK = 7 * 86400000;

/** Czysta funkcja prognozy pojedynczego celu. */
export function forecastGoal(goal: LinkedGoal, current: number, trendPerWeek: number, now: number): GoalForecast {
  const progressPct = goal.target > 0 ? Math.min(100, Math.round((current / goal.target) * 100)) : 0;

  let probabilityPct: number;
  let etaTs: number | null = null;

  if (current >= goal.target && goal.target > 0) {
    probabilityPct = 100;
    etaTs = now;
  } else if (trendPerWeek <= 0) {
    probabilityPct = current > 0 ? 15 : 5;   // brak trendu wzrostowego
  } else {
    const weeks = (goal.target - current) / trendPerWeek;
    etaTs = now + Math.round(weeks * WEEK);
    probabilityPct = weeks <= 4 ? 92 : weeks <= 12 ? 78 : weeks <= 26 ? 55 : 30;
  }

  return {
    goalId: goal.id, title: goal.title,
    current: Math.round(current * 10) / 10, target: goal.target,
    progressPct, trendPerWeek, probabilityPct, etaTs,
  };
}

export function computeGoals(goals: readonly LinkedGoal[], progress: ProgressResult | null, now: number): GoalResult {
  const forecasts: GoalForecast[] = [];
  for (const g of goals) {
    if (!g.target || g.target <= 0) continue;
    let current = g.current ?? 0;
    let trend = 0;
    if (g.exercise && progress) {
      const p = progress.perExercise.find((x) => x.exercise === g.exercise);
      if (p) { current = Math.max(current, p.currentE1rm); trend = p.trendPerWeek; }
    }
    forecasts.push(forecastGoal(g, current, trend, now));
  }
  return { ts: now, forecasts };
}

export const GOAL_ENGINE_MANIFEST: EngineManifest = {
  id: 'goal-engine',
  version: '1.0.0',
  listensTo: ['ProgressUpdated'],
  emits: ['GoalsForecasted'],
  dependsOn: ['progress-engine'],
};

export function registerGoalEngine(core: Core, getGoals: GoalProvider): void {
  core.registry.register(GOAL_ENGINE_MANIFEST, {
    ProgressUpdated: (evt) => {
      const progress = (evt as { payload: ProgressResult }).payload;
      const result = computeGoals(getGoals(), progress, Date.now());
      if (result.forecasts.length) {
        const avgProb = Math.round(result.forecasts.reduce((a, f) => a + f.probabilityPct, 0) / result.forecasts.length);
        core.scores.put('goal-engine', 'avg-probability', avgProb, 0.7);
      }
      core.storage.put('goal_snapshots', { id: 'latest', ...result });
      core.bus.publish('GoalsForecasted', result, 'system');
    },
  });
}

export function latestGoals(core: Core): (GoalResult & { id: string }) | null {
  return core.storage.get('goal_snapshots', 'latest');
}
