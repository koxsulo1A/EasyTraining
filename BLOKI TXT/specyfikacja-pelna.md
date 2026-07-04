# Pełna specyfikacja aplikacji treningowej

Dokument łączy specyfikację funkcjonalną (sekcje 1–18) z pełną bazą ćwiczeń (sekcje A–B).

---

# CZĘŚĆ I: SPECYFIKACJA FUNKCJONALNA

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

ACWR = acute_load / chronic_load

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

### 6.2. Algorytm dopasowania

Algorytm wybiera ćwiczenia na podstawie tagów z profilu użytkownika (sekcja **Dolegliwości** – patrz punkt 9). Tagi grupuje według regionów ciała (stopy/skok, kolano, biodro/miednica, kręgosłup/tułów, barki/łopatki), wybiera 1–2 najbardziej punktowane regiony, i z każdego dobiera 1–2 ćwiczenia – preferując te najtrafniej pasujące do tagów i o niższym poziomie trudności. Blok jest regenerowany co 4 tygodnie lub przy aktualizacji profilu.

### 6.3. Przypadłości i tagi

- `przodopochylenie_miednicy` — Przodopochylenie miednicy
- `protrakcja_barkow` — Barki do przodu (protrakcja)
- `kolana_valgus` — Kolana do środka (valgus)
- `ograniczone_zgiecie_skokowe` — Ograniczone zgięcie stawu skokowego
- `tendinopatia_rzepki` — Tendinopatia rzepki (kolano skoczka)
- `dyskopatia_L` — Dyskopatia lędźwiowa
- `ciasnota_podbarkowa` — Ciasnota podbarkowa / impingement
- `niestabilnosc_barku` — Niestabilność barku
- `niestabilnosc_skokowa` — Niestabilność stawu skokowego
- `ITBS` — Pasmo biodrowo-piszczelowe / ból boczny kolana

Pełna baza ćwiczeń korekcyjnych (po 10 na każdą przypadłość) znajduje się w **Części II, Sekcja B** tego dokumentu.

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

Użytkownik zaznacza aktualne dolegliwości kliniczne z listy (tagi z sekcji 6.3). Na podstawie zaznaczonych dolegliwości aplikacja przypisuje ćwiczenia korekcyjne z Modułu fizjoterapeutycznego.

---

## 10. Biblioteka ćwiczeń

Każde ćwiczenie zawiera:

- **Opis wykonania krok po kroku** – co napinać, gdzie czuć pracę
- **Najczęstsze błędy** – z wyraźnym pokazaniem złego wzorca
- **Wskazania i przeciwwskazania**
- **Alternatywy / regresje** – łatwiejsza wersja
- **Sugestia zmiany ćwiczenia na podstawie bólu**

Pełna baza 90 ćwiczeń podstawowych (10 na każdą z 9 grup mięśniowych) znajduje się w **Części II, Sekcja A** tego dokumentu.

---

## 11. Ocena postawy i wzorców ruchowych

Zbadanie statyki ciała i podstawowych wzorców ruchowych użytkownika:

- **Statyka:** koślawe kolana, skrzywienie kręgosłupa, ustawienie barków, miednicy
- **Chód:** analiza wzorca
- **Ruchy podstawowe:** chodzenie na palcach, piętach, wstawanie z podłogi
- **Wzorce przy obciążeniu:** koślawienie kolan przy przysiadzie, rotacja barków

---

## 12. Testy i pomiary wydolnościowe

### 12.1. Pomiary antropometryczne

- Wzrost, masa ciała
- **BMI** – automatycznie wyliczane z normami: <18,5 niedowaga / 18,5–24,9 norma / 25–29,9 nadwaga / ≥30 otyłość
- **Obwód talii** – normy: kobiety <88 cm, mężczyźni <102 cm
- **Stosunek talia/biodra (WHR)**
- **Skład ciała:** pomiary kaliperem (protokół Jackson–Pollock) lub impedancja bioelektryczna

### 12.2. Siła mięśniowa

- Testy 1RM, 3RM, 5RM w podstawowych ćwiczeniach
- Testy submaksymalne szacujące siłę
- Odniesienie do tabel percentylowych wg płci, wieku i masy ciała

### 12.3. Wytrzymałość mięśniowa

- Test brzuszków (YMCA Half Sit-Up) – 1 minuta
- Test pompek – 1 minuta
- Normy wg Cooper Institute

### 12.4. Sprawność aerobowa (VO₂max)

- Test Coopera (12 min biegu)
- Bieg na 1,5 mili na czas
- Test Rockport (1 mila marszu)
- Alternatywnie: 3-minutowy test schodowy lub YMCA step test
- Porównanie z normami dla wieku

### 12.5. Elastyczność i zakres ruchu

- **Sit-and-Reach** – elastyczność tylnej taśmy
- **Test klockania palców za plecami** – mobilność barków
- **Toe-touch** (skłon do palców w siadzie)

---

## 13. Wiedza treningowa

### 13.1. Periodyzacja

- **Tradycyjna (liniowa):** podział na makrocykl, mezocykl, mikrocykl. Fazy: adaptacyjna → siłowa → hipertrofia/moc → redukcja/tapering
- **Nieliniowa (zmienna):** codzienna lub tygodniowa zmiana parametrów

### 13.2. Progressive overload

Zwiększanie ciężaru o 2–5% lub dodawanie powtórzeń/serii.

### 13.3. Staż treningowy

Pole w profilu użytkownika – wpływa na dobór planu i tempo progresji.

---

## 14. Zdjęcia sylwetki i porównanie

### 14.1. Dodawanie zdjęć

Użytkownik dodaje zdjęcia sylwetki w 4 pozycjach: **klatka, plecy, lewy bok, prawy bok.** Każde zdjęcie ma przypisaną datę i numer tygodnia treningowego.

### 14.2. Porównanie

Przycisk **"Porównanie"** – otwiera okno z wyborem pozycji. Po wybraniu odpala się widok (sheet) ze zdjęciami chronologicznie od pierwszych do aktualnych.

---

## 15. Check-in tygodniowy

Formularz do wypełnienia raz w tygodniu, zawierający ocenę w skali:

- Waga
- Apetyt
- Libido
- Energia
- Ból (lokalizacja i natężenie)
- Motywacja

---

## 16. Konto użytkownika i synchronizacja ( tylko po włączeniu w DevMenu)

