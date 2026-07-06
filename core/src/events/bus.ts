import type { ChangeSource, DomainEvent, StorageAdapter } from '../types';
import { uuid } from '../types';

export type EventHandler = (e: DomainEvent) => void;

const EVENTS = 'events';

/**
 * Event Bus (ADR-003): każde publish trwale zapisuje zdarzenie (append-only log)
 * i synchronicznie powiadamia subskrybentów. Błąd jednego subskrybenta nie
 * blokuje pozostałych ani zapisu. Log = audyt + Warstwa 7 + przyszły outbox sync.
 */
export class EventBus {
  private handlers = new Map<string, Set<EventHandler>>(); // type -> handlers
  private anyHandlers = new Set<EventHandler>();

  constructor(private storage: StorageAdapter) {}

  publish<T>(type: string, payload: T, source: ChangeSource = 'system', schemaVersion = 1): DomainEvent<T> {
    const evt: DomainEvent<T> = { id: uuid(), type, payload, source, ts: Date.now(), schemaVersion };
    this.storage.put(EVENTS, evt);           // najpierw trwałość…
    this.dispatch(evt);                      // …potem reakcje
    return evt;
  }

  on(type: string, handler: EventHandler): () => void {
    let set = this.handlers.get(type);
    if (!set) { set = new Set(); this.handlers.set(type, set); }
    set.add(handler);
    return () => { set!.delete(handler); };
  }

  onAny(handler: EventHandler): () => void {
    this.anyHandlers.add(handler);
    return () => { this.anyHandlers.delete(handler); };
  }

  /** Zdarzenia od znacznika czasu — silnik dodany później może nadrobić historię. */
  since(ts: number, type?: string): DomainEvent[] {
    return this.storage
      .getAll<DomainEvent>(EVENTS)
      .filter((e) => e.ts >= ts && (!type || e.type === type))
      .sort((a, b) => a.ts - b.ts);
  }

  countAll(): number {
    return this.storage.count(EVENTS);
  }

  private dispatch(evt: DomainEvent): void {
    const targets = [
      ...(this.handlers.get(evt.type) ?? []),
      ...this.anyHandlers,
    ];
    for (const h of targets) {
      try { h(evt); } catch (err) {
        // Izolacja błędów: jeden zepsuty subskrybent nie może zatrzymać domina
        // eslint-disable-next-line no-console
        console.error('[EventBus] handler error for', evt.type, err);
      }
    }
  }
}
