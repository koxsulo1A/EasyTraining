import type { Core } from '../index';
import type { EngineManifest, Stored } from '../types';
import { uuid } from '../types';

/**
 * Encja Użytkownika + historia masy ciała (TOM II — Model Danych, cz.1).
 * Reguły: aktualna masa = ZAWSZE ostatni wpis historii; historia nieusuwalna;
 * edycja błędnego wpisu przez wersjonowanie (append-only, superseded flag).
 */

export type Sex = 'male' | 'female' | 'other';

export interface UserProfile extends Stored {
  username?: string;
  birthDate?: string;   // ISO
  sex?: Sex;
  height?: number;      // cm
}

export interface WeightRecord extends Stored {
  userId: string;
  weight: number;       // kg
  measuredAt: number;   // epoch ms
  supersedes?: string;  // id poprawianego wpisu (edycja z wersjonowaniem)
  supersededBy?: string;
}

const USER_COL = 'users';
const WEIGHT_COL = 'weight_history';
const SINGLE_USER = 'me'; // stabilne id lokalnego użytkownika (przed kontami/sync)

export class UserStore {
  constructor(private core: Core) {}

  ensureUser(): UserProfile {
    let u = this.core.storage.get<UserProfile>(USER_COL, SINGLE_USER);
    if (!u) { u = { id: SINGLE_USER }; this.core.storage.put(USER_COL, u); }
    return u;
  }

  updateProfile(patch: Partial<Omit<UserProfile, 'id'>>): UserProfile {
    const next = { ...this.ensureUser(), ...patch };
    this.core.storage.put(USER_COL, next);
    return next;
  }

  /** Nowy pomiar masy — zawsze dopisywany, nigdy nadpisywany. */
  logWeight(weight: number, measuredAt: number = Date.now()): WeightRecord {
    this.ensureUser();
    const rec: WeightRecord = { id: uuid(), userId: SINGLE_USER, weight, measuredAt };
    this.core.storage.put(WEIGHT_COL, rec);
    return rec;
  }

  /** Korekta błędnego wpisu — stary zostaje (superseded), powstaje nowa wersja. */
  editWeight(recordId: string, newWeight: number): WeightRecord | null {
    const old = this.core.storage.get<WeightRecord>(WEIGHT_COL, recordId);
    if (!old || old.supersededBy) return null;
    const corrected: WeightRecord = { id: uuid(), userId: old.userId, weight: newWeight, measuredAt: old.measuredAt, supersedes: old.id };
    this.core.storage.put(WEIGHT_COL, { ...old, supersededBy: corrected.id });
    this.core.storage.put(WEIGHT_COL, corrected);
    return corrected;
  }

  /** Aktualne (nieprzedawnione) wpisy, od najstarszego. */
  weightHistory(): WeightRecord[] {
    return this.core.storage.getAll<WeightRecord>(WEIGHT_COL)
      .filter((r) => !r.supersededBy)
      .sort((a, b) => a.measuredAt - b.measuredAt);
  }

  /** Reguła TOM II: aktualna masa = ostatni wpis historii. */
  currentWeight(): number | null {
    const h = this.weightHistory();
    return h.length ? h[h.length - 1]!.weight : null;
  }
}

// Wpięcie w event bus: każde WeightUpdated dopisuje pomiar do historii.
export const USER_MODULE_MANIFEST: EngineManifest = {
  id: 'user-store',
  version: '1.0.0',
  listensTo: ['WeightUpdated'],
  emits: [],
  dependsOn: [],
};

export function registerUserStore(core: Core): UserStore {
  const store = new UserStore(core);
  store.ensureUser();
  core.registry.register(USER_MODULE_MANIFEST, {
    WeightUpdated: (evt) => {
      const p = (evt as { payload: { weight?: number; measuredAt?: number } }).payload;
      if (typeof p.weight === 'number' && p.weight > 0) store.logWeight(p.weight, p.measuredAt);
    },
  });
  return store;
}

export type { Stored };
