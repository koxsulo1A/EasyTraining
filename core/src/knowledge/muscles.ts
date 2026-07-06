/**
 * Knowledge Base — taksonomia mięśni (ADR-008).
 * JEDYNE źródło prawdy o mięśniach w systemie. Identyfikatory są zgodne
 * z tagami precyzyjnymi używanymi już w bazie ćwiczeń UI (js/exercises-db.js),
 * dzięki czemu migracja nie wymaga mapowania.
 */

export interface Muscle {
  id: string;
  label: string;   // polska nazwa do UI
  group: string;   // partia (grupa nadrzędna)
}

export const MUSCLES: readonly Muscle[] = [
  // Klatka piersiowa
  { id: 'piersiowy_gorny',      label: 'Klatka górna',          group: 'klatka_piersiowa' },
  { id: 'piersiowy_srodkowy',   label: 'Klatka środkowa',       group: 'klatka_piersiowa' },
  { id: 'piersiowy_dolny',      label: 'Klatka dolna',          group: 'klatka_piersiowa' },
  { id: 'piersiowy_wewnetrzny', label: 'Klatka wewnętrzna',     group: 'klatka_piersiowa' },
  { id: 'piersiowy_zewnetrzny', label: 'Klatka zewnętrzna',     group: 'klatka_piersiowa' },
  // Plecy
  { id: 'najszerszy_gorny',     label: 'Najszerszy (góra)',     group: 'plecy' },
  { id: 'najszerszy_srodkowy',  label: 'Najszerszy (środek)',   group: 'plecy' },
  { id: 'najszerszy_dolny',     label: 'Najszerszy (dół)',      group: 'plecy' },
  { id: 'prostownik_grzbietu',  label: 'Prostownik grzbietu',   group: 'plecy' },
  { id: 'pulapki',              label: 'Czworoboczny (kaptur)', group: 'plecy' },
  { id: 'rownolegloboczny',     label: 'Równoległoboczny',      group: 'plecy' },
  { id: 'obly_wiekszy',         label: 'Obły większy',          group: 'plecy' },
  // Nogi
  { id: 'czworoglowy',          label: 'Czworogłowy uda',       group: 'nogi' },
  { id: 'posladkowy_wielki',    label: 'Pośladkowy wielki',     group: 'nogi' },
  { id: 'posladkowy_sredni',    label: 'Pośladkowy średni',     group: 'nogi' },
  { id: 'dwuglowy_uda',         label: 'Dwugłowy uda',          group: 'nogi' },
  { id: 'przywodziciele',       label: 'Przywodziciele',        group: 'nogi' },
  // Biceps
  { id: 'dwuglowy_ramienia',    label: 'Dwugłowy ramienia',     group: 'biceps' },
  { id: 'ramienny',             label: 'Ramienny',              group: 'biceps' },
  { id: 'ramienno_promieniowy', label: 'Ramienno-promieniowy',  group: 'biceps' },
  // Triceps
  { id: 'trojglowy_dluga_glowa',  label: 'Triceps (długa głowa)',   group: 'triceps' },
  { id: 'trojglowy_boczna_glowa', label: 'Triceps (boczna głowa)',  group: 'triceps' },
  { id: 'trojglowy_przysrodkowa', label: 'Triceps (przyśrodkowa)',  group: 'triceps' },
  // Barki
  { id: 'naramienny_przedni',   label: 'Naramienny przedni',    group: 'barki' },
  { id: 'naramienny_srodkowy',  label: 'Naramienny środkowy',   group: 'barki' },
  { id: 'naramienny_tylny',     label: 'Naramienny tylny',      group: 'barki' },
  // Łydki
  { id: 'brzuchaty',            label: 'Brzuchaty łydki',       group: 'lydki' },
  { id: 'plaszczkowaty',        label: 'Płaszczkowaty',         group: 'lydki' },
  // Przedramiona
  { id: 'zginacze_nadgarstka',    label: 'Zginacze nadgarstka',    group: 'przedramiona' },
  { id: 'prostowniki_nadgarstka', label: 'Prostowniki nadgarstka', group: 'przedramiona' },
  { id: 'chwyt',                  label: 'Siła chwytu',            group: 'przedramiona' },
  // Core / brzuch
  { id: 'prosty_brzucha',       label: 'Prosty brzucha',        group: 'core_brzuch' },
  { id: 'skosne',               label: 'Skośne brzucha',        group: 'core_brzuch' },
  { id: 'poprzeczny',           label: 'Poprzeczny brzucha',    group: 'core_brzuch' },
  { id: 'prostownik_ledzwi',    label: 'Prostownik lędźwi',     group: 'core_brzuch' },
] as const;

const byId = new Map(MUSCLES.map((m) => [m.id, m]));

export function muscleLabel(id: string): string {
  return byId.get(id)?.label ?? id;
}
export function muscleGroup(id: string): string | null {
  return byId.get(id)?.group ?? null;
}

/**
 * Heurystyka zaangażowania (dopóki baza nie ma ręcznych % — sekcja 6 spec):
 * pierwszy mięsień na liście = główny (65%), pozostałe dzielą resztę po równo.
 * Deterministyczna — te same wejścia dają ten sam rozkład.
 */
export function engagementFromMuscles(muscles: readonly string[]): Record<string, number> {
  const out: Record<string, number> = {};
  if (!muscles.length) return out;
  if (muscles.length === 1) { out[muscles[0]!] = 100; return out; }
  const MAIN = 65;
  const rest = (100 - MAIN) / (muscles.length - 1);
  muscles.forEach((m, i) => { out[m] = i === 0 ? MAIN : Math.round(rest * 100) / 100; });
  return out;
}
