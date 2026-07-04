# Specyfikacja aplikacji treningowej

---

## 1. Plan treningowy

### 1.1. Podział na tygodnie i zakresy

Plan treningowy dzieli się na zakresy tygodni (np. 1–4, 5–8, 9–12) według danych dostarczonych przez użytkownika. Każdy tydzień zawiera 4 jednostki treningu siłowego.

**Warunek przejścia do kolejnego tygodnia:** użytkownik musi wykonać wszystkie 4 treningi w danym tygodniu. Tydzień nie liczy się od daty kalendarzowej, tylko od daty wykonania czwartego treningu. Przykład: pierwszy trening 01.07, czwarty 10.07 → kolejny tydzień zaczyna się 11.07.

### 1.2. Zmienne dla zakresu tygodni

Do każdego zakresu tygodni użytkownik może przypisać zmienne:
- **Progresja** – standardowe zwiększanie obciążenia
- **Deload** – domyślnie -15% (użytkownik może edytować wartość)

### 1.3. Analiza potreningowa i alerty progresji

Po zakończonym treningu aplikacja analizuje trendy i stagnację. W widoku serii dla kolejnego treningu z tej samej jednostki (np. góra, nogi):

- **Zapisana progresja** – podświetlona na zielono
- **Wykryta potrzeba deloadu** – zamiast progresji wyświetl instrukcję, co użytkownik ma zrobić (np. "Zmniejsz ciężar o 15%, skup się na technice")

---

## 2. Kreator planu treningowego

### 2.1. Kafelek główny

Dodaj kafelek **"Kreator planu"** obok istniejących kafelków (np. "Nowy trening").

### 2.2. Opcje w kreatorze

| Opcja | Wartości |
|---|---|
| **Cel** | Masa / Siła / Redukcja / Zdrowie / Powrót po kontuzji |
| **Liczba jednostek treningowych w tygodniu** | Do wyboru przez użytkownika |
| **Priorytet mięśni** | Wybór maksymalnie 1 partii dużej i 1 małej – na tej podstawie aplikacja priorytetyzuje ćwiczenia |
| **Ograniczenia / Kontuzje** | Wybór wielu opcji z listy (np. odcinek lędźwiowy, kolana, barki, dolny grzbiet itp.) |

#### Podział partii mięśniowych na duże i małe

| Partie duże | Partie małe |
|---|---|
| Klatka piersiowa | Biceps |
| Plecy | Triceps |
| Nogi (uda, pośladki) | Barki (naramienne) |
| – | Łydki |
| – | Przedramiona |
| – | Core / brzuch |

---

## 3. Edycja planu

Sekcja przeniesiona z ogólnego okna treningu siłowego.

- **Zamiana ćwiczenia** – każde ćwiczenie ma przypisane tagi systemowe (np. "Wyciskanie" → tag: *klatka piersiowa*). Przy zamianie ćwiczenia lista zastępcza filtruje się tylko po tym samym tagu.
- **Dodaj ręcznie** – również przeniesione z ogólnego okna treningu siłowego.

---

## 4. Import i eksport planu

### 4.1. Import planu

Obsługa importu z plików **Excel (.xlsx)** oraz **CSV**. Struktura pliku importu:

| Kolumna | Opis | Przykład |
|---|---|---|
| `Tydzień` | Numer lub zakres tygodnia | `1` lub `1-4` |
| `Dzień` | Numer dnia treningowego w tygodniu | `1`, `2`, `3`, `4` |
| `Nazwa ćwiczenia` | Pełna nazwa | `Przysiad ze sztangą` |
| `Partia` | Tag systemowy partii mięśniowej | `nogi` |
| `Serie` | Liczba serii | `4` |
| `Powtórzenia` | Zakres lub liczba | `8-10` |
| `Ciężar` | Wartość lub % CM | `80` lub `75%` |
| `RPE` | Subiektywna trudność (opcjonalnie) | `8` |
| `Notatki` | Dodatkowe informacje (opcjonalnie) | `Tempo 3-1-1` |

### 4.2. Eksport planu

Eksport w tym samym formacie. **Priorytet** – localStorage jest kruche, dlatego import/eksport powinny być solidne i odporne na utratę danych.

---

## 5. Moduł ACWR

### 5.1. Lokalizacja w aplikacji

Przycisk **ACWR** w segmencie **Trening Siłowy**. Po kliknięciu przejście do osobnego widoku.

### 5.2. Model danych

