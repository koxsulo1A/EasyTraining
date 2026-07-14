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
  function CalendarModule() {
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

  ET.CalendarModule = CalendarModule;
})();
