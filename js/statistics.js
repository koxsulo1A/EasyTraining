(function() {
  'use strict';
  window.ET = window.ET || {};
  var _h = React.createElement;

  var RANGES = [7, 30, 60, 90, 180, 360];

  function filterRange(entries, dateKey, n) {
    var now = new Date(); now.setHours(23,59,59,999);
    var start = new Date(); start.setDate(start.getDate()-(n-1)); start.setHours(0,0,0,0);
    return entries.filter(function(e){ var d=new Date(e[dateKey]+'T12:00'); return d>=start&&d<=now; });
  }

  function getByDay(entries, dateKey, valFn) {
    return entries.slice().sort(function(a,b){ return a[dateKey].localeCompare(b[dateKey]); })
      .map(function(e){ return { label:ET.fmtDateShort(e[dateKey]), value:valFn(e) }; });
  }

  function getWeeklyBars(entries, dateKey, valFn, nDays) {
    var weeks = Math.min(Math.ceil(nDays/7), 26);
    var now = new Date();
    var result = [];
    for (var w = weeks-1; w >= 0; w--) {
      var mon = new Date(now); mon.setDate(now.getDate()-now.getDay()-7*w+1); mon.setHours(0,0,0,0);
      var sun = new Date(mon); sun.setDate(mon.getDate()+6); sun.setHours(23,59,59,999);
      var label = mon.toLocaleDateString('pl-PL', { day:'numeric', month:'short' });
      var week = entries.filter(function(e){ var d=new Date(e[dateKey]+'T12:00'); return d>=mon&&d<=sun; });
      result.push({ label:label, value:valFn(week) });
    }
    return result;
  }

  function StatisticsModule() {
    var su = ET.useStore(); var store = su.store;
    var nav = ET.useNav(); var navigate = nav.navigate;
    var tab = React.useState('strength'); var activeTab = tab[0], setActiveTab = tab[1];
    var rng = React.useState(30); var range = rng[0], setRange = rng[1];
    var exSel = React.useState([]); var selExes = exSel[0], setSelExes = exSel[1];
    var tbl = React.useState(false); var tableOpen = tbl[0], setTableOpen = tbl[1];

    var workouts        = store.workouts||[];
    var runs            = store.runs||[];
    var sleepSessions   = store.sleepSessions||[];
    var measurements    = store.measurements||[];
    var saunaSessions   = store.saunaSessions||[];
    var wellbeingEntries = store.wellbeingEntries||[];

    // Range-filtered sets
    var wf  = filterRange(workouts,      'date', range);
    var rf  = filterRange(runs,          'date', range);
    var sf  = filterRange(sleepSessions, 'date', range);
    var sau = filterRange(saunaSessions, 'date', range);
    var wbf = filterRange(wellbeingEntries, 'date', range);

    // Chart data
    var volumeData  = getWeeklyBars(wf,  'date', function(wk){ return wk.reduce(function(t,w){ return t+(w.volume||0); },0); }, range);
    var runLineData = getByDay(rf,  'date', function(e){ return e.distance||0; });
    var sleepData   = getByDay(sf,  'date', function(e){ return e.duration||0; });
    var saunaData   = getWeeklyBars(sau, 'date', function(wk){ return wk.reduce(function(t,s){ return t+(s.duration||0); },0); }, range);
    var weightData  = measurements.slice().reverse().map(function(m){ return { label:ET.fmtDateShort(m.date), value:m.weight||0 }; });

    // Range totals / averages
    var totalVol      = wf.reduce(function(t,w){ return t+(w.volume||0); },0);
    var totalKm       = rf.reduce(function(t,r){ return t+(r.distance||0); },0);
    var totalSaunaMin = sau.reduce(function(t,s){ return t+(s.duration||0); },0);
    var avgSleep = sf.length ? (sf.reduce(function(t,s){ return t+(s.duration||0); },0)/sf.length).toFixed(1) : '—';
    var avgReadiness = (function(){
      var r=sf.filter(function(s){ return s.readiness!=null; });
      return r.length ? Math.round(r.reduce(function(t,s){ return t+(s.readiness||0); },0)/r.length) : '—';
    })();

    // Wellbeing stats (range-filtered)
    var preEntries  = wbf.filter(function(e){ return e.tag && e.tag.startsWith('przed'); });
    var postEntries = wbf.filter(function(e){ return e.tag && e.tag.startsWith('po'); });
    var avgEnergy   = wbf.length ? (wbf.reduce(function(t,e){ return t+(e.energy||0); },0)/wbf.length).toFixed(1) : '—';
    var avgMood     = wbf.length ? (wbf.reduce(function(t,e){ return t+(e.mood||0); },0)/wbf.length).toFixed(1) : '—';
    var avgMotiv    = wbf.length ? (wbf.reduce(function(t,e){ return t+(e.motivation||0); },0)/wbf.length).toFixed(1) : '—';
    var wbChartData   = getByDay(wbf, 'date', function(e){ return e.energy||0; });
    var moodChartData = getByDay(wbf, 'date', function(e){ return e.mood||0; });

    // Helpers – normalizacja do 0-100
    function n10(v)   { return Math.round(Math.max(0,(v-1))/9*100); }       // skala 1-10 → 0-100%
    function nDoms(v) { return Math.round((5-Math.min(5,v||0))/5*100); }    // DOMS 0-5 odwrócone → 0-100%
    function nArr(arr, key) {
      var mx = Math.max.apply(null, arr.map(function(d){ return d[key]||0; })) || 1;
      return function(d){ return Math.round((d[key]||0)/mx*100); };
    }

    // Korelacja – treningi siłowe + samopoczucie PRZED (priorytet) lub z tego samego dnia
    var strCorrData = wf.map(function(w) {
      var pre = wellbeingEntries.find(function(e){ return e.date===w.date && e.tag && e.tag.startsWith('przed'); });
      var any = wellbeingEntries.find(function(e){ return e.date===w.date; });
      var wb = pre || any;
      if (!wb) return null;
      return { date:w.date, vol:w.volume||0, energy:wb.energy||5, motivation:wb.motivation||5, mood:wb.mood||5, doms:wb.doms||0 };
    }).filter(Boolean).sort(function(a,b){ return a.date.localeCompare(b.date); });

    var volNormFn  = nArr(strCorrData, 'vol');
    var strChart1 = strCorrData.length >= 2 ? [
      { label:'Wolumen', color:'var(--a)',     data: strCorrData.map(function(d){ return { label:ET.fmtDateShort(d.date), value:volNormFn(d) }; }) },
      { label:'Energia przed', color:'var(--yellow)', data: strCorrData.map(function(d){ return { label:ET.fmtDateShort(d.date), value:n10(d.energy) }; }) },
    ] : [];
    var strChart2 = strCorrData.length >= 2 ? [
      { label:'Chęć do treningu', color:'var(--purple)', data: strCorrData.map(function(d){ return { label:ET.fmtDateShort(d.date), value:n10(d.motivation) }; }) },
      { label:'Samopoczucie',     color:'var(--green)',  data: strCorrData.map(function(d){ return { label:ET.fmtDateShort(d.date), value:n10(d.mood) }; }) },
      { label:'Zmęczenie',        color:'var(--red)',    data: strCorrData.map(function(d){ return { label:ET.fmtDateShort(d.date), value:nDoms(d.doms) }; }) },
      { label:'Wolumen',          color:'var(--a)',      data: strCorrData.map(function(d){ return { label:ET.fmtDateShort(d.date), value:volNormFn(d) }; }) },
    ] : [];

    // Running Load = dystans × (tętno/150) × (prędkość/10) × (waga/70)
    var latestWeight = measurements.length ? (measurements[0].weight||70) : 70;
    function calcRunLoad(r) {
      var speed = r.duration > 0 ? r.distance/(r.duration/60) : 0;
      return r.distance * ((r.avgHr||150)/150) * (speed/10) * (latestWeight/70);
    }

    var runCorrData = rf.map(function(r) {
      var pre = wellbeingEntries.find(function(e){ return e.date===r.date && e.tag && e.tag.startsWith('przed'); });
      var any = wellbeingEntries.find(function(e){ return e.date===r.date; });
      var wb = pre || any;
      return { date:r.date, load:calcRunLoad(r), energy:wb?wb.energy||5:5, motivation:wb?wb.motivation||5:5, mood:wb?wb.mood||5:5, doms:wb?wb.doms||0:0, hasWb:!!wb };
    }).sort(function(a,b){ return a.date.localeCompare(b.date); });

    var loadNormFn = nArr(runCorrData, 'load');
    var runChart = runCorrData.length >= 2 ? [
      { label:'Chęć do treningu', color:'var(--purple)', data: runCorrData.map(function(d){ return { label:ET.fmtDateShort(d.date), value:n10(d.motivation) }; }) },
      { label:'Samopoczucie',     color:'var(--green)',  data: runCorrData.map(function(d){ return { label:ET.fmtDateShort(d.date), value:n10(d.mood) }; }) },
      { label:'Zmęczenie',        color:'var(--red)',    data: runCorrData.map(function(d){ return { label:ET.fmtDateShort(d.date), value:nDoms(d.doms) }; }) },
      { label:'Running Load',     color:'var(--teal)',   data: runCorrData.map(function(d){ return { label:ET.fmtDateShort(d.date), value:loadNormFn(d) }; }) },
    ] : [];

    // Legacy corrData (dla tabeli korelacji)
    var corrData = strCorrData.map(function(d){ return { date:d.date, volume:d.vol, energy:d.energy, mood:d.mood, motivation:d.motivation }; });

    // Siłowy – wszystkie unikalne nazwy ćwiczeń + dane per ćwiczenie
    var allExNames = (function() {
      var seen = {}, names = [];
      workouts.forEach(function(w){ (w.exercises||[]).forEach(function(e){ if (e.name && !seen[e.name]) { seen[e.name]=true; names.push(e.name); } }); });
      return names;
    })();
    function getExData(name) {
      return wf.filter(function(w){ return (w.exercises||[]).some(function(e){ return e.name===name && e.e1rm>0; }); })
        .map(function(w){
          var ex=(w.exercises||[]).find(function(e){ return e.name===name; });
          return ex && ex.e1rm>0 ? { label:ET.fmtDateShort(w.date), value:Math.round(ex.e1rm*10)/10 } : null;
        }).filter(Boolean).sort(function(a,b){ return a.label.localeCompare(b.label); });
    }

    // Sauna – gotowość do sauny jako MultiLineChart
    var saunaReadySeries = (function() {
      var sorted = sau.filter(function(s){ return s.readiness; }).sort(function(a,b){ return a.date.localeCompare(b.date); });
      if (sorted.length < 2) return [];
      function rd(s, key) { return Math.round(((s.readiness[key]||1)-1)/2*100); }
      return [
        { label:'Chęć',          color:'var(--a)',      data: sorted.map(function(s){ return { label:ET.fmtDateShort(s.date), value:rd(s,'willingness') }; }) },
        { label:'Samopoczucie',  color:'var(--green)',  data: sorted.map(function(s){ return { label:ET.fmtDateShort(s.date), value:rd(s,'state') }; }) },
        { label:'Brak zmęcz.',   color:'var(--orange)', data: sorted.map(function(s){ return { label:ET.fmtDateShort(s.date), value:rd(s,'fatigue') }; }) },
      ];
    })();

    // Samopoczucie – Energia / Sen / Nastrój – połączone daty
    var wbSleepChart = (function() {
      var dateSet = {}, maxSleep = 9;
      wbf.forEach(function(e){ if (!dateSet[e.date]) dateSet[e.date]={}; dateSet[e.date].energy=e.energy; dateSet[e.date].mood=e.mood; });
      sf.forEach(function(s){ if (!dateSet[s.date]) dateSet[s.date]={}; dateSet[s.date].sleep=s.duration; });
      var dates = Object.keys(dateSet).sort();
      if (dates.length < 2) return [];
      return [
        { label:'Energia',  color:'var(--yellow)', data: dates.map(function(d){ return { label:ET.fmtDateShort(d), value:dateSet[d].energy!=null?Math.round((dateSet[d].energy-1)/9*100):null }; }).filter(function(x){ return x.value!=null; }) },
        { label:'Nastrój',  color:'var(--green)',  data: dates.map(function(d){ return { label:ET.fmtDateShort(d), value:dateSet[d].mood!=null?Math.round((dateSet[d].mood-1)/9*100):null }; }).filter(function(x){ return x.value!=null; }) },
        { label:'Sen',      color:'var(--purple)', data: dates.map(function(d){ return { label:ET.fmtDateShort(d), value:dateSet[d].sleep!=null?Math.min(100,Math.round(dateSet[d].sleep/maxSleep*100)):null }; }).filter(function(x){ return x.value!=null; }) },
      ].filter(function(s){ return s.data.length >= 2; });
    })();

    // All-time summary (top header)
    var allVol = workouts.reduce(function(t,w){ return t+(w.volume||0); },0);
    var allKm  = runs.reduce(function(t,r){ return t+(r.distance||0); },0);
    var allAvgSleep = sleepSessions.length ? (sleepSessions.reduce(function(t,s){ return t+(s.duration||0); },0)/sleepSessions.length).toFixed(1) : '—';
    var allAvgRd = (function(){
      var r=sleepSessions.filter(function(s){ return s.readiness!=null; });
      return r.length ? Math.round(r.reduce(function(t,s){ return t+(s.readiness||0); },0)/r.length) : '—';
    })();

    var TABS = [
      { id:'strength',    label:'💪 Siłowy'      },
      { id:'running',     label:'🏃 Bieganie'     },
      { id:'sleep',       label:'😴 Sen'          },
      { id:'body',        label:'📏 Sylwetka'     },
      { id:'sauna',       label:'🔥 Sauna'        },
      { id:'wellbeing',   label:'🌡 Samopoczucie' },
      { id:'correlation', label:'📈 Korelacja'    },
      { id:'ai_coach',   label:'🤖 AI Coach'     },
    ];

    return _h('div', { className:'fade-in' },
      _h('div', { className:'page-hdr' },
        _h('h1', null, 'Statystyki'),
        _h('button', { className:'btn btn-ghost', style:{ fontSize:'.75rem', padding:'8px 12px' }, onClick:function(){ navigate('history'); } }, '📜 Historia')
      ),

      // All-time top row
      _h('div', { className:'grid-4', style:{ marginBottom:16 } },
        _h(ET.StatCard, { label:'Wolumen łącznie', value:allVol.toFixed(0)+' kg', color:'var(--a-light)' }),
        _h(ET.StatCard, { label:'Km przebiegniętych', value:allKm.toFixed(1)+' km', color:'var(--green)' }),
        _h(ET.StatCard, { label:'Śr. sen', value:allAvgSleep+'h', color:'var(--purple)' }),
        _h(ET.StatCard, { label:'Śr. gotowość', value:typeof allAvgRd==='number'?allAvgRd+'%':'—', color:'var(--orange)' })
      ),

      // ── Zakres ────────────────────────────────────────────────────────────
      _h('div', { style:{ display:'flex', alignItems:'center', gap:6, flexWrap:'wrap', marginBottom:14 } },
        _h('span', { style:{ fontSize:'.7rem', color:'var(--t3)', fontWeight:700 } }, 'Zakres:'),
        RANGES.map(function(r) {
          return _h('button', { key:r,
            onClick:function(){ setRange(r); },
            style:{
              padding:'5px 12px', borderRadius:20, fontSize:'.72rem', fontWeight:700, cursor:'pointer',
              border:'1px solid '+(range===r?'var(--a)':'var(--b1)'),
              background:range===r?'var(--a)':'var(--s3)',
              color:range===r?'white':'var(--t2)',
              transition:'all .12s'
            }
          }, r+'d');
        })
      ),

      // ── Tabs ──────────────────────────────────────────────────────────────
      _h('div', { style:{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:16 } },
        TABS.map(function(t) {
          return _h('button', { key:t.id, className:'tag-btn'+(activeTab===t.id?' active':''), onClick:function(){ setActiveTab(t.id); } }, t.label);
        })
      ),

      // ── SIŁOWY ────────────────────────────────────────────────────────────
      activeTab==='strength' && _h('div', { className:'fade-in' },
        _h('div', { className:'chart-wrap' },
          _h('div', { className:'chart-title' }, 'Wolumen tygodniowy (kg) — ostatnie '+range+'d'),
          wf.length > 0 ? _h(ET.BarChart, { data:volumeData, color:'var(--a)', unit:'kg' }) : _h('div', { style:{ color:'var(--t3)', fontSize:'.8rem' } }, 'Brak danych w tym zakresie')
        ),
        _h('div', { className:'grid-3', style:{ marginTop:10, marginBottom:14 } },
          _h(ET.StatCard, { label:'Treningi', value:wf.length, color:'var(--a-light)' }),
          _h(ET.StatCard, { label:'Wolumen', value:totalVol.toFixed(0)+' kg', color:'var(--green)' }),
          _h(ET.StatCard, { label:'Rekordy', value:wf.reduce(function(t,w){ return t+(w.prs&&w.prs.length||0); },0), color:'var(--yellow)' })
        ),
        allExNames.length > 0 && _h('div', { className:'card' },
          _h('div', { style:{ fontWeight:700, fontSize:'.88rem', marginBottom:8 } }, '📊 Progres ćwiczenia (est. 1RM kg)'),
          _h('div', { style:{ display:'flex', gap:4, flexWrap:'wrap', marginBottom:12 } },
            allExNames.map(function(name) {
              var sel = selExes.indexOf(name) !== -1;
              return _h('button', { key:name, className:'tag-btn'+(sel?' active':''),
                style:{ fontSize:'.6rem' },
                onClick:function(){ setSelExes(sel ? selExes.filter(function(n){ return n!==name; }) : selExes.concat([name])); }
              }, name);
            })
          ),
          selExes.length === 0 && _h('div', { style:{ fontSize:'.75rem', color:'var(--t3)', textAlign:'center', padding:'8px 0' } }, 'Wybierz ćwiczenie powyżej, aby zobaczyć trend 1RM'),
          selExes.map(function(name) {
            var d = getExData(name);
            return _h('div', { key:name, className:'chart-wrap', style:{ margin:'0 0 10px' } },
              _h('div', { className:'chart-title' }, name),
              d.length >= 2 ? _h(ET.LineChart, { data:d, color:'var(--a)', unit:'kg' })
                : _h('div', { style:{ color:'var(--t3)', fontSize:'.75rem', padding:'8px 0' } }, 'Za mało danych w wybranym zakresie')
            );
          })
        )
      ),

      // ── BIEGANIE ──────────────────────────────────────────────────────────
      activeTab==='running' && _h('div', { className:'fade-in' },
        _h('div', { className:'chart-wrap' },
          _h('div', { className:'chart-title' }, 'Dystans dzienny (km) — ostatnie '+range+'d'),
          rf.length > 1
            ? _h(ET.LineChart, { data:runLineData, color:'var(--green)' })
            : _h('div', { style:{ color:'var(--t3)', fontSize:'.8rem' } }, 'Za mało biegów w tym zakresie')
        ),
        _h('div', { className:'grid-3', style:{ marginTop:10, marginBottom:14 } },
          _h(ET.StatCard, { label:'Biegi', value:rf.length, color:'var(--green)' }),
          _h(ET.StatCard, { label:'Łączny dystans', value:totalKm.toFixed(1)+' km', color:'var(--a-light)' }),
          _h(ET.StatCard, { label:'Śr. dystans', value:rf.length?(totalKm/rf.length).toFixed(1)+' km':'—', color:'var(--teal)' })
        ),
        runChart.length > 0 && _h('div', { className:'card' },
          _h('div', { style:{ fontWeight:700, marginBottom:4, fontSize:'.9rem' } }, '📊 Samopoczucie vs Running Load'),
          _h('div', { style:{ fontSize:'.7rem', color:'var(--t3)', marginBottom:14 } },
            'Running Load = dystans × tętno × prędkość × masa ciała (waga: '+latestWeight+'kg). Wszystkie serie w skali 0–100%.'
          ),
          _h('div', { className:'chart-wrap', style:{ margin:0 } },
            _h(ET.MultiLineChart, { series:runChart, height:90 })
          )
        ),
        runChart.length === 0 && rf.length > 0 && _h('div', { className:'card', style:{ color:'var(--t3)', fontSize:'.78rem', textAlign:'center', padding:'16px' } },
          'Dodaj wpisy samopoczucia w dniach biegania, aby zobaczyć korelacje.'
        )
      ),

      // ── SEN ───────────────────────────────────────────────────────────────
      activeTab==='sleep' && _h('div', { className:'fade-in' },
        _h('div', { className:'chart-wrap' },
          _h('div', { className:'chart-title' }, 'Czas snu (h) — ostatnie '+range+'d'),
          sf.length > 1
            ? _h(ET.LineChart, { data:sleepData, color:'var(--purple)' })
            : _h('div', { style:{ color:'var(--t3)', fontSize:'.8rem' } }, 'Za mało danych')
        ),
        sf.length > 0 && _h('div', { className:'chart-wrap', style:{ marginTop:10 } },
          _h('div', { className:'chart-title' }, 'Gotowość do treningu (%)'),
          _h(ET.LineChart, { data:sf.filter(function(s){ return s.readiness!=null; }).map(function(s){ return { label:ET.fmtDateShort(s.date), value:s.readiness }; }), color:'var(--green)' })
        ),
        _h('div', { className:'grid-3', style:{ marginTop:10 } },
          _h(ET.StatCard, { label:'Wpisy snu', value:sf.length, color:'var(--purple)' }),
          _h(ET.StatCard, { label:'Śr. czas', value:avgSleep+'h', color:'var(--a-light)' }),
          _h(ET.StatCard, { label:'Śr. gotowość', value:typeof avgReadiness==='number'?avgReadiness+'%':'—', color:'var(--green)' })
        )
      ),

      // ── SYLWETKA ──────────────────────────────────────────────────────────
      activeTab==='body' && _h('div', { className:'fade-in' },
        measurements.length > 1 ? _h('div', { className:'chart-wrap' },
          _h('div', { className:'chart-title' }, 'Waga ciała (kg) — wszystkie pomiary'),
          _h(ET.LineChart, { data:weightData, color:'var(--a-light)' })
        ) : _h(ET.Placeholder, { icon:'📏', title:'Za mało pomiarów', desc:'Dodaj co najmniej 2 pomiary aby zobaczyć trend.' }),
        measurements.length > 0 && measurements[0] && _h('div', { className:'card', style:{ marginTop:10 } },
          _h('div', { style:{ fontSize:'.65rem', color:'var(--t3)', fontWeight:700, textTransform:'uppercase', marginBottom:10 } }, 'Ostatni pomiar'),
          _h('div', { className:'grid-4', style:{ gap:8 } },
            [['weight','Waga','kg'],['waist','Pas','cm'],['chest','Klatka','cm'],['bicep','Biceps','cm']].map(function(m){
              return measurements[0][m[0]] ? _h(ET.StatCard, { key:m[0], label:m[1], value:measurements[0][m[0]]+m[2], color:'var(--teal)' }) : null;
            })
          )
        )
      ),

      // ── SAUNA ─────────────────────────────────────────────────────────────
      activeTab==='sauna' && _h('div', { className:'fade-in' },
        _h('div', { className:'chart-wrap' },
          _h('div', { className:'chart-title' }, 'Czas sauny tygodniowo (min) — ostatnie '+range+'d'),
          sau.length > 0
            ? _h('div', null,
                _h(ET.BarChart, { data:saunaData, color:'var(--orange)', unit:'min' }),
                saunaReadySeries.length > 0 && _h('div', { style:{ marginTop:18 } },
                  _h('div', { style:{ fontSize:'.65rem', fontWeight:700, color:'var(--t3)', textTransform:'uppercase', letterSpacing:'.05em', marginBottom:8 } }, '🌡 Gotowość do sauny'),
                  _h('div', { style:{ fontSize:'.62rem', color:'var(--t3)', marginBottom:8 } }, '0% = bez chęci / słabo / b. zmęczony · 100% = pełna / świetnie / brak zmęczenia'),
                  _h(ET.MultiLineChart, { series:saunaReadySeries, height:80 })
                )
              )
            : _h('div', { style:{ color:'var(--t3)', fontSize:'.8rem' } }, 'Brak danych')
        ),
        _h('div', { className:'grid-3', style:{ marginTop:10 } },
          _h(ET.StatCard, { label:'Sesje', value:sau.length, color:'var(--orange)' }),
          _h(ET.StatCard, { label:'Łączny czas', value:totalSaunaMin+' min', color:'var(--red)' }),
          _h(ET.StatCard, { label:'Śr. temp.', value:sau.length?Math.round(sau.reduce(function(t,s){ return t+(s.temp||0); },0)/sau.length)+'°C':'—', color:'var(--yellow)' })
        )
      ),

      // ── SAMOPOCZUCIE ──────────────────────────────────────────────────────
      activeTab==='wellbeing' && _h('div', { className:'fade-in' },
        _h('div', { className:'grid-3', style:{ marginBottom:16 } },
          _h(ET.StatCard, { label:'Śr. energia', value:avgEnergy+'/10', color:'var(--yellow)' }),
          _h(ET.StatCard, { label:'Śr. nastrój', value:avgMood+'/10', color:'var(--green)' }),
          _h(ET.StatCard, { label:'Śr. motywacja', value:avgMotiv+'/10', color:'var(--purple)' })
        ),
        wbSleepChart.length > 0
          ? _h('div', { className:'card', style:{ marginBottom:14 } },
              _h('div', { style:{ fontWeight:700, fontSize:'.88rem', marginBottom:4 } }, '📊 Energia / Nastrój / Sen'),
              _h('div', { style:{ fontSize:'.7rem', color:'var(--t3)', marginBottom:12 } }, 'Sen: 9h = 100%. Energia i nastrój: skala 1–10 → 0–100%.'),
              _h(ET.MultiLineChart, { series:wbSleepChart, height:90 })
            )
          : _h(ET.Placeholder, { icon:'🌡', title:'Za mało danych', desc:'Uzupełniaj samopoczucie przy każdym treningu.' }),
        wbf.length > 1 && _h('div', null,
          _h('div', { className:'chart-wrap' },
            _h('div', { className:'chart-title' }, 'Energia — ostatnie '+range+'d'),
            _h(ET.LineChart, { data:wbChartData, color:'var(--yellow)', unit:'/10' })
          ),
          _h('div', { className:'chart-wrap', style:{ marginTop:10 } },
            _h('div', { className:'chart-title' }, 'Nastrój — ostatnie '+range+'d'),
            _h(ET.LineChart, { data:moodChartData, color:'var(--green)', unit:'/10' })
          )
        ),

        preEntries.length > 0 && _h('div', { className:'card', style:{ marginTop:14 } },
          _h('div', { style:{ fontWeight:700, marginBottom:10, fontSize:'.88rem', color:'var(--t2)' } }, '📊 Przed vs Po treningu'),
          _h('div', { className:'grid-3', style:{ gap:8 } },
            [
              { k:'energy', l:'Energia', c:'var(--yellow)' },
              { k:'mood',   l:'Nastrój', c:'var(--green)'  },
              { k:'stress', l:'Stres',   c:'var(--red)'    },
            ].map(function(sl) {
              var avgPre  = preEntries.length  ? (preEntries.reduce(function(t,e){ return t+(e[sl.k]||0); },0)/preEntries.length).toFixed(1)  : '—';
              var avgPost = postEntries.length ? (postEntries.reduce(function(t,e){ return t+(e[sl.k]||0); },0)/postEntries.length).toFixed(1) : '—';
              return _h('div', { key:sl.k, className:'card card-sm', style:{ textAlign:'center' } },
                _h('div', { style:{ fontSize:'.65rem', color:'var(--t3)', marginBottom:6 } }, sl.l),
                _h('div', { style:{ display:'flex', justifyContent:'space-around' } },
                  _h('div', null,
                    _h('div', { style:{ fontSize:'.9rem', fontWeight:700, color:sl.c } }, avgPre),
                    _h('div', { style:{ fontSize:'.55rem', color:'var(--t3)' } }, 'PRZED')
                  ),
                  _h('div', { style:{ color:'var(--t3)', alignSelf:'center' } }, '→'),
                  _h('div', null,
                    _h('div', { style:{ fontSize:'.9rem', fontWeight:700, color:sl.c } }, avgPost),
                    _h('div', { style:{ fontSize:'.55rem', color:'var(--t3)' } }, 'PO')
                  )
                )
              );
            })
          )
        )
      ),

      // ── KORELACJA ─────────────────────────────────────────────────────────
      activeTab==='correlation' && _h('div', { className:'fade-in' },
        strCorrData.length < 2
          ? _h(ET.Placeholder, { icon:'📈', title:'Za mało danych', desc:'Potrzeba co najmniej 2 treningi + pomiar samopoczucia w wybranym zakresie czasowym.' })
          : _h('div', null,

              _h('div', { className:'card', style:{ marginBottom:14 } },
                _h('div', { style:{ fontWeight:700, marginBottom:4, fontSize:'.9rem' } }, '💪 Wolumen + Energia przed treningiem'),
                _h('div', { style:{ fontSize:'.7rem', color:'var(--t3)', marginBottom:14 } }, 'Obie serie znormalizowane do 0–100% (względem maksimum w zakresie)'),
                _h('div', { className:'chart-wrap', style:{ margin:0 } },
                  _h(ET.MultiLineChart, { series:strChart1, height:90 })
                )
              ),

              _h('div', { className:'card', style:{ marginBottom:14 } },
                _h('div', { style:{ fontWeight:700, marginBottom:4, fontSize:'.9rem' } }, '🧠 Chęć / Samopoczucie / Zmęczenie + Wolumen'),
                _h('div', { style:{ fontSize:'.7rem', color:'var(--t3)', marginBottom:14 } }, '„Bez chęci / słabo / bardzo zmęczony" = 0% · „ujdzie / normalnie" = ~50% · „pełna / świetnie / brak zmęczenia" = 100%'),
                _h('div', { className:'chart-wrap', style:{ margin:0 } },
                  _h(ET.MultiLineChart, { series:strChart2, height:90 })
                )
              ),

              _h('div', { className:'card' },
                _h('div', {
                  style:{ display:'flex', justifyContent:'space-between', alignItems:'center', cursor:'pointer', userSelect:'none' },
                  onClick:function(){ setTableOpen(!tableOpen); }
                },
                  _h('div', { style:{ fontSize:'.65rem', color:'var(--t3)', fontWeight:700, textTransform:'uppercase', letterSpacing:'.06em' } }, 'Tabela korelacji'),
                  _h('div', { style:{ fontSize:'.75rem', color:'var(--t3)', transition:'transform .2s', transform:tableOpen?'rotate(180deg)':'rotate(0deg)' } }, '▾')
                ),
                tableOpen && _h('div', { style:{ marginTop:10 } },
                  corrData.slice().reverse().map(function(d, i) {
                    var energyColor = d.energy>=7?'var(--green)':d.energy>=4?'var(--yellow)':'var(--red)';
                    return _h('div', { key:i, style:{ display:'flex', alignItems:'center', gap:10, padding:'8px 0', borderBottom:'1px solid var(--b1)' } },
                      _h('div', { style:{ fontSize:'.72rem', color:'var(--t3)', minWidth:50 } }, ET.fmtDateShort(d.date)),
                      _h('div', { style:{ flex:1 } },
                        _h('div', { style:{ height:6, borderRadius:3, background:'var(--b1)', overflow:'hidden', marginBottom:3 } },
                          _h('div', { style:{ height:'100%', width:Math.min(100,(d.volume/2000*100))+'%', background:'var(--a)', borderRadius:3 } })
                        ),
                        _h('div', { style:{ fontSize:'.6rem', color:'var(--t3)' } }, d.volume.toFixed(0)+' kg wolumenu')
                      ),
                      _h('div', { style:{ textAlign:'center', minWidth:40 } },
                        _h('div', { style:{ fontSize:'.9rem', fontWeight:700, color:energyColor } }, d.energy),
                        _h('div', { style:{ fontSize:'.5rem', color:'var(--t3)' } }, 'energia')
                      ),
                      _h('div', { style:{ textAlign:'center', minWidth:40 } },
                        _h('div', { style:{ fontSize:'.9rem', fontWeight:700, color:'var(--green)' } }, d.mood),
                        _h('div', { style:{ fontSize:'.5rem', color:'var(--t3)' } }, 'nastrój')
                      )
                    );
                  })
                )
              )
            )
      ),

      // ── AI COACH ──────────────────────────────────────────────────────────
      activeTab==='ai_coach' && _h(AICoachReportTab, { store:store })
    );
  }

  var REPORT_TYPES = [
    { id:'weekly',          icon:'📅', label:'Raport tygodniowy',   desc:'Ostatnie 7 dni' },
    { id:'monthly',         icon:'📆', label:'Raport miesięczny',   desc:'Ostatnie 30 dni' },
    { id:'pre-competition', icon:'🏁', label:'Przed zawodami',      desc:'Gotowość i taper' },
    { id:'post-competition',icon:'🏅', label:'Po zawodach',         desc:'Protokół regeneracji' },
  ];

  function AICoachReportTab(props) {
    var store = props.store;
    var rt = React.useState(null); var reportType = rt[0]; var setReportType = rt[1];
    var report = reportType && typeof ET.AIEngine !== 'undefined' ? ET.AIEngine.report(reportType, store) : null;
    var typeColor = {positive:'var(--green)', warning:'var(--orange)', achievement:'var(--yellow)', info:'var(--a-light)'};

    return _h('div', { className:'fade-in' },
      _h('div', { className:'grid-2', style:{ gap:8, marginBottom:16 } },
        REPORT_TYPES.map(function(rt) {
          var active = reportType===rt.id;
          return _h('button', { key:rt.id,
            style:{ display:'flex', flexDirection:'column', alignItems:'flex-start', padding:'12px 14px', borderRadius:'var(--r2)', border:'1.5px solid '+(active?'var(--a)':'var(--b1)'), background:active?'rgba(99,102,241,.1)':'var(--s2)', cursor:'pointer', textAlign:'left', transition:'all .15s' },
            onClick:function(){ setReportType(active?null:rt.id); }
          },
            _h('div', { style:{ fontSize:'1.4rem', marginBottom:4 } }, rt.icon),
            _h('div', { style:{ fontWeight:700, fontSize:'.82rem', color:active?'var(--a-light)':'var(--t1)' } }, rt.label),
            _h('div', { style:{ fontSize:'.65rem', color:'var(--t3)', marginTop:2 } }, rt.desc)
          );
        })
      ),

      report && _h('div', { className:'fade-in' },

        _h('div', { className:'card', style:{ marginBottom:14 } },
          _h('div', { style:{ fontWeight:700, fontSize:'.95rem', marginBottom:3 } }, '🤖 '+report.title),
          _h('div', { style:{ fontSize:'.72rem', color:'var(--t3)', marginBottom:16 } }, report.period),
          _h('div', { className:'grid-4', style:{ gap:8 } },
            report.stats.map(function(s, i) {
              return _h('div', { key:i, style:{ textAlign:'center' } },
                _h('div', { style:{ fontSize:'1.2rem' } }, s.icon),
                _h('div', { style:{ fontWeight:700, fontSize:'.9rem', color:'var(--t1)', marginTop:4 } }, s.value),
                _h('div', { style:{ fontSize:'.58rem', color:'var(--t3)', marginTop:2 } }, s.label)
              );
            })
          )
        ),

        // Recovery
        report.recovery && (function() {
          var rec = report.recovery;
          var col = rec.score>=65?'var(--green)':rec.score>=45?'var(--yellow)':'var(--red)';
          return _h('div', { className:'card', style:{ marginBottom:14 } },
            _h('div', { style:{ display:'flex', gap:12, alignItems:'center', marginBottom:10 } },
              _h('div', { style:{ width:46, height:46, borderRadius:'50%', border:'3px solid '+col, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 } },
                _h('div', { style:{ fontWeight:700, fontSize:'.8rem', color:col } }, rec.score+'%')
              ),
              _h('div', null,
                _h('div', { style:{ fontWeight:700, fontSize:'.82rem' } }, '🔋 Regeneracja — '+rec.category),
                _h('div', { style:{ fontSize:'.72rem', color:'var(--t2)', marginTop:2 } }, rec.recommendation)
              )
            ),
            _h('div', { style:{ display:'flex', gap:5, flexWrap:'wrap' } },
              rec.factors.map(function(f,i){
                return _h('span', { key:i, style:{ fontSize:'.6rem', padding:'2px 7px', borderRadius:20, background:f.color+'22', color:f.color, fontWeight:600 } }, (f.value>0?'+':'')+f.value+' '+f.label);
              })
            )
          );
        })(),

        // Recommendations
        _h('div', { className:'card', style:{ marginBottom:14 } },
          _h('div', { style:{ fontWeight:700, marginBottom:10, fontSize:'.88rem' } }, '💡 Rekomendacje'),
          report.recommendations.map(function(r, i) {
            return _h('div', { key:i, style:{ display:'flex', gap:8, padding:'7px 0', borderBottom:i<report.recommendations.length-1?'1px solid var(--b1)':'none' } },
              _h('span', { style:{ color:'var(--a-light)', fontSize:'.85rem', flexShrink:0 } }, '→'),
              _h('div', { style:{ fontSize:'.78rem', color:'var(--t2)', lineHeight:1.5 } }, r)
            );
          })
        ),

        // Stagnation
        report.stagnation && report.stagnation.plateaus.length>0 && _h('div', { className:'card', style:{ marginBottom:14 } },
          _h('div', { style:{ fontWeight:700, marginBottom:10, fontSize:'.88rem' } }, '⚠️ Stagnacja'),
          report.stagnation.plateaus.slice(0,5).map(function(p, i, arr) {
            return _h('div', { key:i, style:{ display:'flex', justifyContent:'space-between', padding:'6px 0', borderBottom:i<arr.length-1?'1px solid var(--b1)':'none', fontSize:'.78rem' } },
              _h('span', { style:{ color:'var(--t2)' } }, p.name),
              _h('span', { style:{ color:'var(--orange)', fontWeight:700 } }, p.weight+'kg · '+p.days+'d')
            );
          })
        ),

        // Correlations
        report.correlations && report.correlations.length>0 && _h('div', { className:'card', style:{ marginBottom:14 } },
          _h('div', { style:{ fontWeight:700, marginBottom:10, fontSize:'.88rem' } }, '🔗 Korelacje'),
          report.correlations.map(function(c, i) {
            return _h('div', { key:i, style:{ padding:'8px 0', borderBottom:i<report.correlations.length-1?'1px solid var(--b1)':'none' } },
              _h('div', { style:{ fontWeight:700, fontSize:'.78rem', marginBottom:3 } }, c.icon+' '+c.title),
              _h('div', { style:{ fontSize:'.7rem', color:'var(--t2)', lineHeight:1.5 } }, c.body)
            );
          })
        ),

        // Running predictions
        report.runPredictions && _h('div', { className:'card', style:{ marginBottom:14 } },
          _h('div', { style:{ fontWeight:700, marginBottom:12, fontSize:'.88rem' } }, '🏅 Szacowane czasy wyścigów'),
          _h('div', { className:'grid-4', style:{ gap:8 } },
            [['5km',report.runPredictions['5km']],['10km',report.runPredictions['10km']],['HM',report.runPredictions['HM']],['M',report.runPredictions['M']]].map(function(pair) {
              return _h('div', { key:pair[0], style:{ textAlign:'center' } },
                _h('div', { style:{ fontSize:'.6rem', color:'var(--t3)', marginBottom:4 } }, pair[0]),
                _h('div', { style:{ fontWeight:700, fontSize:'.8rem', color:'var(--green)' } }, pair[1])
              );
            })
          )
        )
      )
    );
  }

  ET.StatisticsModule = StatisticsModule;
})();
