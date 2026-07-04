(function() {
  'use strict';
  window.ET = window.ET || {};
  var _h = React.createElement;

  var READINESS_FIELDS = [
    { key:'willingness', label:'Chęć', opts:['😤 Bez chęci','😐 Ujdzie','💪 Pełna!'] },
    { key:'state',       label:'Samopoczucie', opts:['😞 Słabo','😐 Normalnie','😄 Świetnie'] },
    { key:'fatigue',     label:'Zmęczenie',    opts:['😴 Bardzo','😐 Średnie','⚡ Brak'] },
  ];

  function calcReadinessPct(rd) {
    var w = ((rd.willingness||2) - 1) / 2;
    var s = ((rd.state||2) - 1) / 2;
    var f = ((rd.fatigue||2) - 1) / 2;
    return Math.round(((w + s + f) / 3) * 100);
  }

  function daysAgo(dateStr) {
    if (!dateStr) return null;
    var d = new Date(dateStr + 'T12:00');
    var now = new Date(); now.setHours(0,0,0,0);
    var diff = Math.round((now - d) / 86400000);
    if (diff === 0) return 'dziś';
    if (diff === 1) return 'wczoraj';
    return diff + ' dni temu';
  }

  // ── READINESS CARD & SHEET ────────────────────────────────────────────────
  function ReadinessCard(props) {
    var rd = props.readiness;
    var pct = calcReadinessPct(rd);
    var rc = pct >= 70 ? 'var(--green)' : pct >= 40 ? 'var(--yellow)' : 'var(--red)';
    var label = pct >= 70 ? 'Dobra gotowość' : pct >= 40 ? 'Średnia gotowość' : 'Niska gotowość';

    return _h('div', { className:'card card-accent', style:{ marginBottom:16, cursor:'pointer' }, onClick:props.onOpen },
      _h('div', { style:{ display:'flex', alignItems:'center', gap:16, marginBottom:14 } },
        _h(ET.ReadinessRing, { value:pct, size:90, stroke:7, color:rc }),
        _h('div', { style:{ flex:1 } },
          _h('div', { style:{ fontSize:'.6rem', color:'var(--t3)', fontWeight:700, textTransform:'uppercase', letterSpacing:'.1em', marginBottom:4 } }, 'Gotowość do treningu'),
          _h('div', { style:{ fontSize:'1.3rem', fontWeight:700, color:rc, lineHeight:1.1 } }, label),
          _h('div', { style:{ fontSize:'.72rem', color:'var(--t3)', marginTop:4 } }, 'Dotknij by zaktualizować →')
        )
      ),
      _h('div', { style:{ display:'flex', gap:6 } },
        READINESS_FIELDS.map(function(f) {
          var val = rd[f.key] || 2;
          var chip = f.opts[val - 1];
          var chipC = f.key === 'fatigue'
            ? (val === 3 ? 'var(--green)' : val === 1 ? 'var(--red)' : 'var(--yellow)')
            : (val === 3 ? 'var(--green)' : val === 1 ? 'var(--red)' : 'var(--yellow)');
          return _h('div', { key:f.key, style:{ flex:1, background:'var(--s3)', borderRadius:'var(--r2)', padding:'6px 8px', textAlign:'center' } },
            _h('div', { style:{ fontSize:'.55rem', color:'var(--t3)', fontWeight:700, textTransform:'uppercase', marginBottom:3 } }, f.label),
            _h('div', { style:{ fontSize:'.72rem', fontWeight:600, color:chipC } }, chip)
          );
        })
      )
    );
  }

  function ReadinessSheet(props) {
    var rd = props.readiness, setRd = props.setReadiness;
    var pct = calcReadinessPct(rd);
    var rc = pct >= 70 ? 'var(--green)' : pct >= 40 ? 'var(--yellow)' : 'var(--red)';

    return _h(ET.Sheet, { open:props.open, onClose:props.onClose, title:'Gotowość do treningu' },
      _h('div', { style:{ textAlign:'center', marginBottom:20 } },
        _h(ET.ReadinessRing, { value:pct, size:110, stroke:9, color:rc }),
        _h('div', { style:{ fontSize:'1.1rem', fontWeight:700, color:rc, marginTop:10 } }, pct+'%')
      ),
      _h('div', { className:'card', style:{ marginBottom:16 } },
        READINESS_FIELDS.map(function(f) {
          return _h('div', { key:f.key, style:{ marginBottom:16 } },
            _h('div', { style:{ fontSize:'.7rem', fontWeight:700, color:'var(--t3)', textTransform:'uppercase', letterSpacing:'.06em', marginBottom:8 } }, f.label),
            _h('div', { style:{ display:'flex', gap:6 } },
              f.opts.map(function(opt, i) {
                var active = rd[f.key] === (i + 1);
                return _h('button', { key:i,
                  style:{ flex:1, padding:'10px 4px', borderRadius:'var(--r2)', border:'1px solid '+(active?'var(--a)':'var(--b1)'), background:active?'var(--a-dim)':'var(--s3)', color:active?'var(--a-light)':'var(--t2)', cursor:'pointer', fontSize:'.72rem', fontWeight:600, lineHeight:1.3, textAlign:'center', transition:'all .15s' },
                  onClick:function(){ var o={}; o[f.key]=i+1; setRd(Object.assign({},rd,o)); }
                }, opt);
              })
            )
          );
        })
      ),
      _h('button', { className:'btn btn-primary', style:{ width:'100%' }, onClick:props.onClose }, '✓ Zapisz gotowość')
    );
  }

  // ── WORKOUT PICKER SHEET ─────────────────────────────────────────────────
  function WorkoutPickerSheet(props) {
    var plans = (typeof ET.WORKOUT_PLANS !== 'undefined') ? ET.WORKOUT_PLANS : [];
    return _h(ET.Sheet, { open:props.open, onClose:props.onClose, title:'Wybierz trening' },
      plans.map(function(plan) {
        return _h('div', { key:plan.id,
          style:{ display:'flex', alignItems:'center', gap:14, padding:'14px 0', borderBottom:'1px solid var(--b1)', cursor:'pointer' },
          onClick:function(){ props.onSelect(plan); }
        },
          _h('div', { style:{ width:46, height:46, borderRadius:'var(--r2)', background:'var(--s3)', border:'1px solid var(--b1)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.4rem', flexShrink:0 } }, plan.icon),
          _h('div', { style:{ flex:1 } },
            _h('div', { style:{ fontWeight:700 } }, plan.name),
            _h('div', { style:{ fontSize:'.7rem', color:'var(--t2)', marginTop:3 } }, plan.day + ' · ' + plan.desc)
          ),
          _h('div', { style:{ color:'var(--t3)', fontSize:'1.3rem' } }, '›')
        );
      })
    );
  }

  // ── SUPPLEMENTS QUICK SHEET ──────────────────────────────────────────────
  function SupplQuickSheet(props) {
    var su = ET.useStore(); var store = su.store, update = su.update;
    var today = ET.dstr();
    var suppls = store.supplements || [];
    var todayChecks = (store.supplementChecks || {})[today] || {};
    var takenCount = suppls.filter(function(s){ return todayChecks[s.id]; }).length;

    function toggle(id) {
      update(function(s) {
        var c = Object.assign({}, s.supplementChecks || {});
        var td = Object.assign({}, c[today] || {});
        td[id] = !td[id];
        c[today] = td;
        return Object.assign({}, s, { supplementChecks:c });
      });
    }

    return _h(ET.Sheet, { open:props.open, onClose:props.onClose, title:'Suplementy — dzisiaj' },
      suppls.length === 0
        ? _h('div', { style:{ color:'var(--t3)', textAlign:'center', padding:'30px 0' } },
            _h('div', { style:{ fontSize:'2rem', marginBottom:10 } }, '💊'),
            _h('div', null, 'Brak suplementów'),
            _h('div', { style:{ fontSize:'.78rem', marginTop:6 } }, 'Dodaj suplementy w zakładce Suplementy')
          )
        : _h('div', null,
            _h('div', { style:{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14, padding:'0 0 12px', borderBottom:'1px solid var(--b1)' } },
              _h('div', { style:{ fontSize:'.78rem', color:'var(--t3)' } }, takenCount+' / '+suppls.length+' przyjętych'),
              takenCount === suppls.length && suppls.length > 0 && _h('div', { style:{ fontSize:'.78rem', color:'var(--green)', fontWeight:700 } }, '✓ Wszystkie!')
            ),
            suppls.map(function(s) {
              var taken = !!todayChecks[s.id];
              return _h('div', { key:s.id,
                style:{ display:'flex', alignItems:'center', gap:12, padding:'12px 0', borderBottom:'1px solid var(--b1)', cursor:'pointer' },
                onClick:function(){ toggle(s.id); }
              },
                _h('div', { style:{ width:30, height:30, borderRadius:8, border:'2px solid '+(taken?'var(--green)':'var(--b2)'), background:taken?'var(--green-d)':'transparent', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, transition:'all .15s', fontSize:'.9rem', color:'var(--green)' } }, taken ? '✓' : ''),
                _h('div', { style:{ flex:1 } },
                  _h('div', { style:{ fontWeight:600, fontSize:'.88rem', color: taken ? 'var(--t3)' : 'var(--t1)', textDecoration: taken ? 'line-through' : 'none' } }, s.name),
                  (s.dose || s.timing) && _h('div', { style:{ fontSize:'.7rem', color:'var(--t3)', marginTop:2 } }, [s.dose && s.unit ? s.dose+' '+s.unit : '', s.timing ? s.timing : ''].filter(Boolean).join(' · '))
                )
              );
            }),
            _h('button', { className:'btn btn-primary', style:{ width:'100%', marginTop:16 }, onClick:props.onClose }, 'Gotowe')
          )
    );
  }

  // ── NEW DASHBOARD ────────────────────────────────────────────────────────
  function NewDashboard() {
    var su = ET.useStore(); var store = su.store;
    var nav = ET.useNav(); var navigate = nav.navigate;
    var toast = ET.useToast();

    var rds = React.useState({ willingness:2, state:2, fatigue:2 });
    var readiness = rds[0], setReadiness = rds[1];
    var srs = React.useState(false); var showReadiness = srs[0], setShowReadiness = srs[1];
    var sws = React.useState(false); var showWorkoutPicker = sws[0], setShowWorkoutPicker = sws[1];
    var sss = React.useState(false); var showSuppl = sss[0], setShowSuppl = sss[1];
    var srn = React.useState(false); var showRunAdd = srn[0], setShowRunAdd = srn[1];
    var ssa = React.useState(false); var showSaunaAdd = ssa[0], setShowSaunaAdd = ssa[1];
    var ssl = React.useState(false); var showSleepAdd = ssl[0], setShowSleepAdd = ssl[1];
    var sma = React.useState(false); var showMeasAdd = sma[0], setShowMeasAdd = sma[1];

    var p = store.profile;
    var lastW = store.workouts && store.workouts[0];
    var lastR = store.runs && store.runs[0];
    var lastS = store.sleepSessions && store.sleepSessions[0];
    var lastSa = store.saunaSessions && store.saunaSessions[0];
    var lastM = store.measurements && store.measurements[0];
    var activeGoals = (store.goals || []).filter(function(g) { return g.progress < 100; });

    var QUICK = [
      {
        icon:'💪', label:'Trening siłowy', color:'var(--a)',
        sub: lastW ? daysAgo(lastW.date) : 'Brak danych',
        onClick: function(){ setShowWorkoutPicker(true); }
      },
      {
        icon:'🏃', label:'Bieganie', color:'var(--green)',
        sub: lastR ? daysAgo(lastR.date) + (lastR.distance ? ' · ' + lastR.distance + ' km' : '') : 'Brak danych',
        onClick: function(){ setShowRunAdd(true); }
      },
      {
        icon:'🔥', label:'Sauna', color:'var(--orange)',
        sub: lastSa ? daysAgo(lastSa.date) + (lastSa.duration ? ' · ' + lastSa.duration + ' min' : '') : 'Brak danych',
        onClick: function(){ setShowSaunaAdd(true); }
      },
      {
        icon:'💊', label:'Suplementy', color:'var(--purple)',
        sub: (store.supplements || []).length + ' suplementów',
        onClick: function(){ setShowSuppl(true); }
      },
      {
        icon:'📏', label:'Pomiary', color:'var(--teal)',
        sub: lastM ? daysAgo(lastM.date) : 'Brak danych',
        onClick: function(){ setShowMeasAdd(true); }
      },
      {
        icon:'😴', label:'Sen', color:'var(--yellow)',
        sub: lastS ? (lastS.duration ? lastS.duration + 'h · ' : '') + daysAgo(lastS.date) : 'Brak danych',
        onClick: function(){ setShowSleepAdd(true); }
      },
    ];

    return _h('div', { className:'fade-in' },

      _h('div', { style:{ marginBottom:18 } },
        _h('div', { className:'dash-greeting' }, ET.greeting() + (p && p.name ? ', ' + p.name : '') + ' 👋'),
        _h('div', { className:'dash-date' }, new Date().toLocaleDateString('pl-PL', { weekday:'long', day:'numeric', month:'long' }))
      ),

      _h(ReadinessCard, { readiness:readiness, setReadiness:setReadiness, onOpen:function(){ setShowReadiness(true); } }),

      _h('div', { style:{ marginBottom:20 } },
        _h('div', { className:'section-hdr', style:{ marginBottom:10 } },
          _h('h2', null, 'Szybki start')
        ),
        _h('div', { style:{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8 } },
          QUICK.map(function(q, i) {
            return _h('div', { key:i,
              style:{ background:'var(--s2)', border:'1px solid var(--b1)', borderRadius:'var(--r3)', padding:'14px 10px', textAlign:'center', cursor:'pointer', transition:'all .15s', userSelect:'none' },
              onClick:q.onClick,
              onMouseEnter:function(e){ e.currentTarget.style.borderColor='var(--b3)'; e.currentTarget.style.background='var(--s3)'; },
              onMouseLeave:function(e){ e.currentTarget.style.borderColor='var(--b1)'; e.currentTarget.style.background='var(--s2)'; }
            },
              _h('div', { style:{ fontSize:'1.6rem', marginBottom:6 } }, q.icon),
              _h('div', { style:{ fontSize:'.75rem', fontWeight:700, color:'var(--t1)', marginBottom:3, lineHeight:1.2 } }, q.label),
              _h('div', { style:{ fontSize:'.6rem', color:'var(--t3)', lineHeight:1.3, minHeight:16 } }, q.sub)
            );
          })
        )
      ),

      _h('div', { style:{ marginBottom:20 } },
        _h('div', { className:'section-hdr' }, _h('h2', null, 'Ostatnie aktywności')),
        _h('div', { className:'dash-cards-scroll' },
          [
            { icon:'💪', label:'Trening', data:lastW, main:lastW&&lastW.name, sub:lastW&&ET.fmtDateShort(lastW.date), badge:lastW&&(lastW.volume||0).toFixed(0)+' kg', bc:'badge-blue', route:'strength' },
            { icon:'🏃', label:'Bieganie', data:lastR, main:lastR&&lastR.distance+' km', sub:lastR&&ET.fmtDateShort(lastR.date), badge:lastR&&lastR.pace+'/km', bc:'badge-green', route:'running' },
            { icon:'😴', label:'Sen', data:lastS, main:lastS&&lastS.duration+'h', sub:lastS&&ET.fmtDateShort(lastS.date), badge:lastS&&'Jakość '+lastS.quality+'/10', bc:'badge-purple', route:'sleep' },
            { icon:'🔥', label:'Sauna', data:lastSa, main:lastSa&&lastSa.duration+' min', sub:lastSa&&ET.fmtDateShort(lastSa.date), badge:lastSa&&lastSa.temp+'°C', bc:'badge-orange', route:'sauna' },
          ].map(function(c, i) {
            return _h('div', { key:i, className:'dash-summary-card', onClick:function(){ navigate(c.route); } },
              _h('div', { style:{ fontSize:'1.3rem', marginBottom:6 } }, c.icon),
              _h('div', { style:{ fontSize:'.65rem', color:'var(--t3)', fontWeight:700, textTransform:'uppercase', letterSpacing:'.06em' } }, c.label),
              c.data
                ? _h('div', null,
                    _h('div', { style:{ fontSize:'.88rem', fontWeight:700, marginTop:3, lineHeight:1.2, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' } }, c.main),
                    _h('div', { style:{ fontSize:'.7rem', color:'var(--t3)', marginTop:2 } }, c.sub),
                    c.badge && _h('div', { className:'badge '+c.bc, style:{ marginTop:6 } }, c.badge)
                  )
                : _h('div', { style:{ fontSize:'.78rem', color:'var(--t3)', marginTop:6 } }, 'Brak danych')
            );
          })
        )
      ),

      activeGoals.length > 0 && _h('div', { style:{ marginBottom:20 } },
        _h('div', { className:'section-hdr' },
          _h('h2', null, 'Aktywne cele'),
          _h('button', { className:'btn btn-ghost btn-sm', onClick:function(){ navigate('goals'); } }, 'Wszystkie →')
        ),
        activeGoals.slice(0, 3).map(function(g) {
          return _h('div', { key:g.id, className:'card', style:{ marginBottom:8 } },
            _h('div', { style:{ display:'flex', justifyContent:'space-between', marginBottom:8 } },
              _h('div', { style:{ fontSize:'.88rem', fontWeight:600 } }, g.title),
              _h('div', { style:{ fontSize:'.82rem', color:'var(--a-light)', fontWeight:700 } }, g.progress + '%')
            ),
            _h(ET.ProgressBar, { value:g.progress })
          );
        })
      ),

      _h(ReadinessSheet, { open:showReadiness, onClose:function(){ setShowReadiness(false); }, readiness:readiness, setReadiness:setReadiness }),
      _h(WorkoutPickerSheet, { open:showWorkoutPicker, onClose:function(){ setShowWorkoutPicker(false); },
        onSelect:function(plan){ setShowWorkoutPicker(false); navigate('strength', { plan:plan }); }
      }),
      _h(SupplQuickSheet, { open:showSuppl, onClose:function(){ setShowSuppl(false); } }),
      ET.RunningAddSheet && _h(ET.RunningAddSheet, { open:showRunAdd, onClose:function(){ setShowRunAdd(false); } }),
      ET.SaunaAddSheet && _h(ET.SaunaAddSheet, { open:showSaunaAdd, onClose:function(){ setShowSaunaAdd(false); } }),
      ET.SleepAddSheet && _h(ET.SleepAddSheet, { open:showSleepAdd, onClose:function(){ setShowSleepAdd(false); } }),
      ET.MeasurementsAddSheet && _h(ET.MeasurementsAddSheet, { open:showMeasAdd, onClose:function(){ setShowMeasAdd(false); } })
    );
  }

  // ── OLD DASHBOARD (classic) ───────────────────────────────────────────────
  function OldDashboard() {
    var su = ET.useStore(); var store = su.store;
    var nav = ET.useNav(); var navigate = nav.navigate;
    var rs = React.useState(75); var readiness = rs[0], setReadiness = rs[1];
    var showRS = React.useState(false); var showR = showRS[0], setShowR = showRS[1];
    var p = store.profile || {};
    var rc = readiness>=70?'var(--green)':readiness>=40?'var(--yellow)':'var(--red)';
    var lastW = (store.workouts||[])[0];
    var lastR = (store.runs||[])[0];
    var lastS = (store.sleepSessions||[])[0];
    var lastSa = (store.saunaSessions||[])[0];
    var activeGoals = (store.goals||[]).filter(function(g){ return g.progress<100; });

    var QUICK = [
      {icon:'💪',label:'Trening',route:'strength'},{icon:'🏃',label:'Bieganie',route:'running'},
      {icon:'😴',label:'Sen',route:'sleep'},{icon:'🔥',label:'Sauna',route:'sauna'},
      {icon:'🥗',label:'Dieta',route:'diet'},{icon:'📏',label:'Pomiary',route:'measurements'},
      {icon:'💊',label:'Suplement.',route:'supplements'},{icon:'🎯',label:'Cele',route:'goals'}
    ];

    var SUMMARY_CARDS = [
      { icon:'💪', label:'Trening', data:lastW, main:lastW&&lastW.name, sub:lastW&&ET.fmtDateShort(lastW.date), badge:lastW&&(lastW.volume||0).toFixed(0)+' kg', bc:'badge-blue', route:'strength' },
      { icon:'🏃', label:'Bieganie', data:lastR, main:lastR&&lastR.distance+' km', sub:lastR&&ET.fmtDateShort(lastR.date), badge:lastR&&lastR.pace+'/km', bc:'badge-green', route:'running' },
      { icon:'😴', label:'Sen', data:lastS, main:lastS&&lastS.duration+'h', sub:lastS&&ET.fmtDateShort(lastS.date), badge:lastS&&'Jakość '+lastS.quality+'/10', bc:'badge-purple', route:'sleep' },
      { icon:'🔥', label:'Sauna', data:lastSa, main:lastSa&&lastSa.duration+' min', sub:lastSa&&ET.fmtDateShort(lastSa.date), badge:lastSa&&lastSa.temp+'°C', bc:'badge-orange', route:'sauna' },
    ];

    return _h('div', { className:'fade-in' },
      _h('div', { style:{ marginBottom:24 } },
        _h('div', { className:'dash-greeting' }, ET.greeting()+(p.name?', '+p.name:'')+' 👋'),
        _h('div', { className:'dash-date' }, new Date().toLocaleDateString('pl-PL', { weekday:'long', day:'numeric', month:'long' }))
      ),

      _h('div', { className:'grid-2', style:{ marginBottom:16 } },
        _h('div', { className:'card card-accent', onClick:function(){ setShowR(true); }, style:{ cursor:'pointer' } },
          _h('div', { style:{ display:'flex', alignItems:'center', gap:14 } },
            _h(ET.ReadinessRing, { value:readiness, color:rc }),
            _h('div', null,
              _h('div', { style:{ fontSize:'.65rem', color:'var(--t3)', fontWeight:700, textTransform:'uppercase', letterSpacing:'.08em', marginBottom:3 } }, 'Gotowość'),
              _h('div', { style:{ fontSize:'1.1rem', fontWeight:700, color:rc } }, readiness>=70?'Dobra':readiness>=40?'Średnia':'Niska'),
              _h('div', { style:{ fontSize:'.72rem', color:'var(--t3)', marginTop:2 } }, 'Dotknij by ocenić →')
            )
          )
        ),
        _h('div', { className:'card', style:{ display:'flex', flexDirection:'column', gap:8 } },
          _h('div', { style:{ fontSize:'.65rem', color:'var(--t3)', fontWeight:700, textTransform:'uppercase', letterSpacing:'.08em' } }, 'Szybki start'),
          _h('button', { className:'btn btn-primary', style:{ width:'100%' }, onClick:function(){ navigate('strength'); } }, '💪 Trening siłowy'),
          _h('button', { className:'btn btn-secondary', style:{ width:'100%' }, onClick:function(){ navigate('running'); } }, '🏃 Bieganie')
        )
      ),

      _h('div', { style:{ marginBottom:20 } },
        _h('div', { className:'section-hdr' }, _h('h2', null, 'Szybki wpis')),
        _h('div', { className:'dash-quick' },
          QUICK.map(function(a) {
            return _h('div', { key:a.route, className:'quick-btn', onClick:function(){ navigate(a.route); } },
              _h('span', { className:'quick-btn-icon' }, a.icon),
              _h('span', { className:'quick-btn-label' }, a.label)
            );
          })
        )
      ),

      _h('div', { style:{ marginBottom:20 } },
        _h('div', { className:'section-hdr' }, _h('h2', null, 'Ostatnie aktywności')),
        _h('div', { className:'dash-cards-scroll' },
          SUMMARY_CARDS.map(function(c, i) {
            return _h('div', { key:i, className:'dash-summary-card', onClick:function(){ navigate(c.route); } },
              _h('div', { style:{ fontSize:'1.3rem', marginBottom:6 } }, c.icon),
              _h('div', { style:{ fontSize:'.65rem', color:'var(--t3)', fontWeight:700, textTransform:'uppercase', letterSpacing:'.06em' } }, c.label),
              c.data
                ? _h('div', null,
                    _h('div', { style:{ fontSize:'.88rem', fontWeight:700, marginTop:3, lineHeight:1.2, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' } }, c.main),
                    _h('div', { style:{ fontSize:'.7rem', color:'var(--t3)', marginTop:2 } }, c.sub),
                    c.badge && _h('div', { className:'badge '+c.bc, style:{ marginTop:6 } }, c.badge)
                  )
                : _h('div', { style:{ fontSize:'.78rem', color:'var(--t3)', marginTop:6 } }, 'Brak danych')
            );
          })
        )
      ),

      activeGoals.length > 0 && _h('div', { style:{ marginBottom:20 } },
        _h('div', { className:'section-hdr' },
          _h('h2', null, 'Aktywne cele'),
          _h('button', { className:'btn btn-ghost btn-sm', onClick:function(){ navigate('goals'); } }, 'Wszystkie →')
        ),
        activeGoals.slice(0,3).map(function(g) {
          return _h('div', { key:g.id, className:'card', style:{ marginBottom:8 } },
            _h('div', { style:{ display:'flex', justifyContent:'space-between', marginBottom:8 } },
              _h('div', { style:{ fontSize:'.88rem', fontWeight:600 } }, g.title),
              _h('div', { style:{ fontSize:'.82rem', color:'var(--a-light)', fontWeight:700 } }, g.progress+'%')
            ),
            _h(ET.ProgressBar, { value:g.progress })
          );
        })
      ),

      _h(ET.Sheet, { open:showR, onClose:function(){ setShowR(false); }, title:'Gotowość do treningu' },
        _h('div', { style:{ textAlign:'center', marginBottom:20 } }, _h(ET.ReadinessRing, { value:readiness, size:100, stroke:8, color:rc })),
        _h('div', { style:{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8 } },
          _h('span', { style:{ fontSize:'.88rem', color:'var(--t2)', fontWeight:600 } }, 'Gotowość ogólna'),
          _h('span', { style:{ fontSize:'1.2rem', fontWeight:700, color:rc } }, readiness+'%')
        ),
        _h('div', { className:'slider-wrap', style:{ marginBottom:16 } },
          _h('input', { type:'range', min:0, max:100, value:readiness, onChange:function(e){ setReadiness(+e.target.value); } })
        ),
        _h('button', { className:'btn btn-primary', style:{ width:'100%' }, onClick:function(){ setShowR(false); } }, 'Gotowe')
      )
    );
  }

  // ── DASHBOARD ROUTER ─────────────────────────────────────────────────────
  function Dashboard() {
    var su = ET.useStore(); var store = su.store;
    var useOld = store.settings && store.settings.useOldDashboard;
    if (useOld) return _h(OldDashboard, null);
    return _h(NewDashboard, null);
  }

  ET.Dashboard = Dashboard;
  ET.OldDashboard = OldDashboard;
})();
