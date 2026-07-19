---
date: 2026-07-19
topic: open-ideation
focus: brak (ideacja całego projektu)
---

# Ideacja: EasyTraining — ulepszenia całego projektu

## Kontekst codebase

Offline-first Capacitor/React app (vanilla JS bez JSX, `React.createElement`,
localStorage `et_v1`), moduł TypeScript `core/` (silniki: fatigue/recovery/
progress/1RM/goals, testowany vitest), Supabase jako opcjonalny backend
(auth, `user_data` jako JSON blob, `shared_exercises`, role user/admin/
trainer), Capacitor→iOS (.ipa niepodpisany, sideload AltStore/Sideloadly),
GitHub Actions (build iOS + deploy Pages).

**Sygnały jakości:**
- Bardzo duże pliki bez podziału: `js/supplements-db.js` (194KB),
  `js/strength.js` (189KB), `js/exercises-db.js` (57KB), `js/dashboard.js`
  (52KB), `js/dev-panel.js` (48KB), `js/statistics.js` (47KB).
- Podwójny cache silnika (`etcore:*` osobno od `et_v1`) — źródło znanych
  wycieków danych między kontami, naprawiane dwukrotnie w różnych miejscach
  (`825065e`, `42309e5`) — sygnał braku systemowej bariery.
- Dwa równoległe systemy planów: `getEffectivePlans()` vs `getMetaPlans()`
  — częściowo ujednolicone w bieżącej sesji (kafelek meta-plan → jednostki).
- Ręczne wersjonowanie `?v=N` w index.html — 16/30 ostatnich commitów.
- Brak testów jednostkowych poza `core/src` mimo codziennych zmian.
- Brak TODO/FIXME inline — cała roadmapa żyje w `TODO.md` (wszystkie 7
  punktów pierwotnej listy ukończone w tej sesji, włącznie z "wejdź jako").
- `js/vendor/react.development.js`/`react-dom.development.js` — DEV buildy
  React wysyłane do produkcji (sideload + Pages).
- Rola `trainer` istnieje w schemacie Supabase od dawna, świadomie bez
  logiki ("nie dodawaj jeszcze" — cytat z wcześniejszej sesji).
- Katalog `BLOKI TXT/new/` duplikuje niemal całe drzewo projektu.
- Brak monitoringu błędów (Sentry-podobnego) i telemetrii zdarzeń.

Zewnętrzny grounding pominięty (fokus czysto wewnętrzny — audyt własnego
repo, brak jasnego punktu odniesienia z konkurencją do zbadania w tej
turze).

## Pomysły w rankingu

### 1. Napraw izolację danych między kontami u źródła
**Werdykt:** RECOMMENDED
**Opis:** Dwie niezależne naprawy tego samego problemu (izolacja danych
przy zmianie konta na tym samym urządzeniu — `825065e` dla `et_v1`,
`42309e5` dla `etcore:*` cache w tej sesji) sugerują brak systemowej
bariery, nie punktowy błąd. Zamiast kolejnej łatki: jedna funkcja
`assertUserScope(key, currentUserId)` (lub równoważna) wywoływana przy
KAŻDYM odczycie/zapisie localStorage powiązanym z kontem, plus test
regresyjny wymuszający jej użycie.
**Uzasadnienie:** Wyciek danych między kontami to najpoważniejszy błąd
prywatności możliwy w apce fitness z prawdziwymi userami (Supabase już
działa, są realne konta). Powtarzalność błędu = duże prawdopodobieństwo
trzeciego miejsca wycieku, którego jeszcze nie znaleziono.
**Wady:** Wymaga przeglądu wszystkich miejsc dostępu do localStorage w
repo — ryzyko przeoczenia kolejnego miejsca nawet po refaktorze.
**Confidence:** 80%
**Złożoność:** Medium
**Status:** Explored → Implemented (2026-07-19, js/account-storage.js)

### 2. Pakiet wydajności startu: production React + lazy-load dużych modułów
**Werdykt:** RECOMMENDED
**Opis:** (a) Zamiana `js/vendor/react.development.js` i
`react-dom.development.js` na zminifikowane production buildy — niemal
darmowy zysk, zero zmian logiki. (b) Leniwe ładowanie modułów >50KB
(`supplements-db.js` 194KB, `strength.js` 189KB, `exercises-db.js` 57KB)
dopiero przy wejściu w dany ekran, zamiast wszystkich 35 plików
sekwencyjnie na starcie.
**Uzasadnienie:** Cold-start dziś parsuje >450KB kodu/danych niezależnie
od tego, które moduły user faktycznie otworzy w danej sesji — bezpośrednio
wydłuża TTI na słabszych urządzeniach mobilnych.
**Wady:** Lazy-load koliduje z obecnym wzorcem globalnego namespace
`ET.*` rejestrowanego przy ładowaniu `<script>` — kolejność ładowania ma
znaczenie, wymaga ostrożnego, stopniowego refaktoru (część (a) można
zrobić od razu bez ryzyka, część (b) jako osobny krok).
**Confidence:** 75%
**Złożoność:** Medium
**Status:** Unexplored

