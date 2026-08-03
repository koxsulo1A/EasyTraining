(function() {
  'use strict';
  var _h = React.createElement;

  // ── IKONY (rodzina SVG redesignu: viewBox 24, stroke currentColor) ──
  // Bez emoji — liniowe ikony sterowane kolorem tekstu rodzica.
  var ICONS = {
    home:'M3 10.7 12 4l9 6.7V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z',
    dumbbell:'M4 9v6 M7 6.5v11 M17 6.5v11 M20 9v6 M7 12h10',
    plus:'M12 5v14 M5 12h14',
    pill:'M10.5 20.5 3.5 13.5a5 5 0 0 1 7-7l7 7a5 5 0 0 1-7 7z M8.5 6.5l9 9',
    chart:'M4 20V4 M4 20h16 M8 20v-6 M13 20v-9 M18 20v-4',
    running:'M4 12h4l2-6 4 12 2-6h4',
    flame:'M12 3c1.2 3 4 4.2 4 8a4 4 0 0 1-8 0c0-2 1-3.2 2.2-4.2C10.7 8 12 8.4 12 3z',
    ruler:'M4 14 14 4l6 6L10 20z M8.5 9.5l1.8 1.8 M11.5 6.5l1.8 1.8 M5.5 12.5l1.8 1.8',
    moon:'M20.5 13A8 8 0 1 1 11 3.5 6.2 6.2 0 0 0 20.5 13z',
    trophy:'M8 4h8v4a4 4 0 0 1-8 0z M8 5H5v2a3 3 0 0 0 3 3 M16 5h3v2a3 3 0 0 1-3 3 M12 12v4 M9 20h6 M10 20v-2h4v2',
    calendar:'M5 5a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1z M5 9h14 M9 3v3 M15 3v3',
    chat:'M4 5a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H9l-4 4z',
    user:'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8z M5 20a7 7 0 0 1 14 0',
  };
  function Icon(name, size) {
    return _h('svg', { width:size||24, height:size||24, viewBox:'0 0 24 24', fill:'none',
      stroke:'currentColor', strokeWidth:1.7, strokeLinecap:'round', strokeLinejoin:'round', 'aria-hidden':true },
      _h('path', { d: ICONS[name] || '' }));
  }
  ET.Icon = Icon;

  // ── PLATFORMA: iOS (telefon) vs WEB (przeglądarka) ──────────────────
  // Ta sama baza kodu obsługuje dwa wyglądy:
  //   • iOS natywny  → powłoka mobilna „Aurora Glass" (szklany pasek .gnav),
  //   • przeglądarka → powłoka web wg designu „EasyTraining Aplikacja"
  //     (sidebar 236 px + pasek górny), niezależnie od szerokości okna.
  // Brak Capacitora = zwykła przeglądarka, więc web jest wartością domyślną.
  function detectWeb() {
    try {
      var cap = window.Capacitor;
      if (cap) {
        if (typeof cap.getPlatform === 'function') return cap.getPlatform() === 'web';
        if (typeof cap.isNativePlatform === 'function') return !cap.isNativePlatform();
      }
    } catch (e) {}
    return true;
  }
  var IS_WEB = detectWeb();
  ET.IS_WEB = IS_WEB;

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

  // ── MOBILE NAV (redesign „Aurora Glass") ─────────
  // Szklany pasek: Dziś · Trening · [＋] · Suple · Postępy. Centralny przycisk
  // otwiera szufladę modułów (arkusz z siatką 4 kolumn). Zastępuje poprzedni
  // pasek ze skróconą listą + trybem przewijania po przytrzymaniu.
  var GNAV_TABS = [
    { id:'dashboard',   icon:'home',     label:'Dziś' },
    { id:'strength',    icon:'dumbbell', label:'Trening' },
    { center:true },
    { id:'supplements', icon:'pill',     label:'Suple' },
    { id:'statistics',  icon:'chart',    label:'Postępy' },
  ];
  // Szuflada modułów (kolejność i kolory wg handoffu).
  var GNAV_DRAWER = [
    { id:'strength',     icon:'dumbbell', label:'Siła',     color:'var(--a)' },
    { id:'running',      icon:'running',  label:'Bieganie', color:'var(--green)' },
    { id:'sauna',        icon:'flame',    label:'Sauna',    color:'var(--orange)' },
    { id:'supplements',  icon:'pill',     label:'Suple',    color:'var(--purple)' },
    { id:'measurements', icon:'ruler',    label:'Pomiary',  color:'var(--teal)' },
    { id:'sleep',        icon:'moon',     label:'Sen',      color:'var(--yellow)' },
    { id:'competitions', icon:'trophy',   label:'Zawody',   color:'var(--pink)' },
    { id:'calendar',     icon:'calendar', label:'Plan',     color:'var(--a-light)' },
    { id:'coach',        icon:'chat',     label:'Trener',   color:'var(--purple)' },
    { id:'profile',      icon:'user',     label:'Profil',   color:'var(--t2)' },
  ];

  function ModuleDrawer(props) {
    var nav = ET.useNav(); var current = nav.current, navigate = nav.navigate;
    if (!props.open) return null;
    function go(id) { props.onClose(); navigate(id); }
    return _h('div', { className:'sheet-overlay', onClick:props.onClose },
      _h('div', { className:'sheet', style:{ maxWidth:520 }, onClick:function(e){ e.stopPropagation(); } },
        _h('div', { className:'sheet-handle' }),
        _h('h2', { style:{ marginBottom:18 } }, 'Moduły'),
        _h('div', { className:'drawer-grid' },
          GNAV_DRAWER.map(function(m) {
            var active = current === m.id;
            return _h('div', { key:m.id, className:'drawer-tile', onClick:function(){ go(m.id); },
              style: active ? { borderColor:m.color, background:'var(--s2)' } : null },
              _h('div', { className:'drawer-ic', style:{ color:m.color, background:'color-mix(in srgb,'+m.color+' 14%, transparent)', border:'1px solid color-mix(in srgb,'+m.color+' 32%, transparent)' } }, Icon(m.icon, 22)),
              _h('div', { className:'drawer-label' }, m.label)
            );
          })
        )
      )
    );
  }

  function MobileNav() {
    var nav = ET.useNav(); var current = nav.current, navigate = nav.navigate;
    var ds = React.useState(false); var drawer = ds[0], setDrawer = ds[1];
    return _h('div', null,
      _h('nav', { className:'gnav' },
        GNAV_TABS.map(function(t, i) {
          if (t.center) {
            return _h('div', { key:'center', className:'gnav-center-slot' },
              _h('button', { className:'gnav-center', 'aria-label':'Moduły',
                onClick:function(){ setDrawer(true); } }, Icon('plus', 24))
            );
          }
          return _h('div', { key:t.id, className:'gnav-item'+(current===t.id?' active':''),
            onClick:function(){ navigate(t.id); } },
            Icon(t.icon, 21),
            _h('span', { className:'gnav-label' }, t.label)
          );
        })
      ),
      _h(ModuleDrawer, { open:drawer, onClose:function(){ setDrawer(false); } })
    );
  }

  // ── NAWIGACJA WEB (design „EasyTraining Aplikacja") ─────────────────
  // Ikony 1:1 z designu (viewBox 24, stroke 1.7). `id` = trasa w ROUTE_MAP.
  var WEB_NAV = [
    { id:'dashboard',    name:'Dziś',        path:'M4 10.5L12 4l8 6.5V20h-5v-6H9v6H4z' },
    { id:'wellbeing',    name:'Gotowość',    path:'M3.5 12.5h3.2l2-4.5 3 9 2.4-6 1.7 3.2h4.7' },
    { id:'acwr',         name:'Trener AI',   path:'M4 19.5L9 13l3.5 3L20 6.5M20 6.5h-4.5M20 6.5V11' },
    { id:'pain',         name:'Ból i fizjo', path:'M12 20.5c-4.5-2.4-7.5-5.6-7.5-9.8V6.2l7.5-3 7.5 3v4.5c0 4.2-3 7.4-7.5 9.8zM12 9v6M9 12h6' },
    { id:'plan',         name:'Plan',        path:'M5 5.5h14v14H5zM5 9.5h14M9 3v3M15 3v3M9 13.5h6' },
    { id:'calendar',     name:'Kalendarz',   path:'M4.5 6h15v13.5h-15zM4.5 10h15M8.5 3.5v3M15.5 3.5v3M8 13.5h2M14 13.5h2M8 16.5h2M14 16.5h2' },
    { id:'strength',     name:'Trening',     path:'M6.5 8v8M3.8 10v4M17.5 8v8M20.2 10v4M6.5 12h11' },
    { id:'supplements',  name:'Suplementy',  path:'M9.6 14.4l4.8-4.8M6.7 6.7a4.6 4.6 0 0 1 6.6 0l4 4a4.6 4.6 0 0 1-6.6 6.6l-4-4a4.6 4.6 0 0 1 0-6.6z' },
    { id:'measurements', name:'Pomiary',     path:'M3 8.5h18v7H3zM7 8.5v3M11 8.5v4.5M15 8.5v3M19 8.5v4.5' },
    { id:'statistics',   name:'Statystyki',  path:'M4 19.5V4.5M4 19.5h16M8 16V11M12 16V7.5M16 16v-6' },
    { id:'history',      name:'Historia',    path:'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7.5V12l3.5 2' },
  ];
  // Tytuły w pasku górnym — pełniejsze niż etykiety w menu (jak w designie).
  var WEB_TITLES = {
    dashboard:'Dziś', wellbeing:'Samopoczucie i gotowość', acwr:'Trener AI i ACWR',
    pain:'Dolegliwości i ból', plan:'Plan treningowy', calendar:'Kalendarz',
    strength:'Trening', supplements:'Suplementy', measurements:'Pomiary',
    statistics:'Statystyki', history:'Historia', profile:'Profil',
  };
  var LOGO_PATH = 'M6.5 8v8M3.8 10v4M17.5 8v8M20.2 10v4M6.5 12h11';

  function PathIcon(d, size, sw) {
    return _h('svg', { width:size||17, height:size||17, viewBox:'0 0 24 24', fill:'none',
      stroke:'currentColor', strokeWidth:sw||1.7, strokeLinecap:'round', strokeLinejoin:'round', 'aria-hidden':true },
      _h('path', { d:d }));
  }

  function WebSidebar() {
    var nav = ET.useNav(); var current = nav.current, navigate = nav.navigate;
    var su = ET.useStore(); var store = su.store;
    var sessions = (store.workouts || []).length;
    return _h('aside', { className:'wside' },
      _h('div', { className:'wside-logo' },
        _h('div', { className:'wside-mark' },
          _h('svg', { width:19, height:19, viewBox:'0 0 24 24', fill:'none', stroke:'#080810',
            strokeWidth:2, strokeLinecap:'round', strokeLinejoin:'round', 'aria-hidden':true },
            _h('path', { d:LOGO_PATH }))
        ),
        _h('div', { className:'wside-txt' },
          _h('div', { className:'wside-name' }, 'EasyTraining'),
          _h('div', { className:'wside-sub' }, 'DANE LOKALNE')
        )
      ),
      _h('nav', { className:'wnav' },
        WEB_NAV.map(function(it) {
          return _h('div', { key:it.id, title:it.name,
            className:'wnav-item'+(current===it.id?' active':''),
            onClick:function(){ navigate(it.id); } },
            PathIcon(it.path, 17),
            _h('span', { className:'wnav-label' }, it.name)
          );
        })
      ),
      _h('div', { className:'wside-foot' },
        _h('div', { className:'wside-row' },
          _h('span', { className:'wside-row-label' }, 'Zapisane sesje'),
          _h('span', { className:'wside-row-val' }, String(sessions))
        ),
        // Design nie ma osobnej pozycji „Profil" w menu, a bez niej nie da się
        // dojść do ustawień — dlatego wejście do profilu jest w stopce.
        _h('button', { className:'wside-btn', title:'Profil i ustawienia',
          onClick:function(){ navigate('profile'); } },
          PathIcon('M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8z M5 20a7 7 0 0 1 14 0', 14),
          _h('span', null, 'Profil')
        )
      )
    );
  }

  function WebTopbar() {
    var nav = ET.useNav();
    var title = WEB_TITLES[nav.current] || 'EasyTraining';
    var today = new Date().toLocaleDateString('pl-PL', { weekday:'long', day:'numeric', month:'long' });
    return _h('header', { className:'wtop' },
      _h('div', { style:{ display:'flex', alignItems:'center', gap:10, minWidth:0 } },
        _h('span', { className:'wtop-title' }, title),
        _h('span', { className:'wtop-date' }, today)
      )
    );
  }

  // Ekran trenera — w budowie (redesign). Tymczasowy placeholder, dopóki nie
  // powstanie właściwy CoachModule; wpięty w trasę 'coach' (szuflada modułów).
  function CoachPlaceholder() {
    return _h('div', { className:'module-placeholder scr-in' },
      _h('div', { style:{ color:'var(--purple)', marginBottom:4 } }, Icon('chat', 56)),
      _h('h2', null, 'Trener'),
      _h('p', null, 'Ekran trenera jest w przygotowaniu w ramach redesignu — wkrótce znajdziesz tu wiadomości i propozycje korekt.')
    );
  }

  // Ekran „Plan" z designu web (meta-plan → segmenty → jednostki → tydzień).
  // Spec: docs/segment-01-plan.md w projekcie designu; do zbudowania jako
  // ET.PlanModule (js/plan.js). Do tego czasu placeholder, żeby pozycja w
  // menu web nie prowadziła po cichu na dashboard.
  function PlanPlaceholder() {
    return _h('div', { className:'module-placeholder scr-in' },
      _h('div', { style:{ color:'var(--a-light)', marginBottom:4 } },
        PathIcon('M5 5.5h14v14H5zM5 9.5h14M9 3v3M15 3v3M9 13.5h6', 56, 1.5)),
      _h('h2', null, 'Plan treningowy'),
      _h('p', null, 'Ekran planu jest w przygotowaniu w ramach redesignu — złoży meta-plan, segmenty, jednostki i tydzień w jednym miejscu.')
    );
  }

  // ── ROUTER ───────────────────────────────────────
  var ROUTE_MAP = {
    coach:        function(){ return ET.CoachModule || CoachPlaceholder; },
    plan:         function(){ return ET.PlanModule || PlanPlaceholder; },
    dashboard:    function(){ return ET.Dashboard; },
    strength:     function(){ return ET.StrengthModule; },
    running:      function(){ return ET.RunningModule; },
    sleep:        function(){ return ET.SleepModule; },
    sauna:        function(){ return ET.SaunaModule; },
    measurements: function(){ return ET.MeasurementsModule; },
    diet:         function(){ return ET.DietModule; },
    supplements:  function(){ return ET.SupplementsModule; },
    wellbeing:    function(){ return (IS_WEB && ET.ReadinessModule) || ET.WellbeingModule; },
    pain:         function(){ return (IS_WEB && ET.WebPainModule) || ET.PainModule; },
    calendar:     function(){ return (IS_WEB && ET.WebCalendarModule) || ET.CalendarModule; },
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
    acwr:         function(){ return (IS_WEB && ET.WebAcwrModule) || ET.AcwrModule; },
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

  // ── POWŁOKI ──────────────────────────────────────
  // Natywna (iOS): mobilny „Aurora Glass" — szklany pasek + szuflada modułów.
  function NativeShell() {
    return _h('div', { className:'app' },
      _h(ET.ImpersonationBanner, null),
      _h(Sidebar, null),
      _h('main', { className:'main' },
        _h('div', { className:'aurora aurora-1' }),
        _h('div', { className:'aurora aurora-2' }),
        _h('div', { className:'page-content' },
          _h(ErrorBoundary, null, _h(Router, null))
        )
      ),
      _h(MobileNav, null),
      _h(DailyWellbeingCheck, null)
    );
  }

  // Web (przeglądarka): sidebar 236 px + pasek górny wg designu „Aplikacja".
  function WebShell() {
    return _h('div', { className:'wapp' },
      _h(WebSidebar, null),
      _h('main', { className:'wmain' },
        _h('div', { className:'waurora' },
          _h('div', { className:'waurora-1' }),
          _h('div', { className:'waurora-2' })
        ),
        _h(ET.ImpersonationBanner, null),
        _h(WebTopbar, null),
        _h('div', { className:'wcontent' },
          _h(ErrorBoundary, null, _h(Router, null))
        )
      ),
      _h(DailyWellbeingCheck, null)
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
                    _h(IS_WEB ? WebShell : NativeShell, null)
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
