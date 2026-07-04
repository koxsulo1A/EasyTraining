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
})();
