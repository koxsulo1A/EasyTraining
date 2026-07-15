(function() {
  'use strict';
  window.ET = window.ET || {};

  // Synchronizacja store'u z Supabase (user_data.data jako JSON).
  // Zasada: przy logowaniu jednorazowy pull (chmura wygrywa, jeśli ma dane,
  // inaczej wypycha bieżący lokalny stan). Potem każda zmiana store'u
  // pushowana z debounce 1.5s. Brak konfliktów wielourządzeniowych — proste
  // last-write-wins, wystarczające dla jednego użytkownika na kilku sprzętach.
  var LAST_UID_KEY = 'et_last_synced_uid';

  function SyncManager() {
    var auth = ET.useAuth();
    var su = ET.useStore(); var store = su.store, update = su.update;
    var toast = ET.useToast();
    var pulledForUser = React.useRef(null);
    var pushTimer = React.useRef(null);
    var lastPushedJson = React.useRef('');

    var uid = auth && auth.session && auth.session.user && auth.session.user.id;

    // Pull raz na sesję logowania. Znacznik LAST_UID_KEY (trwały, przeżywa
    // restart apki/przeglądarki) chroni przed "przeciekiem" danych: gdy na
    // tym urządzeniu ostatnio było zsynchronizowane INNE konto, a w chmurze
    // nowego konta jeszcze nic nie ma — lokalne dane resetujemy zamiast
    // wypychać je jako "swoje" pod nowe konto. Pierwsze logowanie po trybie
    // offline (brak znacznika) nadal migruje istniejące dane offline w górę.
    React.useEffect(function() {
      if (!uid || !ET.supabase) return;
      if (pulledForUser.current === uid) return;
      pulledForUser.current = uid;
      var lastUid = null;
      try { lastUid = localStorage.getItem(LAST_UID_KEY); } catch(e) {}

      ET.supabase.from('user_data').select('data').eq('user_id', uid).maybeSingle().then(function(res) {
        if (res.error) { console.warn('[sync] pull error:', res.error); return; }
        var hasCloudData = res.data && res.data.data && Object.keys(res.data.data).length;

        if (hasCloudData) {
          update(function() { return res.data.data; });
          lastPushedJson.current = JSON.stringify(res.data.data);
          toast('Zsynchronizowano z chmurą ✓', 'success');
        } else if (lastUid === uid || lastUid === null) {
          // to samo konto co ostatnio (lub pierwsze logowanie z trybu offline) — wypchnij lokalne dane
          ET.supabase.from('user_data').upsert({ user_id:uid, data:store, updated_at:new Date().toISOString() }).then(function(r) {
            if (!r.error) lastPushedJson.current = JSON.stringify(store);
          });
        } else {
          // inne konto niż ostatnio na tym urządzeniu — nowe konto dostaje nowe, puste dane
          var fresh = ET.emptyStoreSnapshot ? ET.emptyStoreSnapshot() : {};
          update(function() { return fresh; });
          ET.supabase.from('user_data').upsert({ user_id:uid, data:fresh, updated_at:new Date().toISOString() }).then(function(r) {
            if (!r.error) lastPushedJson.current = JSON.stringify(fresh);
          });
        }
        try { localStorage.setItem(LAST_UID_KEY, uid); } catch(e) {}
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

    // Reset przy wylogowaniu — czyści lokalne dane, żeby nie przeciekły do
    // gościa/innego konta na tym samym urządzeniu; kolejne logowanie pullnie od nowa.
    var prevUid = React.useRef(uid);
    React.useEffect(function() {
      if (prevUid.current && !uid) {
        pulledForUser.current = null;
        lastPushedJson.current = '';
        if (ET.emptyStoreSnapshot) update(function(){ return ET.emptyStoreSnapshot(); });
      }
      prevUid.current = uid;
    }, [uid]);

    return null;
  }

  ET.SyncManager = SyncManager;
})();
