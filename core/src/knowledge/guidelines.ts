/**
 * Knowledge Base: wytyczne treningowe (część A)
 *
 * Wszystkie wartości pochodzą z opublikowanych wytycznych — każda stała ma
 * pole `source`. To DANE, nie logika: rules engine kreatora i walidator
 * planów czytają stąd, nigdy nie hardkodują parametrów u siebie.
 *
 * Źródła części A:
 * - Ratamess et al. 2009 — ACSM Progression Models in Resistance Training
 * - Haff & Triplett 2016 — NSCA Essentials of Strength Training and Conditioning
 */

// ─────────────────────────────────────────────────────────────────────────────
// Cele treningowe i strefy intensywności (Ratamess 2009)
// ─────────────────────────────────────────────────────────────────────────────

export type TrainingGoal = 'strength' | 'hypertrophy' | 'endurance' | 'power';

export interface IntensityZone {
  goal: TrainingGoal;
  label: string;
  repsMin: number;
  repsMax: number;
  pct1RMMin: number;        // % 1RM
  pct1RMMax: number;
  restSecMin: number;
  restSecMax: number;
  setsPerExerciseMin: number;
  setsPerExerciseMax: number;
  toFailure: boolean;       // czy serie prowadzone do/blisko upadku
  tempo: string;            // opis tempa ruchu
  source: string;
}

