/**
 * Część 3/5: Ensemble Engine — finalna estymacja 1RM z wielu serii.
 *
 * Dlaczego Ensemble, a nie Rule Engine / Decision Tree / Bayesian?
 *
 * - Rule Engine: dobry dla dyskretnych decyzji ("jeśli rep<3 użyj Lombardi"),
 *   ale ignoruje ciągłe interakcje między czynnikami.
 * - Decision Tree: wymaga trenowania na labeled data — nie mamy wystarczająco
 *   dużo danych per użytkownik na starcie.
 * - Bayesian: optymalny gdy mamy dobry prior — używamy go TYLKO do korekty
 *   poprzednią estymacją (Bayesian update jako bonus na końcu).
 * - Weighted Ensemble: każdy model dostaje wagę proporcjonalną do dokładności
 *   w danym zakresie rep → naturalnie adaptuje się do danych wejściowych,
 *   nie wymaga trenowania, jest interpretowalny (wiemy dlaczego taki wynik).
 *
 * Architektura: Weighted Ensemble per seria → Series Quality Score jako
 * waga łączenia serii → opcjonalny Bayesian prior z previousOrm.
 */

import {
  effectiveReps,
  estimateOrmFromSet,
  rpeToEstimatedRIR,
  rirCorrectionFactor,
  type SetInput,
  type ExerciseMeta,
  type OrmInput,
  type SetAnalysis,
  type OrmResult,
} from './orm';
import { computeSeriesQuality, weightSets } from './orm-quality';

// ─────────────────────────────────────────────────────────────────────────────
// Analiza pojedynczej serii
// ─────────────────────────────────────────────────────────────────────────────

