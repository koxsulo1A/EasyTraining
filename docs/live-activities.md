# Live Activities (iOS) — projekt modułu

Status: PROJEKT (do implementacji wymaga natywnego kodu Swift — patrz sekcja "Wymagania konta")
Data: 2026-07-06

---

## 1. Cel

Podczas aktywnego treningu (siłowego lub biegowego) użytkownik widzi kluczowe dane
bez otwierania aplikacji:

- **Ekran blokady** — karta Live Activity (iOS 16.1+)
- **Dynamic Island** — compact / minimal / expanded (iPhone 14 Pro+)

---

## 2. Zakres funkcjonalny

### 2.1 Trening siłowy

| Element | Ekran blokady | DI compact | DI expanded |
|---|---|---|---|
| Odliczanie przerwy | ✅ duży timer | ✅ (jedyny element) | ✅ |
| Nazwa aktualnego ćwiczenia | ✅ | — | ✅ |
| Numer serii (np. 3/4) | ✅ | — | ✅ |
| Ciężar + planowane powtórzenia | ✅ | — | ✅ |
| Następne ćwiczenie | ✅ (mniejszą czcionką) | — | ✅ |

Timer przerwy używa `Text(timerInterval:)` — **odlicza natywnie po stronie systemu**,
bez żadnych aktualizacji z aplikacji. To kluczowa optymalizacja: jedna aktualizacja
(start przerwy z datą końca) zamiast aktualizacji co sekundę.

### 2.2 Trening biegowy (dodatkowo)

| Element | Warunek wyświetlenia |
|---|---|
| Dystans | GPS aktywny (CoreLocation) |
| Tempo | dystans > 100 m |
| Tętno | dostępny sensor (Watch/pas BLE) — **inaczej UKRYJ** |
| Czas treningu | zawsze (`Text(timerInterval:)` — natywny) |

**Zasada "brak danych = brak elementu"**: każde pole w `ContentState` jest `Optional`.
Widget SwiftUI renderuje sekcję tylko gdy wartość istnieje (`if let hr = state.heartRate`).
Nigdy "--" ani "0".

---

## 3. Analiza źródeł danych czasu rzeczywistego

### 3.1 Apple HealthKit

- **Odczyt na żywo:** częściowy. `HKAnchoredObjectQuery` + `enableBackgroundDelivery`
  dostarcza próbki tętna/dystansu z opóźnieniem ~2–5 s, gdy zapisuje je inne urządzenie
  (np. Apple Watch w trakcie treningu Watch).
- **Dane:** tętno, dystans, kalorie, kroki — wszystko co inne aplikacje zapisują do Health.
- **Ograniczenia:** dane pojawiają się dopiero po zapisaniu przez źródło; Watch buforuje
  i wysyła paczkami. Bez własnej aplikacji Watch nie ma gwarancji ciągłego strumienia.
- **Konto Apple Developer:** **TAK, płatne** — entitlement HealthKit nie działa na darmowym
  sideload (to samo ograniczenie co nasz przycisk "🍎 Apple Fitness").
- **Uprawnienia:** zgoda użytkownika per typ danych (HKAuthorizationStatus).
- **Obejście zgodne z wytycznymi:** brak. HealthKit bez entitlementu nie istnieje.

### 3.2 Apple WorkoutKit / HKWorkoutSession

- **Odczyt na żywo:** TAK, ale **tylko na watchOS**. `HKWorkoutSession` + builder daje
  strumień tętna/dystansu w czasie rzeczywistym — wymaga własnej aplikacji na Apple Watch.
- **Na iPhone:** iOS 17+ `WorkoutKit` służy do *planowania* treningów (kompozycje interwałów),
  nie do odczytu live.
- **Konto:** płatne (HealthKit entitlement) + osobny target watchOS.
- **Wniosek:** etap przyszły — dopiero gdy powstanie aplikacja Watch.

### 3.3 CoreLocation (GPS) — dla biegu

- **Odczyt na żywo:** TAK, natywnie na iPhone. `CLLocationManager` z
  `allowsBackgroundLocationUpdates` daje pozycję co ~1 s → dystans i tempo liczymy sami.
- **Konto:** działa na darmowym sideload (background location to zwykły
  UIBackgroundMode, nie restricted entitlement).
- **Uprawnienia:** zgoda "Podczas używania" + tryb tła `location`.
- **To jest NASZE podstawowe źródło dla biegu** — niezależne od Health.

### 3.4 Bluetooth LE (pas HR, czujniki)

