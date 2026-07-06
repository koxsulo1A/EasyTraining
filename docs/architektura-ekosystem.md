# Architektura ekosystemu fitness — dokument projektowy (ADR + diagramy)

**Wersja:** 1.0 · **Data:** 2026-07-04 · **Status:** do akceptacji
**Decyzje bazowe (ustalone z właścicielem produktu):**
- Strategia: **Hybryda** — nowy rdzeń w TypeScript (silniki + dane) jako osobny pakiet, podłączany stopniowo pod istniejące UI EasyTraining.
- Platformy: **iOS + Android** (start), następnie **Web** (użytkownik) i **Desktop** (panel Trenera).
- Kolejność prac: najpierw ten dokument, potem kod.
- Backend / chmura / sync: **odłożone (TODO)** — projektujemy tak, by dało się dopiąć później bez przepisywania.

---

## 0. Cel i zasada nadrzędna

> **Architektura musi pozwalać dodać nowy moduł za rok bez przepisywania obecnego kodu.**

Realizują to trzy mechanizmy (i tylko one — reszta jest ich konsekwencją):
1. **Event Bus** — moduły komunikują się zdarzeniami, nie wywołaniami.
2. **Kontrakt silnika + Module Registry** — każdy silnik/moduł ma identyczny interfejs i manifest; dodanie = rejestracja, nie modyfikacja.
3. **Warstwa danych z wersjonowaniem i migracjami** — schemat może rosnąć bez łamania starych danych.

---

## 1. Diagram warstw

```
┌────────────────────────────────────────────────────────────────────┐
│  PRESENTATION                                                       │
│  iOS/Android (Capacitor) · Web PWA · Desktop Trenera                │
│  wykresy (zakres/trend/eksport/porównanie) · formularze (draft/undo)│
├────────────────────────────────────────────────────────────────────┤
│  AI LAYER                                                            │
│  L1 Rule Engine (lokalny, offline)                                   │
│  L2 AI Coach (interpretuje Scores, proponuje)                        │
│  L3 True AI (abonament, przebudowa periodyzacji)                     │
│  + Decision Engine · Knowledge Base · Explainability                 │
├────────────────────────────────────────────────────────────────────┤
│  ORCHESTRATION                                                       │
│  Dependency (graf przepływów) · Analytics (agregacja) · Scoring     │
├────────────────────────────────────────────────────────────────────┤
│  DOMAIN ENGINES (deterministyczne, czyste funkcje, pełne testy)      │
│  Workout · Exercise · Running · Cycling · Fatigue · Recovery ·       │
│  Progress · Goal · Adaptation · Mountains                            │
├────────────────────────────────────────────────────────────────────┤
│  EVENT BUS  (append-only log zdarzeń + subskrypcje)                  │
├────────────────────────────────────────────────────────────────────┤
│  DATA LAYER                                                          │
│  Repozytoria · Wersjonowanie encji · Migracje · Outbox (sync-ready) │
├────────────────────────────────────────────────────────────────────┤
│  STORAGE: SQLite (urządzenie)   [⇄ Sync ⇄ Backend — TODO, później]  │
├────────────────────────────────────────────────────────────────────┤
│  INTEGRATIONS: Apple Health · Health Connect (nigdy modele urządzeń)│
└────────────────────────────────────────────────────────────────────┘
```

**Struktura repo (hybryda):**
```
EasyTraining/
├── core/                  ← NOWE: pakiet TypeScript (zero zależności od UI)
│   ├── events/            (bus, rejestr schematów zdarzeń)
│   ├── data/              (repozytoria, wersjonowanie, migracje, outbox)
│   ├── engines/           (workout/, fatigue/, recovery/, …)
│   ├── knowledge/         (mięśnie, strefy HR, synergisty — jedno źródło)
│   ├── ai/                (rule-engine/, coach/, decision/, explain/)
│   └── __tests__/
├── js/                    ← ISTNIEJĄCE UI (stopniowo przepinane na core)
├── docs/                  ← ten dokument + ADR-y
└── …
```

---

## 2. Rejestr decyzji architektonicznych (ADR)