function analyzeSet(
  set: SetInput,
  setIndex: number,
  exercise: ExerciseMeta,
  fatigueScore: number,
  cumulativeVolume: number,
  weeklyFrequency: number,
): SetAnalysis {
  const plannedRIR = set.plannedRIR ?? 0;
  const effReps = effectiveReps(set.reps, plannedRIR);
  const rpe = set.rpe ?? null;

  // Estymacja 1RM z effectiveReps (Ensemble modeli)
  const { orm: rawOrm, modelUsed } = estimateOrmFromSet(set.weight, effReps);

  // Korekta na podstawie RPE
  let estimatedRIR: number | null = null;
  let rirDelta: number | null = null;
  let correctionFactor = 1;
  if (rpe !== null) {
    estimatedRIR = rpeToEstimatedRIR(rpe);
    rirDelta = estimatedRIR - plannedRIR;
    correctionFactor = rirCorrectionFactor(rirDelta);
  }
  const corrected1rm = rawOrm * correctionFactor;

  // Quality Score
  const qFactors = {
    effectiveReps: effReps,
    plannedRIR,
    rpe,
    isCompound: exercise.isCompound,
    fatigueScore,
    cumulativeSetVolume: cumulativeVolume,
    weeklyFrequency,
  };
  const quality = computeSeriesQuality(qFactors);

  return {
    setIndex,
    weight: set.weight,
    reps: set.reps,
    effectiveReps: effReps,
    plannedRIR,
    rpe,
    estimatedRIR,
    rirDelta,
    qualityScore: quality.total,
    orm1rm: rawOrm,
    modelUsed,
    corrected1rm,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Bayesian update — gdy mamy previousOrm
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Prosty Bayesian prior:
 *   posterior = (prior × priorWeight + likelihood × likelihoodWeight) / totalWeight
 *
 * prior = previousOrm (zaufanie = 0.3 — dane historyczne)
 * likelihood = ensemble z aktualnej sesji (zaufanie = 0.7 — świeże dane)
 *
 * Gdy previousOrm jest daleko od aktualnej estymacji (>10%), obniżamy
 * wagę prioru — może to być skok formy lub błąd historyczny.
 */
function bayesianUpdate(currentOrm: number, previousOrm: number): number {
  const relDiff = Math.abs(currentOrm - previousOrm) / previousOrm;
  // Duża rozbieżność → mniejszy wpływ historii
  const priorWeight = relDiff > 0.10 ? 0.15 : 0.30;
  const likelW = 1 - priorWeight;
  return currentOrm * likelW + previousOrm * priorWeight;
}

// ─────────────────────────────────────────────────────────────────────────────
// Obliczanie confidence
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Confidence 0–100 dla finalnej estymacji.
 *
 * Składowe:
 * - Średni quality score serii (po odrzuceniu outlierów)
 * - Liczba serii (więcej = lepiej, max 4 serii = pełna pewność)
 * - Rozrzut estymacji między seriami (mały CV = wysoka pewność)
 * - Czy mamy RPE (tak = +10)
 */
function computeConfidence(analyses: SetAnalysis[], usedSets: number): number {
  if (analyses.length === 0) return 0;

  const nonOutliers = analyses.filter((a) => {
    // Uproszczone — outlier jeśli quality < 20
    return a.qualityScore >= 20;
  });
  const n = nonOutliers.length;
  if (n === 0) return 20; // minimum fallback

  const avgQuality = nonOutliers.reduce((s, a) => s + a.qualityScore, 0) / n;
  const setCountBonus = Math.min(20, usedSets * 5); // 4+ serii = 20pkt

  // CV (Coefficient of Variation) estymacji
  const orms = nonOutliers.map((a) => a.corrected1rm);
  const mean = orms.reduce((s, v) => s + v, 0) / orms.length;
  const variance = orms.reduce((s, v) => s + (v - mean) ** 2, 0) / orms.length;
  const cv = mean > 0 ? Math.sqrt(variance) / mean : 1;
  const consistencyBonus = Math.max(0, 20 - cv * 200); // CV 0% = 20pkt, CV 10% = 0pkt

  const rpeBonus = nonOutliers.some((a) => a.rpe !== null) ? 10 : 0;

  // Normalizacja: quality contributes 50%, rest 50%
  const raw = (avgQuality / 100) * 50 + setCountBonus + consistencyBonus + rpeBonus;
  return Math.max(0, Math.min(100, Math.round(raw)));
}

// ─────────────────────────────────────────────────────────────────────────────
// Trend note — kiedy i co wyświetlić użytkownikowi
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Decyzja: wyświetlamy notatkę tylko przy znaczącej zmianie lub trendzie.
 * Poniżej 1% zmiany — cisza (szum pomiaru).
 */
export function buildTrendNote(
  currentOrm: number,
  previousOrm: number | null | undefined,
  deltaHistory: number[], // ostatnie N delt (kg) — do trendu
): string | null {
  if (!previousOrm) return null;

  const delta = currentOrm - previousOrm;
  const pct = Math.abs(delta) / previousOrm;

  // Za mała zmiana — nie wyświetlaj
  if (pct < 0.01) return null;

  const deltaStr = (delta > 0 ? '+' : '') + delta.toFixed(1) + ' kg';

  if (delta > 0) {
    // Sprawdź trend wzrostowy (3+ kolejne pozytywne delty)
    if (deltaHistory.length >= 2 && deltaHistory.slice(-2).every((d) => d > 0)) {
      return `Szacowany 1RM wzrósł o ${delta.toFixed(1)} kg od poprzedniego treningu. AI Engine wykrył stabilny trend wzrostowy siły.`;
    }
    return `Szacowany 1RM wzrósł o ${delta.toFixed(1)} kg od poprzedniego treningu.`;
  } else {
    // Sprawdź spowolnienie: poprzednie delty były pozytywne, teraz ujemna
    if (deltaHistory.length >= 2 && (deltaHistory[deltaHistory.length - 1] ?? 0) > 0) {
      return `Tempo wzrostu siły spadło (${deltaStr}). Rozważ deload lub zmianę objętości treningowej.`;
    }
    return `Szacowany 1RM spadł o ${Math.abs(delta).toFixed(1)} kg od poprzedniego treningu.`;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Główna funkcja silnika
// ─────────────────────────────────────────────────────────────────────────────

export function computeOrm(input: OrmInput, deltaHistory: number[] = []): OrmResult {
  const { sets, exercise, fatigueScore = 0, sessionVolume = 0, weeklyFrequency = 1, previousOrm } = input;

  if (sets.length === 0) {
    return {
      id: uuid_local(),
      exerciseName: exercise.name,
      ts: Date.now(),
      orm1rm: previousOrm ?? 0,
      confidence: 0,
      deltaFromPrevious: null,
      setAnalyses: [],
      methodSummary: 'Brak serii',
      trendNote: null,
    };
  }

  // Analizuj każdą serię
  let cumulativeVolume = sessionVolume;
  const analyses: SetAnalysis[] = sets.map((set, i) => {
    const a = analyzeSet(set, i, exercise, fatigueScore, cumulativeVolume, weeklyFrequency);
    cumulativeVolume += set.weight * set.reps;
    return a;
  });

  // Wagi serii
  const weighted = weightSets(analyses.map((a) => ({ orm: a.corrected1rm, qualityScore: a.qualityScore })));

  // Ważona średnia estymacji (tylko nie-outlierów)
  let ensembleOrm = 0;
  let usedSets = 0;
  for (let i = 0; i < analyses.length; i++) {
    const w = weighted[i];
    const a = analyses[i];
    if (w && a && w.finalWeight > 0) {
      ensembleOrm += a.corrected1rm * w.finalWeight;
      usedSets++;
    }
  }

  // Fallback: jeśli wszystkie odrzucone (nie powinno się zdarzyć — weightSets to obsługuje)
  if (usedSets === 0) {
    ensembleOrm = analyses.reduce((s, a) => s + a.corrected1rm, 0) / analyses.length;
  }

  // Bayesian prior z poprzedniej estymacji
  const withPrior = previousOrm ? bayesianUpdate(ensembleOrm, previousOrm) : ensembleOrm;

  // Zaokrąglenie do 0.5 kg (praktyczne — talerze są co 0.5 kg lub 1 kg)
  const finalOrm = Math.round(withPrior * 2) / 2;

  const confidence = computeConfidence(analyses, usedSets);
  const delta = previousOrm != null ? finalOrm - previousOrm : null;
  const trendNote = buildTrendNote(finalOrm, previousOrm, deltaHistory);

  // Opis metody dla debugowania (nie wyświetlany w UI)
  const topModels = analyses
    .filter((_, i) => !(weighted[i]?.isOutlier))
    .map((a) => a.modelUsed);
  const modelCount: Record<string, number> = {};
  for (const m of topModels) modelCount[m] = (modelCount[m] ?? 0) + 1;
  const modelStr = Object.entries(modelCount)
    .sort((a, b) => b[1] - a[1])
    .map(([id, n]) => `${id}×${n}`)
    .join('+');
  const methodSummary = `Ensemble(${modelStr})${previousOrm ? '+BayesPrior' : ''}`;

  return {
    id: uuid_local(),
    exerciseName: exercise.name,
    ts: Date.now(),
    orm1rm: finalOrm,
    confidence,
    deltaFromPrevious: delta,
    setAnalyses: analyses,
    methodSummary,
    trendNote,
  };
}

// Lokalny uuid (nie importujemy pełnego core żeby moduł był testowalny w izolacji)
function uuid_local(): string {
  return 'orm_' + Math.random().toString(36).slice(2, 10) + '_' + Date.now();
}
