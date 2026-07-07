/**
 * Knowledge Base: wytyczne treningowe (część B)
 *
 * Źródła:
 * - Faigenbaum et al. 2009 — NSCA Youth Resistance Training
 * - Fragala et al. 2019 — NSCA Resistance Training for Older Adults
 * - Issurin 2010 — Block Periodization
 * - Schoenfeld 2010 — Mechanisms of Muscle Hypertrophy
 * - Wilson et al. 2012 — Concurrent Training Meta-analysis
 * - Riebe et al. 2015 / ACSM 2021 — Pre-participation Screening
 * - Garber et al. 2011 — ACSM Quantity & Quality (cardio, gibkość, neuromotor)
 */

import type { PrescriptionParams } from './guidelines';

// ─────────────────────────────────────────────────────────────────────────────
// Populacje specjalne: modyfikatory recepty (Faigenbaum 2009, Fragala 2019)
// ─────────────────────────────────────────────────────────────────────────────

export type Population = 'youth' | 'adult' | 'senior';

export interface PopulationRules {
  population: Population;
  label: string;
  ageMin: number;
  ageMax: number | null;
  setsMax: number;              // limit serii na ćwiczenie na start
  repsMin: number;
  repsMax: number;
  no1RMTests: boolean;          // zakaz prób maksymalnych
  rirMinimum: number;           // minimalny zapas powtórzeń
  freqPerWeekMax: number;
  nonConsecutiveDays: boolean;  // treningi w niekolejne dni
  progressionPctMax: number;    // maks. podbicie ciężaru
  emphasis: string[];           // akcenty treningowe
  source: string;
}

export const POPULATION_RULES: Record<Population, PopulationRules> = {
  youth: {
    population: 'youth', label: 'Młodzież (<18 lat)',
    ageMin: 7, ageMax: 17,
    setsMax: 2, repsMin: 8, repsMax: 15,
    no1RMTests: true,
    rirMinimum: 3,
    freqPerWeekMax: 3,
    nonConsecutiveDays: true,
    progressionPctMax: 10,
    emphasis: ['technika przed ciężarem', 'różnorodność ruchowa', 'nadzór jakości ruchu'],
    source: 'Faigenbaum et al. 2009 (NSCA Youth Position Statement)',
  },
  adult: {
    population: 'adult', label: 'Dorosły (18-64)',
    ageMin: 18, ageMax: 64,
    setsMax: 6, repsMin: 1, repsMax: 25,
    no1RMTests: false,
    rirMinimum: 0,
    freqPerWeekMax: 6,
    nonConsecutiveDays: false,
    progressionPctMax: 10,
    emphasis: [],
    source: 'Ratamess et al. 2009 (bazowe wytyczne ACSM)',
  },
  senior: {
    population: 'senior', label: 'Senior (65+)',
    ageMin: 65, ageMax: null,
    setsMax: 3, repsMin: 8, repsMax: 15,
    no1RMTests: false,           // dozwolone po adaptacji, ostrożnie
    rirMinimum: 2,
    freqPerWeekMax: 3,
    nonConsecutiveDays: true,
    progressionPctMax: 5,
    emphasis: [
      'trening mocy 40-60% 1RM z szybkim ruchem (funkcja)',
      'równowaga zintegrowana z siłą',
      'maszyny przed wolnymi ciężarami na start',
    ],
    source: 'Fragala et al. 2019 (NSCA Position Statement, Older Adults)',
  },
};

export function populationForAge(age: number): Population {
  if (age < 18) return 'youth';
  if (age >= 65) return 'senior';
  return 'adult';
}