### ADR-001: Hybryda — rdzeń TS obok istniejącego UI
**Decyzja:** Nowy pakiet `core/` w TypeScript (kompilowany do ESM, ładowany przez istniejące `index.html` jako moduł). Istniejące moduły UI przepinamy na `core` po jednym.
**Powód:** EasyTraining ma sprawdzoną logikę (baza ćwiczeń, ACWR, reguły, kreator) — wyrzucenie jej to strata; ale localStorage + brak typów nie uniesie tej specyfikacji.
**Konsekwencje:** przez pewien czas dwa źródła prawdy (localStorage ↔ SQLite); potrzebny jednorazowy migrator danych `et_v1 → SQLite`.

### ADR-002: SQLite jako storage, localStorage tylko przejściowo
**Decyzja:** `@capacitor-community/sqlite` (iOS/Android) + `sql.js`/OPFS (Web). Jedna warstwa repozytoriów ukrywa różnicę.
**Powód:** relacje, indeksy, agregaty, transakcje — wymagane przez model danych (serie→powtórzenia→RIR…), nieosiągalne sensownie w localStorage.

### ADR-003: Event Bus = append-only log w SQLite + subskrypcje w pamięci
**Decyzja:** Każde zdarzenie domenowe (`WorkoutFinished`, `RunFinished`, `WeightUpdated`, `SleepLogged`, `PainReported`, `TestCompleted`, `PlanChanged`…) jest **zapisywane** do tabeli `events` (id, type, payload, version, ts, source) i **publikowane** do subskrybentów.
**Powód:** (a) audyt i Warstwa 7 (historia zmian) za darmo; (b) silniki mogą się "dograć" później i przetworzyć zaległe zdarzenia; (c) log zdarzeń = gotowy materiał pod przyszły sync (outbox).
**Reguła twarda:** silnik NIE woła innego silnika. Komunikacja tylko: zdarzenie → bus → subskrybent, albo orkiestrator → silnik.

### ADR-004: Wersjonowanie przez niemutowalność
**Decyzja:** Encje wersjonowane (Plan, Ćwiczenie, Cel) są **append-only**: zmiana = nowy wiersz z `version+1`, wskaźnik `currentVersionId` się przesuwa. Nic nie jest nadpisywane ani kasowane (soft-delete).
**Powód:** historia Plan v1→v2→v3 wymagana wprost; przy okazji **eliminuje konflikty sync** (dwie wersje = dwa wiersze, nie konflikt).
**Format wpisu zmiany (Warstwa 7):** `{ co, ktoZmienil: AI|Trener|User|Rule, data, powod, pewnosc }` — zapisywane jako zdarzenie `PlanChanged`.

### ADR-005: Kontrakt silnika (jednakowy dla wszystkich)
**Decyzja:** Każdy silnik implementuje:
```ts
interface Engine<In, Out> {
  readonly manifest: {
    id: string;                    // "fatigue-engine"
    version: string;               // semver
    listensTo: EventType[];        // co subskrybuje
    emits: EventType[];            // co publikuje
    dependsOn: string[];           // id innych silników (tylko przez Scores!)
  };
  compute(input: In, ctx: EngineContext): Out;   // czysta funkcja
}
```
`EngineContext` daje dostęp *tylko* do repozytoriów odczytu i Knowledge Base — nie do innych silników.
**Powód:** to jest fizyczny mechanizm "moduł za rok": nowy silnik = nowy folder + rejestracja manifestu w Module Registry. Zero zmian w istniejących.

### ADR-006: Scoring jako jedyny język między silnikami a AI
**Decyzja:** Silniki wystawiają wyniki wyłącznie jako `Score { engineId, key, value 0-100, confidence, computedAt, inputsHash }` zapisywane w tabeli `scores` (snapshoty dzienne + po zdarzeniach).
**Powód:** AI (L1-L3) czyta gotowe Scores, nigdy surowe dane → tani i szybki L1/L2, ograniczone tokeny L3.