- **Odczyt na żywo:** TAK. Standardowy profil GATT Heart Rate (0x180D) — każdy pas
  (Polar, Garmin, Xiaomi z trybem BLE) wysyła tętno co ~1 s.
- **Konto:** darmowe sideload OK (`bluetooth-central` background mode).
- **Wniosek:** najlepsza droga do tętna live **bez płatnego konta**.

### 3.5 Google Fit

- **Odczyt na żywo:** NIE na iOS. Google Fit REST API ma opóźnienie minut–godzin,
  SDK iOS wycofane (Google przeszło na Health Connect, który jest Android-only).
- **Wniosek:** nie integrować na iOS. Ewentualny import historyczny przez REST — osobny temat.

### 3.6 Xiaomi / Mi Fitness

- **Odczyt na żywo:** NIE oficjalnie. Brak publicznego API czasu rzeczywistego.
- **Obejścia:** (a) opaska w trybie nadawania BLE HR → sekcja 3.4; (b) Mi Fitness → Apple
  Health sync (opóźniony, historyczny). Nieoficjalne reverse-engineering protokołu —
  odrzucone (ryzyko App Store review + niestabilność).

### 3.7 Podsumowanie źródeł

| Źródło | Live? | Darmowe konto? | Rola w module |
|---|---|---|---|
| CoreLocation (GPS) | ✅ | ✅ | dystans/tempo biegu — GŁÓWNE |
| BLE Heart Rate | ✅ | ✅ | tętno — GŁÓWNE |
| HealthKit | ~ (2–5 s) | ❌ płatne | tętno z Watch — OPCJA premium |
| WorkoutKit/Watch | ✅ (watchOS) | ❌ + app Watch | przyszłość |
| Google Fit | ❌ | — | pominąć (iOS) |
| Xiaomi | ❌ (poza BLE) | — | przez BLE lub pominąć |

Dane treningu siłowego (seria, ciężar, przerwa) pochodzą **z naszej aplikacji** — nie
potrzebują żadnego zewnętrznego źródła.

---

## 4. Architektura

### 4.1 Warstwy

```
┌────────────────────────────────────────────────────────┐
│ WebView (React bez JSX)                                │
│  strength.js / running.js                              │
│    └─ ET.LiveActivity.start/update/end  (js/live-activity.js)
├────────────────────────────────────────────────────────┤
│ Capacitor Plugin "LiveActivityPlugin" (Swift)          │
│  - bridge JSON → ActivityKit ContentState              │
│  - throttling + dedup (nie przekazuje identycznych stanów)
├────────────────────────────────────────────────────────┤
│ ActivityKit (iOS 16.1+)                                │
│  Activity<WorkoutAttributes>.request/update/end        │
├────────────────────────────────────────────────────────┤
│ Widget Extension "EasyTrainingWidgets" (SwiftUI)       │
│  - LockScreen view                                     │
│  - DynamicIsland { compact / minimal / expanded }      │
├────────────────────────────────────────────────────────┤
│ Natywne źródła live (tylko bieg):                      │
│  RunTracker.swift: CLLocationManager + CBCentralManager│
│  → aktualizuje Activity BEZPOŚREDNIO (bez WebView!)    │
└────────────────────────────────────────────────────────┘
```

**Kluczowa decyzja:** podczas biegu WebView może zostać zamrożony przez system
(brak trybu tła dla JS). Dlatego `RunTracker.swift` działa natywnie: sam liczy
dystans/tempo, sam aktualizuje Live Activity, a po powrocie do aplikacji oddaje
zbuforowane próbki do WebView (→ event `RunFinished` → Running Engine w core).
To zgodne z filozofią offline-first: natywna warstwa jest tylko sensorem+wyświetlaczem,
źródłem prawdy pozostaje core.

### 4.2 Model danych (ContentState)

```swift
struct WorkoutAttributes: ActivityAttributes {
  // stałe przez cały trening
  let workoutType: String   // "strength" | "run"
  let planName: String

  struct ContentState: Codable, Hashable {
    // — siłowy —
    var exerciseName: String?
    var setNumber: Int?
    var setTotal: Int?
    var weightKg: Double?
    var plannedReps: Int?
    var nextExercise: String?
    var restEndsAt: Date?      // → Text(timerInterval:) liczy system
    // — bieg —
    var distanceKm: Double?
    var paceSecPerKm: Int?
    var heartRate: Int?        // nil = sekcja ukryta
    var startedAt: Date        // czas treningu → natywny timer
  }
}
```

Wszystko opcjonalne poza `startedAt` — realizuje zasadę "brak danych = brak elementu".