### 3. Zdalny monitoring błędów (Sentry / GlitchTip)
**Werdykt:** RECOMMENDED
**Opis:** Dodać integrację przechwytującą crashe z `window.onerror` i
React `ErrorBoundary` do zewnętrznego serwisu (Sentry lub self-hosted
GlitchTip), zamiast pokazywać błąd tylko lokalnie w `#boot-err`.
**Uzasadnienie:** Aplikacja jest aktywnie rozwijana (commity codziennie),
dystrybuowana przez niepodpisany sideload iOS — środowisko wysokiego
ryzyka awarii, o których dziś dev dowiaduje się tylko jeśli user się
poskarży.
**Wady:** Nowa zależność zewnętrzna, kwestia prywatności danych w
crash reportach do rozważenia (offline-first app z wrażliwymi danymi
zdrowotnymi).
**Confidence:** 80%
**Złożoność:** Low
**Status:** Unexplored

### 4. Audit log dla trybu "wejdź jako"
**Werdykt:** RECOMMENDED
**Opis:** Impersonacja admina (`ET.ImpersonationProvider`, ukończona w
bieżącej sesji jako punkt 7 z TODO.md) ma dziś tylko baner ostrzegawczy w
czasie rzeczywistym. Dodać log (nowa tabela Supabase) zapisujący każdą
sesję impersonacji (kto, kiedy, jak długo) widoczny właścicielowi konta
po fakcie — wzorzec z bankowości/systemów medycznych przy dostępie
supportu do konta klienta.
**Uzasadnienie:** Baner chroni tylko w czasie rzeczywistym — user offline
nie ma żadnego śladu, że ktoś wszedł na jego konto i co zmienił.
**Wady:** Nowa tabela + RLS + UI do przejrzenia logu; trzeba zdecydować
dokładnie co logować (same wejścia/wyjścia vs też konkretne zmiany danych).
**Confidence:** 75%
**Złożoność:** Medium
**Status:** Unexplored

### 5. Panel Trenera — aktywacja martwej roli `trainer`
**Werdykt:** WORTH_EXPLORING
**Opis:** Rola `trainer` istnieje w `profiles.role` od dawna, świadomie
bez logiki. Impersonacja admina już istnieje jako gotowa infrastruktura
techniczna — uproszczony widok trenera (lista podopiecznych + wgląd w
trening/1RM/ACWR bez pełnej impersonacji) mógłby być w dużej mierze UI,
nie nową infrastrukturą.
**Uzasadnienie:** Martwy potencjał w schemacie od dawna; realny kierunek
B2B (siłownie, trenerzy personalni) jeśli projekt kiedykolwiek wyjdzie
poza użytek własny.
**Wady:** Wymaga modelu przypisania trener↔podopieczny, którego dziś nie
ma wcale (brakuje tabeli/relacji) — to realnie osobna sesja
`/dev-brainstorm`, nie coś do zrobienia impulsywnie.
**Confidence:** 60%
**Złożoność:** Medium-High
**Status:** Unexplored

### 6. Zdjęcia poza głównym store JSON (weryfikacja + fix)
**Werdykt:** WORTH_EXPLORING
**Opis:** Niepotwierdzona hipoteza, że moduł "photos" trzyma zdjęcia jako
base64 w tym samym blobie `et_v1` co reszta danych. Jeśli prawda: każda
drobna zmiana gdziekolwiek w apce (np. jeden slider RIR) re-serializuje i
wysyła te zdjęcia do Supabase przy każdym sync debounce.
**Uzasadnienie:** Jeśli hipoteza się potwierdzi, to prawdopodobnie
największy pojedynczy koszt wydajności w całej aplikacji — ale nie
zweryfikowano jeszcze faktycznego mechanizmu przechowywania.
**Wady:** Wymaga najpierw sprawdzenia `js/photos.js`, zanim cokolwiek się
naprawi — stąd WORTH_EXPLORING, nie RECOMMENDED.
**Confidence:** 55%
**Złożoność:** Medium
**Status:** Unexplored

### 7. Integracja Apple Health / HealthKit
**Werdykt:** DEFER
**Opis:** Dwukierunkowa synchronizacja snu/tętna/aktywności z Apple
Health — naturalny fit dla apki fitness na iOS, redukuje ręczne
wpisywanie danych w module snu.
**Uzasadnienie:** Konkurencyjne apki (Strava, Whoop, Hevy) budują
lojalność na automatycznym imporcie z wearables.
**Wady:** HealthKit wymaga entitlements niedostępnych przy ad-hoc/sideload
signing — ten sam problem, który już utrudniał Live Activity w tej
sesji. Zablokowane do czasu płatnego konta Apple Developer.
**Confidence:** —
**Złożoność:** High
**Status:** Unexplored

## Podsumowanie odrzuceń

