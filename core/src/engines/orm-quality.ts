/**
 * Część 2/5: Series Quality Score + outlier detection
 *
 * Quality Score decyduje o wadze serii w finalnej estymacji 1RM.
 * Im wyższy score, tym bardziej silnik ufa tej serii.
 */

import { rpeToEstimatedRIR } from './orm';
import type { SetInput, ExerciseMeta } from './orm';

// ─────────────────────────────────────────────────────────────────────────────
// Series Quality Score (0–100)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Składowe Quality Score i ich uzasadnienie:
 *
 * 1. REP_RANGE (0–25 pkt)
 *    Najdokładniejszy zakres estymacji to 3–10 rep (potwierdzony literaturą).
 *    Dla effectiveReps poza tym zakresem ocena spada.
 *
 * 2. RIR_DELTA (0–25 pkt)
 *    Mała różnica między planowanym a rzeczywistym RIR → seria wykonana zgodnie
 *    z planem → dane są wiarygodne. Duża różnica sygnalizuje złą kalibrację.
 *
 * 3. COMPOUND_BONUS (0–15 pkt)
 *    Ćwiczenia wielostawowe (squat, bench, deadlift) mają lepszą powtarzalność
 *    techniki i są lepiej zbadane — wzory 1RM były na nich walidowane.
 *
 * 4. FATIGUE_PENALTY (0–(-20) pkt)
 *    Wysoki wynik Fatigue Engine → seria może nie odzwierciedlać prawdziwego 1RM.
 *
 * 5. VOLUME_PENALTY (0–(-15) pkt)
 *    Seria wykonana po dużej objętości sesji → zmęczenie kumulatywne zawyża RPE
 *    i zaniża rzeczywistą siłę → obniżamy wiarygodność.
 *
 * 6. RPE_PRESENCE (0–10 pkt)
 *    Jeżeli użytkownik podał RPE → mamy dodatkowy punkt danych do walidacji.
 *    Brak RPE = tylko planowany RIR = mniejsza pewność.
 *
 * 7. FREQUENCY_BONUS (0–10 pkt)
 *    Wyższe częstotliwość treningów danego ćwiczenia = więcej danych historycznych
 *    = silnik może lepiej estymować 1RM.
 */

export interface QualityFactors {
  effectiveReps: number;
  plannedRIR: number;
  rpe: number | null;
  isCompound: boolean;
  fatigueScore: number;      // 0–100
  cumulativeSetVolume: number; // objętość [kg] PRZED tą serią w tej sesji
  weeklyFrequency: number;   // 1–7
}

export interface QualityBreakdown {
  total: number;             // 0–100
  repRange: number;
  rirDelta: number;
  compoundBonus: number;
  fatiguePenalty: number;
  volumePenalty: number;
  rpePresence: number;
  frequencyBonus: number;
}

export function computeSeriesQuality(f: QualityFactors): QualityBreakdown {
  // 1. Rep range — optimum 3–10 effectiveReps
  let repRange: number;
  const er = f.effectiveReps;
  if (er >= 3 && er <= 10) {
    repRange = 25;
  } else if (er === 2 || (er >= 11 && er <= 12)) {
    repRange = 18;
  } else if (er === 1 || (er >= 13 && er <= 15)) {
    repRange = 10;
  } else if (er > 15) {
    // Wzory 1RM są coraz mniej wiarygodne powyżej 15 rep
    repRange = Math.max(0, 10 - (er - 15) * 1.5);
  } else {
    repRange = 5; // er < 1 — błąd danych
  }

  // 2. RIR delta — wymaga RPE
  let rirDelta = 0;
  if (f.rpe !== null) {
    const estimatedRIR = rpeToEstimatedRIR(f.rpe);
    const delta = Math.abs(estimatedRIR - f.plannedRIR);
    // delta 0 = idealne wykonanie (25 pkt), delta >= 3 = słabe (0 pkt)
    rirDelta = Math.max(0, 25 - delta * 8.33);
  } else {
    // Brak RPE → nie możemy ocenić delta, dajemy neutralne 12/25
    rirDelta = 12;
  }

  // 3. Compound bonus
  const compoundBonus = f.isCompound ? 15 : 0;

  // 4. Fatigue penalty (0 przy fatigue=0, -20 przy fatigue=100)
  const fatiguePenalty = -Math.round((f.fatigueScore / 100) * 20);

  // 5. Volume penalty — kumulatywna objętość przed tą serią
  // Threshold: 5000 kg = duża sesja (np. 50 serii × 100 kg)
  const volumePenalty = -Math.round(Math.min(15, (f.cumulativeSetVolume / 5000) * 15));

  // 6. RPE presence
  const rpePresence = f.rpe !== null ? 10 : 0;

  // 7. Frequency bonus (1 trening/tydzień = 0 pkt, 3+ = max 10 pkt)
  const frequencyBonus = Math.min(10, Math.max(0, (f.weeklyFrequency - 1) * 5));

  const total = Math.max(
    0,
    Math.min(
      100,
      Math.round(
        repRange + rirDelta + compoundBonus + fatiguePenalty + volumePenalty + rpePresence + frequencyBonus,
      ),
    ),
  );

  return { total, repRange, rirDelta, compoundBonus, fatiguePenalty, volumePenalty, rpePresence, frequencyBonus };
}

