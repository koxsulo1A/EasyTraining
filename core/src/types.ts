// ── Kontrakty rdzenia (ADR-003, ADR-004, ADR-005, ADR-006) ────────────────

/** Źródło decyzji/zmiany — hierarchia: Trener(4) > User(3) > AICoach(2) > Rule(1) */
export type ChangeSource = 'trainer' | 'user' | 'ai-coach' | 'rule' | 'system';

export const DECISION_HIERARCHY: Record<ChangeSource, number> = {
  trainer: 4,
  user: 3,
  'ai-coach': 2,
  rule: 1,
  system: 0,
};

/** Zdarzenie domenowe — append-only, nigdy nie modyfikowane (ADR-003). */
export interface DomainEvent<T = unknown> {
  id: string;            // UUID
  type: string;          // np. "WorkoutFinished"
  payload: T;
  source: ChangeSource;
  ts: number;            // epoch ms
  schemaVersion: number; // wersjonowanie schematu zdarzenia
  syncedAt?: number;     // outbox: null = nie zsynchronizowane (przyszły sync)
}

/** Rekord przechowywalny — wszystko ma UUID (sync-ready). */
export interface Stored {
  id: string;
}

/** Adapter storage — jedyna rzecz, którą trzeba podmienić dla SQLite/urządzenia. */
export interface StorageAdapter {
  getAll<T extends Stored>(collection: string): T[];
  get<T extends Stored>(collection: string, id: string): T | null;
  put<T extends Stored>(collection: string, item: T): void;
  putMany<T extends Stored>(collection: string, items: T[]): void;
  count(collection: string): number;
}

/** Wpis wersji encji wersjonowanej (ADR-004): append-only. */
export interface VersionRecord<T> extends Stored {
  entityId: string;
  version: number;       // 1, 2, 3…
  data: T;
  changedBy: ChangeSource;
  reason: string;        // "sen 4.5h", "ręczna edycja"…
  confidence: number;    // 0..1
  ts: number;
}

/** Nagłówek encji wersjonowanej. */
export interface VersionedEntity extends Stored {
  currentVersionId: string;
  deleted?: boolean;     // soft-delete — nic nie kasujemy
}

/** Wynik silnika w skali 0-100 (ADR-006) — jedyny język silniki→AI. */
export interface Score extends Stored {
  engineId: string;      // "recovery-engine"
  key: string;           // "readiness"
  value: number;         // 0..100
  confidence: number;    // 0..1
  inputsHash: string;    // do cache/invalidacji
  ts: number;
}

/** Manifest modułu/silnika (ADR-005) — mechanizm "moduł za rok". */
export interface EngineManifest {
  id: string;
  version: string;
  listensTo: string[];   // typy zdarzeń
  emits: string[];
  dependsOn: string[];   // id silników — TYLKO poprzez Scores
}

export function uuid(): string {
  // RFC4122 v4 — wystarczające bez crypto.subtle (offline, stare WebView)
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  let s = '';
  for (let i = 0; i < 36; i++) {
    if (i === 8 || i === 13 || i === 18 || i === 23) s += '-';
    else if (i === 14) s += '4';
    else {
      const r = (Math.random() * 16) | 0;
      s += (i === 19 ? (r & 3) | 8 : r).toString(16);
    }
  }
  return s;
}