### ADR-007: Trzy poziomy AI + twarda hierarchia decyzji
**Decyzja:**
- **L1 Rule Engine:** deklaratywne reguły `{ warunek(Scores/zdarzenia), akcja, priorytet, cooldown }` w tabeli — nie w kodzie. Działa w 100% offline.
- **L2 AI Coach:** LLM dostaje TYLKO Scores + wnioski L1 + profil skrócony; generuje propozycje; **nie wykonuje** zmian.
- **L3 True AI:** pełny dostęp do danych; przebudowy periodyzacji; każda zmiana przechodzi przez Decision Engine i wymaga zgody (bo "nigdy nieodwracalnych akcji bez zgody").
- **Hierarchia:** `Trener(4) > Użytkownik(3) > AI Coach(2) > Rule Engine(1)` — stała w Decision Engine; każda propozycja niesie `source` i przegrywa z wyższym źródłem.

### ADR-008: Knowledge Base jako jedyne źródło prawdy anatomii
**Decyzja:** Pełna taksonomia mięśni (sekcja 6 spec — od piersiowego większego po dno miednicy) mieszka w `core/knowledge/muscles.ts` jako drzewo `{ id, nazwa, rodzic, region }`. Ćwiczenia mają `engagement: { muscleId → % }` (główny/pomocnicze/stabilizatory). Workout/Fatigue liczą objętość per mięsień **wyłącznie** przez te ID.
**Powód:** deduplikacja — taksonomia była potrzebna w 4 miejscach spec; kopiowanie = rozjazd danych.

### ADR-009: Baza ćwiczeń — stałe ID + graf relacji
**Decyzja:** ID `EX000001…` nadawane raz, na zawsze (rename nie zmienia ID → historia użytkownika bezpieczna). Relacje wariant/zamiennik to **jeden** graf: `exercise_relations { fromId, toId, type: 'variant'|'substitute', similarity% }`.
**Migracja:** obecne 190 ćwiczeń EasyTraining (id `kp1`, `no3`…) dostaje mapowanie `kp1 → EX000001` + zachowujemy stare id jako alias.

### ADR-010: Integracje zdrowia przez abstrakcję
**Decyzja:** interfejs `HealthProvider { getSleep(), getHeartRate(), getSteps(), getWorkouts() }` z implementacjami AppleHealth / HealthConnect. Nigdzie w domenie nie występuje nazwa urządzenia.

### ADR-011: Backend i sync — ODŁOŻONE (świadomie)
**Decyzja:** Na razie 100% lokalnie. Ale **projektujemy pod sync od dziś**: (a) wszystkie ID to UUID (nie autoincrement), (b) log zdarzeń + outbox istnieją od pierwszego dnia, (c) encje niemutowalne (ADR-004).
**TODO zapisane w pamięci projektu:** wybór Supabase / PowerSync / własny Node — decyzja przy fazie "Release: trener online".

---

## 3. Co się dubluje w specyfikacji (werdykt — pojedyncza odpowiedzialność)

