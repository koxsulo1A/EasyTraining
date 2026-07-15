(function() {
  'use strict';
  window.ET = window.ET || {};

  // Synchronizacja store'u z Supabase (user_data.data jako JSON).
  // Zasada: przy logowaniu jednorazowy pull (chmura wygrywa, jeśli ma dane,
  // inaczej wypycha bieżący lokalny stan). Potem każda zmiana store'u
  // pushowana z debounce 1.5s. Brak konfliktów wielourządzeniowych — proste
  // last-write-wins, wystarczające dla jednego użytkownika na kilku sprzętach.
  function SyncManager() {
    var auth = ET.useAuth();
    var su = ET.useStore(); var store = su.store, update = su.update;
    var toast = ET.useToast();
    var pulledForUser = React.useRef(null);
    var pushTimer = React.useRef(null);
    var lastPushedJson = React.useRef('');

    var uid = auth && auth.session && auth.session.user && auth.session.user.id;

    // Pull raz na sesję logowania
    React.useEffect(function() {
      if (!uid || !ET.supabase) return;
      if (pulledForUser.current === uid) return;
      pulledForUser.current = uid;
      ET.supabase.from('user_data').select('data').eq('user_id', uid).maybeSingle().then(function(res) {
        if (res.error) { console.warn('[sync] pull error:', res.error); return; }
        if (res.data && res.data.data && Object.keys(res.data.data).length) {
          update(function() { return res.data.data; });
          lastPushedJson.current = JSON.stringify(res.data.data);
          toast('Zsynchronizowano z chmurą ✓', 'success');
        } else {
          ET.supabase.from('user_data').upsert({ user_id:uid, data:store, updated_at:new Date().toISOString() }).then(function(r) {
            if (!r.error) lastPushedJson.current = JSON.stringify(store);
          });
        }
      });
    }, [uid]);

    // Push po każdej zmianie (debounced)
    React.useEffect(function() {
      if (!uid || !ET.supabase || pulledForUser.current !== uid) return;
      var json = JSON.stringify(store);
      if (json === lastPushedJson.current) return;
      if (pushTimer.current) clearTimeout(pushTimer.current);
      pushTimer.current = setTimeout(function() {
        lastPushedJson.current = json;
        ET.supabase.from('user_data').upsert({ user_id:uid, data:store, updated_at:new Date().toISOString() })
          .then(function(r) { if (r.error) console.warn('[sync] push error:', r.error); });
      }, 1500);
      return function() { clearTimeout(pushTimer.current); };
    });

    // Reset przy wylogowaniu — kolejne logowanie (nawet innym kontem) pullnie od nowa
    React.useEffect(function() {
      if (!uid) { pulledForUser.current = null; lastPushedJson.current = ''; }
    }, [uid]);

    return null;
  }

  ET.SyncManager = SyncManager;
})();
