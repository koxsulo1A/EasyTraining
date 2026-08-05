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
  // Karta gotowości wg handoffu: pierścień 112 px w karcie szklanej, obok
  // nagłówek + trzy metryki. Design zakłada metryki SEN/HRV/RPE — apka nie
  // ma integracji z wearable (brak HRV), więc zamiast fabrykować dane
  // zostają realne pola check-inu (chęć/samopoczucie/zmęczenie), tak samo
  // jak w web-owym odpowedniku tej karty (WebDashboard, dashboard.js).
  function ReadinessCard(props) {
    var rd = props.readiness;
    var pct = calcReadinessPct(rd);
    var rc = pct >= 70 ? 'var(--green)' : pct >= 40 ? 'var(--yellow)' : 'var(--red)';
    var label = pct >= 70 ? 'Dobra gotowość' : pct >= 40 ? 'Średnia gotowość' : 'Niska gotowość';
    var desc = pct >= 70
      ? 'Organizm odpowiada dobrze — realizuj plan w pełnym obciążeniu.'
      : pct >= 40
        ? 'Stan przeciętny — trzymaj się planu, bez ustawiania dziś rekordów.'
        : 'Niska gotowość — rozważ lżejszą sesję albo dzień regeneracji.';

    return _h('div', { className:'glass', style:{ display:'flex', gap:16, alignItems:'center', padding:18, borderRadius:22, marginBottom:14, cursor:'pointer' }, onClick:props.onOpen },
      _h('div', { style:{ position:'relative', flex:'none', width:112, height:112 } },
        _h('svg', { width:112, height:112, viewBox:'0 0 112 112', style:{ transform:'rotate(-90deg)' } },
          _h('defs', null,
            _h('linearGradient', { id:'mdashRing', x1:'0', y1:'0', x2:'1', y2:'1' },
              _h('stop', { offset:'0', stopColor:'#60A5FA' }),
              _h('stop', { offset:'.55', stopColor:'#3B82F6' }),
              _h('stop', { offset:'1', stopColor:'#8B5CF6' })
            )
          ),
          _h('circle', { cx:56, cy:56, r:47.5, fill:'none', stroke:'rgba(255,255,255,.07)', strokeWidth:9 }),
          _h('circle', { cx:56, cy:56, r:47.5, fill:'none', stroke:'url(#mdashRing)', strokeWidth:9,
            strokeLinecap:'round', strokeDasharray:298.5, strokeDashoffset:298.5 * (1 - pct/100),
            style:{ transition:'stroke-dashoffset 1.3s cubic-bezier(.2,.8,.2,1)' } })
        ),
        _h('div', { style:{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:2 } },
          _h('span', { style:{ fontSize:32, fontWeight:800, lineHeight:1, letterSpacing:'-.05em', fontVariantNumeric:'tabular-nums' } }, pct),
          _h('span', { style:{ fontSize:8, fontWeight:800, lineHeight:1, letterSpacing:'.14em', color:'var(--t3)' } }, 'GOTOWOŚĆ')
        )
      ),
      _h('div', { style:{ flex:1, minWidth:0, display:'flex', flexDirection:'column', gap:7 } },
        _h('div', { style:{ fontSize:15, fontWeight:700, lineHeight:1.2, letterSpacing:'-.02em', color:rc } }, label),
        _h('div', { style:{ fontSize:11.5, fontWeight:400, lineHeight:1.4, color:'var(--t2)' } }, desc),
        _h('div', { style:{ display:'flex', gap:6, marginTop:2 } },
          READINESS_FIELDS.map(function(f, i) {
            var val = rd[f.key] || 2;
            var chip = stripEmoji(f.opts[val - 1]);
            var chipC = val === 3 ? 'var(--green)' : val === 1 ? 'var(--red)' : 'var(--yellow)';
            return _h('div', { key:f.key, style:{ flex:1, textAlign:'center', padding:'6px 4px',
              borderLeft: i>0 ? '1px solid rgba(255,255,255,.07)' : 'none' } },
              _h('div', { style:{ fontSize:8, color:'var(--t3)', fontWeight:800, textTransform:'uppercase', letterSpacing:'.1em', marginBottom:3 } }, f.label),
              _h('div', { style:{ fontSize:11.5, fontWeight:700, color:chipC } }, chip)
            );
          })
        )
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
    // Plany z nadpisaniami z edytora (store.workoutPlans/customWorkoutPlans), nie statyczne
    var su = ET.useStore(); var store = su.store;
    var plans = (typeof ET.getEffectivePlans === 'function') ? ET.getEffectivePlans(store)
      : (typeof ET.WORKOUT_PLANS !== 'undefined') ? ET.WORKOUT_PLANS : [];
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
              // Tagi/konflikty — te same helpery co w module Suplementy
              var tags = ET.suppIntakeTags ? ET.suppIntakeTags(s.name) : [];
              var sameTiming = suppls.filter(function(o){ return o.timing===s.timing; });
              var confl = ET.suppConflictsWithin ? ET.suppConflictsWithin(s, sameTiming) : [];
              return _h('div', { key:s.id,
                style:{ display:'flex', alignItems:'center', gap:12, padding:'12px 0', borderBottom:'1px solid var(--b1)', cursor:'pointer', borderLeft:confl.length?'3px solid var(--red)':'none', paddingLeft:confl.length?8:0 },
                onClick:function(){ toggle(s.id); }
              },
                _h('div', { style:{ width:30, height:30, borderRadius:8, border:'2px solid '+(taken?'var(--green)':'var(--b2)'), background:taken?'var(--green-d)':'transparent', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, transition:'all .15s', fontSize:'.9rem', color:'var(--green)' } }, taken ? '✓' : ''),
                _h('div', { style:{ flex:1 } },
                  _h('div', { style:{ fontWeight:600, fontSize:'.88rem', color: taken ? 'var(--t3)' : 'var(--t1)', textDecoration: taken ? 'line-through' : 'none' } }, s.name),
                  (s.dose || s.timing) && _h('div', { style:{ fontSize:'.7rem', color:'var(--t3)', marginTop:2 } }, [s.dose && s.unit ? s.dose+' '+s.unit : '', s.timing ? ({ morning:'🌅 Rano', preworkout:'⚡ Przed treningiem', postworkout:'💪 Po treningu', evening:'🌙 Wieczór', night:'😴 Na noc' }[s.timing] || s.timing) : ''].filter(Boolean).join(' · ')),
                  tags.length>0 && _h('div', { style:{ display:'flex', gap:3, flexWrap:'wrap', marginTop:3 } },
                    tags.map(function(tg){ return _h('span', { key:tg.t, style:{ fontSize:'.58rem', padding:'1px 6px', borderRadius:99, background:'var(--s3)', border:'1px solid var(--b1)', color:tg.c, fontWeight:600 } }, tg.t); })
                  ),
                  confl.length>0 && _h('div', { style:{ fontSize:'.62rem', color:'var(--red)', marginTop:3, fontWeight:600 } },
                    '⚠ Nie łącz z: '+confl.join(', ')+' — rozdziel min. 2 h')
                )
              );
            }),
            _h('button', { className:'btn btn-primary', style:{ width:'100%', marginTop:16 }, onClick:props.onClose }, 'Gotowe')
          )
    );
  }

  // ── PASEK REGENERACJI (prompt 5.3) — z danych ostatnich 7 dni ────────────
  function RegenerationBar(props) {
    var store = props.store;
    var todayMs = new Date(ET.dstr()).getTime();
    function within7(dateStr){ if(!dateStr) return false; var a=Math.floor((todayMs-new Date(dateStr).getTime())/86400000); return a>=0 && a<=6; }
    function avg(arr, key){ var v=arr.filter(function(x){ return x[key]!=null; }); return v.length ? v.reduce(function(t,x){ return t+x[key]; },0)/v.length : null; }

    var wb = (store.wellbeingEntries||[]).filter(function(e){ return within7(e.date); });
    var sl = (store.sleepSessions||[]).filter(function(e){ return within7(e.date); });
    var energy=avg(wb,'energy'), stress=avg(wb,'stress'), motivation=avg(wb,'motivation'), mood=avg(wb,'mood');
    var sleepH=avg(sl,'duration'), quality=avg(sl,'quality');

    var comps=[];
    if(energy!=null) comps.push(energy/10);
    if(stress!=null) comps.push((10-stress)/10);
    if(motivation!=null) comps.push(motivation/10);
    if(mood!=null) comps.push(mood/10);
    if(quality!=null) comps.push(quality/10);
    if(sleepH!=null) comps.push(Math.min(sleepH/8,1));
    if(!comps.length) return null;

    var pct = Math.round(comps.reduce(function(a,b){ return a+b; },0)/comps.length*100);
    var color = pct>=70?'var(--green)':pct>=45?'var(--yellow)':'var(--red)';
    var stressLabel = stress==null?'—':stress<=3?'niski':stress<=6?'średni':'wysoki';

    return _h('div', { className:'card', style:{ marginBottom:16 } },
      _h('div', { style:{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 } },
        _h('div', { style:{ fontSize:'.65rem', color:'var(--t3)', fontWeight:700, textTransform:'uppercase', letterSpacing:'.08em' } }, '♻️ Regeneracja (7 dni)'),
        _h('div', { style:{ fontSize:'1.15rem', fontWeight:800, color:color } }, pct+'%')
      ),
      _h(ET.ProgressBar, { value:pct, color:color }),
      _h('div', { style:{ display:'flex', gap:12, flexWrap:'wrap', marginTop:10, fontSize:'.68rem', color:'var(--t2)' } },
        sleepH!=null && _h('span', null, '😴 Sen '+sleepH.toFixed(1)+'h'),
        stress!=null && _h('span', null, '😰 Stres '+stressLabel),
        energy!=null && _h('span', null, '⚡ Energia '+energy.toFixed(0)+'/10'),
        motivation!=null && _h('span', null, '🔥 Motywacja '+motivation.toFixed(0)+'/10')
      )
    );
  }

  // ── CORE SCORES: wskaźniki 0-100 z silników (ADR-006) ────────────────────
  function CoreScoresCard() {
    var c = window.etcore;
    if (!c) return null;
    var defs = [
      { e:'recovery-engine', k:'readiness',   label:'Gotowość',   icon:'♻️', goodHigh:true },
      { e:'fatigue-engine',  k:'overall',     label:'Zmęczenie',  icon:'🔋', goodHigh:false },
      { e:'progress-engine', k:'progressing', label:'Progres',    icon:'📈', goodHigh:true },
      { e:'running-engine',  k:'ramp-risk',   label:'Ryzyko biegu', icon:'🏃', goodHigh:false },
    ];
    var items = defs.map(function(d){ var s=c.scores.latest(d.e,d.k); return s ? { d:d, s:s } : null; }).filter(Boolean);
    if (!items.length) return null;
    return _h('div', { className:'card', style:{ marginBottom:16 } },
      _h('div', { style:{ fontSize:'.65rem', color:'var(--t3)', fontWeight:700, textTransform:'uppercase', letterSpacing:'.08em', marginBottom:10 } }, '🧠 Wskaźniki silników (core)'),
      _h('div', { style:{ display:'flex', gap:8, flexWrap:'wrap' } },
        items.map(function(it) {
          var v = it.s.value;
          var good = it.d.goodHigh ? v : 100 - v;
          var col = good >= 65 ? 'var(--green)' : good >= 40 ? 'var(--yellow)' : 'var(--red)';
          return _h('div', { key:it.d.e+it.d.k, style:{ flex:1, minWidth:100, background:'var(--s3)', borderRadius:'var(--r2)', padding:'8px 10px', textAlign:'center' } },
            _h('div', { style:{ fontSize:'.6rem', color:'var(--t3)', marginBottom:2 } }, it.d.icon+' '+it.d.label),
            _h('div', { style:{ fontSize:'1.2rem', fontWeight:800, color:col } }, v),
            _h('div', { style:{ fontSize:'.55rem', color:'var(--t3)' } }, 'pewność '+Math.round(it.s.confidence*100)+'%')
          );
        })
      )
    );
  }

  // ── SMART COACH (decision-tree chat) ───────────────────────────────────
  var INTENTS = [
    { id:'plateau',    label:'Dlaczego mam plateau?',         icon:'📊', needsExercise:true },
    { id:'recovery',   label:'Czy dobrze regeneruję?',        icon:'😴', needsExercise:false },
    { id:'plan',       label:'Czy mój plan jest dobry?',      icon:'📋', needsExercise:false },
    { id:'load',       label:'Ile powinienem dać na sztangę?',icon:'🏋️', needsExercise:true },
    { id:'deload',     label:'Czy potrzebuję deloadu?',       icon:'⏸️', needsExercise:false },
    { id:'volume',     label:'Ile serii tygodniowo?',         icon:'📈', needsExercise:false },
    { id:'cardio',     label:'Czy cardio szkodzi siłowni?',   icon:'🏃', needsExercise:false },
    { id:'sleep_tip',  label:'Jak sen wpływa na trening?',    icon:'🌙', needsExercise:false },
  ];

  function getExerciseNames(store) {
    var names = {};
    (store.workouts||[]).forEach(function(w) {
      (w.exercises||[]).forEach(function(e){ if(e.name) names[e.name]=true; });
    });
    return Object.keys(names).sort();
  }

  function analyzeIntent(id, exercise, store) {
    var workouts = store.workouts || [];
    var runs = store.runs || [];
    var sleeps = store.sleepSessions || [];
    var wellbeing = store.wellbeingEntries || [];
    var now = Date.now();
    var core = window.etcore;

    function recentWorkouts(days) {
      return workouts.filter(function(w){ return (now - new Date(w.date).getTime()) <= days*86400000; });
    }
    function avgField(arr, key, days) {
      var recent = arr.filter(function(e){ return e.date && (now - new Date(e.date).getTime()) <= days*86400000; });
      var vals = recent.filter(function(e){ return e[key]!=null; });
      if (!vals.length) return null;
      return vals.reduce(function(s,e){ return s+e[key]; },0)/vals.length;
    }

    if (id === 'plateau' && exercise) {
      var ormHist = core && ETCore.ormHistory ? ETCore.ormHistory(core, exercise) : [];
      var exWorkouts = workouts.filter(function(w){
        return (w.exercises||[]).some(function(e){ return e.name===exercise; });
      });
      var weekSets = 0;
      recentWorkouts(7).forEach(function(w){
        (w.exercises||[]).forEach(function(e){
          if (e.name===exercise) weekSets += (e.setsData||[]).filter(function(s){return s.done;}).length || e.sets || 0;
        });
      });
      var avgRpe = avgField(wellbeing, 'energy', 14);
      var sleepAvg = avgField(sleeps, 'duration', 14);
      var daysSinceEx = exWorkouts.length ? Math.floor((now - new Date(exWorkouts[0].date).getTime())/86400000) : null;
      var lastDeload = workouts.findIndex(function(w){ return w.name && w.name.toLowerCase().indexOf('deload')!==-1; });
      var daysSinceDeload = lastDeload >= 0 ? Math.floor((now - new Date(workouts[lastDeload].date).getTime())/86400000) : 999;

      var orm = core && ETCore.latestOrm ? ETCore.latestOrm(core, exercise) : null;
      var trend = ormHist.length >= 2 ? (ormHist[0].orm - ormHist[ormHist.length > 3 ? ormHist.length-3 : ormHist.length-1].orm) : 0;

      if (weekSets < 6) return '📊 Twoje 1RM na „'+exercise+'"'+(trend<=0?' stoi w miejscu':' rośnie')+'. Robisz tylko '+weekSets+' serii/tydzień — to mało. ACSM zaleca 6-10+ serii tygodniowo na grupę mięśniową. Dodaj 2-4 serie, żeby pobudzić adaptację.';
      if (sleepAvg != null && sleepAvg < 6.5) return '🌙 Twoje 1RM na „'+exercise+'" stagnuje, a śpisz średnio '+sleepAvg.toFixed(1)+'h. Przy <7h regeneracja hormonalna (testosteron, GH) jest upośledzona. Zanim zmienisz plan — spróbuj 7.5h+ snu przez 2 tygodnie.';
      if (daysSinceDeload > 42) return '⏸️ Nie miałeś deloadu od '+daysSinceDeload+' dni. Przy ciągłym obciążeniu centralny układ nerwowy się „wypala". Zrób tydzień na 50-60% obciążenia, a potem wróć — często to łamie plateau.';
      if (orm && weekSets >= 10) return '📈 Robisz '+weekSets+' serii/tydz. na „'+exercise+'", wolumen OK. Spróbuj zmienić zakres powtórzeń (np. 3×3 zamiast 3×8) lub dodaj wariant (np. pauza na klatce, tempo 3-1-0). Periodyzacja bodźca to klucz.';
      return '🔍 Analizuję „'+exercise+'": '+weekSets+' serii/tydz.'+(orm?', szacowane 1RM: '+orm.orm.toFixed(1)+' kg':'')+'. Upewnij się, że progresja obciążenia rośnie co 1-2 tygodnie, nawet o 1.25 kg. Jeśli nie — zmień schemat powtórzeń lub technikę.';
    }

    if (id === 'recovery') {
      var sleepA = avgField(sleeps, 'duration', 7);
      var sleepQ = avgField(sleeps, 'quality', 7);
      var stress = avgField(wellbeing, 'stress', 7);
      var energy = avgField(wellbeing, 'energy', 7);
      var parts = [];
      if (sleepA == null && stress == null) return '📊 Brak danych o śnie i samopoczuciu. Zaloguj sen i wpisy samopoczucia, żebym mógł ocenić Twoją regenerację.';
      if (sleepA != null) {
        if (sleepA < 6) parts.push('😴 Sen: średnio '+sleepA.toFixed(1)+'h — ZA MAŁO. Cel: minimum 7h, optymalnie 8h. Niedobór snu obniża syntezę białek mięśniowych o ~20%.');
        else if (sleepA < 7) parts.push('😴 Sen: '+sleepA.toFixed(1)+'h — poniżej optymalnych 7-8h. Spróbuj 30 min wcześniej do łóżka.');
        else parts.push('😴 Sen: '+sleepA.toFixed(1)+'h — dobry poziom!');
      }
      if (sleepQ != null) parts.push('Jakość snu: '+sleepQ.toFixed(1)+'/10'+(sleepQ<5?' — niska, sprawdź temperaturę pokoju i ekrany przed snem':sleepQ<7?' — przeciętna':' — świetna'));
      if (stress != null) {
        if (stress > 7) parts.push('😰 Stres: '+stress.toFixed(0)+'/10 — wysoki! Kortyzol hamuje regenerację. Rozważ spacer, medytację lub zmniejsz obciążenie treningowe.');
        else if (stress > 4) parts.push('😰 Stres: '+stress.toFixed(0)+'/10 — umiarkowany');
        else parts.push('😌 Stres: '+stress.toFixed(0)+'/10 — niski, dobrze');
      }
      if (energy != null) parts.push('⚡ Energia: '+energy.toFixed(0)+'/10'+(energy<4?' — NISKA. Możliwy deficyt kaloryczny lub przetrenowanie':''));
      return parts.join('\n\n');
    }

    if (id === 'plan') {
      var insights = ET.AIEngine.coachPlan ? ET.AIEngine.coachPlan(store) : [];
      if (!insights.length) return '✅ Twój trening wygląda dobrze — objętość, kolejność ćwiczeń i proporcje cardio/siła mieszczą się w zaleceniach.';
      return insights.map(function(ins){ return ins.icon+' **'+ins.title+'**: '+ins.body; }).join('\n\n');
    }

    if (id === 'load' && exercise) {
      var ormData = core && ETCore.latestOrm ? ETCore.latestOrm(core, exercise) : null;
      if (!ormData) return '📊 Brak danych 1RM dla „'+exercise+'". Wykonaj 1-2 serie na tym ćwiczeniu, żebym mógł oszacować Twoje maksimum.';
      var orm1 = ormData.orm;
      var lines = ['🏋️ Szacowane 1RM na „'+exercise+'": **'+orm1.toFixed(1)+' kg** (pewność '+Math.round(ormData.confidence*100)+'%)'];
      lines.push('');
      lines.push('Zalecane obciążenia:');
      [[85,3,'Siła (3×3)'],[75,8,'Hipertrofia (3×8)'],[65,12,'Wytrzymałość (3×12)']].forEach(function(r){
        var w = Math.round(orm1 * r[0]/100 / 2.5) * 2.5;
        lines.push('• '+r[2]+': **'+w+' kg** ('+r[0]+'% 1RM × '+r[1]+' powt.)');
      });
      return lines.join('\n');
    }

    if (id === 'deload') {
      var w14 = recentWorkouts(14);
      var w28 = recentWorkouts(28);
      var avgRpeW = null;
      var rpeVals = [];
      w14.forEach(function(w){ (w.exercises||[]).forEach(function(e){ (e.setsData||[]).forEach(function(s){ if(s.rpe) rpeVals.push(s.rpe); }); }); });
      if (rpeVals.length) avgRpeW = rpeVals.reduce(function(a,b){return a+b;},0)/rpeVals.length;
      var sleepD = avgField(sleeps, 'duration', 14);
      var stressD = avgField(wellbeing, 'stress', 14);
      var signs = [];
      if (avgRpeW != null && avgRpeW > 8.5) signs.push('RPE średnie z 2 tyg.: '+avgRpeW.toFixed(1)+' — bardzo wysoko');
      if (sleepD != null && sleepD < 6.5) signs.push('Sen '+sleepD.toFixed(1)+'h — niedobór');
      if (stressD != null && stressD > 7) signs.push('Stres '+stressD.toFixed(0)+'/10 — wysoki');
      if (w14.length >= 10) signs.push(w14.length+' treningów w 2 tygodnie — duża częstotliwość');
      if (signs.length >= 2) return '⚠️ **Tak, rozważ deload.** Sygnały:\n\n• '+signs.join('\n• ')+'\n\nZrób tydzień z 50-60% obciążenia, zachowaj liczbę serii ale zmniejsz intensywność.';
      if (signs.length === 1) return '🤔 Jest jeden sygnał: '+signs[0]+'. Jeszcze nie krytyczny, ale monitoruj. Jeśli w ciągu tygodnia dojdzie kolejny — zrób deload.';
      return '✅ Na razie nie potrzebujesz deloadu. RPE'+(avgRpeW!=null?': '+avgRpeW.toFixed(1):' brak danych')+', sen'+(sleepD!=null?': '+sleepD.toFixed(1)+'h':' brak danych')+'. Trenuj dalej!';
    }

    if (id === 'volume') {
      var w7 = recentWorkouts(7);
      if (!w7.length) return '📊 Brak treningów z ostatnich 7 dni. Zaloguj kilka sesji, żebym policzył objętość.';
      var groups = {};
      w7.forEach(function(w){
        (w.exercises||[]).forEach(function(ex) {
          var db = (ET.EXERCISES_BASIC||[]).find(function(e){ return e.name===ex.name; });
          var tag = db && (db.tags||[])[0]; if (!tag) return;
          var n = (ex.setsData||[]).filter(function(s){return s.done;}).length || ex.sets || 0;
          groups[tag] = (groups[tag]||0) + n;
        });
      });
      var lines = ['📈 Objętość tygodniowa (Schoenfeld: 10-20 serii/grupę):',''];
      var tags = Object.keys(groups).sort(function(a,b){ return groups[b]-groups[a]; });
      tags.forEach(function(tag) {
        var grp = (ET.MUSCLE_GROUPS||[]).find(function(g){ return g.tag===tag; });
        var label = grp ? grp.label : tag;
        var n = groups[tag];
        var note = n < 10 ? ' ⚠️ mało' : n > 20 ? ' ⚠️ dużo' : ' ✅';
        lines.push('• '+label+': **'+n+' serii**'+note);
      });
      return lines.join('\n');
    }

    if (id === 'cardio') {
      var runs7 = runs.filter(function(r){ return (now - new Date(r.date).getTime()) <= 7*86400000; });
      if (!runs7.length) return '🏃 Nie masz biegów w tym tygodniu. Umiarkowane cardio (2-3×/tyg., 20-30 min) nie szkodzi sile i poprawia regenerację.';
      var freq = runs7.length;
      var totalMin = runs7.reduce(function(s,r){ return s+(+r.duration||0); },0);
      if (freq >= 5) return '⚠️ '+freq+' sesji cardio w tygodniu — to może hamować przyrosty siły i masy (Wilson 2012). Ogranicz do 2-3× i wybieraj rower/wiosła zamiast biegania (mniejsza interferencja z nogami).';
      if (freq >= 3 && totalMin > 120) return '🤔 '+freq+'× cardio, '+totalMin+' min/tydzień. Na granicy — jeśli Twój cel to masa, rozważ skrócenie do 20 min/sesję lub zamień bieganie na jazdę na rowerze.';
      return '✅ '+freq+'× cardio, '+totalMin+' min/tydzień. W normie — umiarkowane cardio wspiera regenerację bez szkody dla siły.';
    }

    if (id === 'sleep_tip') {
      var sl = avgField(sleeps, 'duration', 14);
      var sq = avgField(sleeps, 'quality', 14);
      if (sl == null) return '📊 Brak danych o śnie. Zaloguj kilka nocy, żebym mógł ocenić wpływ na Twój trening.';
      var lines = ['🌙 Twój sen (ostatnie 2 tyg.): średnio **'+sl.toFixed(1)+'h**'+(sq!=null?', jakość **'+sq.toFixed(1)+'/10**':'')+'',''];
      lines.push('Jak sen wpływa na trening:');
      lines.push('• <6h: synteza białek ↓20%, testosteron ↓10-15%, kortyzol ↑');
      lines.push('• 7-9h: optymalna regeneracja, konsolidacja wzorców ruchowych');
      lines.push('• Jakość > ilość: głęboki sen (fazy 3-4) jest kluczowy');
      if (sl < 7) lines.push('\n⚠️ Twoje '+sl.toFixed(1)+'h to za mało. Popraw higienę snu: stała pora, brak ekranów 1h przed snem, chłodna sypialnia (18-20°C).');
      else lines.push('\n✅ Twoje '+sl.toFixed(1)+'h jest w dobrej strefie. Utrzymuj!');
      return lines.join('\n');
    }

    return '🤖 Nie mam wystarczających danych, by odpowiedzieć. Zaloguj więcej treningów i danych o samopoczuciu.';
  }

  function SmartCoach(props) {
    var store = props.store;
    var cs = React.useState([]); var chat = cs[0], setChat = cs[1];
    var ps = React.useState('menu'); var phase = ps[0], setPhase = ps[1];
    var is = React.useState(null); var selectedIntent = is[0], setSelectedIntent = is[1];
    var es = React.useState(false); var expanded = es[0], setExpanded = es[1];

    var exerciseNames = React.useMemo(function(){ return getExerciseNames(store); }, [store.workouts]);

    function selectIntent(intent) {
      setSelectedIntent(intent);
      if (intent.needsExercise && exerciseNames.length > 0) {
        setChat(function(c){ return c.concat({ from:'user', text:intent.icon+' '+intent.label }); });
        setPhase('pick_exercise');
      } else {
        runAnalysis(intent, null);
      }
    }

    function runAnalysis(intent, exercise) {
      setChat(function(c){
        var msgs = exercise
          ? c.concat({ from:'user', text:exercise })
          : c.concat({ from:'user', text:intent.icon+' '+intent.label });
        var answer = analyzeIntent(intent.id, exercise, store);
        return msgs.concat({ from:'coach', text:answer });
      });
      setPhase('done');
    }

    function reset() { setPhase('menu'); setSelectedIntent(null); }

    if (!expanded) {
      return _h('div', { className:'card', style:{ marginBottom:16, cursor:'pointer', display:'flex', alignItems:'center', gap:12 },
        onClick:function(){ setExpanded(true); }
      },
        _h('div', { style:{ width:42, height:42, borderRadius:'50%', background:'linear-gradient(135deg, var(--a-dim), var(--a))', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.3rem', flexShrink:0 } }, '🧠'),
        _h('div', { style:{ flex:1 } },
          _h('div', { style:{ fontWeight:700, fontSize:'.88rem' } }, 'Smart Coach'),
          _h('div', { style:{ fontSize:'.7rem', color:'var(--t3)' } }, 'Zapytaj o plateau, regenerację, obciążenie...')
        ),
        _h('div', { style:{ color:'var(--t3)', fontSize:'1.2rem' } }, '›')
      );
    }

    return _h('div', { className:'card', style:{ marginBottom:16 } },
      _h('div', { style:{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 } },
        _h('div', { style:{ display:'flex', alignItems:'center', gap:8 } },
          _h('div', { style:{ width:32, height:32, borderRadius:'50%', background:'linear-gradient(135deg, var(--a-dim), var(--a))', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1rem' } }, '🧠'),
          _h('div', { style:{ fontWeight:700, fontSize:'.88rem' } }, 'Smart Coach')
        ),
        _h('button', { style:{ background:'none', border:'none', color:'var(--t3)', cursor:'pointer', fontSize:'.78rem' },
          onClick:function(){ setExpanded(false); setChat([]); setPhase('menu'); }
        }, '✕')
      ),

      chat.length > 0 && _h('div', { style:{ maxHeight:300, overflowY:'auto', marginBottom:12, display:'flex', flexDirection:'column', gap:8 } },
        chat.map(function(msg, i) {
          var isUser = msg.from === 'user';
          return _h('div', { key:i, style:{ alignSelf:isUser?'flex-end':'flex-start', maxWidth:'85%',
            padding:'8px 12px', borderRadius:isUser?'12px 12px 2px 12px':'12px 12px 12px 2px',
            background:isUser?'var(--a-dim)':'var(--s3)',
            border:'1px solid '+(isUser?'var(--a)33':'var(--b1)'),
            fontSize:'.78rem', color:isUser?'var(--a-light)':'var(--t2)', lineHeight:1.5,
            whiteSpace:'pre-wrap'
          } }, msg.text);
        })
      ),

      phase === 'menu' && _h('div', { style:{ display:'flex', flexWrap:'wrap', gap:6 } },
        INTENTS.map(function(intent) {
          return _h('button', { key:intent.id, style:{
            padding:'6px 10px', borderRadius:20, border:'1px solid var(--b2)',
            background:'var(--s3)', color:'var(--t2)', cursor:'pointer',
            fontSize:'.72rem', fontWeight:600, transition:'all .15s', whiteSpace:'nowrap'
          },
            onMouseEnter:function(e){ e.currentTarget.style.borderColor='var(--a)'; e.currentTarget.style.color='var(--a-light)'; },
            onMouseLeave:function(e){ e.currentTarget.style.borderColor='var(--b2)'; e.currentTarget.style.color='var(--t2)'; },
            onClick:function(){ selectIntent(intent); }
          }, intent.icon+' '+intent.label);
        })
      ),

      phase === 'pick_exercise' && _h('div', null,
        _h('div', { style:{ fontSize:'.76rem', color:'var(--t3)', marginBottom:8, fontWeight:600 } }, 'Na jakim ćwiczeniu?'),
        _h('div', { style:{ display:'flex', flexWrap:'wrap', gap:6, maxHeight:160, overflowY:'auto' } },
          exerciseNames.slice(0,20).map(function(name) {
            return _h('button', { key:name, style:{
              padding:'5px 10px', borderRadius:16, border:'1px solid var(--b2)',
              background:'var(--s3)', color:'var(--t2)', cursor:'pointer',
              fontSize:'.7rem', transition:'all .15s'
            },
              onClick:function(){ runAnalysis(selectedIntent, name); }
            }, name);
          })
        )
      ),

      phase === 'done' && _h('div', { style:{ display:'flex', gap:8, marginTop:8 } },
        _h('button', { className:'btn btn-secondary btn-sm', onClick:reset }, 'Nowe pytanie'),
        _h('button', { className:'btn btn-ghost btn-sm', onClick:function(){ setExpanded(false); setChat([]); setPhase('menu'); } }, 'Zamknij')
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

    // ── Karta CTA treningu: co realnie zaplanowano/zrobiono dziś ──────────
    // Design zakłada stały harmonogram godzinowy ("DZIŚ 17:30") — apka nie ma
    // pola z godziną sesji, więc pomijamy godzinę i pokazujemy tylko to, co
    // faktycznie wynika z danych (Kalendarz/Plan → store.weekPlans, albo brak).
    var today = ET.dstr();
    var todayWorkout = (store.workouts || []).find(function(w){ return w.date === today; });
    var todayPlanEntry = (store.weekPlans || []).find(function(e){ return e.date === today && e.type !== 'rest'; });
    var effectivePlans = (typeof ET.getEffectivePlans === 'function') ? ET.getEffectivePlans(store) : [];
    var todayPlan = todayPlanEntry && effectivePlans.find(function(pl){ return pl.id === todayPlanEntry.planId; });

    // Segment aktywnego meta-planu (Plan tygodnia) — pokazujemy tylko, gdy user
    // faktycznie podzielił plan na >1 segment; inaczej nie ma nic realnego
    // do wyświetlenia (design zakłada "Tydzień 6 · blok siłowy", ale apka nie
    // liczy numeru tygodnia — nie fabrykujemy tej liczby).
    var segmentLabel = (function() {
      var metaPlans = (typeof ET.getMetaPlans === 'function') ? ET.getMetaPlans(store) : [];
      if (!metaPlans.length) return null;
      var meta = (lastW && metaPlans.find(function(m){ return (m.units || []).some(function(u){ return u.id === lastW.planId; }); })) || metaPlans[0];
      var segs = meta.segments || [];
      if (segs.length < 2) return null;
      return meta.name + ' · ' + segs[segs.length - 1].name;
    })();

    // Wykres objętości: bieżący tydzień (Pn→Nd), suma kg zapisanych treningów/dzień.
    var weekVol = React.useMemo(function() {
      var start = mondayOf(new Date());
      var days = [];
      for (var i = 0; i < 7; i++) {
        var d = new Date(start); d.setDate(start.getDate() + i);
        days.push({ key:dkey(d), label:WEB_DAYS[i], vol:0, isToday:dkey(d) === dkey(new Date()) });
      }
      var index = {}; days.forEach(function(d){ index[d.key] = d; });
      (store.workouts || []).forEach(function(w){ var slot = index[w.date]; if (slot) slot.vol += (+w.volume || 0); });
      var max = days.reduce(function(m, d){ return Math.max(m, d.vol); }, 0);
      return { days:days, max:max };
    }, [store.workouts]);

    // Siatka modułów 3×2 wg handoffu. `icon` to nazwa ścieżki z ET.Icon
    // (rodzina liniowa SVG) — emoji usunięte, były sygnałem „darmowej" apki.
    // Tap otwiera arkusz szybkiego wpisu, bo główny kontekst to siłownia
    // w pośpiechu; pełny moduł jest pod przyciskiem [+] w pasku nawigacji.
    var QUICK = [
      {
        icon:'dumbbell', label:'Siła', color:'var(--a)',
        sub: lastW ? daysAgo(lastW.date) : 'Brak danych',
        onClick: function(){ setShowWorkoutPicker(true); }
      },
      {
        icon:'running', label:'Bieganie', color:'var(--green)',
        sub: lastR ? daysAgo(lastR.date) + (lastR.distance ? ' · ' + lastR.distance + ' km' : '') : 'Brak danych',
        onClick: function(){ setShowRunAdd(true); }
      },
      {
        icon:'flame', label:'Sauna', color:'var(--orange)',
        sub: lastSa ? daysAgo(lastSa.date) + (lastSa.duration ? ' · ' + lastSa.duration + ' min' : '') : 'Brak danych',
        onClick: function(){ setShowSaunaAdd(true); }
      },
      {
        icon:'pill', label:'Suple', color:'var(--purple)',
        sub: (store.supplements || []).length + ' suplementów',
        onClick: function(){ setShowSuppl(true); }
      },
      {
        icon:'ruler', label:'Pomiary', color:'var(--teal)',
        sub: lastM ? daysAgo(lastM.date) : 'Brak danych',
        onClick: function(){ setShowMeasAdd(true); }
      },
      {
        icon:'moon', label:'Sen', color:'var(--yellow)',
        sub: lastS ? (lastS.duration ? lastS.duration + 'h · ' : '') + daysAgo(lastS.date) : 'Brak danych',
        onClick: function(){ setShowSleepAdd(true); }
      },
    ];

    // Dodatkowe kafelki z puli (Profil → Ustawienia → Dodatkowe kafelki)
    var FLAT_NAV = (ET.NAV_GROUPS||[]).reduce(function(a,g){ return a.concat(g.items); }, []);
    (store.quickTiles||[]).forEach(function(id){
      var item = FLAT_NAV.find(function(i){ return i.id===id; });
      if (!item) return;
      QUICK.push({ icon:item.icon, label:item.label, color:'var(--a)', sub:'Otwórz moduł', onClick:function(){ navigate(id); } });
    });

    // Widoczność widgetów — konfigurowana w Profil → Ustawienia Dashboardu
    var dw = store.dashboardWidgets || {};
    function widgetOn(id) { return dw[id] !== false; }

    return _h('div', { className:'scr-in' },

      // ── NAGŁÓWEK: data · powitanie · segment planu (jeśli realny) · avatar ──
      _h('div', { style:{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:12, marginBottom:18 } },
        _h('div', { style:{ minWidth:0 } },
          _h('div', { style:{ fontSize:10.5, fontWeight:800, letterSpacing:'.14em', color:'var(--t3)', textTransform:'uppercase', marginBottom:6 } },
            new Date().toLocaleDateString('pl-PL', { weekday:'long', day:'numeric', month:'long' })),
          _h('div', { className:'dash-greeting' }, ET.greeting() + (p && p.name ? ', ' + p.name : '')),
          segmentLabel && _h('div', { onClick:function(){ navigate('plan'); },
            style:{ display:'inline-flex', alignItems:'center', gap:4, marginTop:7, cursor:'pointer', color:'var(--t2)', fontSize:12, fontWeight:600 } },
            segmentLabel,
            _h('svg', { width:12, height:12, viewBox:'0 0 24 24', fill:'none', stroke:'currentColor', strokeWidth:2.4, strokeLinecap:'round', strokeLinejoin:'round' },
              _h('path', { d:'M9 6l6 6-6 6' }))
          )
        ),
        _h('div', { onClick:function(){ navigate('profile'); }, style:{ position:'relative', flexShrink:0, width:42, height:42, cursor:'pointer' } },
          _h('div', { className:'avatar-ring-pulse' }),
          _h('div', { style:{ width:42, height:42, borderRadius:'50%', background:'linear-gradient(150deg,#60A5FA,#3B82F6 55%,#8B5CF6)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:15, fontWeight:800, color:'#fff' } },
            (p && p.name ? p.name.trim().charAt(0).toUpperCase() : (typeof ET.Icon === 'function' ? ET.Icon('user', 19) : 'U'))
          )
        )
      ),

      widgetOn('readiness') && _h(ReadinessCard, { readiness:readiness, setReadiness:setReadiness, onOpen:function(){ setShowReadiness(true); } }),

      // ── KARTA CTA TRENINGU — gradientowa ramka + shimmer (.cta-card) ──────
      widgetOn('todayCta') && _h('div', { className:'cta-card', style:{ marginBottom:16 } },
        _h('div', { className:'cta-card-inner' },
          todayWorkout
            ? // sesja dziś już zapisana — spokojny wariant „zrobione"
              _h('div', { style:{ position:'relative', display:'flex', alignItems:'center', gap:12 }, onClick:function(){ navigate('history'); } },
                _h('div', { style:{ width:38, height:38, borderRadius:13, background:'rgba(16,185,129,.16)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 } },
                  _h('svg', { width:19, height:19, viewBox:'0 0 24 24', fill:'none', stroke:'var(--green)', strokeWidth:2.6, strokeLinecap:'round', strokeLinejoin:'round' },
                    _h('path', { d:'M4 12.5l5.2 5.2L20 6.8' }))),
                _h('div', { style:{ flex:1, minWidth:0 } },
                  _h('div', { style:{ fontSize:'.65rem', fontWeight:800, letterSpacing:'.08em', color:'var(--green)', textTransform:'uppercase' } }, 'Dziś · zrobione'),
                  _h('div', { style:{ fontSize:15, fontWeight:700, marginTop:3 } }, todayWorkout.name || 'Trening'),
                  _h('div', { style:{ fontSize:11.5, color:'var(--t3)', marginTop:2 } }, Math.round(+todayWorkout.volume || 0) + ' kg objętości')
                )
              )
            : todayPlanEntry
              ? // sesja zaplanowana na dziś (Kalendarz/Plan), jeszcze nie zrobiona
                _h('div', { style:{ position:'relative' } },
                  _h('div', { style:{ display:'inline-flex', alignItems:'center', gap:6, padding:'4px 10px', borderRadius:100, background:'rgba(96,165,250,.16)', marginBottom:12 } },
                    _h('span', { style:{ width:6, height:6, borderRadius:'50%', background:'var(--a-light)', boxShadow:'0 0 6px var(--a-light)' } }),
                    _h('span', { style:{ fontSize:9.5, fontWeight:800, letterSpacing:'.1em', color:'var(--a-light)', textTransform:'uppercase' } }, 'Dziś')
                  ),
                  _h('div', { style:{ fontSize:22, fontWeight:800, letterSpacing:'-.03em', marginBottom:4 } }, todayPlanEntry.planName),
                  _h('div', { style:{ fontSize:12, color:'var(--t3)', marginBottom:16 } },
                    todayPlan ? (todayPlan.exercises || []).length + ' ćwiczeń' + (todayPlan.desc ? ' · ' + todayPlan.desc : '') : 'Zaplanowana sesja'),
                  _h('button', { className:'btn-accent', style:{ width:'100%', height:52, border:'none', fontSize:14, cursor:'pointer' },
                    onClick:function(){ navigate('strength', { plan: todayPlan || { id:todayPlanEntry.planId, name:todayPlanEntry.planName, icon:todayPlanEntry.icon } }); }
                  }, 'Start')
                )
              : // nic nie zaplanowano na dziś — ogólne zaproszenie, bez zmyślonej godziny
                _h('div', { style:{ position:'relative' } },
                  _h('div', { style:{ fontSize:18, fontWeight:800, letterSpacing:'-.02em', marginBottom:4 } }, 'Brak zaplanowanej sesji'),
                  _h('div', { style:{ fontSize:12, color:'var(--t3)', marginBottom:16 } }, 'Wybierz trening z listy i zacznij, gdy będziesz gotów.'),
                  _h('button', { className:'btn-accent', style:{ width:'100%', height:52, border:'none', fontSize:14, cursor:'pointer' },
                    onClick:function(){ setShowWorkoutPicker(true); }
                  }, 'Wybierz trening')
                )
        )
      ),

      widgetOn('regen') && _h(RegenerationBar, { store:store }),

      widgetOn('coreScores') && _h(CoreScoresCard, null),

      widgetOn('smartCoach') && _h(SmartCoach, { store:store }),

      // ── SIATKA MODUŁÓW 3×2 — kafelki tintowane kolorem modułu, bez emoji ──
      widgetOn('quickStart') && _h('div', { style:{ marginBottom:20 } },
        _h('div', { className:'section-hdr', style:{ marginBottom:10 } },
          _h('h2', null, 'Szybki start')
        ),
        _h('div', { style:{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8 } },
          QUICK.map(function(q, i) {
            // Kafelki dodane przez usera (Profil → Ustawienia → Dodatkowe kafelki)
            // wciąż niosą emoji z NAV_GROUPS (ten katalog nie jest jeszcze
            // przeprojektowany) — pokaż je jako tekst, a nazwy ikon SVG jako Icon().
            var isSvgIcon = typeof q.icon === 'string' && /^[a-z]+$/.test(q.icon);
            return _h('div', { key:i,
              style:{ background:'linear-gradient(160deg,color-mix(in srgb,'+q.color+' 13%, transparent),rgba(255,255,255,.02))',
                border:'1px solid color-mix(in srgb,'+q.color+' 24%, transparent)', borderRadius:18,
                padding:'14px 10px', textAlign:'center', cursor:'pointer', transition:'transform .15s', userSelect:'none' },
              onClick:q.onClick
            },
              _h('div', { style:{ width:34, height:34, margin:'0 auto 8px', borderRadius:13, display:'flex', alignItems:'center', justifyContent:'center',
                color:q.color, background:'color-mix(in srgb,'+q.color+' 18%, transparent)' } },
                isSvgIcon ? ET.Icon(q.icon, 19) : _h('span', { style:{ fontSize:16 } }, q.icon)
              ),
              _h('div', { style:{ fontSize:12.5, fontWeight:700, color:'var(--t1)', marginBottom:3, lineHeight:1.2 } }, q.label),
              _h('div', { style:{ fontSize:10.5, color:'var(--t3)', lineHeight:1.3, minHeight:14 } }, q.sub)
            );
          })
        )
      ),

      // ── WYKRES OBJĘTOŚCI 7 DNI (bieżący tydzień) ───────────────────────
      widgetOn('weekVolume') && weekVol.max > 0 && _h('div', { className:'card', style:{ marginBottom:20 } },
        _h('div', { className:'section-hdr', style:{ marginBottom:14 } }, _h('h2', null, 'Objętość — ten tydzień')),
        _h('div', { style:{ display:'flex', alignItems:'flex-end', gap:8, height:72 } },
          weekVol.days.map(function(d) {
            var h = weekVol.max > 0 ? Math.max(4, Math.round(d.vol / weekVol.max * 100)) : 4;
            var bg = d.isToday ? 'linear-gradient(180deg,#8B5CF6,#3B82F6)' : d.vol > 0 ? 'rgba(59,130,246,.55)' : 'rgba(255,255,255,.06)';
            return _h('div', { key:d.key, style:{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:6 } },
              _h('div', { style:{ width:'100%', borderRadius:'4px 4px 0 0', height:h+'%', background:bg,
                boxShadow: d.isToday ? '0 0 12px -2px rgba(139,92,246,.6)' : 'none', transition:'height .4s cubic-bezier(.2,.8,.2,1)' } }),
              _h('span', { style:{ fontSize:9.5, fontWeight:700, color: d.isToday ? 'var(--a-light)' : 'var(--t3)' } }, d.label)
            );
          })
        )
      ),

      widgetOn('recent') && _h('div', { style:{ marginBottom:20 } },
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
                : _h('div', null,
                    _h('div', { style:{ fontSize:'.78rem', color:'var(--t3)', marginTop:6 } }, 'Brak danych'),
                    _h('div', { style:{ fontSize:'.64rem', color:'var(--t3)', opacity:.7, marginTop:2 } }, 'Dotknij, by dodać →')
                  )
            );
          })
        )
      ),

      widgetOn('goals') && activeGoals.length > 0 && _h('div', { style:{ marginBottom:20 } },
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

      // ── WKRÓTCE (coming soon) — szara półprzezroczysta nakładka ──────────
      widgetOn('comingSoon') && _h('div', { style:{ marginBottom:20 } },
        _h('div', { className:'section-hdr', style:{ marginBottom:10 } }, _h('h2', null, 'Wkrótce')),
        _h('div', { style:{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 } },
          [{ icon:'📓', label:'Dziennik' }, { icon:'✅', label:'Nawyki' }].map(function(q) {
            return _h('div', { key:q.label, style:{ position:'relative', borderRadius:'var(--r3)', overflow:'hidden' } },
              _h('div', { style:{ background:'var(--s2)', border:'1px solid var(--b1)', borderRadius:'var(--r3)', padding:'18px 10px', textAlign:'center' } },
                _h('div', { style:{ fontSize:'1.6rem', marginBottom:6 } }, q.icon),
                _h('div', { style:{ fontSize:'.8rem', fontWeight:700, color:'var(--t1)' } }, q.label)
              ),
              _h('div', { style:{ position:'absolute', inset:0, background:'rgba(20,20,32,.62)', backdropFilter:'blur(1px)', WebkitBackdropFilter:'blur(1px)', display:'flex', alignItems:'center', justifyContent:'center', borderRadius:'var(--r3)' } },
                _h('span', { style:{ fontSize:'.66rem', fontWeight:800, color:'var(--t2)', letterSpacing:'.06em', textTransform:'uppercase', background:'rgba(0,0,0,.35)', padding:'4px 10px', borderRadius:99 } }, 'Coming soon')
              )
            );
          })
        )
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

  // ── WEB DASHBOARD — ekran „Dziś" wg designu „EasyTraining Aplikacja" ──────
  // Renderowany tylko w przeglądarce (ET.IS_WEB); apka natywna iOS używa
  // NewDashboard. Wartości px/kolory 1:1 z makietą, dane realne ze store'u.
  var WEB_DAYS = ['Pn','Wt','Śr','Cz','Pt','So','Nd'];

  function dkey(d) {
    return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
  }
  function mondayOf(date) {
    var x = new Date(date); x.setHours(0,0,0,0);
    x.setDate(x.getDate() - ((x.getDay()+6) % 7));   // tydzień od poniedziałku
    return x;
  }
  function plDec(n, dec) { return n.toFixed(dec).replace('.', ','); }

  // Etykiety READINESS_FIELDS bez emoji — design web używa wyłącznie tekstu
  // i ikon liniowych (emoji były sygnałem „darmowej" aplikacji).
  function stripEmoji(s) {
    var i = String(s).indexOf(' ');
    return i > 0 ? String(s).slice(i+1) : String(s);
  }

  var SECTION_LABEL = { fontSize:9, fontWeight:800, lineHeight:1, letterSpacing:'.14em', color:'var(--t3)' };

  function WebDashboard() {
    var su = ET.useStore(); var store = su.store;
    var nav = ET.useNav(); var navigate = nav.navigate;

    var rds = React.useState({ willingness:2, state:2, fatigue:2 });
    var readiness = rds[0], setReadiness = rds[1];
    var srs = React.useState(false); var showReadiness = srs[0], setShowReadiness = srs[1];

    var pct = calcReadinessPct(readiness);
    var readyTitle = pct >= 70 ? 'Dobra gotowość' : pct >= 40 ? 'Średnia gotowość' : 'Niska gotowość';
    var readyDesc = pct >= 70
      ? 'Organizm odpowiada dobrze — możesz realizować plan w pełnym obciążeniu.'
      : pct >= 40
        ? 'Stan przeciętny — trzymaj się planu, ale nie ustawiaj dziś rekordów.'
        : 'Niska gotowość — rozważ lżejszą sesję albo dzień regeneracji.';

    var workouts = store.workouts || [];
    // Dwie różne „dzisiejsze" daty, bo ET.dstr() liczy dzień w UTC
    // (components.js:7 — toISOString), więc między północą a 1:00/2:00 czasu
    // polskiego wskazuje wczoraj. `todayLocal` służy do tego, co użytkownik
    // widzi (podświetlenie dnia na wykresie), `todayStore` do dopasowania
    // rekordów, które i tak zapisano kluczem z dstr().
    var todayLocal = dkey(new Date());
    var todayStore = ET.dstr();
    var hasCheckin = (store.wellbeingEntries || []).some(function(e){ return e.date === todayStore && !e.tag; });

    // ── TEN TYDZIEŃ: sesje, objętość, słupki 7 dni ──
    var week = React.useMemo(function() {
      var start = mondayOf(new Date());
      var days = [];
      for (var i = 0; i < 7; i++) {
        var d = new Date(start); d.setDate(start.getDate() + i);
        days.push({ key:dkey(d), label:WEB_DAYS[i], vol:0, isToday:dkey(d) === todayLocal });
      }
      var index = {};
      days.forEach(function(d){ index[d.key] = d; });
      var sessions = 0, volume = 0;
      workouts.forEach(function(w) {
        var slot = index[w.date];
        if (!slot) return;
        sessions++;
        var v = +w.volume || 0;
        volume += v; slot.vol += v;
      });
      var max = days.reduce(function(m,d){ return Math.max(m, d.vol); }, 0);
      return { days:days, sessions:sessions, volume:volume, max:max };
    }, [workouts, todayLocal]);

    var volLabel = week.volume >= 1000 ? plDec(week.volume/1000, 1) + ' t' : Math.round(week.volume) + ' kg';

    // ── SERIA SUPLI: kolejne dni z kompletem odhaczonych suplementów ──
    var suppStreak = React.useMemo(function() {
      var suppls = store.supplements || [];
      if (!suppls.length) return 0;
      var checks = store.supplementChecks || {};
      function complete(k) {
        var day = checks[k] || {};
        return suppls.every(function(s){ return !!day[s.id]; });
      }
      var d = new Date();
      // Dzień jeszcze trwa — niedokończone „dziś" nie zeruje serii.
      if (!complete(dkey(d))) d.setDate(d.getDate() - 1);
      var streak = 0;
      while (complete(dkey(d)) && streak < 999) { streak++; d.setDate(d.getDate() - 1); }
      return streak;
    }, [store.supplements, store.supplementChecks]);

    // ── PLANY ──
    var plans = (typeof ET.getEffectivePlans === 'function') ? ET.getEffectivePlans(store)
      : (typeof ET.WORKOUT_PLANS !== 'undefined' ? ET.WORKOUT_PLANS : []);
    function lastDoneOf(p) {
      var w = workouts.find(function(x){ return x.planId === p.id || x.name === p.name; });
      return w ? daysAgo(w.date) : 'jeszcze nie robiony';
    }

    var recent = workouts.slice(0, 3);

    function ringIcon(color) {
      return (typeof ET.Icon === 'function')
        ? _h('span', { style:{ color:color, display:'flex' } }, ET.Icon('dumbbell', 19))
        : null;
    }

    return _h('div', { className:'scr-in', style:{ display:'flex', flexDirection:'column', gap:26 } },

      // ══ RZĄD: GOTOWOŚĆ + TEN TYDZIEŃ ══
      _h('div', { style:{ display:'flex', gap:16, flexWrap:'wrap' } },

        // — karta gotowości (szklana) —
        _h('div', { className:'glass', style:{ flex:'1 1 300px', display:'flex', gap:16, alignItems:'center', padding:20, borderRadius:22 } },
          _h('div', { style:{ position:'relative', flex:'none', width:104, height:104, cursor:'pointer' },
            onClick:function(){ setShowReadiness(true); }, title:'Zaktualizuj gotowość' },
            _h('svg', { width:104, height:104, viewBox:'0 0 104 104', style:{ transform:'rotate(-90deg)' } },
              _h('defs', null,
                _h('linearGradient', { id:'wdashRing', x1:'0', y1:'0', x2:'1', y2:'1' },
                  _h('stop', { offset:'0', stopColor:'#60A5FA' }),
                  _h('stop', { offset:'.55', stopColor:'#3B82F6' }),
                  _h('stop', { offset:'1', stopColor:'#8B5CF6' })
                )
              ),
              _h('circle', { cx:52, cy:52, r:44, fill:'none', stroke:'rgba(255,255,255,.07)', strokeWidth:8.5 }),
              _h('circle', { cx:52, cy:52, r:44, fill:'none', stroke:'url(#wdashRing)', strokeWidth:8.5,
                strokeLinecap:'round', strokeDasharray:276.5, strokeDashoffset:276.5 * (1 - pct/100),
                style:{ transition:'stroke-dashoffset .6s cubic-bezier(.2,.8,.2,1)' } })
            ),
            _h('div', { style:{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:2 } },
              _h('span', { style:{ fontSize:30, fontWeight:800, lineHeight:1, letterSpacing:'-.045em', fontVariantNumeric:'tabular-nums' } }, pct),
              _h('span', { style:{ fontSize:8, fontWeight:800, lineHeight:1, letterSpacing:'.14em', color:'var(--t3)' } }, 'GOTOWOŚĆ')
            )
          ),
          _h('div', { style:{ display:'flex', flexDirection:'column', gap:8, minWidth:0 } },
            _h('div', { style:{ fontSize:15, fontWeight:700, lineHeight:1.2, letterSpacing:'-.02em' } }, readyTitle),
            _h('div', { style:{ fontSize:12, fontWeight:400, lineHeight:1.45, color:'var(--t2)', textWrap:'pretty' } }, readyDesc),
            _h('div', { style:{ display:'flex', gap:7, flexWrap:'wrap', marginTop:2 } },
              READINESS_FIELDS.map(function(f) {
                var val = readiness[f.key] || 2;
                var col = val === 3 ? 'var(--green)' : val === 1 ? 'var(--red)' : 'var(--yellow)';
                return _h('div', { key:f.key, style:{ display:'flex', flexDirection:'column', gap:5, padding:'8px 11px', borderRadius:12, background:'rgba(255,255,255,.04)', border:'1px solid rgba(255,255,255,.07)' } },
                  _h('span', { style:{ fontSize:8, fontWeight:800, lineHeight:1, letterSpacing:'.12em', color:'var(--t3)', textTransform:'uppercase' } }, f.label),
                  _h('span', { style:{ fontSize:14, fontWeight:800, lineHeight:1, color:col } }, stripEmoji(f.opts[val-1]))
                );
              }),
              _h('div', { className:'wcta', onClick:function(){ navigate('wellbeing'); },
                style:{ display:'flex', alignItems:'center', gap:6, alignSelf:'stretch', padding:'0 13px', borderRadius:12, cursor:'pointer',
                  background:'rgba(96,165,250,.14)', border:'1px solid rgba(96,165,250,.30)', color:'var(--a-light)', fontSize:11, fontWeight:700 } },
                hasCheckin ? 'Szczegóły' : 'Zrób check-in',
                _h('svg', { width:13, height:13, viewBox:'0 0 24 24', fill:'none', stroke:'currentColor', strokeWidth:2.3, strokeLinecap:'round', strokeLinejoin:'round' },
                  _h('path', { d:'M4 12h14M12 6l6 6-6 6' }))
              )
            )
          )
        ),

        // — karta „TEN TYDZIEŃ" —
        _h('div', { className:'wcard', style:{ flex:'1 1 260px', display:'flex', flexDirection:'column', gap:12, padding:20, borderRadius:22 } },
          _h('span', { style:SECTION_LABEL }, 'TEN TYDZIEŃ'),
          _h('div', { style:{ display:'flex', gap:20 } },
            [
              { v:String(week.sessions), l:'SESJE', c:null },
              { v:volLabel,              l:'OBJĘTOŚĆ', c:null },
              { v:String(suppStreak),    l:'SERIA SUPLI', c:'var(--purple)' },
            ].map(function(s, i) {
              return _h('div', { key:i, style:{ display:'flex', flexDirection:'column', gap:4 } },
                _h('span', { style:{ fontSize:26, fontWeight:800, lineHeight:1, letterSpacing:'-.04em', fontVariantNumeric:'tabular-nums', color:s.c || 'var(--t1)' } }, s.v),
                _h('span', { style:{ fontSize:10, fontWeight:600, lineHeight:1, letterSpacing:'.08em', color:'var(--t3)' } }, s.l)
              );
            })
          ),
          _h('div', { style:{ display:'flex', alignItems:'flex-end', gap:6, height:64, marginTop:2 } },
            week.days.map(function(d) {
              var h = week.max > 0 ? Math.max(4, Math.round(d.vol / week.max * 100)) : 4;
              var bg = d.isToday ? 'linear-gradient(180deg,#8B5CF6,#3B82F6)'
                : d.vol > 0 ? 'rgba(59,130,246,.55)' : 'rgba(255,255,255,.06)';
              return _h('div', { key:d.key, style:{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:6 },
                title: d.vol > 0 ? Math.round(d.vol) + ' kg' : 'brak sesji' },
                _h('div', { style:{ width:'100%', borderRadius:'4px 4px 0 0', height:h+'%', background:bg, transition:'height .4s cubic-bezier(.2,.8,.2,1)' } }),
                _h('span', { style:{ fontSize:9, fontWeight:700, lineHeight:1, color: d.isToday ? 'var(--a-light)' : 'var(--t3)' } }, d.label)
              );
            })
          )
        )
      ),

      // ══ PLANY ══
      _h('div', { style:{ display:'flex', flexDirection:'column', gap:14 } },
        _h('div', { style:{ display:'flex', alignItems:'center', justifyContent:'space-between' } },
          _h('span', { style:SECTION_LABEL }, 'ZACZNIJ TRENING')
        ),
        plans.length === 0
          ? _h('div', { style:{ padding:'28px 20px', borderRadius:20, border:'1px dashed rgba(255,255,255,.12)', background:'rgba(255,255,255,.02)', textAlign:'center', color:'var(--t3)', fontSize:12 } },
              'Brak planów treningowych')
          : _h('div', { style:{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(240px,1fr))', gap:14 } },
              plans.map(function(p) {
                var col = p.color || 'var(--a)';
                return _h('div', { key:p.id, className:'wcard wplan', style:{ display:'flex', flexDirection:'column', gap:12, padding:20, borderRadius:20 } },
                  _h('div', { style:{ display:'flex', alignItems:'center', justifyContent:'space-between' } },
                    _h('div', { style:{ width:36, height:36, borderRadius:13, display:'flex', alignItems:'center', justifyContent:'center',
                      background:'color-mix(in srgb,'+col+' 16%, transparent)' } }, ringIcon(col)),
                    _h('span', { style:{ fontSize:10.5, fontWeight:600, lineHeight:1, color:'var(--t3)' } }, lastDoneOf(p))
                  ),
                  _h('div', { style:{ fontSize:15, fontWeight:700, lineHeight:1.25, letterSpacing:'-.02em' } }, p.name),
                  _h('div', { style:{ fontSize:11.5, fontWeight:400, lineHeight:1.4, color:'var(--t3)' } }, [p.day, p.desc].filter(Boolean).join(' · ')),
                  _h('div', { className:'wplay', onClick:function(){ navigate('strength', { plan:p }); },
                    style:{ marginTop:4, display:'flex', alignItems:'center', justifyContent:'center', gap:7, height:44, borderRadius:15,
                      background:'color-mix(in srgb,'+col+' 18%, transparent)', border:'1px solid color-mix(in srgb,'+col+' 38%, transparent)',
                      color:col, fontSize:12.5, fontWeight:800, cursor:'pointer' } },
                    _h('svg', { width:13, height:13, viewBox:'0 0 24 24', fill:'currentColor' }, _h('path', { d:'M7 4.5l12 7.5-12 7.5z' })),
                    'Zacznij'
                  )
                );
              })
            )
      ),

      // ══ OSTATNIE SESJE ══
      _h('div', { style:{ display:'flex', flexDirection:'column', gap:14 } },
        _h('span', { style:SECTION_LABEL }, 'OSTATNIE SESJE'),
        recent.length > 0
          ? _h('div', { className:'wcard', style:{ display:'flex', flexDirection:'column', borderRadius:20, overflow:'hidden' } },
              recent.map(function(w, i) {
                return _h('div', { key:w.id || i, style:{ display:'flex', alignItems:'center', gap:16, padding:'15px 20px',
                  borderBottom: i < recent.length-1 ? '1px solid rgba(255,255,255,.05)' : 'none' } },
                  _h('div', { style:{ flex:'none', width:34, height:34, borderRadius:12, background:'rgba(16,185,129,.14)', display:'flex', alignItems:'center', justifyContent:'center' } },
                    _h('svg', { width:17, height:17, viewBox:'0 0 24 24', fill:'none', stroke:'var(--green)', strokeWidth:2.6, strokeLinecap:'round', strokeLinejoin:'round' },
                      _h('path', { d:'M4 12.5l5.2 5.2L20 6.8' }))
                  ),
                  _h('div', { style:{ flex:1, display:'flex', flexDirection:'column', gap:4, minWidth:0 } },
                    _h('span', { style:{ fontSize:13, fontWeight:700, lineHeight:1.2 } }, w.name || 'Trening'),
                    _h('span', { style:{ fontSize:11, fontWeight:400, lineHeight:1, color:'var(--t3)' } },
                      [ET.fmtDateShort(w.date), (w.exercises || []).length + ' ćw.'].filter(Boolean).join(' · '))
                  ),
                  _h('span', { style:{ fontSize:13, fontWeight:800, lineHeight:1, fontVariantNumeric:'tabular-nums' } }, Math.round(+w.volume || 0) + ' kg')
                );
              })
            )
          : _h('div', { style:{ display:'flex', flexDirection:'column', alignItems:'center', gap:9, padding:'38px 20px', borderRadius:20,
              border:'1px dashed rgba(255,255,255,.12)', background:'rgba(255,255,255,.02)' } },
              _h('div', { style:{ fontSize:14, fontWeight:700, lineHeight:1.2 } }, 'Brak zapisanych sesji'),
              _h('div', { style:{ fontSize:12, fontWeight:400, lineHeight:1.4, color:'var(--t3)', textAlign:'center', maxWidth:300 } },
                'Wybierz plan powyżej i zapisz pierwszą serię — historia i statystyki policzą się same.')
            )
      ),

      _h(ReadinessSheet, { open:showReadiness, onClose:function(){ setShowReadiness(false); }, readiness:readiness, setReadiness:setReadiness })
    );
  }

  // ── DASHBOARD ROUTER ─────────────────────────────────────────────────────
  function Dashboard() {
    var su = ET.useStore(); var store = su.store;
    var useOld = store.settings && store.settings.useOldDashboard;
    if (useOld) return _h(OldDashboard, null);
    if (ET.IS_WEB) return _h(WebDashboard, null);
    return _h(NewDashboard, null);
  }

  // Reużyte przez js/coach.js (ekran „Trener AI") — ten sam silnik pytań,
  // co widget Smart Coach na Dashboardzie.
  ET.aiCoachIntents = INTENTS;
  ET.analyzeAiCoachIntent = analyzeIntent;
  ET.getWorkoutExerciseNames = getExerciseNames;

  ET.Dashboard = Dashboard;
  ET.OldDashboard = OldDashboard;
  // Lista widgetów Dashboardu — konfiguracja widoczności w Profil → Ustawienia
  ET.DASHBOARD_WIDGETS = [
    { id:'readiness',  label:'Gotowość do treningu',        icon:'📊' },
    { id:'todayCta',   label:'Karta dzisiejszego treningu', icon:'🚀' },
    { id:'regen',      label:'Pasek regeneracji',           icon:'🔋' },
    { id:'coreScores', label:'Wskaźniki core',              icon:'🧠' },
    { id:'smartCoach', label:'Smart Coach',                 icon:'🧠' },
    { id:'quickStart', label:'Szybki start',                icon:'⚡' },
    { id:'weekVolume', label:'Wykres objętości (7 dni)',    icon:'📈' },
    { id:'recent',     label:'Ostatnie aktywności',         icon:'🕘' },
    { id:'goals',      label:'Aktywne cele',                icon:'🎯' },
    { id:'comingSoon', label:'Wkrótce',                     icon:'🔜' },
  ];
})();