| # | Pomysł | Powód odrzucenia |
|---|--------|------------------|
| 1 | CI gate blokujący merge bez testów | Za sztywne dla solo-dev robiącego codzienne commity feature'owe |
| 2 | Rozbicie mega-plików (supplements-db, strength.js) | Czysty dług DX, wysokie ryzyko regresji przy globalnym namespace `ET.*`, bez bezpośredniej wartości usera |
| 3 | Ujednolicenie getEffectivePlans/getMetaPlans | Ostatnia sesja już częściowo zaadresowała (kafelek meta-plan); pełne usunięcie płaskiej listy nieproporcjonalne teraz |
| 4 | BLOKI TXT/new — duplikat drzewa projektu | Realny, ale trywialny — nie zasługuje na osobną dyskusję zespołu |
| 5 | TODO.md → GitHub Issues auto-sync | Rozwiązanie cięższe niż problem, ryzyko dwóch źródeł prawdy |
| 6 | Empty states jako mini-tutoriale | Reasoned bez potwierdzenia że to faktyczny problem, zbyt ogólnikowe dla 20 modułów naraz |
| 7 | Sidebar progressive disclosure | Apka już ma `menuSettings` (hide/reorder w Profil→Ustawienia) — duplikuje istniejący mechanizm |
| 8 | ACWR alert z kolorem/akcją | Wartościowe, ale zbyt drobne na osobną sesję — mały follow-up przy okazji modułu ACWR |
| 9 | Mapa metra dla hierarchii planu | Głównie kosmetyczne, wysoki koszt UI vs wartość |
| 10 | Widoczny status sync | Częściowo pokryte (toast "Zsynchronizowano z chmurą ✓" już istnieje w sync.js) |
| 11 | Interakcje suplementów (cross-checking) | Wysokie ryzyko błędnych porad zdrowotnych bez walidacji eksperckiej |
| 12 | Smoke test checklist | Pokrywa się z odrzuconym CI-gate jako tańsza wersja tego samego problemu |
| 13 | Debounce zapisów localStorage | Reasoned bez zmierzonego problemu — przedwczesna optymalizacja |
| 14 | Granularny store (Supabase + localStorage per rekord) | Bardzo duży rewrite architektoniczny nieproporcjonalny do skali apki jednoosobowej |
| 15 | Memoizacja list ćwiczeń (React.memo/useMemo) | Reasoned bez potwierdzonego janku — przedwczesna optymalizacja |
| 16 | Wirtualizacja długich list | Przedwczesne przy ~215 pozycjach w bazie, nie tysiącach |
| 17 | Telemetria zdarzeń użytkownika | Niska wartość gdy dev=user — brak realnego adresata analityki na tym etapie |
| 18 | Automatyczny cron ACWR + push notifications | Wymaga nieistniejącej infrastruktury push, alert już działa on-demand w kliencie |
| 19 | Automatyzacja importu CSV ćwiczeń | To nie pomysł na ulepszenie, to zaległe zadanie z gotowym UI — wystarczy kliknąć istniejący przycisk |
| 20 | Publiczny profil / eksport wyników (share) | Przedwczesne bez realnej bazy userów na tym etapie |
| 21 | i18n PL/EN | Spekulacyjne, brak dowodu popytu, wysoki koszt (przepisanie stringów w ~35 plikach) |
| 22 | Automatyzacja cache-bustingu `?v=N` | Realne, ale zbyt drobne na osobną inicjatywę |

## Log sesji
- 2026-07-19: Początkowa ideacja (open, cały projekt) — 4 subagenty
  (Tech Debt + Constraint Flipper, UX + Cross-Domain, Performance,
  Product Strategist), 31 surowych pomysłów wygenerowanych, 7 ocalało
  po filtrowaniu adversarialnym (orchestrator, jednoprzebiegowa krytyka).
- 2026-07-19: Użytkownik wybrał pomysł #1 (Napraw izolację danych między
  kontami u źródła) do brainstormu. `/dev-brainstorm` niedostępny w tym
  środowisku — brainstorm przeprowadzony ręcznie (jedno pytanie o kształt
  mechanizmu: wrapper vs strażnik vs namespaced keys → wybrano wrapper).
  Kopia listy zapisana też na Pulpicie jako "TO DO.txt" na życzenie usera.
  ZAIMPLEMENTOWANE od razu na życzenie usera ("Zrób 1"): nowy
  `js/account-storage.js` (ET.AccountStorage) jako jedyna brama do kluczy
  localStorage powiązanych z kontem (`et_v1`, `etcore:*`), z rejestrem
  prefiksów, `clearAccountData()` i `resolveAccountLogin()`. `sync.js`,
  `store.js`, `profile.js`, `dev-panel.js` przepięte na wrapper — przy
  okazji naprawiony dodatkowy, wcześniej nieznaleziony wyciek: przyciski
  "Usuń wszystkie dane"/"Resetuj aplikację" czyściły tylko `et_v1`, NIE
  `etcore:*`. Zweryfikowane w przeglądarce (dashboard, zapis samopoczucia,
  bezpośredni test `clearAccountData()` w konsoli — usuwa `et_v1` i
  `etcore:*`, zostawia niepowiązaną z kontem flagę `et_offline_mode`).
