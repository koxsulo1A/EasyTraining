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

  ET.LiveActivity = {
    available: function() {
      var p = getPlugin();
      if (!p) return Promise.resolve(false);
      return p.isAvailable().then(function(r){ return !!(r && r.available); }).catch(function(){ return false; });
    },

    // attrs: { workoutType:'strength'|'run', planName }
    // state: pola ContentState (exerciseName, setNumber, restEndsAt(ms), startedAt(ms)…)
    start: function(attrs, state) {
      var p = getPlugin();
      if (!p) return Promise.resolve(false);
      var payload = Object.assign({}, attrs, state);
      return p.start(payload).then(function(r) {
        active = !!(r && r.started);
        return active;
      }).catch(function(e){ console.warn('[live-activity] start:', e); return false; });
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
    }
  };
})();
