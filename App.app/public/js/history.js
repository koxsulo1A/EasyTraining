(function() {
  'use strict';
  window.ET = window.ET || {};
  var _h = React.createElement;

  // Pure state transform — appends an entry to the app change log (capped at 200).
  // Usage inside update(): next = ET.logChange(next, { section, title, desc })
  ET.logChange = function(state, entry) {
    var rec = {
      id: Date.now() + Math.floor(Math.random()*1000),
      date: ET.dstr(),
      ts: Date.now(),
      section: entry.section || '',
      title: entry.title || 'Zmiana',
      desc: entry.desc || ''
    };
    return Object.assign({}, state, { changeLog: [rec].concat(state.changeLog||[]).slice(0, 200) });
  };

  var TYPE_CONFIG = {
    workout:  { icon:'💪', color:'var(--a)',      label:'Trening',      badge:'badge-blue'   },
    run:      { icon:'🏃', color:'var(--green)',  label:'Bieganie',     badge:'badge-green'  },
    sleep:    { icon:'😴', color:'var(--purple)', label:'Sen',          badge:'badge-purple' },
    sauna:    { icon:'🔥', color:'var(--orange)', label:'Sauna',        badge:'badge-orange' },
    measurement:{ icon:'📏', color:'var(--teal)', label:'Pomiary',     badge:'badge-teal'   },
    diet:     { icon:'🥗', color:'var(--yellow)', label:'Dieta',       badge:'badge-yellow' },
    wellbeing:{ icon:'🌡', color:'var(--pink)',   label:'Samopoczucie', badge:'badge-pink'   },
    pain:     { icon:'🩹', color:'var(--red)',    label:'Ból',          badge:'badge-red'    },
    competition:{ icon:'🏆', color:'var(--yellow)','label':'Zawody',   badge:'badge-yellow' },
    interval:  { icon:'⏱', color:'var(--red)',    label:'Interwały',   badge:'badge-red'    },
    journal:   { icon:'📓', color:'var(--teal)',   label:'Dziennik',    badge:'badge-teal'   },
    change:    { icon:'✏️', color:'var(--a-light)', label:'Zmiany',     badge:'badge-blue'   },
  };

  function entryDesc(type, data) {
    if (type==='workout') return data.name+' · '+(data.volume||0).toFixed(0)+' kg · '+Math.round((data.duration||0)/60000)+' min';
    if (type==='run') return data.distance+'km · Tempo '+data.pace+'/km · '+data.duration+' min';
    if (type==='sleep') return data.duration+'h · Jakość '+data.quality+'/10'+(data.readiness!=null?' · Got. '+data.readiness+'%':'');
    if (type==='sauna') return data.duration+'min · '+data.temp+'°C'+(data.rounds>1?' · '+data.rounds+' rundy':'');
    if (type==='measurement') return 'Waga: '+(data.weight||'—')+'kg'+(data.waist?' · Pas: '+data.waist+'cm':'');
    if (type==='diet') return data.kcal+' kcal · '+data.protein+'g białka';
    if (type==='wellbeing') return 'Energia '+data.energy+'/10 · Nastrój '+data.mood+'/10 · Stres '+data.stress+'/10';
    if (type==='pain') return data.bodyPart+' · '+data.level+'/10';
    if (type==='competition') return data.name+(data.status==='completed'&&data.result?' · Miejsce: '+(data.result.place||'—'):'');
    if (type==='interval') return (data.mode||'custom').toUpperCase()+' · '+data.rounds+' rund · '+Math.floor((data.duration||0)/60)+'min';
    if (type==='journal') return (data.title||'(bez tytułu)')+(data.mood?' · Nastrój '+'★'.repeat(data.mood):'');
    if (type==='change') return data.title+(data.desc?' — '+data.desc:'');
    return '';
  }

  var MEAS_LABELS = { weight:['Waga','kg'], neck:['Szyja','cm'], chest:['Klatka','cm'], waist:['Pas','cm'], hips:['Biodra','cm'], bicep:['Biceps','cm'], forearm:['Przedramię','cm'], thigh:['Udo','cm'], calf:['Łydka','cm'] };

  // Detail rows for the expanded tile
  function detailRows(type, data) {
    var rows = [];
    function r(l, v) { if (v!==undefined && v!==null && v!=='') rows.push([l, String(v)]); }
    if (type==='run') {
      r('Dystans', data.distance+' km'); r('Czas', data.duration+' min'); r('Tempo', data.pace+' /km');
      r('Typ', data.type); r('Śr. tętno', data.avgHr ? data.avgHr+' bpm' : null);
      r('Przewyższenie', data.elevation ? data.elevation+' m' : null); r('Notatki', data.notes);
    } else if (type==='sleep') {
      r('Zaśnięcie', data.bedtime); r('Pobudka', data.waketime); r('Czas snu', data.duration+' h');
      r('Jakość', data.quality+'/10'); r('Przebudzenia', data.wakeups); r('Notatki', data.notes);
    } else if (type==='sauna') {
      r('Czas', data.duration+' min'); r('Temperatura', data.temp+'°C'); r('Rundy', data.rounds);
      r('Tętno po', data.hrAfter ? data.hrAfter+' bpm' : null); r('Samopoczucie', data.feeling ? data.feeling+'/10' : null); r('Notatki', data.notes);
    } else if (type==='measurement') {
      Object.keys(MEAS_LABELS).forEach(function(k){ if (data[k]!=null) r(MEAS_LABELS[k][0], data[k]+' '+MEAS_LABELS[k][1]); });
      if (data.photos && Object.keys(data.photos).length) r('Zdjęcia', Object.keys(data.photos).length+' szt.');
    } else if (type==='pain') {
      r('Miejsce', data.bodyPart); r('Typ', data.type); r('Intensywność', data.level+'/10');
      r('Czas trwania', data.duration); r('Notatki', data.notes);
    } else if (type==='wellbeing') {
      r('Energia', data.energy+'/10'); r('Nastrój', data.mood+'/10'); r('Stres', data.stress+'/10');
      r('DOMS', data.doms!=null ? data.doms+'/10' : null); r('Motywacja', data.motivation!=null ? data.motivation+'/10' : null); r('Notatki', data.notes);
    } else if (type==='diet') {
      r('Kalorie', data.kcal+' kcal'); r('Białko', data.protein+' g'); r('Węglowodany', data.carbs ? data.carbs+' g' : null); r('Tłuszcze', data.fat ? data.fat+' g' : null);
    } else if (type==='change') {
      r('Sekcja', data.section); r('Opis', data.desc);
      if (data.ts) r('Godzina', new Date(data.ts).toLocaleTimeString('pl-PL', { hour:'2-digit', minute:'2-digit' }));
    } else if (type==='interval') {
      r('Tryb', (data.mode||'').toUpperCase()); r('Rundy', data.rounds); r('Czas', Math.floor((data.duration||0)/60)+' min');
    } else if (type==='journal') {
      r('Tytuł', data.title); r('Treść', (data.body||'').slice(0,200));
    } else {
      Object.keys(data).forEach(function(k) {
        if (k==='id'||k==='date') return;
        var v = data[k];
        if (v==null || typeof v==='object' || typeof v==='function') return;
        r(k, v);
      });
    }
    return rows;
  }

  function WorkoutDetails(data) {
    return _h('div', null,
      _h('div', { style:{ display:'flex', gap:10, flexWrap:'wrap', marginBottom:8, fontSize:'.72rem', color:'var(--t2)' } },
        _h('span', null, '⏱ '+Math.round((data.duration||0)/60000)+' min'),
        _h('span', null, '🏋️ '+(data.volume||0).toFixed(0)+' kg objętości'),
        _h('span', null, '🔁 '+(data.totalReps||0)+' powtórzeń'),
        (data.prs||[]).length>0 && _h('span', { style:{ color:'var(--yellow)' } }, '🏆 '+data.prs.length+' PR')
      ),
      (data.exercises||[]).map(function(ex, i) {
        var sets = (ex.setsData||[]).filter(function(s){ return s.done; });
        return _h('div', { key:i, style:{ padding:'6px 0', borderTop:'1px solid var(--b1)' } },
          _h('div', { style:{ fontWeight:600, fontSize:'.78rem', marginBottom:3 } }, ex.name,
            ex.e1rm>0 && _h('span', { style:{ fontSize:'.65rem', color:'var(--a-light)', marginLeft:6 } }, 'e1RM: '+ex.e1rm.toFixed(0)+' kg')),
          _h('div', { style:{ fontSize:'.7rem', color:'var(--t2)' } },
            sets.length===0 ? 'brak ukończonych serii'
              : sets.map(function(s){ return (s.reps||0)+'×'+(s.weight||0)+'kg'; }).join(' · '))
        );
      })
    );
  }

  function HistoryModule() {
    var su = ET.useStore(); var store = su.store;
    var nav = ET.useNav(); var navigate = nav.navigate;
    var tf = React.useState('all'); var typeFilter = tf[0], setTypeFilter = tf[1];
    var limit = React.useState(30); var pageLimit = limit[0], setPageLimit = limit[1];
    var ex = React.useState(null); var expandedKey = ex[0], setExpandedKey = ex[1];

    var all = [];
    function add(arr, type) {
      (arr||[]).forEach(function(e) {
        var dateKey = e.date || (e.startTime?new Date(e.startTime).toISOString().slice(0,10):null);
        if (dateKey) all.push({ id:e.id, type:type, date:dateKey, data:e });
      });
    }
    add(store.workouts, 'workout');
    add(store.runs, 'run');
    add(store.sleepSessions, 'sleep');
    add(store.saunaSessions, 'sauna');
    add(store.measurements, 'measurement');
    add(store.dietEntries, 'diet');
    add(store.wellbeingEntries, 'wellbeing');
    add(store.painEntries, 'pain');
    add(store.competitions, 'competition');
    add(store.intervals, 'interval');
    add(store.journalEntries, 'journal');
    add(store.changeLog, 'change');

    all.sort(function(a,b){
      if (a.date !== b.date) return a.date>b.date?-1:1;
      var ta = a.data.ts||a.data.id||0, tb = b.data.ts||b.data.id||0;
      return tb-ta;
    });

    var filtered = typeFilter==='all' ? all : all.filter(function(e){ return e.type===typeFilter; });
    var shown = filtered.slice(0, pageLimit);

    var FILTERS = [{ id:'all', label:'Wszystko' }].concat(
      Object.keys(TYPE_CONFIG).map(function(k){ return { id:k, label:TYPE_CONFIG[k].icon+' '+TYPE_CONFIG[k].label }; })
    );

    var ROUTES = { workout:'strength', run:'running', sleep:'sleep', sauna:'sauna', measurement:'measurements', diet:'diet', wellbeing:'wellbeing', pain:'pain', competition:'competitions', interval:'intervals', journal:'journal', change:null };

    return _h('div', { className:'fade-in' },
      _h('div', { className:'page-hdr' },
        _h('div', { style:{ display:'flex', alignItems:'center', gap:10 } },
          _h('button', { className:'btn btn-ghost btn-sm btn-icon', onClick:function(){ navigate('statistics'); } }, '←'),
          _h('div', null,
            _h('h1', null, 'Historia'),
            _h('p', null, all.length+' aktywności łącznie')
          )
        ),
        _h('div', null)
      ),

      _h('div', { style:{ display:'flex', gap:5, flexWrap:'wrap', marginBottom:14 } },
        FILTERS.map(function(f) {
          return _h('button', { key:f.id, className:'tag-btn'+(typeFilter===f.id?' active':''), onClick:function(){ setTypeFilter(f.id); setPageLimit(30); setExpandedKey(null); } }, f.label);
        })
      ),

      all.length===0 && _h(ET.Placeholder, { icon:'📜', title:'Brak historii', desc:'Zacznij logować treningi, sen i inne aktywności.' }),

      shown.length>0 && _h('div', null,
        shown.map(function(item, idx) {
          var tc = TYPE_CONFIG[item.type]||TYPE_CONFIG.workout;
          var isLast = idx===shown.length-1;
          var key = item.type+'_'+item.id;
          var isExpanded = expandedKey === key;
          return _h('div', { key:key, className:'timeline-item', style:{ position:'relative' } },
            !isLast && _h('div', { className:'timeline-line', style:{ left:4, top:14, bottom:-12, width:2, background:'var(--b1)', position:'absolute' } }),
            _h('div', { className:'timeline-dot', style:{ background:tc.color, marginTop:5, flexShrink:0 } }),
            _h('div', { className:'timeline-content', style:{ background:'var(--s2)', border:'1px solid '+(isExpanded?tc.color:'var(--b1)'), borderRadius:'var(--r2)', padding:'10px 12px', cursor:'pointer', transition:'border-color .15s' }, onClick:function(){ setExpandedKey(isExpanded?null:key); } },
              _h('div', { style:{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:8, flexWrap:'wrap' } },
                _h('div', { style:{ flex:1 } },
                  _h('div', { style:{ display:'flex', alignItems:'center', gap:6, marginBottom:4 } },
                    _h('span', null, tc.icon),
                    _h('span', { style:{ fontWeight:700, fontSize:'.85rem' } }, tc.label),
                    _h('span', { style:{ fontSize:'.6rem', color:'var(--t3)' } }, isExpanded?'▲':'▼')
                  ),
                  _h('div', { style:{ fontSize:'.78rem', color:'var(--t2)', lineHeight:1.4 } }, entryDesc(item.type, item.data))
                ),
                _h('div', { style:{ fontSize:'.65rem', color:'var(--t3)', whiteSpace:'nowrap', flexShrink:0 } }, ET.fmtDateShort(item.date))
              ),

              // Expanded details
              isExpanded && _h('div', { style:{ marginTop:10, paddingTop:8, borderTop:'1px solid var(--b1)' }, onClick:function(e){ e.stopPropagation(); } },
                item.type==='workout'
                  ? WorkoutDetails(item.data)
                  : _h('div', { style:{ display:'grid', gridTemplateColumns:'auto 1fr', gap:'4px 14px' } },
                      detailRows(item.type, item.data).map(function(row, i) {
                        return [
                          _h('div', { key:'l'+i, style:{ fontSize:'.68rem', color:'var(--t3)', fontWeight:600 } }, row[0]),
                          _h('div', { key:'v'+i, style:{ fontSize:'.72rem', color:'var(--t1)' } }, row[1])
                        ];
                      })
                    ),
                ROUTES[item.type] && _h('button', {
                  className:'btn btn-ghost btn-sm', style:{ marginTop:10, fontSize:'.7rem' },
                  onClick:function(e){ e.stopPropagation(); navigate(ROUTES[item.type]); }
                }, 'Przejdź do sekcji →')
              )
            )
          );
        }),
        filtered.length>pageLimit && _h('div', { style:{ textAlign:'center', marginTop:16 } },
          _h('button', { className:'btn btn-secondary', onClick:function(){ setPageLimit(function(l){ return l+30; }); } }, 'Pokaż więcej ('+filtered.length+' łącznie)')
        )
      )
    );
  }

  ET.HistoryModule = HistoryModule;
})();