| # | Duplikat w spec | Werdykt: kto jest właścicielem |
|---|---|---|
| 1 | "Zmęczenie lokalne (klatka 72%)" w **Workout** i "zmęczenie mięśni" w **Fatigue** | **Fatigue Engine.** Workout liczy tylko objętość/intensywność/częstotliwość (fakty) i emituje je; Fatigue z nich liczy zmęczenie. |
| 2 | **Fatigue vs Recovery vs Scoring** ("zmęczenie/gotowość" ×3) | Fatigue = obciążenie skumulowane. Recovery = zdolność regeneracji (sen/HR/dni wolne) → "Gotowość". Scoring = wyłącznie normalizacja 0-100, niczego nie liczy. |
| 3 | **Rule Engine** opisany w sekcji 2 i osobno jako "Poziom 1" w sekcji 3 | To jeden byt: Rule Engine = Poziom 1 AI. Jedna implementacja. |
| 4 | **Progress vs Analytics vs Scoring** (wszystkie "generują wskaźniki") | Progress = trendy/plateau w czasie. Analytics = agregacja gotowych Scores do widoków (nie liczy od surowych danych). Scoring = normalizacja. |
| 5 | **Dependency vs Decision** (oba o wzajemnym wpływie) | Dependency = statyczny graf "kto kogo wyzwala" (rury). Decision = rozstrzyganie konfliktów priorytetów w konkretnej chwili (zawór). |
| 6 | **Hierarchia decyzji** (sekcja 1) i **Decision Engine** (sekcja 3) | Jedna stała `DECISION_HIERARCHY` w Decision Engine; sekcja 1 to jej opis, nie osobny mechanizm. |
| 7 | **Adaptation vs Progress vs True AI** ("uczenie się użytkownika" ×3) | Progress wykrywa → Adaptation zapamiętuje empiryczne preferencje (14 zamiast 18 serii) jako nadpisania Knowledge Base per-user → True AI z nich korzysta przy przebudowie. |
| 8 | **Taksonomia mięśni** potrzebna w Exercise/Workout/Fatigue/AI | Jedno źródło: Knowledge Base (ADR-008). Wszyscy referują `muscleId`. |
| 9 | **Warianty vs Zamienniki** (dwie struktury podobieństwa) | Jeden graf relacji z typem krawędzi (ADR-009). |
| 10 | **Testy sprawności** (sekcja 7) vs Progress/Goal | Testy tylko emitują `TestCompleted`; Progress/Goal/Analytics konsumują. Testy niczego nie analizują. |
| 11 | **Cała spec vs istniejące EasyTraining** (~60% pokrycia) | Portujemy, nie piszemy od nowa: baza ćwiczeń+tagi mięśni→Exercise Engine; ACWR→rdzeń Fatigue; gotowość→Recovery; syncGoals→Goal; AIEngine reguły→Rule Engine L1; kreator planu→generator w True AI/L1; testy→Testy sprawności; changeLog→Warstwa 7. |

---

## 4. Model danych (rdzeń — SQLite)

```
users(id, createdAt)                          profiles(userId, key, value, updatedAt)   ← 80-120 parametrów jako EAV
                                              profile_completeness → wpływa na confidence AI

exercises(id EX######, currentVersionId)      exercise_versions(id, exerciseId, version, name, opis,
                                                kategoria, sprzet, hierarchia, ruch{typ,tor,praca},
                                                paramsAI{repy,RIR,tempo,przerwa}, przeciwwskazania,
                                                instrukcje, bledy, tagi, status draft|review|approved)
exercise_engagement(exerciseVersionId, muscleId, pct, rola main|assist|stabilizer)
exercise_relations(fromId, toId, type variant|substitute, similarityPct)

plans(id, currentVersionId)                   plan_versions(id, planId, version, tresc JSON,
                                                changedBy AI|Trener|User|Rule, powod, pewnosc, ts)
goals(id, currentVersionId)                   goal_versions(… priorytet, target, deadline …)

workouts(id, date, planVersionId?)            workout_sets(id, workoutId, exerciseId, setNo,
                                                reps, weight, RIR, RPE, czas, przerwa, trudnosc,
                                                ROM?, komentarz?, mediaRef?)        ← tryb trenera
runs(id, date, dystans, tempo, przewyzszenie, kadencja, dlKroku, avgHR, strefy JSON)
rides(id, date, dystans, czas, avgSpeed, kadencja, avgHR, przewyzszenie, TSS)

events(id UUID, type, payload JSON, source, ts, syncedAt?)        ← event log + outbox
scores(id, engineId, key, value, confidence, inputsHash, ts)      ← snapshoty dla AI
rules(id, warunek JSON, akcja JSON, priorytet, cooldown, enabled) ← L1 deklaratywnie
adaptations(userId, key, valueEmpiryczne, zrodloDowodow, ts)      ← Adaptation Engine
health_samples(id, provider, kind sleep|hr|steps, value, ts)
```

Wszystkie ID = UUID (sync-ready). Migracje schematu: numerowane, forward-only, z testem migracji na fixture starych danych (kompatybilność wsteczna).

---

## 5. Przepływ przykładowy (weryfikacja architektury na scenariuszu ze spec)