- Rejestracja i logowanie
- Synchronizacja danych między urządzeniami (chmura)
- **Priorytet:** eksport/import jako zabezpieczenie przed utratą danych

---

## 17. Tryb trenera personalnego ( tylko po włączeniu w DevMenu)

Trener po zalogowaniu ma dostęp do:

- Listy podopiecznych
- Podglądu planów treningowych
- Historii treningów
- Check-inów tygodniowych
- Zdjęć sylwetki i pomiarów

---

## 18. Priorytety rozwoju

1. Import/eksport danych
2. Konto użytkownika i synchronizacja
3. Kreator planu z podziałem na tygodnie
4. Moduł ACWR
5. Moduł fizjoterapeutyczny
6. Biblioteka ćwiczeń
7. Zdjęcia sylwetki + check-in
8. AI Coach dla Biegania i Pomiarów
9. Testy wydolnościowe i ocena postawy
10. Tryb trenera personalnego

---

# CZĘŚĆ II: BAZA ĆWICZEŃ

## A. ĆWICZENIA PODSTAWOWE (10 na grupę mięśniową)

Każde ćwiczenie ma przypisane: nazwę, tag systemowy, sprzęt, poziom trudności (1=początkujący, 2=średni, 3=zaawansowany), opis wykonania i najczęstsze błędy.

---

### A1. KLATKA PIERSIOWA (partia duża) — tag: `klatka_piersiowa`

| # | Ćwiczenie | Sprzęt | Poz. | Opis wykonania | Najczęstsze błędy |
|---|---|---|---|---|---|
| 1 | **Wyciskanie sztangi na ławce płaskiej** | Ławka, sztanga | 2 | Leżąc, stopy na podłodze, ściągnij łopatki. Opuść sztangę do dolnej części klatki, wypchnij dynamicznie. | Odrywanie stóp, brak ściągnięcia łopatek, odbijanie od klatki |
| 2 | **Wyciskanie hantli na ławce płaskiej** | Ławka, hantle | 2 | Leżąc, hantle nad klatką. Opuszczaj do boków klatki z łokciami ~45°, wypchnij. | Zbyt szerokie łokcie (90°), brak kontroli w dolnym punkcie |
| 3 | **Wyciskanie sztangi na ławce skośnej (30–45°)** | Ławka skośna, sztanga | 2 | Kąt 30–45°. Sztanga opada do górnej części klatki. Większy nacisk na górny akton. | Zbyt stromy kąt (>60° → barki), odbijanie |
| 4 | **Rozpiętki z hantlami na ławce płaskiej** | Ławka, hantle | 2 | Leżąc, hantle nad klatką, lekko ugięte łokcie. Otwieraj klatkę szerokim łukiem. | Prostowanie ramion, za duży ciężar |
| 5 | **Pompki klasyczne** | Brak | 1 | Dłonie na szerokość barków, ciało w linii prostej. Opuszczaj klatkę do podłogi, łokcie ~45° od tułowia. | Opadanie bioder, łokcie na zewnątrz, brak pełnego zakresu |
| 6 | **Wyciskanie na maszynie Hammer** | Maszyna | 1 | Siedząc, plecy dociśnięte. Wypychaj uchwyty przed siebie. Dobra izolacja. | Zbyt szybkie tempo, przeprost w łokciach |
| 7 | **Cable crossover** | Wyciągi | 2 | Stań między wyciągami, uchwyty na wysokości barków. Ściągaj linki w dół i do środka. | Za duży ciężar, pochylanie tułowia |
| 8 | **Dipy z pochyleniem do przodu** | Poręcze | 3 | Pochyl tułów ~45°, opuszczaj do rozciągnięcia klatki. | Pionowa pozycja (→ triceps), zbyt głęboko |
| 9 | **Wyciskanie wąskim chwytem na skosie** | Ławka skośna, sztanga | 3 | Chwyt na szerokość barków. Sztanga do środkowej części klatki. Akcent na wewnętrzną część. | Za wąski chwyt (→ triceps) |
| 10 | **Pompki z nogami na podwyższeniu** | Podwyższenie | 2 | Stopy na ławce, dłonie na podłodze. Nacisk na górną część klatki. | Opadanie bioder, brak pełnego zakresu |

---

### A2. PLECY (partia duża) — tag: `plecy`

| # | Ćwiczenie | Sprzęt | Poz. | Opis wykonania | Najczęstsze błędy |
|---|---|---|---|---|---|
| 1 | **Martwy ciąg klasyczny** | Sztanga | 3 | Stopy na szer. bioder, sztanga nad śródstopiem. Plecy proste. Wstań prowadząc sztangę blisko piszczeli. | Zaokrąglone plecy, sztanga daleko od ciała |
| 2 | **Podciąganie na drążku nachwytem** | Drążek | 2 | Ściągnij łopatki, podciągnij brodę nad drążek. Opadaj kontrolowanie. | Bujanie, niepełne opuszczanie |
| 3 | **Wiosłowanie sztangą w opadzie** | Sztanga | 2 | Tułów pochylony ~45°, przyciągaj do dolnej części brzucha. | Zaokrąglone plecy, szarpanie |
| 4 | **Wiosłowanie hantlą w podporze (jednorącz)** | Ławka, hantla | 1 | Kolano i dłoń na ławce. Przyciągaj hantlę do biodra, łokieć blisko ciała. | Rotacja tułowia, opuszczanie barku |
| 5 | **Ściąganie drążka wyciągu górnego (szeroki chwyt)** | Wyciąg górny | 1 | Ściągnij drążek do górnej części klatki, ściągając łopatki. | Odchylanie tułowia, ciągnięcie za kark |
| 6 | **Wiosłowanie na wyciągu dolnym (close grip)** | Wyciąg dolny | 1 | Przyciągaj do brzucha, prostując plecy na końcu. | Zaokrąglone plecy, zbyt szybkie tempo |
| 7 | **Pull-over z hantlą** | Ławka, hantla | 2 | Leżąc w poprzek, hantla za głowę z lekko ugiętymi łokciami. | Za duży ciężar, prostowanie ramion |
| 8 | **Face pull** | Wyciąg, lina | 1 | Przyciągaj do czoła, odwodząc przedramiona na zewnątrz. | Za duży ciężar, brak rotacji zewnętrznej |
| 9 | **Back extension na ławce rzymskiej** | Ławka rzymska | 1 | Unieś tułów do linii prostej, napinając prostowniki i pośladki. | Przeprost w lędźwiach |
| 10 | **Wiosłowanie podchwytem (Yates row)** | Sztanga | 2 | Tułów ~30°, chwyt podchwytem. Przyciągaj do dolnej części brzucha. | Zaokrąglone plecy, odchylanie tułowia |

