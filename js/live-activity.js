(function() {
  'use strict';
  window.ET = window.ET || {};

  // Live Activities (iOS 16.2+): ekran blokady + Dynamic Island.
  // Poza natywnym iOS wszystkie funkcje są no-op — zero wpływu na web/Android.
  function getPlugin() {
    var C = window.Capacitor;
    if (!C || !C.isNativePlatform || !C.isNativePlatform()) return null;
    return (C.Plugins && C.Plugins.LiveActivity) || null;
  }

  var active = false;
  var lastReason = null; // diagnostyka: czemu Live Activity nie wystartowała

  ET.LiveActivity = {
    available: function() {
      var p = getPlugin();
      if (!p) { lastReason = 'brak natywnego iOS (web/Android)'; return Promise.resolve(false); }
      return p.isAvailable().then(function(r){
        if (!(r && r.available)) lastReason = 'wyłączone w Ustawieniach iOS lub iOS < 16.2';
        return !!(r && r.available);
      }).catch(function(e){ lastReason = String(e); return false; });
    },

    lastReason: function() { return lastReason; },

    // Test diagnostyczny: start → 8 s → end. Zwraca { ok, reason }.
    test: function() {
      var self = this;
      return self.start({ workoutType:'strength', planName:'Test Live Activity' },
        { startedAt:Date.now(), exerciseName:'Test — panel działa ✓', setNumber:1, setTotal:3,
          weightKg:60, plannedReps:10, doneSets:1, totalSets:12, restEndsAt:Date.now()+8000 })
        .then(function(ok){
          if (ok) setTimeout(function(){ self.end(); }, 8000);
          return { ok:ok, reason: ok ? null : lastReason };
        });
    },

    // attrs: { workoutType:'strength'|'run', planName }
    // state: pola ContentState (exerciseName, setNumber, restEndsAt(ms), startedAt(ms)…)
    start: function(attrs, state) {
      var p = getPlugin();
      if (!p) { lastReason = 'brak natywnego iOS (web/Android)'; return Promise.resolve(false); }
      var payload = Object.assign({}, attrs, state);
      return p.start(payload).then(function(r) {
        active = !!(r && r.started);
        if (!active) lastReason = (r && r.reason) || 'nieznany powód';
        else lastReason = null;
        if (!active) console.warn('[live-activity] nie wystartowała:', lastReason);
        return active;
      }).catch(function(e){ lastReason = String(e); console.warn('[live-activity] start:', e); return false; });
    },

    update: function(state) {
      var p = getPlugin();
      if (!p || !active) return Promise.resolve();
      return p.update(state).catch(function(e){ console.warn('[live-activity] update:', e); });
    },

    end: function() {
      var p = getPlugin();
      if (!p || !active) return Promise.resolve();
      active = false;
      return p.end({}).catch(function(e){ console.warn('[live-activity] end:', e); });
    },

    // Sprząta OSIEROCONĄ aktywność z poprzedniej sesji (np. użytkownik zabił
    // appkę w trakcie treningu — Live Activity żyje niezależnie od procesu
    // appki, więc zostaje zawieszona na ekranie blokady bez aktualizacji).
    // Wołane raz przy każdym starcie appki — nieaktywna flaga JS-owa (`active`)
    // celowo pomijana, bo natywna aktywność mogła przetrwać restart procesu.
    cleanupOrphaned: function() {
      var p = getPlugin();
      if (!p) return Promise.resolve();
      return p.end({}).catch(function(e){ console.warn('[live-activity] cleanup:', e); });
    }
  };
})();
