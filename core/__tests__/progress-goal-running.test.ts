import { describe, it, expect } from 'vitest';
import { createCore, MemoryAdapter, registerWorkoutEngine } from '../src/index';
import { computeProgress, registerProgressEngine } from '../src/engines/progress';
import { forecastGoal, computeGoals, registerGoalEngine, latestGoals } from '../src/engines/goal';
import { analyzeRun, registerRunningEngine, latestRun } from '../src/engines/running';
import type { WorkoutAnalysis } from '../src/engines/workout';

const DAY = 86400000;
const NOW = 1_800_000_000_000;

function analysisWith(daysAgo: number, exercise: string, e1: number): WorkoutAnalysis {
  return {
    id: 'a' + daysAgo + exercise, workoutId: null, date: null, ts: NOW - daysAgo * DAY,
    totalVolume: 0, setsDone: 1, setsTotal: 1, completionPct: 100, avgLoadPerSet: 0,
    perMuscle: {}, perGroup: {}, perExercise: { [exercise]: { e1rm: e1, bestWeight: e1, volume: 100, avgRpe: null } }, avgRpe: null,
  };
}

describe('computeProgress', () => {
  it('rosnące e1RM → progres z dodatnim trendem kg/tydz.', () => {
    const analyses = [
      analysisWith(21, 'Wyciskanie', 90),
      analysisWith(14, 'Wyciskanie', 92),
      analysisWith(7, 'Wyciskanie', 94),
      analysisWith(0, 'Wyciskanie', 96),
    ];
    const r = computeProgress(analyses, NOW);
    const p = r.perExercise[0]!;
    expect(p.trendPerWeek).toBeCloseTo(2, 0);   // +2 kg/tydz.
    expect(p.status).toBe('szybki');            // 2/96 ≈ 2.1%/tydz. > 1.5%
    expect(p.currentE1rm).toBe(96);
    expect(r.progressingPct).toBe(100);
  });

  it('płaskie e1RM przy ≥4 punktach → plateau', () => {
    const analyses = [28, 21, 14, 7].map((d) => analysisWith(d, 'Przysiad', 100));
    const r = computeProgress(analyses, NOW);
    expect(r.perExercise[0]!.status).toBe('plateau');
  });

  it('spadające e1RM → regres', () => {
    const analyses = [analysisWith(14, 'OHP', 60), analysisWith(7, 'OHP', 57), analysisWith(0, 'OHP', 54)];
    const r = computeProgress(analyses, NOW);
    expect(r.perExercise[0]!.status).toBe('regres');
  });

  it('absurdalny skok → nierealny', () => {
    const analyses = [analysisWith(7, 'Martwy', 100), analysisWith(0, 'Martwy', 140)];
    const r = computeProgress(analyses, NOW);
    expect(r.perExercise[0]!.status).toBe('nierealny');
  });

  it('jeden punkt → za mało danych; nie wpływa na progressingPct', () => {
    const r = computeProgress([analysisWith(0, 'Wiosło', 80)], NOW);
    expect(r.perExercise[0]!.status).toBe('za-malo-danych');
    expect(r.progressingPct).toBe(0);
  });
});

