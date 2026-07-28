# Redesign EasyTraining — spec i status wdrożenia

Źródło: projekt Claude Design **"EasyTraining Design System"**
(`projectId: 8a976bb8-0ec7-46e1-ae51-5d00bda5ffb7`, dostęp przez narzędzie
`DesignSync`). Zawiera `ui_kits/app/` — klikalne odwzorowanie ekranów
aplikacji (React/JSX, dane statyczne w `data.jsx`) plus `tokens/`,
`components/` (biblioteka wzorców z `.prompt.md`) i `guidelines/`.

**Ważne — to NIE jest osobna biblioteka komponentów do zaimportowania.**
Prawdziwa apka to vanilla JS (`React.createElement`, bez JSX/buildu).
Tokeny kolorów/spacing/radius w projekcie Design są **1:1 skopiowane**
z `css/styles.css` (potwierdzone: `--bg`, `--s1..s5`, `--a`, `--green` itd.
identyczne). Design dodaje tylko wygodniejsze aliasy (`--surface-card`,
`--accent-text`...) dla własnych potrzeb — **nie przenosić ich do apki**,
zostajemy przy oryginalnych nazwach zmiennych już używanych w repo.

Sposób pracy: dla każdego ekranu pobrać przez `DesignSync.get_file` plik
`ui_kits/app/<Nazwa>Screen.jsx` + `data.jsx`, porównać z aktualnym kodem
w `js/*.js`, zaimplementować TYLKO realne różnice (nowe sekcje/komponenty),
używając istniejących klas z `css/styles.css` (`card`, `card-interactive`,
`section-hdr`, `page-hdr`, `chart-wrap`/`chart-title`, `badge badge-*`,
`chip`, `grid-2` itd.) — nie kopiować JSX składniowo, tylko przenieść
strukturę na wzorzec `_h(...)` już używany w pliku.

## Status per ekran

| Ekran (kit) | Realny plik | Status |
|---|---|---|
| StrengthScreen.jsx | `js/strength.js` (`StrengthModule`, widok listy) | ✅ Zaimplementowane (ta sesja) |
| SessionScreen.jsx | `js/strength.js` (`StrengthSession`) | Nie zaczęte |
| DashboardScreen.jsx | `js/dashboard.js` | Nie zaczęte |
| LoginScreen.jsx | `js/auth.js` | Nie zaczęte |
| RunningScreen.jsx | `js/running.js` | Nie zaczęte |
| ProfileScreen.jsx | `js/profile.js` | Nie zaczęte |

## StrengthScreen — co było różne i co zrobiono

Porównanie `ui_kits/app/StrengthScreen.jsx` vs ówczesny `js/strength.js`:

- Kafelki narzędzi (AI Coach/Kreator/ACWR z paskiem strefy/Nowy Trening) —
  **już identyczne** w realnej apce (ten sam gradient ACWR co w kicie).
- Karta „🧠 Analiza ostatniej sesji (core)" — **już identyczna**.
- **NOWE, dodane teraz:** sekcja „Objętość tygodniowa" — wykres słupkowy
  (`ET.BarChart`, klasy `chart-wrap`/`chart-title`) agregujący
  `store.workouts` po tygodniach (poniedziałek–niedziela), ostatnie 8
  tygodni z danymi. Helper: `weeklyVolumeData(workouts)` w `js/strength.js`.
  Umieszczony między kartą analizy a sekcją 1RM (kolejność ze spec kitu).
- Sekcja „Historia sesji" (kit) — u nas nazywa się „Historia" i ma dodatkowe
  elementy (przycisk edycji, wskaźnik gotowości, PR-y) — **zostawione bez
  zmian**, to rozszerzenie, nie regresja względem spec.
- Kafelek „Twoje plany treningowe" (hierarchia meta-plan→jednostki) — **nie
  występuje w kicie w ogóle** (README kitu: „UI kit ma pokazywać wzorce, nie
  wszystkie moduły"). Potraktowane jako pominięcie w skróconym kicie, NIE
  jako instrukcja usunięcia — zostawione, bo to działająca funkcja z
  wcześniejszej sesji.

## Jak wznowić w kolejnej sesji

1. `DesignSync` → `list_projects` → znajdź `EasyTraining Design System`.
2. `get_file` dla `ui_kits/app/<Ekran>Screen.jsx` + `data.jsx`.
3. Otwórz odpowiadający plik w `js/*.js`, porównaj sekcja po sekcji.
4. Zaimplementuj różnice istniejącymi klasami CSS, zweryfikuj w przeglądarce.
5. Zaktualizuj tabelę statusu wyżej.
