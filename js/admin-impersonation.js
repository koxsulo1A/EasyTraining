(function() {
  'use strict';
  window.ET = window.ET || {};
  var _h = React.createElement;

  // Tryb "wejdź jako [użytkownik]" — admin ogląda/edytuje CAŁĄ aplikację
  // tak, jakby był zalogowany na cudzym koncie, bez znajomości jego hasła.
  // Mechanizm: React Context. ImpersonationProvider owija widoczną część
  // appki (Sidebar + Router) i — gdy aktywny — podmienia StoreCtx.Provider
  // na syntetyczny store wczytany z Supabase (user_data cudzego user_id).
  // SyncManager/SharedExercisesLoader siedzą PRZED tym providerem w drzewie
  // (w app.js), więc dalej synchronizują WŁASNE konto admina — podmiana
  // dotyczy tylko tego, co widać i edytuje się na ekranie.
  var ImpersonationCtx = React.createContext(null);
  function useImpersonation() { return React.useContext(ImpersonationCtx); }

  function ImpersonationProvider(props) {
    var toast = ET.useToast();
    var ts = React.useState(null); var target = ts[0], setTarget = ts[1];
    var pushTimer = React.useRef(null);

    function start(uid, email) {
      if (!ET.supabase) return;
      ET.supabase.from('user_data').select('data').eq('user_id', uid).maybeSingle().then(function(res) {
        if (res.error) { toast('Błąd wczytywania danych konta: '+res.error.message, 'error'); return; }
        var data = (res.data && res.data.data) || (ET.emptyStoreSnapshot ? ET.emptyStoreSnapshot() : {});
        setTarget({ uid: uid, email: email, store: data });
        toast('Wejście jako: '+email, 'success');
      });
    }
    function stop() {
      setTarget(null);
      toast('Wyjście z trybu admina', 'success');
    }
    function update(fn) {
      setTarget(function(prev) {
        if (!prev) return prev;
        var next = typeof fn === 'function' ? fn(prev.store) : Object.assign({}, prev.store, fn);
        if (pushTimer.current) clearTimeout(pushTimer.current);
        pushTimer.current = setTimeout(function() {
          ET.supabase.from('user_data').upsert({ user_id: prev.uid, data: next, updated_at: new Date().toISOString() })
            .then(function(r) { if (r.error) console.warn('[impersonation] push error:', r.error); });
        }, 1500);
        return Object.assign({}, prev, { store: next });
      });
    }

    var ctxValue = { impersonating: !!target, targetUid: target ? target.uid : null, targetEmail: target ? target.email : null, start: start, stop: stop };
    var children = props.children;
    if (target) {
      children = _h(ET.StoreCtx.Provider, { value: { store: target.store, update: update } }, children);
    }
    return _h(ImpersonationCtx.Provider, { value: ctxValue }, children);
  }

  function ImpersonationBanner() {
    var imp = useImpersonation();
    if (!imp || !imp.impersonating) return null;
    return _h('div', { style:{ position:'sticky', top:0, zIndex:200, display:'flex', alignItems:'center', justifyContent:'space-between', gap:8, padding:'3px 10px', minHeight:22, background:'var(--orange)', color:'#1a1200', fontSize:'.64rem', fontWeight:700, lineHeight:1.3 } },
      _h('span', { style:{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' } }, '🔑 Wejdź jako: '+imp.targetEmail),
      _h('button', { style:{ flexShrink:0, background:'none', border:'none', color:'#1a1200', textDecoration:'underline', cursor:'pointer', fontSize:'.64rem', fontWeight:700, padding:0 }, onClick:imp.stop }, 'Wyjdź')
    );
  }

  Object.assign(window.ET, { ImpersonationCtx: ImpersonationCtx, ImpersonationProvider: ImpersonationProvider, useImpersonation: useImpersonation, ImpersonationBanner: ImpersonationBanner });
})();
