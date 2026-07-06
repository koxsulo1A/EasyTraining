import type { Stored, StorageAdapter } from '../types';

/** Adapter pamięciowy — testy jednostkowe. */
export class MemoryAdapter implements StorageAdapter {
  private cols = new Map<string, Map<string, Stored>>();

  private col(name: string): Map<string, Stored> {
    let c = this.cols.get(name);
    if (!c) { c = new Map(); this.cols.set(name, c); }
    return c;
  }
  getAll<T extends Stored>(collection: string): T[] {
    return Array.from(this.col(collection).values()) as T[];
  }
  get<T extends Stored>(collection: string, id: string): T | null {
    return (this.col(collection).get(id) as T) ?? null;
  }
  put<T extends Stored>(collection: string, item: T): void {
    this.col(collection).set(item.id, item);
  }
  putMany<T extends Stored>(collection: string, items: T[]): void {
    for (const it of items) this.put(collection, it);
  }
  count(collection: string): number {
    return this.col(collection).size;
  }
}

/**
 * Adapter localStorage — działa dziś w aplikacji bez żadnych natywnych pluginów.
 * Każda kolekcja = klucz `etcore:<nazwa>` z tablicą JSON + indeks w pamięci.
 * ADR-002: docelowo na urządzeniu podmieniamy na SqliteAdapter (ten sam interfejs).
 */
export class LocalStorageAdapter implements StorageAdapter {
  private cache = new Map<string, Map<string, Stored>>();
  constructor(private prefix = 'etcore') {}

  private key(name: string): string { return this.prefix + ':' + name; }

  private col(name: string): Map<string, Stored> {
    let c = this.cache.get(name);
    if (c) return c;
    c = new Map();
    try {
      const raw = localStorage.getItem(this.key(name));
      if (raw) for (const it of JSON.parse(raw) as Stored[]) c.set(it.id, it);
    } catch { /* uszkodzone dane → zaczynamy od pustej kolekcji */ }
    this.cache.set(name, c);
    return c;
  }
  private flush(name: string): void {
    const c = this.col(name);
    try {
      localStorage.setItem(this.key(name), JSON.stringify(Array.from(c.values())));
    } catch { /* quota — dane zostają w pamięci; sync/SQLite rozwiąże docelowo */ }
  }
  getAll<T extends Stored>(collection: string): T[] {
    return Array.from(this.col(collection).values()) as T[];
  }
  get<T extends Stored>(collection: string, id: string): T | null {
    return (this.col(collection).get(id) as T) ?? null;
  }
  put<T extends Stored>(collection: string, item: T): void {
    this.col(collection).set(item.id, item);
    this.flush(collection);
  }
  putMany<T extends Stored>(collection: string, items: T[]): void {
    const c = this.col(collection);
    for (const it of items) c.set(it.id, it);
    this.flush(collection);
  }
  count(collection: string): number {
    return this.col(collection).size;
  }
}
