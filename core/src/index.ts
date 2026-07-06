import { EventBus } from './events/bus';
import { LocalStorageAdapter, MemoryAdapter } from './data/storage';
import { VersionedRepo } from './data/versioned';
import { migrateLegacy, type MigrationReport } from './data/migrate';
import type { EngineManifest, Score, StorageAdapter } from './types';
import { DECISION_HIERARCHY, uuid } from './types';

export interface Core {
  storage: StorageAdapter;
  bus: EventBus;
  plans: VersionedRepo<Record<string, unknown>>;
  goals: VersionedRepo<Record<string, unknown>>;
  registry: ModuleRegistry;
  scores: ScoreStore;
  migrate(rawLegacyJson: string | null): MigrationReport;
}

/** Module Registry (ADR-005): rejestracja silnika = manifest + auto-subskrypcje. */
class ModuleRegistry {
  private manifests = new Map<string, EngineManifest>();
  constructor(private bus: EventBus) {}

  register(manifest: EngineManifest, handlers: Record<string, (e: unknown) => void> = {}): void {
    if (this.manifests.has(manifest.id)) {
      throw new Error('ModuleRegistry: silnik już zarejestrowany: ' + manifest.id);
    }
    this.manifests.set(manifest.id, manifest);
    for (const type of manifest.listensTo) {
      const h = handlers[type];
      if (h) this.bus.on(type, (evt) => h(evt));
    }
  }
  list(): EngineManifest[] { return Array.from(this.manifests.values()); }
  has(id: string): boolean { return this.manifests.has(id); }
}

/** Magazyn Scores (ADR-006) — snapshoty wyników silników dla AI i UI. */
class ScoreStore {
  constructor(private storage: StorageAdapter) {}
  put(engineId: string, key: string, value: number, confidence: number, inputsHash = ''): Score {
    const s: Score = {
      id: uuid(), engineId, key,
      value: Math.max(0, Math.min(100, Math.round(value))),
      confidence, inputsHash, ts: Date.now(),
    };
    this.storage.put('scores', s);
    return s;
  }
  latest(engineId: string, key: string): Score | null {
    let best: Score | null = null;
    for (const s of this.storage.getAll<Score>('scores')) {
      if (s.engineId === engineId && s.key === key && (!best || s.ts >= best.ts)) best = s;
    }
    return best;
  }
}

export function createCore(storage?: StorageAdapter): Core {
  const st = storage ?? (typeof localStorage !== 'undefined' ? new LocalStorageAdapter() : new MemoryAdapter());
  const bus = new EventBus(st);
  return {
    storage: st,
    bus,
    plans: new VersionedRepo(st, 'plans'),
    goals: new VersionedRepo(st, 'goals'),
    registry: new ModuleRegistry(bus),
    scores: new ScoreStore(st),
    migrate: (raw) => migrateLegacy(st, raw),
  };
}

export { EventBus, LocalStorageAdapter, MemoryAdapter, VersionedRepo, migrateLegacy, DECISION_HIERARCHY, uuid };
export type { MigrationReport, EngineManifest, Score, StorageAdapter };

// Knowledge Base + silniki (Faza 1)
export { MUSCLES, muscleLabel, muscleGroup, engagementFromMuscles } from './knowledge/muscles';
export { analyzeWorkout, registerWorkoutEngine, latestAnalysis, WORKOUT_ENGINE_MANIFEST } from './engines/workout';
export type { WorkoutSession, WorkoutAnalysis, MuscleResolver } from './engines/workout';
export { computeFatigue, registerFatigueEngine, latestFatigue, FATIGUE_ENGINE_MANIFEST } from './engines/fatigue';
export type { FatigueResult } from './engines/fatigue';
export { computeRecovery, registerRecoveryEngine, latestRecovery, RECOVERY_ENGINE_MANIFEST } from './engines/recovery';
export type { RecoveryResult, SleepSample, WellbeingSample } from './engines/recovery';
export { computeProgress, registerProgressEngine, latestProgress, PROGRESS_ENGINE_MANIFEST } from './engines/progress';
export type { ProgressResult, ExerciseProgress, ProgressStatus } from './engines/progress';
export { forecastGoal, computeGoals, registerGoalEngine, latestGoals, GOAL_ENGINE_MANIFEST } from './engines/goal';
export type { GoalResult, GoalForecast, LinkedGoal, GoalProvider } from './engines/goal';
export { analyzeRun, registerRunningEngine, latestRun, RUNNING_ENGINE_MANIFEST } from './engines/running';
export type { RunAnalysis, RunSample } from './engines/running';
export { UserStore, registerUserStore, USER_MODULE_MANIFEST } from './data/user';
export type { UserProfile, WeightRecord, Sex } from './data/user';
export { syncRunningWorkouts } from './integrations/health';
export type { HealthProvider, HealthWorkout, ImportedRun, HealthSyncResult } from './integrations/health';