**"Mało snu → zmniejszenie objętości":**
```
HealthProvider → SleepLogged(4.5h) → Event Bus
  ├─ Recovery Engine: przelicza → Score(recovery=41, confidence=0.9)
  ├─ Rule Engine (L1): reguła "sen<5h" pasuje → propozycja
  │    ObjetoscMinus20%(source=Rule, priorytet=1)
  ├─ Decision Engine: brak konfliktu wyższego źródła → zatwierdzona
  │    (gdyby Trener ustawił "nie ruszać planu" → Trener wygrywa)
  ├─ Plan: nowa wersja vN+1 (changedBy=Rule, powod="sen 4.5h", pewnosc=0.85)
  ├─ Explainability: zapis {wplyw: sen 78%, obciazenie 22%, alternatywy:[…]}
  └─ Analytics/UI: powiadomienie z uzasadnieniem i przyciskiem "cofnij"
```
Dodanie za rok np. "Meditation Engine" = nowy folder + manifest nasłuchujący `SleepLogged` — żaden z powyższych kroków nie wymaga zmiany.

---

## 6. Wąskie gardła i środki zaradcze (skrót)

1. **Koszty API L3** → piramida: 90% decyzji w L1 (offline), L2 dostaje tylko Scores; cache; budżet tokenów per user; L3 tylko przebudowy.
2. **Konflikty przyszłego sync** → niemutowalność (ADR-004) + UUID + outbox od dnia 1.
3. **Ciężka analityka na telefonie** → przeliczanie zdarzeniowe (po `WorkoutFinished`), snapshoty w `scores`, UI czyta gotowce.
4. **Rozrost bazy ćwiczeń społeczności** → pipeline draft→review→approved + AI-check duplikatów w kreatorze 10 kroków + limit głębokości grafu relacji.
5. **Erozja luźnego spięcia** → lint-rule/test graniczny: import między `engines/*` zakazany.
6. **EAV profilu (80-120 pól)** → typowany słownik kluczy w TS (autogenerowany), walidacja Zod na zapisie.

---

## 7. Roadmapa wdrożenia (hybryda, przyrostowo)

| Faza | Zakres | Wynik weryfikowalny |
|---|---|---|
| **0. Fundament** | `core/`: event bus + SQLite + repozytoria + wersjonowanie + migrator `et_v1→SQLite` | testy jednostkowe busa/repo; dane EasyTraining widoczne przez core |
| **1. Pionowy plaster** | Workout Engine end-to-end: zapis serii → `WorkoutFinished` → objętość/mięsień → Score | ekran treningu czyta z core zamiast localStorage |
| **2. Silniki bazowe** | Exercise (port 190 ćwiczeń + EX-ID + engagement%), Fatigue (ACWR→rozszerzenie), Recovery, Progress, Goal | Scores widoczne w UI |
| **3. L1 + Decision + Explainability** | reguły deklaratywne (port obecnych reguł AI), hierarchia decyzji, uzasadnienia | powiadomienia z "dlaczego" |
| **4. Zdrowie + moduły** | HealthProvider (Apple/Connect), rower (TSS), góry | dane snu/HR zasilają Recovery |
| **5. L2/L3 + backend** | AI Coach (API), True AI, sync (decyzja wg TODO), panel Trenera desktop | — |

**MVP ze spec (trening/ćwiczenia/progres) = fazy 0–2.**

---

## 8. Pytania otwarte (do rozstrzygnięcia przed fazą 0)

1. **Framework UI dla nowych ekranów** — zostajemy przy React bez JSX (spójność z obecnym kodem) czy nowe ekrany już w React+TSX (bundler w `core/` i tak będzie)?
2. **Dostawca LLM dla L2/L3** — Claude API? (rekomendacja: tak, z cache i limitem tokenów; szczegóły przy fazie 5).
3. **Panel Trenera desktop** — Electron/Tauri z tym samym core, czy web-app desktopowa? (decyzja może poczekać do fazy 5).
4. **Gamifikacja** — spec mówi "opcjonalna/niski priorytet"; w EasyTraining jest już TODO (poprawki v2 cz. 1.4). Scalić te dwa zadania w jedno przy fazie 2+?
