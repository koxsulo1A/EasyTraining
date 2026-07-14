(function() {
  'use strict';
  window.ET = window.ET || {};
  var _h = React.createElement;

  var READINESS_FIELDS = [
    { key:'willingness', label:'Chęć do treningu', opts:['😤 Bez chęci','😐 Ujdzie','💪 Pełna!'] },
    { key:'state',       label:'Samopoczucie',      opts:['😞 Słabo','😐 Normalnie','😄 Świetnie'] },
    { key:'fatigue',     label:'Zmęczenie',          opts:['😴 Bardzo zmęczony','😐 Umiarkowane','⚡ Brak zmęczenia'] },
  ];

  // Typy biegu = kategorie
  var RUN_TYPES = [
    { id:'long',     label:'Long Run', icon:'🛣' },
    { id:'run',      label:'Bieg',     icon:'🏃' },
    { id:'interval', label:'Interwał', icon:'⚡' },
  ];

  // Sekcje zbiorcze — przyporządkowanie biegów do 3 kategorii
  var CATEGORIES = [
    { id:'long',     label:'Long Run', icon:'🛣', color:'var(--green)',   match:function(r){ return r.type==='long'; } },
    { id:'run',      label:'Bieg',     icon:'🏃', color:'var(--a-light)', match:function(r){ return r.type!=='long' && r.type!=='interval'; } },
    { id:'interval', label:'Interwał', icon:'⚡', color:'var(--orange)',  match:function(r){ return r.type==='interval'; } },
  ];

  // ── STANDALONE ADD/EDIT SHEET (używany też przez Dashboard) ──────────────
  function RunningAddSheet(props) {
    var su = ET.useStore(); var store = su.store, update = su.update;
    var toast = ET.useToast();
    var editRec = props.edit || null;
    var st = React.useState('readiness'); var step = st[0], setStep = st[1];
    var rd = React.useState({ willingness:2, state:2, fatigue:2 }); var readiness = rd[0], setReadiness = rd[1];
    var lr = React.useState(null); var lastRun = lr[0], setLastRun = lr[1];
    var fs = React.useState({ date:ET.dstr(), type:'run', distance:5, duration:30, avgHr:150, elevation:0, notes:'' });
    var f = fs[0], setF = fs[1];
    function upF(key, val) { setF(function(p){ var o={}; o[key]=val; return Object.assign({},p,o); }); }

    React.useEffect(function() {
      if (props.open && editRec) {
        setF({
          date: editRec.date || ET.dstr(),
          type: editRec.type || 'run',
          distance: editRec.distance || 5,
          duration: editRec.duration || 30,
          avgHr: editRec.avgHr || 150,
          elevation: editRec.elevation || 0,
          notes: editRec.notes || ''
        });
        if (editRec.readiness) setReadiness(editRec.readiness);
        setStep('form');
      }
    }, [props.open, editRec]);

    function handleClose() {
      setStep('readiness');
      setReadiness({ willingness:2, state:2, fatigue:2 });
      setF({ date:ET.dstr(), type:'run', distance:5, duration:30, avgHr:150, elevation:0, notes:'' });
      setLastRun(null);
      props.onClose();
    }

    function save() {
      var pace = ET.calcPace(f.distance, f.duration);
      if (editRec) {
        update(function(s) {
          var next = Object.assign({}, s, {
            runs: (s.runs || []).map(function(r) {
              return r.id === editRec.id ? Object.assign({}, r, f, { pace: pace, readiness: readiness }) : r;
            })
          });
          if (ET.logChange) next = ET.logChange(next, { section:'running', title:'Edycja biegu', desc:'Zmieniono bieg z '+ET.fmtDate(f.date) });
          return next;
        });
        toast('Bieg zaktualizowany ✓', 'success');
        handleClose();
      } else {
        var run = Object.assign({ id:Date.now() }, f, { pace:pace, readiness:readiness });
        update(function(s){
          var n = Object.assign({},s,{ runs:[run].concat(s.runs) });
          return ET.syncGoals ? ET.syncGoals(n, 'run', run) : n;
        });
        // Core: Running Engine analizuje bieg i ryzyko przeciążenia
        if (window.etcore) { try { window.etcore.bus.publish('RunFinished', { distance:run.distance, duration:run.duration, avgHr:run.avgHr }, 'user'); } catch(e) { console.error('[core]', e); } }
        toast('Bieg zapisany ✓', 'success');
        setLastRun(run);
        setStep('summary');
      }
    }

    var sheetTitle = editRec
      ? 'Edytuj bieg'
      : step==='readiness' ? 'Gotowość do biegu' : step==='form' ? 'Nowy bieg' : 'Bieg zapisany';

    return _h(ET.Sheet, { open:props.open, onClose:handleClose, title:sheetTitle },

      step==='readiness' && _h('div', null,
        READINESS_FIELDS.map(function(field) {
          return _h('div', { key:field.key, style:{ marginBottom:14 } },
            _h('div', { style:{ fontSize:'.72rem', fontWeight:700, color:'var(--t3)', textTransform:'uppercase', letterSpacing:'.06em', marginBottom:8 } }, field.label),
            _h('div', { style:{ display:'flex', gap:6 } },
              field.opts.map(function(opt, i) {
                var active = readiness[field.key] === (i+1);
                return _h('button', { key:i,
                  style:{ flex:1, padding:'10px 4px', borderRadius:'var(--r2)', border:'1px solid '+(active?'var(--a)':'var(--b1)'), background:active?'var(--a-dim)':'var(--s3)', color:active?'var(--a-light)':'var(--t2)', cursor:'pointer', fontSize:'.68rem', fontWeight:600, lineHeight:1.3, textAlign:'center', transition:'all .15s' },
                  onClick:function(){ var o={}; o[field.key]=i+1; setReadiness(Object.assign({},readiness,o)); }
                }, opt);
              })
            )
          );
        }),
        _h('button', { className:'btn btn-primary', style:{ width:'100%', marginTop:6 }, onClick:function(){ setStep('form'); } }, '→ Dalej: Uzupełnij bieg')
      ),

      step==='form' && _h('div', null,
        _h('div', { style:{ display:'flex', gap:6, marginBottom:14, flexWrap:'wrap' } },
          RUN_TYPES.map(function(t) {
            return _h('button', { key:t.id, className:'tag-btn'+(f.type===t.id?' active':''), onClick:function(){ upF('type',t.id); } }, t.icon+' '+t.label);
          })
        ),
        _h('div', { className:'field' }, _h('label', null, 'Data'), _h('input', { type:'date', value:f.date, onChange:function(e){ upF('date',e.target.value); } })),
        _h('div', { className:'grid-2' },
          _h('div', { className:'field' }, _h('label', null, 'Dystans (km)'), _h('input', { type:'number', step:0.1, min:0.1, value:f.distance, onChange:function(e){ upF('distance',+e.target.value); } })),
          _h('div', { className:'field' }, _h('label', null, 'Czas (min)'), _h('input', { type:'number', min:1, value:f.duration, onChange:function(e){ upF('duration',+e.target.value); } }))
        ),
        _h('div', { style:{ background:'var(--s3)', borderRadius:'var(--r2)', padding:12, marginBottom:14, textAlign:'center' } },
          _h('div', { style:{ fontSize:'.65rem', color:'var(--t3)', marginBottom:2 } }, 'Obliczone tempo'),
          _h('div', { style:{ fontSize:'1.6rem', fontWeight:700, color:'var(--green)' } }, ET.calcPace(f.distance,f.duration)+' /km')
        ),
        _h('div', { className:'grid-2' },
          _h('div', { className:'field' }, _h('label', null, 'Śr. tętno (bpm)'), _h('input', { type:'number', min:0, value:f.avgHr, onChange:function(e){ upF('avgHr',+e.target.value); } })),
          _h('div', { className:'field' }, _h('label', null, 'Przewyższenie (m)'), _h('input', { type:'number', min:0, value:f.elevation, onChange:function(e){ upF('elevation',+e.target.value); } }))
        ),
        _h('div', { className:'field' }, _h('label', null, 'Notatki'), _h('textarea', { value:f.notes, onChange:function(e){ upF('notes',e.target.value); }, placeholder:'Jak się czułeś? Nawierzchnia, pogoda...' })),
        _h('div', { style:{ display:'flex', gap:8 } },
          !editRec && _h('button', { className:'btn btn-ghost', onClick:function(){ setStep('readiness'); } }, '← Wróć'),
          _h('button', { className:'btn btn-primary', style:{ flex:1 }, onClick:save }, editRec ? 'Zapisz zmiany' : 'Zapisz bieg')
        )
      ),

      step==='summary' && lastRun && _h('div', { className:'fade-in' },
        _h('div', { style:{ textAlign:'center', padding:'16px 0 10px' } },
          _h('div', { style:{ fontSize:'2.5rem' } }, '🏃'),
          _h('div', { style:{ fontWeight:700, fontSize:'1.1rem', marginTop:6 } }, lastRun.distance+'km ukończone!'),
          _h('div', { style:{ fontSize:'.78rem', color:'var(--t3)', marginTop:4 } }, lastRun.pace+' /km · '+lastRun.duration+' min')
        ),
        typeof ET.AIEngine !== 'undefined' && (function() {
          var insights = ET.AIEngine.analyzeRun(lastRun, store);
          var typeColor = {positive:'var(--green)',warning:'var(--orange)',info:'var(--a-light)',achievement:'var(--yellow)'};
          var typeBg = {positive:'rgba(34,197,94,.08)',warning:'rgba(249,115,22,.08)',info:'rgba(99,102,241,.08)',achievement:'rgba(234,179,8,.08)'};
          return _h('div', null,
            _h('div', { style:{ fontWeight:700, fontSize:'.82rem', color:'var(--t3)', textTransform:'uppercase', letterSpacing:'.05em', marginBottom:10 } }, '🤖 Analiza AI'),
            insights.map(function(ins, i) {
              return _h('div', { key:i, style:{ padding:'10px 12px', borderRadius:'var(--r2)', background:typeBg[ins.type]||'var(--s3)', border:'1px solid '+(typeColor[ins.type]||'var(--b1)')+'44', marginBottom:8 } },
                _h('div', { style:{ display:'flex', gap:8, alignItems:'flex-start' } },
                  _h('span', { style:{ fontSize:'1.1rem', flexShrink:0 } }, ins.icon),
                  _h('div', null,
                    _h('div', { style:{ fontWeight:700, fontSize:'.8rem', color:typeColor[ins.type]||'var(--t2)', marginBottom:3 } }, ins.title),
                    _h('div', { style:{ fontSize:'.72rem', color:'var(--t2)', lineHeight:1.5 } }, ins.body)
                  )
                )
              );
            })
          );
        })(),
        _h('button', { className:'btn btn-primary', style:{ width:'100%', marginTop:10 }, onClick:handleClose }, '← Zamknij')
      )
    );
  }

  function RunningModule() {
    var su = ET.useStore(); var store = su.store;
    var toast = ET.useToast();
    var nav = ET.useNav(); var params = nav.params || {};
    var sa = React.useState(!!params.openAdd); var showAdd = sa[0], setShowAdd = sa[1];
    var ed = React.useState(null); var editRun = ed[0], setEditRun = ed[1];
    var co = React.useState(false); var showCoach = co[0], setShowCoach = co[1];

    if (showCoach) {
      var insights = (ET.AIEngine && ET.AIEngine.coachRunning) ? ET.AIEngine.coachRunning(store) : [];
      return _h('div', { className:'fade-in' },
        _h('div', { style:{ display:'flex', alignItems:'center', gap:10, marginBottom:16 } },
          _h('button', { className:'btn btn-ghost btn-sm btn-icon', onClick:function(){ setShowCoach(false); } }, '←'),
          _h('div', null,
            _h('h1', { style:{ fontSize:'1.1rem', fontWeight:700 } }, '🤖 AI Coach — Bieganie'),
            _h('div', { style:{ fontSize:'.72rem', color:'var(--t3)', marginTop:2 } }, 'Analiza reguł na podstawie Twoich biegów')
          )
        ),
        ET.InsightList ? ET.InsightList(insights) : null
      );
    }

    var runs = store.runs || [];
    var total = runs.reduce(function(t,r){ return t+(r.distance||0); }, 0);
    var avgPaceAll = runs.length > 0 ? ET.calcPace(total, runs.reduce(function(t,r){ return t+(r.duration||0); }, 0)) : '—';

    // Renderer pojedynczej karty biegu (z podglądem/edycją po kliknięciu)
    function renderRun(r) {
      var rt = RUN_TYPES.find(function(t){ return t.id===r.type; });
      var rdColor = !r.readiness ? 'var(--t3)' : r.readiness.willingness===3?'var(--green)':r.readiness.willingness===1?'var(--red)':'var(--yellow)';
      return _h('div', { key:r.id, className:'card card-interactive', style:{ marginBottom:8, cursor:'pointer' }, onClick:function(){ setEditRun(r); } },
        _h('div', { style:{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' } },
          _h('div', { style:{ flex:1 } },
            _h('div', { style:{ fontWeight:700, fontSize:'1rem', marginBottom:2 } }, (rt?rt.icon+' ':'')+r.distance+' km'),
            _h('div', { style:{ fontSize:'.72rem', color:'var(--t3)', marginBottom:4 } }, ET.fmtDate(r.date)+' · '+r.duration+' min'+(rt?' · '+rt.label:'')),
            _h('div', { style:{ display:'flex', gap:4, flexWrap:'wrap' } },
              _h('span', { className:'badge badge-green' }, r.pace+'/km'),
              r.avgHr && _h('span', { className:'badge badge-red' }, '❤ '+r.avgHr+' bpm'),
              r.elevation>0 && _h('span', { className:'badge badge-teal' }, '↑ '+r.elevation+'m'),
              r.readiness && _h('span', { style:{ fontSize:'.72rem', color:rdColor } }, ['','😤','😐','💪'][r.readiness.willingness||0])
            ),
            r.notes && _h('div', { style:{ fontSize:'.72rem', color:'var(--t2)', marginTop:4, fontStyle:'italic' } }, r.notes)
          ),
          _h('div', { style:{ fontSize:'.6rem', color:'var(--t3)', flexShrink:0, marginTop:2 } }, '✏️ edytuj')
        )
      );
    }

    return _h('div', { className:'fade-in' },
      _h('div', { className:'page-hdr' },
        _h('div', null,
          _h('h1', null, '🏃 Bieganie'),
          _h('p', null, runs.length+' treningów · '+total.toFixed(1)+' km łącznie')
        ),
        _h('div', { style:{ display:'flex', gap:8, flexWrap:'wrap' } },
          _h('button', { className:'btn btn-ghost', style:{ fontSize:'.75rem', padding:'8px 12px' }, onClick:function(){ setShowCoach(true); } }, '🤖 AI Coach'),
          _h('button', { className:'btn btn-ghost', style:{ fontSize:'.75rem', padding:'8px 12px' }, onClick:function(){ ET.connectAppleHealth && ET.connectAppleHealth(su.update, toast); } }, '🍎 Apple Fitness'),
          _h('button', { className:'btn btn-primary', onClick:function(){ setShowAdd(true); } }, '+ Dodaj bieg')
        )
      ),

      // ── Sekcja istniejąca (poprzedni wygląd) ──────────────────────────────
      runs.length>0 && _h('div', { className:'grid-3', style:{ marginBottom:16 } },
        _h(ET.StatCard, { label:'Łączny dystans', value:total.toFixed(1)+' km', color:'var(--green)' }),
        _h(ET.StatCard, { label:'Śr. tempo', value:avgPaceAll+'/km', color:'var(--a-light)' }),
        _h(ET.StatCard, { label:'Treningi', value:runs.length, color:'var(--orange)' })
      ),

      // ── Nowa sekcja: liczniki wg kategorii ────────────────────────────────
      runs.length>0 && _h('div', { className:'grid-3', style:{ marginBottom:16 } },
        CATEGORIES.map(function(cat) {
          return _h(ET.StatCard, { key:cat.id, label:cat.icon+' '+cat.label, value:runs.filter(cat.match).length, color:cat.color });
        })
      ),

      runs.length===0
        ? _h(ET.Placeholder, { icon:'🏃', title:'Brak biegów', desc:'Rejestruj treningi biegowe: dystans, tempo, tętno i gotowość.' })
        : CATEGORIES.map(function(cat) {
            var catRuns = runs.filter(cat.match);
            if (catRuns.length === 0) return null;
            return _h('div', { key:cat.id, style:{ marginBottom:18 } },
              _h('div', { style:{ display:'flex', alignItems:'center', gap:8, marginBottom:8, paddingBottom:6, borderBottom:'1px solid var(--b1)' } },
                _h('span', { style:{ fontSize:'1rem' } }, cat.icon),
                _h('span', { style:{ fontWeight:700, fontSize:'.9rem', color:cat.color } }, cat.label),
                _h('span', { style:{ fontSize:'.7rem', color:'var(--t3)' } }, '· '+catRuns.length)
              ),
              catRuns.map(renderRun)
            );
          }),

      _h(RunningAddSheet, { open:showAdd, onClose:function(){ setShowAdd(false); } }),
      _h(RunningAddSheet, { open:!!editRun, edit:editRun, onClose:function(){ setEditRun(null); } })
    );
  }

  ET.RunningModule = RunningModule;
  ET.RunningAddSheet = RunningAddSheet;
})();
