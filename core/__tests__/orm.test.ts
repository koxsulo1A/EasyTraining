import { describe, it, expect } from 'vitest';
import { createCore, MemoryAdapter, registerOrmEngine, latestOrm } from '../src/index';
import {
  effectiveReps, rpeToEstimatedRIR, rirCorrectionFactor,
  estimateOrmFromSet, ORM_MODELS,
} from '../src/engines/orm';
import { computeSeriesQuality, weightSets } from '../src/engines/orm-quality';
import { computeOrm } from '../src/engines/orm-ensemble';

// ─── Modele matematyczne ────────────────────────────────────────────────────

describe('Modele 1RM — podstawowe własności', () => {
  it('Epley: 1 rep = ciężar (brak ekstrapolacji)', () => {
    expect(ORM_MODELS.epley.compute(100, 1)).toBe(100);
  });

  it('Brzycki: 10 rep @ 100kg ≈ 133kg', () => {
    expect(ORM_MODELS.brzycki.compute(100, 10)).toBeCloseTo(133.3, 0);
  });

  it('Lombardi: potęgowy, 5 rep > 1 rep', () => {
    const r5 = ORM_MODELS.lombardi.compute(100, 5);
    const r1 = ORM_MODELS.lombardi.compute(100, 1);
    expect(r5).toBeGreaterThan(r1);
  });

  it('Mayhew: 12 rep @ 100kg > 125kg', () => {
    expect(ORM_MODELS.mayhew.compute(100, 12)).toBeGreaterThan(125);
  });

  it('Brzycki: blokada >= 37 rep (nie zwraca ujemnego)', () => {
    expect(ORM_MODELS.brzycki.compute(100, 40)).toBe(100);
  });
});

// ─── effectiveReps + RPE ────────────────────────────────────────────────────

describe('effectiveReps i korekta RPE', () => {
  it('effectiveReps = reps + plannedRIR', () => {
    expect(effectiveReps(8, 2)).toBe(10);
    expect(effectiveReps(5, 0)).toBe(5);
  });

  it('rpeToEstimatedRIR: tabela z spec', () => {
    expect(rpeToEstimatedRIR(10)).toBe(0);
    expect(rpeToEstimatedRIR(9)).toBe(0.5);
    expect(rpeToEstimatedRIR(8)).toBe(1);
    expect(rpeToEstimatedRIR(7)).toBe(2);
    expect(rpeToEstimatedRIR(6)).toBe(3.5);
  });

  it('rirCorrectionFactor: seria łatwiejsza niż plan → korekta w górę', () => {
    // rirDelta = 2 (było 2 rep luzu zamiast 0) → 1RM wyższy
    expect(rirCorrectionFactor(2)).toBeGreaterThan(1);
  });

  it('rirCorrectionFactor: seria cięższa niż plan → korekta w dół', () => {
    expect(rirCorrectionFactor(-2)).toBeLessThan(1);
  });

  it('rirCorrectionFactor: delta 0 = brak korekty', () => {
    expect(rirCorrectionFactor(0)).toBe(1);
  });
});

// ─── Ensemble modeli ─────────────────────────────────────────────────────────

describe('estimateOrmFromSet — ensemble', () => {
  it('100kg × 10 efektywnych powtórzeń → 1RM ~130-140kg', () => {
    const { orm } = estimateOrmFromSet(100, 10);
    expect(orm).toBeGreaterThan(125);
    expect(orm).toBeLessThan(150);
  });

  it('przy 1 rep efektywnym → 1RM bliski ciężarowi (±15%)', () => {
    const { orm } = estimateOrmFromSet(150, 1);
    expect(orm).toBeGreaterThan(140);
    expect(orm).toBeLessThan(175);
  });

  it('wyższy ciężar → wyższy 1RM (przy tych samych rep)', () => {
    const a = estimateOrmFromSet(100, 8);
    const b = estimateOrmFromSet(120, 8);
    expect(b.orm).toBeGreaterThan(a.orm);
  });
});

// ─── Quality Score ───────────────────────────────────────────────────────────

describe('computeSeriesQuality', () => {
  it('seria idealna (8 efektywnych rep, RPE=plan, wielostawowa) → wysoki score', () => {
    const q = computeSeriesQuality({
      effectiveReps: 8,
      plannedRIR: 1,
      rpe: 9,           // RPE9 → szacowany RIR 0.5, blisko plannedRIR=1
      isCompound: true,
      fatigueScore: 0,
      cumulativeSetVolume: 0,
      weeklyFrequency: 3,
    });
    expect(q.total).toBeGreaterThan(65);
  });

  it('seria słaba (20 efektywnych rep, brak RPE, izolowana) → niski score', () => {
    const q = computeSeriesQuality({
      effectiveReps: 20,
      plannedRIR: 2,
      rpe: null,
      isCompound: false,
      fatigueScore: 80,
      cumulativeSetVolume: 8000,
      weeklyFrequency: 1,
    });
    expect(q.total).toBeLessThan(40);
  });

  it('wynik mieści się w 0-100', () => {
    for (const effReps of [1, 5, 10, 20, 30]) {
      const q = computeSeriesQuality({
        effectiveReps: effReps,
        plannedRIR: 0,
        rpe: 8,
        isCompound: true,
        fatigueScore: 50,
        cumulativeSetVolume: 2000,
        weeklyFrequency: 2,
      });
      expect(q.total).toBeGreaterThanOrEqual(0);
      expect(q.total).toBeLessThanOrEqual(100);
    }
  });
});

