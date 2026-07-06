import { describe, it, expect } from 'vitest';
import { createCore, MemoryAdapter } from '../src/index';
import { UserStore, registerUserStore } from '../src/data/user';
import { analyzeWorkout, type MuscleResolver } from '../src/engines/workout';

const resolve: MuscleResolver = () => ['piersiowy_srodkowy'];

describe('UserStore (TOM II — historia masy)', () => {
  it('aktualna masa = ostatni wpis historii', () => {
    const core = createCore(new MemoryAdapter());
    const u = new UserStore(core);
    u.logWeight(85, 1000);
    u.logWeight(83, 2000);
    u.logWeight(82, 3000);
    expect(u.currentWeight()).toBe(82);
    expect(u.weightHistory().map((r) => r.weight)).toEqual([85, 83, 82]);
  });

  it('edycja błędnego wpisu zachowuje wersjonowanie (stary superseded, historia nieusuwalna)', () => {
    const core = createCore(new MemoryAdapter());
    const u = new UserStore(core);
    const bad = u.logWeight(180, 1000);   // literówka
    u.editWeight(bad.id, 80);
    expect(u.currentWeight()).toBe(80);
    expect(u.weightHistory()).toHaveLength(1);          // widoczny tylko poprawiony
    expect(core.storage.count('weight_history')).toBe(2); // ale oba rekordy istnieją
  });

  it('WeightUpdated na busie dopisuje pomiar', () => {
    const core = createCore(new MemoryAdapter());
    const u = registerUserStore(core);
    core.bus.publish('WeightUpdated', { weight: 79.5, measuredAt: 5000 }, 'user');
    expect(u.currentWeight()).toBe(79.5);
  });

  it('profil: update i ensureUser (pojedynczy użytkownik)', () => {
    const core = createCore(new MemoryAdapter());
    const u = new UserStore(core);
    u.updateProfile({ username: 'Jakub', height: 180, sex: 'male' });
    expect(u.ensureUser().username).toBe('Jakub');
    expect(core.storage.count('users')).toBe(1);
  });
});

describe('Workout Engine — RPE (intensywność)', () => {
  it('liczy średnie RPE sesji i per ćwiczenie', () => {
    const a = analyzeWorkout({
      exercises: [
        { name: 'Wyciskanie', setsData: [
          { reps: 5, weight: 100, done: true, rpe: 8 },
          { reps: 5, weight: 100, done: true, rpe: 9 },
        ]},
      ],
    }, resolve);
    expect(a.avgRpe).toBe(8.5);
    expect(a.perExercise['Wyciskanie']!.avgRpe).toBe(8.5);
  });

  it('brak RPE → null (nie zeruje)', () => {
    const a = analyzeWorkout({ exercises: [{ name: 'X', setsData: [{ reps: 5, weight: 50, done: true }] }] }, resolve);
    expect(a.avgRpe).toBeNull();
  });
});
