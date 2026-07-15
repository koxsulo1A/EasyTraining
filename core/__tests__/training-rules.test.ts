import { describe, it, expect } from 'vitest';
import {
  applyPeriodization, computeWeekInfo, pickSuggestedWeight,
  computeProgressionProposal, shouldSuggestDeload, findPeriodBlock,
} from '../src/engines/training-rules';
import type { PeriodRangeBlock } from '../src/engines/training-rules';

const RANGES: PeriodRangeBlock[] = [
  { startWeek: 1, endWeek: 4, mode: 'progresja', volumePct: 65 },
  { startWeek: 5, endWeek: 8, mode: 'progresja', volumePct: 85 },
  { startWeek: 9, endWeek: 12, mode: 'deload', volumePct: 50, deloadPct: 15 },
];

describe('findPeriodBlock', () => {
  it('znajduje blok obejmujący tydzień', () => {
    expect(findPeriodBlock(RANGES, 6)?.mode).toBe('progresja');
    expect(findPeriodBlock(RANGES, 10)?.mode).toBe('deload');
  });
  it('tydzień poza zakresem -> ostatni blok (fallback)', () => {
    expect(findPeriodBlock(RANGES, 20)?.mode).toBe('deload');
  });
  it('brak zakresów -> null', () => {
    expect(findPeriodBlock([], 1)).toBeNull();
  });
});

describe('applyPeriodization', () => {
  it('blok neutralny (100% obj., progresja) nie zmienia wartości', () => {
    const r = applyPeriodization({ sets: 5, weight: 72.5, rir: 2 }, { startWeek: 1, endWeek: 4, mode: 'progresja', volumePct: 100 });
    expect(r).toEqual({ sets: 5, weight: 72.5, rir: 2, isDeload: false, volumePct: 100 });
  });
  it('blok progresji z obniżoną objętością skaluje tylko serie', () => {
    const r = applyPeriodization({ sets: 5, weight: 72.5, rir: 2 }, { startWeek: 1, endWeek: 4, mode: 'progresja', volumePct: 65 });
    expect(r.sets).toBe(3); // round(5*0.65)=3.25->3
    expect(r.weight).toBe(72.5);
    expect(r.isDeload).toBe(false);
  });
  it('blok deload obniża ciężar i podnosi RIR (cap 3)', () => {
    const r = applyPeriodization({ sets: 5, weight: 72.5, rir: 2 }, { startWeek: 9, endWeek: 12, mode: 'deload', volumePct: 50, deloadPct: 15 });
    expect(r.sets).toBe(3); // round(5*0.5)=2.5->3
    expect(r.weight).toBe(61.5); // 72.5*0.85=61.625 -> round to .5 = 61.5
    expect(r.rir).toBe(3); // 2+2=4 capped at 3
    expect(r.isDeload).toBe(true);
  });
  it('RIR bazowy null w deloadzie liczony od domyślnych 2', () => {
    const r = applyPeriodization({ sets: 4, weight: 100 }, { startWeek: 1, endWeek: 4, mode: 'deload', volumePct: 100, deloadPct: 20 });
    expect(r.rir).toBe(3); // (2)+2=4 capped 3
    expect(r.weight).toBe(80);
  });
  it('sets min. 1 nawet przy bardzo niskim volumePct', () => {
    const r = applyPeriodization({ sets: 2, weight: 50 }, { startWeek: 1, endWeek: 4, mode: 'progresja', volumePct: 10 });
    expect(r.sets).toBe(1);
  });
  it('brak bloku (null) zwraca bazę bez zmian', () => {
    const r = applyPeriodization({ sets: 3, weight: 40, rir: 1 }, null);
    expect(r).toEqual({ sets: 3, weight: 40, rir: 1, isDeload: false, volumePct: 100 });
  });
});

