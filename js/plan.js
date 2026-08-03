(function() {
  'use strict';
  window.ET = window.ET || {};
  var _h = React.createElement;

  // ══════════════════════════════════════════════════════════════════════
  // PLAN — ekran „Plan" (WEB), design „EasyTraining Aplikacja".
  // Spec: docs/segment-01-plan.md w projekcie designu — meta-plan → segmenty
  // → jednostki → tydzień, na polach store'u, które repo już ma. Logika
  // mirrorowania jednostek do customWorkoutPlans/workoutPlans (żeby trening
  // pojawił się w pickerze) odtworzona z istniejącego PlanEditorSheet
  // (js/strength.js) — ta sama reguła, świeża implementacja wizualna.
  //
  // Zakres tej wersji: layout tygodnia „strip" (rekomendowany domyślny w
  // spec §5); wariant „board" jeszcze nie zaimplementowany — świadomie
  // pominięty w tym przejściu, nie póło-zbudowany.
  // ══════════════════════════════════════════════════════════════════════

  function puid(prefix) { return prefix + '_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }

  function pDkey(d) { return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0'); }
  // Tydzień od poniedziałku, w czasie lokalnym — ET.dstr() liczy UTC (bug
  // components.js:7, znany i zgłoszony osobno); tu liczymy dzień lokalnie,
  // żeby siatka tygodnia zawsze zgadzała się z tym, co widzi użytkownik.
  function pWeekStart(offsetWeeks) {
    var d = new Date(); d.setHours(0,0,0,0);
    d.setDate(d.getDate() - ((d.getDay()+6) % 7) + offsetWeeks*7);
    return d;
  }
  function pIsDone(store, type, date) {
    if (type === 'rest') return date <= pDkey(new Date());
    if (type === 'strength')  return (store.workouts||[]).some(function(w){ return w.date===date; });
    if (type === 'running')   return (store.runs||[]).some(function(r){ return r.date===date; });
    if (type === 'sauna')     return (store.saunaSessions||[]).some(function(s){ return s.date===date; });
    if (type === 'intervals') return (store.intervals||[]).some(function(s){ return s.date===date; });
    return false;
  }

  var PLAN_GOALS = [
    { id:'strength',     name:'Siła',         color:'var(--a)' },
    { id:'hypertrophy',  name:'Masa',         color:'var(--purple)' },
    { id:'weight-loss',  name:'Redukcja',     color:'var(--orange)' },
    { id:'endurance',    name:'Wytrzymałość', color:'var(--green)' },
  ];
  var PLAN_DAYS = ['Pn','Wt','Śr','Cz','Pt','So','Nd'];
  var RUN_TYPES = [
    { id:'easy',     name:'Spokojny' },
    { id:'tempo',    name:'Tempo' },
    { id:'interval', name:'Interwały' },
    { id:'long',     name:'Długi' },
  ];

  function segsOf(mp) { return (mp.segments && mp.segments.length) ? mp.segments : [{ id:'seg_default', name:'Segment 1' }]; }
  function activeSegId(mp, sel) {
    var segs = segsOf(mp);
    return segs.some(function(s){ return s.id===sel; }) ? sel : segs[segs.length-1].id;
  }

  // Zapis meta-planu + mirror jednostek siłowych do customWorkoutPlans /
  // workoutPlans (bez tego trening nie pojawi się w pickerze — spec §3).
  function saveMetaPlan(update, metaPlans, mp) {
    var updated = metaPlans.some(function(m){ return m.id===mp.id; })
      ? metaPlans.map(function(m){ return m.id===mp.id ? mp : m; })
      : metaPlans.concat([mp]);
    ET.saveMetaPlans(update, updated);
    mp.units.forEach(function(unit) {
      if (unit.unitType !== 'strength') return;
      if (unit._isCustom) {
        update(function(s) {
          var list = s.customWorkoutPlans || [];
          var exists = list.some(function(p){ return p.id===unit.id; });
          return Object.assign({}, s, { customWorkoutPlans: exists ? list.map(function(p){ return p.id===unit.id?unit:p; }) : list.concat([unit]) });
        });
      } else {
        update(function(s) {
          var ov = Object.assign({}, s.workoutPlans || {}); ov[unit.id] = unit;
          return Object.assign({}, s, { workoutPlans: ov });
        });
      }
    });
    return updated;
  }

  var SECTION_LABEL = { fontSize:9, fontWeight:800, lineHeight:1, letterSpacing:'.14em', color:'var(--t3)' };
  function iconFor(unit) { return unit.unitType === 'running' ? 'running' : 'dumbbell'; }

  function PlanModule() {
    var su = ET.useStore(); var store = su.store, update = su.update;
    var toast = ET.useToast();
    var nav = ET.useNav(); var navigate = nav.navigate;

    var metaPlans = ET.getMetaPlans(store);

    var ms = React.useState(null); var metaSel = ms[0], setMetaSel = ms[1];
    var ss = React.useState(null); var segSel = ss[0], setSegSel = ss[1];
    var us = React.useState(null); var unitSel = us[0], setUnitSel = us[1];
    var dp = React.useState(null); var dayPick = dp[0], setDayPick = dp[1];
    var wo = React.useState(0); var weekOff = wo[0], setWeekOff = wo[1];
    var darm = React.useState(false); var delArm = darm[0], setDelArm = darm[1];

    // Aktywny meta-plan: wybór usera > plan ostatnio wykonanego treningu > pierwszy (spec §3).
    var activeMeta = React.useMemo(function() {
      if (!metaPlans.length) return null;
      var bySel = metaPlans.find(function(m){ return m.id === metaSel; });
      if (bySel) return bySel;
      var lastW = (store.workouts||[])[0];
      if (lastW) {
        var byLast = metaPlans.find(function(m){ return (m.units||[]).some(function(u){ return u.id===lastW.planId; }); });
        if (byLast) return byLast;
      }
      return metaPlans[0];
    }, [metaPlans, metaSel, store.workouts]);

    if (!activeMeta) {
      return _h('div', { className:'scr-in', style:{ display:'flex', flexDirection:'column', gap:18 } },
        _h('div', { onClick:function(){
            var mp = { id:puid('plan'), name:'Nowy plan', icon:'📋', units:[], goal:null, segments:[{ id:puid('seg'), name:'Segment 1', createdAt:ET.dstr() }] };
            saveMetaPlan(update, metaPlans, mp); setMetaSel(mp.id);
          }, className:'wcard', style:{ display:'flex', flexDirection:'column', alignItems:'center', gap:10, padding:'40px 20px', borderRadius:20, cursor:'pointer', textAlign:'center' } },
          _h('div', { style:{ fontSize:15, fontWeight:700 } }, 'Brak planu treningowego'),
          _h('div', { style:{ fontSize:12, color:'var(--t3)' } }, '+ Nowy plan')
        )
      );
    }

    var segs = segsOf(activeMeta);
    var curSegId = activeSegId(activeMeta, segSel);
    var segUnits = activeMeta.units.filter(function(u){ return (u.segmentId || segs[0].id) === curSegId; });

    function persist(mp) { var updated = saveMetaPlan(update, metaPlans, mp); return updated; }
    function patchMeta(field, value) {
      var mp = Object.assign({}, activeMeta); mp[field] = value; persist(mp);
    }
    function patchUnit(unitId, patch) {
      var mp = JSON.parse(JSON.stringify(activeMeta));
      var u = mp.units.find(function(x){ return x.id===unitId; });
      if (!u) return;
      Object.assign(u, patch);
      persist(mp);
    }
    function patchExercise(unitId, exIdx, patch) {
      var mp = JSON.parse(JSON.stringify(activeMeta));
      var u = mp.units.find(function(x){ return x.id===unitId; });
      if (!u) return;
      var ex = u.exercises[exIdx];
      Object.assign(ex, patch);
      if (patch.sets != null || patch.reps != null) ex.plan = ex.sets + '×' + ex.reps;
      persist(mp);
    }

    // ── SEGMENTY ──
    function addSegment() {
      var mp = JSON.parse(JSON.stringify(activeMeta));
      var name = prompt('Nazwa nowego segmentu', 'Segment ' + (segsOf(mp).length + 1));
      if (!name) return;
      var seg = { id:puid('seg'), name:name, createdAt:ET.dstr() };
      mp.segments = segsOf(mp).concat([seg]);
      persist(mp); setSegSel(seg.id);
    }
    function dupSegment() {
      var mp = JSON.parse(JSON.stringify(activeMeta));
      var srcId = curSegId, stamp = Date.now();
      var srcUnits = mp.units.filter(function(u){ return (u.segmentId || segsOf(mp)[0].id) === srcId; });
      var seg = { id:puid('seg'), name:'Segment ' + (segsOf(mp).length + 1), createdAt:ET.dstr() };
      mp.segments = segsOf(mp).concat([seg]);
      var copies = srcUnits.map(function(u, i) {
        var c = JSON.parse(JSON.stringify(u));
        c.id = u.id + '_c' + i + stamp; c.segmentId = seg.id; c.createdAt = new Date().toISOString();
        return c;
      });
      mp.units = mp.units.concat(copies);
      persist(mp); setSegSel(seg.id);
      toast('Segment skopiowany ✓', 'success');
    }
    function delSegment(segId) {
      if (segs.length <= 1) return;
      if (!confirm('Usunąć ten segment i jego jednostki?')) return;
      var mp = JSON.parse(JSON.stringify(activeMeta));
      mp.segments = segsOf(mp).filter(function(s){ return s.id !== segId; });
      mp.units = mp.units.filter(function(u){ return (u.segmentId || segId) !== segId; });
      persist(mp);
      if (curSegId === segId) setSegSel(null);
    }

    // ── TYDZIEŃ ──
    var weekStart = pWeekStart(weekOff);
    var weekDays = React.useMemo(function() {
      var days = [];
      for (var i = 0; i < 7; i++) {
        var d = new Date(weekStart); d.setDate(weekStart.getDate() + i);
        var key = pDkey(d);
        var entries = (store.weekPlans || []).filter(function(p){ return p.date === key; });
        days.push({ key:key, label:PLAN_DAYS[i], num:d.getDate(), isToday:key === pDkey(new Date()), isPast:key < pDkey(new Date()), entries:entries });
      }
      return days;
    }, [store.weekPlans, weekOff]);
    var plannedCount = weekDays.reduce(function(a,d){ return a + d.entries.filter(function(e){ return e.type!=='rest'; }).length; }, 0);
    var doneCount = weekDays.reduce(function(a,d){ return a + d.entries.filter(function(e){ return e.type!=='rest' && pIsDone(store, e.type, d.key); }).length; }, 0);
    var weekPct = plannedCount ? Math.round(doneCount/plannedCount*100) : 0;

    function addWeekPlan(date, unit) {
      var entry = { id:Date.now(), date:date, type:unit.unitType, planId:unit.id, planName:unit.name, icon:unit.icon || '🏃', color:unit.color || 'var(--green)', note:'' };
      update(function(s){ return Object.assign({}, s, { weekPlans:(s.weekPlans||[]).concat([entry]) }); });
    }
    function addRestPlan(date) {
      var entry = { id:Date.now(), date:date, type:'rest', planId:'rest', planName:'Odpoczynek', icon:'😴', color:'var(--t3)', note:'' };
      update(function(s){ return Object.assign({}, s, { weekPlans:(s.weekPlans||[]).concat([entry]) }); });
    }
    function removeWeekPlan(id) {
      update(function(s){ return Object.assign({}, s, { weekPlans:(s.weekPlans||[]).filter(function(p){ return p.id!==id; }) }); });
    }
    function clearDay(date) {
      update(function(s){ return Object.assign({}, s, { weekPlans:(s.weekPlans||[]).filter(function(p){ return p.date!==date; }) }); });
      setDayPick(null);
    }

    // ── JEDNOSTKI ──
    function addStrengthUnit() {
      var unit = { id:puid('unit'), unitType:'strength', _isCustom:true, segmentId:curSegId, createdAt:new Date().toISOString(),
        name:'Nowy trening', icon:'🏋️', day:'', desc:'', color:'var(--a)', badge:'badge-blue', warmup:[], exercises:[], cooldown:[] };
      var mp = JSON.parse(JSON.stringify(activeMeta)); mp.units = mp.units.concat([unit]);
      persist(mp); setUnitSel(unit.id); setDelArm(false);
    }
    function addRunUnit() {
      var unit = { id:puid('rununit'), unitType:'running', segmentId:curSegId, createdAt:new Date().toISOString(),
        name:'Bieg', icon:'🏃', color:'var(--green)', day:'', runType:'easy', distance:5, duration:30, pace:'6:00', notes:'' };
      var mp = JSON.parse(JSON.stringify(activeMeta)); mp.units = mp.units.concat([unit]);
      persist(mp); setUnitSel(unit.id); setDelArm(false);
    }
    function cycleDay(unit) {
      var idx = PLAN_DAYS.indexOf(unit.day);
      var next = idx === -1 ? PLAN_DAYS[0] : (idx === PLAN_DAYS.length-1 ? '' : PLAN_DAYS[idx+1]);
      patchUnit(unit.id, { day: next });
    }
    function deleteUnit(unit) {
      var mp = JSON.parse(JSON.stringify(activeMeta));
      mp.units = mp.units.filter(function(u){ return u.id !== unit.id; });
      persist(mp);
      if (unit.unitType !== 'running') {
        if (unit._isCustom) {
          update(function(s){ return Object.assign({}, s, { customWorkoutPlans:(s.customWorkoutPlans||[]).filter(function(p){ return p.id!==unit.id; }) }); });
        } else {
          update(function(s){ var h=(s.hiddenPlanIds||[]).slice(); if(h.indexOf(unit.id)===-1) h.push(unit.id); return Object.assign({}, s, { hiddenPlanIds:h }); });
        }
      }
      setUnitSel(null); setDelArm(false);
      toast('Jednostka usunięta', 'default');
    }
    function startUnit(unit) { navigate('strength', { plan: unit }); }

    var unit = unitSel ? activeMeta.units.find(function(u){ return u.id===unitSel; }) : null;

    return _h('div', { className:'scr-in', style:{ display:'flex', flexDirection:'column', gap:18 } },

      // ══ CHIPY META-PLANÓW ══
      _h('div', { style:{ display:'flex', gap:8, flexWrap:'wrap' } },
        metaPlans.map(function(mp) {
          var active = mp.id === activeMeta.id;
          return _h('div', { key:mp.id, onClick:function(){ setMetaSel(mp.id); setSegSel(null); setUnitSel(null); },
            style:{ display:'flex', alignItems:'center', gap:10, padding:'9px 14px', borderRadius:14, cursor:'pointer',
              background: active ? 'rgba(59,130,246,.14)' : 'rgba(255,255,255,.04)',
              border:'1px solid ' + (active ? 'rgba(96,165,250,.36)' : 'rgba(255,255,255,.08)') } },
            _h('span', { style:{ fontSize:16 } }, mp.icon || '📋'),
            _h('div', { style:{ display:'flex', flexDirection:'column', gap:4 } },
              _h('span', { style:{ fontSize:12.5, fontWeight:700, letterSpacing:'-.01em', color: active ? 'var(--a-light)' : 'var(--t1)' } }, mp.name),
              _h('span', { style:{ fontSize:9.5, fontWeight:600, color:'var(--t3)' } }, mp.units.length + ' jedn.')
            )
          );
        }),
        _h('div', { onClick:function(){
            var mp = { id:puid('plan'), name:'Nowy plan', icon:'📋', units:[], goal:null, segments:[{ id:puid('seg'), name:'Segment 1', createdAt:ET.dstr() }] };
            saveMetaPlan(update, metaPlans, mp); setMetaSel(mp.id); setSegSel(null); setUnitSel(null);
          }, style:{ display:'flex', alignItems:'center', gap:7, padding:'9px 14px', borderRadius:14, cursor:'pointer',
            border:'1px dashed rgba(255,255,255,.16)', color:'var(--t3)', fontSize:11.5, fontWeight:700 } },
          '+ Nowy plan'
        )
      ),

      // ══ KARTA META-PLANU (szklana) ══
      _h('div', { className:'glass', style:{ display:'flex', flexDirection:'column', gap:15, padding:20, borderRadius:22 } },
        _h('div', { style:{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:18, flexWrap:'wrap' } },
          _h('div', { style:{ display:'flex', flexDirection:'column', gap:7, minWidth:0 } },
            _h('span', { style:SECTION_LABEL }, 'META-PLAN'),
            _h('input', { value:activeMeta.name, onChange:function(e){ patchMeta('name', e.target.value); },
              style:{ background:'none', border:'none', outline:'none', color:'var(--t1)', font:'800 24px/1.1 -apple-system,sans-serif', letterSpacing:'-.032em', padding:0, width:'100%' } }),
            _h('div', { style:{ fontSize:12, fontWeight:600, color:'var(--t2)' } }, segs.length + ' ' + (segs.length===1?'segment':'segmenty') + ' · ' + activeMeta.units.length + ' jednostek')
          ),
          _h('div', { style:{ display:'flex', flexDirection:'column', gap:8, alignItems:'flex-end' } },
            _h('span', { style:SECTION_LABEL }, 'CEL PLANU'),
            _h('div', { style:{ display:'flex', gap:6, flexWrap:'wrap', justifyContent:'flex-end' } },
              PLAN_GOALS.map(function(g) {
                var on = activeMeta.goal === g.id;
                return _h('div', { key:g.id, onClick:function(){ patchMeta('goal', on ? null : g.id); },
                  style:{ padding:'7px 12px', borderRadius:100, cursor:'pointer', fontSize:11, fontWeight:700,
                    background: on ? 'color-mix(in srgb,'+g.color+' 20%, transparent)' : 'rgba(255,255,255,.04)',
                    border:'1px solid ' + (on ? 'color-mix(in srgb,'+g.color+' 45%, transparent)' : 'rgba(255,255,255,.09)'),
                    color: on ? g.color : 'var(--t2)' } }, g.name);
              })
            )
          )
        ),
        _h('div', { style:{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap', paddingTop:14, borderTop:'1px solid rgba(255,255,255,.07)' } },
          _h('span', { style:Object.assign({}, SECTION_LABEL, { marginRight:2 }) }, 'SEGMENTY'),
          segs.map(function(s) {
            var active = s.id === curSegId;
            return _h('div', { key:s.id, style:{ display:'flex', alignItems:'center', gap:9, padding:'8px 8px 8px 13px', borderRadius:12,
              background: active ? 'rgba(59,130,246,.14)' : 'rgba(255,255,255,.04)', border:'1px solid ' + (active ? 'rgba(96,165,250,.32)' : 'rgba(255,255,255,.08)') } },
              _h('div', { onClick:function(){ setSegSel(s.id); }, style:{ display:'flex', flexDirection:'column', gap:4, cursor:'pointer' } },
                _h('span', { style:{ fontSize:12, fontWeight:700, color: active ? 'var(--a-light)' : 'var(--t1)' } }, s.name)
              ),
              _h('div', { onClick:function(){ delSegment(s.id); }, title: segs.length<=1 ? 'Jedyny segment' : 'Usuń segment',
                style:{ width:22, height:22, borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center',
                  cursor: segs.length<=1 ? 'default' : 'pointer', color:'#3a3a55', opacity: segs.length<=1 ? .25 : 1, pointerEvents: segs.length<=1 ? 'none' : 'auto' } },
                _h('svg', { width:12, height:12, viewBox:'0 0 24 24', fill:'none', stroke:'currentColor', strokeWidth:2.4, strokeLinecap:'round' }, _h('path', { d:'M6 6l12 12M18 6L6 18' }))
              )
            );
          }),
          _h('div', { onClick:addSegment, style:{ padding:'9px 13px', borderRadius:12, cursor:'pointer', border:'1px dashed rgba(255,255,255,.16)', color:'var(--t3)', fontSize:11, fontWeight:700 } }, '+ Segment'),
          _h('div', { onClick:dupSegment, style:{ padding:'9px 13px', borderRadius:12, cursor:'pointer', background:'rgba(255,255,255,.05)', border:'1px solid rgba(255,255,255,.10)', color:'var(--t2)', fontSize:11, fontWeight:700 } }, 'Skopiuj aktywny')
        )
      ),

      // ══ TYDZIEŃ (strip) ══
      _h('div', { className:'wcard', style:{ display:'flex', flexDirection:'column', gap:14, padding:20, borderRadius:22 } },
        _h('div', { style:{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:14, flexWrap:'wrap' } },
          _h('div', { style:{ display:'flex', alignItems:'center', gap:8 } },
            _h('div', { onClick:function(){ setWeekOff(weekOff-1); }, style:{ width:30, height:30, borderRadius:10, background:'rgba(255,255,255,.05)', border:'1px solid rgba(255,255,255,.10)', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:'var(--t2)' } },
              _h('svg', { width:14, height:14, viewBox:'0 0 24 24', fill:'none', stroke:'currentColor', strokeWidth:2.4, strokeLinecap:'round', strokeLinejoin:'round' }, _h('path', { d:'M15 5l-7 7 7 7' }))),
            _h('div', { style:{ display:'flex', flexDirection:'column', gap:4, minWidth:150 } },
              _h('span', { style:{ fontSize:13, fontWeight:700, letterSpacing:'-.015em' } }, weekOff===0 ? 'Ten tydzień' : (weekOff>0?'+':'')+weekOff+' tyg.'),
              _h('span', { style:{ fontSize:10, fontWeight:600, color:'var(--t3)' } }, ET.fmtDateShort(weekStart) + ' – ' + ET.fmtDateShort(weekDays[6].key))
            ),
            _h('div', { onClick:function(){ setWeekOff(weekOff+1); }, style:{ width:30, height:30, borderRadius:10, background:'rgba(255,255,255,.05)', border:'1px solid rgba(255,255,255,.10)', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:'var(--t2)' } },
              _h('svg', { width:14, height:14, viewBox:'0 0 24 24', fill:'none', stroke:'currentColor', strokeWidth:2.4, strokeLinecap:'round', strokeLinejoin:'round' }, _h('path', { d:'M9 5l7 7-7 7' })))
          ),
          _h('div', { style:{ display:'flex', alignItems:'center', gap:12, flex:'1 1 220px', minWidth:180 } },
            _h('div', { style:{ flex:1, height:5, borderRadius:3, background:'rgba(255,255,255,.08)', overflow:'hidden' } },
              _h('div', { style:{ height:'100%', borderRadius:3, background:'linear-gradient(90deg,var(--a),var(--green))', transition:'width .4s', width:weekPct+'%' } })),
            _h('span', { style:{ fontSize:11.5, fontWeight:800, color:'var(--green)', fontVariantNumeric:'tabular-nums' } }, doneCount+'/'+plannedCount)
          )
        ),
        _h('div', { style:{ display:'grid', gridTemplateColumns:'repeat(7,minmax(96px,1fr))', gap:7, overflowX:'auto' } },
          weekDays.map(function(d) {
            return _h('div', { key:d.key, onClick:function(){ setDayPick(dayPick===d.key?null:d.key); },
              style:{ display:'flex', flexDirection:'column', gap:7, minHeight:112, padding:'10px 8px', borderRadius:16, cursor:'pointer',
                background: dayPick===d.key ? 'rgba(59,130,246,.12)' : 'rgba(255,255,255,.03)',
                border:'1px solid ' + (dayPick===d.key ? 'rgba(96,165,250,.4)' : d.isToday ? 'rgba(96,165,250,.3)' : 'rgba(255,255,255,.06)'),
                opacity: d.isPast && !d.entries.length ? .55 : 1 } },
              _h('div', { style:{ display:'flex', alignItems:'baseline', justifyContent:'space-between', gap:6 } },
                _h('span', { style:{ fontSize:8.5, fontWeight:800, letterSpacing:'.12em', color: d.isToday ? 'var(--a-light)' : 'var(--t3)' } }, d.label),
                _h('span', { style:{ fontSize:13, fontWeight:800, fontVariantNumeric:'tabular-nums', color: d.isToday ? 'var(--a-light)' : 'var(--t1)' } }, d.num)
              ),
              d.entries.map(function(e) {
                var done = pIsDone(store, e.type, d.key);
                var status = e.type==='rest' ? 'ODPOCZYNEK' : done ? 'ZROBIONE' : d.key===pDkey(new Date()) ? 'DZIŚ' : d.isPast ? 'POMINIĘTE' : 'PLAN';
                var statColor = e.type==='rest' ? 'var(--t3)' : done ? 'var(--green)' : d.isPast ? 'var(--red)' : 'var(--a-light)';
                return _h('div', { key:e.id, style:{ display:'flex', flexDirection:'column', gap:4, padding:'6px 7px', borderRadius:11,
                  background:'color-mix(in srgb,'+(e.color||'var(--a)')+' 14%, transparent)', border:'1px solid color-mix(in srgb,'+(e.color||'var(--a)')+' 30%, transparent)' } },
                  _h('div', { style:{ display:'flex', alignItems:'center', gap:5 } },
                    _h('span', { style:{ fontSize:11 } }, e.icon),
                    _h('span', { style:{ flex:1, minWidth:0, fontSize:9.5, fontWeight:700, color:'var(--t1)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' } }, e.planName)
                  ),
                  _h('span', { style:{ fontSize:8, fontWeight:800, letterSpacing:'.06em', color:statColor } }, status)
                );
              }),
              !d.entries.length && _h('div', { style:{ marginTop:'auto', textAlign:'center', fontSize:16, fontWeight:700, color:'var(--s5)' } }, '+')
            );
          })
        )
      ),

      // ══ PANEL PLANOWANIA DNIA ══
      dayPick && _h('div', { style:{ display:'flex', flexDirection:'column', gap:14, padding:20, borderRadius:22,
        background:'linear-gradient(158deg,rgba(59,130,246,.10),rgba(255,255,255,.02))', border:'1px solid rgba(96,165,250,.30)' } },
        _h('div', { style:{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:14 } },
          _h('div', { style:{ display:'flex', flexDirection:'column', gap:5 } },
            _h('span', { style:Object.assign({}, SECTION_LABEL, { color:'var(--a-light)' }) }, 'PLANOWANIE DNIA'),
            _h('span', { style:{ fontSize:15, fontWeight:700, letterSpacing:'-.02em' } }, new Date(dayPick).toLocaleDateString('pl-PL',{ weekday:'long', day:'numeric', month:'long' }))
          ),
          _h('div', { style:{ display:'flex', gap:8 } },
            _h('div', { onClick:function(){ clearDay(dayPick); }, style:{ display:'flex', alignItems:'center', gap:6, height:32, padding:'0 12px', borderRadius:11, cursor:'pointer', border:'1px solid rgba(239,68,68,.26)', background:'rgba(239,68,68,.10)', color:'var(--red)', fontSize:11, fontWeight:700 } }, 'Wyczyść dzień'),
            _h('div', { onClick:function(){ setDayPick(null); }, style:{ width:32, height:32, borderRadius:11, background:'rgba(255,255,255,.05)', border:'1px solid rgba(255,255,255,.10)', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:'var(--t2)' } },
              _h('svg', { width:14, height:14, viewBox:'0 0 24 24', fill:'none', stroke:'currentColor', strokeWidth:2.4, strokeLinecap:'round' }, _h('path', { d:'M6 6l12 12M18 6L6 18' })))
          )
        ),
        (weekDays.find(function(d){ return d.key===dayPick; }).entries.length > 0) &&
          _h('div', { style:{ display:'flex', gap:7, flexWrap:'wrap' } },
            weekDays.find(function(d){ return d.key===dayPick; }).entries.map(function(e) {
              return _h('div', { key:e.id, style:{ display:'flex', alignItems:'center', gap:8, padding:'7px 8px 7px 12px', borderRadius:100,
                background:'color-mix(in srgb,'+(e.color||'var(--a)')+' 14%, transparent)', border:'1px solid color-mix(in srgb,'+(e.color||'var(--a)')+' 30%, transparent)' } },
                _h('span', { style:{ fontSize:12 } }, e.icon),
                _h('span', { style:{ fontSize:11, fontWeight:700, color:'var(--t1)' } }, e.planName),
                _h('div', { onClick:function(){ removeWeekPlan(e.id); }, style:{ width:18, height:18, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:'var(--t3)' } },
                  _h('svg', { width:10, height:10, viewBox:'0 0 24 24', fill:'none', stroke:'currentColor', strokeWidth:3, strokeLinecap:'round' }, _h('path', { d:'M6 6l12 12M18 6L6 18' })))
              );
            })
          ),
        _h('div', { style:{ display:'flex', flexDirection:'column', gap:9 } },
          _h('span', { style:SECTION_LABEL }, 'DODAJ Z AKTYWNEGO SEGMENTU'),
          _h('div', { style:{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))', gap:8 } },
            segUnits.concat([{ id:'__rest', name:'Odpoczynek', icon:'😴', desc:'Dzień wolny', __rest:true }]).map(function(o) {
              return _h('div', { key:o.id, onClick:function(){ o.__rest ? addRestPlan(dayPick) : addWeekPlan(dayPick, o); },
                style:{ display:'flex', alignItems:'center', gap:10, padding:'11px 13px', borderRadius:14, cursor:'pointer', background:'rgba(255,255,255,.04)', border:'1px solid rgba(255,255,255,.09)' } },
                _h('span', { style:{ fontSize:15 } }, o.icon || '🏋️'),
                _h('div', { style:{ display:'flex', flexDirection:'column', gap:4, minWidth:0 } },
                  _h('span', { style:{ fontSize:12, fontWeight:700 } }, o.name),
                  _h('span', { style:{ fontSize:9.5, fontWeight:600, color:'var(--t3)' } }, o.desc || (o.day || 'dowolny dzień'))
                )
              );
            })
          )
        )
      ),

      // ══ JEDNOSTKI ══
      _h('div', { style:{ display:'flex', flexDirection:'column', gap:11 } },
        _h('div', { style:{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:14 } },
          _h('span', { style:SECTION_LABEL }, 'JEDNOSTKI SEGMENTU'),
          _h('div', { style:{ display:'flex', gap:7 } },
            _h('div', { onClick:addStrengthUnit, style:{ display:'flex', alignItems:'center', gap:6, height:32, padding:'0 12px', borderRadius:11, cursor:'pointer', border:'1px dashed rgba(255,255,255,.16)', color:'var(--t3)', fontSize:11, fontWeight:700 } }, '+ Trening siłowy'),
            _h('div', { onClick:addRunUnit, style:{ display:'flex', alignItems:'center', gap:6, height:32, padding:'0 12px', borderRadius:11, cursor:'pointer', border:'1px dashed rgba(255,255,255,.16)', color:'var(--t3)', fontSize:11, fontWeight:700 } }, '+ Bieg')
          )
        ),
        segUnits.length === 0
          ? _h('div', { style:{ padding:'28px 20px', borderRadius:18, border:'1px dashed rgba(255,255,255,.12)', background:'rgba(255,255,255,.02)', textAlign:'center', color:'var(--t3)', fontSize:12 } }, 'Brak jednostek w tym segmencie')
          : _h('div', { style:{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(212px,1fr))', gap:9 } },
              segUnits.map(function(u) {
                var active = u.id === unitSel;
                var col = u.color || (u.unitType==='running' ? 'var(--green)' : 'var(--a)');
                var meta = u.unitType==='running' ? (u.distance||0)+' km · '+(u.duration||0)+' min' : (u.exercises||[]).length + ' ćw.';
                return _h('div', { key:u.id, onClick:function(){ setUnitSel(u.id); setDelArm(false); },
                  className:'wplan', style:{ display:'flex', flexDirection:'column', gap:9, padding:14, borderRadius:18, cursor:'pointer',
                    background: active ? 'rgba(59,130,246,.10)' : 'rgba(255,255,255,.035)', border:'1px solid ' + (active ? 'rgba(96,165,250,.36)' : 'rgba(255,255,255,.07)') } },
                  _h('div', { style:{ display:'flex', alignItems:'center', gap:9 } },
                    _h('div', { style:{ flex:'none', width:30, height:30, borderRadius:11, background:'color-mix(in srgb,'+col+' 18%, transparent)', display:'flex', alignItems:'center', justifyContent:'center', color:col } }, ET.Icon(iconFor(u), 15)),
                    _h('div', { style:{ flex:1, minWidth:0, display:'flex', flexDirection:'column', gap:4 } },
                      _h('span', { style:{ fontSize:12.5, fontWeight:700, letterSpacing:'-.01em', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' } }, u.name),
                      _h('span', { style:{ fontSize:9.5, fontWeight:600, color:'var(--t3)' } }, u.desc || meta)
                    ),
                    _h('span', { style:{ flex:'none', padding:'4px 8px', borderRadius:100, background:'rgba(255,255,255,.06)', fontSize:9, fontWeight:800, color:'var(--t2)' } }, u.day || '—')
                  ),
                  _h('div', { style:{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:8, paddingTop:9, borderTop:'1px solid rgba(255,255,255,.07)' } },
                    _h('span', { style:{ fontSize:10, fontWeight:600, color:'var(--t3)' } }, meta),
                    _h('span', { style:{ fontSize:9, fontWeight:800, letterSpacing:'.08em', color:col } }, u.unitType==='running' ? 'BIEG' : 'SIŁA')
                  )
                );
              })
            )
      ),

      // ══ PANEL SZCZEGÓŁÓW JEDNOSTKI ══
      unit && _h('div', { className:'glass', style:{ display:'flex', flexDirection:'column', gap:16, padding:20, borderRadius:22 } },
        _h('div', { style:{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:16, flexWrap:'wrap' } },
          _h('div', { style:{ display:'flex', alignItems:'center', gap:12, minWidth:0, flex:1 } },
            _h('div', { style:{ flex:'none', width:40, height:40, borderRadius:14, background:'color-mix(in srgb,'+(unit.color||'var(--a)')+' 18%, transparent)', display:'flex', alignItems:'center', justifyContent:'center', color:unit.color||'var(--a)' } }, ET.Icon(iconFor(unit), 19)),
            _h('div', { style:{ display:'flex', flexDirection:'column', gap:6, minWidth:0, flex:1 } },
              _h('input', { value:unit.name, onChange:function(e){ patchUnit(unit.id, { name:e.target.value }); },
                style:{ background:'none', border:'none', outline:'none', color:'var(--t1)', font:'800 19px/1.1 -apple-system,sans-serif', letterSpacing:'-.025em', padding:0, width:'100%' } }),
              _h('div', { style:{ display:'flex', alignItems:'center', gap:7, flexWrap:'wrap' } },
                _h('input', { value:unit.desc||'', placeholder:'Opis jednostki', onChange:function(e){ patchUnit(unit.id, { desc:e.target.value }); },
                  style:{ background:'none', border:'none', outline:'none', color:'var(--t2)', font:'600 11.5px/1 -apple-system,sans-serif', padding:0, minWidth:80 } }),
                _h('div', { onClick:function(){ cycleDay(unit); }, style:{ display:'flex', alignItems:'center', gap:5, padding:'4px 9px', borderRadius:100, cursor:'pointer', background:'rgba(96,165,250,.14)', border:'1px solid rgba(96,165,250,.28)', fontSize:9.5, fontWeight:800, color:'var(--a-light)' } }, unit.day || 'dowolny dzień')
              )
            )
          ),
          _h('div', { style:{ display:'flex', gap:8, flexWrap:'wrap' } },
            unit.unitType === 'strength' && _h('div', { onClick:function(){ startUnit(unit); }, style:{ display:'flex', alignItems:'center', gap:7, height:40, padding:'0 17px', borderRadius:14, cursor:'pointer',
              background:'linear-gradient(150deg,#60A5FA,#3B82F6 45%,#8B5CF6)', color:'#080810', fontSize:12.5, fontWeight:800 } }, '▶ Zacznij tę jednostkę'),
            _h('div', { onClick:function(){ if (delArm) deleteUnit(unit); else setDelArm(true); }, onMouseLeave:function(){ setDelArm(false); },
              style:{ display:'flex', alignItems:'center', gap:7, height:40, padding:'0 14px', borderRadius:14, cursor:'pointer',
                background: delArm ? 'rgba(239,68,68,.18)' : 'rgba(255,255,255,.05)', border:'1px solid ' + (delArm ? 'rgba(239,68,68,.4)' : 'rgba(255,255,255,.10)'),
                color: delArm ? 'var(--red)' : 'var(--t2)', fontSize:11.5, fontWeight:700 } }, delArm ? 'Na pewno usunąć?' : 'Usuń jednostkę'),
            _h('div', { onClick:function(){ setUnitSel(null); setDelArm(false); }, style:{ width:40, height:40, borderRadius:14, background:'rgba(255,255,255,.05)', border:'1px solid rgba(255,255,255,.10)', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:'var(--t2)' } },
              _h('svg', { width:14, height:14, viewBox:'0 0 24 24', fill:'none', stroke:'currentColor', strokeWidth:2.4, strokeLinecap:'round' }, _h('path', { d:'M6 6l12 12M18 6L6 18' })))
          )
        ),

        unit.unitType === 'strength'
          ? _h('div', { style:{ display:'flex', flexDirection:'column', gap:8 } },
              (unit.exercises||[]).map(function(ex, i) {
                return _h(ExerciseRow, { key:i, ex:ex, onChange:function(patch){ patchExercise(unit.id, i, patch); },
                  onRemove:function(){
                    var mp = JSON.parse(JSON.stringify(activeMeta));
                    var u2 = mp.units.find(function(x){ return x.id===unit.id; });
                    u2.exercises.splice(i,1); persist(mp);
                  } });
              }),
              _h(AddExerciseRow, { onAdd:function(name) {
                var mp = JSON.parse(JSON.stringify(activeMeta));
                var u2 = mp.units.find(function(x){ return x.id===unit.id; });
                u2.exercises = (u2.exercises||[]).concat([{ name:name, plan:'3×8', sets:3, reps:8, weight:0, rir:2, tempo:'kontrola', rest:90, prog:'' }]);
                persist(mp);
              } })
            )
          : _h(RunUnitEditor, { unit:unit, onChange:function(patch){ patchUnit(unit.id, patch); } })
      )
    );
  }

  // ── WIERSZ ĆWICZENIA (steppery serie/powt./ciężar + RIR) ──
  function stepBtn(onClick, glyph) {
    return _h('div', { onClick:onClick, style:{ width:26, height:26, borderRadius:8, background:'rgba(255,255,255,.06)', border:'1px solid rgba(255,255,255,.10)', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:'var(--t2)', fontSize:14, fontWeight:700, userSelect:'none' } }, glyph);
  }
  var RIR_LABELS = ['UPADEK','CIĘŻKO','DOBRZE','LEKKO','ŁATWO'];
  var RIR_COLORS = ['var(--red)','var(--orange)','var(--green)','var(--teal)','var(--t2)'];

  function ExerciseRow(props) {
    var ex = props.ex;
    return _h('div', { style:{ display:'flex', flexDirection:'column', gap:8, padding:'12px 14px', borderRadius:14, background:'rgba(255,255,255,.03)', border:'1px solid rgba(255,255,255,.07)' } },
      _h('div', { style:{ display:'flex', alignItems:'center', gap:10 } },
        _h('span', { style:{ flex:1, fontSize:13, fontWeight:700, minWidth:0, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' } }, ex.name),
        _h('div', { onClick:props.onRemove, style:{ width:22, height:22, borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:'var(--t3)' } },
          _h('svg', { width:12, height:12, viewBox:'0 0 24 24', fill:'none', stroke:'currentColor', strokeWidth:2.4, strokeLinecap:'round' }, _h('path', { d:'M6 6l12 12M18 6L6 18' })))
      ),
      _h('div', { style:{ display:'flex', gap:16, flexWrap:'wrap' } },
        [
          { label:'SERIE', val:ex.sets, dec:function(){ props.onChange({ sets:Math.max(1, ex.sets-1) }); }, inc:function(){ props.onChange({ sets:ex.sets+1 }); } },
          { label:'POWT.', val:ex.reps, dec:function(){ props.onChange({ reps:Math.max(1, ex.reps-1) }); }, inc:function(){ props.onChange({ reps:ex.reps+1 }); } },
          { label:'KG', val:ex.weight, dec:function(){ props.onChange({ weight:Math.max(0, +(ex.weight-2.5).toFixed(1)) }); }, inc:function(){ props.onChange({ weight:+(ex.weight+2.5).toFixed(1) }); } },
        ].map(function(f) {
          return _h('div', { key:f.label, style:{ display:'flex', flexDirection:'column', gap:4 } },
            _h('span', { style:{ fontSize:8, fontWeight:800, letterSpacing:'.1em', color:'var(--t3)' } }, f.label),
            _h('div', { style:{ display:'flex', alignItems:'center', gap:6 } }, stepBtn(f.dec,'–'), _h('span', { style:{ fontSize:14, fontWeight:800, minWidth:28, textAlign:'center', fontVariantNumeric:'tabular-nums' } }, f.val), stepBtn(f.inc,'+'))
          );
        })
      ),
      _h('div', { style:{ display:'flex', flexDirection:'column', gap:5 } },
        _h('span', { style:{ fontSize:8, fontWeight:800, letterSpacing:'.1em', color:'var(--t3)' } }, 'RIR — ILE ZOSTAŁO W ZAPASIE'),
        _h('div', { style:{ display:'flex', gap:4 } },
          [0,1,2,3,4].map(function(r) {
            var on = (ex.rir!=null?ex.rir:2) === r;
            return _h('div', { key:r, className:'rir-seg', onClick:function(){ props.onChange({ rir:r }); },
              style: on ? { background:'color-mix(in srgb,'+RIR_COLORS[r]+' 22%, transparent)', borderColor:'color-mix(in srgb,'+RIR_COLORS[r]+' 55%, transparent)' } : null },
              _h('span', { className:'rir-seg-n', style:{ color: on ? RIR_COLORS[r] : 'var(--t2)' } }, r),
              _h('span', { className:'rir-seg-l', style:{ color: on ? RIR_COLORS[r] : 'var(--t3)' } }, RIR_LABELS[r])
            );
          })
        )
      )
    );
  }

  function AddExerciseRow(props) {
    var ns = React.useState(''); var name = ns[0], setName = ns[1];
    var names = (ET.EXERCISES_BASIC||[]).map(function(e){ return e.name; });
    function submit() { if (!name.trim()) return; props.onAdd(name.trim()); setName(''); }
    return _h('div', { style:{ display:'flex', gap:8 } },
      _h('input', { value:name, list:'plan-ex-list', placeholder:'Nazwa ćwiczenia…', onChange:function(e){ setName(e.target.value); },
        onKeyDown:function(e){ if (e.key==='Enter') submit(); },
        style:{ flex:1, background:'rgba(255,255,255,.04)', border:'1px solid rgba(255,255,255,.10)', borderRadius:12, color:'var(--t1)', padding:'9px 12px', fontSize:12.5, outline:'none' } }),
      _h('datalist', { id:'plan-ex-list' }, names.map(function(n){ return _h('option', { key:n, value:n }); })),
      _h('div', { onClick:submit, style:{ display:'flex', alignItems:'center', padding:'0 16px', borderRadius:12, cursor:'pointer', background:'rgba(59,130,246,.16)', border:'1px solid rgba(96,165,250,.32)', color:'var(--a-light)', fontSize:12, fontWeight:700 } }, '+ Dodaj ćwiczenie')
    );
  }

  function RunUnitEditor(props) {
    var u = props.unit;
    function pace(dist, dur) {
      if (!dist) return '0:00';
      var sec = Math.round(dur*60/dist);
      return Math.floor(sec/60) + ':' + String(sec%60).padStart(2,'0');
    }
    return _h('div', { style:{ display:'flex', flexDirection:'column', gap:16 } },
      _h('div', { style:{ display:'flex', flexDirection:'column', gap:6 } },
        _h('span', { style:{ fontSize:8, fontWeight:800, letterSpacing:'.1em', color:'var(--t3)' } }, 'TYP BIEGU'),
        _h('div', { style:{ display:'flex', gap:6, flexWrap:'wrap' } },
          RUN_TYPES.map(function(t) {
            var on = u.runType === t.id;
            return _h('div', { key:t.id, onClick:function(){ props.onChange({ runType:t.id }); },
              style:{ padding:'7px 13px', borderRadius:100, cursor:'pointer', fontSize:11.5, fontWeight:700,
                background: on ? 'rgba(16,185,129,.16)' : 'rgba(255,255,255,.04)', border:'1px solid ' + (on ? 'rgba(16,185,129,.36)' : 'rgba(255,255,255,.09)'), color: on ? 'var(--green)' : 'var(--t2)' } }, t.name);
          })
        )
      ),
      _h('div', { style:{ display:'flex', gap:24, flexWrap:'wrap' } },
        _h('div', { style:{ display:'flex', flexDirection:'column', gap:5 } },
          _h('span', { style:{ fontSize:8, fontWeight:800, letterSpacing:'.1em', color:'var(--t3)' } }, 'DYSTANS (KM)'),
          _h('div', { style:{ display:'flex', alignItems:'center', gap:8 } },
            stepBtn(function(){ props.onChange({ distance:Math.max(0, +(u.distance-0.5).toFixed(1)) }); }, '–'),
            _h('span', { style:{ fontSize:16, fontWeight:800, minWidth:36, textAlign:'center' } }, (u.distance||0)),
            stepBtn(function(){ props.onChange({ distance:+(u.distance+0.5).toFixed(1) }); }, '+')
          )
        ),
        _h('div', { style:{ display:'flex', flexDirection:'column', gap:5 } },
          _h('span', { style:{ fontSize:8, fontWeight:800, letterSpacing:'.1em', color:'var(--t3)' } }, 'CZAS (MIN)'),
          _h('div', { style:{ display:'flex', alignItems:'center', gap:8 } },
            stepBtn(function(){ props.onChange({ duration:Math.max(0, u.duration-5) }); }, '–'),
            _h('span', { style:{ fontSize:16, fontWeight:800, minWidth:36, textAlign:'center' } }, (u.duration||0)),
            stepBtn(function(){ props.onChange({ duration:u.duration+5 }); }, '+')
          )
        ),
        _h('div', { style:{ display:'flex', flexDirection:'column', gap:5 } },
          _h('span', { style:{ fontSize:8, fontWeight:800, letterSpacing:'.1em', color:'var(--t3)' } }, 'TEMPO'),
          _h('span', { style:{ fontSize:16, fontWeight:800 } }, pace(u.distance, u.duration) + '/km')
        )
      ),
      _h('input', { value:u.notes||'', placeholder:'Notatki (np. strefa 2)', onChange:function(e){ props.onChange({ notes:e.target.value }); },
        style:{ background:'rgba(255,255,255,.04)', border:'1px solid rgba(255,255,255,.10)', borderRadius:12, color:'var(--t1)', padding:'9px 12px', fontSize:12.5, outline:'none' } })
    );
  }

  ET.PlanModule = PlanModule;
})();