### 4.3 API pluginu (kontrakt JS ↔ Swift)

```
ET.LiveActivity = {
  isAvailable(): Promise<{available:boolean, dynamicIsland:boolean}>,
  start(attrs, state): Promise<{activityId}>,
  update(state):        Promise<void>,   // partial merge po stronie Swift
  end(finalState?):     Promise<void>,   // dismissalPolicy: .after(4h) lub .immediate
}
```

Punkty wywołań w istniejącym kodzie:
- `strength.js` → `doneSet()` (start przerwy: `update({restEndsAt, setNumber…})`),
  przejście do następnego ćwiczenia, `finish()` (→ `end()`)
- `running.js` → start/stop biegu (dystans/tempo/HR aktualizuje natywny RunTracker)

Graceful degradation jak w `health.js`: brak pluginu / iOS < 16.1 / przeglądarka →
`isAvailable()=false`, aplikacja działa bez zmian.

### 4.4 Przepływ — trening siłowy (zero pollingu)

```
[user: "seria zaliczona"]
  strength.js doneSet()
    → LiveActivity.update({ restEndsAt: now+90s, setNumber: 3, ... })
      → 1 aktualizacja ActivityKit
        → system SAM odlicza timer na ekranie blokady/DI
[user: kolejna seria] → kolejna 1 aktualizacja
[finish()] → end() + WorkoutFinished do core (bez zmian)
```

Typowy trening: ~20–40 aktualizacji na godzinę. Znikome zużycie baterii.

### 4.5 Przepływ — bieg

```
RunTracker (Swift, w tle):
  GPS co 1s → bufor
  co 15–30 s LUB przy zmianie ≥0.05 km / ≥5 bpm:
    → Activity.update(...)        (throttle chroni budżet aktualizacji)
  BLE HR: subskrypcja 0x2A37 → ostatnia wartość do następnego update
[stop] → end() + przekazanie próbek do WebView → RunFinished → core
```

### 4.6 Minimalizacja baterii

1. Timery liczone przez system (`timerInterval`) — zero aktualizacji podczas odliczania.
2. Throttle 15–30 s + progi zmian dla biegu; dedup identycznych stanów w pluginie.
3. GPS: `desiredAccuracy = .nearestTenMeters`, `activityType = .fitness`
   (system może przygasić GPS na prostych odcinkach).
4. Brak push-updates (ActivityKit push wymaga płatnego konta i serwera) — wszystkie
   aktualizacje lokalne, co dla treningu w toku jest w pełni wystarczające.

---

## 5. Ograniczenia platformy

| Ograniczenie | Wartość / skutek |
|---|---|
| iOS minimum | 16.1 (Live Activities), 16.2+ zalecane |
| Dynamic Island | tylko iPhone 14 Pro+ — na starszych: ekran blokady |
| Czas życia Activity | max 8 h aktywna + 4 h na ekranie blokady po `end()` |
| Rozmiar ContentState | **4 KB** — nasz stan ~200 B, duży zapas |
| Budżet aktualizacji lokalnych | brak twardego limitu, ale nadmiar → system opóźnia; throttle obowiązkowy |
| Tło JS (WebView) | brak — stąd natywny RunTracker |
| Free Apple ID (sideload) | widget extension zużywa 1 z 3 App ID; **push entitlement niedostępny** (lokalne update'y działają); HealthKit niedostępny |
| App Store Review | Live Activity musi pokazywać realny trwający proces (trening = wzorcowy przypadek); nie wolno używać jej jako reklamy/bannera |

**Wymagania konta — podsumowanie:**
- Live Activities z lokalnymi aktualizacjami + GPS + BLE HR: **działa na darmowym sideload**
  (dochodzi drugi target w Xcode — GitHub Actions workflow trzeba rozszerzyć o widget extension).
- Tętno z Apple Watch przez HealthKit: wymaga płatnego konta (99 USD/rok).

---

## 6. Plan implementacji (przyszłe fazy)

1. **Faza LA-1:** Widget extension + plugin + trening siłowy (timer przerwy, seria,
   ćwiczenie). Czysto lokalne, darmowe konto. Zmiany: `ios/App` (Swift), `js/live-activity.js`,
   hooki w `strength.js`, workflow iOS.
2. **Faza LA-2:** RunTracker (GPS + tempo) dla biegu.
3. **Faza LA-3:** BLE Heart Rate (pas / opaska w trybie BLE).
4. **Faza LA-4 (premium):** HealthKit live z Watch — po zakupie konta developerskiego.