describe('forecastGoal / computeGoals', () => {
  it('cel osiągnięty → 100%, ETA teraz', () => {
    const f = forecastGoal({ id: 1, title: 'Bench 100', target: 100 }, 105, 2, NOW);
    expect(f.probabilityPct).toBe(100);
    expect(f.progressPct).toBe(100);
    expect(f.etaTs).toBe(NOW);
  });

  it('dodatni trend → ETA i szansa wg horyzontu (spec: Bench 92.5→100)', () => {
    const f = forecastGoal({ id: 1, title: 'Bench 100', target: 100 }, 92.5, 2, NOW);
    // (100-92.5)/2 = 3.75 tyg. → wysoka szansa
    expect(f.probabilityPct).toBe(92);
    expect(f.etaTs).toBeGreaterThan(NOW);
    const weeks = (f.etaTs! - NOW) / (7 * DAY);
    expect(weeks).toBeCloseTo(3.75, 1);
  });

  it('brak trendu → niska szansa, brak ETA', () => {
    const f = forecastGoal({ id: 1, title: 'X', target: 100 }, 80, 0, NOW);
    expect(f.probabilityPct).toBe(15);
    expect(f.etaTs).toBeNull();
  });

  it('computeGoals łączy cel z trendem ćwiczenia z Progress', () => {
    const progress = {
      ts: NOW, progressingPct: 100,
      perExercise: [{ exercise: 'Wyciskanie', points: 4, currentE1rm: 92.5, trendPerWeek: 2, status: 'progres' as const }],
    };
    const r = computeGoals([{ id: 9, title: 'Bench 100', exercise: 'Wyciskanie', target: 100 }], progress, NOW);
    expect(r.forecasts[0]!.current).toBe(92.5);
    expect(r.forecasts[0]!.probabilityPct).toBe(92);
  });
});

describe('analyzeRun', () => {
  it('liczy tempo i kroczący kilometraż', () => {
    const history = [
      { id: 'r1', ts: NOW - 2 * DAY, km: 5, durationMin: 25 },
      { id: 'r2', ts: NOW - 10 * DAY, km: 8, durationMin: 45 },
      { id: 'r3', ts: NOW - 20 * DAY, km: 8, durationMin: 45 },
    ];
    const a = analyzeRun({ km: 10, durationMin: 50 }, history, NOW);
    expect(a.paceSecPerKm).toBe(300);              // 5:00/km
    expect(a.weeklyKm).toBe(15);                   // 10 + 5 (2 dni temu)
    expect(a.chronicWeeklyKm).toBe(7.8);           // 31/4
    expect(a.rampRatio).toBeGreaterThan(1.5);      // skok kilometrażu
    expect(a.riskPct).toBeGreaterThanOrEqual(90);
  });

  it('pierwszy bieg (brak historii) → ratio 4 z definicji okna, ale km się zgadzają', () => {
    const a = analyzeRun({ km: 5, durationMin: 30 }, [], NOW);
    expect(a.weeklyKm).toBe(5);
    expect(a.chronicWeeklyKm).toBe(1.3);
  });
});

describe('pełny łańcuch: WorkoutFinished → … → GoalsForecasted', () => {
  it('cztery silniki spinają się wyłącznie zdarzeniami', () => {
    const core = createCore(new MemoryAdapter());
    registerWorkoutEngine(core, () => ['piersiowy_srodkowy']);
    registerProgressEngine(core);
    registerGoalEngine(core, () => [{ id: 1, title: 'Bench 100', exercise: 'Wyciskanie', target: 100 }]);

    // dwie sesje, rosnący ciężar
    core.bus.publish('WorkoutFinished', { exercises: [{ name: 'Wyciskanie', setsData: [{ reps: 5, weight: 80, done: true }] }] }, 'user');
    core.bus.publish('WorkoutFinished', { exercises: [{ name: 'Wyciskanie', setsData: [{ reps: 5, weight: 85, done: true }] }] }, 'user');

    const goals = latestGoals(core);
    expect(goals).not.toBeNull();
    expect(goals!.forecasts[0]!.title).toBe('Bench 100');
    expect(goals!.forecasts[0]!.current).toBeGreaterThan(90); // e1RM z 85×5 ≈ 99.2
    const types = core.bus.since(0).map((e) => e.type);
    expect(types).toContain('ProgressUpdated');
    expect(types).toContain('GoalsForecasted');
  });

  it('RunFinished → RunAnalyzed + score ramp-risk', () => {
    const core = createCore(new MemoryAdapter());
    registerRunningEngine(core);
    core.bus.publish('RunFinished', { distance: 5, duration: 30, avgHr: 150 }, 'user');
    expect(latestRun(core)!.paceSecPerKm).toBe(360);
    expect(core.scores.latest('running-engine', 'ramp-risk')).not.toBeNull();
  });
});
