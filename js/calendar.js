(function() {
  'use strict';
  window.ET = window.ET || {};
  var _h = React.createElement;

  var DAY_LABELS = ['Pn','Wt','Śr','Cz','Pt','So','Nd'];
  var DAY_LABELS_FULL = ['Poniedziałek','Wtorek','Środa','Czwartek','Piątek','Sobota','Niedziela'];

  var PLAN_OPTS = [
    { id:'pon_gora_sila', type:'strength', label:'Góra / Siła',  icon:'💪', color:'var(--a-light)' },
    { id:'wt_dol_sila',   type:'strength', label:'Dół / Siła',   icon:'🦵', color:'var(--a)'       },
    { id:'sr_push',       type:'strength', label:'Push',         icon:'🏋', color:'var(--orange)'  },
    { id:'czw_pull',      type:'strength', label:'Pull',         icon:'🤸', color:'var(--purple)'  },
    { id:'running',       type:'running',  label:'Bieganie',      icon:'🏃', color:'var(--green)'   },
    { id:'sauna',         type:'sauna',    label:'Sauna',         icon:'🔥', color:'var(--red)'     },
    { id:'intervals',     type:'intervals',label:'Interwały',     icon:'⏱', color:'var(--teal)'    },
    { id:'rest',          type:'rest',     label:'Odpoczynek',    icon:'😴', color:'var(--b2)'      },
  ];

  function weekStartDate(offsetWeeks) {
    var d = new Date();
    var day = d.getDay();
    var diff = day === 0 ? -6 : 1 - day;
    d.setDate(d.getDate() + diff + offsetWeeks * 7);
    d.setHours(0,0,0,0);
    return d;
  }

  function toStr(d) {
    return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
  }

  function isCompleted(store, plan, date) {
    if (!plan) return false;
    if (plan.type === 'rest') return date <= ET.dstr();
    if (plan.type === 'strength')  return (store.workouts||[]).some(function(w){ return w.date===date; });
    if (plan.type === 'running')   return (store.runs||[]).some(function(r){ return r.date===date; });
    if (plan.type === 'sauna')     return (store.saunaSessions||[]).some(function(s){ return s.date===date; });
    if (plan.type === 'intervals') return (store.intervals||[]).some(function(s){ return s.date===date; });
    return false;
  }

  // ── WEEK PLANNER ──────────────────────────────────────────────────────────
  function WeekPlanner(props) {
    var store = props.store, update = props.update, toast = props.toast;

    var wo = React.useState(0); var weekOffset = wo[0]; var setWeekOffset = wo[1];
    var as = React.useState(null); var assignDay = as[0]; var setAssignDay = as[1];
    var an = React.useState(''); var assignNote = an[0]; var setAssignNote = an[1];

    var today = ET.dstr();
    var ws = weekStartDate(weekOffset);
    var weekDays = [];
    for (var i = 0; i < 7; i++) {
      var d = new Date(ws.getTime());
      d.setDate(ws.getDate() + i);
      weekDays.push(toStr(d));
    }

    var plans = store.weekPlans || [];

    // Returns array of all plans for a date
    function plansForDay(date) { return plans.filter(function(p){ return p.date===date; }); }
    // Returns first plan (for backwards compat with color/border)
    function firstPlanForDay(date) { return plans.find(function(p){ return p.date===date; }) || null; }

    function openAssign(date) {
      setAssignDay(date);
      setAssignNote('');
    }

    function addPlan(opt) {
      var newPlan = { id:Date.now(), date:assignDay, type:opt.type, planId:opt.id, planName:opt.label, icon:opt.icon, color:opt.color, note:assignNote };
      update(function(s){
        return Object.assign({},s,{ weekPlans:(s.weekPlans||[]).concat([newPlan]) });
      });
      toast(opt.label+' dodany ✓', 'success');
      setAssignNote('');
    }

    function deleteSinglePlan(planId) {
      update(function(s){ return Object.assign({},s,{ weekPlans:(s.weekPlans||[]).filter(function(p){ return p.id!==planId; }) }); });
      toast('Plan usunięty', 'default');
    }

    function deleteAllForDay() {
      update(function(s){ return Object.assign({},s,{ weekPlans:(s.weekPlans||[]).filter(function(p){ return p.date!==assignDay; }) }); });
      toast('Wszystkie plany dnia usunięte', 'default');
      setAssignDay(null);
    }

    var wEnd = new Date(ws.getTime()); wEnd.setDate(ws.getDate()+6);
    var wLabel = ws.toLocaleDateString('pl-PL',{day:'numeric',month:'short'})+' — '+wEnd.toLocaleDateString('pl-PL',{day:'numeric',month:'short',year:'numeric'});

    // Count across all plans per day (not just one per day)
    var plannedCount = weekDays.reduce(function(t,d){ return t+plansForDay(d).filter(function(p){ return p.type!=='rest'; }).length; }, 0);
    var doneCount    = weekDays.reduce(function(t,d){ return t+plansForDay(d).filter(function(p){ return p.type!=='rest' && isCompleted(store,p,d); }).length; }, 0);
    var pct = plannedCount > 0 ? Math.round(doneCount/plannedCount*100) : 0;

    // Treningi do ukończenia tygodnia — z jednostek AKTYWNEGO planu (aktywny segment).
    // Przy kilku planach aktywny = ten, z którego pochodzi ostatnio wykonany trening.
    var weekRemaining = (function(){
      if (typeof ET.getMetaPlans !== 'function') return null;
      var metas = ET.getMetaPlans(store) || [];
      if (!metas.length) return null;
      var active = metas[0];
      var lastW = (store.workouts||[])[0];
      if (metas.length > 1 && lastW) {
        var m = metas.find(function(mp){ return (mp.units||[]).some(function(u){ return u.id===lastW.planId; }); });
        if (m) active = m;
      }
      var segs = (active.segments && active.segments.length) ? active.segments : [{ id:'seg_default' }];
      var lastSeg = segs[segs.length-1].id;
      var units = (active.units||[]).filter(function(u){ return (u.segmentId||segs[0].id)===lastSeg; });
      if (!units.length) return null;
      var runsThisWeek = (store.runs||[]).filter(function(r){ return weekDays.indexOf(r.date)!==-1; }).length;
      var runSeen = 0, doneCount = 0, remainingUnits = [];
      units.forEach(function(u){
        var done;
        if (u.unitType==='running') { done = runSeen < runsThisWeek; if (done) runSeen++; }
        else done = (store.workouts||[]).some(function(w){ return w.planId===u.id && weekDays.indexOf(w.date)!==-1; });
        if (done) doneCount++; else remainingUnits.push(u);
      });
      return { total:units.length, done:doneCount, remaining:remainingUnits.length, units:remainingUnits, planName:active.name };
    })();

    return _h('div', null,
      // ── Nav header ────────────────────────────────────────────────────────
      _h('div', { style:{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 } },
        _h('button', { className:'btn btn-ghost btn-sm', onClick:function(){ setWeekOffset(weekOffset-1); } }, '‹'),
        _h('div', { style:{ textAlign:'center' } },
          _h('div', { style:{ fontWeight:700, fontSize:'.9rem', color:'var(--t1)' } }, wLabel),
          _h('div', { style:{ fontSize:'.7rem', color:'var(--t3)', marginTop:3 } },
            weekOffset===0 ? '📅 Bieżący tydzień' : weekOffset<0 ? Math.abs(weekOffset)+' tyg. temu' : 'Za '+weekOffset+' tyg.'
          )
        ),
        _h('button', { className:'btn btn-ghost btn-sm', onClick:function(){ setWeekOffset(weekOffset+1); } }, '›')
      ),

      // ── Treningi do ukończenia tygodnia (z aktywnego planu treningowego) ──
      weekRemaining && _h('div', { className:'card', style:{ marginBottom:14, padding:'12px 16px' } },
        _h('div', { style:{ display:'flex', alignItems:'center', gap:12 } },
          _h('div', { style:{ fontSize:'1.4rem' } }, weekRemaining.remaining===0 ? '🏆' : '🏋️'),
          _h('div', { style:{ flex:1 } },
            _h('div', { style:{ fontSize:'.8rem', fontWeight:600, color:'var(--t2)' } }, 'Treningi do ukończenia tygodnia'),
            _h('div', { style:{ fontSize:'.68rem', color:'var(--t3)', marginTop:2 } },
              weekRemaining.planName+' · wykonano '+weekRemaining.done+' z '+weekRemaining.total+(weekRemaining.remaining===0?' — tydzień zaliczony!':''))
          ),
          _h('div', { style:{ fontSize:'1.5rem', fontWeight:800, color:weekRemaining.remaining===0?'var(--green)':'var(--a-light)' } }, weekRemaining.remaining)
        ),
        // Konkretne jednostki pozostałe do wykonania w tym tygodniu
        weekRemaining.units.length > 0 && _h('div', { style:{ display:'flex', gap:5, flexWrap:'wrap', marginTop:10, paddingTop:10, borderTop:'1px solid var(--b1)' } },
          weekRemaining.units.map(function(u){
            return _h('span', { key:u.id, style:{ display:'inline-flex', alignItems:'center', gap:5, fontSize:'.68rem', fontWeight:600, padding:'4px 10px', borderRadius:99, background:'var(--s3)', border:'1px solid var(--b1)', color:'var(--t2)' } },
              _h('span', null, u.unitType==='running' ? '🏃' : (u.icon||'💪')),
              u.name + (u.day ? ' ('+u.day+')' : '')
            );
          })
        )
      ),

      // ── Summary bar ───────────────────────────────────────────────────────
      plannedCount > 0 && _h('div', { className:'card', style:{ marginBottom:14, padding:'12px 16px' } },
        _h('div', { style:{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 } },
          _h('div', { style:{ fontSize:'.8rem', fontWeight:600, color:'var(--t2)' } }, 'Postęp tygodnia'),
          _h('div', { style:{ fontSize:'.8rem', fontWeight:700, color:'var(--green)' } }, doneCount+' / '+plannedCount+' treningów')
        ),
        _h('div', { style:{ height:6, borderRadius:3, background:'var(--b1)', overflow:'hidden' } },
          _h('div', { style:{ height:'100%', width:pct+'%', borderRadius:3, background:'var(--green)', transition:'width .4s' } })
        )
      ),

      // ── 7-day grid ───────────────────────────────────────────────────────
      _h('div', { style:{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:5, marginBottom:16 } },
        weekDays.map(function(date, i) {
          var dayPlans = plansForDay(date);
          var firstPlan = dayPlans[0] || null;
          var nonRest = dayPlans.filter(function(p){ return p.type!=='rest'; });
          var hasRest = dayPlans.some(function(p){ return p.type==='rest'; });
          var doneAll = nonRest.length > 0 && nonRest.every(function(p){ return isCompleted(store,p,date); });
          var doneAny = nonRest.some(function(p){ return isCompleted(store,p,date); });
          var isToday = date === today;
          var isPast  = date < today;
          var dayNum  = parseInt(date.split('-')[2], 10);

          var borderColor = isToday ? 'var(--a)' : firstPlan ? firstPlan.color : 'var(--b1)';
          var bg = isToday ? 'rgba(99,102,241,.1)' : firstPlan ? firstPlan.color+'11' : 'var(--s1)';

          return _h('div', { key:date,
            onClick:function(){ openAssign(date); },
            style:{
              borderRadius:'var(--r2)',
              border:'1.5px solid '+borderColor,
              background:bg,
              padding:'8px 3px',
              cursor:'pointer',
              textAlign:'center',
              minHeight:100,
              display:'flex', flexDirection:'column', alignItems:'center', gap:2,
              transition:'all .15s',
              position:'relative',
              opacity: isPast && dayPlans.length===0 ? 0.45 : 1,
            }
          },
            _h('div', { style:{ fontSize:'.58rem', color:isToday?'var(--a-light)':'var(--t3)', fontWeight:700, textTransform:'uppercase', letterSpacing:'.04em' } }, DAY_LABELS[i]),
            _h('div', { style:{ fontSize:'1.15rem', fontWeight:700, color:isToday?'var(--a-light)':isPast?'var(--t3)':'var(--t1)', lineHeight:1 } }, dayNum),

            // Show up to 2 plan chips
            nonRest.slice(0,2).map(function(p, pi) {
              return _h('div', { key:p.id, style:{ marginTop:pi===0?2:0 } },
                _h('div', { style:{ fontSize:'1rem' } }, p.icon),
                _h('div', { style:{ fontSize:'.42rem', color:p.color, fontWeight:700, lineHeight:1.2, maxWidth:52, wordBreak:'break-word' } }, p.planName)
              );
            }),
            nonRest.length > 2 && _h('div', { style:{ fontSize:'.5rem', color:'var(--t3)', fontWeight:700 } }, '+'+( nonRest.length-2)),

            hasRest && nonRest.length===0 && _h('div', { style:{ marginTop:4 } },
              _h('div', { style:{ fontSize:'1rem' } }, '😴'),
              _h('div', { style:{ fontSize:'.48rem', color:'var(--t3)', fontWeight:600 } }, 'Odpoczynek')
            ),

            dayPlans.length===0 && _h('div', { style:{ marginTop:'auto', fontSize:'1.1rem', color:'var(--b2)', paddingBottom:2 } }, '+'),

            nonRest.length > 0 && _h('div', { style:{
              marginTop:'auto',
              fontSize:'.5rem', fontWeight:700,
              color: doneAll ? 'var(--green)' : doneAny ? 'var(--yellow)' : isPast ? 'var(--red)' : 'var(--t3)'
            } },
              doneAll ? '✓ Zrobione' : doneAny ? '◑ W toku' : isPast ? '✗ Pominięto' : '○ Zapl.'
            )
          );
        })
      ),

      // ── Day detail: selected week summary list ─────────────────────────────
      _h('div', { className:'card', style:{ marginBottom:14 } },
        _h('div', { style:{ fontSize:'.65rem', color:'var(--t3)', fontWeight:700, textTransform:'uppercase', letterSpacing:'.06em', marginBottom:10 } }, 'Plan tygodnia'),
        weekDays.some(function(d){ return plansForDay(d).length>0; })
          ? weekDays.filter(function(d){ return plansForDay(d).length>0; }).map(function(date, idx, arr) {
              var dayDate = new Date(date+'T12:00');
              var isToday = date === today;
              var isPast  = date < today;
              var dayPlans = plansForDay(date);
              return _h('div', { key:date, style:{ padding:'8px 0', borderBottom:idx<arr.length-1?'1px solid var(--b1)':'none' } },
                _h('div', { style:{ display:'flex', alignItems:'center', gap:8, marginBottom: dayPlans.length>1?6:0 } },
                  _h('div', { style:{ width:36, textAlign:'center', flexShrink:0 } },
                    _h('div', { style:{ fontSize:'.58rem', color:'var(--t3)', fontWeight:700 } }, DAY_LABELS[(dayDate.getDay()+6)%7]),
                    _h('div', { style:{ fontSize:'.9rem', fontWeight:700, color:isToday?'var(--a-light)':'var(--t2)' } }, dayDate.getDate())
                  ),
                  _h('div', { style:{ flex:1, display:'flex', flexWrap:'wrap', gap:4 } },
                    dayPlans.map(function(p) {
                      var done = p.type!=='rest' && isCompleted(store, p, date);
                      return _h('div', { key:p.id, style:{ display:'flex', alignItems:'center', gap:6, padding:'3px 8px', borderRadius:20, background:p.color+'18', border:'1px solid '+p.color+'44' } },
                        _h('span', { style:{ fontSize:'.85rem' } }, p.icon),
                        _h('span', { style:{ fontSize:'.7rem', fontWeight:700, color:p.color } }, p.planName),
                        p.type!=='rest' && _h('span', { style:{ fontSize:'.6rem', fontWeight:700, color:done?'var(--green)':isPast?'var(--red)':'var(--t3)' } }, done?'✓':isPast?'✗':'○')
                      );
                    })
                  )
                )
              );
            })
          : _h('div', { style:{ color:'var(--t3)', fontSize:'.82rem', padding:'6px 0', textAlign:'center' } }, 'Brak zaplanowanych treningów — kliknij dzień żeby dodać')
      ),

      // ── Assign sheet ──────────────────────────────────────────────────────
      _h(ET.Sheet, { open:!!assignDay, onClose:function(){ setAssignDay(null); },
        title: assignDay ? new Date(assignDay+'T12:00').toLocaleDateString('pl-PL',{weekday:'long',day:'numeric',month:'long'}) : '' },

        assignDay && _h('div', null,

          // Existing plans for this day
          plansForDay(assignDay).length > 0 && _h('div', { style:{ marginBottom:16 } },
            _h('div', { style:{ fontSize:'.7rem', color:'var(--t3)', fontWeight:700, textTransform:'uppercase', letterSpacing:'.05em', marginBottom:8 } }, 'Zaplanowane'),
            plansForDay(assignDay).map(function(p) {
              return _h('div', { key:p.id, style:{ display:'flex', alignItems:'center', gap:10, padding:'8px 12px', marginBottom:6, borderRadius:'var(--r2)', background:p.color+'15', border:'1px solid '+p.color+'44' } },
                _h('span', { style:{ fontSize:'1.2rem' } }, p.icon),
                _h('div', { style:{ flex:1 } },
                  _h('div', { style:{ fontSize:'.82rem', fontWeight:700, color:p.color } }, p.planName),
                  p.note && _h('div', { style:{ fontSize:'.65rem', color:'var(--t3)' } }, p.note)
                ),
                _h('button', { style:{ padding:'4px 10px', borderRadius:'var(--r2)', border:'1px solid var(--red)', background:'none', color:'var(--red)', cursor:'pointer', fontSize:'.72rem', fontWeight:600 },
                  onClick:function(){ deleteSinglePlan(p.id); }
                }, '✕')
              );
            }),
            _h('button', { style:{ width:'100%', padding:'7px', background:'none', border:'1px solid var(--b1)', borderRadius:'var(--r2)', color:'var(--t3)', cursor:'pointer', fontSize:'.72rem', marginTop:4 },
              onClick:deleteAllForDay
            }, '🗑 Usuń wszystkie plany dnia')
          ),

          _h('div', { style:{ fontSize:'.75rem', fontWeight:700, color:'var(--t2)', marginBottom:10 } }, '➕ Dodaj trening do dnia'),
          _h('div', { style:{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:14 } },
            PLAN_OPTS.map(function(opt) {
              return _h('button', { key:opt.id,
                onClick:function(){ addPlan(opt); },
                style:{
                  display:'flex', alignItems:'center', gap:10, padding:'10px 14px',
                  borderRadius:'var(--r2)',
                  border:'1.5px solid var(--b1)',
                  background:'var(--s2)',
                  cursor:'pointer', textAlign:'left', transition:'all .15s'
                }
              },
                _h('span', { style:{ fontSize:'1.3rem' } }, opt.icon),
                _h('div', { style:{ fontSize:'.78rem', fontWeight:700, color:'var(--t1)' } }, opt.label)
              );
            })
          ),
          _h('div', { className:'field' },
            _h('label', null, 'Notatka do nowego (opcjonalnie)'),
            _h('input', { type:'text', placeholder:'np. lekki, po kontuzji, długi...', value:assignNote, onChange:function(e){ setAssignNote(e.target.value); } })
          )
        )
      )
    );
  }

  // ── MONTH CALENDAR ────────────────────────────────────────────────────────
  function MonthCalendar(props) {
    var store = props.store, navigate = props.navigate;
    var cs = React.useState(new Date()); var cal = cs[0], setCal = cs[1];
    var ss = React.useState(null); var sel = ss[0], setSel = ss[1];
    var y=cal.getFullYear(), m=cal.getMonth();
    var dim=new Date(y,m+1,0).getDate();
    var fdow=(new Date(y,m,1).getDay()+6)%7;
    var todayStr=ET.dstr();
    var plans=store.weekPlans||[];

    function getEvents(ds) {
      var ev=[];
      (store.workouts||[]).forEach(function(w){ if(w.date===ds) ev.push({ icon:'💪', color:'var(--a)', type:'workout', data:w }); });
      (store.runs||[]).forEach(function(r){ if(r.date===ds) ev.push({ icon:'🏃', color:'var(--green)', type:'run', data:r }); });
      (store.sleepSessions||[]).forEach(function(s){ if(s.date===ds) ev.push({ icon:'😴', color:'var(--purple)', type:'sleep', data:s }); });
      (store.saunaSessions||[]).forEach(function(s){ if(s.date===ds) ev.push({ icon:'🔥', color:'var(--orange)', type:'sauna', data:s }); });
      (store.measurements||[]).forEach(function(x){ if(x.date===ds) ev.push({ icon:'📏', color:'var(--teal)', type:'measurement', data:x }); });
      (store.competitions||[]).forEach(function(c){ if(c.date===ds) ev.push({ icon:'🏆', color:'var(--yellow)', type:'competition', data:c }); });
      return ev;
    }

    function dayPlan(ds) { return plans.find(function(p){ return p.date===ds; })||null; }

    var days=[];
    for(var i=0;i<fdow;i++) days.push(null);
    for(var d=1;d<=dim;d++) days.push(d);
    var selEvs = sel ? getEvents(sel) : [];

    function evDesc(ev) {
      if(ev.type==='workout') return ev.data.name+' · '+(ev.data.volume||0).toFixed(0)+'kg';
      if(ev.type==='run') return ev.data.distance+'km · '+ev.data.pace+'/km';
      if(ev.type==='sleep') return ev.data.duration+'h snu · Jakość '+ev.data.quality+'/10';
      if(ev.type==='sauna') return ev.data.duration+'min · '+ev.data.temp+'°C';
      if(ev.type==='measurement') return 'Pomiary: '+(ev.data.weight||'')+'kg';
      if(ev.type==='competition') return ev.data.name;
      return '';
    }

    function evRoute(type) {
      return { workout:'strength', run:'running', sleep:'sleep', sauna:'sauna', measurement:'measurements', competition:'competitions' }[type]||'dashboard';
    }

    return _h('div', null,
      _h('div', { className:'card', style:{ marginBottom:14 } },
        _h('div', { style:{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 } },
          _h('button', { className:'btn btn-ghost btn-sm', onClick:function(){ setCal(new Date(y,m-1,1)); } }, '‹'),
          _h('div', { style:{ fontWeight:700, fontSize:'.95rem' } }, cal.toLocaleDateString('pl-PL',{month:'long',year:'numeric'})),
          _h('button', { className:'btn btn-ghost btn-sm', onClick:function(){ setCal(new Date(y,m+1,1)); } }, '›')
        ),
        _h('div', { style:{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:2, marginBottom:6 } },
          DAY_LABELS.map(function(d,i){ return _h('div', { key:i, style:{ textAlign:'center', fontSize:'.6rem', color:'var(--t3)', fontWeight:700, padding:'2px' } }, d); })
        ),
        _h('div', { style:{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:2 } },
          days.map(function(d,i) {
            if(!d) return _h('div', { key:'e'+i });
            var ds=y+'-'+String(m+1).padStart(2,'0')+'-'+String(d).padStart(2,'0');
            var evs=getEvents(ds);
            var plan=dayPlan(ds);
            var isT=ds===todayStr, isS=ds===sel;
            return _h('div', { key:ds, onClick:function(){ setSel(ds===sel?null:ds); }, style:{
              minHeight:52, borderRadius:6, padding:'4px 3px', cursor:'pointer',
              background:isS?'var(--a-dim,rgba(99,102,241,.15))':isT?'var(--s3)':'transparent',
              border:'1px solid '+(isS?'var(--a)':isT?'var(--b2)':plan?plan.color+'55':'transparent'),
              transition:'all .1s'
            } },
              _h('div', { style:{ fontSize:'.72rem', fontWeight:isT?700:400, color:isT?'var(--a-light)':'var(--t2)', textAlign:'center', marginBottom:2 } }, d),
              plan && _h('div', { style:{ fontSize:'.5rem', textAlign:'center', marginBottom:2 } }, plan.icon),
              _h('div', { style:{ display:'flex', flexWrap:'wrap', gap:2, justifyContent:'center' } },
                evs.slice(0,3).map(function(e,ei){ return _h('div', { key:ei, style:{ width:5, height:5, borderRadius:'50%', background:e.color } }); }),
                evs.length>3 && _h('div', { style:{ fontSize:'.42rem', color:'var(--t3)' } }, '+'+( evs.length-3))
              )
            );
          })
        )
      ),

      sel && _h('div', { className:'card fade-in' },
        _h('div', { style:{ fontWeight:700, marginBottom:12 } }, new Date(sel+'T12:00').toLocaleDateString('pl-PL',{weekday:'long',day:'numeric',month:'long'})),
        selEvs.length===0
          ? _h('div', { style:{ color:'var(--t3)', fontSize:'.85rem', padding:'8px 0' } }, 'Brak aktywności tego dnia')
          : selEvs.map(function(e,i) {
              return _h('div', { key:i, style:{ display:'flex', alignItems:'center', gap:12, padding:'10px 0', borderBottom:i<selEvs.length-1?'1px solid var(--b1)':'none', cursor:'pointer' }, onClick:function(){ navigate(evRoute(e.type)); } },
                _h('div', { style:{ width:7, height:7, borderRadius:'50%', background:e.color, flexShrink:0 } }),
                _h('span', { style:{ fontSize:'.95rem' } }, e.icon),
                _h('div', { style:{ flex:1 } },
                  _h('div', { style:{ fontSize:'.85rem', fontWeight:600 } }, evDesc(e)),
                  _h('div', { style:{ fontSize:'.65rem', color:'var(--t3)' } }, e.type)
                ),
                _h('span', { style:{ color:'var(--t3)', fontSize:'.8rem' } }, '→')
              );
            })
      )
    );
  }

  // ── CALENDAR MODULE (root) ─────────────────────────────────────────────────
  // Klasyczny widok — bez zmian (fallback, web faktycznie używa
  // WebCalendarModule). Patrz dispatcher `CalendarModule` i
  // `CalendarModuleMobile` poniżej.
  function CalendarModuleClassic() {
    var su = ET.useStore(); var store = su.store, update = su.update;
    var toast = ET.useToast();
    var nav = ET.useNav(); var navigate = nav.navigate;
    var tv = React.useState('week'); var activeTab = tv[0]; var setActiveTab = tv[1];

    return _h('div', { className:'fade-in' },
      _h('div', { className:'page-hdr' },
        _h('h1', null, '📅 Kalendarz'),
        _h('div', null)
      ),

      // Tab bar
      _h('div', { style:{ display:'flex', gap:0, borderRadius:'var(--r2)', overflow:'hidden', border:'1px solid var(--b1)', marginBottom:18, width:'fit-content' } },
        _h('button', {
          style:{ padding:'8px 22px', fontSize:'.8rem', fontWeight:700, background:activeTab==='week'?'var(--a)':'var(--s2)', color:activeTab==='week'?'white':'var(--t2)', border:'none', cursor:'pointer', transition:'all .15s' },
          onClick:function(){ setActiveTab('week'); }
        }, '🗓 Planer tygodniowy'),
        _h('button', {
          style:{ padding:'8px 22px', fontSize:'.8rem', fontWeight:700, background:activeTab==='month'?'var(--a)':'var(--s2)', color:activeTab==='month'?'white':'var(--t2)', border:'none', cursor:'pointer', transition:'all .15s' },
          onClick:function(){ setActiveTab('month'); }
        }, '📆 Miesiąc')
      ),

      activeTab === 'week'  && _h(WeekPlanner,    { store:store, update:update, toast:toast }),
      activeTab === 'month' && _h(MonthCalendar,   { store:store, navigate:navigate })
    );
  }

  // Web zostaje przy widoku klasycznym; iOS dostaje redesign „Aurora Glass".
  function CalendarModule() {
    return ET.IS_WEB ? _h(CalendarModuleClassic, null) : _h(CalendarModuleMobile, null);
  }

  var CAL_STATUS_DOT = { pon_gora_sila:'var(--a-light)', wt_dol_sila:'var(--a)', sr_push:'var(--orange)', czw_pull:'var(--purple)',
    running:'var(--green)', sauna:'var(--red)', intervals:'var(--teal)', rest:'var(--b2)' };

  // ── PLAN TYGODNIA (iOS) — redesign „Aurora Glass" ─────────────────────────
  // Handoff sekcja 10: 7 wierszy (skrót dnia+numer, pasek koloru modułu,
  // nazwa, meta, plakietka statusu ZROBIONE/DZIŚ/PLAN/WOLNE). Arkusz
  // przypisania treningu do dnia NIE jest objęty makietą — reużyty wprost
  // z `WeekPlanner` (ta sama logika `plansForDay`/`addPlan`/`isCompleted`).
  // Widok miesięczny zostaje dostępny jako drugi tab (poza makietą, real
  // funkcja) — reużywa niezmieniony `MonthCalendar`.
  // Odstępstwo: design ma „Kartę postępu bloku" z 12 segmentami periodyzacji
  // (progresja/deload) — wymagałoby to bezpiecznego dostępu do prywatnej
  // logiki `periodInfo`/`findPeriodBlock` z strength.js (nieeksportowanej
  // jako ET.*, tylko `ET.getMetaPlans` jest publiczne). Replikowanie tej
  // matematyki na skróty ryzykowałoby subtelny błąd w liczeniu tygodnia
  // bloku — pominięte w tym przebiegu, zamiast tego zostaje już istniejąca,
  // realna karta „Treningi do ukończenia tygodnia" (z aktywnego meta-planu).
  function CalendarModuleMobile() {
    var su = ET.useStore(); var store = su.store, update = su.update;
    var toast = ET.useToast();
    var nav = ET.useNav();
    var tv = React.useState('week'); var activeTab = tv[0], setActiveTab = tv[1];

    var wo = React.useState(0); var weekOffset = wo[0], setWeekOffset = wo[1];
    var as = React.useState(null); var assignDay = as[0], setAssignDay = as[1];
    var an = React.useState(''); var assignNote = an[0], setAssignNote = an[1];

    var today = ET.dstr();
    var ws = weekStartDate(weekOffset);
    var weekDays = [];
    for (var i = 0; i < 7; i++) { var d = new Date(ws.getTime()); d.setDate(ws.getDate()+i); weekDays.push(toStr(d)); }
    var plans = store.weekPlans || [];
    function plansForDay(date) { return plans.filter(function(p){ return p.date===date; }); }

    function openAssign(date) { setAssignDay(date); setAssignNote(''); }
    function addPlan(opt) {
      var newPlan = { id:Date.now(), date:assignDay, type:opt.type, planId:opt.id, planName:opt.label, icon:opt.icon, color:opt.color, note:assignNote };
      update(function(s){ return Object.assign({},s,{ weekPlans:(s.weekPlans||[]).concat([newPlan]) }); });
      toast(opt.label+' dodany ✓', 'success');
      setAssignNote('');
    }
    function deleteSinglePlan(planId) {
      update(function(s){ return Object.assign({},s,{ weekPlans:(s.weekPlans||[]).filter(function(p){ return p.id!==planId; }) }); });
      toast('Plan usunięty', 'default');
    }
    function deleteAllForDay() {
      update(function(s){ return Object.assign({},s,{ weekPlans:(s.weekPlans||[]).filter(function(p){ return p.date!==assignDay; }) }); });
      toast('Wszystkie plany dnia usunięte', 'default');
      setAssignDay(null);
    }

    var wEnd = new Date(ws.getTime()); wEnd.setDate(ws.getDate()+6);
    var wLabel = ws.toLocaleDateString('pl-PL',{day:'numeric',month:'short'})+' — '+wEnd.toLocaleDateString('pl-PL',{day:'numeric',month:'short',year:'numeric'});

    // Treningi do ukończenia tygodnia — z aktywnego meta-planu (realna dana,
    // ta sama logika co w klasycznym WeekPlanner).
    var weekRemaining = (function(){
      if (typeof ET.getMetaPlans !== 'function') return null;
      var metas = ET.getMetaPlans(store) || [];
      if (!metas.length) return null;
      var active = metas[0];
      var lastW = (store.workouts||[])[0];
      if (metas.length > 1 && lastW) {
        var m = metas.find(function(mp){ return (mp.units||[]).some(function(u){ return u.id===lastW.planId; }); });
        if (m) active = m;
      }
      var segs = (active.segments && active.segments.length) ? active.segments : [{ id:'seg_default' }];
      var lastSeg = segs[segs.length-1].id;
      var units = (active.units||[]).filter(function(u){ return (u.segmentId||segs[0].id)===lastSeg; });
      if (!units.length) return null;
      var runsThisWeek = (store.runs||[]).filter(function(r){ return weekDays.indexOf(r.date)!==-1; }).length;
      var runSeen = 0, doneCount = 0;
      units.forEach(function(u){
        var done;
        if (u.unitType==='running') { done = runSeen < runsThisWeek; if (done) runSeen++; }
        else done = (store.workouts||[]).some(function(w){ return w.planId===u.id && weekDays.indexOf(w.date)!==-1; });
        if (done) doneCount++;
      });
      return { total:units.length, done:doneCount, remaining:units.length-doneCount, planName:active.name };
    })();

    return _h('div', { className:'scr-in' },
      _h('div', { style:{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 } },
        _h('div', { style:{ fontSize:27, fontWeight:800, letterSpacing:'-.03em' } }, 'Plan'),
        _h('div', { style:{ display:'flex', gap:6, borderRadius:12, overflow:'hidden', border:'1px solid var(--b1)' } },
          _h('button', { onClick:function(){ setActiveTab('week'); },
            style:{ padding:'7px 14px', fontSize:11.5, fontWeight:700, border:'none', cursor:'pointer',
              background: activeTab==='week' ? 'var(--a-light)' : 'var(--s2)', color: activeTab==='week' ? 'var(--bg)' : 'var(--t2)' } }, 'Tydzień'),
          _h('button', { onClick:function(){ setActiveTab('month'); },
            style:{ padding:'7px 14px', fontSize:11.5, fontWeight:700, border:'none', cursor:'pointer',
              background: activeTab==='month' ? 'var(--a-light)' : 'var(--s2)', color: activeTab==='month' ? 'var(--bg)' : 'var(--t2)' } }, 'Miesiąc')
        )
      ),

      activeTab === 'month' && _h(MonthCalendar, { store:store, navigate:nav.navigate }),

      activeTab === 'week' && _h(React.Fragment, null,
        _h('div', { style:{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 } },
          _h('button', { onClick:function(){ setWeekOffset(weekOffset-1); },
            style:{ width:32, height:32, borderRadius:'50%', border:'1px solid var(--b1)', background:'var(--s2)', color:'var(--t2)', cursor:'pointer' } }, '‹'),
          _h('div', { style:{ textAlign:'center' } },
            _h('div', { style:{ fontSize:13, fontWeight:700 } }, wLabel),
            _h('div', { style:{ fontSize:10.5, color:'var(--t3)', marginTop:2 } },
              weekOffset===0 ? 'Bieżący tydzień' : weekOffset<0 ? Math.abs(weekOffset)+' tyg. temu' : 'Za '+weekOffset+' tyg.')
          ),
          _h('button', { onClick:function(){ setWeekOffset(weekOffset+1); },
            style:{ width:32, height:32, borderRadius:'50%', border:'1px solid var(--b1)', background:'var(--s2)', color:'var(--t2)', cursor:'pointer' } }, '›')
        ),

        weekRemaining && _h('div', { className:'glass', style:{ padding:16, borderRadius:18, marginBottom:16 } },
          _h('div', { style:{ display:'flex', alignItems:'center', gap:12 } },
            _h('span', { style:{ fontSize:22 } }, weekRemaining.remaining===0 ? '🏆' : '🏋️'),
            _h('div', { style:{ flex:1, minWidth:0 } },
              _h('div', { style:{ fontSize:12.5, fontWeight:700 } }, weekRemaining.planName),
              _h('div', { style:{ fontSize:11, color:'var(--t3)', marginTop:2 } },
                'Wykonano ' + weekRemaining.done + ' z ' + weekRemaining.total + (weekRemaining.remaining===0 ? ' — tydzień zaliczony!' : ''))
            ),
            _h('span', { style:{ fontSize:19, fontWeight:800, color: weekRemaining.remaining===0 ? 'var(--green)' : 'var(--a-light)' } }, weekRemaining.remaining)
          )
        ),

        // ── 7 WIERSZY DNI ──────────────────────────────────────────────
        _h('div', { style:{ display:'flex', flexDirection:'column', gap:8 } },
          weekDays.map(function(date, i) {
            var dayPlans = plansForDay(date);
            var nonRest = dayPlans.filter(function(p){ return p.type!=='rest'; });
            var hasRest = dayPlans.some(function(p){ return p.type==='rest'; });
            var doneAll = nonRest.length > 0 && nonRest.every(function(p){ return isCompleted(store,p,date); });
            var doneAny = nonRest.some(function(p){ return isCompleted(store,p,date); });
            var isToday = date === today, isPast = date < today;
            var dayNum = parseInt(date.split('-')[2], 10);
            var main = nonRest[0] || null;
            var barColor = main ? main.color : hasRest ? 'var(--b2)' : 'var(--b1)';

            var status = !main && !hasRest ? { l:'WOLNE', c:'var(--t3)', bg:'var(--s2)' }
              : doneAll ? { l:'ZROBIONE', c:'var(--green)', bg:'rgba(16,185,129,.12)' }
              : isToday ? { l:'DZIŚ', c:'var(--a-light)', bg:'rgba(96,165,250,.14)' }
              : doneAny ? { l:'W TOKU', c:'var(--yellow)', bg:'rgba(245,158,11,.12)' }
              : isPast ? { l:'POMINIĘTE', c:'var(--red)', bg:'rgba(239,68,68,.10)' }
              : { l:'PLAN', c:'var(--t2)', bg:'var(--s2)' };

            return _h('div', { key:date, onClick:function(){ openAssign(date); },
              style:{ display:'flex', alignItems:'center', gap:12, padding:'12px 14px', borderRadius:16, cursor:'pointer',
                background: isToday ? 'rgba(96,165,250,.08)' : 'var(--s2)',
                border:'1px solid ' + (isToday ? 'rgba(96,165,250,.3)' : 'var(--b1)') } },
              _h('div', { style:{ width:34, textAlign:'center', flexShrink:0 } },
                _h('div', { style:{ fontSize:9, fontWeight:800, color: isToday?'var(--a-light)':'var(--t3)', letterSpacing:'.04em' } }, DAY_LABELS[i]),
                _h('div', { style:{ fontSize:15, fontWeight:800, color: isToday?'var(--a-light)':isPast?'var(--t3)':'var(--t1)', marginTop:2 } }, dayNum)
              ),
              _h('div', { style:{ width:3, height:34, borderRadius:2, background:barColor, flexShrink:0 } }),
              _h('div', { style:{ flex:1, minWidth:0 } },
                _h('div', { style:{ fontSize:13, fontWeight:700, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' } },
                  main ? main.planName : hasRest ? 'Odpoczynek' : 'Brak planu'),
                _h('div', { style:{ fontSize:10.5, color:'var(--t3)', marginTop:2 } },
                  nonRest.length>1 ? '+' + (nonRest.length-1) + ' więcej' : (main && main.note) || '')
              ),
              _h('span', { style:{ fontSize:9, fontWeight:800, letterSpacing:'.06em', padding:'4px 9px', borderRadius:100, flexShrink:0, background:status.bg, color:status.c } }, status.l)
            );
          })
        ),

        _h(ET.Sheet, { open:!!assignDay, onClose:function(){ setAssignDay(null); },
          title: assignDay ? new Date(assignDay+'T12:00').toLocaleDateString('pl-PL',{weekday:'long',day:'numeric',month:'long'}) : '' },
          assignDay && _h('div', null,
            plansForDay(assignDay).length > 0 && _h('div', { style:{ marginBottom:16 } },
              _h('div', { style:{ fontSize:'.7rem', color:'var(--t3)', fontWeight:700, textTransform:'uppercase', letterSpacing:'.05em', marginBottom:8 } }, 'Zaplanowane'),
              plansForDay(assignDay).map(function(p) {
                return _h('div', { key:p.id, style:{ display:'flex', alignItems:'center', gap:10, padding:'8px 12px', marginBottom:6, borderRadius:'var(--r2)', background:p.color+'15', border:'1px solid '+p.color+'44' } },
                  _h('span', { style:{ fontSize:'1.2rem' } }, p.icon),
                  _h('div', { style:{ flex:1 } },
                    _h('div', { style:{ fontSize:'.82rem', fontWeight:700, color:p.color } }, p.planName),
                    p.note && _h('div', { style:{ fontSize:'.65rem', color:'var(--t3)' } }, p.note)
                  ),
                  _h('button', { style:{ padding:'4px 10px', borderRadius:'var(--r2)', border:'1px solid var(--red)', background:'none', color:'var(--red)', cursor:'pointer', fontSize:'.72rem', fontWeight:600 },
                    onClick:function(){ deleteSinglePlan(p.id); } }, '✕')
                );
              }),
              _h('button', { style:{ width:'100%', padding:'7px', background:'none', border:'1px solid var(--b1)', borderRadius:'var(--r2)', color:'var(--t3)', cursor:'pointer', fontSize:'.72rem', marginTop:4 },
                onClick:deleteAllForDay }, '🗑 Usuń wszystkie plany dnia')
            ),
            _h('div', { style:{ fontSize:'.75rem', fontWeight:700, color:'var(--t2)', marginBottom:10 } }, '➕ Dodaj trening do dnia'),
            _h('div', { style:{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:14 } },
              PLAN_OPTS.map(function(opt) {
                return _h('button', { key:opt.id, onClick:function(){ addPlan(opt); },
                  style:{ display:'flex', alignItems:'center', gap:10, padding:'10px 14px', borderRadius:'var(--r2)', border:'1.5px solid var(--b1)', background:'var(--s2)', cursor:'pointer', textAlign:'left' } },
                  _h('span', { style:{ fontSize:'1.3rem' } }, opt.icon),
                  _h('div', { style:{ fontSize:'.78rem', fontWeight:700, color:'var(--t1)' } }, opt.label)
                );
              })
            ),
            _h('div', { className:'field' },
              _h('label', null, 'Notatka do nowego (opcjonalnie)'),
              _h('input', { type:'text', placeholder:'np. lekki, po kontuzji, długi...', value:assignNote, onChange:function(e){ setAssignNote(e.target.value); } })
            )
          )
        )
      )
    );
  }

  ET.CalendarModule = CalendarModule;

  // ══════════════════════════════════════════════════════════════════════
  // WEB — ekran „Kalendarz" wg designu „EasyTraining Aplikacja".
  // Spec: docs/segment-04-kalendarz.md. Tylko do czytania — planowanie ma
  // jedno miejsce (ekran Plan, js/plan.js). Reużywa lokalny isCompleted()
  // z tego samego closure; nie kopiuje starego MonthCalendar/WeekPlanner
  // (WeekPlanner zostaje częścią mobilnego CalendarModule — na webie jego
  // rolę pełni tydzień „strip" w module Plan).
  // ══════════════════════════════════════════════════════════════════════

  var EV_COLORS = { workout:'var(--a-light)', run:'var(--green)', sauna:'var(--orange)', intervals:'var(--a-light)',
    sleep:'var(--purple)', measurement:'var(--teal)', pain:'var(--red)', competition:'var(--yellow)' };
  var EV_ICONS = { workout:'💪', run:'🏃', sauna:'🔥', intervals:'⏱', sleep:'😴', measurement:'📏', pain:'🩹', competition:'🏆' };
  var CAL_LEGEND = [
    { name:'Trening', color:'var(--a-light)' }, { name:'Sen', color:'var(--purple)' },
    { name:'Pomiary', color:'var(--teal)' }, { name:'Ból', color:'var(--red)' },
    { name:'Bieg', color:'var(--green)' }, { name:'Sauna', color:'var(--orange)' }, { name:'Zawody', color:'var(--yellow)' },
  ];
  var SECTION_LABEL = { fontSize:9, fontWeight:800, lineHeight:1, letterSpacing:'.14em', color:'var(--t3)' };

  function webMonthEvents(store, ds) {
    var ev = [];
    (store.workouts||[]).forEach(function(w){ if(w.date===ds) ev.push({ type:'workout', color:EV_COLORS.workout, icon:EV_ICONS.workout, name:w.name||'Trening', meta:(w.volume||0).toFixed(0)+' kg objętości' }); });
    (store.runs||[]).forEach(function(r){ if(r.date===ds) ev.push({ type:'run', color:EV_COLORS.run, icon:EV_ICONS.run, name:'Bieg '+(r.distance||0)+' km', meta:(r.pace||'')+'/km' }); });
    (store.saunaSessions||[]).forEach(function(s){ if(s.date===ds) ev.push({ type:'sauna', color:EV_COLORS.sauna, icon:EV_ICONS.sauna, name:'Sauna '+(s.duration||0)+' min', meta:(s.temp||'')+'°C' }); });
    (store.intervals||[]).forEach(function(s){ if(s.date===ds) ev.push({ type:'intervals', color:EV_COLORS.intervals, icon:EV_ICONS.intervals, name:'Interwały', meta:'' }); });
    (store.sleepSessions||[]).forEach(function(s){ if(s.date===ds) ev.push({ type:'sleep', color:EV_COLORS.sleep, icon:EV_ICONS.sleep, name:(s.duration||0)+'h snu', meta:'Jakość '+(s.quality||'—')+'/10' }); });
    (store.measurements||[]).forEach(function(x){ if(x.date===ds) ev.push({ type:'measurement', color:EV_COLORS.measurement, icon:EV_ICONS.measurement, name:'Pomiary', meta:x.weight?x.weight+' kg':'' }); });
    (store.painEntries||[]).forEach(function(p){ if(p.date===ds) ev.push({ type:'pain', color:EV_COLORS.pain, icon:EV_ICONS.pain, name:p.bodyPart||'Ból', meta:p.level+'/10' }); });
    (store.competitions||[]).forEach(function(c){ if(c.date===ds) ev.push({ type:'competition', color:EV_COLORS.competition, icon:EV_ICONS.competition, name:c.name||'Start', meta:'' }); });
    return ev;
  }
  function webEvRoute(type) {
    return { workout:'strength', run:'running', sleep:'sleep', sauna:'sauna', measurement:'measurements', competition:'competitions', pain:'pain', intervals:'intervals' }[type] || 'dashboard';
  }
  function webDayPlans(store, ds) { return (store.weekPlans||[]).filter(function(p){ return p.date===ds; }); }
  function webDayStatus(store, ds, dayPlans, dayEvents, today) {
    var nonRest = dayPlans.filter(function(p){ return p.type!=='rest'; });
    var hasRest = dayPlans.some(function(p){ return p.type==='rest'; });
    if (nonRest.length) {
      var anyDone = nonRest.some(function(p){ return isCompleted(store, p, ds); });
      if (anyDone) return { text:'✓ ZROB.', color:'var(--green)' };
      if (ds < today) return { text:'✗ POMIN.', color:'var(--red)' };
      return { text:'○ PLAN', color:'var(--t3)' };
    }
    if (hasRest) return { text:'WOLNE', color:'var(--t3)', dim:true };
    if (dayEvents.length) return { text:'+ EXTRA', color:'var(--teal)' };
    return null;
  }

  function WebCalendarModule() {
    var su = ET.useStore(); var store = su.store;
    var nav = ET.useNav(); var navigate = nav.navigate;
    var today = ET.dstr();

    var cs = React.useState(new Date()); var cal = cs[0], setCal = cs[1];
    var vw = React.useState('grid'); var view = vw[0], setView = vw[1]; // 'grid' | 'heat'
    var y = cal.getFullYear(), m = cal.getMonth();
    var dim = new Date(y, m+1, 0).getDate();
    var fdow = (new Date(y, m, 1).getDay()+6) % 7;
    var monthPrefix = y+'-'+String(m+1).padStart(2,'0')+'-';

    var ds0 = monthPrefix+'01', dsToday = today.indexOf(monthPrefix)===0 ? today : null;
    var sd = React.useState(dsToday || ds0); var selDate = sd[0], setSelDate = sd[1];
    function changeMonth(delta) {
      var nc = new Date(y, m+delta, 1); setCal(nc);
      var np = nc.getFullYear()+'-'+String(nc.getMonth()+1).padStart(2,'0')+'-';
      var nt = today.indexOf(np)===0 ? today : np+'01';
      setSelDate(nt);
    }

    var days = []; for (var i=0;i<fdow;i++) days.push(null); for (var d=1;d<=dim;d++) days.push(d);

    // ── STATYSTYKI MIESIĄCA ──
    var stats = React.useMemo(function() {
      var planned = (store.weekPlans||[]).filter(function(p){ return p.date.indexOf(monthPrefix)===0 && p.type!=='rest'; });
      var pastPlanned = planned.filter(function(p){ return p.date <= today; });
      var doneOfPast = pastPlanned.filter(function(p){ return isCompleted(store, p, p.date); });
      var compliance = pastPlanned.length ? Math.round(doneOfPast.length/pastPlanned.length*100) : null;

      var sessionTypes = [
        (store.workouts||[]).map(function(w){ return { date:w.date, type:'strength' }; }),
        (store.runs||[]).map(function(r){ return { date:r.date, type:'running' }; }),
        (store.saunaSessions||[]).map(function(s){ return { date:s.date, type:'sauna' }; }),
        (store.intervals||[]).map(function(s){ return { date:s.date, type:'intervals' }; }),
      ].reduce(function(a,b){ return a.concat(b); }, []).filter(function(s){ return s.date && s.date.indexOf(monthPrefix)===0; });
      var ofPlan = sessionTypes.filter(function(s){ return planned.some(function(p){ return p.date===s.date && p.type===s.type; }); }).length;
      var outOfPlan = sessionTypes.length - ofPlan;

      var volume = (store.workouts||[]).filter(function(w){ return w.date && w.date.indexOf(monthPrefix)===0; }).reduce(function(a,w){ return a+(+w.volume||0); }, 0);

      return { planned:planned.length, sessions:sessionTypes.length, ofPlan:ofPlan, outOfPlan:outOfPlan, compliance:compliance, pastPlannedCount:pastPlanned.length, volume:volume };
    }, [store.weekPlans, store.workouts, store.runs, store.saunaSessions, store.intervals, monthPrefix]);

    var complianceColor = stats.compliance==null ? 'var(--t3)' : stats.compliance>=80 ? 'var(--green)' : stats.compliance>=50 ? 'var(--yellow)' : 'var(--red)';

    // ── SIATKA ──
    var cells = React.useMemo(function() {
      return days.map(function(dnum) {
        if (!dnum) return null;
        var ds = monthPrefix+String(dnum).padStart(2,'0');
        var dayPlans = webDayPlans(store, ds);
        var dayEvents = webMonthEvents(store, ds);
        var status = webDayStatus(store, ds, dayPlans, dayEvents, today);
        return { ds:ds, num:dnum, plans:dayPlans, events:dayEvents, status:status, isToday:ds===today, isPast:ds<today };
      });
    }, [store.weekPlans, store.workouts, store.runs, store.saunaSessions, store.intervals, store.sleepSessions, store.measurements, store.painEntries, store.competitions, monthPrefix]);

    var maxVol = cells.reduce(function(m,c){ if(!c) return m; var v=(store.workouts||[]).filter(function(w){return w.date===c.ds;}).reduce(function(a,w){return a+(+w.volume||0);},0); return Math.max(m,v); }, 0);

    var selCell = cells.find(function(c){ return c && c.ds===selDate; });
    var selPlans = selCell ? selCell.plans.filter(function(p){ return p.type!=='rest'; }) : [];
    var selEvents = selCell ? selCell.events : [];

    return _h('div', { className:'scr-in', style:{ display:'flex', flexDirection:'column', gap:18 } },

      _h('div', { style:{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:14, flexWrap:'wrap' } },
        _h('div', { style:{ display:'flex', alignItems:'center', gap:10 } },
          _h('div', { onClick:function(){ changeMonth(-1); }, style:{ width:32, height:32, borderRadius:11, background:'rgba(255,255,255,.05)', border:'1px solid rgba(255,255,255,.10)', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:'var(--t2)' } },
            _h('svg', { width:15, height:15, viewBox:'0 0 24 24', fill:'none', stroke:'currentColor', strokeWidth:2.4, strokeLinecap:'round', strokeLinejoin:'round' }, _h('path', { d:'M15 5l-7 7 7 7' }))),
          _h('div', { style:{ display:'flex', flexDirection:'column', gap:4, minWidth:170 } },
            _h('span', { style:{ fontSize:17, fontWeight:800, letterSpacing:'-.028em', textTransform:'capitalize' } }, cal.toLocaleDateString('pl-PL',{ month:'long', year:'numeric' })),
            _h('span', { style:{ fontSize:10, fontWeight:600, color:'var(--t3)' } }, stats.planned+' zaplanowanych · '+stats.sessions+' sesji')
          ),
          _h('div', { onClick:function(){ changeMonth(1); }, style:{ width:32, height:32, borderRadius:11, background:'rgba(255,255,255,.05)', border:'1px solid rgba(255,255,255,.10)', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:'var(--t2)' } },
            _h('svg', { width:15, height:15, viewBox:'0 0 24 24', fill:'none', stroke:'currentColor', strokeWidth:2.4, strokeLinecap:'round', strokeLinejoin:'round' }, _h('path', { d:'M9 5l7 7-7 7' })))
        ),
        _h('div', { style:{ display:'flex', gap:4, padding:4, borderRadius:13, background:'rgba(255,255,255,.04)', border:'1px solid rgba(255,255,255,.08)' } },
          [{ id:'grid', name:'Siatka miesiąca' }, { id:'heat', name:'Mapa objętości' }].map(function(t) {
            var on = view === t.id;
            return _h('div', { key:t.id, onClick:function(){ setView(t.id); },
              style:{ padding:'8px 13px', borderRadius:10, cursor:'pointer', fontSize:11.5, fontWeight:700, color: on ? 'var(--a-light)' : 'var(--t3)', background: on ? 'rgba(59,130,246,.16)' : 'transparent' } }, t.name);
          })
        )
      ),

      _h('div', { style:{ display:'flex', gap:9, flexWrap:'wrap' } },
        [
          { label:'ZAPLANOWANE', val:stats.planned, sub:'w tym miesiącu', color:'var(--a-light)' },
          { label:'WYKONANE', val:stats.sessions, sub:stats.ofPlan+' z planu · '+stats.outOfPlan+' poza planem', color:'var(--t1)' },
          { label:'ZGODNOŚĆ', val: stats.compliance==null ? '—' : stats.compliance+'%', sub: stats.pastPlannedCount ? 'z '+stats.pastPlannedCount+' minionych planów' : 'brak minionych planów', color:complianceColor },
          { label:'OBJĘTOŚĆ', val: stats.volume>=1000 ? (stats.volume/1000).toFixed(1).replace('.',',')+' t' : Math.round(stats.volume)+' kg', sub:'suma treningów siłowych', color:'var(--purple)' },
        ].map(function(s) {
          return _h('div', { key:s.label, style:{ flex:'1 1 150px', display:'flex', flexDirection:'column', gap:7, padding:'15px 17px', borderRadius:18, background:'rgba(255,255,255,.04)', border:'1px solid rgba(255,255,255,.08)' } },
            _h('span', { style:SECTION_LABEL }, s.label),
            _h('span', { style:{ fontSize:24, fontWeight:800, letterSpacing:'-.04em', fontVariantNumeric:'tabular-nums', color:s.color } }, s.val),
            _h('span', { style:{ fontSize:9.5, fontWeight:600, color:'var(--t3)' } }, s.sub)
          );
        })
      ),

      _h('div', { style:{ display:'flex', gap:16, alignItems:'flex-start', flexWrap:'wrap' } },

        _h('div', { className:'glass', style:{ flex:'1 1 480px', minWidth:400, display:'flex', flexDirection:'column', gap:12, padding:20, borderRadius:22 } },
          _h('div', { style:{ display:'grid', gridTemplateColumns:'repeat(7,minmax(0,1fr))', gap:6 } },
            DAY_LABELS.map(function(w,i){ return _h('span', { key:i, style:{ textAlign:'center', fontSize:8.5, fontWeight:800, letterSpacing:'.12em', color:'var(--t3)' } }, w); })
          ),

          view === 'grid'
            ? _h('div', { style:{ display:'grid', gridTemplateColumns:'repeat(7,minmax(0,1fr))', gap:6 } },
                cells.map(function(c, i) {
                  if (!c) return _h('div', { key:'e'+i });
                  var sel = c.ds === selDate;
                  return _h('div', { key:c.ds, onClick:function(){ setSelDate(c.ds); },
                    style:{ display:'flex', flexDirection:'column', gap:5, minHeight:78, padding:'7px 6px', borderRadius:13, cursor:'pointer',
                      background: sel ? 'rgba(59,130,246,.12)' : c.isToday ? 'rgba(255,255,255,.045)' : 'transparent',
                      border:'1px solid ' + (sel ? 'rgba(96,165,250,.4)' : c.isToday ? 'rgba(96,165,250,.28)' : 'rgba(255,255,255,.06)'),
                      opacity: c.isPast && !c.plans.length && !c.events.length ? .5 : 1 } },
                    _h('div', { style:{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:4 } },
                      _h('span', { style:{ fontSize:12.5, fontWeight:800, fontVariantNumeric:'tabular-nums', color: c.isToday ? 'var(--a-light)' : 'var(--t1)' } }, c.num),
                      _h('span', { style:{ fontSize:10 } }, c.plans.filter(function(p){ return p.type!=='rest'; }).slice(0,2).map(function(p){ return p.icon; }).join(''))
                    ),
                    _h('div', { style:{ display:'flex', gap:3, flexWrap:'wrap' } },
                      c.events.slice(0,3).map(function(e,ei){ return _h('span', { key:ei, style:{ width:6, height:6, borderRadius:'50%', background:e.color } }); })
                    ),
                    c.status && _h('span', { style:{ marginTop:'auto', fontSize:7.5, fontWeight:800, letterSpacing:'.06em', color:c.status.color, opacity: c.status.dim?0.6:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' } }, c.status.text)
                  );
                })
              )
            : _h('div', { style:{ display:'flex', flexDirection:'column', gap:8 } },
                _h('div', { style:{ display:'grid', gridTemplateColumns:'repeat(7,minmax(0,1fr))', gap:6 } },
                  cells.map(function(c, i) {
                    if (!c) return _h('div', { key:'e'+i });
                    var vol = (store.workouts||[]).filter(function(w){ return w.date===c.ds; }).reduce(function(a,w){ return a+(+w.volume||0); }, 0);
                    var hasOtherEvent = c.events.some(function(e){ return e.type!=='workout'; });
                    var heatBg, heatNum;
                    if (vol > 0) {
                      var ratio = maxVol > 0 ? vol/maxVol : 0;
                      var alpha = 0.18 + Math.min(1, ratio) * 0.65;
                      heatBg = 'rgba(16,185,129,'+alpha.toFixed(2)+')'; heatNum = alpha > 0.5 ? '#080810' : 'var(--t1)';
                    } else {
                      var nonRestPlan = c.plans.some(function(p){ return p.type!=='rest'; });
                      if (nonRestPlan && c.isPast) { heatBg = 'rgba(239,68,68,.14)'; heatNum = 'var(--t2)'; }
                      else if (nonRestPlan) { heatBg = 'rgba(59,130,246,.14)'; heatNum = 'var(--t2)'; }
                      else { heatBg = 'rgba(255,255,255,.02)'; heatNum = 'var(--t3)'; }
                    }
                    return _h('div', { key:c.ds, onClick:function(){ setSelDate(c.ds); },
                      className:'wplan', style:{ position:'relative', display:'flex', alignItems:'center', justifyContent:'center', height:52, borderRadius:12, cursor:'pointer',
                        background:heatBg, border:'1px solid ' + (c.ds===selDate ? 'rgba(96,165,250,.5)' : 'transparent') } },
                      _h('span', { style:{ fontSize:13, fontWeight:800, fontVariantNumeric:'tabular-nums', color:heatNum } }, c.num),
                      hasOtherEvent && _h('span', { style:{ position:'absolute', top:5, right:6, width:5, height:5, borderRadius:'50%', background:'var(--a-light)' } })
                    );
                  })
                ),
                _h('div', { style:{ display:'flex', alignItems:'center', gap:10, paddingTop:6 } },
                  _h('span', { style:{ fontSize:9.5, fontWeight:600, color:'var(--t3)' } }, 'MNIEJ'),
                  _h('div', { style:{ display:'flex', gap:4 } },
                    [0.18,0.35,0.5,0.65,0.83].map(function(a,i){ return _h('span', { key:i, style:{ width:22, height:12, borderRadius:4, background:'rgba(16,185,129,'+a+')', border:'1px solid rgba(255,255,255,.08)' } }); })
                  ),
                  _h('span', { style:{ fontSize:9.5, fontWeight:600, color:'var(--t3)' } }, 'WIĘCEJ OBJĘTOŚCI')
                )
              ),

          _h('div', { style:{ display:'flex', gap:14, flexWrap:'wrap', paddingTop:12, borderTop:'1px solid rgba(255,255,255,.07)' } },
            CAL_LEGEND.map(function(l) {
              return _h('div', { key:l.name, style:{ display:'flex', alignItems:'center', gap:6 } },
                _h('span', { style:{ width:8, height:8, borderRadius:'50%', background:l.color } }),
                _h('span', { style:{ fontSize:10, fontWeight:600, color:'var(--t2)' } }, l.name)
              );
            })
          )
        ),

        _h('div', { className:'wcard', style:{ flex:'1 1 280px', minWidth:270, display:'flex', flexDirection:'column', gap:12, padding:20, borderRadius:22 } },
          _h('div', { style:{ display:'flex', flexDirection:'column', gap:5 } },
            _h('span', { style:SECTION_LABEL }, 'SZCZEGÓŁY DNIA'),
            _h('span', { style:{ fontSize:14, fontWeight:700, letterSpacing:'-.02em' } }, selDate ? new Date(selDate+'T12:00').toLocaleDateString('pl-PL',{ weekday:'long', day:'numeric', month:'long' }) : '—')
          ),

          selPlans.length > 0 && _h('div', { style:{ display:'flex', flexDirection:'column', gap:7 } },
            _h('span', { style:SECTION_LABEL }, 'PLAN'),
            selPlans.map(function(p) {
              var done = isCompleted(store, p, selDate);
              var st = done ? { t:'✓ ZROB.', c:'var(--green)' } : selDate<today ? { t:'✗ POMIN.', c:'var(--red)' } : { t:'○ PLAN', c:'var(--t3)' };
              return _h('div', { key:p.id, style:{ display:'flex', alignItems:'center', gap:9, padding:'11px 12px', borderRadius:14, background:'color-mix(in srgb,'+p.color+' 14%, transparent)', border:'1px solid color-mix(in srgb,'+p.color+' 32%, transparent)' } },
                _h('span', { style:{ fontSize:14 } }, p.icon),
                _h('div', { style:{ flex:1, minWidth:0, display:'flex', flexDirection:'column', gap:4 } },
                  _h('span', { style:{ fontSize:12, fontWeight:700, color:p.color } }, p.planName),
                  p.note && _h('span', { style:{ fontSize:9.5, fontWeight:600, color:'var(--t3)' } }, p.note)
                ),
                _h('span', { style:{ fontSize:9, fontWeight:800, letterSpacing:'.06em', color:st.c } }, st.t)
              );
            })
          ),

          selEvents.length > 0 && _h('div', { style:{ display:'flex', flexDirection:'column', gap:7 } },
            _h('span', { style:SECTION_LABEL }, 'WYKONANIE'),
            selEvents.map(function(e, i) {
              return _h('div', { key:i, onClick:function(){ navigate(webEvRoute(e.type)); },
                style:{ display:'flex', alignItems:'center', gap:9, padding:'11px 12px', borderRadius:14, background:'rgba(255,255,255,.04)', border:'1px solid rgba(255,255,255,.08)', cursor:'pointer' } },
                _h('span', { style:{ flex:'none', width:8, height:8, borderRadius:'50%', background:e.color } }),
                _h('div', { style:{ flex:1, minWidth:0, display:'flex', flexDirection:'column', gap:4 } },
                  _h('span', { style:{ fontSize:12, fontWeight:700, lineHeight:1.2 } }, e.name),
                  _h('span', { style:{ fontSize:9.5, fontWeight:600, color:'var(--t3)' } }, e.meta)
                )
              );
            })
          ),

          selPlans.length===0 && selEvents.length===0 && _h('div', { style:{ padding:'26px 16px', borderRadius:16, border:'1px dashed rgba(255,255,255,.12)', background:'rgba(255,255,255,.02)', textAlign:'center', fontSize:11.5, color:'var(--t3)' } },
            selDate < today ? 'Nic nie zaplanowano ani nie wykonano tego dnia.' : 'Nic tu jeszcze nie ma — zaplanuj trening albo wróć po fakcie.'),

          _h('div', { onClick:function(){ navigate('plan'); }, style:{ display:'flex', alignItems:'center', justifyContent:'center', gap:7, height:42, borderRadius:14, cursor:'pointer', background:'rgba(96,165,250,.14)', border:'1px solid rgba(96,165,250,.30)', color:'var(--a-light)', fontSize:12, fontWeight:700 } },
            'Zaplanuj w Planie',
            _h('svg', { width:14, height:14, viewBox:'0 0 24 24', fill:'none', stroke:'currentColor', strokeWidth:2.3, strokeLinecap:'round', strokeLinejoin:'round' }, _h('path', { d:'M4 12h14M12 6l6 6-6 6' }))
          )
        )
      )
    );
  }

  ET.WebCalendarModule = WebCalendarModule;
})();
