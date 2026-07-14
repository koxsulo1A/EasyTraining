(function() {
  'use strict';
  window.ET = window.ET || {};
  var _h = React.createElement;

  var TERM_CONFIG = {
    short:  { label:'Krótki',   color:'var(--green)',  desc:'< 4 tygodnie' },
    medium: { label:'Średni',   color:'var(--a)',      desc:'1-6 miesięcy' },
    long:   { label:'Długi',    color:'var(--purple)', desc:'6+ miesięcy'  },
  };

  // Plany treningowe (muszą pokrywać się z ID z strength.js)
  var WORKOUT_PLAN_OPTS = [
    { id:'pon_gora_sila',  label:'💪 Góra / Siła',       day:'Pon' },
    { id:'sr_dol_core',    label:'🦵 Dół + Core',         day:'Śr'  },
    { id:'pt_gora_hiper',  label:'🏋️ Góra / Hipertrofia', day:'Pt'  },
    { id:'nd_fullbody',    label:'⚡ FullBody',            day:'Nd'  },
    { id:'running',        label:'🏃 Bieganie',            day:''    },
    { id:'sauna',          label:'🔥 Sauna',               day:''    },
  ];

  // Automatic goal linking — progress updates after saving a workout/run/sauna
  var LINK_OPTS = [
    { id:'none',     label:'Ręcznie',      unit:''    },
    { id:'exercise', label:'🏋️ Ćwiczenie', unit:'kg'  },
    { id:'running',  label:'🏃 Bieganie',   unit:'km'  },
    { id:'sauna',    label:'🔥 Sauna',      unit:'min' },
  ];

  // Pure state transform: called inside update() after saving a session.
  // kind: 'workout' | 'run' | 'sauna'
  function syncGoals(s, kind, payload) {
    var goals = s.goals || [];
    if (!goals.length) return s;
    var changed = [];
    var next = goals.map(function(g) {
      if (!g.linkType || g.linkType === 'none') return g;
      var target = parseFloat(g.target);
      if (!target || target <= 0) return g;
      var val = null;
      if (g.linkType === 'exercise' && kind === 'workout') {
        var exName = (g.exercise||'').trim().toLowerCase();
        if (!exName) return g;
        (payload.exercises||[]).forEach(function(ex) {
          if ((ex.name||'').trim().toLowerCase() === exName) {
            (ex.setsData||[]).forEach(function(st) {
              if (st.done && st.weight != null) val = Math.max(val||0, st.weight);
            });
          }
        });
      } else if (g.linkType === 'running' && kind === 'run') {
        val = parseFloat(payload.distance) || null;
      } else if (g.linkType === 'sauna' && kind === 'sauna') {
        val = parseFloat(payload.duration) || null;
      }
      if (val == null) return g;
      var pct = Math.min(100, Math.round(val / target * 100));
      var curBest = g.current != null ? g.current : 0;
      if (val <= curBest && pct <= (g.progress||0)) return g;
      var ng = Object.assign({}, g, {
        current: Math.max(val, curBest),
        progress: Math.max(pct, g.progress||0)
      });
      changed.push(ng);
      return ng;
    });
    if (!changed.length) return s;
    var out = Object.assign({}, s, { goals:next });
    if (ET.logChange) changed.forEach(function(g) {
      out = ET.logChange(out, { section:'goals', title:'Cel zaktualizowany: '+g.title,
        desc:'Postęp '+g.progress+'% ('+g.current+(g.unit?' '+g.unit:'')+' / '+g.target+(g.unit?' '+g.unit:'')+')' });
    });
    return out;
  }
  ET.syncGoals = syncGoals;

  function GoalsModule() {
    var su = ET.useStore(); var store = su.store, update = su.update;
    var toast = ET.useToast();
    var sa = React.useState(false); var showAdd = sa[0], setShowAdd = sa[1];
    var se = React.useState(null); var editGoal = se[0], setEditGoal = se[1];

    var emptyForm = { title:'', term:'medium', target:'', unit:'', deadline:'', progress:0, workouts:[], linkType:'none', exercise:'' };
    var fs = React.useState(emptyForm);
    var f = fs[0], setF = fs[1];
    function upF(key, val) { setF(function(prev){ var o={}; o[key]=val; return Object.assign({},prev,o); }); }
    function toggleWorkout(id) {
      var ws = f.workouts || [];
      upF('workouts', ws.indexOf(id)!==-1 ? ws.filter(function(w){ return w!==id; }) : ws.concat([id]));
    }

    var tf = React.useState('all'); var termFilter = tf[0], setTermFilter = tf[1];
    var goals = store.goals||[];

    var ep = React.useState(false); var showExPicker = ep[0], setShowExPicker = ep[1];

    // Ćwiczenia do wyboru: historia treningów + pełna biblioteka
    var allExerciseNames = [];
    (store.workouts||[]).forEach(function(w){ (w.exercises||[]).forEach(function(ex){
      if (ex.name && allExerciseNames.indexOf(ex.name)===-1) allExerciseNames.push(ex.name);
    }); });
    (ET.EXERCISES_BASIC||[]).forEach(function(ex){
      if (ex.name && allExerciseNames.indexOf(ex.name)===-1) allExerciseNames.push(ex.name);
    });

    function save() {
      if (!f.title) { toast('Podaj nazwę celu', 'error'); return; }
      if (f.linkType==='exercise' && !(f.exercise||'').trim()) { toast('Podaj nazwę ćwiczenia do śledzenia', 'error'); return; }
      if (editGoal) {
        update(function(s){
          var next = Object.assign({},s,{ goals:(s.goals||[]).map(function(g){ return g.id===editGoal?Object.assign({},g,f):g; }) });
          if (ET.logChange) next = ET.logChange(next, { section:'goals', title:'Edycja celu: '+f.title, desc:'Zmieniono parametry celu' });
          return next;
        });
        toast('Cel zaktualizowany ✓', 'success');
        setEditGoal(null);
      } else {
        update(function(s){ return Object.assign({},s,{ goals:(s.goals||[]).concat([Object.assign({id:Date.now()},f)]) }); });
        toast('Cel dodany ✓', 'success');
      }
      setShowAdd(false);
      setF(emptyForm);
    }

    function openEdit(g) {
      setF(Object.assign({}, emptyForm, g));
      setEditGoal(g.id);
      setShowAdd(true);
    }

    function openNew() {
      setF(emptyForm);
      setEditGoal(null);
      setShowAdd(true);
    }

    function removeGoal(id) {
      update(function(s){ return Object.assign({},s,{ goals:(s.goals||[]).filter(function(g){ return g.id!==id; }) }); });
    }

    function setProgress(id, val) {
      update(function(s){ return Object.assign({},s,{ goals:(s.goals||[]).map(function(g){ return g.id===id?Object.assign({},g,{progress:val}):g; }) }); });
    }

    var filtered = termFilter==='all' ? goals : goals.filter(function(g){ return g.term===termFilter; });
    var active = filtered.filter(function(g){ return g.progress<100; });
    var done   = filtered.filter(function(g){ return g.progress>=100; });

    return _h('div', { className:'fade-in' },
      _h('div', { className:'page-hdr' },
        _h('div', null,
          _h('h1', null, '🎯 Cele'),
          _h('p', null, active.length+' aktywnych · '+done.length+' ukończonych')
        ),
        _h('button', { className:'btn btn-primary', onClick:openNew }, '+ Nowy cel')
      ),

      goals.length>0 && _h('div', { className:'grid-3', style:{ marginBottom:16 } },
        Object.keys(TERM_CONFIG).map(function(term) {
          var tc = TERM_CONFIG[term];
          var cnt = goals.filter(function(g){ return g.term===term&&g.progress<100; }).length;
          return _h('div', { key:term, className:'card card-sm', style:{ textAlign:'center', cursor:'pointer', borderColor:termFilter===term?tc.color:'var(--b1)' }, onClick:function(){ setTermFilter(termFilter===term?'all':term); } },
            _h('div', { style:{ fontSize:'1.2rem', fontWeight:700, color:tc.color } }, cnt),
            _h('div', { style:{ fontSize:'.62rem', color:'var(--t3)', marginTop:2 } }, tc.label)
          );
        })
      ),

      goals.length===0 && _h(ET.Placeholder, { icon:'🎯', title:'Brak celów', desc:'Ustaw cele i przypisz je do konkretnych treningów.' }),

      active.length>0 && _h('div', { style:{ marginBottom:16 } },
        _h('div', { className:'section-hdr' }, _h('h2', null, 'W trakcie')),
        active.map(function(g) {
          var tc = TERM_CONFIG[g.term]||TERM_CONFIG.medium;
          var planLabels = (g.workouts||[]).map(function(wid){ var opt = WORKOUT_PLAN_OPTS.find(function(o){ return o.id===wid; }); return opt?opt.label:wid; });
          return _h('div', { key:g.id, className:'card', style:{ marginBottom:10 } },
            _h('div', { style:{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:10 } },
              _h('div', { style:{ flex:1 } },
                _h('div', { style:{ fontWeight:700, fontSize:'.95rem', marginBottom:4 } }, g.title),
                _h('div', { style:{ display:'flex', gap:6, flexWrap:'wrap', marginBottom: planLabels.length?6:0 } },
                  _h('span', { className:'badge', style:{ background:tc.color+'22', color:tc.color } }, tc.label),
                  g.target && _h('span', { className:'chip', style:{ fontSize:'.65rem' } }, 'Cel: '+g.target+' '+g.unit),
                  g.current!=null && _h('span', { className:'chip', style:{ fontSize:'.65rem', color:'var(--green)' } }, 'Aktualnie: '+g.current+(g.unit?' '+g.unit:'')),
                  g.linkType && g.linkType!=='none' && _h('span', { className:'chip', style:{ fontSize:'.6rem', color:'var(--a-light)' } }, '🤖 auto'),
                  g.deadline && _h('span', { className:'chip', style:{ fontSize:'.65rem' } }, '📅 '+ET.fmtDateShort(g.deadline))
                ),
                planLabels.length>0 && _h('div', { style:{ display:'flex', gap:4, flexWrap:'wrap' } },
                  planLabels.map(function(l,i){ return _h('span', { key:i, className:'chip', style:{ fontSize:'.6rem', color:'var(--a-light)' } }, l); })
                )
              ),
              _h('div', { style:{ display:'flex', alignItems:'center', gap:6 } },
                _h('div', { style:{ fontSize:'1.3rem', fontWeight:700, color:tc.color } }, g.progress+'%'),
                _h('button', { className:'btn btn-ghost btn-sm btn-icon', onClick:function(){ openEdit(g); } }, '✏️'),
                _h('button', { className:'btn btn-ghost btn-sm btn-icon', style:{ color:'var(--red)' }, onClick:function(){ removeGoal(g.id); } }, '✕')
              )
            ),
            _h(ET.ProgressBar, { value:g.progress, color:tc.color }),
            _h('div', { className:'slider-wrap', style:{ marginTop:8 } },
              _h('input', { type:'range', min:0, max:100, value:g.progress, onChange:function(e){ setProgress(g.id,+e.target.value); } })
            ),
            typeof ET.AIEngine !== 'undefined' && (function() {
              var pred = ET.AIEngine.predictGoal(g, store);
              if (!pred) return null;
              if (!pred.possible) return _h('div', { style:{ fontSize:'.68rem', color:'var(--t3)', marginTop:8, padding:'5px 10px', borderRadius:'var(--r2)', background:'var(--s3)', display:'flex', gap:6 } },
                _h('span', null, '🤖'),
                _h('span', { style:{ color:'var(--orange)' } }, pred.reason)
              );
              if (pred.weeksLeft===0) return _h('div', { style:{ fontSize:'.68rem', color:'var(--green)', marginTop:8, padding:'5px 10px', borderRadius:'var(--r2)', background:'rgba(34,197,94,.08)' } }, '🤖 Cel osiągnięty!');
              return _h('div', { style:{ marginTop:8, padding:'8px 10px', borderRadius:'var(--r2)', background:'rgba(99,102,241,.07)', border:'1px solid rgba(99,102,241,.2)' } },
                _h('div', { style:{ display:'flex', justifyContent:'space-between', alignItems:'center' } },
                  _h('div', null,
                    _h('div', { style:{ fontSize:'.65rem', color:'var(--t3)', fontWeight:700, textTransform:'uppercase', letterSpacing:'.04em' } }, '🤖 Przewidywany termin AI'),
                    _h('div', { style:{ fontWeight:700, fontSize:'.82rem', color:'var(--a-light)', marginTop:2 } }, pred.estimatedDate),
                    pred.weeklyGain && _h('div', { style:{ fontSize:'.62rem', color:'var(--t3)', marginTop:2 } }, 'Tempo: '+pred.weeklyGain+' · Pewność: '+pred.confidence)
                  ),
                  _h('div', { style:{ textAlign:'center', padding:'6px 10px', borderRadius:'var(--r2)', background:'var(--a)' } },
                    _h('div', { style:{ fontSize:'.7rem', fontWeight:700, color:'white' } }, pred.weeksLeft+'tyg.'),
                    _h('div', { style:{ fontSize:'.5rem', color:'rgba(255,255,255,.7)' } }, 'zostało')
                  )
                )
              );
            })()
          );
        })
      ),

      done.length>0 && _h('div', null,
        _h('div', { className:'section-hdr' }, _h('h2', null, '✅ Ukończone')),
        done.map(function(g) {
          var tc = TERM_CONFIG[g.term]||TERM_CONFIG.medium;
          return _h('div', { key:g.id, className:'card card-sm', style:{ marginBottom:6, opacity:.7, display:'flex', justifyContent:'space-between', alignItems:'center' } },
            _h('div', null,
              _h('div', { style:{ fontWeight:600, fontSize:'.85rem', textDecoration:'line-through', color:'var(--t2)' } }, g.title),
              g.target && _h('div', { style:{ fontSize:'.7rem', color:'var(--t3)' } }, g.target+' '+g.unit)
            ),
            _h('div', { style:{ display:'flex', gap:6, alignItems:'center' } },
              _h('div', { className:'badge badge-green' }, '✓ 100%'),
              _h('button', { className:'btn btn-ghost btn-sm btn-icon', onClick:function(){ openEdit(g); } }, '✏️'),
              _h('button', { className:'btn btn-ghost btn-sm btn-icon', style:{ color:'var(--red)' }, onClick:function(){ removeGoal(g.id); } }, '✕')
            )
          );
        })
      ),

      _h(ET.Sheet, { open:showAdd, onClose:function(){ setShowAdd(false); }, title:editGoal ? 'Edytuj cel' : 'Nowy cel' },
        _h('div', { className:'grid-2', style:{ gridTemplateColumns:'1fr 130px' } },
          _h('div', { className:'field' }, _h('label', null, 'Nazwa *'), _h('input', { type:'text', placeholder:'np. Squat 140 kg', value:f.title, onChange:function(e){ upF('title',e.target.value); } })),
          _h('div', { className:'field' },
            _h('label', null, 'Śledzenie'),
            _h('select', {
              value:f.linkType||'none',
              style:{ width:'100%', background:'var(--s3)', color:'var(--t1)', border:'1px solid var(--b1)', borderRadius:'var(--r2)', padding:'10px 8px', fontSize:'.82rem' },
              onChange:function(e){
                var lt = e.target.value;
                var opt = LINK_OPTS.find(function(o){ return o.id===lt; });
                setF(function(prev){ return Object.assign({},prev,{ linkType:lt, unit:(opt&&opt.unit)||prev.unit }); });
              }
            },
              LINK_OPTS.map(function(o){ return _h('option', { key:o.id, value:o.id }, o.label); })
            )
          )
        ),
        f.linkType==='exercise' && _h('div', { className:'field' },
          _h('label', null, 'Ćwiczenie do śledzenia *'),
          // datalist nie działa w iOS WKWebView — własny picker (lista inline z filtrem)
          _h('input', { type:'text', placeholder:'np. Przysiad — wpisz lub wybierz z listy', value:f.exercise||'',
            onFocus:function(){ setShowExPicker(true); },
            onChange:function(e){ upF('exercise',e.target.value); setShowExPicker(true); } }),
          showExPicker && (function() {
            var q = (f.exercise||'').trim().toLowerCase();
            var list = allExerciseNames.filter(function(n){ return !q || n.toLowerCase().indexOf(q)!==-1; }).slice(0, 30);
            if (!list.length) return null;
            return _h('div', { style:{ maxHeight:180, overflowY:'auto', background:'var(--s3)', border:'1px solid var(--b1)', borderRadius:'var(--r2)', marginTop:4 } },
              list.map(function(n) {
                return _h('div', { key:n, style:{ padding:'9px 12px', fontSize:'.8rem', cursor:'pointer', borderBottom:'1px solid var(--b1)' },
                  onClick:function(){ upF('exercise', n); setShowExPicker(false); } }, n);
              })
            );
          })()
        ),
        f.linkType && f.linkType!=='none' && _h('div', { style:{ fontSize:'.68rem', color:'var(--a-light)', background:'var(--a-dim)', borderRadius:'var(--r2)', padding:'6px 10px', marginBottom:12 } },
          '🤖 Postęp zaktualizuje się automatycznie po zapisaniu '+(f.linkType==='exercise'?'treningu z tym ćwiczeniem (najlepszy ciężar)':f.linkType==='running'?'biegu (dystans)':'sesji sauny (czas trwania)')+'. Podaj wartość docelową poniżej.'
        ),
        _h('div', { className:'field' },
          _h('label', null, 'Horyzont'),
          _h('div', { style:{ display:'flex', gap:6 } },
            Object.keys(TERM_CONFIG).map(function(term) {
              return _h('button', { key:term, className:'tag-btn'+(f.term===term?' active':''), onClick:function(){ upF('term',term); } }, TERM_CONFIG[term].label+' · '+TERM_CONFIG[term].desc);
            })
          )
        ),
        _h('div', { className:'grid-2' },
          _h('div', { className:'field' }, _h('label', null, 'Wartość docelowa'), _h('input', { type:'text', placeholder:'np. 140', value:f.target, onChange:function(e){ upF('target',e.target.value); } })),
          _h('div', { className:'field' }, _h('label', null, 'Jednostka'), _h('input', { type:'text', placeholder:'kg, min, razy', value:f.unit, onChange:function(e){ upF('unit',e.target.value); } }))
        ),
        _h('div', { className:'field' }, _h('label', null, 'Termin (opcjonalnie)'), _h('input', { type:'date', value:f.deadline, onChange:function(e){ upF('deadline',e.target.value); } })),

        _h('div', { className:'field' },
          _h('label', null, '🏋️ Przypisz do treningów (opcjonalnie)'),
          _h('div', { style:{ display:'flex', gap:6, flexWrap:'wrap' } },
            WORKOUT_PLAN_OPTS.map(function(opt) {
              var active = (f.workouts||[]).indexOf(opt.id) !== -1;
              return _h('button', { key:opt.id, className:'tag-btn'+(active?' active':''), onClick:function(){ toggleWorkout(opt.id); } }, opt.label);
            })
          )
        ),

        _h('div', { className:'field' },
          _h('label', { style:{ display:'flex', justifyContent:'space-between' } }, _h('span', null, 'Aktualny postęp'), _h('span', { style:{ color:'var(--a-light)', fontWeight:700 } }, f.progress+'%')),
          _h('div', { className:'slider-wrap' }, _h('input', { type:'range', min:0, max:100, value:f.progress, onChange:function(e){ upF('progress',+e.target.value); } }))
        ),
        _h('button', { className:'btn btn-primary', style:{ width:'100%', marginTop:4 }, onClick:save }, editGoal ? 'Zapisz zmiany' : 'Dodaj cel')
      )
    );
  }

  ET.GoalsModule = GoalsModule;
  ET.WORKOUT_PLAN_OPTS = WORKOUT_PLAN_OPTS;
})();
