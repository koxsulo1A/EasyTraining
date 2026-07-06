import type { ChangeSource, StorageAdapter, VersionRecord, VersionedEntity } from '../types';
import { uuid } from '../types';

export interface ChangeMeta {
  changedBy: ChangeSource;
  reason: string;
  confidence?: number; // domyślnie 1 (człowiek); AI podaje własną
}

/**
 * Repozytorium encji wersjonowanych (ADR-004).
 * Zmiana NIGDY nie nadpisuje danych: dopisujemy VersionRecord v+1
 * i przesuwamy wskaźnik currentVersionId. Historia zostaje w całości.
 */
export class VersionedRepo<T> {
  private headCol: string;
  private verCol: string;

  constructor(private storage: StorageAdapter, name: string) {
    this.headCol = name;                // np. "plans"
    this.verCol = name + '_versions';   // np. "plans_versions"
  }

  create(data: T, meta: ChangeMeta): VersionedEntity {
    const entityId = uuid();
    const ver = this.appendVersion(entityId, 1, data, meta);
    const head: VersionedEntity = { id: entityId, currentVersionId: ver.id };
    this.storage.put(this.headCol, head);
    return head;
  }

  /** Nowa wersja — jedyny sposób "edycji". */
  update(entityId: string, data: T, meta: ChangeMeta): VersionRecord<T> {
    const head = this.storage.get<VersionedEntity>(this.headCol, entityId);
    if (!head) throw new Error('VersionedRepo.update: nieznana encja ' + entityId);
    const latest = this.currentVersion(entityId);
    const ver = this.appendVersion(entityId, (latest?.version ?? 0) + 1, data, meta);
    this.storage.put(this.headCol, { ...head, currentVersionId: ver.id });
    return ver;
  }

  /** Soft-delete — encja znika z list, historia zostaje. */
  softDelete(entityId: string): void {
    const head = this.storage.get<VersionedEntity>(this.headCol, entityId);
    if (head) this.storage.put(this.headCol, { ...head, deleted: true });
  }

  get(entityId: string): T | null {
    const v = this.currentVersion(entityId);
    return v ? v.data : null;
  }

  currentVersion(entityId: string): VersionRecord<T> | null {
    const head = this.storage.get<VersionedEntity>(this.headCol, entityId);
    if (!head) return null;
    return this.storage.get<VersionRecord<T>>(this.verCol, head.currentVersionId);
  }

  history(entityId: string): VersionRecord<T>[] {
    return this.storage
      .getAll<VersionRecord<T>>(this.verCol)
      .filter((v) => v.entityId === entityId)
      .sort((a, b) => a.version - b.version);
  }

  listHeads(includeDeleted = false): VersionedEntity[] {
    return this.storage
      .getAll<VersionedEntity>(this.headCol)
      .filter((h) => includeDeleted || !h.deleted);
  }

  private appendVersion(entityId: string, version: number, data: T, meta: ChangeMeta): VersionRecord<T> {
    const rec: VersionRecord<T> = {
      id: uuid(),
      entityId,
      version,
      data,
      changedBy: meta.changedBy,
      reason: meta.reason,
      confidence: meta.confidence ?? 1,
      ts: Date.now(),
    };
    this.storage.put(this.verCol, rec);
    return rec;
  }
}