/** Nakłada limity populacyjne na receptę z prescribe(). Czysta funkcja. */
export function applyPopulation(p: PrescriptionParams, pop: Population): PrescriptionParams {
  const r = POPULATION_RULES[pop];
  if (pop === 'adult') return p;
  return {
    ...p,
    sets: Math.min(p.sets, r.setsMax),
    repsMin: Math.max(p.repsMin, r.repsMin),
    repsMax: Math.min(p.repsMax, r.repsMax),
    rir: Math.max(p.rir, r.rirMinimum),
    freqPerWeek: [
      Math.min(p.freqPerWeek[0], r.freqPerWeekMax),
      Math.min(p.freqPerWeek[1], r.freqPerWeekMax),
    ],
    sources: p.sources.concat([r.source]),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Periodyzacja blokowa + efekty rezydualne (Issurin 2010)
// ─────────────────────────────────────────────────────────────────────────────

export type BlockType = 'accumulation' | 'transmutation' | 'realization';

export interface BlockDef {
  type: BlockType;
  label: string;
  weeksMin: number;
  weeksMax: number;
  volume: 'wysoka' | 'średnia' | 'niska';
  intensity: 'niska-średnia' | 'wysoka' | 'bardzo wysoka';
  focus: string;
  source: string;
}

export const PERIODIZATION_BLOCKS: Record<BlockType, BlockDef> = {
  accumulation: {
    type: 'accumulation', label: 'Akumulacja',
    weeksMin: 2, weeksMax: 4,
    volume: 'wysoka', intensity: 'niska-średnia',
    focus: 'zdolności podstawowe: masa mięśniowa, wytrzymałość siłowa, baza tlenowa',
    source: 'Issurin 2010',
  },
  transmutation: {
    type: 'transmutation', label: 'Transmutacja',
    weeksMin: 2, weeksMax: 4,
    volume: 'średnia', intensity: 'wysoka',
    focus: 'zdolności specyficzne: siła maksymalna, moc, wytrzymałość specjalna',
    source: 'Issurin 2010',
  },
  realization: {
    type: 'realization', label: 'Realizacja',
    weeksMin: 1, weeksMax: 2,
    volume: 'niska', intensity: 'bardzo wysoka',
    focus: 'szczyt formy: świeżość + intensywność startowa, taper',
    source: 'Issurin 2010',
  },
};

/** Efekty rezydualne: ile dni utrzymuje się adaptacja po zaprzestaniu bodźca. */
export interface ResidualEffect {
  ability: string;
  days: number;
  toleranceDays: number;  // ±
  source: string;
}

export const RESIDUAL_EFFECTS: ResidualEffect[] = [
  { ability: 'wydolność tlenowa',      days: 30, toleranceDays: 5, source: 'Issurin 2010' },
  { ability: 'siła maksymalna',        days: 30, toleranceDays: 5, source: 'Issurin 2010' },
  { ability: 'wytrzymałość beztlenowa', days: 18, toleranceDays: 4, source: 'Issurin 2010' },
  { ability: 'wytrzymałość siłowa',    days: 15, toleranceDays: 5, source: 'Issurin 2010' },
  { ability: 'szybkość',               days: 5,  toleranceDays: 3, source: 'Issurin 2010' },
];

/**
 * Status zaniku adaptacji: ile % okna rezydualnego minęło od ostatniego bodźca.
 * >=100 = adaptacja prawdopodobnie utracona; >=66 = ostrzeżenie.
 */
export function residualDecayPct(ability: string, daysSinceLastStimulus: number): number | null {
  const r = RESIDUAL_EFFECTS.find((x) => x.ability === ability);
  if (!r) return null;
  return Math.round((daysSinceLastStimulus / r.days) * 100);
}

// ─────────────────────────────────────────────────────────────────────────────
// Reguły hipertrofii (Schoenfeld 2010)
// ─────────────────────────────────────────────────────────────────────────────

export interface HypertrophyRule { id: string; rule: string; source: string }

export const HYPERTROPHY_RULES: HypertrophyRule[] = [
  { id: 'full-rom',        rule: 'Pełny zakres ruchu — większe napięcie mechaniczne',            source: 'Schoenfeld 2010' },
  { id: 'multi-angle',     rule: 'Ta sama grupa z różnych kątów/wariantów (pełna rekrutacja)',   source: 'Schoenfeld 2010' },
  { id: 'eccentric',       rule: 'Kontrolowana/akcentowana faza ekscentryczna (uszkodzenia mięśniowe → adaptacja)', source: 'Schoenfeld 2010' },
  { id: 'moderate-rest',   rule: 'Przerwy 60-90 s — stres metaboliczny przy zachowaniu objętości', source: 'Schoenfeld 2010' },
  { id: 'moderate-reps',   rule: 'Główny zakres 6-12 powtórzeń (napięcie × stres metaboliczny)', source: 'Schoenfeld 2010' },
];

// ─────────────────────────────────────────────────────────────────────────────
// Trening równoległy — interferencja (Wilson et al. 2012)
// ─────────────────────────────────────────────────────────────────────────────

export interface ConcurrentInput {
  goal: 'strength' | 'hypertrophy' | 'endurance' | 'power' | 'weight-loss';
  cardioSessionsPerWeek: number;
  cardioMinutesPerWeek: number;
  cardioType: 'running' | 'cycling' | 'mixed' | 'none';
  sameSessionAsStrength: boolean;
}

export interface ConcurrentWarning { id: string; severity: 'info' | 'warning'; message: string; source: string }

/**
 * Reguły interferencji: bieganie szkodzi sile/hipertrofii bardziej niż rower;
 * efekt rośnie z częstotliwością i czasem cardio.
 */
export function concurrentTrainingCheck(input: ConcurrentInput): ConcurrentWarning[] {
  const w: ConcurrentWarning[] = [];
  const SRC = 'Wilson et al. 2012 (meta-analiza treningu równoległego)';
  const massGoal = input.goal === 'strength' || input.goal === 'hypertrophy' || input.goal === 'power';

  if (input.cardioType === 'none' || input.cardioSessionsPerWeek === 0) return w;

  if (massGoal && input.cardioType === 'running' && input.cardioSessionsPerWeek >= 3) {
    w.push({
      id: 'running-interference', severity: 'warning',
      message: 'Bieganie ≥3×/tydz. przy celu siła/masa istotnie ogranicza przyrosty (interferencja). Rozważ zamianę części biegów na rower lub redukcję do 2×/tydz.',
      source: SRC,
    });
  }
  if (massGoal && input.cardioMinutesPerWeek > 150) {
    w.push({
      id: 'cardio-volume', severity: 'warning',
      message: 'Ponad 150 min cardio/tydz. przy celu siła/masa — interferencja rośnie z czasem trwania cardio. Ogranicz objętość lub zaakceptuj wolniejsze przyrosty.',
      source: SRC,
    });
  }
  if (input.sameSessionAsStrength && massGoal) {
    w.push({
      id: 'same-session', severity: 'info',
      message: 'Cardio i siła w jednej sesji: wykonuj siłę PIERWSZĄ, a najlepiej rozdziel je o kilka godzin lub na osobne dni.',
      source: SRC,
    });
  }
  if (input.goal === 'weight-loss' && input.cardioType === 'running') {
    w.push({
      id: 'weight-loss-cycling', severity: 'info',
      message: 'Przy redukcji z zachowaniem mięśni rower interferuje z siłą mniej niż bieganie.',
      source: SRC,
    });
  }
  return w;
}

// ─────────────────────────────────────────────────────────────────────────────
// Screening przedtreningowy (Riebe et al. 2015 / ACSM 2021)
// ─────────────────────────────────────────────────────────────────────────────

export interface ScreeningInput {
  exercisesRegularly: boolean;       // ≥30 min umiarkowanej aktywności 3×/tydz. od 3 mies.
  knownDisease: boolean;             // choroba sercowo-naczyniowa, metaboliczna lub nerek
  symptoms: boolean;                 // ból w klatce, duszność, zawroty, omdlenia
  desiredIntensity: 'light' | 'moderate' | 'vigorous';
}

export interface ScreeningResult {
  clearance: 'ok' | 'start-moderate' | 'medical-first';
  message: string;
  maxIntensity: 'light' | 'moderate' | 'vigorous';
  source: string;
}

/** Uproszczony algorytm ACSM 2015 (drzewo: objawy → choroba → nawyk aktywności). */
export function screen(input: ScreeningInput): ScreeningResult {
  const SRC = 'Riebe et al. 2015 / ACSM Guidelines 2021 (pre-participation screening)';
  if (input.symptoms) {
    return {
      clearance: 'medical-first',
      message: 'Występują objawy (ból w klatce, duszność, zawroty) — przed rozpoczęciem programu skonsultuj się z lekarzem.',
      maxIntensity: 'light', source: SRC,
    };
  }
  if (input.knownDisease) {
    if (!input.exercisesRegularly) {
      return {
        clearance: 'medical-first',
        message: 'Rozpoznana choroba + brak regularnej aktywności — zalecana zgoda lekarza przed startem.',
        maxIntensity: 'light', source: SRC,
      };
    }
    if (input.desiredIntensity === 'vigorous') {
      return {
        clearance: 'start-moderate',
        message: 'Choroba w wywiadzie: trenujesz regularnie, więc kontynuuj umiarkowanie; przed intensywnym wysiłkiem wskazana konsultacja.',
        maxIntensity: 'moderate', source: SRC,
      };
    }
  }
  if (!input.exercisesRegularly && input.desiredIntensity === 'vigorous') {
    return {
      clearance: 'start-moderate',
      message: 'Brak regularnej aktywności — zacznij od intensywności umiarkowanej i zwiększaj stopniowo.',
      maxIntensity: 'moderate', source: SRC,
    };
  }
  return { clearance: 'ok', message: 'Brak przeciwwskazań do planowanej intensywności.', maxIntensity: input.desiredIntensity, source: SRC };
}

// ─────────────────────────────────────────────────────────────────────────────
// Cardio: strefy intensywności + gibkość + neuromotor (Garber 2011)
// ─────────────────────────────────────────────────────────────────────────────

export interface CardioZone {
  id: 'light' | 'moderate' | 'vigorous';
  label: string;
  hrrPctMin: number;   // % rezerwy tętna (Karvonen)
  hrrPctMax: number;
  rpeMin: number;      // skala 1-10
  rpeMax: number;
  source: string;
}

export const CARDIO_ZONES: CardioZone[] = [
  { id: 'light',    label: 'Lekka',        hrrPctMin: 30, hrrPctMax: 39, rpeMin: 2, rpeMax: 3, source: 'Garber et al. 2011 (ACSM)' },
  { id: 'moderate', label: 'Umiarkowana',  hrrPctMin: 40, hrrPctMax: 59, rpeMin: 4, rpeMax: 5, source: 'Garber et al. 2011 (ACSM)' },
  { id: 'vigorous', label: 'Intensywna',   hrrPctMin: 60, hrrPctMax: 89, rpeMin: 6, rpeMax: 8, source: 'Garber et al. 2011 (ACSM)' },
];

/** Zakres tętna dla strefy metodą Karvonena: HRR = HRmax - HRrest. */
export function hrZone(zoneId: CardioZone['id'], age: number, restingHr: number): { min: number; max: number } | null {
  const z = CARDIO_ZONES.find((x) => x.id === zoneId);
  if (!z || age <= 0 || restingHr <= 0) return null;
  const hrMax = 208 - 0.7 * age; // Tanaka (dokładniejszy niż 220-wiek)
  const hrr = hrMax - restingHr;
  return {
    min: Math.round(restingHr + hrr * (z.hrrPctMin / 100)),
    max: Math.round(restingHr + hrr * (z.hrrPctMax / 100)),
  };
}

export const FLEXIBILITY_RX = {
  freqPerWeekMin: 2, freqPerWeekMax: 3,
  holdSecMin: 10, holdSecMax: 30,
  repsPerStretchMin: 2, repsPerStretchMax: 4,
  note: 'Rozciągaj do uczucia napięcia (nie bólu); najskuteczniejsze po rozgrzaniu mięśni.',
  source: 'Garber et al. 2011 (ACSM)',
} as const;

export const NEUROMOTOR_RX = {
  freqPerWeekMin: 2, freqPerWeekMax: 3,
  minutesPerSession: [20, 30] as const,
  content: ['równowaga', 'zwinność', 'koordynacja', 'trening propriocepcji'],
  note: 'Szczególnie istotny u seniorów (prewencja upadków).',
  source: 'Garber et al. 2011 (ACSM)',
} as const;
