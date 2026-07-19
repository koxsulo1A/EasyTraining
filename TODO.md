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

## 5. Wszystkie dane użytkownika przypisane do konta — audyt kompletności
Sync (`sync.js`) już zapisuje cały `store` pod `user_id` w Supabase. Do
zrobienia: przegląd czy NA PEWNO wszystko co user zapisuje trafia do store'u
zsynchronizowanego (a nie np. gdzieś do samego `localStorage` poza store'em,
albo do stanu komponentu który ginie przy odświeżeniu) — pełny audyt pól.

## 6. Kafelek "Konta" w menu bocznym (tylko dla admina)
Dziś panel kont (`AdminPanel`) jest schowany w Profil → Ustawienia. Dodać
osobną pozycję w menu bocznym "👥 Konta" widoczną tylko dla roli `admin`
(analogicznie do reszty `NAV_GROUPS`), prowadzącą wprost do listy kont +
zmiany ról (funkcjonalność już zbudowana, tylko przenieść/zdublować wejście).

## 7. Zdalna edycja danych użytkownika przez admina (tryb "wejdź jako")
Kliknięcie w konto na liście (z punktu 6) ma pozwalać adminowi zmieniać
WSZYSTKIE parametry aplikacji tego użytkownika — plany treningowe, ćwiczenia
w planie, ustawienia itd. — z poziomu panelu admina (bez znajomości hasła
użytkownika). To wymaga:
- nowej tabeli/RPC w Supabase pozwalającej adminowi zapisywać do cudzego
  `user_data` (dziś RLS pozwala tylko `auth.uid() = user_id`)
- UI "wejdź jako [użytkownik]" ładujące jego store do podglądu/edycji
- to największy punkt na liście — realnie osobna, duża sesja
