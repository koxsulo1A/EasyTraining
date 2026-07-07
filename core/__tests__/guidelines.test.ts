import { describe, it, expect } from 'vitest';
import {
  INTENSITY_ZONES, LEVEL_PROFILES, WEEKLY_VOLUME,
  PCT_1RM_REPS, suggestLoad, maxRepsAtPct,
  exerciseOrderScore, validateExerciseOrder, prescribe,
} from '../src/knowledge/guidelines';

describe('Strefy intensywności (Ratamess 2009)', () => {
  it('siła: 1-6 powt. @ 85-100% 1RM, długie przerwy', () => {
    const z = INTENSITY_ZONES.strength;
    expect(z.repsMax).toBe(6);
    expect(z.pct1RMMin).toBe(85);
    expect(z.restSecMin).toBeGreaterThanOrEqual(120);
  });

  it('moc: 30-60% 1RM i NIGDY do upadku', () => {
    const z = INTENSITY_ZONES.power;
    expect(z.pct1RMMax).toBe(60);
    expect(z.toFailure).toBe(false);
  });

  it('każda strefa ma źródło', () => {
    Object.values(INTENSITY_ZONES).forEach((z) => expect(z.source.length).toBeGreaterThan(5));
  });
});

describe('Profile poziomów (Ratamess 2009)', () => {
  it('novice: 2-3 dni full-body, bez wymaganej periodyzacji', () => {
    const p = LEVEL_PROFILES.novice;
    expect(p.freqPerWeekMax).toBe(3);
    expect(p.structure).toBe('full-body');
    expect(p.periodizationRequired).toBe(false);
  });

  it('advanced: 4-6 dni, split, periodyzacja obowiązkowa', () => {
    const p = LEVEL_PROFILES.advanced;
    expect(p.freqPerWeekMin).toBe(4);
    expect(p.periodizationRequired).toBe(true);
  });
});

describe('Tabela %1RM ↔ powtórzenia (NSCA)', () => {
  it('kotwice: 100%=1, 85%=6, 75%=10, 67%=12', () => {
    const map = new Map(PCT_1RM_REPS.map((x) => [x[0], x[1]]));
    expect(map.get(100)).toBe(1);
    expect(map.get(85)).toBe(6);
    expect(map.get(75)).toBe(10);
    expect(map.get(67)).toBe(12);
  });

  it('suggestLoad: 1RM=100, 8 powt., RIR 0 → 80 kg', () => {
    expect(suggestLoad(100, 8)).toBe(80);
  });

  it('suggestLoad z RIR 2: 1RM=100, 8 powt. → ciężar na 10 powt. = 75 kg', () => {
    expect(suggestLoad(100, 8, 2)).toBe(75);
  });

  it('suggestLoad zaokrągla do 2.5 kg', () => {
    const kg = suggestLoad(137, 5, 1);
    expect(kg! % 2.5).toBe(0);
  });

  it('suggestLoad: brak 1RM → null', () => {
    expect(suggestLoad(0, 8)).toBeNull();
  });

  it('maxRepsAtPct: 85% → 6 powt.', () => {
    expect(maxRepsAtPct(85)).toBe(6);
  });
});

describe('Kolejność ćwiczeń (Ratamess/NSCA)', () => {
  it('moc < wielostawowe < izolowane < core', () => {
    expect(exerciseOrderScore({ isPower: true })).toBeLessThan(exerciseOrderScore({ isCompound: true }));
    expect(exerciseOrderScore({ isCompound: true })).toBeLessThan(exerciseOrderScore({}));
    expect(exerciseOrderScore({})).toBeLessThan(exerciseOrderScore({ isCore: true }));
  });

  it('wykrywa izolowane przed wielostawowym', () => {
    const v = validateExerciseOrder([
      {},                        // izolowane (biceps)
      { isCompound: true },      // przysiad — za późno!
    ]);
    expect(v.length).toBe(1);
    expect(v[0]).toMatchObject({ earlierIndex: 0, laterIndex: 1 });
  });

  it('poprawna kolejność → brak naruszeń', () => {
    const v = validateExerciseOrder([
      { isPower: true }, { isCompound: true }, {}, { isCore: true },
    ]);
    expect(v).toHaveLength(0);
  });
});

describe('prescribe — dobór parametrów wg wytycznych', () => {
  it('hipertrofia + novice: 6-12 powt., RIR podniesiony o 1 (bezpieczeństwo)', () => {
    const p = prescribe('hypertrophy', 'novice');
    expect(p.repsMin).toBe(6);
    expect(p.repsMax).toBe(12);
    expect(p.rir).toBe(2); // baza 1 + novice 1
    expect(p.structure).toBe('full-body');
  });

  it('siła + advanced: ciężkie %1RM, długa przerwa, split', () => {
    const p = prescribe('strength', 'advanced');
    expect(p.pct1RMMin).toBeGreaterThanOrEqual(85);
    expect(p.restSec).toBeGreaterThanOrEqual(120);
    expect(p.structure).toBe('split');
  });

  it('moc: %1RM 30-60 niezależnie od poziomu (strefa wygrywa)', () => {
    const p = prescribe('power', 'advanced');
    expect(p.pct1RMMax).toBeLessThanOrEqual(60);
    expect(p.rir).toBeGreaterThanOrEqual(3); // nie do upadku
  });

  it('zawsze podaje źródła', () => {
    const p = prescribe('endurance', 'intermediate');
    expect(p.sources.length).toBeGreaterThanOrEqual(2);
  });

  it('objętość tygodniowa: 10-20 serii/grupę', () => {
    expect(WEEKLY_VOLUME.setsPerMuscleMin).toBe(10);
    expect(WEEKLY_VOLUME.setsPerMuscleMax).toBe(20);
  });
});
