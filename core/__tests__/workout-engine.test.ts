import { describe, it, expect } from 'vitest';
import { createCore, MemoryAdapter } from '../src/index';
import { analyzeWorkout, registerWorkoutEngine, latestAnalysis, type MuscleResolver } from '../src/engines/workout';
import { engagementFromMuscles } from '../src/knowledge/muscles';

const resolve: MuscleResolver = (name) => {
  if (name === 'Wyciskanie') return ['piersiowy_srodkowy', 'trojglowy_boczna_glowa'];
  if (name === 'Przysiad') return ['czworoglowy', 'posladkowy_wielki'];
  return [];
};

describe('engagementFromMuscles', () => {
  it('jeden mięsień = 100%', () => {
    expect(engagementFromMuscles(['czworoglowy'])).toEqual({ czworoglowy: 100 });
  });
  it('główny 65%, reszta dzieli 35%', () => {
    const e = engagementFromMuscles(['a', 'b', 'c']);
    expect(e['a']).toBe(65);
    expect(e['b']).toBe(17.5);
    expect(e['c']).toBe(17.5);
  });
  it('puste wejście = pusty rozkład', () => {
    expect(engagementFromMuscles([])).toEqual({});
  });
});

describe('analyzeWorkout (czysta funkcja)', () => {
  const session = {
    id: 7, date: '2026-07-04',
    exercises: [
      { name: 'Wyciskanie', setsData: [
        { reps: 5, weight: 100, done: true },   // 500 kg
        { reps: 5, weight: 100, done: true },   // 500 kg
        { reps: 5, weight: 100, done: false },  // pominięta
      ]},
      { name: 'Przysiad', setsData: [
        { reps: 10, weight: 80, done: true },   // 800 kg
      ]},
    ],
  };

  it('liczy objętość, serie i completion', () => {
    const a = analyzeWorkout(session, resolve);
    expect(a.totalVolume).toBe(1800);
    expect(a.setsDone).toBe(2 + 1);
    expect(a.setsTotal).toBe(4);
    expect(a.completionPct).toBe(75);
    expect(a.avgLoadPerSet).toBe(600);
  });

  it('rozdziela objętość na mięśnie wg zaangażowania (65/35)', () => {
    const a = analyzeWorkout(session, resolve);
    // Wyciskanie 1000 kg: klatka śr. 65% = 650, triceps 35% = 350
    expect(a.perMuscle['piersiowy_srodkowy']).toBe(650);
    expect(a.perMuscle['trojglowy_boczna_glowa']).toBe(350);
    // Przysiad 800 kg: czworogłowy 520, pośladkowy 280
    expect(a.perMuscle['czworoglowy']).toBe(520);
    expect(a.perMuscle['posladkowy_wielki']).toBe(280);
  });

  it('agreguje per partia (grupy z Knowledge Base)', () => {
    const a = analyzeWorkout(session, resolve);
    expect(a.perGroup['klatka_piersiowa']).toBe(650);
    expect(a.perGroup['triceps']).toBe(350);
    expect(a.perGroup['nogi']).toBe(800); // 520 + 280
  });

  it('nieznane ćwiczenie nie psuje analizy (objętość liczona, mięśnie pomijane)', () => {
    const a = analyzeWorkout({ exercises: [{ name: 'Xyz', setsData: [{ reps: 10, weight: 50, done: true }] }] }, resolve);
    expect(a.totalVolume).toBe(500);
    expect(Object.keys(a.perMuscle)).toHaveLength(0);
  });
});

describe('registerWorkoutEngine (pełny plaster: event → analiza → score → event)', () => {
  it('reaguje na WorkoutFinished i zapisuje wyniki', () => {
    const core = createCore(new MemoryAdapter());
    registerWorkoutEngine(core, resolve);

    const analyzed: unknown[] = [];
    core.bus.on('WorkoutAnalyzed', (e) => analyzed.push(e.payload));

    core.bus.publish('WorkoutFinished', {
      id: 1, date: '2026-07-04',
      exercises: [{ name: 'Przysiad', setsData: [{ reps: 8, weight: 100, done: true }] }],
    }, 'user');

    const a = latestAnalysis(core);
    expect(a).not.toBeNull();
    expect(a!.totalVolume).toBe(800);
    expect(analyzed).toHaveLength(1);
    const score = core.scores.latest('workout-engine', 'session-completion');
    expect(score!.value).toBe(100);
    expect(core.registry.has('workout-engine')).toBe(true);
  });
});
