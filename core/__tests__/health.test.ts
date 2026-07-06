import { describe, it, expect } from 'vitest';
import { createCore, MemoryAdapter, registerRunningEngine } from '../src/index';
import { syncRunningWorkouts, type HealthProvider, type HealthWorkout, type ImportedRun } from '../src/integrations/health';

function fakeProvider(workouts: HealthWorkout[], opts: { available?: boolean; auth?: boolean } = {}): HealthProvider {
  return {
    isAvailable: async () => opts.available ?? true,
    requestAuth: async () => opts.auth ?? true,
    getRunningWorkouts: async (since) => workouts.filter((w) => w.startTs > since),
  };
}

describe('syncRunningWorkouts (import biegów z Health)', () => {
  it('importuje biegi, publikuje RunFinished, wywołuje onRun', async () => {
    const core = createCore(new MemoryAdapter());
    registerRunningEngine(core);
    const added: ImportedRun[] = [];
    const provider = fakeProvider([
      { externalId: 'A', startTs: 1000, distanceKm: 5, durationMin: 25, avgHr: 150 },
      { externalId: 'B', startTs: 2000, distanceKm: 8, durationMin: 44 },
    ]);
    const res = await syncRunningWorkouts(core, provider, (r) => added.push(r));
    expect(res).toMatchObject({ available: true, authorized: true, imported: 2, skipped: 0 });
    expect(added.map((r) => r.distance)).toEqual([5, 8]);
    expect(core.bus.since(0, 'RunFinished')).toHaveLength(2);
    expect(core.bus.since(0, 'RunAnalyzed')).toHaveLength(2); // Running Engine zadziałał
  });

  it('dedup: druga synchronizacja pomija znane biegi', async () => {
    const core = createCore(new MemoryAdapter());
    const provider = fakeProvider([{ externalId: 'A', startTs: 1000, distanceKm: 5, durationMin: 25 }]);
    await syncRunningWorkouts(core, provider);
    const res2 = await syncRunningWorkouts(core, provider);        // kursor > 1000 → 0 nowych
    expect(res2.imported).toBe(0);
  });

  it('inkrementalnie: po kursorze bierze tylko nowsze', async () => {
    const core = createCore(new MemoryAdapter());
    const provider = fakeProvider([{ externalId: 'A', startTs: 1000, distanceKm: 5, durationMin: 25 }]);
    await syncRunningWorkouts(core, provider);
    // nowy bieg później
    const provider2 = fakeProvider([
      { externalId: 'A', startTs: 1000, distanceKm: 5, durationMin: 25 },
      { externalId: 'B', startTs: 5000, distanceKm: 10, durationMin: 50 },
    ]);
    const res = await syncRunningWorkouts(core, provider2);
    expect(res.imported).toBe(1);
    expect(res.lastTs).toBe(5000);
  });

  it('niedostępny provider → available:false, 0 importów', async () => {
    const core = createCore(new MemoryAdapter());
    const res = await syncRunningWorkouts(core, fakeProvider([], { available: false }));
    expect(res).toMatchObject({ available: false, imported: 0 });
  });

  it('brak zgody → authorized:false', async () => {
    const core = createCore(new MemoryAdapter());
    const res = await syncRunningWorkouts(core, fakeProvider([{ externalId: 'A', startTs: 1, distanceKm: 5 }], { auth: false }));
    expect(res).toMatchObject({ available: true, authorized: false, imported: 0 });
  });
});
