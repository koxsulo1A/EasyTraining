import { describe, it, expect } from 'vitest';
import { createCore, MemoryAdapter, registerWorkoutEngine } from '../src/index';
import { computeFatigue, registerFatigueEngine, latestFatigue } from '../src/engines/fatigue';
import { computeRecovery, registerRecoveryEngine, latestRecovery } from '../src/engines/recovery';
import type { WorkoutAnalysis } from '../src/engines/workout';

const DAY = 86400000;
const NOW = 1_800_000_000_000;

function analysis(daysAgo: number, perGroup: Record<string, number>): WorkoutAnalysis {
  return {
    id: 'a' + daysAgo, workoutId: null, date: null, ts: NOW - daysAgo * DAY,
    totalVolume: Object.values(perGroup).reduce((a, b) => a + b, 0),
    setsDone: 1, setsTotal: 1, completionPct: 100, avgLoadPerSet: 0,
    perMuscle: {}, perGroup, perExercise: {}, avgRpe: null,
  };
}

function analysisRpe(daysAgo: number, perGroup: Record<string, number>, rpe: number): WorkoutAnalysis {
  return { ...analysis(daysAgo, perGroup), avgRpe: rpe };
}

describe('computeFatigue (czysta funkcja)', () => {
  it('acute=chronic (stabilne obciążenie) → ~50% zmęczenia, ratio 1.0', () => {
    // 4 tygodnie × 1000 kg na klatkę, równo rozłożone
    const analyses = [3, 10, 17, 24].map((d) => analysis(d, { klatka_piersiowa: 1000 }));
    const f = computeFatigue(analyses, NOW);
    const g = f.perGroup['klatka_piersiowa']!;
    expect(g.acute).toBe(1000);
    expect(g.chronic).toBe(1000);   // 4000/4
    expect(g.ratio).toBe(1);
    expect(g.fatiguePct).toBe(50);
    expect(f.level).toBe('srednie');
  });

  it('skok obciążenia w ostatnim tygodniu → wysokie zmęczenie', () => {
    const analyses = [
      analysis(2, { nogi: 3000 }),       // duży tydzień
      analysis(10, { nogi: 800 }), analysis(17, { nogi: 800 }), analysis(24, { nogi: 800 }),
    ];
    const f = computeFatigue(analyses, NOW);
    const g = f.perGroup['nogi']!;
    expect(g.ratio).toBeGreaterThan(2);
    expect(g.fatiguePct).toBe(100);
    expect(f.level).toBe('duze');
  });

  it('brak treningów w 7 dni → niskie zmęczenie', () => {
    const analyses = [analysis(10, { plecy: 1000 }), analysis(20, { plecy: 1000 })];
    const f = computeFatigue(analyses, NOW);
    expect(f.perGroup['plecy']!.acute).toBe(0);
    expect(f.perGroup['plecy']!.fatiguePct).toBe(0);
    expect(f.level).toBe('niskie');
  });

  it('ignoruje analizy starsze niż 28 dni', () => {
    const f = computeFatigue([analysis(40, { biceps: 9999 })], NOW);
    expect(Object.keys(f.perGroup)).toHaveLength(0);
    expect(f.overallPct).toBe(0);
  });

  it('RPE moduluje zmęczenie: ciężka sesja (RPE 10) męczy bardziej niż lekka (RPE 4)', () => {
    const hard = computeFatigue([2, 9, 16, 23].map((d) => analysisRpe(d, { nogi: 1000 }, 10)), NOW);
    const easy = computeFatigue([2, 9, 16, 23].map((d) => analysisRpe(d, { nogi: 1000 }, 4)), NOW);
    // ratio (acute/chronic) jest takie samo — RPE skaluje obie strony równo,
    // ale bezwzględne acute jest wyższe przy RPE 10 (×1.4 vs ×0.7).
    expect(hard.perGroup['nogi']!.acute).toBeGreaterThan(easy.perGroup['nogi']!.acute);
    expect(hard.perGroup['nogi']!.acute).toBeCloseTo(1400, 0);
    expect(easy.perGroup['nogi']!.acute).toBeCloseTo(700, 0);
  });
});

describe('computeRecovery (czysta funkcja)', () => {
  it('pełny sen i dobre samopoczucie → wysoka gotowość', () => {
    const r = computeRecovery(
      [{ id: 's1', ts: NOW - DAY, durationH: 8, quality: 9 }],
      [{ id: 'w1', ts: NOW - DAY, energy: 9, stress: 2, mood: 8, motivation: 9 }],
      NOW,
    );
    expect(r.readinessPct).toBeGreaterThanOrEqual(85);
    expect(r.components.stress).toBe(0.8);   // odwrócony: (10-2)/10
  });

  it('mało snu i wysoki stres → niska gotowość', () => {
    const r = computeRecovery(
      [{ id: 's1', ts: NOW - DAY, durationH: 4, quality: 3 }],
      [{ id: 'w1', ts: NOW - DAY, energy: 3, stress: 9, mood: 4, motivation: 3 }],
      NOW,
    );
    expect(r.readinessPct).toBeLessThan(45);
  });

  it('brakujące składowe są pomijane, nie zerują wyniku', () => {
    const r = computeRecovery([{ id: 's1', ts: NOW, durationH: 8 }], [], NOW);
    expect(r.components.sleep).toBe(1);
    expect(r.components.energy).toBeUndefined();
    expect(r.readinessPct).toBe(100);
  });

  it('próbki starsze niż 7 dni poza oknem', () => {
    const r = computeRecovery([{ id: 's1', ts: NOW - 8 * DAY, durationH: 8 }], [], NOW);
    expect(r.samples.sleep).toBe(0);
    expect(r.readinessPct).toBe(0);
  });
});

describe('łańcuch zdarzeń: WorkoutFinished → Analyzed → FatigueUpdated (Dependency przez bus)', () => {
  it('trening przelicza zmęczenie bez żadnych bezpośrednich wywołań między silnikami', () => {
    const core = createCore(new MemoryAdapter());
    registerWorkoutEngine(core, () => ['czworoglowy']);
    registerFatigueEngine(core);

    const chain: string[] = [];
    core.bus.onAny((e) => chain.push(e.type));

    core.bus.publish('WorkoutFinished', {
      exercises: [{ name: 'X', setsData: [{ reps: 10, weight: 100, done: true }] }],
    }, 'user');

    // dispatch jest synchroniczny (depth-first) — sprawdzamy komplet, nie kolejność powiadomień
    expect(chain.sort()).toEqual(['FatigueUpdated', 'WorkoutAnalyzed', 'WorkoutFinished']);
    expect(latestFatigue(core)).not.toBeNull();
    expect(core.scores.latest('fatigue-engine', 'overall')).not.toBeNull();
  });

  it('SleepLogged → RecoveryUpdated + Score readiness', () => {
    const core = createCore(new MemoryAdapter());
    registerRecoveryEngine(core);
    core.bus.publish('SleepLogged', { duration: 7.5, quality: 8 }, 'user');
    const snap = latestRecovery(core);
    expect(snap!.readinessPct).toBeGreaterThan(80);
    expect(core.scores.latest('recovery-engine', 'readiness')!.value).toBe(snap!.readinessPct);
  });
});
