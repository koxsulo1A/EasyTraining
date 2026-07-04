# EasyTraining

Offline'owa aplikacja treningowa (HTML/CSS/JS, React lokalnie, dane w localStorage).
Wersja iOS budowana jest jako niepodpisany `.ipa` w GitHub Actions i instalowana przez sideload.

## Jak zdobyć plik .ipa

1. Wejdź w zakładkę **Actions** w tym repo → workflow **„Build unsigned iOS IPA"**.
2. Uruchamia się sam po każdym pushu na `main` (albo odpal ręcznie: **Run workflow**).
3. Po zakończeniu (~kilka minut) pobierz artefakt **`EasyTraining-unsigned-ipa`** — w środku jest `EasyTraining-unsigned.ipa`.

## Jak zainstalować na iPhone (bez płatnego konta Apple)

Plik jest **niepodpisany** — podpisuje go dopiero narzędzie do sideloadu Twoim darmowym Apple ID:

- **AltStore** (macOS/Windows + AltServer) — https://altstore.io
- **Sideloadly** (macOS/Windows) — https://sideloadly.io

Kroki (Sideloadly):
1. Podłącz iPhone kablem, zainstaluj Sideloadly na komputerze.
2. Przeciągnij `EasyTraining-unsigned.ipa` do okna Sideloadly.
3. Podaj darmowe Apple ID → **Start**.
4. Na iPhonie: *Ustawienia → Ogólne → VPN i zarządzanie urządzeniem* → zaufaj profilowi dewelopera.

> Uwaga: darmowe Apple ID podpisuje aplikację na **7 dni** — po tym czasie trzeba ją odświeżyć (AltStore robi to automatycznie w tle, gdy AltServer działa).

## Rozwój (web)

Źródła są w katalogu głównym (`index.html`, `js/`, `css/`). Podgląd lokalny np.:

```
python -m http.server 7432
```

`npm run build:web` kopiuje źródła do `www/` (to katalog, który Capacitor pakuje do apki). Katalogi `www/`, `ios/`, `node_modules/` są generowane i nie trafiają do repo.