---

### A3. NOGI — UDA I POŚLADKI (partia duża) — tag: `nogi`

| # | Ćwiczenie | Sprzęt | Poz. | Opis wykonania | Najczęstsze błędy |
|---|---|---|---|---|---|
| 1 | **Przysiad ze sztangą (high bar)** | Stojak, sztanga | 2 | Sztanga na pułapkach. Zejdź do przysiadu, kolana nad stopami. | Pięty odrywają się, kolana do środka |
| 2 | **Przysiad bułgarski** | Ławka, hantle | 2 | Tylna stopa na ławce. Opuszczaj biodro pionowo w dół. | Kolano zapada się, tułów pochyla się |
| 3 | **Martwy ciąg rumuński (RDL)** | Sztanga | 2 | Lekko ugięte kolana, wypchnij biodra w tył. Sztanga wzdłuż ud. | Zaokrąglone plecy, zbyt proste nogi |
| 4 | **Hip thrust** | Ławka, sztanga | 1 | Plecy na ławce, sztanga na biodrach. Wypchnij biodra w górę. | Przeprost w lędźwiach, za szybkie tempo |
| 5 | **Wykroki chodzone z hantlami** | Hantle | 1 | Długi krok w przód, opuść tylne kolano. Idź dalej. | Za krótki krok, tułów pochyla się |
| 6 | **Prasa do nóg (leg press)** | Maszyna | 1 | Plecy dociśnięte. Wypychaj platformę, nie prostuj kolan do końca. | Odrywanie pośladków, przeprost kolan |
| 7 | **Przysiad goblet** | Kettlebell/hantla | 1 | Ciężar przy klatce. Wykonaj głęboki przysiad z prostymi plecami. | Pięty odrywają się, kolana do środka |
| 8 | **Wykroki w tył (reverse lunges)** | Hantle (opcja) | 1 | Krok w tył, opuść tylne kolano. Biodra i tułów pionowo. | Tułów pochyla się do przodu |
| 9 | **Przysiad przedni (front squat)** | Stojak, sztanga | 3 | Sztanga na przednich barkach, łokcie wysoko. | Łokcie opadają, tułów pochyla się |
| 10 | **Step-up na skrzynię** | Skrzynia, hantle | 1 | Wejdź na skrzynię bez odbijania drugą nogą. | Odbijanie, kolano zapada się |

---

### A4. BICEPS (partia mała) — tag: `biceps`

| # | Ćwiczenie | Sprzęt | Poz. | Opis wykonania | Najczęstsze błędy |
|---|---|---|---|---|---|
| 1 | **Uginanie ramion ze sztangą stojąc** | Sztanga | 1 | Łokcie przy tułowiu. Ugnij ramiona, napinając biceps. | Bujanie, odrywanie łokci |
| 2 | **Uginanie z hantlami naprzemienne** | Hantle | 1 | Uginaj z supinacją (wykręcaniem nadgarstka). | Bujanie, rotacja tułowia |
| 3 | **Uginanie na modlitewniku (preacher curl)** | Ławka Scott, sztanga EZ | 1 | Ramiona na poduszce. Uginaj pełny zakres. | Za duży ciężar, odrywanie ramion |
| 4 | **Uginanie młotkowe (hammer curl)** | Hantle | 1 | Dłonie do siebie (chwyt młotkowy). Uginaj obie ręce. | Bujanie, szybkie opuszczanie |
| 5 | **Uginanie na wyciągu dolnym z linką prostą** | Wyciąg dolny | 1 | Linka podchwytem, łokcie przy tułowiu. | Odchylanie tułowia |
| 6 | **Uginanie na ławce skośnej (incline curl)** | Ławka skośna, hantle | 1 | Ramiona zwisają. Uginaj z supinacją. Rozciąga biceps w dole. | Bujanie, skracanie zakresu |
| 7 | **Uginanie koncentrowane** | Ławka, hantla | 1 | Łokieć oparty o wewn. stronę uda. Izoluje biceps. | Odbijanie od uda |
| 8 | **Uginanie ze sztangą EZ** | Sztanga EZ | 1 | Chwyć w zewnętrznych wygięciach. Mniejsze obciążenie nadgarstków. | Bujanie, niepełny zakres |
| 9 | **Uginanie z liną na wyciągu górnym** | Wyciąg górny, lina | 2 | Ramiona na wys. barków. Przyciągaj do głowy. | Za duży ciężar |
| 10 | **Uginanie Zottman** | Hantle | 2 | Uginaj z supinacją, opuszczaj nachwytem. Pracuje biceps + przedramię. | Za duży ciężar, brak kontroli rotacji |

---

### A5. TRICEPS (partia mała) — tag: `triceps`

| # | Ćwiczenie | Sprzęt | Poz. | Opis wykonania | Najczęstsze błędy |
|---|---|---|---|---|---|
| 1 | **French press (skull crusher)** | Ławka, sztanga EZ | 2 | Leżąc, opuszczaj sztangę do czoła. Wyprostuj. | Łokcie na zewnątrz, opuszczanie na nos |
| 2 | **Prostowanie ramion na wyciągu (pushdown)** | Wyciąg górny | 1 | Łokcie przy tułowiu. Prostuj przedramiona w dół. | Odchylanie tułowia, odrywanie łokci |
| 3 | **Dipy na ławce** | Dwie ławki | 1 | Dłonie na ławce za plecami. Łokcie idą do tyłu. | Łokcie na boki, za głęboko |
| 4 | **Overhead extension z hantlą** | Hantla | 1 | Hantla za głową, łokcie blisko uszu. Prostuj ramiona w górę. | Łokcie na boki, wyginanie pleców |
| 5 | **Overhead extension na wyciągu z liną** | Wyciąg górny, lina | 1 | Tyłem do wyciągu, wypychaj przedramiona w górę. | Wyginanie pleców |
| 6 | **Pompki diamentowe** | Brak | 2 | Dłonie razem pod klatką (diament). Łokcie blisko ciała. | Łokcie na boki, opadanie bioder |
| 7 | **Kickback z hantlą w opadzie** | Ławka, hantla | 1 | Ramię równolegle do podłogi. Prostuj przedramię w tył. | Bujanie ramieniem |
| 8 | **Wyciskanie wąskim chwytem na płaskiej** | Ławka, sztanga | 2 | Chwyt na szer. barków, łokcie blisko ciała. | Za szeroki chwyt (→ klatka) |
| 9 | **Dipy na poręczach (pionowo)** | Poręcze | 3 | Tułów pionowo, łokcie blisko ciała. Izolacja tricepsa. | Pochylanie do przodu (→ klatka) |
| 10 | **Prostowanie z gumą (band pushdown)** | Guma | 1 | Guma zaczepiona nad głową. Prostuj przedramiona w dół. | Odrywanie łokci |

