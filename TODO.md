# TODO — planowane funkcje

Lista rzeczy do zrobienia w kolejnych sesjach. Nie zaimplementowane —
tylko zapisane zakresy, żeby nic się nie zgubiło.

## 1. Baza ćwiczeń rozgrzewkowych (jak baza ćwiczeń siłowych)
Dziś rozgrzewka to sztywna tablica `{n, s, r, note}` wpisana ręcznie w każdym
planie (`WORKOUT_PLANS[].warmup`), bez własnej bazy/kategorii jak
`EXERCISES_BASIC`. Zrobić: kategorię "rozgrzewka" w bazie ćwiczeń (na wzór
istniejącej kategorii "rozciąganie" dodanej wcześniej) + możliwość wyboru
ćwiczeń rozgrzewkowych z listy przy edycji planu/kreatorze, zamiast wpisywania
z palca za każdym razem.

## 2. Ćwiczenia korekcyjne po rozgrzewce — połączone z bólem/dolegliwościami + serie/powtórzenia
Obecnie sekcja "Ćwiczenia korekcyjne" jest PO treningu (w kroku rozciągania),
dobierana pod zapisane dolegliwości z rotacją co 12 tygodni — ale **bez** liczby
serii/powtórzeń (tylko wykonanie ✓/○, jak checklist). Do zrobienia:
- przenieść/dodać wykonanie ćwiczeń korekcyjnych też PO ROZGRZEWCE (przed
  właściwym treningiem), nie tylko po
- dodać pola `sets`/`reps` dla ćwiczeń korekcyjnych (dziś baza korekcyjna ma
  tylko `target_anatomy`/`mechanism`, żadnych parametrów wykonania)
- utrzymać powiązanie z modułem Ból/Dolegliwości (już działa — `condition_tags`)

## 3. Baza ćwiczeń rozciągających — pełna integracja z edytorem
Kategoria "rozciąganie" w bazie już istnieje (12 pozycji, `measurementType:
'seconds'`), ale nie ma jeszcze dedykowanego UI do dodawania rozciągania do
planu tak jak dodaje się ćwiczenia siłowe (przez `ExercisePickerSheet`
filtrowany po tagu). Zrobić: możliwość dodania rozciągania do sekcji cooldown
planu wybierając z bazy (nie tylko wpisując tekst `{n, d}`).

## 4. "Twoje plany treningowe" — kafelek ogólny zamiast listy jednostek
W "Trening siłowy" → zakładka/sekcja "Twoje plany treningowe" ma pokazywać
KAFELEK CAŁEGO PLANU (meta-plan, np. "Mój plan treningowy"), a nie od razu
listę pojedynczych jednostek. Kliknięcie w kafelek planu ma pokazywać
konkretne jednostki treningowe + jednostki biegowe (jeśli dodane w planie).
To wymaga ujednolicenia dwóch dziś równoległych systemów: płaskiej listy
`getEffectivePlans()` (używanej przez "Twoje plany treningowe" i Dashboard)
i zagnieżdżonych meta-planów (`getMetaPlans()`, używanych w edytorze planów).

## 5. Wszystkie dane użytkownika przypisane do konta — audyt kompletności ✅ (częściowo)
Zrobiony audyt: `sync.js` zapisuje cały `store` (`et_v1`) pod `user_id`
w Supabase — wszystkie pola z `emptyStore` w `store.js` są objęte. Znaleziony
i naprawiony realny wyciek: `js/core.bundle.js` (silnik `ETCore` — fatigue,
recovery, progress, estymacja 1RM, cele) trzyma WŁASNY cache w
`localStorage` pod kluczami `etcore:*`, całkowicie osobno od `et_v1` —
sync.js go nie ruszał. Efekt: przy zmianie konta na tym samym urządzeniu
dane silnika (PR-y, progresja) jednego użytkownika przeciekały do drugiego
(ten sam problem, który wcześniej naprawiono dla `et_v1` przez `LAST_UID_KEY`,
ale nigdy nie zastosowano do `etcore:*`). Naprawione: `clearLocalEngineCache()`
w `sync.js` czyści `etcore:*` przy każdej zmianie konta i przy wylogowaniu.

Pozostała, większa luka (NIE naprawiona — osobna sesja): dane silnika
(`etcore:*`) same w sobie NIE są synchronizowane do chmury — są odtwarzane
lokalnie z eventów `WorkoutFinished`/`RunFinished` publikowanych tylko przy
faktycznym zapisie treningu na danym urządzeniu. Po zalogowaniu na NOWYM
urządzeniu zsynchronizowane `store.workouts`/`store.runs` się pojawią, ale
1RM/fatigue/recovery/progresja będą puste, dopóki nowe treningi nie zostaną
zapisane na tym urządzeniu — historyczne dane nie są "odtwarzane" (replay)
przez silnik. Wymagałoby to replay'u wszystkich zapisanych treningów przez
`window.etcore.bus.publish(...)` po pierwszym pociągnięciu danych z chmury,
z zabezpieczeniem przed podwójnym liczeniem — nietrywialne, do zrobienia
osobno.

## 6. Kafelek "Konta" w menu bocznym (tylko dla admina)
Dziś panel kont (`AdminPanel`) jest schowany w Profil → Ustawienia. Dodać
osobną pozycję w menu bocznym "👥 Konta" widoczną tylko dla roli `admin`
(analogicznie do reszty `NAV_GROUPS`), prowadzącą wprost do listy kont +
zmiany ról (funkcjonalność już zbudowana, tylko przenieść/zdublować wejście).

## 7. Zdalna edycja danych użytkownika przez admina (tryb "wejdź jako") ✅
Zrobione: przycisk "🔑 Wejdź jako" przy każdym koncie (poza własnym) w
panelu Konta (`js/admin-panel.js`). Kliknięcie wczytuje `user_data` tego
usera z Supabase i podmienia `StoreCtx` dla całej widocznej aplikacji
(Sidebar + Router) przez `ET.ImpersonationProvider` (`js/admin-impersonation.js`)
— admin widzi i edytuje WSZYSTKIE moduły (plany treningowe, ćwiczenia,
ustawienia itd.) tak, jakby był zalogowany na tym koncie, bez znajomości
hasła. Zmiany zapisują się z powrotem do `user_data` tego usera (debounce
1.5s, jak w `sync.js`). Stały, pomarańczowy banner na górze appki pokazuje
czyje dane są edytowane + przycisk "Wyjdź". `SyncManager`/
`SharedExercisesLoader` siedzą POZA podmienionym kontekstem, więc własne
konto admina nie jest w żaden sposób ruszane w trakcie impersonacji.

Wymaga jednorazowej akcji w Supabase: w SQL Editorze uruchom nowy blok
`user_data_admin_all` z `supabase/schema.sql` (policy pozwalająca adminowi
czytać/pisać CUDZE `user_data` — bez tego przycisk "Wejdź jako" zwróci
błąd braku uprawnień, bo istniejąca `user_data_own` ogranicza dostęp tylko
do `auth.uid() = user_id`).