// ─────────────────────────────────────────────────────────────────────────────
// Outlier detection i ważenie serii
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Wejście: lista estymacji 1RM z poszczególnych serii.
 * Wyjście: lista z flagą isOutlier + waga finalna (0 jeśli outlier).
 *
 * Metoda: Modified Z-Score (Iglewicz & Hoaglin 1993).
 * Odporniejszy na małe próbki niż klasyczny Z-Score.
 * Threshold |MZ| > 3.5 = outlier.
 *
 * Dodatkowo: seria z qualityScore < 20 jest odrzucana niezależnie od Z-Score.
 */
export interface WeightedSet {
  orm: number;
  qualityScore: number;
  isOutlier: boolean;
  finalWeight: number;   // 0–1, zsumowane do 1 po normalizacji
}

export function weightSets(sets: Array<{ orm: number; qualityScore: number }>): WeightedSet[] {
  if (sets.length === 0) return [];

  // Odrzuć serie z bardzo niskim quality upfront
  const MIN_QUALITY = 20;

  // Modified Z-Score
  const orms = sets.map((s) => s.orm);
  const median = medianOf(orms);
  const mads = orms.map((v) => Math.abs(v - median));
  const mad = medianOf(mads);

  const results: WeightedSet[] = sets.map((s) => {
    const mz = mad > 0 ? (0.6745 * (s.orm - median)) / mad : 0;
    const isOutlier = Math.abs(mz) > 3.5 || s.qualityScore < MIN_QUALITY;
    return {
      orm: s.orm,
      qualityScore: s.qualityScore,
      isOutlier,
      finalWeight: isOutlier ? 0 : s.qualityScore,
    };
  });

  // Normalizacja wag do sumy 1
  const totalW = results.reduce((sum, r) => sum + r.finalWeight, 0);
  if (totalW > 0) {
    for (const r of results) {
      r.finalWeight = r.finalWeight / totalW;
    }
  } else {
    // Wszystkie serie odrzucone — użyj równych wag (fallback)
    const n = results.length;
    for (const r of results) {
      r.isOutlier = false;
      r.finalWeight = 1 / n;
    }
  }

  return results;
}

function medianOf(arr: number[]): number {
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length === 0) return 0;
  return sorted.length % 2 === 0
    ? ((sorted[mid - 1] ?? 0) + (sorted[mid] ?? 0)) / 2
    : (sorted[mid] ?? 0);
}

// ─────────────────────────────────────────────────────────────────────────────
// Przykład z pkt 6 specyfikacji (dla testów)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Rozważmy: 150×2@RPE9, 145×4@RPE8, 130×8@RPE9, 100×15@RPE9
 *
 * effectiveReps (zakładamy planowany RIR=1 dla każdej):
 *   150×3, 145×5, 130×9, 100×16
 *
 * Quality score:
 *   150×3 — repRange=18 (blisko optymalnego), rirDelta zależy od RPE9→RIR0.5 vs plan RIR1 (delta=0.5 → ~21pkt)
 *   145×5 — repRange=25 (w centrum), RPE8→RIR1 vs plan RIR1 (delta=0 → 25pkt) — NAJLEPSZA
 *   130×9 — repRange=25, RPE9→RIR0.5 vs plan RIR1 (delta=0.5 → ~21pkt)
 *   100×16 — repRange=~8 (powyżej optimum) — NAJSŁABSZA
 *
 * Seria 100×16 dostaje niską wagę, ale NIE jest outlierem (1RM~121kg gdy inne ~175-180kg)
 * → faktycznie będzie outlierem z Modified Z-Score.
 * → Końcowa estymacja ≈ średnia ważona trzech wyższych serii.
 */