describe('computeWeekInfo', () => {
  it('brak jednostek -> null', () => {
    expect(computeWeekInfo([])).toBeNull();
  });
  it('każda jednostka wykonana 2x -> tydzień 3', () => {
    const r = computeWeekInfo([{ count: 2 }, { count: 2 }, { count: 3 }]);
    expect(r).toEqual({ completedWeeks: 2, currentWeek: 3 });
  });
  it('nowo dodana jednostka (0 sesji, <7 dni) NIE cofa tygodnia do 1 (fix buga)', () => {
    const r = computeWeekInfo([
      { count: 5 }, { count: 5 },
      { count: 0, ageDays: 1 }, // świeżo dodana
    ]);
    expect(r?.completedWeeks).toBe(5);
  });
  it('stara jednostka (0 sesji, >=7 dni) LICZY SIĘ i cofa tydzień', () => {
    const r = computeWeekInfo([
      { count: 5 }, { count: 5 },
      { count: 0, ageDays: 10 },
    ]);
    expect(r?.completedWeeks).toBe(0);
  });
  it('jednostka bez ageDays (wbudowana) zawsze dojrzała', () => {
    const r = computeWeekInfo([{ count: 3 }, { count: 0 }]);
    expect(r?.completedWeeks).toBe(0);
  });
});

describe('pickSuggestedWeight', () => {
  it('brak historii -> ciężar z planu', () => {
    expect(pickSuggestedWeight(72.5, null, null)).toBe(72.5);
  });
  it('ostatnia sesja osiągnęła/przekroczyła plan -> ciężar z planu', () => {
    expect(pickSuggestedWeight(72.5, 75, 80)).toBe(72.5);
    expect(pickSuggestedWeight(72.5, 72.5, 80)).toBe(72.5);
  });
  it('ostatnia sesja poniżej planu, jest wyższy ciężar w oknie 12 tyg. -> podstaw go', () => {
    expect(pickSuggestedWeight(72.5, 65, 70)).toBe(70);
  });
  it('ostatnia sesja poniżej planu, brak lepszego w oknie -> ciężar z planu', () => {
    expect(pickSuggestedWeight(72.5, 65, null)).toBe(72.5);
    expect(pickSuggestedWeight(72.5, 65, 0)).toBe(72.5);
  });
});

describe('computeProgressionProposal', () => {
  it('2 łatwe sesje -> propozycja +2,5% (zaokrąglone do 0,5 kg)', () => {
    expect(computeProgressionProposal(72.5, true)).toEqual({ to: 74.5 });
  });
  it('nie wszystkie sesje łatwe -> brak propozycji', () => {
    expect(computeProgressionProposal(72.5, false)).toBeNull();
  });
  it('ciężar 0 -> brak propozycji', () => {
    expect(computeProgressionProposal(0, true)).toBeNull();
  });
  it('minimalny przyrost to +0,5 kg nawet przy małych ciężarach', () => {
    expect(computeProgressionProposal(5, true)).toEqual({ to: 5.5 });
  });
});

describe('shouldSuggestDeload', () => {
  it('brak sygnałów -> nie sugeruj', () => {
    expect(shouldSuggestDeload({ daysSinceLastDeload: 10, avgRpeLast7: 6, stagnantWeeks: 0, sleepHoursAvg7: 7.5 }))
      .toEqual({ suggest: false, signs: [] });
  });
  it('1 sygnał -> jeszcze nie sugeruj', () => {
    const r = shouldSuggestDeload({ daysSinceLastDeload: 50, avgRpeLast7: 6, stagnantWeeks: 0, sleepHoursAvg7: 7.5 });
    expect(r.suggest).toBe(false);
    expect(r.signs.length).toBe(1);
  });
  it('2+ sygnały -> sugeruj deload', () => {
    const r = shouldSuggestDeload({ daysSinceLastDeload: 50, avgRpeLast7: 9, stagnantWeeks: 4, sleepHoursAvg7: 5.5 });
    expect(r.suggest).toBe(true);
    expect(r.signs.length).toBe(4);
  });
});
