"use strict";
var ETCore = (() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // core/src/index.ts
  var src_exports = {};
  __export(src_exports, {
    CARDIO_ZONES: () => CARDIO_ZONES,
    DECISION_HIERARCHY: () => DECISION_HIERARCHY,
    EXERCISE_ORDER_RULES: () => EXERCISE_ORDER_RULES,
    EventBus: () => EventBus,
    FATIGUE_ENGINE_MANIFEST: () => FATIGUE_ENGINE_MANIFEST,
    FLEXIBILITY_RX: () => FLEXIBILITY_RX,
    GOAL_ENGINE_MANIFEST: () => GOAL_ENGINE_MANIFEST,
    HYPERTROPHY_RULES: () => HYPERTROPHY_RULES,
    INTENSITY_ZONES: () => INTENSITY_ZONES,
    LEVEL_PROFILES: () => LEVEL_PROFILES,
    LocalStorageAdapter: () => LocalStorageAdapter,
    MUSCLES: () => MUSCLES,
    MemoryAdapter: () => MemoryAdapter,
    NEUROMOTOR_RX: () => NEUROMOTOR_RX,
    ORM_ENGINE_MANIFEST: () => ORM_ENGINE_MANIFEST,
    PCT_1RM_REPS: () => PCT_1RM_REPS,
    PCT_1RM_SOURCE: () => PCT_1RM_SOURCE,
    PERIODIZATION_BLOCKS: () => PERIODIZATION_BLOCKS,
    POPULATION_RULES: () => POPULATION_RULES,
    PROGRESS_ENGINE_MANIFEST: () => PROGRESS_ENGINE_MANIFEST,
    RECOVERY_ENGINE_MANIFEST: () => RECOVERY_ENGINE_MANIFEST,
    RESIDUAL_EFFECTS: () => RESIDUAL_EFFECTS,
    RUNNING_ENGINE_MANIFEST: () => RUNNING_ENGINE_MANIFEST,
    USER_MODULE_MANIFEST: () => USER_MODULE_MANIFEST,
    UserStore: () => UserStore,
    VersionedRepo: () => VersionedRepo,
    WEEKLY_VOLUME: () => WEEKLY_VOLUME,
    WORKOUT_ENGINE_MANIFEST: () => WORKOUT_ENGINE_MANIFEST,
    analyzeRun: () => analyzeRun,
    analyzeWorkout: () => analyzeWorkout,
    applyPopulation: () => applyPopulation,
    buildTrendNote: () => buildTrendNote,
    computeFatigue: () => computeFatigue,
    computeGoals: () => computeGoals,
    computeOrm: () => computeOrm,
    computeProgress: () => computeProgress,
    computeRecovery: () => computeRecovery,
    computeSeriesQuality: () => computeSeriesQuality,
    concurrentTrainingCheck: () => concurrentTrainingCheck,
    createCore: () => createCore,
    engagementFromMuscles: () => engagementFromMuscles,
    exerciseOrderScore: () => exerciseOrderScore,
    forecastGoal: () => forecastGoal,
    hrZone: () => hrZone,
    latestAnalysis: () => latestAnalysis,
    latestFatigue: () => latestFatigue,
    latestGoals: () => latestGoals,
    latestOrm: () => latestOrm,
    latestProgress: () => latestProgress,
    latestRecovery: () => latestRecovery,
    latestRun: () => latestRun,
    maxRepsAtPct: () => maxRepsAtPct,
    migrateLegacy: () => migrateLegacy,
    muscleGroup: () => muscleGroup,
    muscleLabel: () => muscleLabel,
    ormHistory: () => ormHistory,
    populationForAge: () => populationForAge,
    prescribe: () => prescribe,
    registerFatigueEngine: () => registerFatigueEngine,
    registerGoalEngine: () => registerGoalEngine,
    registerOrmEngine: () => registerOrmEngine,
    registerProgressEngine: () => registerProgressEngine,
    registerRecoveryEngine: () => registerRecoveryEngine,
    registerRunningEngine: () => registerRunningEngine,
    registerUserStore: () => registerUserStore,
    registerWorkoutEngine: () => registerWorkoutEngine,
    residualDecayPct: () => residualDecayPct,
    screen: () => screen,
    suggestLoad: () => suggestLoad,
    syncRunningWorkouts: () => syncRunningWorkouts,
    uuid: () => uuid,
    validateExerciseOrder: () => validateExerciseOrder
  });

  // core/src/types.ts
  var DECISION_HIERARCHY = {
    trainer: 4,
    user: 3,
    "ai-coach": 2,
    rule: 1,
    system: 0
  };
  function uuid() {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
      return crypto.randomUUID();
    }
    let s = "";
    for (let i = 0; i < 36; i++) {
      if (i === 8 || i === 13 || i === 18 || i === 23) s += "-";
      else if (i === 14) s += "4";
      else {
        const r = Math.random() * 16 | 0;
        s += (i === 19 ? r & 3 | 8 : r).toString(16);
      }
    }
    return s;
  }

  // core/src/events/bus.ts
  var EVENTS = "events";
  var EventBus = class {
    constructor(storage) {
      this.storage = storage;
      this.handlers = /* @__PURE__ */ new Map();
      // type -> handlers
      this.anyHandlers = /* @__PURE__ */ new Set();
    }
    publish(type, payload, source = "system", schemaVersion = 1) {
      const evt = { id: uuid(), type, payload, source, ts: Date.now(), schemaVersion };
      this.storage.put(EVENTS, evt);
      this.dispatch(evt);
      return evt;
    }
    on(type, handler) {
      let set = this.handlers.get(type);
      if (!set) {
        set = /* @__PURE__ */ new Set();
        this.handlers.set(type, set);
      }
      set.add(handler);
      return () => {
        set.delete(handler);
      };
    }
    onAny(handler) {
      this.anyHandlers.add(handler);
      return () => {
        this.anyHandlers.delete(handler);
      };
    }
    /** Zdarzenia od znacznika czasu — silnik dodany później może nadrobić historię. */
    since(ts, type) {
      return this.storage.getAll(EVENTS).filter((e) => e.ts >= ts && (!type || e.type === type)).sort((a, b) => a.ts - b.ts);
    }
    countAll() {
      return this.storage.count(EVENTS);
    }
    dispatch(evt) {
      const targets = [
        ...this.handlers.get(evt.type) ?? [],
        ...this.anyHandlers
      ];
      for (const h of targets) {
        try {
          h(evt);
        } catch (err) {
          console.error("[EventBus] handler error for", evt.type, err);
        }
      }
    }
  };

  // core/src/data/storage.ts
  var MemoryAdapter = class {
    constructor() {
      this.cols = /* @__PURE__ */ new Map();
    }
    col(name) {
      let c = this.cols.get(name);
      if (!c) {
        c = /* @__PURE__ */ new Map();
        this.cols.set(name, c);
      }
      return c;
    }
    getAll(collection) {
      return Array.from(this.col(collection).values());
    }
    get(collection, id) {
      return this.col(collection).get(id) ?? null;
    }
    put(collection, item) {
      this.col(collection).set(item.id, item);
    }
    putMany(collection, items) {
      for (const it of items) this.put(collection, it);
    }
    count(collection) {
      return this.col(collection).size;
    }
  };
  var LocalStorageAdapter = class {
    constructor(prefix = "etcore") {
      this.prefix = prefix;
      this.cache = /* @__PURE__ */ new Map();
    }
    key(name) {
      return this.prefix + ":" + name;
    }
    col(name) {
      let c = this.cache.get(name);
      if (c) return c;
      c = /* @__PURE__ */ new Map();
      try {
        const raw = localStorage.getItem(this.key(name));
        if (raw) for (const it of JSON.parse(raw)) c.set(it.id, it);
      } catch {
      }
      this.cache.set(name, c);
      return c;
    }
    flush(name) {
      const c = this.col(name);
      try {
        localStorage.setItem(this.key(name), JSON.stringify(Array.from(c.values())));
      } catch {
      }
    }
    getAll(collection) {
      return Array.from(this.col(collection).values());
    }
    get(collection, id) {
      return this.col(collection).get(id) ?? null;
    }
    put(collection, item) {
      this.col(collection).set(item.id, item);
      this.flush(collection);
    }
    putMany(collection, items) {
      const c = this.col(collection);
      for (const it of items) c.set(it.id, it);
      this.flush(collection);
    }
    count(collection) {
      return this.col(collection).size;
    }
  };

  // core/src/data/versioned.ts
  var VersionedRepo = class {
    constructor(storage, name) {
      this.storage = storage;
      this.headCol = name;
      this.verCol = name + "_versions";
    }
    create(data, meta) {
      const entityId = uuid();
      const ver = this.appendVersion(entityId, 1, data, meta);
      const head = { id: entityId, currentVersionId: ver.id };
      this.storage.put(this.headCol, head);
      return head;
    }
    /** Nowa wersja — jedyny sposób "edycji". */
    update(entityId, data, meta) {
      const head = this.storage.get(this.headCol, entityId);
      if (!head) throw new Error("VersionedRepo.update: nieznana encja " + entityId);
      const latest = this.currentVersion(entityId);
      const ver = this.appendVersion(entityId, (latest?.version ?? 0) + 1, data, meta);
      this.storage.put(this.headCol, { ...head, currentVersionId: ver.id });
      return ver;
    }
    /** Soft-delete — encja znika z list, historia zostaje. */
    softDelete(entityId) {
      const head = this.storage.get(this.headCol, entityId);
      if (head) this.storage.put(this.headCol, { ...head, deleted: true });
    }
    get(entityId) {
      const v = this.currentVersion(entityId);
      return v ? v.data : null;
    }
    currentVersion(entityId) {
      const head = this.storage.get(this.headCol, entityId);
      if (!head) return null;
      return this.storage.get(this.verCol, head.currentVersionId);
    }
    history(entityId) {
      return this.storage.getAll(this.verCol).filter((v) => v.entityId === entityId).sort((a, b) => a.version - b.version);
    }
    listHeads(includeDeleted = false) {
      return this.storage.getAll(this.headCol).filter((h) => includeDeleted || !h.deleted);
    }
    appendVersion(entityId, version, data, meta) {
      const rec = {
        id: uuid(),
        entityId,
        version,
        data,
        changedBy: meta.changedBy,
        reason: meta.reason,
        confidence: meta.confidence ?? 1,
        ts: Date.now()
      };
      this.storage.put(this.verCol, rec);
      return rec;
    }
  };

  // core/src/data/migrate.ts
  var FLAG_COL = "migrations";
  var FLAG_ID = "et_v1";
  function migrateLegacy(storage, rawLegacyJson) {
    const empty = { ran: false, workouts: 0, runs: 0, measurements: 0, plans: 0, goals: 0 };
    if (storage.get(FLAG_COL, FLAG_ID)) return empty;
    let legacy = {};
    if (rawLegacyJson) {
      try {
        legacy = JSON.parse(rawLegacyJson);
      } catch {
        legacy = {};
      }
    }
    const report = { ...empty, ran: true };
    const copyFlat = (items, col) => {
      if (!items || !items.length) return 0;
      const mapped = items.map((it) => ({ ...it, id: uuid(), legacyId: it["id"] ?? null }));
      storage.putMany(col, mapped);
      return mapped.length;
    };
    report.workouts = copyFlat(legacy.workouts, "workouts");
    report.runs = copyFlat(legacy.runs, "runs");
    report.measurements = copyFlat(legacy.measurements, "measurements");
    const plans = new VersionedRepo(storage, "plans");
    for (const p of legacy.customPlans ?? []) {
      plans.create({ ...p, legacyId: p.id ?? null }, { changedBy: "system", reason: "migracja et_v1" });
      report.plans++;
    }
    const goals = new VersionedRepo(storage, "goals");
    for (const g of legacy.goals ?? []) {
      goals.create({ ...g, legacyId: g.id ?? null }, { changedBy: "system", reason: "migracja et_v1" });
      report.goals++;
    }
    storage.put(FLAG_COL, { id: FLAG_ID, migratedAt: Date.now(), source: "et_v1" });
    return report;
  }

  // core/src/knowledge/muscles.ts
  var MUSCLES = [
    // Klatka piersiowa
    { id: "piersiowy_gorny", label: "Klatka g\xF3rna", group: "klatka_piersiowa" },
    { id: "piersiowy_srodkowy", label: "Klatka \u015Brodkowa", group: "klatka_piersiowa" },
    { id: "piersiowy_dolny", label: "Klatka dolna", group: "klatka_piersiowa" },
    { id: "piersiowy_wewnetrzny", label: "Klatka wewn\u0119trzna", group: "klatka_piersiowa" },
    { id: "piersiowy_zewnetrzny", label: "Klatka zewn\u0119trzna", group: "klatka_piersiowa" },
    // Plecy
    { id: "najszerszy_gorny", label: "Najszerszy (g\xF3ra)", group: "plecy" },
    { id: "najszerszy_srodkowy", label: "Najszerszy (\u015Brodek)", group: "plecy" },
    { id: "najszerszy_dolny", label: "Najszerszy (d\xF3\u0142)", group: "plecy" },
    { id: "prostownik_grzbietu", label: "Prostownik grzbietu", group: "plecy" },
    { id: "pulapki", label: "Czworoboczny (kaptur)", group: "plecy" },
    { id: "rownolegloboczny", label: "R\xF3wnoleg\u0142oboczny", group: "plecy" },
    { id: "obly_wiekszy", label: "Ob\u0142y wi\u0119kszy", group: "plecy" },
    // Nogi
    { id: "czworoglowy", label: "Czworog\u0142owy uda", group: "nogi" },
    { id: "posladkowy_wielki", label: "Po\u015Bladkowy wielki", group: "nogi" },
    { id: "posladkowy_sredni", label: "Po\u015Bladkowy \u015Bredni", group: "nogi" },
    { id: "dwuglowy_uda", label: "Dwug\u0142owy uda", group: "nogi" },
    { id: "przywodziciele", label: "Przywodziciele", group: "nogi" },
    // Biceps
    { id: "dwuglowy_ramienia", label: "Dwug\u0142owy ramienia", group: "biceps" },
    { id: "ramienny", label: "Ramienny", group: "biceps" },
    { id: "ramienno_promieniowy", label: "Ramienno-promieniowy", group: "biceps" },
    // Triceps
    { id: "trojglowy_dluga_glowa", label: "Triceps (d\u0142uga g\u0142owa)", group: "triceps" },
    { id: "trojglowy_boczna_glowa", label: "Triceps (boczna g\u0142owa)", group: "triceps" },
    { id: "trojglowy_przysrodkowa", label: "Triceps (przy\u015Brodkowa)", group: "triceps" },
    // Barki
    { id: "naramienny_przedni", label: "Naramienny przedni", group: "barki" },
    { id: "naramienny_srodkowy", label: "Naramienny \u015Brodkowy", group: "barki" },
    { id: "naramienny_tylny", label: "Naramienny tylny", group: "barki" },
    // Łydki
    { id: "brzuchaty", label: "Brzuchaty \u0142ydki", group: "lydki" },
    { id: "plaszczkowaty", label: "P\u0142aszczkowaty", group: "lydki" },
    // Przedramiona
    { id: "zginacze_nadgarstka", label: "Zginacze nadgarstka", group: "przedramiona" },
    { id: "prostowniki_nadgarstka", label: "Prostowniki nadgarstka", group: "przedramiona" },
    { id: "chwyt", label: "Si\u0142a chwytu", group: "przedramiona" },
    // Core / brzuch
    { id: "prosty_brzucha", label: "Prosty brzucha", group: "core_brzuch" },
    { id: "skosne", label: "Sko\u015Bne brzucha", group: "core_brzuch" },
    { id: "poprzeczny", label: "Poprzeczny brzucha", group: "core_brzuch" },
    { id: "prostownik_ledzwi", label: "Prostownik l\u0119d\u017Awi", group: "core_brzuch" }
  ];
  var byId = new Map(MUSCLES.map((m) => [m.id, m]));
  function muscleLabel(id) {
    return byId.get(id)?.label ?? id;
  }
  function muscleGroup(id) {
    return byId.get(id)?.group ?? null;
  }
  function engagementFromMuscles(muscles) {
    const out = {};
    if (!muscles.length) return out;
    if (muscles.length === 1) {
      out[muscles[0]] = 100;
      return out;
    }
    const MAIN = 65;
    const rest = (100 - MAIN) / (muscles.length - 1);
    muscles.forEach((m, i) => {
      out[m] = i === 0 ? MAIN : Math.round(rest * 100) / 100;
    });
    return out;
  }

  // core/src/engines/workout.ts
  function e1rm(weight, reps) {
    if (!weight || !reps) return 0;
    return Math.round(weight * (1 + reps / 30) * 10) / 10;
  }
  function analyzeWorkout(session, resolve) {
    let totalVolume = 0, setsDone = 0, setsTotal = 0;
    const perMuscle = {};
    const perGroup = {};
    const perExercise = {};
    const sessionRpes = [];
    for (const ex of session.exercises ?? []) {
      const engagement = engagementFromMuscles(resolve(ex.name));
      const exStat = perExercise[ex.name] ?? { e1rm: 0, bestWeight: 0, volume: 0, avgRpe: null };
      const exRpes = [];
      for (const s of ex.setsData ?? []) {
        setsTotal++;
        if (!s.done) continue;
        setsDone++;
        const vol = (s.weight ?? 0) * (s.reps ?? 0);
        totalVolume += vol;
        exStat.volume += vol;
        exStat.e1rm = Math.max(exStat.e1rm, e1rm(s.weight ?? 0, s.reps ?? 0));
        exStat.bestWeight = Math.max(exStat.bestWeight, s.weight ?? 0);
        if (typeof s.rpe === "number" && s.rpe > 0) {
          exRpes.push(s.rpe);
          sessionRpes.push(s.rpe);
        }
        for (const [mId, pct] of Object.entries(engagement)) {
          const share = vol * pct / 100;
          perMuscle[mId] = (perMuscle[mId] ?? 0) + share;
          const g = muscleGroup(mId);
          if (g) perGroup[g] = (perGroup[g] ?? 0) + share;
        }
      }
      exStat.avgRpe = exRpes.length ? Math.round(exRpes.reduce((a, b) => a + b, 0) / exRpes.length * 10) / 10 : null;
      if (exStat.volume > 0) perExercise[ex.name] = exStat;
    }
    const avgRpe = sessionRpes.length ? Math.round(sessionRpes.reduce((a, b) => a + b, 0) / sessionRpes.length * 10) / 10 : null;
    const round = (n) => Math.round(n * 10) / 10;
    for (const k of Object.keys(perMuscle)) perMuscle[k] = round(perMuscle[k]);
    for (const k of Object.keys(perGroup)) perGroup[k] = round(perGroup[k]);
    return {
      id: uuid(),
      workoutId: session.id ?? null,
      date: session.date ?? null,
      ts: Date.now(),
      totalVolume: round(totalVolume),
      setsDone,
      setsTotal,
      completionPct: setsTotal ? Math.round(setsDone / setsTotal * 100) : 0,
      avgLoadPerSet: setsDone ? round(totalVolume / setsDone) : 0,
      perMuscle,
      perGroup,
      perExercise,
      avgRpe
    };
  }
  var WORKOUT_ENGINE_MANIFEST = {
    id: "workout-engine",
    version: "1.0.0",
    listensTo: ["WorkoutFinished"],
    emits: ["WorkoutAnalyzed"],
    dependsOn: []
  };
  var ANALYSIS_COL = "workout_analysis";
  function registerWorkoutEngine(core, resolve) {
    core.registry.register(WORKOUT_ENGINE_MANIFEST, {
      WorkoutFinished: (evt) => {
        const session = evt.payload;
        const analysis = analyzeWorkout(session, resolve);
        core.storage.put(ANALYSIS_COL, analysis);
        core.scores.put("workout-engine", "session-completion", analysis.completionPct, 1, String(analysis.workoutId ?? ""));
        if (analysis.avgRpe != null) core.scores.put("workout-engine", "intensity-rpe", analysis.avgRpe * 10, 0.9, String(analysis.workoutId ?? ""));
        core.bus.publish("WorkoutAnalyzed", analysis, "system");
      }
    });
  }
  function latestAnalysis(core) {
    let best = null;
    for (const a of core.storage.getAll(ANALYSIS_COL)) {
      if (!best || a.ts >= best.ts) best = a;
    }
    return best;
  }

  // core/src/engines/fatigue.ts
  var DAY = 864e5;
  function rpeFactor(avgRpe) {
    if (avgRpe == null) return 1;
    return Math.max(0.7, Math.min(1.4, avgRpe / 7));
  }
  function computeFatigue(analyses, now) {
    const acute = {};
    const chronic = {};
    for (const a of analyses) {
      const age = now - a.ts;
      if (age < 0 || age > 28 * DAY) continue;
      const f = rpeFactor(a.avgRpe);
      for (const [g, v0] of Object.entries(a.perGroup ?? {})) {
        const v = v0 * f;
        chronic[g] = (chronic[g] ?? 0) + v;
        if (age <= 7 * DAY) acute[g] = (acute[g] ?? 0) + v;
      }
    }
    const perGroup = {};
    let sumPct = 0, n = 0;
    for (const g of Object.keys(chronic)) {
      const ch = (chronic[g] ?? 0) / 4;
      const ac = acute[g] ?? 0;
      const ratio = ch > 0 ? ac / ch : 0;
      const pct = Math.max(0, Math.min(100, Math.round(ratio * 50)));
      perGroup[g] = {
        acute: Math.round(ac * 10) / 10,
        chronic: Math.round(ch * 10) / 10,
        ratio: Math.round(ratio * 100) / 100,
        fatiguePct: pct
      };
      sumPct += pct;
      n++;
    }
    const overall = n ? Math.round(sumPct / n) : 0;
    return {
      ts: now,
      perGroup,
      overallPct: overall,
      level: overall < 40 ? "niskie" : overall < 70 ? "srednie" : "duze"
    };
  }
  var FATIGUE_ENGINE_MANIFEST = {
    id: "fatigue-engine",
    version: "1.0.0",
    listensTo: ["WorkoutAnalyzed"],
    emits: ["FatigueUpdated"],
    dependsOn: ["workout-engine"]
    // wyłącznie przez jego artefakty (nie wywołania)
  };
  function registerFatigueEngine(core) {
    core.registry.register(FATIGUE_ENGINE_MANIFEST, {
      WorkoutAnalyzed: () => {
        const analyses = core.storage.getAll("workout_analysis");
        const result = computeFatigue(analyses, Date.now());
        core.scores.put("fatigue-engine", "overall", result.overallPct, analyses.length >= 8 ? 0.85 : 0.5);
        core.storage.put("fatigue_snapshots", { id: "latest", ...result });
        core.bus.publish("FatigueUpdated", result, "system");
      }
    });
  }
  function latestFatigue(core) {
    return core.storage.get("fatigue_snapshots", "latest");
  }

  // core/src/engines/recovery.ts
  var DAY2 = 864e5;
  var clamp01 = (n) => Math.max(0, Math.min(1, n));
  function computeRecovery(sleep, wellbeing, now) {
    const recentS = sleep.filter((s) => now - s.ts <= 7 * DAY2 && now - s.ts >= 0);
    const recentW = wellbeing.filter((w) => now - w.ts <= 7 * DAY2 && now - w.ts >= 0);
    const avg = (xs) => xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : void 0;
    const durationH = avg(recentS.map((s) => s.durationH).filter((x) => x != null));
    const quality = avg(recentS.map((s) => s.quality).filter((x) => x != null));
    const energy = avg(recentW.map((w) => w.energy).filter((x) => x != null));
    const stress = avg(recentW.map((w) => w.stress).filter((x) => x != null));
    const mood = avg(recentW.map((w) => w.mood).filter((x) => x != null));
    const motivation = avg(recentW.map((w) => w.motivation).filter((x) => x != null));
    const components = {};
    if (durationH != null) components.sleep = clamp01(durationH / 8);
    if (quality != null) components.quality = clamp01(quality / 10);
    if (energy != null) components.energy = clamp01(energy / 10);
    if (stress != null) components.stress = clamp01((10 - stress) / 10);
    if (mood != null) components.mood = clamp01(mood / 10);
    if (motivation != null) components.motivation = clamp01(motivation / 10);
    const vals = Object.values(components);
    const readiness = vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length * 100) : 0;
    return {
      ts: now,
      readinessPct: readiness,
      components,
      samples: { sleep: recentS.length, wellbeing: recentW.length }
    };
  }
  var RECOVERY_ENGINE_MANIFEST = {
    id: "recovery-engine",
    version: "1.0.0",
    listensTo: ["SleepLogged", "WellbeingLogged"],
    emits: ["RecoveryUpdated"],
    dependsOn: []
  };
  var SLEEP_COL = "sleep_samples";
  var WB_COL = "wellbeing_samples";
  function registerRecoveryEngine(core) {
    const recompute = () => {
      const result = computeRecovery(
        core.storage.getAll(SLEEP_COL),
        core.storage.getAll(WB_COL),
        Date.now()
      );
      const n = result.samples.sleep + result.samples.wellbeing;
      core.scores.put("recovery-engine", "readiness", result.readinessPct, n >= 5 ? 0.85 : 0.5);
      core.storage.put("recovery_snapshots", { id: "latest", ...result });
      core.bus.publish("RecoveryUpdated", result, "system");
    };
    core.registry.register(RECOVERY_ENGINE_MANIFEST, {
      SleepLogged: (evt) => {
        const p = evt.payload;
        core.storage.put(SLEEP_COL, { id: uuid(), ts: Date.now(), durationH: p.duration ?? 0, quality: p.quality });
        recompute();
      },
      WellbeingLogged: (evt) => {
        const p = evt.payload;
        core.storage.put(WB_COL, { id: uuid(), ts: Date.now(), ...p });
        recompute();
      }
    });
  }
  function latestRecovery(core) {
    return core.storage.get("recovery_snapshots", "latest");
  }

  // core/src/engines/progress.ts
  var DAY3 = 864e5;
  var WINDOW = 84 * DAY3;
  function slopePerWeek(pts) {
    const n = pts.length;
    if (n < 2) return 0;
    const xs = pts.map((p) => p.ts / (7 * DAY3));
    const ys = pts.map((p) => p.v);
    const mx = xs.reduce((a, b) => a + b, 0) / n;
    const my = ys.reduce((a, b) => a + b, 0) / n;
    let num = 0, den = 0;
    for (let i = 0; i < n; i++) {
      num += (xs[i] - mx) * (ys[i] - my);
      den += (xs[i] - mx) ** 2;
    }
    return den > 0 ? num / den : 0;
  }
  function classify(trend, current, points, spanDays) {
    if (points < 2 || spanDays < 3) return "za-malo-danych";
    const pctPerWeek = current > 0 ? trend / current * 100 : 0;
    if (pctPerWeek > 5) return "nierealny";
    if (pctPerWeek > 1.5) return "szybki";
    if (trend < -0.25) return "regres";
    if (Math.abs(pctPerWeek) <= 0.3) return points >= 4 ? "plateau" : "stagnacja";
    return "progres";
  }
  function computeProgress(analyses, now) {
    const series = /* @__PURE__ */ new Map();
    for (const a of analyses) {
      if (now - a.ts > WINDOW || now - a.ts < 0) continue;
      for (const [name, st] of Object.entries(a.perExercise ?? {})) {
        if (st.e1rm <= 0) continue;
        let arr = series.get(name);
        if (!arr) {
          arr = [];
          series.set(name, arr);
        }
        arr.push({ ts: a.ts, v: st.e1rm });
      }
    }
    const perExercise = [];
    let positive = 0, classified = 0;
    for (const [exercise, ptsRaw] of series) {
      const pts = ptsRaw.sort((a, b) => a.ts - b.ts);
      const current = pts[pts.length - 1].v;
      const spanDays = (pts[pts.length - 1].ts - pts[0].ts) / DAY3;
      const status0 = classify(0, current, pts.length, spanDays);
      const trend = status0 === "za-malo-danych" ? 0 : Math.round(slopePerWeek(pts) * 100) / 100;
      const status = classify(trend, current, pts.length, spanDays);
      perExercise.push({ exercise, points: pts.length, currentE1rm: current, trendPerWeek: trend, status });
      if (status !== "za-malo-danych") {
        classified++;
        if (status === "progres" || status === "szybki") positive++;
      }
    }
    perExercise.sort((a, b) => b.points - a.points);
    return {
      ts: now,
      perExercise,
      progressingPct: classified ? Math.round(positive / classified * 100) : 0
    };
  }
  var PROGRESS_ENGINE_MANIFEST = {
    id: "progress-engine",
    version: "1.0.0",
    listensTo: ["WorkoutAnalyzed"],
    emits: ["ProgressUpdated"],
    dependsOn: ["workout-engine"]
  };
  function registerProgressEngine(core) {
    core.registry.register(PROGRESS_ENGINE_MANIFEST, {
      WorkoutAnalyzed: () => {
        const analyses = core.storage.getAll("workout_analysis");
        const result = computeProgress(analyses, Date.now());
        const classified = result.perExercise.filter((p) => p.status !== "za-malo-danych").length;
        core.scores.put("progress-engine", "progressing", result.progressingPct, classified >= 3 ? 0.8 : 0.4);
        core.storage.put("progress_snapshots", { id: "latest", ...result });
        core.bus.publish("ProgressUpdated", result, "system");
      }
    });
  }
  function latestProgress(core) {
    return core.storage.get("progress_snapshots", "latest");
  }

  // core/src/engines/goal.ts
  var WEEK = 7 * 864e5;
  function forecastGoal(goal, current, trendPerWeek, now) {
    const progressPct = goal.target > 0 ? Math.min(100, Math.round(current / goal.target * 100)) : 0;
    let probabilityPct;
    let etaTs = null;
    if (current >= goal.target && goal.target > 0) {
      probabilityPct = 100;
      etaTs = now;
    } else if (trendPerWeek <= 0) {
      probabilityPct = current > 0 ? 15 : 5;
    } else {
      const weeks = (goal.target - current) / trendPerWeek;
      etaTs = now + Math.round(weeks * WEEK);
      probabilityPct = weeks <= 4 ? 92 : weeks <= 12 ? 78 : weeks <= 26 ? 55 : 30;
    }
    return {
      goalId: goal.id,
      title: goal.title,
      current: Math.round(current * 10) / 10,
      target: goal.target,
      progressPct,
      trendPerWeek,
      probabilityPct,
      etaTs
    };
  }
  function computeGoals(goals, progress, now) {
    const forecasts = [];
    for (const g of goals) {
      if (!g.target || g.target <= 0) continue;
      let current = g.current ?? 0;
      let trend = 0;
      if (g.exercise && progress) {
        const p = progress.perExercise.find((x) => x.exercise === g.exercise);
        if (p) {
          current = Math.max(current, p.currentE1rm);
          trend = p.trendPerWeek;
        }
      }
      forecasts.push(forecastGoal(g, current, trend, now));
    }
    return { ts: now, forecasts };
  }
  var GOAL_ENGINE_MANIFEST = {
    id: "goal-engine",
    version: "1.0.0",
    listensTo: ["ProgressUpdated"],
    emits: ["GoalsForecasted"],
    dependsOn: ["progress-engine"]
  };
  function registerGoalEngine(core, getGoals) {
    core.registry.register(GOAL_ENGINE_MANIFEST, {
      ProgressUpdated: (evt) => {
        const progress = evt.payload;
        const result = computeGoals(getGoals(), progress, Date.now());
        if (result.forecasts.length) {
          const avgProb = Math.round(result.forecasts.reduce((a, f) => a + f.probabilityPct, 0) / result.forecasts.length);
          core.scores.put("goal-engine", "avg-probability", avgProb, 0.7);
        }
        core.storage.put("goal_snapshots", { id: "latest", ...result });
        core.bus.publish("GoalsForecasted", result, "system");
      }
    });
  }
  function latestGoals(core) {
    return core.storage.get("goal_snapshots", "latest");
  }

  // core/src/engines/running.ts
  var DAY4 = 864e5;
  function analyzeRun(run, history, now) {
    let acute = run.km, chronic = run.km;
    for (const s of history) {
      const age = now - s.ts;
      if (age < 0 || age > 28 * DAY4) continue;
      chronic += s.km;
      if (age <= 7 * DAY4) acute += s.km;
    }
    const chronicWeekly = chronic / 4;
    const ratio = chronicWeekly > 0 ? acute / chronicWeekly : 0;
    return {
      ts: now,
      km: run.km,
      paceSecPerKm: run.km > 0 && run.durationMin > 0 ? Math.round(run.durationMin * 60 / run.km) : null,
      weeklyKm: Math.round(acute * 10) / 10,
      chronicWeeklyKm: Math.round(chronicWeekly * 10) / 10,
      rampRatio: Math.round(ratio * 100) / 100,
      riskPct: Math.max(0, Math.min(100, Math.round(ratio * 50)))
    };
  }
  var RUNNING_ENGINE_MANIFEST = {
    id: "running-engine",
    version: "1.0.0",
    listensTo: ["RunFinished"],
    emits: ["RunAnalyzed"],
    dependsOn: []
  };
  var COL = "run_samples";
  function registerRunningEngine(core) {
    core.registry.register(RUNNING_ENGINE_MANIFEST, {
      RunFinished: (evt) => {
        const p = evt.payload;
        const run = { km: p.distance ?? 0, durationMin: p.duration ?? 0, avgHr: p.avgHr };
        const history = core.storage.getAll(COL);
        const analysis = analyzeRun(run, history, Date.now());
        core.storage.put(COL, { id: uuid(), ts: analysis.ts, km: run.km, durationMin: run.durationMin, avgHr: run.avgHr });
        core.scores.put("running-engine", "ramp-risk", analysis.riskPct, history.length >= 6 ? 0.8 : 0.4);
        core.storage.put("running_snapshots", { id: "latest", ...analysis });
        core.bus.publish("RunAnalyzed", analysis, "system");
      }
    });
  }
  function latestRun(core) {
    return core.storage.get("running_snapshots", "latest");
  }

  // core/src/data/user.ts
  var USER_COL = "users";
  var WEIGHT_COL = "weight_history";
  var SINGLE_USER = "me";
  var UserStore = class {
    constructor(core) {
      this.core = core;
    }
    ensureUser() {
      let u = this.core.storage.get(USER_COL, SINGLE_USER);
      if (!u) {
        u = { id: SINGLE_USER };
        this.core.storage.put(USER_COL, u);
      }
      return u;
    }
    updateProfile(patch) {
      const next = { ...this.ensureUser(), ...patch };
      this.core.storage.put(USER_COL, next);
      return next;
    }
    /** Nowy pomiar masy — zawsze dopisywany, nigdy nadpisywany. */
    logWeight(weight, measuredAt = Date.now()) {
      this.ensureUser();
      const rec = { id: uuid(), userId: SINGLE_USER, weight, measuredAt };
      this.core.storage.put(WEIGHT_COL, rec);
      return rec;
    }
    /** Korekta błędnego wpisu — stary zostaje (superseded), powstaje nowa wersja. */
    editWeight(recordId, newWeight) {
      const old = this.core.storage.get(WEIGHT_COL, recordId);
      if (!old || old.supersededBy) return null;
      const corrected = { id: uuid(), userId: old.userId, weight: newWeight, measuredAt: old.measuredAt, supersedes: old.id };
      this.core.storage.put(WEIGHT_COL, { ...old, supersededBy: corrected.id });
      this.core.storage.put(WEIGHT_COL, corrected);
      return corrected;
    }
    /** Aktualne (nieprzedawnione) wpisy, od najstarszego. */
    weightHistory() {
      return this.core.storage.getAll(WEIGHT_COL).filter((r) => !r.supersededBy).sort((a, b) => a.measuredAt - b.measuredAt);
    }
    /** Reguła TOM II: aktualna masa = ostatni wpis historii. */
    currentWeight() {
      const h = this.weightHistory();
      return h.length ? h[h.length - 1].weight : null;
    }
  };
  var USER_MODULE_MANIFEST = {
    id: "user-store",
    version: "1.0.0",
    listensTo: ["WeightUpdated"],
    emits: [],
    dependsOn: []
  };
  function registerUserStore(core) {
    const store = new UserStore(core);
    store.ensureUser();
    core.registry.register(USER_MODULE_MANIFEST, {
      WeightUpdated: (evt) => {
        const p = evt.payload;
        if (typeof p.weight === "number" && p.weight > 0) store.logWeight(p.weight, p.measuredAt);
      }
    });
    return store;
  }

  // core/src/integrations/health.ts
  var CURSOR = "health_cursor";
  var IMPORTS = "health_imports";
  async function syncRunningWorkouts(core, provider, onRun) {
    const cursor = core.storage.get(CURSOR, "apple") ?? { id: "apple", lastTs: 0 };
    const result = { available: false, authorized: false, imported: 0, skipped: 0, lastTs: cursor.lastTs };
    if (!await provider.isAvailable()) return result;
    result.available = true;
    if (!await provider.requestAuth()) return result;
    result.authorized = true;
    const workouts = await provider.getRunningWorkouts(cursor.lastTs);
    let maxTs = cursor.lastTs;
    for (const w of workouts) {
      maxTs = Math.max(maxTs, w.startTs);
      const extId = w.externalId ?? `${w.startTs}_${w.distanceKm ?? 0}`;
      if (core.storage.get(IMPORTS, extId)) {
        result.skipped++;
        continue;
      }
      core.storage.put(IMPORTS, { id: extId });
      const run = {
        externalId: extId,
        distance: Math.round((w.distanceKm ?? 0) * 100) / 100,
        duration: Math.round(w.durationMin ?? 0),
        avgHr: w.avgHr,
        date: new Date(w.startTs).toISOString().slice(0, 10),
        source: w.source ?? "apple-health"
      };
      onRun?.(run);
      core.bus.publish("RunFinished", { distance: run.distance, duration: run.duration, avgHr: run.avgHr }, "system");
      result.imported++;
    }
    core.storage.put(CURSOR, { id: "apple", lastTs: maxTs });
    result.lastTs = maxTs;
    return result;
  }

  // core/src/engines/orm.ts
  var epley = {
    id: "epley",
    compute: (w, r) => r === 1 ? w : w * (1 + r / 30),
    optimalRange: [5, 10],
    typicalErrorPct: 3.5
  };
  var brzycki = {
    id: "brzycki",
    compute: (w, r) => {
      if (r >= 37) return w;
      return w * (36 / (37 - r));
    },
    optimalRange: [2, 10],
    typicalErrorPct: 3.2
  };
  var lombardi = {
    id: "lombardi",
    compute: (w, r) => w * Math.pow(r, 0.1),
    optimalRange: [1, 5],
    typicalErrorPct: 4.1
  };
  var mayhew = {
    id: "mayhew",
    compute: (w, r) => 100 * w / (52.2 + 41.9 * Math.exp(-0.055 * r)),
    optimalRange: [8, 15],
    typicalErrorPct: 3.8
  };
  var oconnor = {
    id: "oconnor",
    compute: (w, r) => w * (1 + 0.025 * r),
    optimalRange: [4, 12],
    typicalErrorPct: 4.5
  };
  var lander = {
    id: "lander",
    compute: (w, r) => 100 * w / (101.3 - 2.67123 * r),
    optimalRange: [3, 10],
    typicalErrorPct: 3.6
  };
  var wathan = {
    id: "wathan",
    compute: (w, r) => 100 * w / (48.8 + 53.8 * Math.exp(-0.075 * r)),
    optimalRange: [6, 15],
    typicalErrorPct: 3.9
  };
  var ORM_MODELS = {
    epley,
    brzycki,
    lombardi,
    mayhew,
    oconnor,
    lander,
    wathan
  };
  function rpeToEstimatedRIR(rpe) {
    if (rpe >= 10) return 0;
    if (rpe >= 9) return 0.5;
    if (rpe >= 8) return 1;
    if (rpe >= 7) return 2;
    return 3.5;
  }
  function rirCorrectionFactor(rirDelta) {
    const clamped = Math.max(-2, Math.min(2, rirDelta));
    return 1 + clamped * 0.025;
  }
  function effectiveReps(reps, plannedRIR) {
    return reps + plannedRIR;
  }
  function selectModelsForReps(effReps) {
    const candidates = Object.values(ORM_MODELS).map((m) => {
      const [lo, hi] = m.optimalRange;
      let rangeScore;
      if (effReps >= lo && effReps <= hi) {
        const mid = (lo + hi) / 2;
        rangeScore = 1 - Math.abs(effReps - mid) / ((hi - lo) / 2 + 1);
      } else {
        const dist = effReps < lo ? lo - effReps : effReps - hi;
        rangeScore = Math.max(0, 1 - dist * 0.15);
      }
      const weight = rangeScore / m.typicalErrorPct;
      return { model: m, weight };
    });
    const valid = candidates.filter((c) => c.weight > 0);
    const total = valid.reduce((s, c) => s + c.weight, 0);
    return valid.map((c) => ({ model: c.model, weight: c.weight / total })).sort((a, b) => b.weight - a.weight);
  }
  function estimateOrmFromSet(weight, effReps) {
    const models = selectModelsForReps(effReps);
    let orm = 0;
    for (const { model, weight: w } of models) {
      orm += model.compute(weight, effReps) * w;
    }
    const top = models[0];
    return {
      orm,
      modelUsed: top ? top.model.id : "epley",
      weights: models.map((m) => ({ id: m.model.id, w: +m.weight.toFixed(3) }))
    };
  }

  // core/src/engines/orm-quality.ts
  function computeSeriesQuality(f) {
    let repRange;
    const er = f.effectiveReps;
    if (er >= 3 && er <= 10) {
      repRange = 25;
    } else if (er === 2 || er >= 11 && er <= 12) {
      repRange = 18;
    } else if (er === 1 || er >= 13 && er <= 15) {
      repRange = 10;
    } else if (er > 15) {
      repRange = Math.max(0, 10 - (er - 15) * 1.5);
    } else {
      repRange = 5;
    }
    let rirDelta = 0;
    if (f.rpe !== null) {
      const estimatedRIR = rpeToEstimatedRIR(f.rpe);
      const delta = Math.abs(estimatedRIR - f.plannedRIR);
      rirDelta = Math.max(0, 25 - delta * 8.33);
    } else {
      rirDelta = 12;
    }
    const compoundBonus = f.isCompound ? 15 : 0;
    const fatiguePenalty = -Math.round(f.fatigueScore / 100 * 20);
    const volumePenalty = -Math.round(Math.min(15, f.cumulativeSetVolume / 5e3 * 15));
    const rpePresence = f.rpe !== null ? 10 : 0;
    const frequencyBonus = Math.min(10, Math.max(0, (f.weeklyFrequency - 1) * 5));
    const total = Math.max(
      0,
      Math.min(
        100,
        Math.round(
          repRange + rirDelta + compoundBonus + fatiguePenalty + volumePenalty + rpePresence + frequencyBonus
        )
      )
    );
    return { total, repRange, rirDelta, compoundBonus, fatiguePenalty, volumePenalty, rpePresence, frequencyBonus };
  }
  function weightSets(sets) {
    if (sets.length === 0) return [];
    const MIN_QUALITY = 20;
    const orms = sets.map((s) => s.orm);
    const median = medianOf(orms);
    const mads = orms.map((v) => Math.abs(v - median));
    const mad = medianOf(mads);
    const results = sets.map((s) => {
      const mz = mad > 0 ? 0.6745 * (s.orm - median) / mad : 0;
      const isOutlier = Math.abs(mz) > 3.5 || s.qualityScore < MIN_QUALITY;
      return {
        orm: s.orm,
        qualityScore: s.qualityScore,
        isOutlier,
        finalWeight: isOutlier ? 0 : s.qualityScore
      };
    });
    const totalW = results.reduce((sum, r) => sum + r.finalWeight, 0);
    if (totalW > 0) {
      for (const r of results) {
        r.finalWeight = r.finalWeight / totalW;
      }
    } else {
      const n = results.length;
      for (const r of results) {
        r.isOutlier = false;
        r.finalWeight = 1 / n;
      }
    }
    return results;
  }
  function medianOf(arr) {
    const sorted = [...arr].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    if (sorted.length === 0) return 0;
    return sorted.length % 2 === 0 ? ((sorted[mid - 1] ?? 0) + (sorted[mid] ?? 0)) / 2 : sorted[mid] ?? 0;
  }

  // core/src/engines/orm-ensemble.ts
  function analyzeSet(set, setIndex, exercise, fatigueScore, cumulativeVolume, weeklyFrequency) {
    const plannedRIR = set.plannedRIR ?? 0;
    const effReps = effectiveReps(set.reps, plannedRIR);
    const rpe = set.rpe ?? null;
    const { orm: rawOrm, modelUsed } = estimateOrmFromSet(set.weight, effReps);
    let estimatedRIR = null;
    let rirDelta = null;
    let correctionFactor = 1;
    if (rpe !== null) {
      estimatedRIR = rpeToEstimatedRIR(rpe);
      rirDelta = estimatedRIR - plannedRIR;
      correctionFactor = rirCorrectionFactor(rirDelta);
    }
    const corrected1rm = rawOrm * correctionFactor;
    const qFactors = {
      effectiveReps: effReps,
      plannedRIR,
      rpe,
      isCompound: exercise.isCompound,
      fatigueScore,
      cumulativeSetVolume: cumulativeVolume,
      weeklyFrequency
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
      corrected1rm
    };
  }
  function bayesianUpdate(currentOrm, previousOrm) {
    const relDiff = Math.abs(currentOrm - previousOrm) / previousOrm;
    const priorWeight = relDiff > 0.1 ? 0.15 : 0.3;
    const likelW = 1 - priorWeight;
    return currentOrm * likelW + previousOrm * priorWeight;
  }
  function computeConfidence(analyses, usedSets) {
    if (analyses.length === 0) return 0;
    const nonOutliers = analyses.filter((a) => {
      return a.qualityScore >= 20;
    });
    const n = nonOutliers.length;
    if (n === 0) return 20;
    const avgQuality = nonOutliers.reduce((s, a) => s + a.qualityScore, 0) / n;
    const setCountBonus = Math.min(20, usedSets * 5);
    const orms = nonOutliers.map((a) => a.corrected1rm);
    const mean = orms.reduce((s, v) => s + v, 0) / orms.length;
    const variance = orms.reduce((s, v) => s + (v - mean) ** 2, 0) / orms.length;
    const cv = mean > 0 ? Math.sqrt(variance) / mean : 1;
    const consistencyBonus = Math.max(0, 20 - cv * 200);
    const rpeBonus = nonOutliers.some((a) => a.rpe !== null) ? 10 : 0;
    const raw = avgQuality / 100 * 50 + setCountBonus + consistencyBonus + rpeBonus;
    return Math.max(0, Math.min(100, Math.round(raw)));
  }
  function buildTrendNote(currentOrm, previousOrm, deltaHistory) {
    if (!previousOrm) return null;
    const delta = currentOrm - previousOrm;
    const pct = Math.abs(delta) / previousOrm;
    if (pct < 0.01) return null;
    const deltaStr = (delta > 0 ? "+" : "") + delta.toFixed(1) + " kg";
    if (delta > 0) {
      if (deltaHistory.length >= 2 && deltaHistory.slice(-2).every((d) => d > 0)) {
        return `Szacowany 1RM wzr\xF3s\u0142 o ${delta.toFixed(1)} kg od poprzedniego treningu. AI Engine wykry\u0142 stabilny trend wzrostowy si\u0142y.`;
      }
      return `Szacowany 1RM wzr\xF3s\u0142 o ${delta.toFixed(1)} kg od poprzedniego treningu.`;
    } else {
      if (deltaHistory.length >= 2 && (deltaHistory[deltaHistory.length - 1] ?? 0) > 0) {
        return `Tempo wzrostu si\u0142y spad\u0142o (${deltaStr}). Rozwa\u017C deload lub zmian\u0119 obj\u0119to\u015Bci treningowej.`;
      }
      return `Szacowany 1RM spad\u0142 o ${Math.abs(delta).toFixed(1)} kg od poprzedniego treningu.`;
    }
  }
  function computeOrm(input, deltaHistory = []) {
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
        methodSummary: "Brak serii",
        trendNote: null
      };
    }
    let cumulativeVolume = sessionVolume;
    const analyses = sets.map((set, i) => {
      const a = analyzeSet(set, i, exercise, fatigueScore, cumulativeVolume, weeklyFrequency);
      cumulativeVolume += set.weight * set.reps;
      return a;
    });
    const weighted = weightSets(analyses.map((a) => ({ orm: a.corrected1rm, qualityScore: a.qualityScore })));
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
    if (usedSets === 0) {
      ensembleOrm = analyses.reduce((s, a) => s + a.corrected1rm, 0) / analyses.length;
    }
    const withPrior = previousOrm ? bayesianUpdate(ensembleOrm, previousOrm) : ensembleOrm;
    const finalOrm = Math.round(withPrior * 2) / 2;
    const confidence = computeConfidence(analyses, usedSets);
    const delta = previousOrm != null ? finalOrm - previousOrm : null;
    const trendNote = buildTrendNote(finalOrm, previousOrm, deltaHistory);
    const topModels = analyses.filter((_, i) => !weighted[i]?.isOutlier).map((a) => a.modelUsed);
    const modelCount = {};
    for (const m of topModels) modelCount[m] = (modelCount[m] ?? 0) + 1;
    const modelStr = Object.entries(modelCount).sort((a, b) => b[1] - a[1]).map(([id, n]) => `${id}\xD7${n}`).join("+");
    const methodSummary = `Ensemble(${modelStr})${previousOrm ? "+BayesPrior" : ""}`;
    return {
      id: uuid_local(),
      exerciseName: exercise.name,
      ts: Date.now(),
      orm1rm: finalOrm,
      confidence,
      deltaFromPrevious: delta,
      setAnalyses: analyses,
      methodSummary,
      trendNote
    };
  }
  function uuid_local() {
    return "orm_" + Math.random().toString(36).slice(2, 10) + "_" + Date.now();
  }

  // core/src/engines/orm-engine.ts
  var ORM_ENGINE_MANIFEST = {
    id: "orm-engine",
    version: "1.0.0",
    listensTo: ["WorkoutFinished"],
    emits: ["OrmUpdated"],
    dependsOn: ["fatigue-engine"]
    // korzysta z Score 'overall' jeśli dostępny
  };
  function latestOrm(core, exerciseName) {
    const key = snapshotKey(exerciseName);
    return core.storage.get("orm_results", key);
  }
  function ormHistory(core, exerciseName, limit = 10) {
    const all = core.storage.getAll("orm_history");
    return all.filter((r) => r._ex === exerciseName).sort((a, b) => b.ts - a.ts).slice(0, limit);
  }
  function registerOrmEngine(core, compoundResolver) {
    const isCompound = compoundResolver ?? defaultCompoundResolver;
    core.registry.register(ORM_ENGINE_MANIFEST, {
      WorkoutFinished: (evt) => {
        try {
          const payload = evt.payload;
          handleWorkoutFinished(core, payload, isCompound);
        } catch (e) {
          console.error("[orm-engine] b\u0142\u0105d:", e);
        }
      }
    });
  }
  function handleWorkoutFinished(core, payload, isCompound) {
    const exercises = payload.exercises ?? [];
    const fatigueScore = payload.fatigueScore ?? readFatigueScore(core);
    for (const ex of exercises) {
      if (!ex.name) continue;
      const sets = (ex.setsData ?? []).filter((s) => s.done && s.weight && s.reps).map((s) => ({
        weight: s.weight,
        reps: s.reps,
        plannedRIR: s.rir ?? ex.plannedRIR ?? 0,
        rpe: s.rpe ?? void 0
      }));
      if (sets.length === 0) continue;
      const exercise = { name: ex.name, isCompound: isCompound(ex.name) };
      const prev = latestOrm(core, ex.name);
      const history = ormHistory(core, ex.name, 5);
      const deltaHistory = history.filter((r) => r.deltaFromPrevious != null).map((r) => r.deltaFromPrevious).reverse();
      const input = {
        sets,
        exercise,
        fatigueScore,
        sessionVolume: payload.sessionVolume,
        previousOrm: prev?.orm1rm
      };
      const result = computeOrm(input, deltaHistory);
      const snapId = snapshotKey(ex.name);
      core.storage.put("orm_results", { ...result, id: snapId });
      core.storage.put("orm_history", { ...result, id: result.id, _ex: ex.name });
      const scoreValue = prev ? Math.min(100, Math.max(0, 50 + (result.orm1rm - prev.orm1rm) * 2)) : Math.min(100, result.orm1rm / 3);
      core.scores.put("orm-engine", `1rm_${ex.name}`, scoreValue, result.confidence / 100);
      core.bus.publish("OrmUpdated", {
        exerciseName: ex.name,
        orm1rm: result.orm1rm,
        confidence: result.confidence,
        deltaFromPrevious: result.deltaFromPrevious,
        trendNote: result.trendNote,
        methodSummary: result.methodSummary
      });
    }
  }
  function snapshotKey(exerciseName) {
    return "orm_latest_" + exerciseName.replace(/\s+/g, "_").toLowerCase();
  }
  function readFatigueScore(core) {
    const s = core.scores.latest("fatigue-engine", "overall");
    return s ? s.value : 0;
  }
  var COMPOUND_EXERCISES = /* @__PURE__ */ new Set([
    "przysiad",
    "squat",
    "martwy ci\u0105g",
    "deadlift",
    "wyciskanie",
    "bench press",
    "wios\u0142owanie",
    "row",
    "podci\u0105ganie",
    "pull-up",
    "wyciskanie \u017Co\u0142nierskie",
    "overhead press",
    "hip thrust",
    "lunges",
    "wykroki"
  ]);
  function defaultCompoundResolver(name) {
    const lower = name.toLowerCase();
    return [...COMPOUND_EXERCISES].some((k) => lower.includes(k));
  }

  // core/src/knowledge/guidelines.ts
  var INTENSITY_ZONES = {
    strength: {
      goal: "strength",
      label: "Si\u0142a maksymalna",
      repsMin: 1,
      repsMax: 6,
      pct1RMMin: 85,
      pct1RMMax: 100,
      restSecMin: 120,
      restSecMax: 300,
      setsPerExerciseMin: 2,
      setsPerExerciseMax: 6,
      toFailure: false,
      tempo: "kontrolowana faza opuszczania, koncentryczna z intencj\u0105 maksymalnej szybko\u015Bci",
      source: "Ratamess et al. 2009 (ACSM Progression Models)"
    },
    hypertrophy: {
      goal: "hypertrophy",
      label: "Hipertrofia",
      repsMin: 6,
      repsMax: 12,
      pct1RMMin: 67,
      pct1RMMax: 85,
      restSecMin: 60,
      restSecMax: 90,
      setsPerExerciseMin: 3,
      setsPerExerciseMax: 6,
      toFailure: true,
      tempo: "umiarkowane: ~2 s ekscentryka, 1-2 s koncentryka",
      source: "Ratamess et al. 2009; Schoenfeld 2010"
    },
    endurance: {
      goal: "endurance",
      label: "Wytrzyma\u0142o\u015B\u0107 mi\u0119\u015Bniowa",
      repsMin: 12,
      repsMax: 25,
      pct1RMMin: 30,
      pct1RMMax: 67,
      restSecMin: 20,
      restSecMax: 60,
      setsPerExerciseMin: 2,
      setsPerExerciseMax: 4,
      toFailure: false,
      tempo: "umiarkowane, ci\u0105g\u0142y ruch bez pauz",
      source: "Ratamess et al. 2009 (ACSM Progression Models)"
    },
    power: {
      goal: "power",
      label: "Moc",
      repsMin: 3,
      repsMax: 6,
      pct1RMMin: 30,
      pct1RMMax: 60,
      restSecMin: 120,
      restSecMax: 300,
      setsPerExerciseMin: 3,
      setsPerExerciseMax: 5,
      toFailure: false,
      // NIGDY do upadku — spadek prędkości niszczy adaptację mocy
      tempo: "maksymalna zamierzona pr\u0119dko\u015B\u0107 koncentryczna",
      source: "Ratamess et al. 2009 \u2014 moc: 30-60% 1RM, wielostawowe, nie do upadku"
    }
  };
  var LEVEL_PROFILES = {
    novice: {
      level: "novice",
      label: "Pocz\u0105tkuj\u0105cy",
      monthsTrainingMin: 0,
      monthsTrainingMax: 6,
      freqPerWeekMin: 2,
      freqPerWeekMax: 3,
      structure: "full-body",
      loadPct1RMMin: 60,
      loadPct1RMMax: 70,
      progressionPctMin: 2,
      progressionPctMax: 10,
      progressionRule: "Zwi\u0119ksz ci\u0119\u017Car o 2-10%, gdy wykonasz g\xF3rny zakres powt\xF3rze\u0144 we wszystkich seriach na 2 kolejnych treningach.",
      periodizationRequired: false,
      source: "Ratamess et al. 2009"
    },
    intermediate: {
      level: "intermediate",
      label: "\u015Aredniozaawansowany",
      monthsTrainingMin: 6,
      monthsTrainingMax: 24,
      freqPerWeekMin: 3,
      freqPerWeekMax: 4,
      structure: "full-body-or-split",
      loadPct1RMMin: 60,
      loadPct1RMMax: 85,
      progressionPctMin: 2,
      progressionPctMax: 10,
      progressionRule: "Progresja jak novice + zmienno\u015B\u0107 bod\u017Aca (fale ci\u0119\u017Caru, rotacja \u0107wicze\u0144 co 4-8 tyg.).",
      periodizationRequired: true,
      source: "Ratamess et al. 2009"
    },
    advanced: {
      level: "advanced",
      label: "Zaawansowany",
      monthsTrainingMin: 24,
      monthsTrainingMax: null,
      freqPerWeekMin: 4,
      freqPerWeekMax: 6,
      structure: "split",
      loadPct1RMMin: 60,
      loadPct1RMMax: 100,
      progressionPctMin: 1,
      progressionPctMax: 5,
      progressionRule: "Progresja wy\u0142\u0105cznie w ramach zaplanowanej periodyzacji (bloki/fale); adaptacje wymagaj\u0105 celowanej zmienno\u015Bci.",
      periodizationRequired: true,
      source: "Ratamess et al. 2009"
    }
  };
  var WEEKLY_VOLUME = {
    setsPerMuscleMin: 10,
    // minimum efektywne dla hipertrofii
    setsPerMuscleMax: 20,
    // powyżej — ryzyko przekroczenia zdolności regeneracji
    setsPerMuscleMaintenance: 4,
    // podtrzymanie
    source: "Schoenfeld 2010; ACSM 2009 \u2014 10-20 serii/grup\u0119/tydzie\u0144 dla hipertrofii"
  };
  var PCT_1RM_REPS = [
    [100, 1],
    [95, 2],
    [93, 3],
    [90, 4],
    [87, 5],
    [85, 6],
    [83, 7],
    [80, 8],
    [77, 9],
    [75, 10],
    [70, 11],
    [67, 12],
    [65, 15]
  ];
  var PCT_1RM_SOURCE = "Haff & Triplett 2016 (NSCA Essentials), tab. %1RM-powt\xF3rzenia";
  function suggestLoad(orm, reps, rir = 0) {
    if (!orm || orm <= 0 || reps <= 0) return null;
    const targetReps = reps + rir;
    let pct = null;
    for (const [p, r] of PCT_1RM_REPS) {
      if (r >= targetReps) {
        pct = p;
        break;
      }
    }
    if (pct == null) {
      const [lastPct, lastReps] = PCT_1RM_REPS[PCT_1RM_REPS.length - 1];
      pct = Math.max(30, lastPct - (targetReps - lastReps) * 2);
    }
    const kg = orm * (pct / 100);
    return Math.round(kg / 2.5) * 2.5;
  }
  function maxRepsAtPct(pct1RM) {
    for (const [p, r] of PCT_1RM_REPS) {
      if (pct1RM >= p) return r;
    }
    const [lastPct, lastReps] = PCT_1RM_REPS[PCT_1RM_REPS.length - 1];
    return lastReps + Math.round((lastPct - pct1RM) / 2);
  }
  var EXERCISE_ORDER_RULES = [
    { id: "large-before-small", rule: "Du\u017Ce grupy mi\u0119\u015Bniowe przed ma\u0142ymi", source: "Ratamess et al. 2009" },
    { id: "multi-before-single", rule: "\u0106wiczenia wielostawowe przed izolowanymi", source: "Ratamess et al. 2009" },
    { id: "power-first", rule: "\u0106wiczenia mocy/eksplozywne na pocz\u0105tku sesji (\u015Bwie\u017Cy uk\u0142ad nerwowy)", source: "Haff & Triplett 2016 (NSCA)" },
    { id: "high-before-low", rule: "Wy\u017Csza intensywno\u015B\u0107 przed ni\u017Csz\u0105", source: "Ratamess et al. 2009" }
  ];
  function exerciseOrderScore(meta) {
    if (meta.isPower) return 0;
    if (meta.isCompound) return 1;
    if (meta.isCore) return 3;
    return 2;
  }
  function validateExerciseOrder(metas) {
    const v = [];
    for (let i = 0; i < metas.length; i++) {
      for (let j = i + 1; j < metas.length; j++) {
        const a = exerciseOrderScore(metas[i]);
        const b = exerciseOrderScore(metas[j]);
        if (b < a) {
          v.push({
            earlierIndex: i,
            laterIndex: j,
            ruleId: metas[j].isPower ? "power-first" : "multi-before-single"
          });
        }
      }
    }
    return v;
  }
  function prescribe(goal, level) {
    const zone = INTENSITY_ZONES[goal];
    const prof = LEVEL_PROFILES[level];
    const sets = level === "novice" ? zone.setsPerExerciseMin : level === "advanced" ? zone.setsPerExerciseMax - 1 : Math.round((zone.setsPerExerciseMin + zone.setsPerExerciseMax) / 2);
    const pctMin = Math.max(zone.pct1RMMin, prof.loadPct1RMMin);
    const pctMaxRaw = Math.min(zone.pct1RMMax, prof.loadPct1RMMax);
    const pctMax = pctMaxRaw >= pctMin ? pctMaxRaw : zone.pct1RMMax;
    let rir = zone.toFailure ? 1 : goal === "power" ? 3 : 2;
    if (level === "novice") rir += 1;
    const rest = Math.round((zone.restSecMin + zone.restSecMax) / 2);
    return {
      goal,
      level,
      sets,
      repsMin: zone.repsMin,
      repsMax: zone.repsMax,
      pct1RMMin: pctMin,
      pct1RMMax: pctMax,
      restSec: rest,
      rir,
      freqPerWeek: [prof.freqPerWeekMin, prof.freqPerWeekMax],
      structure: prof.structure,
      sources: [zone.source, prof.source]
    };
  }

  // core/src/knowledge/guidelines-b.ts
  var POPULATION_RULES = {
    youth: {
      population: "youth",
      label: "M\u0142odzie\u017C (<18 lat)",
      ageMin: 7,
      ageMax: 17,
      setsMax: 2,
      repsMin: 8,
      repsMax: 15,
      no1RMTests: true,
      rirMinimum: 3,
      freqPerWeekMax: 3,
      nonConsecutiveDays: true,
      progressionPctMax: 10,
      emphasis: ["technika przed ci\u0119\u017Carem", "r\xF3\u017Cnorodno\u015B\u0107 ruchowa", "nadz\xF3r jako\u015Bci ruchu"],
      source: "Faigenbaum et al. 2009 (NSCA Youth Position Statement)"
    },
    adult: {
      population: "adult",
      label: "Doros\u0142y (18-64)",
      ageMin: 18,
      ageMax: 64,
      setsMax: 6,
      repsMin: 1,
      repsMax: 25,
      no1RMTests: false,
      rirMinimum: 0,
      freqPerWeekMax: 6,
      nonConsecutiveDays: false,
      progressionPctMax: 10,
      emphasis: [],
      source: "Ratamess et al. 2009 (bazowe wytyczne ACSM)"
    },
    senior: {
      population: "senior",
      label: "Senior (65+)",
      ageMin: 65,
      ageMax: null,
      setsMax: 3,
      repsMin: 8,
      repsMax: 15,
      no1RMTests: false,
      // dozwolone po adaptacji, ostrożnie
      rirMinimum: 2,
      freqPerWeekMax: 3,
      nonConsecutiveDays: true,
      progressionPctMax: 5,
      emphasis: [
        "trening mocy 40-60% 1RM z szybkim ruchem (funkcja)",
        "r\xF3wnowaga zintegrowana z si\u0142\u0105",
        "maszyny przed wolnymi ci\u0119\u017Carami na start"
      ],
      source: "Fragala et al. 2019 (NSCA Position Statement, Older Adults)"
    }
  };
  function populationForAge(age) {
    if (age < 18) return "youth";
    if (age >= 65) return "senior";
    return "adult";
  }
  function applyPopulation(p, pop) {
    const r = POPULATION_RULES[pop];
    if (pop === "adult") return p;
    return {
      ...p,
      sets: Math.min(p.sets, r.setsMax),
      repsMin: Math.max(p.repsMin, r.repsMin),
      repsMax: Math.min(p.repsMax, r.repsMax),
      rir: Math.max(p.rir, r.rirMinimum),
      freqPerWeek: [
        Math.min(p.freqPerWeek[0], r.freqPerWeekMax),
        Math.min(p.freqPerWeek[1], r.freqPerWeekMax)
      ],
      sources: p.sources.concat([r.source])
    };
  }
  var PERIODIZATION_BLOCKS = {
    accumulation: {
      type: "accumulation",
      label: "Akumulacja",
      weeksMin: 2,
      weeksMax: 4,
      volume: "wysoka",
      intensity: "niska-\u015Brednia",
      focus: "zdolno\u015Bci podstawowe: masa mi\u0119\u015Bniowa, wytrzyma\u0142o\u015B\u0107 si\u0142owa, baza tlenowa",
      source: "Issurin 2010"
    },
    transmutation: {
      type: "transmutation",
      label: "Transmutacja",
      weeksMin: 2,
      weeksMax: 4,
      volume: "\u015Brednia",
      intensity: "wysoka",
      focus: "zdolno\u015Bci specyficzne: si\u0142a maksymalna, moc, wytrzyma\u0142o\u015B\u0107 specjalna",
      source: "Issurin 2010"
    },
    realization: {
      type: "realization",
      label: "Realizacja",
      weeksMin: 1,
      weeksMax: 2,
      volume: "niska",
      intensity: "bardzo wysoka",
      focus: "szczyt formy: \u015Bwie\u017Co\u015B\u0107 + intensywno\u015B\u0107 startowa, taper",
      source: "Issurin 2010"
    }
  };
  var RESIDUAL_EFFECTS = [
    { ability: "wydolno\u015B\u0107 tlenowa", days: 30, toleranceDays: 5, source: "Issurin 2010" },
    { ability: "si\u0142a maksymalna", days: 30, toleranceDays: 5, source: "Issurin 2010" },
    { ability: "wytrzyma\u0142o\u015B\u0107 beztlenowa", days: 18, toleranceDays: 4, source: "Issurin 2010" },
    { ability: "wytrzyma\u0142o\u015B\u0107 si\u0142owa", days: 15, toleranceDays: 5, source: "Issurin 2010" },
    { ability: "szybko\u015B\u0107", days: 5, toleranceDays: 3, source: "Issurin 2010" }
  ];
  function residualDecayPct(ability, daysSinceLastStimulus) {
    const r = RESIDUAL_EFFECTS.find((x) => x.ability === ability);
    if (!r) return null;
    return Math.round(daysSinceLastStimulus / r.days * 100);
  }
  var HYPERTROPHY_RULES = [
    { id: "full-rom", rule: "Pe\u0142ny zakres ruchu \u2014 wi\u0119ksze napi\u0119cie mechaniczne", source: "Schoenfeld 2010" },
    { id: "multi-angle", rule: "Ta sama grupa z r\xF3\u017Cnych k\u0105t\xF3w/wariant\xF3w (pe\u0142na rekrutacja)", source: "Schoenfeld 2010" },
    { id: "eccentric", rule: "Kontrolowana/akcentowana faza ekscentryczna (uszkodzenia mi\u0119\u015Bniowe \u2192 adaptacja)", source: "Schoenfeld 2010" },
    { id: "moderate-rest", rule: "Przerwy 60-90 s \u2014 stres metaboliczny przy zachowaniu obj\u0119to\u015Bci", source: "Schoenfeld 2010" },
    { id: "moderate-reps", rule: "G\u0142\xF3wny zakres 6-12 powt\xF3rze\u0144 (napi\u0119cie \xD7 stres metaboliczny)", source: "Schoenfeld 2010" }
  ];
  function concurrentTrainingCheck(input) {
    const w = [];
    const SRC = "Wilson et al. 2012 (meta-analiza treningu r\xF3wnoleg\u0142ego)";
    const massGoal = input.goal === "strength" || input.goal === "hypertrophy" || input.goal === "power";
    if (input.cardioType === "none" || input.cardioSessionsPerWeek === 0) return w;
    if (massGoal && input.cardioType === "running" && input.cardioSessionsPerWeek >= 3) {
      w.push({
        id: "running-interference",
        severity: "warning",
        message: "Bieganie \u22653\xD7/tydz. przy celu si\u0142a/masa istotnie ogranicza przyrosty (interferencja). Rozwa\u017C zamian\u0119 cz\u0119\u015Bci bieg\xF3w na rower lub redukcj\u0119 do 2\xD7/tydz.",
        source: SRC
      });
    }
    if (massGoal && input.cardioMinutesPerWeek > 150) {
      w.push({
        id: "cardio-volume",
        severity: "warning",
        message: "Ponad 150 min cardio/tydz. przy celu si\u0142a/masa \u2014 interferencja ro\u015Bnie z czasem trwania cardio. Ogranicz obj\u0119to\u015B\u0107 lub zaakceptuj wolniejsze przyrosty.",
        source: SRC
      });
    }
    if (input.sameSessionAsStrength && massGoal) {
      w.push({
        id: "same-session",
        severity: "info",
        message: "Cardio i si\u0142a w jednej sesji: wykonuj si\u0142\u0119 PIERWSZ\u0104, a najlepiej rozdziel je o kilka godzin lub na osobne dni.",
        source: SRC
      });
    }
    if (input.goal === "weight-loss" && input.cardioType === "running") {
      w.push({
        id: "weight-loss-cycling",
        severity: "info",
        message: "Przy redukcji z zachowaniem mi\u0119\u015Bni rower interferuje z si\u0142\u0105 mniej ni\u017C bieganie.",
        source: SRC
      });
    }
    return w;
  }
  function screen(input) {
    const SRC = "Riebe et al. 2015 / ACSM Guidelines 2021 (pre-participation screening)";
    if (input.symptoms) {
      return {
        clearance: "medical-first",
        message: "Wyst\u0119puj\u0105 objawy (b\xF3l w klatce, duszno\u015B\u0107, zawroty) \u2014 przed rozpocz\u0119ciem programu skonsultuj si\u0119 z lekarzem.",
        maxIntensity: "light",
        source: SRC
      };
    }
    if (input.knownDisease) {
      if (!input.exercisesRegularly) {
        return {
          clearance: "medical-first",
          message: "Rozpoznana choroba + brak regularnej aktywno\u015Bci \u2014 zalecana zgoda lekarza przed startem.",
          maxIntensity: "light",
          source: SRC
        };
      }
      if (input.desiredIntensity === "vigorous") {
        return {
          clearance: "start-moderate",
          message: "Choroba w wywiadzie: trenujesz regularnie, wi\u0119c kontynuuj umiarkowanie; przed intensywnym wysi\u0142kiem wskazana konsultacja.",
          maxIntensity: "moderate",
          source: SRC
        };
      }
    }
    if (!input.exercisesRegularly && input.desiredIntensity === "vigorous") {
      return {
        clearance: "start-moderate",
        message: "Brak regularnej aktywno\u015Bci \u2014 zacznij od intensywno\u015Bci umiarkowanej i zwi\u0119kszaj stopniowo.",
        maxIntensity: "moderate",
        source: SRC
      };
    }
    return { clearance: "ok", message: "Brak przeciwwskaza\u0144 do planowanej intensywno\u015Bci.", maxIntensity: input.desiredIntensity, source: SRC };
  }
  var CARDIO_ZONES = [
    { id: "light", label: "Lekka", hrrPctMin: 30, hrrPctMax: 39, rpeMin: 2, rpeMax: 3, source: "Garber et al. 2011 (ACSM)" },
    { id: "moderate", label: "Umiarkowana", hrrPctMin: 40, hrrPctMax: 59, rpeMin: 4, rpeMax: 5, source: "Garber et al. 2011 (ACSM)" },
    { id: "vigorous", label: "Intensywna", hrrPctMin: 60, hrrPctMax: 89, rpeMin: 6, rpeMax: 8, source: "Garber et al. 2011 (ACSM)" }
  ];
  function hrZone(zoneId, age, restingHr) {
    const z = CARDIO_ZONES.find((x) => x.id === zoneId);
    if (!z || age <= 0 || restingHr <= 0) return null;
    const hrMax = 208 - 0.7 * age;
    const hrr = hrMax - restingHr;
    return {
      min: Math.round(restingHr + hrr * (z.hrrPctMin / 100)),
      max: Math.round(restingHr + hrr * (z.hrrPctMax / 100))
    };
  }
  var FLEXIBILITY_RX = {
    freqPerWeekMin: 2,
    freqPerWeekMax: 3,
    holdSecMin: 10,
    holdSecMax: 30,
    repsPerStretchMin: 2,
    repsPerStretchMax: 4,
    note: "Rozci\u0105gaj do uczucia napi\u0119cia (nie b\xF3lu); najskuteczniejsze po rozgrzaniu mi\u0119\u015Bni.",
    source: "Garber et al. 2011 (ACSM)"
  };
  var NEUROMOTOR_RX = {
    freqPerWeekMin: 2,
    freqPerWeekMax: 3,
    minutesPerSession: [20, 30],
    content: ["r\xF3wnowaga", "zwinno\u015B\u0107", "koordynacja", "trening propriocepcji"],
    note: "Szczeg\xF3lnie istotny u senior\xF3w (prewencja upadk\xF3w).",
    source: "Garber et al. 2011 (ACSM)"
  };

  // core/src/index.ts
  var ModuleRegistry = class {
    constructor(bus) {
      this.bus = bus;
      this.manifests = /* @__PURE__ */ new Map();
    }
    register(manifest, handlers = {}) {
      if (this.manifests.has(manifest.id)) {
        throw new Error("ModuleRegistry: silnik ju\u017C zarejestrowany: " + manifest.id);
      }
      this.manifests.set(manifest.id, manifest);
      for (const type of manifest.listensTo) {
        const h = handlers[type];
        if (h) this.bus.on(type, (evt) => h(evt));
      }
    }
    list() {
      return Array.from(this.manifests.values());
    }
    has(id) {
      return this.manifests.has(id);
    }
  };
  var ScoreStore = class {
    constructor(storage) {
      this.storage = storage;
    }
    put(engineId, key, value, confidence, inputsHash = "") {
      const s = {
        id: uuid(),
        engineId,
        key,
        value: Math.max(0, Math.min(100, Math.round(value))),
        confidence,
        inputsHash,
        ts: Date.now()
      };
      this.storage.put("scores", s);
      return s;
    }
    latest(engineId, key) {
      let best = null;
      for (const s of this.storage.getAll("scores")) {
        if (s.engineId === engineId && s.key === key && (!best || s.ts >= best.ts)) best = s;
      }
      return best;
    }
  };
  function createCore(storage) {
    const st = storage ?? (typeof localStorage !== "undefined" ? new LocalStorageAdapter() : new MemoryAdapter());
    const bus = new EventBus(st);
    return {
      storage: st,
      bus,
      plans: new VersionedRepo(st, "plans"),
      goals: new VersionedRepo(st, "goals"),
      registry: new ModuleRegistry(bus),
      scores: new ScoreStore(st),
      migrate: (raw) => migrateLegacy(st, raw)
    };
  }
  return __toCommonJS(src_exports);
})();
