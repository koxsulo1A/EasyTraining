(function() {
  'use strict';
  window.ET = window.ET || {};

  // ── JEDYNA BRAMA do danych localStorage POWIĄZANYCH Z KONTEM ────────────
  // Kontekst: ten sam błąd (wyciek danych jednego konta do drugiego na tym
  // samym urządzeniu) naprawiano już DWA razy w dwóch różnych miejscach:
  //   - dla store'u "et_v1"        → 825065e (LAST_UID_KEY w sync.js)
  //   - dla cache silnika "etcore:*" → 42309e5 (ta sama sesja, osobna łatka)
  // Dwie niezależne naprawy tego samego problemu = brak systemowej bariery,
  // nie punktowy błąd. Ten plik jest tą barierą: każdy klucz localStorage,
  // który trzyma dane POWIĄZANE Z KONKRETNYM KONTEM, musi być zarejestrowany
  // w ACCOUNT_KEY_PREFIXES poniżej. Wtedy `resolveAccountLogin`/`clearAccountData`
  // automatycznie go obejmują — żaden nowy moduł nie może "zapomnieć" dopisać
  // się do ręcznej listy czyszczenia, bo takiej listy już nigdzie indziej nie ma.
  //
  // ZASADA dla przyszłych modułów: jeśli dodajesz nowy klucz localStorage,
  // który przechowuje dane per-użytkownik (nie ogólną flagę urządzenia jak
  // tryb offline), zarejestruj jego prefiks tutaj przez ET.AccountStorage.registerPrefix(),
  // najlepiej w IIFE tego modułu przy starcie. Nie wołaj localStorage.setItem/getItem
  // dla danych kontowych bezpośrednio z innych plików — użyj tego modułu.

  var STORE_KEY = 'et_v1';
  var LAST_UID_KEY = 'et_last_synced_uid';
  var ACCOUNT_KEY_PREFIXES = [STORE_KEY, 'etcore:'];

  function matchesRegisteredPrefix(key) {
    for (var i=0; i<ACCOUNT_KEY_PREFIXES.length; i++) {
      var p = ACCOUNT_KEY_PREFIXES[i];
      if (key === p || key.indexOf(p) === 0) return true;
    }
    return false;
  }

  function registerPrefix(prefix) {
    if (ACCOUNT_KEY_PREFIXES.indexOf(prefix) === -1) ACCOUNT_KEY_PREFIXES.push(prefix);
  }

  // Usuwa WSZYSTKIE zarejestrowane dane powiązane z kontem z tego urządzenia.
  // Jedyne miejsce w kodzie, które powinno to robić — zamiast ręcznego
  // localStorage.removeItem('et_v1') rozrzuconego po plikach (profile.js,
  // dev-panel.js kiedyś tak robiły i przez to NIE czyściły etcore:*).
  function clearAccountData() {
    try {
      var toRemove = [];
      for (var i=0; i<localStorage.length; i++) {
        var k = localStorage.key(i);
        if (k && matchesRegisteredPrefix(k)) toRemove.push(k);
      }
      toRemove.forEach(function(k){ localStorage.removeItem(k); });
    } catch(e) {}
  }

  // Rozstrzyga, co zrobić przy pociągnięciu danych po zalogowaniu na tym
  // urządzeniu, na podstawie trwałego znacznika "ostatnie zsynchronizowane
  // konto". Centralizuje logikę wcześniej rozrzuconą po sync.js (odczyt,
  // porównanie, ewentualne czyszczenie, zapis — w jednym miejscu zamiast
  // czterech).
  //   'same'     — to samo konto co ostatnio na tym urządzeniu
  //   'first'    — brak znacznika (pierwsze logowanie / po trybie offline)
  //   'switched' — inne konto niż ostatnio — dane poprzedniego konta
  //                zostają wyczyszczone PRZED zwróceniem werdyktu
  function resolveAccountLogin(uid) {
    var lastUid = null;
    try { lastUid = localStorage.getItem(LAST_UID_KEY); } catch(e) {}
    var verdict = (lastUid === uid) ? 'same' : (lastUid === null ? 'first' : 'switched');
    if (verdict === 'switched') clearAccountData();
    try { localStorage.setItem(LAST_UID_KEY, uid); } catch(e) {}
    return verdict;
  }

  Object.assign(window.ET, {
    AccountStorage: {
      STORE_KEY: STORE_KEY,
      registerPrefix: registerPrefix,
      clearAccountData: clearAccountData,
      resolveAccountLogin: resolveAccountLogin
    }
  });
})();