---

### A6. BARKI (partia mała) — tag: `barki`

| # | Ćwiczenie | Sprzęt | Poz. | Opis wykonania | Najczęstsze błędy |
|---|---|---|---|---|---|
| 1 | **OHP sztangą stojąc** | Sztanga | 2 | Wypchnij nad głowę, głowa przechodzi pod sztangę. | Odchylanie tułowia, za szeroki chwyt |
| 2 | **Wznosy hantli bokiem** | Hantle | 1 | Lekko ugięte łokcie. Unieś do poziomu barków, jakbyś wylewał dzbanek. | Bujanie, przekraczanie linii barków |
| 3 | **Wznosy hantli przodem** | Hantle | 1 | Unieś przed siebie do wysokości oczu. Naprzemiennie. | Bujanie, za wysoko |
| 4 | **Arnold press** | Ławka, hantle | 2 | Hantle przed klatką, dłonie do siebie. Wypychaj z rotacją na zewnątrz. | Zbyt szybka rotacja |
| 5 | **Rear delt fly (wznosy w opadzie)** | Ławka, hantle | 2 | Tułów na udach, unieś ramiona na boki. Celuje w tylny akton. | Bujanie, za duży ciężar |
| 6 | **Upright row (przyciąganie do brody)** | Sztanga EZ | 2 | Wąski chwyt, przyciągaj wzdłuż ciała do brody. | Za wysoko (impingement) |
| 7 | **Cable lateral raise** | Wyciąg dolny | 1 | Bokiem do wyciągu, unieś ramię w bok. | Bujanie, za duży ciężar |
| 8 | **Behind-the-neck press (tylko zdrowe barki!)** | Sztanga | 3 | Sztanga za karkiem, wypychaj nad głowę. | Za szeroki chwyt, przeciwwskazane przy impingemencie |
| 9 | **Reverse fly na pec-deck** | Maszyna pec-deck | 1 | Przodem do maszyny, otwieraj ramiona do tyłu. | Za duży ciężar |
| 10 | **Combo raise (wznosy przód + bok)** | Hantle | 2 | Unieś w przód → opuść → unieś w bok. Cały naramienny. | Bujanie |

---

### A7. ŁYDKI (partia mała) — tag: `lydki`

| # | Ćwiczenie | Sprzęt | Poz. | Opis wykonania | Najczęstsze błędy |
|---|---|---|---|---|---|
| 1 | **Wspięcia na palcach stojąc (maszyna)** | Maszyna | 1 | Opuść pięty poniżej platformy, wspnij się maksymalnie. | Za szybkie tempo, brak pełnego zakresu |
| 2 | **Wspięcia ze sztangą na plecach** | Sztanga, podest | 1 | Stopy na podeście, pięty w powietrzu. Wspnij się maksymalnie. | Za duży ciężar, ugięte kolana |
| 3 | **Wspięcia na palcach siedząc** | Maszyna | 1 | Kolana pod wałkami. Celuje w płaszczkowatego (soleus). | Za szybkie tempo |
| 4 | **Wspięcia na jednej nodze stojąc** | Hantla (opcja) | 2 | Na podeście, jedna noga. Większa intensywność. | Utrata równowagi |
| 5 | **Ośle wspięcia (donkey calf raise)** | Partner/maszyna | 2 | Pochylony tułów, partner obciąża biodra. | Zaokrąglone plecy |
| 6 | **Wspięcia na prasie do nóg** | Prasa do nóg | 1 | Stopy na dole platformy, nogi proste. Wypychaj palcami. | Ugięte kolana |
| 7 | **Skoki na skakance na palcach** | Skakanka | 1 | Pięty nie dotykają podłoża. Buduje wytrzymałość łydek. | Pięty uderzają o podłoże |
| 8 | **Wspięcia z hantlą na kolanie siedząc** | Ławka, hantla | 1 | Hantla na kolanie (na ręczniku). Wariant domowy. | Hantla spada |
| 9 | **Farmer walk na palcach** | Hantle (opcja) | 1 | Chodź na palcach z maksymalnym wspięciem. | Opadanie pięt |
| 10 | **Pogo jumps (szybkie podskoki na palcach)** | Brak | 2 | Płytkie podskoki tylko z palców. Buduje moc i sprężystość. | Zginanie kolan |

---

### A8. PRZEDRAMIONA (partia mała) — tag: `przedramiona`

