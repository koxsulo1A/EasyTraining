(function() {
  'use strict';
  var _h = React.createElement;

  // ── MODULE VALIDATION ────────────────────────────
  var REQUIRED = [
    'StoreCtx','StoreProvider','useStore',
    'NavCtx','NavProvider','useNav','NAV_GROUPS','MOBILE_TABS',
    'ToastCtx','ToastProvider','useToast',
    'dstr','fmtDate','fmtDateShort','greeting','calcPace','daysUntil',
    'ReadinessRing','ProgressBar','Sheet','Placeholder','StatCard',
    'BarChart','LineChart',
    'Dashboard',
    'StrengthModule','RunningModule','SleepModule','SaunaModule',
    'MeasurementsModule','DietModule','SupplementsModule','WellbeingModule',
    'PainModule','CalendarModule','CompetitionsModule','GoalsModule',
    'StatisticsModule','PhotosModule','HistoryModule',
    'IntervalsModule','JournalModule','HabitsModule',
    'LibraryModule','PhysioModule','BackupModule','PlannerModule','AcwrModule','AssessmentModule',
    'exportAI','ProfileModule',
  ];
  var missing = [];
  REQUIRED.forEach(function(k) {
    if (typeof ET[k] === 'undefined') missing.push(k);
  });
  if (missing.length) {
    var el = document.getElementById('boot-err');
    if (el) { el.style.display = 'block'; el.textContent = 'Missing ET exports:\n' + missing.join(', '); }
  }

  // ── ERROR BOUNDARY ───────────────────────────────
  class ErrorBoundary extends React.Component {
    constructor(props) { super(props); this.state = { error: null }; }
    static getDerivedStateFromError(err) { return { error: err }; }
    componentDidCatch(err, info) {
      console.error('ErrorBoundary caught:', err);
      console.error('Stack:', err && err.stack);
      console.error('Component stack:', info && info.componentStack);
      var el = document.getElementById('boot-err');
      if (el) {
        el.style.display = 'block';
        el.textContent = 'React component error:\n' + (err && err.stack || err) + '\n\nComponent stack:' + (info && info.componentStack || '');
      }
    }
    render() {
      if (this.state.error) {
        return _h('div', { style:{ color:'#EF4444', padding:20, fontFamily:'monospace', whiteSpace:'pre-wrap', fontSize:'.8rem', lineHeight:1.5 } },
          'Błąd renderowania:\n' + ((this.state.error && this.state.error.stack) || String(this.state.error))
        );
      }
      return this.props.children;
    }
  }

  // ── USTAWIENIA MENU (Profil → Ustawienia): ukrywanie + kolejność ─────────
  // ms = { hidden:[ids], order:[ids] } — sortowanie wg pozycji w order, reszta na końcu w oryginalnej kolejności.
  function applyMenuSettings(items, ms) {
    var hidden = (ms && ms.hidden) || [];
    var order  = (ms && ms.order)  || [];
    var vis = items.filter(function(i){ return hidden.indexOf(i.id)===-1; });
    if (!order.length) return vis;
    return vis.slice().sort(function(a,b){
      var ia = order.indexOf(a.id), ib = order.indexOf(b.id);
      if (ia===-1 && ib===-1) return items.indexOf(a)-items.indexOf(b);
      if (ia===-1) return 1; if (ib===-1) return -1;
      return ia-ib;
    });
  }
  ET.applyMenuSettings = applyMenuSettings;

  // ── SIDEBAR ──────────────────────────────────────
  function Sidebar() {
    var nav = ET.useNav(); var current = nav.current, navigate = nav.navigate;
    var su = ET.useStore(); var msSide = (su.store.menuSettings||{}).sidebar;
    var auth = ET.useAuth ? ET.useAuth() : null;
    var isAdmin = !!(auth && auth.profile && auth.profile.role === 'admin');
    return _h('aside', { className:'sidebar' },
      _h('div', { className:'sb-logo' },
        _h('div', { className:'sb-logo-icon' }, '⚡'),
        _h('div', null,
          _h('div', { className:'sb-logo-text' }, 'EasyTraining'),
          _h('div', { className:'sb-logo-sub' }, 'Premium')
        )
      ),
      ET.NAV_GROUPS.map(function(g, gi) {
        var items = applyMenuSettings(g.items.filter(function(i){ return !i.adminOnly || isAdmin; }), msSide);
        if (!items.length) return null;
        return _h('div', { className:'sb-section', key:gi },
          g.s && _h('div', { className:'sb-section-label' }, g.s),
          items.map(function(item) {
            return _h('div', { key:item.id, className:'sb-item'+(current===item.id?' active':''), onClick:function(){ navigate(item.id); } },
              _h('span', { className:'sb-item-icon' }, item.icon),
              _h('span', null, item.label)
            );
          })
        );
      })
    );
  }

  // ── MOBILE NAV ───────────────────────────────────
  function MobileNav() {
    var nav = ET.useNav(); var current = nav.current, navigate = nav.navigate;
    var ms = React.useState(false); var showMore = ms[0], setShowMore = ms[1];
    var su = ET.useStore(); var msMob = (su.store.menuSettings||{}).mobile;
    var mobileTabs = applyMenuSettings(ET.MOBILE_TABS, msMob);
    var auth = ET.useAuth ? ET.useAuth() : null;
    var isAdmin = !!(auth && auth.profile && auth.profile.role === 'admin');

    // Grupy w sheet "Więcej" (wszystko poza widocznymi tabami)
    var tabIds = mobileTabs.map(function(t){ return t.id; });
    var moreGroups = ET.NAV_GROUPS.map(function(g){
      return Object.assign({}, g, { items: g.items.filter(function(i){ return tabIds.indexOf(i.id)===-1 && (!i.adminOnly || isAdmin); }) });
    }).filter(function(g){ return g.items.length > 0; });

    function goTo(id) { setShowMore(false); navigate(id); }

    var isMoreActive = !mobileTabs.some(function(t){ return t.id===current; });

    return _h('div', null,
      _h('nav', { className:'mobile-nav' },
        mobileTabs.map(function(item) {
          return _h('div', { key:item.id, className:'mn-item'+(current===item.id?' active':''), onClick:function(){ setShowMore(false); navigate(item.id); } },
            _h('span', { className:'mn-item-icon' }, item.icon),
            _h('span', { className:'mn-item-label' }, item.label)
          );
        }),
        _h('div', { className:'mn-item'+(isMoreActive?' active':''), onClick:function(){ setShowMore(function(v){ return !v; }); } },
          _h('span', { className:'mn-item-icon' }, '⋯'),
          _h('span', { className:'mn-item-label' }, 'Więcej')
        )
      ),
      showMore && _h('div', { style:{ position:'fixed', inset:0, zIndex:190, background:'rgba(0,0,0,.5)' }, onClick:function(){ setShowMore(false); } },
        _h('div', { style:{ position:'absolute', bottom:'calc(var(--bnh) + env(safe-area-inset-bottom,0px))', left:0, right:0, background:'var(--s1)', borderRadius:'16px 16px 0 0', maxHeight:'70vh', overflowY:'auto', padding:'8px 0 12px' },
          onClick:function(e){ e.stopPropagation(); } },
          _h('div', { style:{ width:36, height:4, borderRadius:2, background:'var(--b2)', margin:'8px auto 12px' } }),
          moreGroups.map(function(g, gi) {
            return _h('div', { key:gi },
              g.s && _h('div', { style:{ fontSize:'.6rem', fontWeight:700, color:'var(--t3)', textTransform:'uppercase', letterSpacing:'.1em', padding:'8px 20px 4px' } }, g.s),
              _h('div', { style:{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, padding:'0 12px 4px' } },
                g.items.map(function(item) {
                  var active = current===item.id;
                  return _h('div', { key:item.id,
                    style:{ display:'flex', alignItems:'center', gap:10, padding:'10px 12px', borderRadius:10, background: active?'var(--a-dim)':'var(--s2)', cursor:'pointer', color: active?'var(--a-light)':'var(--t2)' },
                    onClick:function(){ goTo(item.id); } },
                    _h('span', { style:{ fontSize:'1.1rem', width:22, textAlign:'center' } }, item.icon),
                    _h('span', { style:{ fontSize:'.78rem', fontWeight:600 } }, item.label)
                  );
                })
              )
            );
          })
        )
      )
    );
  }

  // ── ROUTER ───────────────────────────────────────
  var ROUTE_MAP = {
    dashboard:    function(){ return ET.Dashboard; },
    strength:     function(){ return ET.StrengthModule; },
    running:      function(){ return ET.RunningModule; },
    sleep:        function(){ return ET.SleepModule; },
    sauna:        function(){ return ET.SaunaModule; },
    measurements: function(){ return ET.MeasurementsModule; },
    diet:         function(){ return ET.DietModule; },
    supplements:  function(){ return ET.SupplementsModule; },
    wellbeing:    function(){ return ET.WellbeingModule; },
    pain:         function(){ return ET.PainModule; },
    calendar:     function(){ return ET.CalendarModule; },
    competitions: function(){ return ET.CompetitionsModule; },
    goals:        function(){ return ET.GoalsModule; },
    statistics:   function(){ return ET.StatisticsModule; },
    photos:       function(){ return ET.PhotosModule; },
    history:      function(){ return ET.HistoryModule; },
    intervals:    function(){ return ET.IntervalsModule; },
    journal:      function(){ return ET.JournalModule; },
    habits:       function(){ return ET.HabitsModule; },
    library:      function(){ return ET.LibraryModule; },
    physio:       function(){ return ET.PainModule; },
    backup:       function(){ return ET.BackupModule; },
    planner:      function(){ return ET.PlannerModule; },
    acwr:         function(){ return ET.AcwrModule; },
    assessment:   function(){ return ET.AssessmentModule; },
    profile:      function(){ return ET.ProfileModule; },
    accounts:     function(){ return ET.AccountsModule; },
    'dev':        function(){ return ET.DevPanel; },
  };

  function Router() {
    var nav = ET.useNav(); var current = nav.current;
    var getter = ROUTE_MAP[current];
    if (getter) {
      var C = getter();
      if (C) return _h(C, null);
    }
    return _h(ET.Dashboard, null);
  }

  // ── AUTO WELLBEING (pierwsze otwarcie dnia) ──────
  function DailyWellbeingCheck() {
    var su = ET.useStore(); var store = su.store, update = su.update;
    var shown = React.useState(false); var isShown = shown[0]; var setShown = shown[1];
    var wv = React.useState(Object.assign({}, ET.WellbeingDefaults));
    var wbVals = wv[0]; var setWbVals = wv[1];
    function upWb(k,v){ setWbVals(function(p){ var o={}; o[k]=v; return Object.assign({},p,o); }); }

    var today = ET.dstr();
    var hasToday = (store.wellbeingEntries||[]).some(function(e){ return e.date === today && !e.tag; });

    React.useEffect(function() {
      if (!hasToday && !isShown) {
        var t = setTimeout(function(){ setShown(true); }, 800);
        return function(){ clearTimeout(t); };
      }
    }, []); // only on mount

    function save() {
      ET.saveWellbeingEntry(update, wbVals, '');
      setShown(false);
    }

    if (!isShown) return null;

    return _h('div', { style:{ position:'fixed', inset:0, zIndex:9000, background:'rgba(0,0,0,.7)', display:'flex', alignItems:'flex-end', justifyContent:'center', padding:0 },
      onClick:function(){ setShown(false); }
    },
      _h('div', { style:{ background:'var(--s1)', borderRadius:'var(--r3) var(--r3) 0 0', padding:'20px 20px 32px', width:'100%', maxWidth:520, maxHeight:'85vh', overflowY:'auto' },
        onClick:function(e){ e.stopPropagation(); }
      },
        _h('div', { style:{ textAlign:'center', marginBottom:16 } },
          _h('div', { style:{ width:40, height:4, borderRadius:2, background:'var(--b1)', margin:'0 auto 14px' } }),
          _h('div', { style:{ fontSize:'1.1rem', fontWeight:700 } }, '🌡 Jak się dziś czujesz?'),
          _h('div', { style:{ fontSize:'.75rem', color:'var(--t3)', marginTop:4 } }, 'Codzienne samopoczucie · '+ET.fmtDate(today))
        ),
        _h(ET.WellbeingForm, {
          values:wbVals, onChange:upWb,
          saveLabel:'Zapisz samopoczucie',
          onSave:save, onSkip:function(){ setShown(false); }
        })
      )
    );
  }

  // ── BRAMKA LOGOWANIA ──────────────────────────────
  // SyncManager i SharedExercisesLoader renderowane POZA bramką (zawsze
  // zamontowane) — SyncManager musi widzieć przejście authed→needsAuth
  // (wylogowanie), żeby zdążyć wyczyścić lokalne dane przed odmontowaniem.
  function AuthGate(props) {
    var auth = ET.useAuth();
    if (auth.status === 'loading') return _h(ET.AuthLoadingScreen, null);
    if (auth.status === 'needsAuth') return _h(ET.AuthScreen, null);
    return props.children;
  }

  // ── APP ──────────────────────────────────────────
  function App() {
    console.log('App entered');
    React.useEffect(function() {
      document.getElementById('boot').style.display = 'none';
      document.getElementById('root').style.display = 'block';
      // Sprzątnij osieroconą Live Activity z ewentualnej poprzedniej sesji
      // (np. appka została zabita w trakcie treningu) — świeży start appki
      // nigdy nie wznawia treningu w toku, więc bezpiecznie zamknąć każdą.
      if (ET.LiveActivity && ET.LiveActivity.cleanupOrphaned) ET.LiveActivity.cleanupOrphaned();
    }, []);

    var result;
    try {
      result = _h(ET.AuthProvider, null,
        _h(ET.StoreProvider, null,
          _h(ET.ToastProvider, null,
            _h(ET.NavProvider, null,
              _h(ErrorBoundary, null,
                _h(React.Fragment, null,
                  _h(ET.SyncManager, null),
                  _h(ET.SharedExercisesLoader, null),
                  _h(ET.ImpersonationProvider, null,
                  _h(AuthGate, null,
                    _h('div', { className:'app' },
                      _h(ET.ImpersonationBanner, null),
                      _h(Sidebar, null),
                      _h('main', { className:'main' },
                        _h('div', { className:'page-content' },
                          _h(ErrorBoundary, null,
                            _h(Router, null)
                          )
                        )
                      ),
                      _h(MobileNav, null),
                      _h(DailyWellbeingCheck, null)
                    )
                  )
                  )
                )
              )
            )
          )
        )
      );
    } catch(err) {
      console.error('App() threw synchronously:', err);
      console.error(err && err.stack);
      return _h('div', { style:{ color:'#EF4444', padding:20, fontFamily:'monospace', whiteSpace:'pre-wrap', fontSize:'.8rem' } },
        'App() error:\n' + ((err && err.stack) || String(err))
      );
    }
    console.log('App returning');
    return result;
  }

  // ── MOUNT ────────────────────────────────────────
  try {
    console.log('before createRoot');
    var root = ReactDOM.createRoot(document.getElementById('root'));
    console.log('before render');
    root.render(_h(App, null));
    console.log('after render');
  } catch(e) {
    console.error('createRoot/render threw:', e);
    console.error(e && e.stack);
    var el = document.getElementById('boot-err');
    if (el) {
      el.style.display = 'block';
      el.textContent = 'Mount error:\n' + ((e && e.stack) || String(e));
    }
  }
})();
