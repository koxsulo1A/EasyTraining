(function() {
  'use strict';
  window.ET = window.ET || {};

  // Wykrycie natywnego pluginu HealthKit (nazwy różnią się między pluginami).
  function getPlugin() {
    var C = window.Capacitor;
    if (!C || !C.Plugins) return null;
    return C.Plugins.CapacitorHealthkit || C.Plugins.HealthKit || C.Plugins.Health || null;
  }

  // true tylko na iOS z zainstalowanym pluginem (na urządzeniu, nie w przeglądarce).
  ET.appleHealthAvailable = function() {
    var C = window.Capacitor;
    var native = C && C.isNativePlatform && C.isNativePlatform();
    return !!(native && getPlugin());
  };

  // Budowa providera zgodnego z kontraktem core (ADR-010). Mapowanie jest
  // defensywne — różne pluginy zwracają nieco inne kształty rekordów.
  function buildProvider() {
    var hk = getPlugin();
    if (!hk) return null;
    return {
      isAvailable: function() {
        if (hk.isAvailable) return Promise.resolve(hk.isAvailable()).then(function(r){ return r && r.available !== false; }).catch(function(){ return true; });
        return Promise.resolve(true);
      },
      requestAuth: function() {
        var perms = { read: ['workouts', 'distanceWalkingRunning', 'heartRate', 'activeEnergyBurned'], write: [] };
        var fn = hk.requestAuthorization || hk.requestPermissions || hk.authorize;
        if (!fn) return Promise.resolve(false);
        return Promise.resolve(fn.call(hk, perms)).then(function(){ return true; }).catch(function(){ return false; });
      },
      getRunningWorkouts: function(sinceTs) {
        var start = new Date(sinceTs || 0).toISOString();
        var end = new Date().toISOString();
        var fn = hk.queryWorkouts || hk.getWorkouts || hk.queryHKitSampleType;
        if (!fn) return Promise.resolve([]);
        return Promise.resolve(fn.call(hk, { startDate: start, endDate: end, sampleName: 'workoutType', limit: 0 }))
          .then(function(res) {
            var list = (res && (res.workouts || res.resultData || res.data || res)) || [];
            if (!Array.isArray(list)) return [];
            return list
              .filter(function(w) {
                var t = (w.workoutActivityType || w.activityType || w.type || '').toString().toLowerCase();
                return t.indexOf('run') !== -1;
              })
              .map(function(w) {
                var startMs = new Date(w.startDate || w.start || w.startTime || 0).getTime();
                var endMs = new Date(w.endDate || w.end || w.endTime || 0).getTime();
                var distM = w.totalDistance || w.distance || 0;
                return {
                  externalId: w.uuid || w.id || (startMs + '_run'),
                  startTs: startMs,
                  distanceKm: distM > 100 ? distM / 1000 : distM,   // metry→km jeśli trzeba
                  durationMin: (w.duration ? w.duration / 60 : (endMs > startMs ? (endMs - startMs) / 60000 : 0)),
                  avgHr: w.averageHeartRate || w.avgHr || undefined,
                  source: 'apple-health'
                };
              });
          })
          .catch(function() { return []; });
      }
    };
  }

  // Główna akcja: „Połącz z Apple Fitness" → import biegów do aplikacji.
  ET.connectAppleHealth = function(update, toast) {
    if (!ET.appleHealthAvailable()) {
      toast && toast('Apple Health działa tylko na iPhonie z odblokowanym HealthKit (konto Apple Developer).', 'error');
      return Promise.resolve({ available: false });
    }
    if (!window.etcore || !window.ETCore || !ETCore.syncRunningWorkouts) {
      toast && toast('Rdzeń aplikacji nie jest gotowy.', 'error');
      return Promise.resolve({ available: false });
    }
    var provider = buildProvider();
    return ETCore.syncRunningWorkouts(window.etcore, provider, function(run) {
      update(function(s) {
        var runs = s.runs || [];
        if (runs.some(function(r) { return r.externalId === run.externalId; })) return s; // dedup w UI store
        var pace = ET.calcPace ? ET.calcPace(run.distance, run.duration) : '';
        var entry = Object.assign({ id: Date.now() + Math.floor(Math.random() * 1000), type: 'run', pace: pace }, run);
        return Object.assign({}, s, { runs: [entry].concat(runs) });
      });
    }).then(function(res) {
      if (!res.authorized) toast && toast('Brak zgody na dostęp do Apple Health.', 'error');
      else toast && toast('Apple Health: zaimportowano ' + res.imported + ' biegów' + (res.skipped ? ' (' + res.skipped + ' już były)' : '') + ' ✓', 'success');
      return res;
    }).catch(function(err) {
      console.error('[health]', err);
      toast && toast('Błąd synchronizacji z Apple Health.', 'error');
      return { available: true, error: true };
    });
  };
})();