| # | Ćwiczenie | Sprzęt | Poz. | Opis wykonania | Najczęstsze błędy |
|---|---|---|---|---|---|
| 1 | **Zwijanie nadgarstków podchwytem (wrist curl)** | Ławka, sztanga | 1 | Przedramiona na udach, nadgarstki poza kolanami. Zwijaj w górę. | Za duży ciężar, odrywanie przedramion |
| 2 | **Zwijanie nadgarstków nachwytem (reverse wrist curl)** | Ławka, sztanga | 1 | Chwyt nachwytem. Zwijaj nadgarstki w górę. Celuje w prostowniki. | Za duży ciężar |
| 3 | **Spacer farmera (farmer's walk)** | Hantle/kettlebells | 2 | Ciężkie hantle, idź określony dystans. Buduje siłę chwytu. | Garbienie się |
| 4 | **Dead hang na czas** | Drążek | 1 | Zwieś na drążku, utrzymaj jak najdłużej. Czysta praca chwytu. | Brak progresji czasowej |
| 5 | **Nawijanie linki z obciążeniem (wrist roller)** | Wałek, linka, ciężar | 2 | Nawijaj linkę na wałek, obracając nadgarstki. Potem rozwijaj. | Pomaganie ramionami |
| 6 | **Ściskanie grippera** | Gripper | 1 | Ściskaj do zamknięcia, utrzymaj 2–3 s. Izolacja chwytu. | Za mocny opór |
| 7 | **Zginanie nadgarstków za plecami** | Sztanga | 2 | Stań ze sztangą za plecami nachwytem. Zwijaj nadgarstki w górę. | Za duży ciężar |
| 8 | **Cable hammer curl** | Wyciąg dolny, lina | 1 | Chwyć linę młotkowo. Dodatkowa praca przedramienia. | Bujanie |
| 9 | **Plate pinch (szczypanie talerzy)** | Talerze | 2 | Złącz talerze gładką stroną na zewnątrz. Chwyć palcami i utrzymaj. | Zbyt dużo talerzy |
| 10 | **Reverse curl (uginanie nachwytem)** | Sztanga EZ | 1 | Chwyć nachwytem na szer. barków. Pracuje brachioradialis. | Bujanie |

---

### A9. CORE / BRZUCH (partia mała) — tag: `core_brzuch`

| # | Ćwiczenie | Sprzęt | Poz. | Opis wykonania | Najczęstsze błędy |
|---|---|---|---|---|---|
| 1 | **Plank (deska)** | Brak | 1 | Podpór na przedramionach. Ciało w linii prostej. Napnij brzuch i pośladki. | Opadanie bioder, wyginanie lędźwi |
| 2 | **Dead bug (martwy robak)** | Brak | 1 | Leżenie tyłem, naprzemiennie opuszczaj przeciwną rękę i nogę. | Odrywanie pleców od podłogi |
| 3 | **Spięcia brzucha leżąc (crunch)** | Brak | 1 | Unieś łopatki z maty, napinając górny brzuch. Nie ciągnij szyi. | Ciągnięcie za szyję, odrywanie całych pleców |
| 4 | **Unoszenie nóg w zwisie (hanging leg raise)** | Drążek | 3 | Unieś proste lub zgięte nogi do poziomu bioder. Opuszczaj kontrolowanie. | Bujanie ciałem |
| 5 | **Russian twist** | Talerz/hantla | 1 | Siad z lekko odchylonym tułowiem. Skręcaj tułów na boki. | Za szybko, ruchy tylko ramionami |
| 6 | **Bird dog (pies myśliwski)** | Brak | 1 | Klęk podparty. Naprzemiennie wyciągaj przeciwną rękę i nogę. Utrzymaj 2–3 s. | Rotacja bioder |
| 7 | **Mountain climbers** | Brak | 2 | Podpór jak do pompek. Naprzemiennie przyciągaj kolana do klatki. | Opadanie bioder |
| 8 | **Pallof press** | Wyciąg | 1 | Stań bokiem do wyciągu. Wypychaj linkę przed siebie, opierając się rotacji. | Rotacja tułowia w stronę wyciągu |
| 9 | **Hollow body hold** | Brak | 2 | Leżenie tyłem, ręce za głową, nogi proste uniesione ~15 cm. Lędźwie dociśnięte. | Odrywanie lędźwi od maty |
| 10 | **Cable crunch** | Wyciąg górny, lina | 2 | Klęcząc, linka przy głowie. Zwijaj tułów w dół. Pełny zakres z obciążeniem. | Ciągnięcie ramionami, brak zgięcia tułowia |

---

## B. ĆWICZENIA KOREKCYJNE (10 na każdą przypadłość)

Każde ćwiczenie zawiera: nazwę, cel anatomiczny, mechanizm działania, poziom, sprzęt, przeciwwskazania.

---

### B1. PRZODOCHYLENIE MIEDNICY — tag: `przodopochylenie_miednicy`

| # | Ćwiczenie | Cel anatomiczny | Mechanizm działania | Poz. | Sprzęt |
|---|---|---|---|---|---|
| 1 | **90/90 breathing** | Przepona, ZOA | Ustawia miednicę neutralnie, przywraca oddech przeponowy | 1 | Brak |
| 2 | **Mostek biodrowy z przytrzymaniem** | Pośladki wielkie | Izometryczna aktywacja pośladków w tylnym pochyleniu miednicy | 1 | Brak |
| 3 | **Dead bug** | Tłocznia brzuszna | Wzmacnia poprzeczny brzucha z plecami dociśniętymi do podłogi | 1 | Brak |
| 4 | **Pelvic tilt w klęku** | Głębokie brzucha | Świadome tylne pochylenie miednicy — ruch odwrotny do przodopochylenia | 1 | Brak |
| 5 | **Rozciąganie zginaczy bioder w wykroku** | Biodrowo-lędźwiowy, prosty uda | Rozciąga napięte zginacze pociągające miednicę do przodu | 1 | Brak |
| 6 | **Hip thrust z lekkim obciążeniem** | Pośladki wielkie, średnie | Dynamicznie wzmacnia pośladki przeciwdziałające przodopochyleniu | 1 | Sztanga/guma |
| 7 | **Dociskanie lędźwi do ściany** | Świadomość miednicy | Użytkownik uczy się dociskać odcinek lędźwiowy do ściany | 1 | Ściana |
| 8 | **Plank z tylnym pochyleniem miednicy** | Core, pośladki | Plank z aktywnym podwijaniem miednicy — uczy neutralnej pozycji pod obciążeniem | 1 | Brak |
| 9 | **Single-leg RDL bez obciążenia** | Pośladki, tył uda | Stabilizacja miednicy na jednej nodze bez obciążania lędźwi | 1 | Brak |
| 10 | **Child's pose (pozycja dziecka)** | Prostowniki lędźwi | Rozciąga napięte prostowniki utrwalające lordozę | 1 | Brak |

---

### B2. PROTRAKCJA BARKÓW — tag: `protrakcja_barkow`

| # | Ćwiczenie | Cel anatomiczny | Mechanizm działania | Poz. | Sprzęt |
|---|---|---|---|---|---|
| 1 | **Face pull z rotacją zewnętrzną** | Tylny naramienny, rotatory, równoległoboczne | Bezpośrednio przeciwdziała protrakcji, cofa łopatki | 1 | Wyciąg/guma |
| 2 | **Serratus wall slide** | Zębaty przedni | Aktywuje zębaty — dociska łopatkę do żeber | 1 | Ściana |
| 3 | **Rozciąganie klatki w framudze** | Piersiowy większy i mniejszy | Rozciąga napięte mięśnie pociągające barki do przodu | 1 | Framuga |
| 4 | **Scapula push-up** | Zębaty przedni, stabilizatory | W podporze: wypychaj klatkę (protrakcja) i ściągaj łopatki (retrakcja) | 1 | Brak |
| 5 | **Band pull-apart** | Tylne naramienne, równoległoboczne | Rozciąganie gumy przed klatką, ściąganie łopatek | 1 | Guma |
| 6 | **YTWL w opadzie** | Cały kompleks łopatki | Ręce w kształt liter Y, T, W, L — aktywuje wszystkie funkcje łopatki | 1 | Lekkie hantle |
| 7 | **Dead hang z depresją** | Przestrzeń podbarkowa | Zwis z aktywnym ściąganiem barków od uszu | 2 | Drążek |
| 8 | **Wall angel** | Mobilność piersiowego, retrakcja | Plecy przy ścianie, sliding ramion w górę i w dół | 2 | Ściana |
| 9 | **Rozciąganie górnego czworobocznego** | Górne pułapki, dźwigacz łopatki | Przechylanie głowy w bok i skręt | 1 | Brak |
| 10 | **Bottoms-up kettlebell carry** | Pierścień rotatorów, stabilizatory | Chodzenie z kettlem do góry dnem — kokontrakcja barku | 3 | Kettlebell |

---

### B3. KOLANA VALGUS — tag: `kolana_valgus`

| # | Ćwiczenie | Cel anatomiczny | Mechanizm działania | Poz. | Sprzęt |
|---|---|---|---|---|---|
| 1 | **Polly squat (przysiad z gumą na kolanach)** | Odwodziciele biodra, rotatory zewn. | Guma wypycha kolana do środka — użytkownik aktywnie walczy | 1 | Guma |
| 2 | **Banded bridge** | Pośladek średni, wielki | Guma nad kolanami, wypychaj kolana na zewnątrz przy unoszeniu bioder | 1 | Guma |
| 3 | **Clamshell (muszelka) z gumą** | Rotatory zewnętrzne biodra | Leżąc bokiem, otwieraj kolana jak muszlę, stopy razem | 1 | Guma |
| 4 | **Lateral band walk** | Pośladek średni | Guma na kostkach, lekki przysiad, idź bokiem | 1 | Guma |
| 5 | **Box pistol squat regression** | Cały łańcuch nogi | Schodzenie na jednej nodze na skrzynię — kontrola kolana w osi | 2 | Skrzynia |
| 6 | **Short foot (krótka stopa)** | M. piszczelowy tylny | Buduje czynnościowy łuk stopy — stabilna stopa = lepszy tor kolana | 1 | Brak |
| 7 | **Wzniosy na palcach z piłką między kostkami** | Mm. strzałkowe | Piłka wymusza prawidłową pozycję pięty | 1 | Piłka |
| 8 | **TRX squat** | Wzorzec przysiadu | Linki pomagają utrzymać tułów i uczą toru kolan przy odciążeniu | 1 | TRX |
| 9 | **Step-up z wypychaniem kolana na zewnątrz** | Odwodziciele, pośladki | Świadome wypychanie kolana przy wchodzeniu na skrzynię | 1 | Skrzynia |
| 10 | **Wall sit z piłką między kolanami** | Odwodziciele, VMO | Plecy przy ścianie, piłka między kolanami, ściskaj przy przysiadzie | 1 | Piłka |

---

### B4. OGRANICZONE ZGIĘCIE STAWU SKOKOWEGO — tag: `ograniczone_zgiecie_skokowe`

| # | Ćwiczenie | Cel anatomiczny | Mechanizm działania | Poz. | Sprzęt |
|---|---|---|---|---|---|
| 1 | **Knee-to-wall** | Staw skokowo-goleniowy | Kontrolowany dosuw kolana do ściany z dociśniętą piętą | 1 | Ściana |
| 2 | **Rozciąganie łydki w wykroku przy ścianie** | Brzuchaty i płaszczkowaty | Tylna noga prosta, pięta dociśnięta — dwie pozycje | 1 | Ściana |
| 3 | **Banded ankle mobilization** | Staw skokowy, torebka przednia | Guma wspomaga tylny ślizg kości skokowej | 1 | Guma, podest |
| 4 | **Foam rolling łydek** | Powięź brzuchatego i płaszczkowatego | Rozluźnia napięte mięśnie blokujące zgięcie grzbietowe | 1 | Wałek |
| 5 | **Ekscentryczne opadanie pięt z podestu** | Łydka + zakres zgięcia grzbietowego | Powoli opuszczaj pięty poniżej poziomu podestu | 1 | Podest |
| 6 | **Przysiad z piętami na talerzach** | Wzorzec przysiadu | Uniesienie pięt kompensuje brak zgięcia — rozwiązanie tymczasowe | 1 | Talerze |
| 7 | **Goblet squat z wypychaniem kolan do przodu** | Zgięcie grzbietowe + przysiad | Ciężar pomaga pogłębić zakres | 1 | Kettlebell |
| 8 | **Mobilizacja kości skokowej — ślizg tylny** | Talus | Partner lub guma pomaga wykonać ślizg tylny | 2 | Guma/partner |
| 9 | **Eccentric calf raises** | Łydka + zakres | Szybkie wspięcie, bardzo wolne opadanie (3–5 s) | 2 | Podest |
| 10 | **Dynamic dorsiflexion drill** | Funkcjonalne zgięcie w chodzie | Powolny krok w przód — pięta pierwsza, kolano nad palce | 1 | Brak |

---

### B5. TENDINOPATIA RZEPKI — tag: `tendinopatia_rzepki`

| # | Ćwiczenie | Cel anatomiczny | Mechanizm działania | Poz. | Sprzęt |
|---|---|---|---|---|---|
| 1 | **Spanish squat** | Ścięgno rzepki | Przysiad z gumą za kolanami, izometria 30–45 s — bezpieczny start | 2 | Guma |
| 2 | **TKE (Terminal Knee Extension)** | VMO, ścięgno rzepki | Guma za kolanem, przeprost w staniu — izoluje VMO | 1 | Guma |
| 3 | **Isometric box squat hold** | Ścięgno rzepki | Zejdź na skrzynię, utrzymaj 30–60 s — stymuluje regenerację | 1 | Skrzynia |
| 4 | **Step-up z ekscentryką** | Ścięgno rzepki | Wejdź na skrzynię, opuszczaj się bardzo wolno (3–5 s) | 1 | Skrzynia |
| 5 | **Przysiad bułgarski z izometrią** | Ścięgno rzepki, przednia noga | Zejdź do przysiadu, utrzymaj dół 20–30 s | 2 | Ławka |
| 6 | **Wall sit z progresją czasu** | Ścięgno rzepki, wyprostny | Plecy przy ścianie, kolana ~90°. Progresja: 30 s → 60 s → z obciążeniem | 1 | Ściana |
| 7 | **Leg extension 90°–45°** | Ścięgno rzepki, VMO | Maszyna w bezpiecznym zakresie (od 90° do 45° zgięcia) | 1 | Maszyna |
| 8 | **Reverse lunge z kontrolowanym opadaniem** | Ścięgno rzepki, cała noga | Krok w tył, bardzo wolne opadanie — mniej obciążające niż wykroki w przód | 1 | Hantle (opcja) |
| 9 | **Leg press izometrycznie** | Ścięgno rzepki | Utrzymaj pozycję przy zgięciu ~60° przez 30–45 s | 1 | Maszyna |
| 10 | **Foam rolling quads (nie roluj ścięgna!)** | Powięź czworogłowego | Delikatne rolowanie przedniego uda — zmniejsza napięcie ciągnące za ścięgno | 1 | Wałek |

---

### B6. DYSKOPATIA LĘDŹWIOWA — tag: `dyskopatia_L`

| # | Ćwiczenie | Cel anatomiczny | Mechanizm działania | Poz. | Sprzęt |
|---|---|---|---|---|---|
| 1 | **Dead bug** | Poprzeczny brzucha, tłocznia | Trenuje core bez obciążania krążków międzykręgowych | 1 | Brak |
| 2 | **Bird dog** | Wielodzielny, prostownik grzbietu | Wzmacnia lokalne stabilizatory odcinkowe przy neutralnej miednicy | 1 | Brak |
| 3 | **Plank + side plank** | Core globalny i lokalny | Wzmacnia tłocznię brzuszną. Side plank angażuje quadratus lumborum | 1 | Brak |
| 4 | **Mostek biodrowy (glute bridge)** | Pośladki, tył uda | Unoszenie bioder bez obciążania kręgosłupa — odciąża lędźwie | 1 | Brak |
| 5 | **McKenzie press-up** | Tylna część krążka | Leżąc na brzuchu, wypychaj klatkę, biodra na macie. Centralizuje ból | 1 | Brak |
| 6 | **Hip thrust z lekką gumą** | Pośladki | Pośladki przejmują pracę od zmęczonych prostowników lędźwi | 1 | Guma |
| 7 | **Cat-cow z oddechem** | Mobilność segmentalna | Delikatna mobilizacja zsynchronizowana z oddechem — poprawia odżywienie krążków | 1 | Brak |
| 8 | **Neural flossing — nerw kulszowy** | Nerw kulszowy | Naprzemiennie zginaj stopę grzbietowo i podeszwowo przy uniesionej nodze | 1 | Brak |
| 9 | **Sumo deadlift z lekkim kettlebells** | Wzorzec unoszenia — bezpiecznie | Szeroki rozstaw, plecy proste, ruch z bioder | 1 | Kettlebell |
| 10 | **Wall squat z piłką za plecami** | Noga + core bez obciążania | Piłka między ścianą a plecami odciąża kręgosłup | 1 | Piłka, ściana |

---

### B7. CIASNOTA PODBARKOWA — tag: `ciasnota_podbarkowa`

| # | Ćwiczenie | Cel anatomiczny | Mechanizm działania | Poz. | Sprzęt |
|---|---|---|---|---|---|
| 1 | **Dead hang z depresją łopatek** | Przestrzeń podbarkowa | Grawitacyjna dekompresja przestrzeni podbarkowej | 2 | Drążek |
| 2 | **Serratus wall slide** | Zębaty przedni | Rotuje łopatkę do góry → otwiera przestrzeń podbarkową | 1 | Ściana |
| 3 | **Rotacja zewnętrzna z gumą (łokieć przy tułowiu)** | Rotatory zewnętrzne | Stabilizuje głowę kości ramiennej w panewce | 1 | Guma |
| 4 | **Scapula pull-up** | Dolne pułapki, równoległoboczne | Zwieś, ściągnij łopatki bez zginania łokci — aktywuje dolne pułapki | 2 | Drążek |
| 5 | **Thumb-up lateral raise** | Naramienny + rotatory | Unoszenie z kciukami w górę — zmniejsza ryzyko impingementu | 1 | Lekkie hantle |
| 6 | **Sleeper stretch** | Tylna torebka stawowa | Rozciąganie napiętej torebki tylnej | 1 | Brak |
| 7 | **Foam rolling klatki i przedniego barku** | Powięź piersiowa | Uwalnia napięcia pociągające bark do przodu | 1 | Wałek/piłka |
| 8 | **YTWL w opadzie** | Wszystkie stabilizatory łopatki | Ręce w literach Y, T, W, L — wzmacnia cały kompleks | 1 | Lekkie hantle |
| 9 | **Ekscentryczne opuszczanie w wyciskaniu** | Rotatory, ekscentryka | Wypychaj dynamicznie, opuszczaj bardzo wolno (5 s) | 2 | Maszyna/hantle |
| 10 | **Rear delt fly (wznosy w opadzie)** | Tylne naramienne, równoległoboczne | Wzmacnia tylny akton — przeciwdziała dominacji przedniego barku | 1 | Lekkie hantle |

---

### B8. NIESTABILNOŚĆ BARKU — tag: `niestabilnosc_barku`

| # | Ćwiczenie | Cel anatomiczny | Mechanizm działania | Poz. | Sprzęt |
|---|---|---|---|---|---|
| 1 | **Rotacja zewnętrzna z przytrzymaniem** | Rotatory zewnętrzne | Izometryczne przytrzymanie 10–15 s w skrajnej rotacji | 1 | Guma |
| 2 | **Bottoms-up kettlebell carry** | Cały kompleks barkowy | Wymusza reaktywną kokontrakcję | 3 | Kettlebell |
| 3 | **Wall stabilization drill** | Stabilizatory panewki | Dłoń przy ścianie, małe ruchy okrężne z wyprostowanym ramieniem | 1 | Ściana |
| 4 | **Push-up plus** | Zębaty przedni | Pompka + dodatkowe wypchnięcie klatki na górze (protrakcja) | 1 | Brak |
| 5 | **Wiosłowanie z izometrią na górze** | Równoległoboczne, tylny naramienny | Przytrzymanie 5–10 s przy biodrze | 2 | Ławka, hantla |
| 6 | **4-way shoulder isometrics** | Rotatory, odwodziciele | 4 pozycje izometrycznie po 10–15 s — pełna stabilizacja | 1 | Ściana/guma |
| 7 | **Plank z unoszeniem ręki** | Core + stabilizacja barku | W desce unieś jedną rękę i utrzymaj | 2 | Brak |
| 8 | **Suitcase carry** | Anty-rotacja tułowia + stabilizacja barku | Chodź z kettlem w jednej ręce — bark stabilizuje biernie | 2 | Kettlebell |
| 9 | **Rzut i złapanie piłki lekarskiej przy ścianie** | Szybka kokontrakcja | Rzuć lekką piłkę o ścianę, złap — uczy szybkiej stabilizacji | 2 | Piłka lekarska |
| 10 | **Eccentric side raise** | Rotatory + naramienny | Unieś z pomocą, opuszczaj skrajnie wolno (5–7 s) | 1 | Lekka hantla |

---

### B9. NIESTABILNOŚĆ STAWU SKOKOWEGO — tag: `niestabilnosc_skokowa`

| # | Ćwiczenie | Cel anatomiczny | Mechanizm działania | Poz. | Sprzęt |
|---|---|---|---|---|---|
| 1 | **Stanie na jednej nodze (single-leg stance)** | Propriocepcja, mm. strzałkowe | Progresja: oczy otwarte → zamknięte → na poduszce → na BOSU | 1 | Poduszka sensomot. |
| 2 | **Wzniosy na palcach z piłką między kostkami** | Mm. strzałkowe, trójgłowy łydki | Piłka wymusza prawidłową pozycję pięty | 1 | Piłka |
| 3 | **Eccentric eversion** | Mm. strzałkowe długi i krótki | Guma stawia opór w inwersji — aktywnie wypychaj stopę na zewnątrz | 1 | Guma |
| 4 | **Ankle alphabet** | Wszystkie mięśnie wokół stawu | "Pisz" alfabet palcami stopy — pełny zakres we wszystkich płaszczyznach | 1 | Brak |
| 5 | **Hop to stabilization** | Dynamiczna stabilizacja | Wyskocz i wyląduj na jednej nodze — ustabilizuj | 2 | Brak |
| 6 | **Chodzenie na palcach + piętach + bokach stóp** | Wszystkie stabilizatory | 20 m na palcach, 20 m na piętach, 20 m na zewn. krawędziach | 1 | Brak |
| 7 | **BOSU squat** | Propriocepcja + siła | Przysiad na niestabilnym podłożu | 2 | BOSU/poduszka |
| 8 | **Single-leg jump rope** | Dynamiczna stabilizacja + wytrzymałość | Skoki na skakance na jednej nodze | 2 | Skakanka |
| 9 | **Star excursion balance test — treningowo** | Propriocepcja w wielu płaszczyznach | Sięganie drugą nogą w 4–8 kierunków na jednej nodze | 2 | Taśma na podłodze |
| 10 | **Eccentric single-leg calf raise** | Siła + kontrola ekscentryczna | Wspięcie na jednej nodze, opadanie bardzo wolno (5 s) | 2 | Podest |

---

### B10. ITBS — PASMO BIODROWO-PISZCZELOWE — tag: `ITBS`

| # | Ćwiczenie | Cel anatomiczny | Mechanizm działania | Poz. | Sprzęt |
|---|---|---|---|---|---|
| 1 | **Standing ITB stretch** | Pasmo biodrowo-piszczelowe | Skrzyżuj nogi, pochyl tułów w bok od bolącej strony | 1 | Brak |
| 2 | **Mostek jednonóż z przytrzymaniem** | Pośladek średni, wielki | Unoszenie bioder na jednej nodze, przytrzymanie 3 s | 1 | Brak |
| 3 | **Clamshell z gumą + przytrzymanie** | Rotatory zewnętrzne biodra | Otwórz kolana i przytrzymaj 5 s | 1 | Guma |
| 4 | **Lateral band walk** | Pośladek średni, odwodziciele | Guma na kostkach, idź bokiem — dynamiczna aktywacja | 1 | Guma |
| 5 | **Side plank z unoszeniem nogi** | QL, pośladek średni | Łączy stabilizację boczną tułowia z pracą odwodzicieli | 2 | Brak |
| 6 | **Foam rolling ITB (nie przy ostrym stanie!)** | Powięź pasma | Powoli roluj od biodra do kolana — nie roluj samego kolana | 1 | Wałek |
| 7 | **Assisted single-leg squat** | Wzorzec stabilizacji na jednej nodze | Trzymając TRX/słupek, zejdź na jednej nodze — kolano nie ucieka | 1 | TRX/słupek |
| 8 | **Lateral lunges** | Odwodziciele, przywodziciele | Krok w bok, przysiad na jednej nodze, druga prosta | 1 | Brak |
| 9 | **Banded bridge + abduction** | Pośladek średni | Guma nad kolanami, unieś biodra i odwiedź kolana na górze | 1 | Guma |
| 10 | **Pallof press + lunge** | Core + biodro | Wypchnij linkę i zejdź do wykroku — stabilizacja przy ruchu nogi | 2 | Wyciąg |

---

### Struktura danych ćwiczenia (dla implementacji)

Każde ćwiczenie (podstawowe i korekcyjne) przechowuje:

- **id** — unikalny identyfikator
- **name** — pełna nazwa
- **type** — `podstawowe` lub `korekcyjne`
- **tags** — tablica tagów systemowych
- **body_region** — dla korekcyjnych: region ciała
- **condition_tags** — dla korekcyjnych: tagi przypadłości
- **target_anatomy** — cel anatomiczny
- **difficulty** — 1/2/3
- **equipment** — wymagany sprzęt
- **contraindications** — przeciwwskazania
- **instructions** — opis krok po kroku
- **common_mistakes** — najczęstsze błędy
- **regression_id** — ID łatwiejszej wersji (nullable)
- **progression_id** — ID trudniejszej wersji (nullable)
- **video_url** — link do instruktażu (opcjonalnie)

---

**Razem:** 90 ćwiczeń podstawowych + 100 ćwiczeń korekcyjnych = 190 ćwiczeń w bazie.