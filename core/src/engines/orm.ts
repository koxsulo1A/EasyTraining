/**
 * 1RM Estimation Engine
 * Spec: docs/1rm-engine.md
 *
 * Architektura: Ensemble z Series Quality Score.
 * Użytkownik widzi tylko wynik + trend — silnik ukrywa metody wewnętrzne.
 */

import type { Core } from '../index';
import type { EngineManifest, Stored } from '../types';
import { uuid } from '../types';

// ─────────────────────────────────────────────────────────────────────────────
// CZĘŚĆ 1: Typy + modele matematyczne + RPE/RIR korekta
// ─────────────────────────────────────────────────────────────────────────────

export interface SetInput {
  weight: number;       // kg
  reps: number;         // wykonane powtórzenia
  plannedRIR?: number;  // planowany przez plan (0-5+)
  rpe?: number;         // rzeczywiste RPE (1-10), opcjonalne
}

export interface ExerciseMeta {
  name: string;
  isCompound: boolean;  // wielostawowe (squat, bench) vs izolowane (curl)
}

export interface OrmInput {
  sets: SetInput[];
  exercise: ExerciseMeta;
  fatigueScore?: number;   // 0-100 z Fatigue Engine (wyżej = bardziej zmęczony)
  sessionVolume?: number;  // całkowita objętość sesji [kg] do tej serii
  weeklyFrequency?: number; // treningi tego ćwiczenia w ostatnich 7 dniach
  previousOrm?: number;    // poprzednia estymacja (kg) — do korekt Bayesowskich
}

export interface SetAnalysis {
  setIndex: number;
  weight: number;
  reps: number;
  effectiveReps: number;    // reps + plannedRIR
  plannedRIR: number;
  rpe: number | null;
  estimatedRIR: number | null;  // z RPE (tabela mapowania)
  rirDelta: number | null;      // estimatedRIR - plannedRIR (pozytywny = łatwiej niż plan)
  qualityScore: number;         // 0-100, patrz seriesQuality()
  orm1rm: number;               // estymacja 1RM z tej serii (przed wagowaniem)
  modelUsed: OrmModelId;
  corrected1rm: number;         // po korekcie RPE
}

export interface OrmResult extends Stored {
  exerciseName: string;
  ts: number;
  orm1rm: number;               // finalna estymacja [kg], zaokrąglona do 0.5
  confidence: number;           // 0-100
  deltaFromPrevious: number | null;  // kg (null = brak poprzedniej)
  setAnalyses: SetAnalysis[];
  methodSummary: string;        // np. "Ensemble(Epley×0.4+Brzycki×0.35+Mayhew×0.25)"
  trendNote: string | null;     // tekst dla UI (null = nie wyświetlaj)
}

// ─────────────────────────────────────────────────────────────────────────────
// Modele matematyczne
// ─────────────────────────────────────────────────────────────────────────────

export type OrmModelId = 'epley' | 'brzycki' | 'lombardi' | 'mayhew' | 'oconnor' | 'lander' | 'wathan';

interface OrmModel {
  id: OrmModelId;
  compute(weight: number, reps: number): number;
  /** Przedział powtórzeń, w którym model jest optymalny */
  optimalRange: [number, number];
  /** Orientacyjny błąd %  (literatura) */
  typicalErrorPct: number;
}

/**
 * Epley (1985) — najczęściej cytowany, dobry ogólny punkt startowy.
 * Dokładny dla 5–10 rep; przy 1 rep daje 1RM=weight (poprawnie).
 * Słaby < 3 rep (asymptota) i > 15 rep (zawyża).
 */
const epley: OrmModel = {
  id: 'epley',
  compute: (w, r) => r === 1 ? w : w * (1 + r / 30),
  optimalRange: [5, 10],
  typicalErrorPct: 3.5,
};

/**
 * Brzycki (1993) — liniowy, konserwatywny.
 * Najdokładniejszy dla 2–10 rep, szczególnie przy ciężkich seriach.
 * Przy >= 37 rep daje ujemne 1RM → twarde ograniczenie do 36.
 */
const brzycki: OrmModel = {
  id: 'brzycki',
  compute: (w, r) => {
    if (r >= 37) return w;
    return w * (36 / (37 - r));
  },
  optimalRange: [2, 10],
  typicalErrorPct: 3.2,
};

/**
 * Lombardi (1989) — potęgowy, skaluje się dobrze dla niskich powtórzeń.
 * Dokładniejszy niż Epley/Brzycki dla 1–4 rep.
 * Zawyża przy > 10 rep.
 */
const lombardi: OrmModel = {
  id: 'lombardi',
  compute: (w, r) => w * Math.pow(r, 0.10),
  optimalRange: [1, 5],
  typicalErrorPct: 4.1,
};

/**
 * Mayhew et al. (1992) — model wykładniczy, najdokładniejszy dla zakresów
 * hipertrofii (8–15 rep). Powszechnie używany w badaniach.
 */
const mayhew: OrmModel = {
  id: 'mayhew',
  compute: (w, r) => (100 * w) / (52.2 + 41.9 * Math.exp(-0.055 * r)),
  optimalRange: [8, 15],
  typicalErrorPct: 3.8,
};

/**
 * O'Connor et al. (1989) — prosty liniowy.
 * Dobry do cross-validacji; celowo konserwatywny.
 */