Każda sesja treningowa przechowuje:
- Data
- Czas trwania
- Subiektywna trudność (RPE) – oceniana przez użytkownika po treningu na podstawie samopoczucia
- Notatki (opcjonalnie) – np. "ból kolana", "zmęczenie"

### 5.3. Obliczanie obciążenia

Dwa warianty do wyboru przez użytkownika:

- **Obciążenie zewnętrzne (external_load):** suma (serie × powtórzenia × ciężar) zgrupowana tygodniowo
- **Obciążenie wewnętrzne (internal_load):** suma (RPE sesji × czas trwania) zgrupowana tygodniowo

Domyślnie: obciążenie zewnętrzne.

### 5.4. Wzór ACWR

```
ACWR = acute_load / chronic_load
```

- **acute_load** = suma obciążenia z ostatnich 7 dni (rolling window, nie tydzień ISO)
- **chronic_load** = średnia tygodniowa z ostatnich 28 dni (rolling window / 4)

ACWR wyświetlane dopiero po minimum **28 dniach** logowania. Wcześniej: komunikat "Zbieranie danych... (X/28 dni)".

### 5.5. Strefy ryzyka – wizualizacja

Wskaźnik w formie poziomego paska (gauge):

| ACWR | Kolor | Ikona | Etykieta |
|---|---|---|---|
| < 0,8 | Niebieski | ⏸️ | Regeneracja / Deload |
| 0,8–1,3 | Zielony | ✅ | Optymalna strefa |
| 1,3–1,5 | Żółty/pomarańczowy | ⚠️ | Podwyższone ryzyko |
| > 1,5 | Czerwony | 🚨 | Wysokie ryzyko kontuzji |
| > 2,0 | Ciemnoczerwony | 🔴 | Krytyczne – natychmiast zredukuj |

Wskaźnik dodatkowo pokazuje:
- Wartość liczbową (np. "1,42")
- Strzałkę trendu (↑ rosnący, → stabilny, ↓ malejący)
- Krótki komunikat kontekstowy

### 5.6. Alert potreningowy

Po powrocie do widoku Treningu Siłowego, w konkretnej jednostce treningowej, nad postępem wyświetla się mały alert ACWR, który **znika po 10 sekundach**.

### 5.7. Rekomendacje przed sesją

- **ACWR 0,8–1,3:** "Jesteś w optymalnej strefie obciążeń. Możesz bezpiecznie progresować."
- **ACWR 1,3–1,5:** "Twoje obciążenie rośnie szybciej niż zwykle. Rozważ utrzymanie ciężarów w tym tygodniu i zwróć uwagę na sygnały z ciała."
- **ACWR > 1,5:** "Ryzyko przeciążenia jest wysokie. Zalecam redukcję wolumenu o 30–40% lub deload. Twoje ścięgna i więzadła nie nadążają za mięśniami."
- **ACWR > 2,0:** "Krytyczny poziom obciążenia. Natychmiastowy deload. W tym tygodniu maksymalnie 50% normalnego wolumenu. Skonsultuj się z fizjoterapeutą jeśli odczuwasz ból."

Dodatkowy alert: rosnące RPE przy tym samym ciężarze przez 2+ kolejne sesje → sygnał zmęczenia, nawet gdy ACWR w normie.

### 5.8. Widok historii (sekcja Statystyki → ACWR)

Wykres liniowy:
- Oś X: tygodnie (ostatnie 12)
- Oś Y: wartość ACWR
- Seria 1: acute_load (słupki)
- Seria 2: chronic_load (linia)
- Przerywane linie poziome na granicach: 0,8 / 1,3 / 1,5
- Tło kolorowane strefami ryzyka

### 5.9. Zasada "10% tygodniowo"

Automatycznie generowany plan na kolejny tydzień **nie może zwiększyć obciążenia o więcej niż 10%** względem średniej z ostatnich 4 tygodni. Przy przekroczeniu: "Progresja ograniczona do +10% w tym tygodniu, aby utrzymać ACWR w bezpiecznej strefie."

### 5.10. Ustawienia ACWR

- Wybór metody: external_load / internal_load
- Próg alertów: domyślnie 1,3, zakres 1,2–1,8
- Powiadomienia push: włącz/wyłącz

---

## 6. Moduł fizjoterapeutyczny – ćwiczenia korekcyjne

### 6.1. Działanie

Moduł przypisuje użytkownikowi krótkie bloki (5–15 min) ćwiczeń korekcyjnych na podstawie jego profilu zdrowotnego i zgłoszonych dolegliwości. Blok składa się z 2–4 ćwiczeń dopasowanych do konkretnych problemów.

