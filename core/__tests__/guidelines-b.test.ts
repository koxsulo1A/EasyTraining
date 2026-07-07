import { describe, it, expect } from 'vitest';
import { prescribe } from '../src/knowledge/guidelines';
import {
  POPULATION_RULES, populationForAge, applyPopulation,
  PERIODIZATION_BLOCKS, RESIDUAL_EFFECTS, residualDecayPct,
  HYPERTROPHY_RULES, concurrentTrainingCheck, screen, hrZone,
} from '../src/knowledge/guidelines-b';

describe('Populacje (Faigenbaum 2009, Fragala 2019)', () => {
  it('populationForAge: 15→youth, 30→adult, 70→senior', () => {
    expect(populationForAge(15)).toBe('youth');
    expect(populationForAge(30)).toBe('adult');
    expect(populationForAge(70)).toBe('senior');
  });

  it('młodzież: zakaz prób 1RM, maks. 2 serie, RIR ≥3', () => {
    const r = POPULATION_RULES.youth;
    expect(r.no1RMTests).toBe(true);
    expect(r.setsMax).toBe(2);
    expect(r.rirMinimum).toBe(3);
  });

  it('applyPopulation(youth) obcina receptę siłową do bezpiecznych zakresów', () => {
    const base = prescribe('strength', 'novice'); // 1-6 powt.
    const y = applyPopulation(base, 'youth');
    expect(y.repsMin).toBeGreaterThanOrEqual(8);   // min. 8 powt. (brak maks. ciężarów)
    expect(y.sets).toBeLessThanOrEqual(2);
    expect(y.rir).toBeGreaterThanOrEqual(3);
    expect(y.sources.some((s) => s.includes('Faigenbaum'))).toBe(true);
  });

  it('senior: wolniejsza progresja (≤5%), niekolejne dni', () => {
    const r = POPULATION_RULES.senior;
    expect(r.progressionPctMax).toBe(5);
    expect(r.nonConsecutiveDays).toBe(true);
  });

  it('applyPopulation(adult) nie zmienia recepty', () => {
    const base = prescribe('hypertrophy', 'intermediate');
    expect(applyPopulation(base, 'adult')).toEqual(base);
  });
});

describe('Periodyzacja blokowa (Issurin 2010)', () => {
  it('bloki 2-4 tyg. (realizacja 1-2)', () => {
    expect(PERIODIZATION_BLOCKS.accumulation.weeksMax).toBe(4);
    expect(PERIODIZATION_BLOCKS.realization.weeksMax).toBe(2);
  });

  it('efekty rezydualne: siła ~30 dni, szybkość ~5 dni', () => {
    const strength = RESIDUAL_EFFECTS.find((r) => r.ability === 'siła maksymalna')!;
    const speed = RESIDUAL_EFFECTS.find((r) => r.ability === 'szybkość')!;
    expect(strength.days).toBe(30);
    expect(speed.days).toBe(5);
  });

  it('residualDecayPct: 15 dni bez siły = 50% okna', () => {
    expect(residualDecayPct('siła maksymalna', 15)).toBe(50);
  });

  it('residualDecayPct: nieznana zdolność → null', () => {
    expect(residualDecayPct('żonglerka', 10)).toBeNull();
  });
});

describe('Hipertrofia (Schoenfeld 2010)', () => {
  it('zawiera regułę pełnego zakresu ruchu i pracy pod kątami', () => {
    const ids = HYPERTROPHY_RULES.map((r) => r.id);
    expect(ids).toContain('full-rom');
    expect(ids).toContain('multi-angle');
  });
});

describe('Interferencja (Wilson 2012)', () => {
  it('bieganie 4×/tydz. przy celu hipertrofia → ostrzeżenie', () => {
    const w = concurrentTrainingCheck({
      goal: 'hypertrophy', cardioSessionsPerWeek: 4, cardioMinutesPerWeek: 120,
      cardioType: 'running', sameSessionAsStrength: false,
    });
    expect(w.some((x) => x.id === 'running-interference')).toBe(true);
  });

  it('rower 2×/tydz. przy sile → brak ostrzeżeń', () => {
    const w = concurrentTrainingCheck({
      goal: 'strength', cardioSessionsPerWeek: 2, cardioMinutesPerWeek: 80,
      cardioType: 'cycling', sameSessionAsStrength: false,
    });
    expect(w).toHaveLength(0);
  });

  it('cardio+siła w jednej sesji → info o kolejności', () => {
    const w = concurrentTrainingCheck({
      goal: 'strength', cardioSessionsPerWeek: 2, cardioMinutesPerWeek: 60,
      cardioType: 'running', sameSessionAsStrength: true,
    });
    expect(w.some((x) => x.id === 'same-session')).toBe(true);
  });

  it('redukcja + bieganie → sugestia roweru', () => {
    const w = concurrentTrainingCheck({
      goal: 'weight-loss', cardioSessionsPerWeek: 3, cardioMinutesPerWeek: 120,
      cardioType: 'running', sameSessionAsStrength: false,
    });
    expect(w.some((x) => x.id === 'weight-loss-cycling')).toBe(true);
  });

  it('brak cardio → brak ostrzeżeń', () => {
    const w = concurrentTrainingCheck({
      goal: 'hypertrophy', cardioSessionsPerWeek: 0, cardioMinutesPerWeek: 0,
      cardioType: 'none', sameSessionAsStrength: false,
    });
    expect(w).toHaveLength(0);
  });
});

describe('Screening (Riebe 2015 / ACSM 2021)', () => {
  it('objawy → najpierw lekarz', () => {
    const r = screen({ exercisesRegularly: true, knownDisease: false, symptoms: true, desiredIntensity: 'moderate' });
    expect(r.clearance).toBe('medical-first');
  });

  it('choroba + brak aktywności → najpierw lekarz', () => {
    const r = screen({ exercisesRegularly: false, knownDisease: true, symptoms: false, desiredIntensity: 'light' });
    expect(r.clearance).toBe('medical-first');
  });

  it('choroba + aktywny + chce intensywnie → start umiarkowany', () => {
    const r = screen({ exercisesRegularly: true, knownDisease: true, symptoms: false, desiredIntensity: 'vigorous' });
    expect(r.clearance).toBe('start-moderate');
    expect(r.maxIntensity).toBe('moderate');
  });

  it('nieaktywny + chce intensywnie → start umiarkowany', () => {
    const r = screen({ exercisesRegularly: false, knownDisease: false, symptoms: false, desiredIntensity: 'vigorous' });
    expect(r.clearance).toBe('start-moderate');
  });

  it('zdrowy aktywny → ok', () => {
    const r = screen({ exercisesRegularly: true, knownDisease: false, symptoms: false, desiredIntensity: 'vigorous' });
    expect(r.clearance).toBe('ok');
    expect(r.maxIntensity).toBe('vigorous');
  });
});

describe('Strefy cardio (Garber 2011) — Karvonen', () => {
  it('umiarkowana 40-59% HRR dla 30 lat / RHR 60', () => {
    const z = hrZone('moderate', 30, 60);
    // HRmax = 208-21 = 187; HRR = 127; min = 60+50.8≈111, max = 60+74.9≈135
    expect(z!.min).toBe(111);
    expect(z!.max).toBe(135);
  });

  it('złe dane → null', () => {
    expect(hrZone('moderate', 0, 60)).toBeNull();
  });
});