export const INTENSITY_ZONES: Record<TrainingGoal, IntensityZone> = {
  strength: {
    goal: 'strength', label: 'Siła maksymalna',
    repsMin: 1, repsMax: 6,
    pct1RMMin: 85, pct1RMMax: 100,
    restSecMin: 120, restSecMax: 300,
    setsPerExerciseMin: 2, setsPerExerciseMax: 6,
    toFailure: false,
    tempo: 'kontrolowana faza opuszczania, koncentryczna z intencją maksymalnej szybkości',
    source: 'Ratamess et al. 2009 (ACSM Progression Models)',
  },
  hypertrophy: {
    goal: 'hypertrophy', label: 'Hipertrofia',
    repsMin: 6, repsMax: 12,
    pct1RMMin: 67, pct1RMMax: 85,
    restSecMin: 60, restSecMax: 90,
    setsPerExerciseMin: 3, setsPerExerciseMax: 6,
    toFailure: true,
    tempo: 'umiarkowane: ~2 s ekscentryka, 1-2 s koncentryka',
    source: 'Ratamess et al. 2009; Schoenfeld 2010',
  },
  endurance: {
    goal: 'endurance', label: 'Wytrzymałość mięśniowa',
    repsMin: 12, repsMax: 25,
    pct1RMMin: 30, pct1RMMax: 67,
    restSecMin: 20, restSecMax: 60,
    setsPerExerciseMin: 2, setsPerExerciseMax: 4,
    toFailure: false,
    tempo: 'umiarkowane, ciągły ruch bez pauz',
    source: 'Ratamess et al. 2009 (ACSM Progression Models)',
  },
  power: {
    goal: 'power', label: 'Moc',
    repsMin: 3, repsMax: 6,
    pct1RMMin: 30, pct1RMMax: 60,
    restSecMin: 120, restSecMax: 300,
    setsPerExerciseMin: 3, setsPerExerciseMax: 5,
    toFailure: false, // NIGDY do upadku — spadek prędkości niszczy adaptację mocy
    tempo: 'maksymalna zamierzona prędkość koncentryczna',
    source: 'Ratamess et al. 2009 — moc: 30-60% 1RM, wielostawowe, nie do upadku',
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Profile poziomu zaawansowania (Ratamess 2009)
// ─────────────────────────────────────────────────────────────────────────────

export type TrainingLevel = 'novice' | 'intermediate' | 'advanced';

export interface LevelProfile {
  level: TrainingLevel;
  label: string;
  monthsTrainingMin: number;      // orientacyjny staż
  monthsTrainingMax: number | null;
  freqPerWeekMin: number;         // dni treningu siłowego / tydzień
  freqPerWeekMax: number;
  structure: 'full-body' | 'split' | 'full-body-or-split';
  loadPct1RMMin: number;          // typowy zakres obciążeń
  loadPct1RMMax: number;
  progressionPctMin: number;      // podbicie ciężaru po spełnieniu kryterium
  progressionPctMax: number;
  progressionRule: string;
  periodizationRequired: boolean;
  source: string;
}

export const LEVEL_PROFILES: Record<TrainingLevel, LevelProfile> = {
  novice: {
    level: 'novice', label: 'Początkujący',
    monthsTrainingMin: 0, monthsTrainingMax: 6,
    freqPerWeekMin: 2, freqPerWeekMax: 3,
    structure: 'full-body',
    loadPct1RMMin: 60, loadPct1RMMax: 70,
    progressionPctMin: 2, progressionPctMax: 10,
    progressionRule: 'Zwiększ ciężar o 2-10%, gdy wykonasz górny zakres powtórzeń we wszystkich seriach na 2 kolejnych treningach.',
    periodizationRequired: false,
    source: 'Ratamess et al. 2009',
  },
  intermediate: {
    level: 'intermediate', label: 'Średniozaawansowany',
    monthsTrainingMin: 6, monthsTrainingMax: 24,
    freqPerWeekMin: 3, freqPerWeekMax: 4,
    structure: 'full-body-or-split',
    loadPct1RMMin: 60, loadPct1RMMax: 85,
    progressionPctMin: 2, progressionPctMax: 10,
    progressionRule: 'Progresja jak novice + zmienność bodźca (fale ciężaru, rotacja ćwiczeń co 4-8 tyg.).',
    periodizationRequired: true,
    source: 'Ratamess et al. 2009',
  },
  advanced: {
    level: 'advanced', label: 'Zaawansowany',
    monthsTrainingMin: 24, monthsTrainingMax: null,
    freqPerWeekMin: 4, freqPerWeekMax: 6,
    structure: 'split',
    loadPct1RMMin: 60, loadPct1RMMax: 100,
    progressionPctMin: 1, progressionPctMax: 5,
    progressionRule: 'Progresja wyłącznie w ramach zaplanowanej periodyzacji (bloki/fale); adaptacje wymagają celowanej zmienności.',
    periodizationRequired: true,
    source: 'Ratamess et al. 2009',
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Objętość tygodniowa per grupa mięśniowa (Schoenfeld; konsensus ACSM)
// ─────────────────────────────────────────────────────────────────────────────

export const WEEKLY_VOLUME = {
  setsPerMuscleMin: 10,   // minimum efektywne dla hipertrofii
  setsPerMuscleMax: 20,   // powyżej — ryzyko przekroczenia zdolności regeneracji
  setsPerMuscleMaintenance: 4, // podtrzymanie
  source: 'Schoenfeld 2010; ACSM 2009 — 10-20 serii/grupę/tydzień dla hipertrofii',
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// Tabela %1RM ↔ maksymalna liczba powtórzeń (NSCA, Haff & Triplett 2016)
// ─────────────────────────────────────────────────────────────────────────────

/** [%1RM, maks. powtórzeń przy tym ciężarze] */
export const PCT_1RM_REPS: ReadonlyArray<readonly [number, number]> = [
  [100, 1], [95, 2], [93, 3], [90, 4], [87, 5], [85, 6],
  [83, 7], [80, 8], [77, 9], [75, 10], [70, 11], [67, 12], [65, 15],
];

export const PCT_1RM_SOURCE = 'Haff & Triplett 2016 (NSCA Essentials), tab. %1RM-powtórzenia';

/**
 * Sugerowany ciężar roboczy dla zadanej liczby powtórzeń.
 * Łączy 1RM Engine (estymacja) z tabelą NSCA. Uwzględnia RIR:
 * ciężar dobierany tak, by dało się zrobić reps+rir powtórzeń.
 * Zwraca kg zaokrąglone do 2.5 (typowy skok talerzy).
 */
export function suggestLoad(orm: number, reps: number, rir = 0): number | null {
  if (!orm || orm <= 0 || reps <= 0) return null;
  const targetReps = reps + rir;
  // najwyższy %1RM, przy którym da się zrobić targetReps powtórzeń
  // (tabela malejąco po %, rosnąco po powtórzeniach → pierwszy pasujący)
  let pct: number | null = null;
  for (const [p, r] of PCT_1RM_REPS) {
    if (r >= targetReps) { pct = p; break; }
  }
  if (pct == null) {
    // więcej powtórzeń niż tabela — ekstrapolacja liniowa w dół (ostrożna)
    const [lastPct, lastReps] = PCT_1RM_REPS[PCT_1RM_REPS.length - 1]!;
    pct = Math.max(30, lastPct - (targetReps - lastReps) * 2);
  }
  const kg = orm * (pct / 100);
  return Math.round(kg / 2.5) * 2.5;
}

/** Maksymalna sensowna liczba powtórzeń przy zadanym % 1RM (interpolacja tabeli). */
export function maxRepsAtPct(pct1RM: number): number {
  for (const [p, r] of PCT_1RM_REPS) {
    if (pct1RM >= p) return r;
  }
  const [lastPct, lastReps] = PCT_1RM_REPS[PCT_1RM_REPS.length - 1]!;
  return lastReps + Math.round((lastPct - pct1RM) / 2);
}

// ─────────────────────────────────────────────────────────────────────────────
// Kolejność ćwiczeń w sesji (Ratamess 2009; NSCA)
// ─────────────────────────────────────────────────────────────────────────────

export interface OrderRule {
  id: string;
  rule: string;
  source: string;
}

export const EXERCISE_ORDER_RULES: OrderRule[] = [
  { id: 'large-before-small',   rule: 'Duże grupy mięśniowe przed małymi',                     source: 'Ratamess et al. 2009' },
  { id: 'multi-before-single',  rule: 'Ćwiczenia wielostawowe przed izolowanymi',              source: 'Ratamess et al. 2009' },
  { id: 'power-first',          rule: 'Ćwiczenia mocy/eksplozywne na początku sesji (świeży układ nerwowy)', source: 'Haff & Triplett 2016 (NSCA)' },
  { id: 'high-before-low',      rule: 'Wyższa intensywność przed niższą',                      source: 'Ratamess et al. 2009' },
];

/**
 * Priorytet ćwiczenia w sesji (mniejszy = wcześniej).
 * Wejście: klasyfikacja z metadanych ćwiczenia (Etap 3 doda je do bazy).
 */
export function exerciseOrderScore(meta: { isPower?: boolean; isCompound?: boolean; isCore?: boolean }): number {
  if (meta.isPower) return 0;      // moc zawsze pierwsza
  if (meta.isCompound) return 1;   // wielostawowe główne
  if (meta.isCore) return 3;       // core na końcu (zmęczony core = gorsza stabilizacja — dlatego późno)
  return 2;                        // izolowane
}

/**
 * Walidacja kolejności ćwiczeń w planie: zwraca listę naruszeń
 * (indeksy par, gdzie ćwiczenie o wyższym priorytecie stoi za niższym).
 */
export interface OrderViolation { earlierIndex: number; laterIndex: number; ruleId: string }

export function validateExerciseOrder(
  metas: Array<{ isPower?: boolean; isCompound?: boolean; isCore?: boolean }>,
): OrderViolation[] {
  const v: OrderViolation[] = [];
  for (let i = 0; i < metas.length; i++) {
    for (let j = i + 1; j < metas.length; j++) {
      const a = exerciseOrderScore(metas[i]!);
      const b = exerciseOrderScore(metas[j]!);
      if (b < a) {
        v.push({
          earlierIndex: i, laterIndex: j,
          ruleId: metas[j]!.isPower ? 'power-first' : 'multi-before-single',
        });
      }
    }
  }
  return v;
}

// ─────────────────────────────────────────────────────────────────────────────
// Rekomendacja parametrów: cel + poziom → serie/powtórzenia/przerwa/%1RM
// ─────────────────────────────────────────────────────────────────────────────

export interface PrescriptionParams {
  goal: TrainingGoal;
  level: TrainingLevel;
  sets: number;
  repsMin: number;
  repsMax: number;
  pct1RMMin: number;
  pct1RMMax: number;
  restSec: number;
  rir: number;                 // planowany zapas powtórzeń
  freqPerWeek: [number, number];
  structure: LevelProfile['structure'];
  sources: string[];
}

/** Czysta funkcja: dobór parametrów wg wytycznych. Serce rules engine kreatora. */
export function prescribe(goal: TrainingGoal, level: TrainingLevel): PrescriptionParams {
  const zone = INTENSITY_ZONES[goal];
  const prof = LEVEL_PROFILES[level];

  // Serie: novice zaczyna od dołu zakresu strefy, advanced od góry
  const sets = level === 'novice' ? zone.setsPerExerciseMin
    : level === 'advanced' ? zone.setsPerExerciseMax - 1
    : Math.round((zone.setsPerExerciseMin + zone.setsPerExerciseMax) / 2);

  // Obciążenie: część wspólna strefy celu i zakresu poziomu
  const pctMin = Math.max(zone.pct1RMMin, prof.loadPct1RMMin);
  const pctMaxRaw = Math.min(zone.pct1RMMax, prof.loadPct1RMMax);
  const pctMax = pctMaxRaw >= pctMin ? pctMaxRaw : zone.pct1RMMax; // strefa wygrywa gdy rozłączne (np. power)

  // RIR: cele nieprowadzone do upadku → RIR 2-3; hipertrofia bliżej upadku → RIR 1;
  // novice zawsze +1 bezpieczeństwa (technika przed zmęczeniem)
  let rir = zone.toFailure ? 1 : goal === 'power' ? 3 : 2;
  if (level === 'novice') rir += 1;

  const rest = Math.round((zone.restSecMin + zone.restSecMax) / 2);

  return {
    goal, level, sets,
    repsMin: zone.repsMin, repsMax: zone.repsMax,
    pct1RMMin: pctMin, pct1RMMax: pctMax,
    restSec: rest, rir,
    freqPerWeek: [prof.freqPerWeekMin, prof.freqPerWeekMax],
    structure: prof.structure,
    sources: [zone.source, prof.source],
  };
}
