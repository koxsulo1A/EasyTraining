/**
 * Reguły treningowe aplikacji (nie podręcznikowa wiedza, jak knowledge/*) —
 * czysta logika decyzyjna używana przez moduł Trening siłowy: periodyzacja
 * bloków (deload/progresja), reguła sugerowanego ciężaru z historii,
 * propozycja progresji +2,5% oraz heurystyka "czy potrzebujesz deloadu"
 * (Smart Coach). Wydzielone z js/strength.js i js/dashboard.js, żeby dało
 * się to testować jednostkowo bez DOM-u/Reacta.
 */

// ─────────────────────────────────────────────────────────────────────────────
// Periodyzacja bloku (deload / progresja) — przeliczenie serii/ciężaru/RIR
// ─────────────────────────────────────────────────────────────────────────────

export interface PeriodRangeBlock {
  startWeek: number;
  endWeek: number;
  mode: 'progresja' | 'deload';
  volumePct?: number;
  deloadPct?: number;
}

export interface PeriodBase {
  sets: number;
  weight: number;
  rir?: number | null;
}

export interface PeriodResult {
  sets: number;
  weight: number;
  rir: number | null;
  isDeload: boolean;
  volumePct: number;
}

/** Znajduje blok periodyzacji obejmujący dany tydzień (ostatni jako fallback). */
export function findPeriodBlock(ranges: PeriodRangeBlock[], week: number): PeriodRangeBlock | null {
  if (!ranges || !ranges.length) return null;
  const hit = ranges.find(r => week >= r.startWeek && week <= r.endWeek);
  return hit ?? ranges[ranges.length - 1] ?? null;
}

/**
 * Przelicza bazowe sets/weight/rir wg bloku periodyzacji:
 * - volumePct skaluje liczbę serii (min. 1),
 * - w bloku deload: ciężar obniżony o deloadPct (zaokrąglony do 0,5 kg),
 *   RIR podniesiony o 2 (maks. 3).
 */
export function applyPeriodization(base: PeriodBase, block: PeriodRangeBlock | null): PeriodResult {
  const volumePct = block?.volumePct ?? 100;
  const isDeload = block?.mode === 'deload';
  if (!block || volumePct === 100 && !isDeload) {
    return { sets: base.sets, weight: base.weight, rir: base.rir ?? null, isDeload: false, volumePct: 100 };
  }
  const sets = Math.max(1, Math.round(base.sets * volumePct / 100));
  let weight = base.weight;
  let rir = base.rir ?? null;
  if (isDeload) {
    const deloadPct = block.deloadPct ?? 15;
    weight = Math.round(base.weight * (1 - deloadPct / 100) * 2) / 2;
    rir = Math.min(3, (base.rir ?? 2) + 2);
  }
  return { sets, weight, rir, isDeload, volumePct };
}

// ─────────────────────────────────────────────────────────────────────────────
// Tydzień planu — tydzień zalicza się, gdy każda "dojrzała" jednostka wykonana
// ─────────────────────────────────────────────────────────────────────────────

export interface UnitWeekInput {
  /** liczba wykonanych sesji tej jednostki */
  count: number;
  /** dni od utworzenia jednostki; undefined = jednostka istnieje od zawsze (wbudowana) */
  ageDays?: number;
}

export interface WeekInfo {
  completedWeeks: number;
  currentWeek: number;
}

/**
 * Tydzień = min. liczba sesji spośród "dojrzałych" jednostek (wykonana ≥1×
 * LUB istnieje ≥7 dni). Świeżo dodana jednostka (0 sesji, <7 dni) nie cofa
 * licznika tygodnia całego planu do 1 — dostaje tydzień na rozbieg.
 */
export function computeWeekInfo(units: UnitWeekInput[]): WeekInfo | null {
  if (!units || !units.length) return null;
  const mature = units.filter(u => u.count > 0 || u.ageDays === undefined || u.ageDays >= 7);
  const completedWeeks = mature.length ? Math.min(...mature.map(u => u.count)) : 0;
  return { completedWeeks, currentWeek: completedWeeks + 1 };
}

// ─────────────────────────────────────────────────────────────────────────────
// Reguła ciężaru: jeśli ostatnia sesja nie osiągnęła planu, podstaw najwyższy
// wpisany ciężar z ostatnich N tygodni (nigdy nie zgaduj, tylko dane usera).
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @param planWeight   domyślny ciężar z planu/szablonu
 * @param lastSessionMaxWeight  najwyższy wpisany ciężar z OSTATNIEJ sesji z tym ćwiczeniem (null = brak historii)
 * @param recentWindowMaxWeight najwyższy wpisany ciężar z okna (np. 12 tyg.) — 0/null jeśli brak
 */
export function pickSuggestedWeight(
  planWeight: number,
  lastSessionMaxWeight: number | null,
  recentWindowMaxWeight: number | null
): number {
  if (lastSessionMaxWeight == null) return planWeight;
  if (lastSessionMaxWeight >= planWeight) return planWeight;
  if (recentWindowMaxWeight && recentWindowMaxWeight > 0) return recentWindowMaxWeight;
  return planWeight;
}

// ─────────────────────────────────────────────────────────────────────────────
// Propozycja progresji: RIR z 2 ostatnich sesji ≥ planowanego → +2,5% (min +0,5 kg)
// ─────────────────────────────────────────────────────────────────────────────

export function computeProgressionProposal(
  currentWeight: number,
  allRecentSessionsEasy: boolean
): { to: number } | null {
  if (!(currentWeight > 0) || !allRecentSessionsEasy) return null;
  const to = Math.max(currentWeight + 0.5, Math.round(currentWeight * 1.025 * 2) / 2);
  return { to };
}

// ─────────────────────────────────────────────────────────────────────────────
// Smart Coach: heurystyka "czy potrzebujesz deloadu" — zbiór sygnałów
// ─────────────────────────────────────────────────────────────────────────────

export interface DeloadSignals {
  daysSinceLastDeload: number | null;
  avgRpeLast7: number | null;      // wysoki śr. RPE = sygnał
  stagnantWeeks: number;           // ile tygodni bez wzrostu 1RM/ciężaru
  sleepHoursAvg7: number | null;
}

export interface DeloadVerdict {
  suggest: boolean;
  signs: string[];
}

/**
 * ≥2 sygnały → sugeruj deload. Sygnały: brak deloadu >42 dni, śr. RPE≥8.5,
 * stagnacja ≥3 tyg., sen <6,5h śr. z 7 dni.
 */
export function shouldSuggestDeload(s: DeloadSignals): DeloadVerdict {
  const signs: string[] = [];
  if (s.daysSinceLastDeload != null && s.daysSinceLastDeload > 42) {
    signs.push('Brak deloadu od ' + s.daysSinceLastDeload + ' dni');
  }
  if (s.avgRpeLast7 != null && s.avgRpeLast7 >= 8.5) {
    signs.push('Wysokie śr. RPE ostatnich sesji (' + s.avgRpeLast7.toFixed(1) + ')');
  }
  if (s.stagnantWeeks >= 3) {
    signs.push('Stagnacja wyników od ' + s.stagnantWeeks + ' tyg.');
  }
  if (s.sleepHoursAvg7 != null && s.sleepHoursAvg7 < 6.5) {
    signs.push('Niedobór snu (śr. ' + s.sleepHoursAvg7.toFixed(1) + 'h/7 dni)');
  }
  return { suggest: signs.length >= 2, signs };
}