### 6.2. Ćwiczenia podzielone na regiony ciała

- Stopy i staw skokowy
- Kolana
- Biodra i miednica
- Kręgosłup i tułów
- Barki i łopatki

Każde ćwiczenie zawiera: nazwę, cel anatomiczny, opis mechanizmu działania, instrukcję krok po kroku, najczęstsze błędy, przeciwwskazania, poziom trudności, progresję i regresję.

### 6.3. Powiązanie z dolegliwościami

Ćwiczenia korekcyjne są automatycznie przypisywane na podstawie tagów z profilu użytkownika (sekcja **Dolegliwości** – patrz punkt 9).

---

## 7. Bieganie

### 7.1. Reguły oceny biegów

System reguł (bez AI) do automatycznej oceny treningów biegowych.

### 7.2. AI Coach

Dodaj przycisk **AI Coach** w segmencie Bieganie – na wzór już istniejącej implementacji w Treningu Siłowym.

---

## 8. Pomiary

### 8.1. AI Coach

Dodaj przycisk **AI Coach** (jak w Bieganiu i Treningu Siłowym) – działający na zasadzie reguł.

### 8.2. Body Fat

Automatyczne wyliczanie procentowej zawartości tkanki tłuszczowej z wprowadzonych pomiarów (kaliper, obwody lub impedancja).

### 8.3. Porównanie pomiarów

- Pierwotny pomiar jako punkt odniesienia
- Przy każdym kolejnym pomiarze: strzałka trendu (zielona ↑ / czerwona ↓) skierowana do aktualnego, ostatniego pomiaru

---

## 9. Dolegliwości (przycisk)

### 9.1. Lokalizacja

Przycisk **"Dolegliwości"** – osobny kafelek.

### 9.2. Funkcjonalność

Użytkownik zaznacza aktualne dolegliwości kliniczne z listy, m.in.:
- Przodopochylenie miednicy
- Barki do przodu (protrakcja)
- Kolana do środka (valgus)
- Ograniczone zgięcie stawu skokowego
- Tendinopatia rzepki
- Dyskopatia lędźwiowa
- Ciasnota podbarkowa
- Niestabilność barku
- I inne

Na podstawie zaznaczonych dolegliwości aplikacja przypisuje ćwiczenia korekcyjne z Modułu fizjoterapeutycznego.

---

## 10. Biblioteka ćwiczeń

Każde ćwiczenie zawiera:

- **Opis wykonania krok po kroku** – co napinać, gdzie czuć pracę
- **Najczęstsze błędy** – z wyraźnym pokazaniem złego wzorca (np. odrywanie pięt w przysiadzie, zaokrąglanie pleców w martwym ciągu)
- **Wskazania i przeciwwskazania** – np. "nie wykonuj przy bólu X — wybierz opcję z segmentu Dolegliwości"
- **Alternatywy / regresje** – łatwiejsza wersja, gdy użytkownik nie daje rady
- **Lista ćwiczeń korekcyjnych** – dopasowanych do aktualnie dostępnych dolegliwości
- **Sugestia zmiany ćwiczenia na podstawie bólu** – gdy użytkownik zgłosi ból przy danym ćwiczeniu, aplikacja proponuje zamiennik

---

## 11. Ocena postawy i wzorców ruchowych

Zbadanie statyki ciała i podstawowych wzorców ruchowych użytkownika:

- **Statyka:** koślawe kolana, skrzywienie kręgosłupa, ustawienie barków, miednicy
- **Chód:** analiza wzorca
- **Ruchy podstawowe:** chodzenie na palcach, piętach, wstawanie z podłogi
- **Wzorce przy obciążeniu:** koślawienie kolan przy przysiadzie, rotacja barków

Nieprawidłowe wzorce wymagają korekty techniki i przypisania odpowiednich ćwiczeń.

---

## 12. Testy i pomiary wydolnościowe

### 12.1. Pomiary antropometryczne

- Wzrost, masa ciała
- **BMI** – automatycznie wyliczane z normami: <18,5 niedowaga / 18,5–24,9 norma / 25–29,9 nadwaga / ≥30 otyłość
- **Obwód talii** – normy: kobiety <88 cm, mężczyźni <102 cm (obniżone ryzyko metaboliczne)
- **Stosunek talia/biodra (WHR)**
- **Skład ciała:** pomiary kaliperem (protokół Jackson–Pollock) lub impedancja bioelektryczna → % tkanki tłuszczowej i masy mięśniowej

### 12.2. Siła mięśniowa