const oconnor: OrmModel = {
  id: 'oconnor',
  compute: (w, r) => w * (1 + 0.025 * r),
  optimalRange: [4, 12],
  typicalErrorPct: 4.5,
};

/**
 * Lander (1985) — liniowy, bliski Brzycki, ale nieco agresywniejszy.
 * Dobry dla 3–10 rep, szczególnie w zakresie siłowym.
 */
const lander: OrmModel = {
  id: 'lander',
  compute: (w, r) => (100 * w) / (101.3 - 2.67123 * r),
  optimalRange: [3, 10],
  typicalErrorPct: 3.6,
};

/**
 * Wathan (1994) — podobny do Mayhew, dobry kompromis 6–15 rep.
 * Stosowany gdy chcemy niezależną weryfikację Mayhew.
 */
const wathan: OrmModel = {
  id: 'wathan',
  compute: (w, r) => (100 * w) / (48.8 + 53.8 * Math.exp(-0.075 * r)),
  optimalRange: [6, 15],
  typicalErrorPct: 3.9,
};

export const ORM_MODELS: Record<OrmModelId, OrmModel> = {
  epley, brzycki, lombardi, mayhew, oconnor, lander, wathan,
};

// ─────────────────────────────────────────────────────────────────────────────
// RPE → szacowany RIR (tabela z spec)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Konwertuje RPE na szacowany RIR.
 * Poniżej RPE 7 — zakładamy 3.5 (seria bardzo łatwa, słaba jakość danych).
 */
export function rpeToEstimatedRIR(rpe: number): number {
  if (rpe >= 10) return 0;
  if (rpe >= 9)  return 0.5;
  if (rpe >= 8)  return 1;
  if (rpe >= 7)  return 2;
  return 3.5;
}

/**
 * Współczynnik korekty 1RM na podstawie różnicy RIR.
 *
 * Jeżeli rirDelta > 0 (seria była łatwiejsza niż planowana),
 * prawdziwy 1RM jest prawdopodobnie wyższy → korekta w górę.
 *
 * Jeżeli rirDelta < 0 (seria cięższa niż planowana),
 * estymacja może być zawyżona → korekta w dół.
 *
 * Kalibracja: ~2.5% per 1 RIR różnicy (wynika z gradientu wzorów).
 */
export function rirCorrectionFactor(rirDelta: number): number {
  // Ograniczamy wpływ do ±2 RIR żeby unikać ekstremalnych korekt
  const clamped = Math.max(-2, Math.min(2, rirDelta));
  return 1 + clamped * 0.025;
}

// ─────────────────────────────────────────────────────────────────────────────
// Obliczanie efektywnych powtórzeń
// ─────────────────────────────────────────────────────────────────────────────

/**
 * effectiveReps = reps + plannedRIR
 * To liczba powtórzeń do "prawdziwego" upadku mięśniowego wg planu.
 */
export function effectiveReps(reps: number, plannedRIR: number): number {
  return reps + plannedRIR;
}

// ─────────────────────────────────────────────────────────────────────────────
// Wybór modeli dla danej liczby efektywnych powtórzeń
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Zwraca listę modeli posortowaną wg dopasowania do zakresu powtórzeń.
 * Każdy model dostaje wagę proporcjonalną do odwrotności błędu i bliskości
 * do optymalnego zakresu.
 */
export function selectModelsForReps(effReps: number): Array<{ model: OrmModel; weight: number }> {
  const candidates = Object.values(ORM_MODELS).map((m) => {
    const [lo, hi] = m.optimalRange;
    let rangeScore: number;
    if (effReps >= lo && effReps <= hi) {
      // W optymalnym zakresie — bliskość do środka zakresu
      const mid = (lo + hi) / 2;
      rangeScore = 1 - Math.abs(effReps - mid) / ((hi - lo) / 2 + 1);
    } else {
      // Poza zakresem — kara proporcjonalna do odległości
      const dist = effReps < lo ? lo - effReps : effReps - hi;
      rangeScore = Math.max(0, 1 - dist * 0.15);
    }
    // Waga = rangeScore / błąd (modele dokładniejsze dostają wyższe wagi)
    const weight = rangeScore / m.typicalErrorPct;
    return { model: m, weight };
  });

  // Filtrujemy modele z zerową wagą i normalizujemy
  const valid = candidates.filter((c) => c.weight > 0);
  const total = valid.reduce((s, c) => s + c.weight, 0);
  return valid
    .map((c) => ({ model: c.model, weight: c.weight / total }))
    .sort((a, b) => b.weight - a.weight);
}

/**
 * Estymacja 1RM z jednej serii — weighted ensemble wszystkich pasujących modeli.
 * Zwraca też ID dominującego modelu (największa waga) dla celów debugowania.
 */
export function estimateOrmFromSet(
  weight: number,
  effReps: number,
): { orm: number; modelUsed: OrmModelId; weights: Array<{ id: OrmModelId; w: number }> } {
  const models = selectModelsForReps(effReps);
  let orm = 0;
  for (const { model, weight: w } of models) {
    orm += model.compute(weight, effReps) * w;
  }
  const top = models[0];
  return {
    orm,
    modelUsed: top ? top.model.id : 'epley',
    weights: models.map((m) => ({ id: m.model.id, w: +m.weight.toFixed(3) })),
  };
}