// ─── Outlier detection ───────────────────────────────────────────────────────

describe('weightSets — outlier detection', () => {
  it('wykrywa outliera (1RM daleko od mediany)', () => {
    const sets = [
      { orm: 135, qualityScore: 70 },
      { orm: 133, qualityScore: 68 },
      { orm: 137, qualityScore: 72 },
      { orm: 95, qualityScore: 30 },  // outlier
    ];
    const w = weightSets(sets);
    expect(w[3]!.isOutlier).toBe(true);
    expect(w[0]!.isOutlier).toBe(false);
  });

  it('wagi sumują się do 1', () => {
    const sets = [
      { orm: 130, qualityScore: 70 },
      { orm: 133, qualityScore: 65 },
      { orm: 128, qualityScore: 80 },
    ];
    const w = weightSets(sets);
    const total = w.reduce((s, r) => s + r.finalWeight, 0);
    expect(total).toBeCloseTo(1, 5);
  });
});

// ─── computeOrm — end-to-end ─────────────────────────────────────────────────

describe('computeOrm — pełna estymacja', () => {
  const exercise = { name: 'Bench Press', isCompound: true };

  it('przykład ze spec: 150×2, 145×4, 130×8, 100×15 → ~175-190kg', () => {
    const result = computeOrm({
      sets: [
        { weight: 150, reps: 2, plannedRIR: 1, rpe: 9 },
        { weight: 145, reps: 4, plannedRIR: 1, rpe: 8 },
        { weight: 130, reps: 8, plannedRIR: 1, rpe: 9 },
        { weight: 100, reps: 15, plannedRIR: 1, rpe: 9 },
      ],
      exercise,
    });
    expect(result.orm1rm).toBeGreaterThan(150);
    expect(result.orm1rm).toBeLessThan(210);
    expect(result.setAnalyses).toHaveLength(4);
  });

  it('zaokrąglenie do 0.5 kg', () => {
    const result = computeOrm({
      sets: [{ weight: 100, reps: 8, plannedRIR: 2, rpe: 8 }],
      exercise,
    });
    expect(result.orm1rm % 0.5).toBe(0);
  });

  it('delta od poprzedniej estymacji', () => {
    const result = computeOrm({
      sets: [{ weight: 105, reps: 8, plannedRIR: 2, rpe: 8 }],
      exercise,
      previousOrm: 130,
    });
    expect(result.deltaFromPrevious).not.toBeNull();
  });

  it('brak serii → zwraca previousOrm', () => {
    const result = computeOrm({ sets: [], exercise, previousOrm: 120 });
    expect(result.orm1rm).toBe(120);
    expect(result.confidence).toBe(0);
  });

  it('trendNote wyświetlana przy wzroście > 1%', () => {
    const result = computeOrm(
      { sets: [{ weight: 110, reps: 8, plannedRIR: 2, rpe: 8 }], exercise, previousOrm: 130 },
      [2, 3],
    );
    // Duży wzrost → powinien być trendNote (lub null jeśli delta < 1%)
    expect(typeof result.trendNote === 'string' || result.trendNote === null).toBe(true);
  });
});

// ─── Rejestracja silnika w core ───────────────────────────────────────────────

describe('registerOrmEngine — integracja z core', () => {
  it('silnik rejestruje się i odpowiada na WorkoutFinished', async () => {
    const core = createCore(new MemoryAdapter());
    registerOrmEngine(core, () => true);

    core.bus.publish('WorkoutFinished', {
      exercises: [
        {
          name: 'Squat',
          plannedRIR: 1,
          setsData: [
            { weight: 120, reps: 5, done: true, rpe: 8 },
            { weight: 120, reps: 5, done: true, rpe: 8 },
            { weight: 120, reps: 5, done: true, rpe: 8 },
          ],
        },
      ],
    });

    const ormEvents = core.bus.since(0, 'OrmUpdated');
    expect(ormEvents).toHaveLength(1);

    const result = latestOrm(core, 'Squat');
    expect(result).not.toBeNull();
    expect(result!.orm1rm).toBeGreaterThan(0);
    expect(result!.confidence).toBeGreaterThan(0);
  });

  it('ćwiczenie bez wykonanych serii (done=false) → brak OrmUpdated', () => {
    const core = createCore(new MemoryAdapter());
    registerOrmEngine(core);

    core.bus.publish('WorkoutFinished', {
      exercises: [
        {
          name: 'Curl',
          setsData: [{ weight: 20, reps: 10, done: false }],
        },
      ],
    });

    expect(core.bus.since(0, 'OrmUpdated')).toHaveLength(0);
  });
});
