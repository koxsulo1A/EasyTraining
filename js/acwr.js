(function() {
  'use strict';
  window.ET = window.ET || {};
  var _h = React.createElement;

  var DAY = 86400000;

  // ── STREFY RYZYKA (spec 5.5) ─────────────────────────────────────────────
  var ZONES = [
    { max:0.8,      id:'low',   color:'var(--a-light)', icon:'⏸️', label:'Regeneracja / Deload' },
    { max:1.3,      id:'opt',   color:'var(--green)',   icon:'✅', label:'Optymalna strefa' },
    { max:1.5,      id:'warn',  color:'var(--orange)',  icon:'⚠️', label:'Podwyższone ryzyko' },
    { max:2.0,      id:'high',  color:'var(--red)',     icon:'🚨', label:'Wysokie ryzyko kontuzji' },
    { max:Infinity, id:'crit',  color:'#b91c1c',        icon:'🔴', label:'Krytyczne – natychmiast zredukuj' },
  ];
  ET.acwrZone = function(v) {
    for (var i=0;i<ZONES.length;i++) if (v < ZONES[i].max || ZONES[i].max===Infinity) return ZONES[i];
    return ZONES[ZONES.length-1];
  };

  // ── REKOMENDACJE (spec 5.7) ──────────────────────────────────────────────
  ET.acwrRecommendation = function(v) {
    if (v < 0.8)  return 'Niskie obciążenie względem normy. Dobry moment, aby wrócić do progresji i stopniowo zwiększać wolumen.';
    if (v <= 1.3) return 'Jesteś w optymalnej strefie obciążeń. Możesz bezpiecznie progresować.';
    if (v <= 1.5) return 'Twoje obciążenie rośnie szybciej niż zwykle. Rozważ utrzymanie ciężarów w tym tygodniu i zwróć uwagę na sygnały z ciała.';
    if (v <= 2.0) return 'Ryzyko przeciążenia jest wysokie. Zalecam redukcję wolumenu o 30–40% lub deload. Twoje ścięgna i więzadła nie nadążają za mięśniami.';
    return 'Krytyczny poziom obciążenia. Natychmiastowy deload. W tym tygodniu maksymalnie 50% normalnego wolumenu. Skonsultuj się z fizjoterapeutą jeśli odczuwasz ból.';
  };

  // ── OBCIĄŻENIE SESJI ─────────────────────────────────────────────────────
  function estimateRPE(sess) {
    var rpes = [];
    (sess.exercises||[]).forEach(function(ex){ if (ex.rpe != null && ex.rpe > 0) rpes.push(ex.rpe); });
    if (rpes.length) return rpes.reduce(function(a,b){ return a+b; },0) / rpes.length;
    if (sess.readiness && sess.readiness.fatigue) return ({ 1:8.5, 2:7, 3:6 })[sess.readiness.fatigue] || 7;
    return 7;
  }
  function sessionLoad(sess, method) {
    if (method === 'internal') {
      var durMin = (sess.duration || 0) / 60000;
      return estimateRPE(sess) * durMin;
    }
    if (sess.volume != null) return sess.volume;
    var v = 0;
    (sess.exercises||[]).forEach(function(ex){ (ex.setsData||[]).forEach(function(s){ if (s.done) v += (s.weight||0)*(s.reps||0); }); });
    return v;
  }

  // ── GŁÓWNE OBLICZENIA ACWR (spec 5.3–5.4) ────────────────────────────────
  ET.acwrData = function(store, settings) {
    settings = settings || (store.acwrSettings) || { method:'external', threshold:1.3 };
    var method = settings.method || 'external';
    var sessions = (store.workouts||[]).filter(function(s){ return s.date; });
    if (!sessions.length) return { ready:false, daysLogged:0, hasData:false };

    var byDate = {};
    sessions.forEach(function(s){ byDate[s.date] = (byDate[s.date]||0) + sessionLoad(s, method); });

    var todayMs = new Date(ET.dstr()).getTime();
    function daysAgo(dateStr) { return Math.floor((todayMs - new Date(dateStr).getTime()) / DAY); }

    var firstDate = sessions.reduce(function(m,s){ return s.date < m ? s.date : m; }, sessions[0].date);
    var daysLogged = Math.floor((todayMs - new Date(firstDate).getTime()) / DAY) + 1;

    // ACWR jako-of przesunięcia refDay = dziś - shift
    function acwrAsOf(shift) {
      var ac = 0, ch = 0;
      Object.keys(byDate).forEach(function(d) {
        var a = daysAgo(d) - shift;
        if (a >= 0 && a <= 6) ac += byDate[d];
        if (a >= 0 && a <= 27) ch += byDate[d];
      });
      ch = ch / 4;
      return { acute:ac, chronic:ch, acwr: ch>0 ? ac/ch : 0 };
    }

    var now = acwrAsOf(0);
    var prev = acwrAsOf(7);
    var trend = now.acwr > prev.acwr + 0.05 ? 'up' : (now.acwr < prev.acwr - 0.05 ? 'down' : 'flat');

    // Seria 12 tygodni (od najstarszego do teraz)
    var weekly = [];
    for (var w=11; w>=0; w--) {
      var r = acwrAsOf(w*7);
      weekly.push({ weeksAgo:w, acute:r.acute, chronic:r.chronic, acwr:r.acwr });
    }

    var ready = daysLogged >= 28 && now.chronic > 0;
    return {
      hasData:true, ready:ready, daysLogged:daysLogged, method:method,
      acute:now.acute, chronic:now.chronic, acwr:now.acwr,
      zone: ET.acwrZone(now.acwr), trend:trend, weekly:weekly,
      threshold: settings.threshold || 1.3
    };
  };

  function trendArrow(t){ return t==='up' ? '↑' : t==='down' ? '↓' : '→'; }
  function fmt(v){ return (Math.round(v*100)/100).toFixed(2).replace('.', ','); }

  // ── WSKAŹNIK (gauge) ─────────────────────────────────────────────────────
  function Gauge(props) {
    var v = props.value;
    var pos = Math.max(0, Math.min(1, v/2)) * 100; // 0..2 → 0..100%
    // segmenty proporcjonalne: 0-0.8(40%) 0.8-1.3(25%) 1.3-1.5(10%) 1.5-2.0(25%)
    var segs = [
      { w:40, c:'var(--a-light)' },
      { w:25, c:'var(--green)' },
      { w:10, c:'var(--orange)' },
      { w:25, c:'var(--red)' },
    ];
    return _h('div', { style:{ margin:'8px 0 4px' } },
      _h('div', { style:{ position:'relative', height:16, borderRadius:8, overflow:'hidden', display:'flex' } },
        segs.map(function(s,i){ return _h('div', { key:i, style:{ width:s.w+'%', background:s.c, opacity:.85 } }); })
      ),
      _h('div', { style:{ position:'relative', height:14 } },
        _h('div', { style:{ position:'absolute', left:'calc('+pos+'% - 6px)', top:-2, width:0, height:0, borderLeft:'6px solid transparent', borderRight:'6px solid transparent', borderTop:'8px solid var(--t1)' } })
      ),
      _h('div', { style:{ display:'flex', justifyContent:'space-between', fontSize:'.58rem', color:'var(--t3)', marginTop:-2 } },
        ['0', '0,8', '1,3', '1,5', '2,0+'].map(function(l,i){ return _h('span', { key:i }, l); })
      )
    );
  }

  // ── WYKRES HISTORII 12 TYG. (spec 5.8) ───────────────────────────────────
  function HistoryChart(props) {
    var weekly = props.weekly || [];
    var W = 320, H = 150, padL = 26, padB = 18, padT = 8, padR = 6;
    var plotW = W - padL - padR, plotH = H - padB - padT;
    var maxY = 2.2;
    function x(i){ return padL + (weekly.length<=1 ? plotW/2 : (i/(weekly.length-1))*plotW); }
    function y(v){ return padT + plotH - (Math.min(v,maxY)/maxY)*plotH; }

    // strefy tła
    var bands = [
      { from:0,   to:0.8, c:'rgba(99,102,241,.10)' },
      { from:0.8, to:1.3, c:'rgba(34,197,94,.12)' },
      { from:1.3, to:1.5, c:'rgba(249,115,22,.12)' },
      { from:1.5, to:2.2, c:'rgba(239,68,68,.12)' },
    ];
    var linePts = weekly.map(function(d,i){ return x(i)+','+y(d.acwr); }).join(' ');

    return _h('svg', { viewBox:'0 0 '+W+' '+H, style:{ width:'100%', height:'auto' } },
      bands.map(function(b,i){ return _h('rect', { key:'b'+i, x:padL, y:y(b.to), width:plotW, height:(y(b.from)-y(b.to)), fill:b.c }); }),
      [0.8,1.3,1.5].map(function(t,i){ return _h('line', { key:'t'+i, x1:padL, x2:W-padR, y1:y(t), y2:y(t), stroke:'var(--b1)', strokeDasharray:'3 3', strokeWidth:1 }); }),
      [0,0.8,1.3,1.5,2].map(function(t,i){ return _h('text', { key:'yl'+i, x:padL-4, y:y(t)+3, fontSize:7, fill:'var(--t3)', textAnchor:'end' }, fmt(t).replace(',00','').replace(',','.')); }),
      // słupki acute (skalowane do własnego max, subtelne)
      (function(){
        var maxA = Math.max.apply(null, weekly.map(function(d){ return d.acute; }).concat([1]));
        return weekly.map(function(d,i){
          var bh = (d.acute/maxA)*plotH*0.5;
          return _h('rect', { key:'a'+i, x:x(i)-4, y:padT+plotH-bh, width:8, height:bh, fill:'var(--a)', opacity:.18 });
        });
      })(),
      weekly.length>1 && _h('polyline', { points:linePts, fill:'none', stroke:'var(--a-light)', strokeWidth:2 }),
      weekly.map(function(d,i){ return _h('circle', { key:'c'+i, cx:x(i), cy:y(d.acwr), r:2.5, fill: ET.acwrZone(d.acwr).color }); }),
      _h('text', { x:padL, y:H-4, fontSize:7, fill:'var(--t3)' }, '12 tyg. temu'),
      _h('text', { x:W-padR, y:H-4, fontSize:7, fill:'var(--t3)', textAnchor:'end' }, 'teraz')
    );
  }

  // ── ALERT POTRENINGOWY (spec 5.6) — znika po 10 s ────────────────────────
  function ACWRAlert() {
    var su = ET.useStore(); var store = su.store;
    var vis = React.useState(true); var visible = vis[0], setVisible = vis[1];
    React.useEffect(function(){ var t = setTimeout(function(){ setVisible(false); }, 10000); return function(){ clearTimeout(t); }; }, []);
    if (!visible) return null;
    var d = ET.acwrData(store);
    if (!d.hasData || !d.ready) return null;
    var z = d.zone;
    return _h('div', { style:{ display:'flex', alignItems:'center', gap:10, padding:'8px 12px', borderRadius:'var(--r2)', marginBottom:12, background:'var(--s2)', border:'1px solid '+z.color+'66' } },
      _h('span', { style:{ fontSize:'1.1rem' } }, z.icon),
      _h('div', { style:{ flex:1 } },
        _h('div', { style:{ fontSize:'.7rem', color:'var(--t3)' } }, 'ACWR '+fmt(d.acwr)+' '+trendArrow(d.trend)),
        _h('div', { style:{ fontSize:'.78rem', fontWeight:700, color:z.color } }, z.label)
      ),
      _h('button', { className:'btn btn-ghost btn-sm btn-icon', style:{ color:'var(--t3)' }, onClick:function(){ setVisible(false); } }, '✕')
    );
  }
  ET.ACWRAlert = ACWRAlert;

  // ── MODUŁ ────────────────────────────────────────────────────────────────
  function AcwrModule() {
    var su = ET.useStore(); var store = su.store, update = su.update;
    var settings = store.acwrSettings || { method:'external', threshold:1.3, notifications:false };
    var d = ET.acwrData(store, settings);

    function setSetting(k, v) {
      update(function(s){ var cur = s.acwrSettings || {}; var o={}; o[k]=v; return Object.assign({}, s, { acwrSettings: Object.assign({}, cur, o) }); });
    }

    return _h('div', { className:'fade-in' },
      _h('div', { className:'page-hdr' },
        _h('div', null,
          _h('h1', null, '📈 ACWR'),
          _h('p', null, 'Stosunek obciążenia ostrego do przewlekłego')
        ),
        _h('div', null)
      ),

      // Metoda obliczeń
      _h('div', { style:{ display:'flex', gap:6, marginBottom:14 } },
        [{ id:'external', l:'Obciążenie zewnętrzne' }, { id:'internal', l:'Wewnętrzne (RPE×czas)' }].map(function(m) {
          return _h('button', { key:m.id, className:'tag-btn'+(settings.method===m.id?' active':''), style:{ flex:1, fontSize:'.72rem' }, onClick:function(){ setSetting('method', m.id); } }, m.l);
        })
      ),

      !d.hasData
        ? _h(ET.Placeholder, { icon:'📈', title:'Brak treningów', desc:'Zaloguj treningi siłowe, aby liczyć ACWR.' })
        : !d.ready
          ? _h('div', { className:'card', style:{ textAlign:'center', padding:'28px 16px' } },
              _h('div', { style:{ fontSize:'2rem', marginBottom:8 } }, '⏳'),
              _h('div', { style:{ fontWeight:700, marginBottom:6 } }, 'Zbieranie danych...'),
              _h('div', { style:{ fontSize:'.82rem', color:'var(--t2)', marginBottom:12 } }, Math.min(d.daysLogged,28)+'/28 dni logowania'),
              _h(ET.ProgressBar, { value: Math.min(100, d.daysLogged/28*100) }),
              _h('div', { style:{ fontSize:'.72rem', color:'var(--t3)', marginTop:12 } }, 'ACWR pojawi się po min. 28 dniach treningów.')
            )
          : _h('div', null,
              // Karta główna z wartością i strefą
              _h('div', { className:'card', style:{ marginBottom:14 } },
                _h('div', { style:{ display:'flex', alignItems:'baseline', gap:10, marginBottom:2 } },
                  _h('div', { style:{ fontSize:'2.4rem', fontWeight:800, color:d.zone.color, lineHeight:1 } }, fmt(d.acwr)),
                  _h('div', { style:{ fontSize:'1.4rem', color:'var(--t3)' } }, trendArrow(d.trend))
                ),
                _h('div', { style:{ display:'flex', alignItems:'center', gap:6, marginBottom:8 } },
                  _h('span', { style:{ fontSize:'1.1rem' } }, d.zone.icon),
                  _h('span', { style:{ fontWeight:700, color:d.zone.color, fontSize:'.9rem' } }, d.zone.label)
                ),
                _h(Gauge, { value:d.acwr }),
                _h('div', { style:{ display:'flex', gap:8, marginTop:12 } },
                  _h(ET.StatCard, { label:'Ostre (7 dni)', value:Math.round(d.acute).toLocaleString('pl-PL'), color:'var(--a-light)' }),
                  _h(ET.StatCard, { label:'Przewlekłe (śr. tyg.)', value:Math.round(d.chronic).toLocaleString('pl-PL'), color:'var(--purple)' })
                )
              ),

              // Rekomendacja
              _h('div', { className:'card', style:{ marginBottom:14, borderLeft:'3px solid '+d.zone.color } },
                _h('div', { style:{ fontWeight:700, fontSize:'.82rem', color:'var(--t2)', marginBottom:6 } }, '🧠 Rekomendacja przed sesją'),
                _h('div', { style:{ fontSize:'.84rem', color:'var(--t1)', lineHeight:1.55 } }, ET.acwrRecommendation(d.acwr)),
                d.acwr>=1.0 && d.acwr<=1.3 && _h('div', { style:{ fontSize:'.74rem', color:'var(--t3)', marginTop:8 } },
                  '📏 Zasada 10%: kolejny tydzień zwiększaj obciążenie maks. o 10% względem średniej z 4 tyg.')
              ),

              // Wykres historii
              _h('div', { className:'card', style:{ marginBottom:14 } },
                _h('div', { style:{ fontWeight:700, fontSize:'.82rem', color:'var(--t2)', marginBottom:8 } }, '📊 ACWR — ostatnie 12 tygodni'),
                _h(HistoryChart, { weekly:d.weekly })
              )
            ),

      // Ustawienia (spec 5.10)
      _h('div', { className:'card' },
        _h('div', { style:{ fontWeight:700, fontSize:'.82rem', color:'var(--t2)', marginBottom:10 } }, '⚙️ Ustawienia ACWR'),
        _h('div', { className:'field' },
          _h('label', { style:{ display:'flex', justifyContent:'space-between' } }, _h('span', null, 'Próg alertu'), _h('span', { style:{ color:'var(--orange)', fontWeight:700 } }, fmt(settings.threshold||1.3))),
          _h('div', { className:'slider-wrap' }, _h('input', { type:'range', min:1.2, max:1.8, step:0.05, value:settings.threshold||1.3, onChange:function(e){ setSetting('threshold', +e.target.value); } }))
        ),
        _h('div', { style:{ display:'flex', justifyContent:'space-between', alignItems:'center', paddingTop:6 } },
          _h('span', { style:{ fontSize:'.82rem' } }, '🔔 Powiadomienia push'),
          _h('button', {
            className:'tag-btn'+(settings.notifications?' active':''),
            onClick:function(){ setSetting('notifications', !settings.notifications); }
          }, settings.notifications ? 'Włączone' : 'Wyłączone')
        )
      )
    );
  }

  ET.AcwrModule = AcwrModule;

  // ══════════════════════════════════════════════════════════════════════
  // WEB — ekran „Trener AI" wg designu „EasyTraining Aplikacja".
  // Spec: docs/segment-05-trener-ai-acwr.md. Sama matematyka (ET.acwrData/
  // acwrZone/acwrRecommendation) i HistoryChart są nietknięte — ten blok
  // to wyłącznie nowa prezentacja desktopowa + lista wniosków trenera.
  // ══════════════════════════════════════════════════════════════════════

  var GAUGE_SEGS = [
    { w:40, c:'var(--a-light)' }, { w:25, c:'var(--green)' },
    { w:10, c:'var(--orange)' }, { w:25, c:'var(--red)' },
  ];
  var GAUGE_TICKS = [
    { at:0,   name:'0' }, { at:0.8, name:'0,8' }, { at:1.3, name:'1,3' },
    { at:1.5, name:'1,5' }, { at:2.0, name:'2,0+' },
  ];
  var SECTION_LABEL = ET.SECTION_LABEL;

  // Regeneracja dnia — ta sama formuła co ekran Gotowość (js/readiness.js),
  // lokalna kopia zamiast współdzielonego eksportu: obie strony domenowo
  // należą do różnych modułów, a duplikat 6 linii jest tańszy niż nowa
  // zależność cross-file dla jednego wniosku.
  function todayRecoveryPct(store) {
    var today = ET.dstr();
    var ci = (store.wellbeingEntries||[]).find(function(e){ return e.date===today && !e.tag; });
    var sl = (store.sleepSessions||[]).find(function(e){ return e.date===today; });
    var comps = [];
    if (sl) { comps.push(Math.min(1, sl.duration/8)); comps.push(sl.quality/10); }
    if (ci) { comps.push(ci.energy/10); comps.push((10-ci.stress)/10); comps.push(ci.motivation/10); comps.push(ci.mood/10); }
    if (!comps.length) return null;
    return Math.round(comps.reduce(function(a,b){ return a+b; },0)/comps.length*100);
  }

  // Wnioski trenera z realnych danych (spec §4) — kolejność: ryzyko, trend,
  // kontekst. Zwraca w kształcie oczekiwanym przez ET.InsightList.
  function buildAcwrInsights(store, d) {
    var out = [];
    var todayMs = new Date(ET.dstr()).getTime();
    function daysAgo(dateStr) { return Math.floor((todayMs - new Date(dateStr).getTime()) / DAY); }

    if (d.zone.id === 'warn' || d.zone.id === 'high' || d.zone.id === 'crit') {
      out.push({ type:'warning', icon:d.zone.icon, title:'Strefa ryzyka: '+d.zone.label, body:ET.acwrRecommendation(d.acwr) });
    } else if (d.zone.id === 'low') {
      out.push({ type:'info', icon:'⏸️', title:'Obciążenie poniżej normy', body:'ACWR '+fmt(d.acwr)+' — dobry moment, żeby wrócić do progresji i stopniowo zwiększać wolumen.' });
    }

    if (d.chronic > 0) {
      var deltaPct = Math.round((d.acute - d.chronic) / d.chronic * 100);
      if (deltaPct >= 8) out.push({ type:'positive', icon:'📈', title:'Objętość rośnie', body:'Ostatnie 7 dni są o '+deltaPct+'% powyżej średniej tygodniowej z ostatnich 4 tygodni.' });
      else if (deltaPct <= -8) out.push({ type:'warning', icon:'📉', title:'Objętość spada', body:'Ostatnie 7 dni są o '+Math.abs(deltaPct)+'% poniżej średniej tygodniowej — sprawdź, czy to zamierzona regeneracja.' });
    }

    var sessions28 = (store.workouts||[]).filter(function(w){ return w.date && daysAgo(w.date) <= 27; });
    var perWeek = sessions28.length / 4;
    var perWeekTxt = perWeek.toFixed(1).replace('.', ',');
    if (perWeek >= 3) out.push({ type:'positive', icon:'🗓️', title:'Dobra częstotliwość', body:perWeekTxt+' sesji/tydzień średnio z ostatnich 4 tygodni.' });
    else if (perWeek >= 2) out.push({ type:'info', icon:'🗓️', title:'Umiarkowana częstotliwość', body:perWeekTxt+' sesji/tydzień — więcej regularności przyspieszy postęp.' });
    else if (sessions28.length) out.push({ type:'warning', icon:'🗓️', title:'Niska częstotliwość', body:perWeekTxt+' sesji/tydzień z ostatnich 4 tygodni — trudno o postęp przy tak rzadkich sesjach.' });

    // Stagnacja: ten sam najlepszy ciężar w 3 kolejnych sesjach ćwiczenia.
    var byExercise = {};
    (store.workouts||[]).forEach(function(w) {
      (w.exercises||[]).forEach(function(ex) {
        var best = (ex.setsData||[]).filter(function(s){ return s.done; }).reduce(function(m,s){ return Math.max(m, s.weight||0); }, 0);
        if (!best) return;
        (byExercise[ex.name] = byExercise[ex.name]||[]).push({ date:w.date, best:best });
      });
    });
    Object.keys(byExercise).some(function(name) {
      var hist = byExercise[name].slice(0, 3);
      if (hist.length === 3 && hist[0].best === hist[1].best && hist[1].best === hist[2].best) {
        out.push({ type:'warning', icon:'📊', title:'Stagnacja: '+name, body:'Ten sam najlepszy ciężar ('+String(hist[0].best).replace('.', ',')+' kg) w 3 ostatnich sesjach — czas zmienić schemat powtórzeń albo dodać wariant ćwiczenia.' });
        return true;
      }
      return false;
    });

    var pain7 = (store.painEntries||[]).filter(function(p){ return p.date && p.type!=='doms' && daysAgo(p.date)<=6; });
    if (pain7.length) out.push({ type:'warning', icon:'🩹', title:'Zgłoszony ból w tym tygodniu', body:pain7.length+' '+(pain7.length===1?'wpis':'wpisy')+' bólu (nie DOMS) z ostatnich 7 dni — sprawdź ekran Ból i fizjo przed zwiększaniem obciążenia.' });

    var rec = todayRecoveryPct(store);
    if (rec != null) {
      if (rec < 50) out.push({ type:'warning', icon:'🔋', title:'Niska regeneracja', body:'Gotowość dnia '+rec+'% — rozważ lżejszą sesję.' });
      else if (rec < 70) out.push({ type:'info', icon:'🔋', title:'Umiarkowana regeneracja', body:'Gotowość dnia '+rec+'% — trzymaj się planu.' });
    }

    return out.slice(0, 6);
  }

  function WebGaugeHero(props) {
    var d = props.d;
    var pos = Math.max(0, Math.min(1, d.acwr/2)) * 100;
    var threshLeft = Math.max(0, Math.min(1, d.threshold/2)) * 100;
    return _h('div', { className:'glass', style:{ display:'flex', gap:20, flexWrap:'wrap', padding:22, borderRadius:22 } },
      _h('div', { style:{ flex:'1 1 300px', minWidth:280, display:'flex', flexDirection:'column', gap:16 } },
        _h('div', { style:{ display:'flex', alignItems:'flex-end', gap:12, flexWrap:'wrap' } },
          _h('span', { style:{ fontSize:54, fontWeight:800, lineHeight:.9, letterSpacing:'-.05em', fontVariantNumeric:'tabular-nums', color:d.zone.color } }, fmt(d.acwr)),
          _h('span', { style:{ paddingBottom:6, fontSize:26, fontWeight:800, color: d.trend==='up'?'var(--red)':d.trend==='down'?'var(--green)':'var(--t3)' } }, trendArrow(d.trend)),
          _h('div', { style:{ display:'flex', alignItems:'center', gap:7, paddingBottom:8 } },
            _h('span', { style:{ fontSize:15 } }, d.zone.icon),
            _h('span', { style:{ fontSize:13, fontWeight:700, color:d.zone.color } }, d.zone.label)
          )
        ),
        _h('div', { style:{ display:'flex', flexDirection:'column', gap:5 } },
          _h('div', { style:{ position:'relative', display:'flex', height:18, borderRadius:9, overflow:'hidden' } },
            GAUGE_SEGS.map(function(s,i){ return _h('div', { key:i, style:{ width:s.w+'%', background:s.c, opacity:.85 } }); }),
            _h('div', { style:{ position:'absolute', top:0, bottom:0, width:2, background:'rgba(255,255,255,.55)', left:threshLeft+'%' } })
          ),
          _h('div', { style:{ position:'relative', height:12 } },
            _h('div', { style:{ position:'absolute', top:0, left:'calc('+pos+'% - 6px)', width:0, height:0, borderLeft:'6px solid transparent', borderRight:'6px solid transparent', borderTop:'9px solid var(--t1)' } })
          ),
          _h('div', { style:{ position:'relative', height:11 } },
            GAUGE_TICKS.map(function(t,i){ return _h('span', { key:i, style:{ position:'absolute', top:0, left:(t.at/2*100)+'%', transform: i===0?'none':i===GAUGE_TICKS.length-1?'translateX(-100%)':'translateX(-50%)', fontSize:9.5, fontWeight:600, color:'var(--t3)', whiteSpace:'nowrap' } }, t.name); })
          )
        )
      ),
      _h('div', { style:{ flex:'1 1 240px', minWidth:220, display:'flex', flexDirection:'column', gap:8 } },
        [
          { label:'OSTRE (7 DNI)', val:Math.round(d.acute).toLocaleString('pl-PL'), color:'var(--a-light)' },
          { label:'PRZEWLEKŁE (ŚR. TYG.)', val:Math.round(d.chronic).toLocaleString('pl-PL'), color:'var(--purple)' },
          { label:'PRÓG ALERTU', val:fmt(d.threshold), color:'var(--orange)' },
        ].map(function(s) {
          return _h('div', { key:s.label, style:{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:10, padding:'12px 14px', borderRadius:14, background:'rgba(255,255,255,.04)', border:'1px solid rgba(255,255,255,.08)' } },
            _h('span', { style:{ fontSize:8.5, fontWeight:800, letterSpacing:'.12em', color:'var(--t3)' } }, s.label),
            _h('span', { style:{ fontSize:15, fontWeight:800, fontVariantNumeric:'tabular-nums', color:s.color } }, s.val)
          );
        })
      )
    );
  }

  function WebChartHero(props) {
    var d = props.d;
    return _h('div', { className:'glass', style:{ display:'flex', flexDirection:'column', gap:15, padding:22, borderRadius:22 } },
      _h('div', { style:{ display:'flex', alignItems:'flex-end', justifyContent:'space-between', gap:16, flexWrap:'wrap' } },
        _h('div', { style:{ display:'flex', alignItems:'flex-end', gap:11 } },
          _h('span', { style:{ fontSize:44, fontWeight:800, lineHeight:.9, letterSpacing:'-.04em', fontVariantNumeric:'tabular-nums', color:d.zone.color } }, fmt(d.acwr)),
          _h('span', { style:{ paddingBottom:5, fontSize:13, fontWeight:700, color:d.zone.color } }, d.zone.label)
        ),
        _h('span', { style:SECTION_LABEL }, '12 TYGODNI')
      ),
      _h('div', { style:{ maxWidth:640 } }, _h(HistoryChart, { weekly:d.weekly }))
    );
  }

  function WebAcwrModule() {
    var su = ET.useStore(); var store = su.store, update = su.update;
    var settings = store.acwrSettings || { method:'external', threshold:1.3, notifications:false };
    var d = ET.acwrData(store, settings);
    var vs = React.useState('gauge'); var view = vs[0], setView = vs[1];

    function setSetting(k, v) {
      update(function(s){ var cur = s.acwrSettings || {}; var o={}; o[k]=v; return Object.assign({}, s, { acwrSettings: Object.assign({}, cur, o) }); });
    }

    return _h('div', { className:'scr-in', style:{ display:'flex', flexDirection:'column', gap:18 } },

      _h('div', { style:{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:14, flexWrap:'wrap' } },
        _h('div', { style:{ display:'flex', gap:8, flexWrap:'wrap' } },
          [{ id:'external', name:'Obciążenie zewnętrzne', sub:'objętość (kg)' }, { id:'internal', name:'Wewnętrzne', sub:'RPE × czas' }].map(function(m) {
            var on = settings.method === m.id;
            return _h('div', { key:m.id, onClick:function(){ setSetting('method', m.id); },
              style:{ display:'flex', flexDirection:'column', gap:5, padding:'10px 15px', borderRadius:14, cursor:'pointer',
                background: on ? 'rgba(59,130,246,.14)' : 'rgba(255,255,255,.04)', border:'1px solid ' + (on ? 'rgba(96,165,250,.36)' : 'rgba(255,255,255,.08)') } },
              _h('span', { style:{ fontSize:12, fontWeight:700, letterSpacing:'-.01em', color: on ? 'var(--a-light)' : 'var(--t1)' } }, m.name),
              _h('span', { style:{ fontSize:9.5, fontWeight:600, color:'var(--t3)' } }, m.sub)
            );
          })
        ),
        d.hasData && d.ready && _h('div', { style:{ display:'flex', gap:4, padding:4, borderRadius:13, background:'rgba(255,255,255,.04)', border:'1px solid rgba(255,255,255,.08)' } },
          [{ id:'gauge', name:'Skala ryzyka' }, { id:'chart', name:'Trend 12 tyg.' }].map(function(t) {
            var on = view === t.id;
            return _h('div', { key:t.id, onClick:function(){ setView(t.id); },
              style:{ padding:'8px 13px', borderRadius:10, cursor:'pointer', fontSize:11.5, fontWeight:700, color: on ? 'var(--a-light)' : 'var(--t3)', background: on ? 'rgba(59,130,246,.16)' : 'transparent', transition:'background .2s,color .2s' } }, t.name);
          })
        )
      ),

      !d.hasData
        ? _h('div', { className:'wcard', style:{ display:'flex', flexDirection:'column', alignItems:'center', gap:9, padding:'44px 20px', borderRadius:22, border:'1px dashed rgba(255,255,255,.12)' } },
            _h('span', { style:{ fontSize:28 } }, '📈'),
            _h('div', { style:{ fontSize:14, fontWeight:700 } }, 'Brak treningów'),
            _h('div', { style:{ fontSize:12, color:'var(--t3)', textAlign:'center', maxWidth:340 } }, 'Zapisz pierwszy trening siłowy — ACWR liczy się z objętości sesji.')
          )
        : !d.ready
          ? _h('div', { className:'wcard', style:{ display:'flex', flexDirection:'column', alignItems:'center', gap:11, padding:'38px 20px', borderRadius:22 } },
              _h('span', { style:{ fontSize:30 } }, '⏳'),
              _h('div', { style:{ fontSize:14.5, fontWeight:700 } }, 'Zbieranie danych'),
              _h('div', { style:{ fontSize:11.5, fontWeight:600, color:'var(--t2)' } }, Math.min(d.daysLogged,28)+'/28 dni logowania'),
              _h('div', { style:{ width:'100%', maxWidth:320, height:6, borderRadius:3, background:'rgba(255,255,255,.08)', overflow:'hidden' } },
                _h('div', { style:{ height:'100%', borderRadius:3, background:'linear-gradient(90deg,var(--a),var(--purple))', width:Math.min(100, d.daysLogged/28*100)+'%' } })),
              _h('div', { style:{ fontSize:11.5, color:'var(--t3)', textAlign:'center', maxWidth:380 } }, 'ACWR wymaga minimum 28 dni logowania — dopiero wtedy średnia przewlekła ma sens statystyczny.')
            )
          : _h('div', { style:{ display:'flex', flexDirection:'column', gap:18 } },
              view === 'gauge' ? _h(WebGaugeHero, { d:d }) : _h(WebChartHero, { d:d }),

              _h('div', { className:'wcard', style:{ display:'flex', flexDirection:'column', gap:8, padding:20, borderRadius:20, borderLeft:'3px solid '+d.zone.color } },
                _h('span', { style:SECTION_LABEL }, '🧠 REKOMENDACJA PRZED SESJĄ'),
                _h('div', { style:{ fontSize:13, color:'var(--t1)', lineHeight:1.55 } }, ET.acwrRecommendation(d.acwr)),
                d.acwr>=1.0 && d.acwr<=1.3 && _h('div', { style:{ fontSize:11, color:'var(--t3)' } }, '📏 Zasada 10%: kolejny tydzień zwiększaj obciążenie maks. o 10% względem średniej z 4 tyg.')
              ),

              _h('div', { className:'wcard', style:{ display:'flex', flexDirection:'column', gap:10, padding:20, borderRadius:20 } },
                _h('span', { style:SECTION_LABEL }, 'WNIOSKI TRENERA'),
                ET.InsightList(buildAcwrInsights(store, d))
              )
            ),

      _h('div', { className:'wcard', style:{ display:'flex', flexDirection:'column', gap:14, padding:20, borderRadius:20 } },
        _h('span', { style:SECTION_LABEL }, '⚙️ USTAWIENIA ACWR'),
        _h('div', { style:{ display:'flex', flexDirection:'column', gap:8 } },
          _h('div', { style:{ display:'flex', justifyContent:'space-between' } },
            _h('span', { style:{ fontSize:12, color:'var(--t2)' } }, 'Próg alertu'),
            _h('span', { style:{ color:'var(--orange)', fontWeight:700, fontSize:12 } }, fmt(settings.threshold||1.3))
          ),
          _h('input', { type:'range', min:1.2, max:1.8, step:0.05, value:settings.threshold||1.3, onChange:function(e){ setSetting('threshold', +e.target.value); }, style:{ width:'100%' } })
        ),
        _h('div', { style:{ display:'flex', justifyContent:'space-between', alignItems:'center' } },
          _h('span', { style:{ fontSize:12.5 } }, '🔔 Powiadomienia push'),
          _h('div', { onClick:function(){ setSetting('notifications', !settings.notifications); },
            style:{ padding:'6px 12px', borderRadius:100, cursor:'pointer', fontSize:11, fontWeight:700,
              background: settings.notifications ? 'rgba(59,130,246,.16)' : 'rgba(255,255,255,.05)', border:'1px solid ' + (settings.notifications ? 'rgba(96,165,250,.34)' : 'rgba(255,255,255,.10)'), color: settings.notifications ? 'var(--a-light)' : 'var(--t2)' } },
            settings.notifications ? 'Włączone' : 'Wyłączone')
        )
      )
    );
  }

  ET.WebAcwrModule = WebAcwrModule;
})();
