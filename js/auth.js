(function() {
  'use strict';
  window.ET = window.ET || {};
  var _h = React.createElement;

  var AuthCtx = React.createContext(null);
  function useAuth() { return React.useContext(AuthCtx); }

  var OFFLINE_KEY = 'et_offline_mode';

  function AuthProvider(props) {
    var st = React.useState({ status: ET.supabase ? 'loading' : 'guest', session:null, profile:null });
    var state = st[0], setState = st[1];

    function loadProfile(session) {
      ET.supabase.from('profiles').select('*').eq('id', session.user.id).maybeSingle().then(function(res) {
        if (res.error) console.error('[auth] błąd wczytywania profilu (rola pokaże się jako "user"):', res.error);
        if (!res.error && !res.data) console.warn('[auth] brak wiersza w profiles dla id=' + session.user.id + ' — rola pokaże się jako "user"');
        setState({ status:'authed', session:session, profile: res.data || { role:'user', email:session.user.email } });
      });
    }

    React.useEffect(function() {
      if (!ET.supabase) return; // brak backendu (offline CDN / brak konfiguracji) — zawsze tryb gościa

      ET.supabase.auth.getSession().then(function(res) {
        var session = res.data && res.data.session;
        if (session) { loadProfile(session); return; }
        if (localStorage.getItem(OFFLINE_KEY) === '1') { setState({ status:'guest', session:null, profile:null }); }
        else { setState({ status:'needsAuth', session:null, profile:null }); }
      });

      var sub = ET.supabase.auth.onAuthStateChange(function(event, session) {
        if (session) { localStorage.removeItem(OFFLINE_KEY); loadProfile(session); }
        else if (event === 'SIGNED_OUT') { setState({ status:'needsAuth', session:null, profile:null }); }
      });
      return function() { sub && sub.data && sub.data.subscription && sub.data.subscription.unsubscribe(); };
    }, []);

    function signIn(email, pass) { return ET.supabase.auth.signInWithPassword({ email:email, password:pass }); }
    function signUp(email, pass) { return ET.supabase.auth.signUp({ email:email, password:pass }); }
    function signOut() { return ET.supabase.auth.signOut().then(function(){ setState({ status:'needsAuth', session:null, profile:null }); }); }
    function continueOffline() { localStorage.setItem(OFFLINE_KEY, '1'); setState({ status:'guest', session:null, profile:null }); }
    function loginFromSettings() { localStorage.removeItem(OFFLINE_KEY); setState({ status:'needsAuth', session:null, profile:null }); }

    return React.createElement(AuthCtx.Provider, {
      value: Object.assign({}, state, {
        signIn:signIn, signUp:signUp, signOut:signOut,
        continueOffline:continueOffline, loginFromSettings:loginFromSettings,
        available: !!ET.supabase
      })
    }, props.children);
  }

  function AuthScreen() {
    var auth = useAuth();
    var ts = React.useState('login'); var tab = ts[0], setTab = ts[1];
    var es = React.useState(''); var email = es[0], setEmail = es[1];
    var ps = React.useState(''); var pass = ps[0], setPass = ps[1];
    var er = React.useState(''); var err = er[0], setErr = er[1];
    var ok = React.useState(''); var okMsg = ok[0], setOkMsg = ok[1];
    var ls = React.useState(false); var loading = ls[0], setLoading = ls[1];

    function submit() {
      if (!email || !pass) { setErr('Podaj e-mail i hasło'); return; }
      setErr(''); setOkMsg(''); setLoading(true);
      var action = tab === 'login' ? auth.signIn(email, pass) : auth.signUp(email, pass);
      action.then(function(res) {
        setLoading(false);
        if (res.error) { setErr(res.error.message); return; }
        if (tab === 'register' && !(res.data && res.data.session)) {
          setOkMsg('Konto utworzone — sprawdź e-mail, by je potwierdzić.');
        }
      }).catch(function(e) { setLoading(false); setErr(String(e)); });
    }

    return _h('div', { style:{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', padding:24, background:'var(--bg)' } },
      _h('div', { style:{ width:'100%', maxWidth:400 } },
        _h('div', { style:{ display:'flex', alignItems:'center', justifyContent:'center', gap:10, marginBottom:32 } },
          _h('div', { style:{ width:44, height:44, borderRadius:12, background:'linear-gradient(135deg, var(--a), var(--purple))', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.4rem' } }, '⚡'),
          _h('div', { style:{ fontWeight:800, fontSize:'1.3rem', color:'var(--t1)' } }, 'EasyTraining')
        ),
        _h('div', { className:'card', style:{ padding:'28px 26px' } },
          _h('div', { style:{ display:'flex', gap:4, background:'var(--s1)', borderRadius:'var(--r2)', padding:4, marginBottom:24 } },
            ['login','register'].map(function(t) {
              var active = tab === t;
              return _h('div', { key:t, onClick:function(){ setTab(t); setErr(''); setOkMsg(''); },
                style:{ flex:1, textAlign:'center', padding:9, borderRadius:8, fontSize:'.82rem', fontWeight:700, cursor:'pointer',
                  color: active ? 'var(--a-light)' : 'var(--t3)', background: active ? 'var(--a-dim)' : 'transparent' } },
                t === 'login' ? 'Zaloguj się' : 'Zarejestruj się'
              );
            })
          ),
          err && _h('div', { style:{ background:'rgba(239,68,68,.1)', border:'1px solid rgba(239,68,68,.3)', color:'#fca5a5', borderRadius:'var(--r2)', padding:'9px 12px', fontSize:'.75rem', marginBottom:14 } }, '✕ '+err),
          okMsg && _h('div', { style:{ background:'rgba(16,185,129,.1)', border:'1px solid rgba(16,185,129,.3)', color:'var(--green)', borderRadius:'var(--r2)', padding:'9px 12px', fontSize:'.75rem', marginBottom:14 } }, '✓ '+okMsg),
          _h('div', { className:'field' }, _h('label', null, 'E-mail'), _h('input', { type:'email', value:email, placeholder:'ty@przyklad.pl', onChange:function(e){ setEmail(e.target.value); } })),
          _h('div', { className:'field' }, _h('label', null, 'Hasło'), _h('input', { type:'password', value:pass, placeholder:'••••••••', onChange:function(e){ setPass(e.target.value); }, onKeyDown:function(e){ if (e.key==='Enter') submit(); } })),
          _h('button', { className:'btn btn-primary', style:{ width:'100%', marginTop:4 }, disabled:loading, onClick:submit },
            loading ? '...' : (tab === 'login' ? 'Zaloguj się' : 'Zarejestruj się')),
          _h('div', { style:{ display:'flex', alignItems:'center', gap:10, margin:'20px 0', color:'var(--t3)', fontSize:'.68rem' } },
            _h('div', { style:{ flex:1, height:1, background:'var(--b1)' } }), 'albo', _h('div', { style:{ flex:1, height:1, background:'var(--b1)' } })
          ),
          _h('div', { style:{ textAlign:'center' } },
            _h('div', { style:{ fontSize:'.8rem', color:'var(--t3)', marginBottom:10 } }, 'Kontynuuj offline (bez synchronizacji)'),
            _h('button', { className:'btn', style:{ width:'100%', background:'var(--s3)', color:'var(--t2)', border:'1px solid var(--b2)' }, onClick:auth.continueOffline }, 'Użyj bez konta')
          ),
          _h('div', { style:{ display:'flex', gap:8, marginTop:20, padding:'11px 12px', background:'var(--s1)', borderRadius:'var(--r2)', fontSize:'.7rem', color:'var(--t3)', lineHeight:1.5 } },
            _h('span', null, 'ℹ️'),
            _h('div', null, _h('b', { style:{ color:'var(--t2)' } }, 'Twoje dane zostają lokalnie'), ', jeśli wybierzesz tryb offline. Zaloguj się, by zsynchronizować trening między telefonem a stroną internetową.')
          )
        )
      )
    );
  }

  function AuthLoadingScreen() {
    return _h('div', { style:{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'var(--bg)', color:'var(--t3)', fontSize:'.85rem' } }, 'Ładowanie…');
  }

  Object.assign(ET, {
    AuthCtx:AuthCtx, AuthProvider:AuthProvider, useAuth:useAuth,
    AuthScreen:AuthScreen, AuthLoadingScreen:AuthLoadingScreen
  });
})();
