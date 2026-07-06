import { describe, it, expect } from 'vitest';
import { createCore, MemoryAdapter, VersionedRepo, migrateLegacy, DECISION_HIERARCHY } from '../src/index';
import { EventBus } from '../src/events/bus';

describe('EventBus (ADR-003)', () => {
  it('publikuje, utrwala i powiadamia subskrybentów', () => {
    const st = new MemoryAdapter();
    const bus = new EventBus(st);
    const got: string[] = [];
    bus.on('WorkoutFinished', (e) => got.push(e.type));
    bus.publish('WorkoutFinished', { volume: 5000 }, 'user');
    expect(got).toEqual(['WorkoutFinished']);
    expect(bus.countAll()).toBe(1);
    expect(bus.since(0, 'WorkoutFinished')).toHaveLength(1);
  });

  it('błąd jednego handlera nie blokuje pozostałych ani zapisu', () => {
    const st = new MemoryAdapter();
    const bus = new EventBus(st);
    const got: string[] = [];
    bus.on('X', () => { throw new Error('boom'); });
    bus.on('X', () => got.push('ok'));
    bus.publish('X', {});
    expect(got).toEqual(['ok']);
    expect(bus.countAll()).toBe(1);
  });

  it('silnik dodany później może odtworzyć historię (since)', () => {
    const st = new MemoryAdapter();
    const bus = new EventBus(st);
    bus.publish('RunFinished', { km: 5 });
    bus.publish('RunFinished', { km: 8 });
    // "nowy silnik" dogrywa się po fakcie:
    const seen = bus.since(0, 'RunFinished').map((e) => (e.payload as { km: number }).km);
    expect(seen).toEqual([5, 8]);
  });
});

describe('VersionedRepo (ADR-004)', () => {
  it('update tworzy nową wersję, historia zostaje (v1→v2→v3)', () => {
    const st = new MemoryAdapter();
    const repo = new VersionedRepo<{ name: string }>(st, 'plans');
    const head = repo.create({ name: 'Plan A' }, { changedBy: 'user', reason: 'nowy plan' });
    repo.update(head.id, { name: 'Plan A v2' }, { changedBy: 'ai-coach', reason: 'deload', confidence: 0.85 });
    repo.update(head.id, { name: 'Plan A v3' }, { changedBy: 'trainer', reason: 'korekta trenera' });

    expect(repo.get(head.id)).toEqual({ name: 'Plan A v3' });
    const hist = repo.history(head.id);
    expect(hist.map((v) => v.version)).toEqual([1, 2, 3]);
    expect(hist[1]!.changedBy).toBe('ai-coach');
    expect(hist[1]!.confidence).toBe(0.85);
    expect(hist[0]!.data.name).toBe('Plan A'); // v1 nietknięte
  });

  it('soft-delete ukrywa encję, ale nie kasuje historii', () => {
    const st = new MemoryAdapter();
    const repo = new VersionedRepo<{ n: number }>(st, 'goals');
    const head = repo.create({ n: 1 }, { changedBy: 'user', reason: 'cel' });
    repo.softDelete(head.id);
    expect(repo.listHeads()).toHaveLength(0);
    expect(repo.listHeads(true)).toHaveLength(1);
    expect(repo.history(head.id)).toHaveLength(1);
  });
});

describe('Migrator et_v1 (ADR-001)', () => {
  const legacy = JSON.stringify({
    workouts: [{ id: 111, date: '2026-07-01', volume: 4000 }],
    runs: [{ id: 222, date: '2026-07-02', distance: 5 }],
    measurements: [{ id: 333, date: '2026-07-03', weight: 82 }],
    customPlans: [{ id: 444, name: 'Masa 4d' }],
    goals: [{ id: 555, title: 'Bench 100' }],
  });

  it('migruje wszystkie warstwy i zachowuje legacyId', () => {
    const st = new MemoryAdapter();
    const rep = migrateLegacy(st, legacy);
    expect(rep).toMatchObject({ ran: true, workouts: 1, runs: 1, measurements: 1, plans: 1, goals: 1 });
    const w = st.getAll<{ id: string; legacyId: number }>('workouts')[0]!;
    expect(w.legacyId).toBe(111);
    expect(typeof w.id).toBe('string'); // UUID
    // plan trafił jako encja wersjonowana v1
    const plans = new VersionedRepo<{ name: string }>(st, 'plans');
    const heads = plans.listHeads();
    expect(heads).toHaveLength(1);
    expect(plans.history(heads[0]!.id)[0]!.reason).toBe('migracja et_v1');
  });

  it('jest idempotentny (druga migracja = no-op)', () => {
    const st = new MemoryAdapter();
    migrateLegacy(st, legacy);
    const second = migrateLegacy(st, legacy);
    expect(second.ran).toBe(false);
    expect(st.count('workouts')).toBe(1);
  });

  it('radzi sobie z brakiem/uszkodzeniem legacy', () => {
    const st = new MemoryAdapter();
    expect(migrateLegacy(st, null).ran).toBe(true);
    const st2 = new MemoryAdapter();
    expect(migrateLegacy(st2, '{nie-json').ran).toBe(true);
  });
});

describe('createCore + Registry + Scores (ADR-005/006)', () => {
  it('rejestruje silnik i auto-subskrybuje zdarzenia z manifestu', () => {
    const core = createCore(new MemoryAdapter());
    const got: unknown[] = [];
    core.registry.register(
      { id: 'demo-engine', version: '1.0.0', listensTo: ['WeightUpdated'], emits: [], dependsOn: [] },
      { WeightUpdated: (e) => got.push(e) },
    );
    core.bus.publish('WeightUpdated', { kg: 82 }, 'user');
    expect(got).toHaveLength(1);
    expect(core.registry.has('demo-engine')).toBe(true);
    expect(() => core.registry.register({ id: 'demo-engine', version: '1', listensTo: [], emits: [], dependsOn: [] })).toThrow();
  });

  it('Scores: zapis, clamp 0-100, odczyt najnowszego', () => {
    const core = createCore(new MemoryAdapter());
    core.scores.put('recovery-engine', 'readiness', 83.4, 0.9);
    core.scores.put('recovery-engine', 'readiness', 141, 0.9); // clamp → 100
    const s = core.scores.latest('recovery-engine', 'readiness');
    expect(s!.value).toBe(100);
  });

  it('hierarchia decyzji: Trener > User > AI Coach > Rule', () => {
    expect(DECISION_HIERARCHY.trainer).toBeGreaterThan(DECISION_HIERARCHY.user);
    expect(DECISION_HIERARCHY.user).toBeGreaterThan(DECISION_HIERARCHY['ai-coach']);
    expect(DECISION_HIERARCHY['ai-coach']).toBeGreaterThan(DECISION_HIERARCHY.rule);
  });
});