- Testy 1RM, 3RM, 5RM w podstawowych ćwiczeniach (przysiad, wyciskanie)
- Testy submaksymalne szacujące siłę
- Odniesienie wyników do tabel percentylowych wg płci, wieku i masy ciała

### 12.3. Wytrzymałość mięśniowa

- Test brzuszków (YMCA Half Sit-Up / curl-up) – 1 minuta
- Test pompek – 1 minuta (standard lub modyfikowany)
- Normy wg Cooper Institute – percentyle dla płci i wieku

### 12.4. Sprawność aerobowa (VO₂max)

- Test Coopera (12 min biegu)
- Bieg na 1,5 mili na czas
- Test Rockport (1 mila marszu)
- Alternatywnie: 3-minutowy test schodowy lub YMCA step test (dla osób o słabszej kondycji)
- Porównanie z normami dla wieku

### 12.5. Elastyczność i zakres ruchu

- **Sit-and-Reach** (sięgnięcie w przód w siadzie) – elastyczność tylnej taśmy
- **Test klockania palców za plecami** – mobilność barków
- **Toe-touch** (skłon do palców w siadzie)

---

## 13. Wiedza treningowa (wbudowana w logikę aplikacji)

### 13.1. Periodyzacja – metody falowania ciężarem

- **Tradycyjna (liniowa):** podział na makrocykl (rok), mezocykl (3 miesiące), mikrocykl (tydzień). Fazy: adaptacyjna (4–6 tyg., niska intensywność, duża objętość) → siłowa (niższa objętość, większe ciężary) → hipertrofia/moc → redukcja/tapering.
- **Nieliniowa (zmienna):** codzienna lub tygodniowa zmiana parametrów (np. 3×5 dużym ciężarem, 3×12 mniejszym). Dla zaawansowanych.

### 13.2. Progressive overload

Zwiększanie ciężaru o 2–5% lub dodawanie powtórzeń/serii, gdy użytkownik wykonuje docelowy zakres bez większego wysiłku.

### 13.3. Staż treningowy

Pole w profilu użytkownika – wpływa na dobór planu i tempo progresji.

---

## 14. Zdjęcia sylwetki i porównanie

### 14.1. Dodawanie zdjęć

Użytkownik dodaje zdjęcia sylwetki w 4 pozycjach: **klatka, plecy, lewy bok, prawy bok.** Każde zdjęcie ma przypisaną datę i numer tygodnia treningowego.

### 14.2. Porównanie

Przycisk **"Porównanie"** – otwiera okno z wyborem pozycji do porównania. Po wybraniu odpala się widok (sheet) ze zdjęciami w hierarchii chronologicznej: od pierwszych do aktualnych. Użytkownik przegląda je po kolei.

---

## 15. Check-in tygodniowy

Formularz do wypełnienia raz w tygodniu, zawierający ocenę w skali:

- Waga
- Apetyt
- Libido
- Energia
- Ból (lokalizacja i natężenie)
- Motywacja

Dane z check-inów są wykorzystywane do analizy trendów (regeneracja, przeciążenie).

---

## 16. Konto użytkownika i synchronizacja

- Rejestracja i logowanie ( Widoczne tylko w po włączeniu w DeV panelu)
- Synchronizacja danych między urządzeniami (chmura) ( projektuj to, ale jeszcze nie implementuj)
- **Priorytet:** eksport/import jako zabezpieczenie przed utratą danych (localStorage nie jest trwały)

---

## 17. Tryb trenera personalnego ( Po włączeniu w Dev Panelu)(jest to najmniej ważna rzecz)

Trener po zalogowaniu ma dostęp do:

- Listy podopiecznych
- Podglądu planów treningowych każdego podopiecznego
- Historii treningów
- Check-inów tygodniowych
- Zdjęć sylwetki i pomiarów

---

## 18. Podsumowanie – priorytety rozwoju

1. Import/eksport danych (bezpieczeństwo – localStorage jest kruche)
2. Konto użytkownika i synchronizacja
3. Kreator planu z podziałem na tygodnie
4. Moduł ACWR
5. Moduł fizjoterapeutyczny (ćwiczenia korekcyjne + dolegliwości)
6. Biblioteka ćwiczeń z techniką, błędami i zamiennikami
7. Zdjęcia sylwetki z porównaniem i check-in tygodniowy
8. AI Coach dla Biegania i Pomiarów (na wzór Treningu Siłowego)
9. Testy wydolnościowe i ocena postawy
10. Tryb trenera personalnego