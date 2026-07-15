(function() {
  'use strict';
  window.ET = window.ET || {};
  var _h = React.createElement;

  // ── PLANY TRENINGOWE (z Excela) ──────────────────────────────────────────
  var WORKOUT_PLANS = [
    {
      id:'pon_gora_sila', name:'Góra / Siła', icon:'💪', day:'Poniedziałek',
      color:'var(--a)', desc:'Wyciskanie 5×5 · Podciąganie · Wiosło', badge:'badge-blue',
      warmup:[
        { n:'2 min Cardio', note:'Lekki trucht lub rower' },
        { n:'Band Pull Apart', s:2, r:15, note:'Łopatki do tyłu!' },
        { n:'Rotacja gumą', s:2, r:12 },
        { n:'Scapular Push Ups', s:2, r:10 },
        // Rampa ciężaru przed 5×5 na 72,5 kg — bez tego pierwsza właściwa seria
        // to wejście z zimnego wprost w ciężar submaksymalny.
        { n:'Wyciskanie sztangi — pusty gryf', s:1, r:10, note:'Rampa do 72,5 kg — tor ruchu' },
        { n:'Wyciskanie sztangi — 40 kg', s:1, r:5 },
        { n:'Wyciskanie sztangi — 55 kg', s:1, r:3 },
        { n:'Wyciskanie sztangi — 65 kg', s:1, r:1, note:'Ostatnia rampa przed właściwym 72,5 kg' },
      ],
      exercises:[
        { name:'Wyciskanie sztangi',    plan:'5×5',   sets:5, reps:5,  weight:72.5, rir:2, tempo:'3-1-1',   rest:180, prog:'+2.5 kg/tydz' },
        { name:'Podciąganie + Maszyna', plan:'5 serii', sets:5, reps:6,  weight:0,    rir:2, tempo:'kontrola', rest:120, prog:'mniej pomocy co tydz' },
        { name:'Wyciskanie hantli skos',plan:'3×8',   sets:3, reps:8,  weight:16,   rir:2, tempo:'3-1-1',   rest:90,  prog:'+2 gdy 10/10/10' },
        { name:'Wiosło maszyna',        plan:'4×8',   sets:4, reps:8,  weight:50,   rir:2, tempo:'3-1-1',   rest:120, prog:'+2.5 kg/tydz' },
        { name:'Face pull',             plan:'3×15',  sets:3, reps:15, weight:17,   rir:2, tempo:'kontrola', rest:60,  prog:'+powt lub ciężar' },
        { name:'Biceps hantle',         plan:'3×10',  sets:3, reps:10, weight:10,   rir:2, tempo:'kontrola', rest:60,  prog:'+2 kg/tydz' },
      ],
      cooldown:[
        { n:'Rozciąganie klatki (ościeżnica)', d:'60s' },
        { n:'Rozciąganie bicepsa', d:'30s/stronę' },
        { n:'Rotacja barków', d:'10 krążeń każdy' },
        { n:'Rozciąganie karku', d:'30s/stronę' },
      ]
    },
    {
      id:'sr_dol_core', name:'Dół + Core', icon:'🦵', day:'Środa',
      color:'var(--green)', desc:'Hip Thrust · RDL · Split Squat · Plank', badge:'badge-green',
      warmup:[
        { n:'Rower', note:'2 min lekko' },
        { n:'Krążenia bioder', r:10 },
        { n:'Glute bridge', s:2, r:15 },
        { n:'Hip hinge drill', s:2, r:10 },
        { n:'Dead bug', s:2, r:10 },
        { n:'RDL lekko', s:2, r:8, note:'40×8 / 50×5' },
      ],
      exercises:[
        { name:'Hip Thrust',    plan:'4×10', sets:4, reps:10, weight:40, rir:2, tempo:'pauza',   rest:90,  prog:'+10 kg/tydz' },
        { name:'RDL',           plan:'3×8',  sets:3, reps:8,  weight:60, rir:2, tempo:'3-1-1',  rest:90,  prog:'+5 kg/tydz' },
        { name:'Split Squat',   plan:'3×8',  sets:3, reps:8,  weight:10, rir:2, tempo:'kontrola', rest:60, prog:'+2 kg/tydz' },
        { name:'Plank',         plan:'3×40s', sets:3, reps:40, weight:0, rir:2, tempo:'izometria', rest:45, prog:'+5s/tydz' },
        { name:'Dead Bug',      plan:'3×10', sets:3, reps:10, weight:0,  rir:2, tempo:'kontrola', rest:30, prog:'+powt' },
      ],
      cooldown:[
        { n:'Hip flexor stretch', d:'60s/stronę' },
        { n:'Piriformis (pozycja gołębia)', d:'60s/stronę' },
        { n:'Rozciąganie tylnej uda', d:'45s/stronę' },
        { n:'Rozciąganie łydek', d:'30s/stronę' },
      ]
    },
    {
      id:'pt_gora_hiper', name:'Góra / Hipertrofia', icon:'🏋️', day:'Piątek',
      color:'var(--purple)', desc:'Hantle · Ściąganie · Wiosło · Biceps/Triceps', badge:'badge-purple',
      warmup:[
        { n:'Cardio', note:'2 min lekki trucht' },
        { n:'Krążenia ramion', s:2, r:15 },
        { n:'Rotacja gumą', s:2, r:12 },
        { n:'Band pull apart', s:2, r:15 },
        { n:'Y-raise', s:2, r:12 },
        { n:'Lekka seria hantli', s:2, r:12, note:'Rozgrzewkowe' },
      ],
      exercises:[
        { name:'Hantle skos',       plan:'3×10', sets:3, reps:10, weight:20, rir:2, tempo:'3-1-1',  rest:75, prog:'+2 kg/tydz' },
        { name:'Ściąganie drążka',  plan:'3×10', sets:3, reps:10, weight:55, rir:2, tempo:'kontrola', rest:75, prog:'+2.5 kg' },
        { name:'Wiosło jednorącz',  plan:'3×12', sets:3, reps:12, weight:22, rir:2, tempo:'kontrola', rest:75, prog:'+2 kg' },
        { name:'Rozpiętki',         plan:'3×15', sets:3, reps:15, weight:8,  rir:2, tempo:'wolno',   rest:60, prog:'+powt' },
        { name:'Biceps',            plan:'3×12', sets:3, reps:12, weight:10, rir:2, tempo:'kontrola', rest:60, prog:'+2 kg' },
        { name:'Triceps',           plan:'3×12', sets:3, reps:12, weight:20, rir:2, tempo:'kontrola', rest:60, prog:'+2.5 kg' },
        { name:'Y-raise',           plan:'3×15', sets:3, reps:15, weight:3,  rir:2, tempo:'wolno',   rest:45, prog:'+powt' },
      ],
      cooldown:[
        { n:'Rozciąganie klatki (ościeżnica)', d:'60s' },
        { n:'Rozciąganie bicepsa', d:'30s/stronę' },
        { n:'Rozciąganie tricepsa (za głową)', d:'30s/stronę' },
        { n:'Rotacja barków', d:'10 krążeń każdy' },
      ]
    },
    {
      id:'nd_fullbody', name:'FullBody', icon:'⚡', day:'Niedziela',
      color:'var(--yellow)', desc:'Pulldown · Hip Thrust · Step-up · Barki', badge:'badge-yellow',
      warmup:[
        { n:'Cardio', note:'2 min trucht' },
        { n:'Krążenia bioder', r:10 },
        { n:'Krążenia barków', r:10 },
        { n:'Glute bridge', s:2, r:12 },
        { n:'Face pull', s:2, r:15, note:'ŁOPATKI!' },
        { n:'Lekka seria każdego ćwiczenia', note:'Rozgrzewkowe powtórzenia' },
      ],
      exercises:[
        { name:'Straight Arm Pulldown', plan:'3×12-15', sets:3, reps:12, weight:0,  rir:2, tempo:'Izolacja',  rest:60, prog:'' },
        { name:'Hip Thrust lekko',      plan:'3×12',    sets:3, reps:12, weight:0,  rir:3, tempo:'kontrola', rest:60, prog:'-' },
        { name:'Ściąganie drążka',      plan:'3×12',    sets:3, reps:12, weight:0,  rir:2, tempo:'kontrola', rest:60, prog:'po 12 +2.5 kg' },
        { name:'Step-up',               plan:'3×10',    sets:3, reps:10, weight:10, rir:2, tempo:'kontrola', rest:60, prog:'+2 kg' },
        { name:'Face Pull',             plan:'3×15',    sets:3, reps:15, weight:15, rir:2, tempo:'kontrola', rest:45, prog:'+powt' },
        { name:'Unoszenia bokiem',      plan:'3×15',    sets:3, reps:15, weight:5,  rir:2, tempo:'wolno',    rest:45, prog:'+powt' },
        { name:'Plank',                 plan:'2 serie', sets:2, reps:40, weight:0,  rir:2, tempo:'izometria', rest:30, prog:'+czas' },
      ],
      cooldown:[
        { n:'Hip flexor stretch', d:'60s/stronę' },
        { n:'Rozciąganie klatki', d:'60s' },
        { n:'Rotacja barków', d:'10 krążeń każdy' },
        { n:'Rozciąganie karku', d:'30s/stronę' },
        { n:'Rozciąganie łydek', d:'30s/stronę' },
      ]
    },
  ];

  // ── PERIODYZACJA: domyślne zakresy tygodni + deload dla wbudowanych planów ─
  var DEFAULT_RANGES = [
    { id:1, startWeek:1, endWeek:4,  mode:'progresja', deloadPct:15, volumePct:65 },
    { id:2, startWeek:5, endWeek:8,  mode:'progresja', deloadPct:15, volumePct:85 },
    { id:3, startWeek:9, endWeek:12, mode:'deload',    deloadPct:15, volumePct:50 },
  ];
  function defaultRanges() { return JSON.parse(JSON.stringify(DEFAULT_RANGES)); }
  WORKOUT_PLANS.forEach(function(p){ if (!p.ranges) p.ranges = defaultRanges(); });

  // ── Uzupełnij measurementType/isUnilateral wg bazy ćwiczeń (lub nazwy) ────
  WORKOUT_PLANS.forEach(function(p){
    p.exercises.forEach(function(e){
      var db = (ET.EXERCISES_BASIC||[]).find(function(x){ return x.name===e.name; });
      if (db) {
        e.measurementType = e.measurementType || db.measurementType;
        e.isUnilateral = e.isUnilateral != null ? e.isUnilateral : db.isUnilateral;
      } else {
        e.measurementType = e.measurementType || (/plank|deska|wall sit|izometr/i.test(e.name) ? 'seconds' : 'reps');
        e.isUnilateral = e.isUnilateral != null ? e.isUnilateral : /jednorącz|jednonóż|jednej nodze|jednej ręki|single-leg|split squat|bułgarski|step-up|pistol|unilateral|wykrok|lunge|suitcase carry|bottoms-up|koncentrowane|kickback|gripper|plate pinch/i.test(e.name);
      }
    });
  });

  // ── SKALA RIR (Reps In Reserve) ───────────────────────────────────────────
  // 0 = seria do upadku, 0.5/1/2/3 = rosnący zapas powtórzeń. Im niższy RIR, tym cięższa seria.
  var RIR_SCALE = [0, 0.5, 1, 2, 3];
  function RirPicker(props) {
    var val = props.value != null ? props.value : 2;
    return _h('div', { style:{ display:'flex', gap:3, flexWrap:'wrap' } },
      RIR_SCALE.map(function(v){
        var active = val === v;
        return _h('button', { key:v, type:'button',
          style:{ padding:'4px 6px', borderRadius:'var(--r2)', border:'1px solid '+(active?'var(--a)':'var(--b1)'), background:active?'var(--a-dim)':'var(--s3)', color:active?'var(--a-light)':'var(--t2)', fontSize:'.65rem', fontWeight:700, cursor:'pointer', minWidth:26 },
          onClick:function(){ props.onChange(v); }
        }, v);
      })
    );
  }

  // RIR na osi (suwak) — używany w trakcie aktywnego treningu
  function RirSlider(props) {
    var val = props.value != null ? props.value : 2;
    var idx = RIR_SCALE.indexOf(val);
    if (idx === -1) idx = 3;
    return _h('div', { style:{ display:'flex', alignItems:'center', gap:6, minWidth:96 } },
      _h('input', { type:'range', min:0, max:RIR_SCALE.length-1, step:1, value:idx, style:{ width:64, margin:0 },
        onChange:function(e){ props.onChange(RIR_SCALE[+e.target.value]); } }),
      _h('span', { style:{ fontSize:'.75rem', fontWeight:700, color:'var(--a-light)', minWidth:22, fontVariantNumeric:'tabular-nums' } }, RIR_SCALE[idx])
    );
  }

  // ── Budowa serii — obsługa ćwiczeń jednostronnych (L/P) ───────────────────
  function buildSetsData(sets, reps, weight, isUnilateral) {
    if (!isUnilateral) {
      return Array.from({ length:sets }, function(_,j){ return { id:j, reps:reps, weight:weight, done:false }; });
    }
    var data = [];
    for (var j=0; j<sets; j++) {
      data.push({ id:j+'-L', side:'L', reps:reps, weight:weight, done:false });
      data.push({ id:j+'-R', side:'R', reps:reps, weight:weight, done:false });
    }
    return data;
  }

  // Udostępnij plany innym modułom (np. eksport CSV/XLSX)
  ET.WORKOUT_PLANS = WORKOUT_PLANS;

  var READINESS_FIELDS = [
    { key:'willingness', label:'Chęć do treningu', opts:['😤 Bez chęci','😐 Ujdzie','💪 Pełna!'] },
    { key:'state',       label:'Samopoczucie',      opts:['😞 Słabo','😐 Normalnie','😄 Świetnie'] },
    { key:'fatigue',     label:'Zmęczenie',          opts:['😴 Bardzo zmęczony','😐 Umiarkowane','⚡ Brak zmęczenia'] },
  ];

  function calc1RM(w, r) { return (!w||!r) ? 0 : Math.round(w*(1+r/30)); }

  // ── DOBÓR ĆWICZEŃ KOREKCYJNYCH: rotacja + sprawiedliwość między dolegliwościami ──
  // Zamiast zawsze tych samych 4 pozycji: deterministyczna rotacja zależna od
  // dnia i planu (zmienia się między sesjami, ale stabilna w obrębie dnia),
  // a przy kilku dolegliwościach — po jednym reprezentancie z każdej po kolei.
  function hashSeed(str) {
    var h = 0;
    for (var i=0; i<str.length; i++) h = (h*31 + str.charCodeAt(i)) >>> 0;
    return h;
  }
  function rotatePick(arr, seed, n) {
    if (!arr.length) return [];
    var start = hashSeed(seed) % arr.length;
    var out = [];
    for (var j=0; j<Math.min(n, arr.length); j++) out.push(arr[(start+j) % arr.length]);
    return out;
  }
  // Ogólna profilaktyka postawy (używana, gdy brak zapisanych dolegliwości) —
  // szeroka pula z różnych regionów (barki/łopatki, biodro/miednica, kręgosłup, kolano)
  var GENERAL_CORRECTIVE_POOL = ['pb2','pb3','pb5','pb8','pb11','pm2','pm4','pm5','pm11','dl2','dl4','dl7','dl11','cp5','cp6','kv2','kv4','kv11'];
  function pickCorrectiveExercises(store, seedKey, count) {
    count = count || 4;
    var list = ET.EXERCISES_CORRECTIVE || [];
    var tags = store.ailments || [];
    if (!tags.length) {
      var pool = list.filter(function(e){ return GENERAL_CORRECTIVE_POOL.indexOf(e.id)!==-1; });
      return rotatePick(pool, seedKey, count);
    }
    var byTag = {};
    tags.forEach(function(t){ byTag[t] = list.filter(function(e){ return (e.condition_tags||[]).indexOf(t)!==-1; }); });
    var picks = [], round = 0, guard = 0;
    while (picks.length < count && guard < 20) {
      var addedAny = false;
      tags.forEach(function(t){
        if (picks.length >= count) return;
        var poolT = byTag[t] || [];
        if (!poolT.length) return;
        var rotated = rotatePick(poolT, seedKey+t, poolT.length);
        var candidate = rotated[round % rotated.length];
        if (candidate && picks.indexOf(candidate)===-1) { picks.push(candidate); addedAny = true; }
      });
      round++; guard++;
      if (!addedAny) break;
    }
    return picks.slice(0, count);
  }

  function fmtMs(ms) {
    var s = Math.round(ms/1000), m = Math.floor(s/60), h = Math.floor(m/60);
    return (h>0 ? h+'h ' : '') + (m%60>0||h>0 ? (m%60)+'min ' : '') + (h===0 ? (s%60)+'s' : '');
  }

  // ── STEP 1: WYBÓR TRENINGU (PICKER SHEET) ────────────────────────────────
  function WorkoutPicker(props) {
    var plans = props.plans || WORKOUT_PLANS;
    return _h(ET.Sheet, { open:true, onClose:props.onClose, title:'Wybierz trening' },
      plans.map(function(plan) {
        return _h('div', { key:plan.id,
          style:{ display:'flex', alignItems:'center', gap:14, padding:'14px 0', borderBottom:'1px solid var(--b1)', cursor:'pointer' },
          onClick:function(){ props.onSelect(plan); }
        },
          _h('div', { style:{ width:44, height:44, borderRadius:'var(--r2)', background:'var(--s3)', border:'1px solid var(--b1)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.4rem', flexShrink:0 } }, plan.icon),
          _h('div', { style:{ flex:1 } },
            _h('div', { style:{ fontWeight:700 } }, plan.name),
            _h('div', { style:{ fontSize:'.72rem', color:'var(--t2)', marginTop:3 } }, plan.day + ' · ' + plan.desc)
          ),
          _h('div', { style:{ color:'var(--t3)', fontSize:'1.2rem' } }, '›')
        );
      })
    );
  }

  // ── STEP 2: GOTOWOŚĆ ─────────────────────────────────────────────────────
  function ReadinessStep(props) {
    var rd = props.readiness, setRd = props.setReadiness;
    return _h('div', { className:'fade-in' },
      _h('div', { style:{ display:'flex', alignItems:'center', gap:10, marginBottom:20 } },
        _h('button', { className:'btn btn-ghost btn-sm btn-icon', onClick:props.onBack }, '←'),
        _h('div', null,
          _h('h1', { style:{ fontSize:'1.2rem', fontWeight:700 } }, props.plan.icon + ' ' + props.plan.name),
          _h('div', { style:{ fontSize:'.75rem', color:'var(--t3)', marginTop:2 } }, 'Krok 1 z 4 — Ocena gotowości')
        )
      ),

      _h('div', { className:'card', style:{ marginBottom:14 } },
        _h('div', { style:{ fontWeight:700, marginBottom:16, fontSize:'.88rem', color:'var(--t2)' } }, '📊 Jak się dziś czujesz?'),
        READINESS_FIELDS.map(function(f) {
          return _h('div', { key:f.key, style:{ marginBottom:16 } },
            _h('div', { style:{ fontSize:'.72rem', fontWeight:700, color:'var(--t3)', textTransform:'uppercase', letterSpacing:'.06em', marginBottom:8 } }, f.label),
            _h('div', { style:{ display:'flex', gap:6 } },
              f.opts.map(function(opt, i) {
                var active = rd[f.key] === (i+1);
                return _h('button', { key:i,
                  style:{ flex:1, padding:'10px 4px', borderRadius:'var(--r2)', border:'1px solid '+(active?'var(--a)':'var(--b1)'), background:active?'var(--a-dim)':'var(--s3)', color:active?'var(--a-light)':'var(--t2)', cursor:'pointer', fontSize:'.72rem', fontWeight:600, lineHeight:1.3, textAlign:'center', transition:'all .15s' },
                  onClick:function(){ var o={}; o[f.key]=i+1; setRd(Object.assign({},rd,o)); }
                }, opt);
              })
            )
          );
        })
      ),

      _h('button', { className:'btn btn-primary btn-lg', style:{ width:'100%' }, onClick:props.onNext }, '→ Dalej: Rozgrzewka')
    );
  }

  // ── STEP 3: ROZGRZEWKA (format jak trening) ──────────────────────────────
  function WarmupStep(props) {
    // Normalize warmup items to exercise-card format
    var warmupExs = React.useState(function() {
      return props.plan.warmup.map(function(item, i) {
        var sets = item.s || 1;
        var reps = item.r || 0;
        return {
          id: i, name: item.n, note: item.note || '',
          expanded: true,
          setsData: Array.from({ length:sets }, function(_,j){
            return { id:j, reps:reps, done:false };
          })
        };
      });
    });
    var exs = warmupExs[0]; var setExs = warmupExs[1];

    function toggleSet(exId, sId) {
      setExs(function(es){ return es.map(function(ex){
        if (ex.id!==exId) return ex;
        return Object.assign({},ex,{ setsData:ex.setsData.map(function(s){
          return s.id===sId ? Object.assign({},s,{done:!s.done}) : s;
        })});
      }); });
    }

    function addWarmupSet(exId) {
      setExs(function(es){ return es.map(function(ex){
        if (ex.id!==exId) return ex;
        var last = ex.setsData.slice(-1)[0];
        return Object.assign({},ex,{ setsData:ex.setsData.concat([{ id:Date.now(), reps:last&&last.reps||10, done:false }]) });
      }); });
    }

    function removeWarmupSet(exId, sId) {
      setExs(function(es){ return es.map(function(ex){
        if (ex.id!==exId) return ex;
        if (ex.setsData.length <= 1) return ex;
        return Object.assign({},ex,{ setsData:ex.setsData.filter(function(s){ return s.id!==sId; }) });
      }); });
    }

    var doneSets  = exs.reduce(function(t,e){ return t+e.setsData.filter(function(s){ return s.done; }).length; },0);
    var totalSets = exs.reduce(function(t,e){ return t+e.setsData.length; },0);

    return _h('div', { className:'fade-in' },
      _h('div', { style:{ display:'flex', alignItems:'center', gap:10, marginBottom:12 } },
        _h('button', { className:'btn btn-ghost btn-sm btn-icon', onClick:props.onBack }, '←'),
        _h('div', { style:{ flex:1 } },
          _h('div', { style:{ fontWeight:700, fontSize:'1rem' } }, '🔥 Rozgrzewka'),
          _h('div', { style:{ fontSize:'.75rem', color:'var(--t3)', marginTop:2 } }, 'Krok 2 z 5 — '+props.plan.name)
        ),
        _h('button', { className:'btn btn-primary btn-sm', onClick:props.onNext }, 'Start →')
      ),

      _h('div', { style:{ marginBottom:12 } },
        _h('div', { style:{ display:'flex', justifyContent:'space-between', marginBottom:4 } },
          _h('span', { style:{ fontSize:'.72rem', color:'var(--t3)' } }, 'Postęp'),
          _h('span', { style:{ fontSize:'.72rem', color:'var(--a-light)', fontWeight:700 } }, doneSets+'/'+totalSets+' serii')
        ),
        _h(ET.ProgressBar, { value:totalSets?doneSets/totalSets*100:0 })
      ),

      exs.map(function(ex) {
        return _h('div', { key:ex.id, className:'exercise-card' },
          _h('div', { className:'exercise-card-head',
            onClick:function(){ setExs(function(es){ return es.map(function(e){ return e.id===ex.id?Object.assign({},e,{expanded:!e.expanded}):e; }); }); }
          },
            _h('div', { style:{ flex:1 } },
              _h('div', { style:{ fontWeight:700, fontSize:'.9rem' } }, ex.name),
              ex.note && _h('div', { style:{ fontSize:'.72rem', color:'var(--t2)', marginTop:2 } }, ex.note)
            ),
            _h('span', { style:{ color:'var(--t3)' } }, ex.expanded?'▴':'▾')
          ),
          ex.expanded && _h('div', { style:{ padding:'0 12px 12px' } },
            _h('table', { className:'sets-table' },
              _h('thead', null, _h('tr', null, _h('th',null,'#'), _h('th',null,'Powt.'), _h('th',null,'✓'), _h('th',null,''))),
              _h('tbody', null,
                ex.setsData.map(function(s,si){
                  return _h('tr', { key:s.id, style:{ opacity:s.done?.5:1 } },
                    _h('td', { style:{ color:'var(--t3)', fontSize:'.75rem' } }, si+1),
                    _h('td', null, s.reps ? s.reps+' powt.' : 'Dowolnie'),
                    _h('td', null, _h('div', { className:'set-done-btn'+(s.done?' done':''),
                      onClick:function(){ toggleSet(ex.id,s.id); }
                    }, s.done?'✓':'○')),
                    _h('td', null, _h('button', { style:{ background:'none', border:'none', color:'var(--red)', cursor:'pointer', fontSize:'.85rem', padding:'2px 4px', lineHeight:1 }, onClick:function(){ removeWarmupSet(ex.id,s.id); } }, '✕'))
                  );
                })
              )
            ),
            _h('button', { className:'btn btn-ghost btn-sm', style:{ marginTop:6, width:'100%', borderStyle:'dashed', fontSize:'.75rem' }, onClick:function(){ addWarmupSet(ex.id); } }, '+ Seria')
          )
        );
      }),

      _h('button', { className:'btn btn-primary btn-lg', style:{ width:'100%', marginTop:10 }, onClick:props.onNext },
        doneSets===totalSets ? '→ Dalej: Trening' : '→ Pomiń resztę i zacznij trening'
      )
    );
  }

  // ── SPRAWDZENIE CELÓW PO TRENINGU ─────────────────────────────────────────
  function GoalCheckStep(props) {
    var su = ET.useStore(); var store = su.store, update = su.update;
    var assignedGoals = (store.goals||[]).filter(function(g){
      return g.progress < 100 && (g.workouts||[]).indexOf(props.plan.id) !== -1;
    });
    var pg = React.useState(function(){
      var m = {};
      assignedGoals.forEach(function(g){ m[g.id] = g.progress; });
      return m;
    });
    var progMap = pg[0]; var setProgMap = pg[1];

    function save() {
      var ids = Object.keys(progMap);
      if (ids.length > 0) {
        update(function(s){ return Object.assign({},s,{ goals:(s.goals||[]).map(function(g){
          return progMap[g.id] !== undefined ? Object.assign({},g,{progress:progMap[g.id]}) : g;
        })}); });
      }
      props.onNext();
    }

    if (assignedGoals.length === 0) {
      return _h('div', { className:'fade-in' },
        _h('div', { style:{ display:'flex', alignItems:'center', gap:10, marginBottom:20 } },
          _h('div', null,
            _h('h1', { style:{ fontSize:'1.1rem', fontWeight:700 } }, '🎯 Postęp celów'),
            _h('div', { style:{ fontSize:'.75rem', color:'var(--t3)', marginTop:2 } }, 'Krok 5 z 6')
          )
        ),
        _h(ET.Placeholder, { icon:'🎯', title:'Brak przypisanych celów', desc:'Możesz przypisać cele do treningów w zakładce Cele.' }),
        _h('button', { className:'btn btn-primary', style:{ width:'100%', marginTop:10 }, onClick:props.onNext }, '→ Dalej: Samopoczucie')
      );
    }

    return _h('div', { className:'fade-in' },
      _h('div', { style:{ display:'flex', alignItems:'center', gap:10, marginBottom:20 } },
        _h('div', null,
          _h('h1', { style:{ fontSize:'1.1rem', fontWeight:700 } }, '🎯 Postęp celów'),
          _h('div', { style:{ fontSize:'.75rem', color:'var(--t3)', marginTop:2 } }, 'Krok 5 z 6 — '+assignedGoals.length+' przypisanych celów')
        )
      ),

      _h('div', { className:'card card-accent', style:{ marginBottom:14, fontSize:'.82rem', color:'var(--t2)' } },
        '💡 Zaktualizuj postęp w celach przypisanych do tego treningu.'
      ),

      assignedGoals.map(function(g) {
        var tc = { short:'var(--green)', medium:'var(--a)', long:'var(--purple)' }[g.term]||'var(--a)';
        var val = progMap[g.id] !== undefined ? progMap[g.id] : g.progress;
        return _h('div', { key:g.id, className:'card', style:{ marginBottom:10 } },
          _h('div', { style:{ fontWeight:700, fontSize:'.9rem', marginBottom:4 } }, g.title),
          g.target && _h('div', { style:{ fontSize:'.72rem', color:'var(--t3)', marginBottom:8 } }, 'Cel: '+g.target+' '+g.unit),
          _h('div', { style:{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 } },
            _h(ET.ProgressBar, { value:val, color:tc }),
            _h('div', { style:{ fontSize:'1.1rem', fontWeight:700, color:tc, marginLeft:12, flexShrink:0 } }, val+'%')
          ),
          _h('div', { className:'slider-wrap' },
            _h('input', { type:'range', min:0, max:100, value:val,
              onChange:function(e){ setProgMap(function(m){ var o={}; o[g.id]=+e.target.value; return Object.assign({},m,o); }); }
            })
          )
        );
      }),

      _h('button', { className:'btn btn-primary btn-lg', style:{ width:'100%', marginTop:6 }, onClick:save }, '→ Dalej: Samopoczucie po treningu')
    );
  }

  // ── KROK SAMOPOCZUCIA ────────────────────────────────────────────────────
  function WellbeingStep(props) {
    var su = ET.useStore(); var update = su.update;
    var wv = React.useState(Object.assign({}, ET.WellbeingDefaults));
    var wbValues = wv[0]; var setWbValues = wv[1];
    function upWb(k,v){ setWbValues(function(p){ var o={}; o[k]=v; return Object.assign({},p,o); }); }

    function save() {
      ET.saveWellbeingEntry(update, wbValues, props.tag || '');
      props.onNext(wbValues);
    }

    return _h('div', { className:'fade-in' },
      _h('div', { style:{ display:'flex', alignItems:'center', gap:10, marginBottom:16 } },
        props.onBack && _h('button', { className:'btn btn-ghost btn-sm btn-icon', onClick:props.onBack }, '←'),
        _h('div', null,
          _h('div', { style:{ fontSize:'.72rem', color:'var(--t3)', fontWeight:700, textTransform:'uppercase', letterSpacing:'.06em' } }, props.stepLabel || ''),
          _h('h1', { style:{ fontSize:'1.1rem', fontWeight:700, marginTop:2 } }, props.title || 'Samopoczucie')
        )
      ),
      _h(ET.WellbeingForm, {
        values: wbValues,
        onChange: upWb,
        label: '',
        saveLabel: props.saveLabel || 'Dalej →',
        onSave: save,
        onSkip: props.onSkip ? function(){ props.onSkip(); } : null
      })
    );
  }

  // ── WYBÓR ĆWICZENIA Z BAZY (arkusz z szukajką i filtrem grup mięśni) ──────
  function ExercisePickerSheet(props) {
    var qs = React.useState(''); var q = qs[0], setQ = qs[1];
    var ts = React.useState(''); var tag = ts[0], setTag = ts[1];
    var list = (ET.EXERCISES_BASIC||[]).filter(function(e){
      if (tag && (e.tags||[])[0]!==tag) return false;
      if (q && e.name.toLowerCase().indexOf(q.toLowerCase())===-1) return false;
      return true;
    });
    return _h(ET.Sheet, { open:props.open, onClose:props.onClose, title:props.title||'Wybierz ćwiczenie' },
      _h('input', { type:'text', placeholder:'Szukaj ćwiczenia...', value:q, style:{ width:'100%', marginBottom:8 }, onChange:function(e){ setQ(e.target.value); } }),
      _h('div', { style:{ display:'flex', gap:4, flexWrap:'wrap', marginBottom:10 } },
        _h('button', { className:'chip', style:{ cursor:'pointer', border:'1px solid '+(tag===''?'var(--a)':'var(--b1)'), color:tag===''?'var(--a-light)':'var(--t2)' }, onClick:function(){ setTag(''); } }, 'Wszystkie'),
        ET.MUSCLE_GROUPS.map(function(g){
          var act = tag===g.tag;
          return _h('button', { key:g.tag, className:'chip', style:{ cursor:'pointer', border:'1px solid '+(act?'var(--a)':'var(--b1)'), color:act?'var(--a-light)':'var(--t2)' }, onClick:function(){ setTag(act?'':g.tag); } }, g.icon+' '+g.label);
        })
      ),
      list.slice(0,60).map(function(e){
        return _h('div', { key:e.id, style:{ display:'flex', alignItems:'center', gap:8, padding:'9px 0', borderBottom:'1px solid var(--b1)', cursor:'pointer' }, onClick:function(){ props.onPick(e); } },
          _h('div', { style:{ flex:1 } },
            _h('div', { style:{ fontWeight:600, fontSize:'.82rem' } }, e.name),
            _h('div', { style:{ fontSize:'.62rem', color:'var(--t3)', marginTop:2 } },
              (e.equipment||'') + (e.isUnilateral?' · L/P':'') + (e.measurementType==='seconds'?' · na czas':''))
          ),
          _h('span', { style:{ color:'var(--t3)' } }, '›')
        );
      }),
      list.length===0 && _h('div', { style:{ textAlign:'center', color:'var(--t3)', padding:'20px 0', fontSize:'.8rem' } }, 'Brak wyników')
    );
  }

  // ── STEP 4: TRENING WŁAŚCIWY ─────────────────────────────────────────────
  function StrengthSession(props) {
    var su = ET.useStore(); var store = su.store, update = su.update;
    var toast = ET.useToast();
    var plan = props.plan;

    var t0 = React.useRef(Date.now());
    var el = React.useState(0); var elapsed = el[0], setElapsed = el[1];
    var rl = React.useState(0); var restLeft = rl[0], setRestLeft = rl[1];
    var sa = React.useState(false); var showAdd = sa[0], setShowAdd = sa[1];
    var tr = React.useState(0); var totalRestMs = tr[0], setTotalRestMs = tr[1];
    var restStartRef = React.useRef(null);
    // Koniec przerwy jako timestamp (zegar ścienny) — timery JS są zamrażane
    // przy zablokowanym telefonie, więc odliczanie MUSI liczyć się z Date.now().
    var restEndRef = React.useRef(null);

    var ne = React.useState({ name:'', sets:3, reps:10, weight:0, tempo:'2-1-1', rpe:7, rir:3, rest:90, measurementType:'reps', isUnilateral:false });
    var newEx = ne[0], setNewEx = ne[1];

    var tm = React.useState({}); var timers = tm[0], setTimers = tm[1]; // { 'exId-setId': startTs }
    var sw = React.useState(null); var swapFor = sw[0], setSwapFor = sw[1]; // exId do zamiany
    var pk = React.useState(false); var showPick = pk[0], setShowPick = pk[1]; // dodawanie z bazy

    // Cel meta-planu zawierającego tę jednostkę → auto-parametry przy zamianie/dodaniu
    var metaOfPlan = findMetaForUnit(store, plan.id);
    var planGoal = metaOfPlan && metaOfPlan.goal || null;

    // Periodyzacja: bieżący tydzień → aktywny blok (progresja/deload) z edytora planu.
    // Deload obniża ciężar o deloadPct i podnosi docelowy RIR o 2; volumePct skaluje serie.
    var periodInfo = (function(){
      // Periodyzacja ustawiana per SEGMENT w widoku planu — jednostka dziedziczy
      // zakresy swojego segmentu (fallback: starsze ustawienie planu, potem jednostki).
      var ranges = [];
      if (metaOfPlan) {
        var segs = (metaOfPlan.segments && metaOfPlan.segments.length) ? metaOfPlan.segments : [];
        var unit = (metaOfPlan.units||[]).find(function(u){ return u.id===plan.id; });
        var segId = (unit && unit.segmentId) || (segs[0] && segs[0].id);
        var seg = segs.find(function(x){ return x.id===segId; });
        if (seg && seg.ranges && seg.ranges.length) ranges = seg.ranges;
        else if (metaOfPlan.ranges && metaOfPlan.ranges.length) ranges = metaOfPlan.ranges;
      }
      if (!ranges.length && plan.ranges && plan.ranges.length) ranges = plan.ranges;
      if (!ranges.length || ranges[0].startWeek == null) return null;
      var wi = metaOfPlan ? planWeekInfo(store, metaOfPlan.units) : null;
      var week = wi ? wi.currentWeek : 1;
      // Znalezienie bloku i logika przeliczeń — w core (ETCore.findPeriodBlock/applyPeriodization)
      var rg = window.ETCore && ETCore.findPeriodBlock ? ETCore.findPeriodBlock(ranges, week)
        : (ranges.find(function(r){ return week>=r.startWeek && week<=r.endWeek; }) || ranges[ranges.length-1]);
      var volPct = rg.volumePct != null ? rg.volumePct : 100;
      var isDeload = rg.mode === 'deload';
      if (volPct === 100 && !isDeload) return { week:week, range:rg, neutral:true };
      return { week:week, range:rg, volPct:volPct, isDeload:isDeload, deloadPct:rg.deloadPct||15 };
    })();
    function applyPeriodization(sets, weight, rir) {
      if (!periodInfo || periodInfo.neutral) return { sets:sets, weight:weight, rir:rir };
      if (window.ETCore && ETCore.applyPeriodization) {
        var r = ETCore.applyPeriodization({ sets:sets, weight:weight, rir:rir }, periodInfo.range);
        return { sets:r.sets, weight:r.weight, rir:r.rir };
      }
      var s = Math.max(1, Math.round(sets * periodInfo.volPct / 100));
      var w = weight, rr = rir;
      if (periodInfo.isDeload) {
        w = Math.round(weight * (1 - periodInfo.deloadPct/100) * 2) / 2;
        rr = Math.min(3, (rir != null ? rir : 2) + 2);
      }
      return { sets:s, weight:w, rir:rr };
    }

    // Ciężary z historii: najwyższy ciężar WPISANY przez użytkownika (zaliczone serie)
    // dla ćwiczenia w ostatnich 12 tygodniach oraz z ostatniego treningu z tym ćwiczeniem.
    function bestRecentWeight(name) {
      var cutoff = Date.now() - 84*86400000;
      var best = 0;
      (store.workouts||[]).forEach(function(w){
        if (!w.date || new Date(w.date).getTime() < cutoff) return;
        (w.exercises||[]).forEach(function(e){
          if (e.name !== name) return;
          (e.setsData||[]).forEach(function(sd){
            if (sd.done && +sd.weight > 0) best = Math.max(best, +sd.weight);
          });
        });
      });
      return best;
    }
    function lastWeightFor(name) {
      for (var i=0; i<(store.workouts||[]).length; i++) {
        var e = ((store.workouts[i].exercises)||[]).find(function(x){ return x.name===name; });
        if (e) {
          var done = (e.setsData||[]).filter(function(sd){ return sd.done && +sd.weight > 0; });
          return done.length ? Math.max.apply(null, done.map(function(sd){ return +sd.weight; })) : null;
        }
      }
      return null;
    }

    var es = React.useState(function() {
      var overrides = (store.planSuggestions||{})[plan.id]||{};
      return plan.exercises.map(function(e, i) {
        var ov = overrides[e.name]||{};
        var sets  = ov.sets   || e.sets;
        var reps  = ov.reps   || e.reps;
        var weight= ov.weight != null ? ov.weight : (e.weight||0);
        var rir   = ov.rir != null ? ov.rir : e.rir;
        // Jeśli ostatni trening nie osiągnął domyślnego ciężaru z planu,
        // podstaw najwyższy ciężar użytkownika z ostatnich 12 tygodni.
        if (ov.weight == null && weight > 0) {
          var lastKg = lastWeightFor(e.name);
          var bestKg = bestRecentWeight(e.name);
          // Decyzja "jaki ciężar podstawić" — w core (ETCore.pickSuggestedWeight)
          weight = window.ETCore && ETCore.pickSuggestedWeight
            ? ETCore.pickSuggestedWeight(weight, lastKg, bestKg)
            : (lastKg != null && lastKg < weight && bestKg > 0 ? bestKg : weight);
        }
        // Blok periodyzacji (deload/objętość) przeliczany przy starcie treningu
        var pz = applyPeriodization(sets, weight, rir);
        sets = pz.sets; weight = pz.weight; rir = pz.rir;
        var measurementType = e.measurementType || 'reps';
        var isUnilateral = !!e.isUnilateral;
        return Object.assign({}, e, { id:i+1, expanded:true, sets:sets, reps:reps, weight:weight, rir:rir,
          measurementType:measurementType, isUnilateral:isUnilateral,
          setsData:buildSetsData(sets, reps, weight, isUnilateral)
        });
      });
    });
    var exs = es[0], setExs = es[1];

    // Elapsed timer
    React.useEffect(function() {
      var t = setInterval(function(){ setElapsed(Date.now()-t0.current); }, 1000);
      return function(){ clearInterval(t); };
    }, []);

    // Live Activity (iOS): ekran blokady + Dynamic Island
    React.useEffect(function() {
      if (!ET.LiveActivity) return;
      var first = plan.exercises && plan.exercises[0];
      ET.LiveActivity.start(
        { workoutType:'strength', planName:plan.name },
        { startedAt:t0.current, exerciseName:first&&first.name, setNumber:1,
          setTotal:first&&first.sets, weightKg:first&&first.weight||undefined,
          plannedReps:first&&first.reps,
          nextExercise:plan.exercises&&plan.exercises[1]&&plan.exercises[1].name }
      );
      return function(){ ET.LiveActivity.end(); };
    }, []);

    // Stan Live Activity po zaliczeniu serii w danym ćwiczeniu
    function laState(esArr, exId, restSec) {
      var idx = esArr.findIndex(function(e){ return e.id===exId; });
      if (idx === -1) return null;
      var ex = esArr[idx];
      var done = ex.setsData.filter(function(s){ return s.done; }).length;
      var nextEx = null;
      // następne ćwiczenie = pierwsze (od bieżącego) z niedokończonymi seriami
      for (var i=idx+1; i<esArr.length; i++) {
        if (esArr[i].setsData.some(function(s){ return !s.done; })) { nextEx = esArr[i].name; break; }
      }
      var curSet = ex.setsData[Math.min(done, ex.setsData.length-1)];
      // Postęp CAŁEGO treningu — pasek serii na ekranie blokady
      var allDone = 0, allTotal = 0;
      esArr.forEach(function(e){
        allTotal += e.setsData.length;
        allDone += e.setsData.filter(function(s){ return s.done; }).length;
      });
      return {
        startedAt: t0.current,
        exerciseName: ex.name,
        setNumber: Math.min(done+1, ex.setsData.length),
        setTotal: ex.setsData.length,
        weightKg: curSet && curSet.weight || undefined,
        plannedReps: curSet && curSet.reps || undefined,
        nextExercise: nextEx || undefined,
        doneSets: allDone,
        totalSets: allTotal,
        restEndsAt: restSec ? (Date.now() + restSec*1000) : undefined
      };
    }

    // Rest countdown — liczony z Date.now(), odporny na blokadę ekranu:
    // po odblokowaniu następny tick przeskakuje do właściwej wartości.
    function syncRest() {
      if (!restEndRef.current) return;
      var msLeft = restEndRef.current - Date.now();
      var newR = Math.max(0, Math.ceil(msLeft / 1000));
      if (newR === 0 && restStartRef.current) {
        // Doliczamy DOKŁADNIE zaplanowaną przerwę (nie czas do odblokowania) —
        // czas po końcu przerwy przy zablokowanym telefonie to już praca/oczekiwanie.
        var planned = restEndRef.current - restStartRef.current;
        setTotalRestMs(function(prev){ return prev + planned; });
        restStartRef.current = null;
        restEndRef.current = null;
      }
      setRestLeft(newR);
    }
    React.useEffect(function() {
      if (!restLeft) return;
      var t = setInterval(syncRest, 500);
      return function(){ clearInterval(t); };
    }, [restLeft > 0]);
    // Natychmiastowa resynchronizacja liczników po powrocie z tła/odblokowaniu
    React.useEffect(function() {
      function onVisible() {
        if (document.visibilityState === 'visible') {
          setElapsed(Date.now() - t0.current);
          syncRest();
        }
      }
      document.addEventListener('visibilitychange', onVisible);
      return function(){ document.removeEventListener('visibilitychange', onVisible); };
    }, []);

    function upSet(exId, sId, field, val) {
      setExs(function(es) {
        return es.map(function(ex) {
          if (ex.id!==exId) return ex;
          return Object.assign({}, ex, { setsData:ex.setsData.map(function(s) {
            if (s.id!==sId) return s;
            var v = field==='done' ? val : (parseFloat(val)||0);
            var o={}; o[field]=v; return Object.assign({},s,o);
          })});
        });
      });
    }

    function doneSet(exId, sId, rest) {
      // Jednorącz: przerwa 60-90 s przy pracy na jedną kończynę — obciążenie
      // obu stron sumuje się sekwencyjnie, więc przerwa dłuższa niż bilateralnie.
      var exU = exs.find(function(e){ return e.id===exId; });
      var sU = exU && exU.setsData.find(function(x){ return x.id===sId; });
      var uni = !!(exU && exU.isUnilateral);
      if (uni) rest = Math.max(60, Math.min(90, rest || 75));
      if (restStartRef.current) {
        setTotalRestMs(function(p){ return p + (Date.now() - restStartRef.current); });
      }
      restStartRef.current = Date.now();
      restEndRef.current = Date.now() + rest * 1000;
      upSet(exId, sId, 'done', true);
      setRestLeft(rest);
      toast(uni && sU && sU.side ? 'Strona '+(sU.side==='L'?'L':'P')+' ✓ — przerwa '+rest+'s ⏳' : 'Seria zaliczona! Przerwa '+rest+'s ⏳', 'success');
      if (ET.LiveActivity) {
        // setExs jeszcze nie zaaplikowane — policz stan na kopii z oznaczoną serią
        var esNow = exs.map(function(e){
          if (e.id!==exId) return e;
          return Object.assign({}, e, { setsData:e.setsData.map(function(s){
            return s.id===sId ? Object.assign({},s,{done:true}) : s; }) });
        });
        var st = laState(esNow, exId, rest);
        if (st) ET.LiveActivity.update(st);
      }
    }

    function cancelSet(exId, sId) {
      upSet(exId, sId, 'done', false);
      // Przerwa startowała z zaliczenia tej serii — anuluj też odliczanie
      if (restEndRef.current) skipRest();
      toast('Seria anulowana', 'default');
    }

    function toggleSet(exId, sId, rest) {
      var ex = exs.find(function(e){ return e.id===exId; });
      var s = ex && ex.setsData.find(function(x){ return x.id===sId; });
      if (!s) return;
      if (s.done) cancelSet(exId, sId); else doneSet(exId, sId, rest);
    }

    function toggleTimer(exId, sId) {
      var key = exId+'-'+sId;
      setTimers(function(t) {
        if (t[key]) {
          var elapsedSec = Math.max(1, Math.round((Date.now()-t[key])/1000));
          upSet(exId, sId, 'reps', elapsedSec);
          var n = Object.assign({}, t); delete n[key]; return n;
        }
        var n2 = Object.assign({}, t); n2[key] = Date.now(); return n2;
      });
    }

    function skipRest() {
      if (restStartRef.current) {
        setTotalRestMs(function(p){ return p + (Date.now() - restStartRef.current); });
        restStartRef.current = null;
      }
      restEndRef.current = null;
      setRestLeft(0);
      // Zgaś timer przerwy na ekranie blokady (restEndsAt=undefined go ukrywa)
      if (ET.LiveActivity) ET.LiveActivity.update({ startedAt:t0.current });
    }

    function removeEx(exId) { setExs(function(es){ return es.filter(function(e){ return e.id!==exId; }); }); }

    function addSeries(exId) {
      setExs(function(es){ return es.map(function(e){
        if (e.id!==exId) return e;
        var last = e.setsData.slice(-1)[0];
        var reps = last&&last.reps||10, weight = last&&last.weight||0;
        if (e.isUnilateral) {
          var idBase = Date.now();
          return Object.assign({}, e, { setsData:e.setsData.concat([
            { id:idBase+'-L', side:'L', reps:reps, weight:weight, done:false },
            { id:idBase+'-R', side:'R', reps:reps, weight:weight, done:false }
          ]) });
        }
        return Object.assign({}, e, { setsData:e.setsData.concat([{ id:Date.now(), reps:reps, weight:weight, done:false }]) });
      }); });
    }

    function removeSet(exId, sId) {
      setExs(function(es){ return es.map(function(e){
        if (e.id!==exId) return e;
        if (e.setsData.length <= 1) return e;
        return Object.assign({}, e, { setsData:e.setsData.filter(function(s){ return s.id!==sId; }) });
      }); });
    }

    function addEx() {
      if (!newEx.name) { toast('Podaj nazwę ćwiczenia', 'error'); return; }
      setExs(function(es){
        return es.concat([Object.assign({}, newEx, { id:Date.now(), expanded:true,
          setsData:buildSetsData(newEx.sets, newEx.reps, newEx.weight, newEx.isUnilateral)
        })]);
      });
      setShowAdd(false);
      setNewEx({ name:'', sets:3, reps:10, weight:0, tempo:'2-1-1', rpe:7, rir:3, rest:90, measurementType:'reps', isUnilateral:false });
    }

    // Nowe parametry wg celu planu (masa/redukcja/rekompozycja/siła/wytrzymałość)
    function applyGoalParams(base, dbEx) {
      var u = Object.assign({}, base, {
        name: dbEx.name,
        measurementType: dbEx.measurementType || 'reps',
        isUnilateral: !!dbEx.isUnilateral,
      });
      var pr = metaGoalPrescription(planGoal, 'intermediate');
      if (pr) {
        u.sets = pr.sets; u.reps = pr.reps; u.rir = pr.rir; u.rest = pr.rest; u.tempo = pr.tempo;
        u.plan = pr.sets + '×' + pr.reps;
        try {
          var orm = window.etcore && ETCore.latestOrm ? ETCore.latestOrm(window.etcore, dbEx.name) : null;
          if (orm && orm.orm1rm && ETCore.suggestLoad) {
            var kg = ETCore.suggestLoad(orm.orm1rm, pr.reps, u.rir);
            if (kg) u.weight = kg;
          }
        } catch(e) {}
      }
      return u;
    }

    function swapExercise(exId, dbEx) {
      setExs(function(es){
        var out = [];
        es.forEach(function(e){
          if (e.id!==exId) { out.push(e); return; }
          var doneSets = e.setsData.filter(function(s){ return s.done; });
          var nu = applyGoalParams(e, dbEx);
          nu.id = Date.now(); nu.expanded = true;
          nu.setsData = buildSetsData(nu.sets||3, nu.reps||10, nu.weight||0, nu.isUnilateral);
          // Wykonane serie zostają pod starą nazwą — objętość i historia bez zmian
          if (doneSets.length) out.push(Object.assign({}, e, { setsData:doneSets, expanded:false, swappedTo:dbEx.name }));
          out.push(nu);
        });
        return out;
      });
      setSwapFor(null);
      toast('Zamieniono na: '+dbEx.name+(planGoal?' · parametry wg celu planu':''), 'success');
    }

    function addFromDb(dbEx) {
      var nu = applyGoalParams({ sets:3, reps:10, weight:0, rir:2, tempo:'kontrola', rest:90, prog:'' }, dbEx);
      nu.id = Date.now(); nu.expanded = true;
      nu.setsData = buildSetsData(nu.sets||3, nu.reps||10, nu.weight||0, nu.isUnilateral);
      setExs(function(es){ return es.concat([nu]); });
      setShowPick(false);
      toast('Dodano: '+dbEx.name+(planGoal?' · parametry wg celu planu':''), 'success');
    }

    function finish() {
      var vol=0, totalReps=0;
      var exData = exs.map(function(ex) {
        var done = ex.setsData.filter(function(s){ return s.done; });
        done.forEach(function(s){ vol+=(s.weight||0)*(s.reps||0); totalReps+=(s.reps||0); });
        var best = done.reduce(function(b,s){ return calc1RM(s.weight,s.reps)>calc1RM(b&&b.weight,b&&b.reps)?s:b; }, null);
        return Object.assign({}, ex, { e1rm:best?calc1RM(best.weight,best.reps):0 });
      });
      var prs = [];
      exData.forEach(function(ex) {
        var prevBest = (store.workouts||[]).reduce(function(best,w){
          return Math.max(best, (w.exercises||[]).filter(function(e){ return e.name===ex.name; }).reduce(function(b,e){ return Math.max(b,e.e1rm||0); },0));
        }, 0);
        if (ex.e1rm > prevBest && ex.e1rm > 0) prs.push({ name:ex.name, e1rm:ex.e1rm });
      });
      // Flush aktywnej przerwy (jeśli użytkownik kończy podczas odliczania)
      var activeRestMs = restStartRef.current ? (Date.now() - restStartRef.current) : 0;
      var finalRestMs = totalRestMs + activeRestMs;
      var totalMs = Date.now() - t0.current;
      // workMs nie może być ujemne (np. gdy serie były bardzo szybkie)
      var safeRestMs = Math.min(finalRestMs, totalMs);
      var session = { id:Date.now(), name:plan.name, planId:plan.id, date:ET.dstr(), duration:totalMs, restMs:safeRestMs, workMs:Math.max(0, totalMs-safeRestMs), exercises:exData, volume:vol, totalReps:totalReps, prs:prs, readiness:props.readiness };
      update(function(s){
        var n = Object.assign({},s,{ workouts:[session].concat(s.workouts) });
        return ET.syncGoals ? ET.syncGoals(n, 'workout', session) : n;
      });
      // Core (Faza 1): zdarzenie → Workout Engine liczy objętość per mięsień
      if (window.etcore) { try { window.etcore.bus.publish('WorkoutFinished', session, 'user'); } catch(e) { console.error('[core] publish:', e); } }
      if (ET.LiveActivity) ET.LiveActivity.end();
      props.onFinish({ session:session, prs:prs });
    }

    var doneSets = exs.reduce(function(t,e){ return t+e.setsData.filter(function(s){ return s.done; }).length; },0);
    var totalSets = exs.reduce(function(t,e){ return t+e.setsData.length; },0);
    var elH=Math.floor(elapsed/3600000), elM=Math.floor(elapsed/60000)%60, elS=Math.floor(elapsed/1000)%60;
    var elStr=(elH>0?elH+':':'')+String(elM).padStart(2,'0')+':'+String(elS).padStart(2,'0');

    return _h('div', { className:'fade-in' },
      _h('div', { style:{ display:'flex', alignItems:'center', gap:10, marginBottom:12, flexWrap:'wrap' } },
        _h('button', { className:'btn btn-ghost btn-sm btn-icon', onClick:props.onBack }, '←'),
        _h('div', { style:{ flex:1 } },
          _h('div', { style:{ fontWeight:700, fontSize:'1rem' } }, plan.icon + ' ' + plan.name),
          _h('div', { style:{ fontSize:'.7rem', color:'var(--t3)' } }, 'Krok 3 z 4 — Trening właściwy')
        ),
        _h('div', { style:{ background:'var(--s3)', borderRadius:'var(--r2)', padding:'6px 12px', fontSize:'.88rem', fontWeight:700, color:'var(--a-light)', fontVariantNumeric:'tabular-nums' } }, '⏱ '+elStr),
        _h('button', { className:'btn btn-primary btn-sm', onClick:finish }, 'Zakończ →')
      ),

      _h('div', { style:{ marginBottom:12 } },
        _h('div', { style:{ display:'flex', justifyContent:'space-between', marginBottom:4 } },
          _h('span', { style:{ fontSize:'.72rem', color:'var(--t3)' } }, 'Postęp'),
          _h('span', { style:{ fontSize:'.72rem', color:'var(--a-light)', fontWeight:700 } }, doneSets+'/'+totalSets+' serii')
        ),
        _h(ET.ProgressBar, { value:totalSets?doneSets/totalSets*100:0 })
      ),

      // Aktywny blok periodyzacji — informacja co zostało przeliczone
      periodInfo && !periodInfo.neutral && _h('div', { style:{ background:periodInfo.isDeload?'rgba(168,85,247,.1)':'var(--s3)', border:'1px solid '+(periodInfo.isDeload?'var(--purple)':'var(--b1)'), borderRadius:'var(--r2)', padding:'8px 12px', marginBottom:12, fontSize:'.72rem', color:periodInfo.isDeload?'var(--purple)':'var(--t2)', fontWeight:600 } },
        '📅 Tydzień '+periodInfo.week+' · '+(periodInfo.isDeload
          ? 'DELOAD: ciężar −'+periodInfo.deloadPct+'%, RIR +2, objętość '+periodInfo.volPct+'%'
          : 'Blok progresji: objętość '+periodInfo.volPct+'% serii')),

      restLeft>0 && _h('div', { style:{ background:'var(--yellow-d)', border:'1px solid var(--yellow)', borderRadius:'var(--r2)', padding:'10px 14px', marginBottom:12, display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:8 } },
        _h('div', null,
          _h('div', { style:{ fontSize:'.7rem', color:'var(--yellow)', fontWeight:700 } }, '⏳ Przerwa'),
          _h('div', { style:{ fontSize:'1.8rem', fontWeight:700, color:'var(--yellow)', fontVariantNumeric:'tabular-nums' } }, restLeft+'s')
        ),
        _h('div', { style:{ display:'flex', gap:5, flexWrap:'wrap' } },
          [30,60,90,120,180].map(function(s){ return _h('button', { key:s, className:'btn btn-sm btn-ghost', onClick:function(){ setRestLeft(s); } }, s+'s'); }),
          _h('button', { className:'btn btn-sm btn-ghost', style:{ color:'var(--red)' }, onClick:skipRest }, '✕')
        )
      ),

      exs.map(function(ex) {
        return _h('div', { key:ex.id, className:'exercise-card' },
          _h('div', { className:'exercise-card-head', onClick:function(){ setExs(function(es){ return es.map(function(e){ return e.id===ex.id?Object.assign({},e,{expanded:!e.expanded}):e; }); }); } },
            _h('div', { style:{ flex:1 } },
              _h('div', { style:{ fontWeight:700, fontSize:'.9rem' } }, ex.name),
              _h('div', { style:{ display:'flex', gap:4, marginTop:3, flexWrap:'wrap' } },
                _h('span', { className:'chip', style:{ fontSize:'.6rem' } }, ex.plan),
                ex.tempo && ex.tempo !== '0' && _h('span', { className:'chip', style:{ fontSize:'.6rem' } }, 'Tempo '+ex.tempo),
                ex.rir != null && _h('span', { className:'chip', style:{ fontSize:'.6rem' } }, 'RIR '+ex.rir),
                _h('span', { className:'chip', style:{ fontSize:'.6rem', color:'var(--a-light)' } }, '1RM ~'+calc1RM(ex.setsData[0]&&ex.setsData[0].weight,ex.setsData[0]&&ex.setsData[0].reps)+' kg')
              )
            ),
            _h('div', { style:{ display:'flex', gap:6, alignItems:'center', flexShrink:0 } },
              _h('span', { style:{ fontSize:'.65rem', color:'var(--t3)' } }, ex.prog),
              _h('button', { className:'btn btn-ghost btn-sm btn-icon', title:'Zamień ćwiczenie na inne', onClick:function(e){ e.stopPropagation(); setSwapFor(ex.id); } }, '🔄'),
              _h('button', { className:'btn btn-ghost btn-sm btn-icon', style:{ color:'var(--red)' }, onClick:function(e){ e.stopPropagation(); removeEx(ex.id); } }, '✕'),
              _h('span', { style:{ color:'var(--t3)' } }, ex.expanded?'▴':'▾')
            )
          ),
          ex.expanded && _h('div', { style:{ padding:'0 12px 12px' } },
            _h('table', { className:'sets-table' },
              _h('thead', null, _h('tr', null,
                _h('th',null,'#'),
                ex.isUnilateral && _h('th',null,'Str.'),
                _h('th',null, ex.measurementType==='seconds' ? 'Czas' : 'Powt.'),
                _h('th',null,'kg'), _h('th',{ title:'Reps In Reserve — zapas powtórzeń w serii' },'RIR'), _h('th',null,'1RM'), _h('th',null,'✓'), _h('th',null,'')
              )),
              _h('tbody', null,
                ex.setsData.map(function(s, si) {
                  var timerKey = ex.id+'-'+s.id;
                  var isRunning = !!timers[timerKey];
                  var liveSec = isRunning ? Math.max(0, Math.round((Date.now()-timers[timerKey])/1000)) : 0;
                  return _h('tr', { key:s.id, style:{ opacity:s.done?.5:1, transition:'opacity .2s' } },
                    _h('td', { style:{ color:'var(--t3)', fontSize:'.75rem' } }, si+1),
                    ex.isUnilateral && _h('td', null, _h('span', { className:'chip', style:{ fontSize:'.6rem', color:s.side==='L'?'var(--a-light)':'var(--purple)' } }, s.side==='L'?'L':'P')),
                    ex.measurementType==='seconds'
                      ? _h('td', null, _h('button', {
                          style:{ padding:'6px 8px', borderRadius:'var(--r2)', border:'1px solid '+(isRunning?'var(--yellow)':'var(--b1)'), background:isRunning?'var(--yellow-d)':'var(--s3)', color:isRunning?'var(--yellow)':'var(--t1)', fontSize:'.72rem', fontWeight:700, cursor:'pointer', minWidth:56 },
                          onClick:function(){ toggleTimer(ex.id, s.id); }
                        }, isRunning ? ('⏱ '+liveSec+'s') : (s.reps ? s.reps+'s' : '▶ Start')))
                      : _h('td', null, _h('input', { type:'number', value:s.reps, min:1, onChange:function(e){ upSet(ex.id,s.id,'reps',e.target.value); } })),
                    _h('td', null, _h('input', { type:'number', value:s.weight, min:0, step:2.5, onChange:function(e){ upSet(ex.id,s.id,'weight',e.target.value); } })),
                    _h('td', null, _h(RirSlider, { value:s.rpe!=null?s.rpe:2, onChange:function(v){ upSet(ex.id,s.id,'rpe',v); } })),
                    _h('td', { style:{ color:'var(--a-light)', fontWeight:600 } }, calc1RM(s.weight,s.reps)||'—'),
                    _h('td', null, _h('div', { className:'set-done-btn'+(s.done?' done':''), title:s.done?'Anuluj serię':'Zalicz serię', onClick:function(){ toggleSet(ex.id,s.id,ex.rest); } }, s.done?'✓':'○')),
                    _h('td', null, _h('button', { style:{ background:'none', border:'none', color:'var(--red)', cursor:'pointer', fontSize:'.85rem', padding:'2px 4px', lineHeight:1 }, onClick:function(){ removeSet(ex.id,s.id); } }, '✕'))
                  );
                })
              )
            ),
            _h('button', { className:'btn btn-ghost btn-sm', style:{ marginTop:8, width:'100%', borderStyle:'dashed' }, onClick:function(){ addSeries(ex.id); } }, '+ Seria')
          )
        );
      }),

      _h('div', { style:{ display:'flex', gap:8, marginTop:10 } },
        _h('button', { className:'btn btn-secondary', style:{ flex:1, borderStyle:'dashed' }, onClick:function(){ setShowPick(true); } }, '📚 + Z bazy ćwiczeń'),
        _h('button', { className:'btn btn-secondary', style:{ flex:1, borderStyle:'dashed' }, onClick:function(){ setShowAdd(true); } }, '✏️ + Własne')
      ),

      _h(ExercisePickerSheet, { open:swapFor!=null, title:'🔄 Zamień ćwiczenie', onClose:function(){ setSwapFor(null); }, onPick:function(dbEx){ swapExercise(swapFor, dbEx); } }),
      _h(ExercisePickerSheet, { open:showPick, title:'📚 Dodaj z bazy', onClose:function(){ setShowPick(false); }, onPick:addFromDb }),

      _h(ET.Sheet, { open:showAdd, onClose:function(){ setShowAdd(false); }, title:'Nowe ćwiczenie' },
        _h('div', { className:'field' }, _h('label', null, 'Nazwa *'), _h('input', { type:'text', placeholder:'np. Overhead Press', value:newEx.name, onChange:function(e){ setNewEx(Object.assign({},newEx,{name:e.target.value})); } })),
        _h('div', { className:'grid-3' },
          _h('div', { className:'field' }, _h('label', null, 'Serie'), _h('input', { type:'number', min:1, value:newEx.sets, onChange:function(e){ setNewEx(Object.assign({},newEx,{sets:+e.target.value})); } })),
          _h('div', { className:'field' }, _h('label', null, newEx.measurementType==='seconds'?'Sekundy':'Powt.'), _h('input', { type:'number', min:1, value:newEx.reps, onChange:function(e){ setNewEx(Object.assign({},newEx,{reps:+e.target.value})); } })),
          _h('div', { className:'field' }, _h('label', null, 'Ciężar kg'), _h('input', { type:'number', min:0, step:2.5, value:newEx.weight, onChange:function(e){ setNewEx(Object.assign({},newEx,{weight:+e.target.value})); } }))
        ),
        _h('div', { className:'grid-3' },
          _h('div', { className:'field' }, _h('label', null, 'Tempo'), _h('input', { type:'text', placeholder:'3-1-1', value:newEx.tempo, onChange:function(e){ setNewEx(Object.assign({},newEx,{tempo:e.target.value})); } })),
          _h('div', { className:'field' }, _h('label', null, 'RPE'), _h('input', { type:'number', min:1, max:10, value:newEx.rpe, onChange:function(e){ setNewEx(Object.assign({},newEx,{rpe:+e.target.value})); } })),
          _h('div', { className:'field' }, _h('label', null, 'RIR'), _h(RirPicker, { value:newEx.rir, onChange:function(v){ setNewEx(Object.assign({},newEx,{rir:v})); } }))
        ),
        _h('div', { className:'grid-2' },
          _h('div', { className:'field' },
            _h('label', null, 'Pomiar'),
            _h('select', { value:newEx.measurementType, onChange:function(e){ setNewEx(Object.assign({},newEx,{measurementType:e.target.value})); } },
              _h('option', { value:'reps' }, 'Powtórzenia'), _h('option', { value:'seconds' }, 'Czas (sekundy)')
            )
          ),
          _h('div', { className:'field' },
            _h('label', { style:{ display:'flex', alignItems:'center', gap:6 } },
              _h('input', { type:'checkbox', checked:newEx.isUnilateral, onChange:function(e){ setNewEx(Object.assign({},newEx,{isUnilateral:e.target.checked})); } }),
              'Jednostronne (L/P)'
            )
          )
        ),
        _h('div', { className:'field' },
          _h('label', { style:{ display:'flex', justifyContent:'space-between' } }, _h('span', null, 'Przerwa (s)'), _h('span', { style:{ color:'var(--a-light)', fontWeight:700 } }, newEx.rest+'s')),
          _h('div', { className:'slider-wrap' }, _h('input', { type:'range', min:30, max:300, step:15, value:newEx.rest, onChange:function(e){ setNewEx(Object.assign({},newEx,{rest:+e.target.value})); } }))
        ),
        _h('button', { className:'btn btn-primary', style:{ width:'100%' }, onClick:addEx }, 'Dodaj ćwiczenie')
      )
    );
  }

  // ── STEP 5: ROZCIĄGANIE ──────────────────────────────────────────────────
  function CooldownStep(props) {
    var su = ET.useStore(); var store = su.store;
    var cs = React.useState({}); var checked = cs[0], setChecked = cs[1];
    var ck = React.useState({}); var corrChecked = ck[0], setCorrChecked = ck[1];
    var doneCount = Object.values(checked).filter(Boolean).length;
    var total = props.plan.cooldown.length;

    function toggle(i) {
      setChecked(function(c){ var n={}; n[i]=!c[i]; return Object.assign({},c,n); });
    }
    function toggleCorr(id) {
      setCorrChecked(function(c){ var n={}; n[id]=!c[id]; return Object.assign({},c,n); });
    }

    // Ćwiczenia korekcyjne: dobrane pod dolegliwości użytkownika, inaczej zestaw postawy
    // Rotacja zależna od dnia + planu — inny zestaw niż wczoraj, ale stabilny w obrębie sesji
    var corrective = pickCorrectiveExercises(store, (props.plan.id||'')+'-'+ET.dstr(), 4);

    return _h('div', { className:'fade-in' },
      _h('div', { style:{ display:'flex', alignItems:'center', gap:10, marginBottom:20 } },
        _h('div', null,
          _h('h1', { style:{ fontSize:'1.2rem', fontWeight:700 } }, '🧘 Rozciąganie'),
          _h('div', { style:{ fontSize:'.75rem', color:'var(--t3)', marginTop:2 } }, 'Krok 4 z 4 — ' + props.plan.name + ' · ' + doneCount + '/' + total)
        )
      ),

      _h(ET.ProgressBar, { value: total ? (doneCount/total*100) : 0 }),
      _h('div', { style:{ marginBottom:14 } }),

      _h('div', { className:'card card-accent', style:{ marginBottom:14, fontSize:'.82rem', color:'var(--t2)', lineHeight:1.6 } },
        '💡 Rozciąganie po treningu przyspiesza regenerację i zwiększa mobilność. Każda pozycja min. 30 sekund.'
      ),

      _h('div', { className:'card', style:{ marginBottom:14 } },
        props.plan.cooldown.map(function(item, i) {
          var done = !!checked[i];
          return _h('div', { key:i, className:'suppl-item'+(done?' checked':''), onClick:function(){ toggle(i); } },
            _h('div', { className:'suppl-check' }, done ? '✓' : ''),
            _h('div', { style:{ flex:1 } },
              _h('div', { style:{ fontWeight:600, fontSize:'.88rem' } }, item.n),
              item.d && _h('div', { style:{ fontSize:'.72rem', color:'var(--t2)', marginTop:2 } }, '⏱ ' + item.d)
            )
          );
        })
      ),

      // Ćwiczenia korekcyjne (pod rozciąganiem) — wg dolegliwości lub zestaw postawy
      corrective.length > 0 && _h('div', { className:'card', style:{ marginBottom:14 } },
        _h('div', { style:{ fontWeight:700, marginBottom:4, fontSize:'.88rem' } }, '🩹 Ćwiczenia korekcyjne'),
        _h('div', { style:{ fontSize:'.66rem', color:'var(--t3)', marginBottom:10 } },
          (store.ailments||[]).length ? 'Dobrane pod Twoje dolegliwości' : 'Profilaktyka postawy — opcjonalnie po treningu'),
        corrective.map(function(e) {
          var done = !!corrChecked[e.id];
          return _h('div', { key:e.id, className:'suppl-item'+(done?' checked':''), onClick:function(){ toggleCorr(e.id); } },
            _h('div', { className:'suppl-check' }, done ? '✓' : ''),
            _h('div', { style:{ flex:1 } },
              _h('div', { style:{ fontWeight:600, fontSize:'.88rem' } }, e.name),
              _h('div', { style:{ fontSize:'.7rem', color:'var(--t2)', marginTop:2 } }, e.mechanism||e.target_anatomy||'')
            )
          );
        })
      ),

      _h('button', { className:'btn btn-primary btn-lg', style:{ width:'100%' }, onClick:props.onNext },
        doneCount === total ? '🏆 Zakończ i podsumowanie' : '→ Pomiń i przejdź do podsumowania'
      )
    );
  }

  // ── PODSUMOWANIE ─────────────────────────────────────────────────────────
  function WorkoutSummary(props) {
    var nav = ET.useNav(); var navigate = nav.navigate;
    var session = props.result.session, prs = props.result.prs;
    var rd = props.readiness;
    var totalMin = Math.round(session.duration / 60000);
    var workMin = Math.round((session.workMs || session.duration) / 60000);
    var restMin = Math.round((session.restMs || 0) / 60000);
    var doneSets = session.exercises.reduce(function(t,e){ return t+e.setsData.filter(function(s){ return s.done; }).length; },0);

    var rdLabels = {
      willingness: ['—','Bez chęci','Ujdzie','Pełna!'],
      state: ['—','Słabo','Normalnie','Świetnie'],
      fatigue: ['—','Bardzo zmęczony','Umiarkowane','Brak zmęczenia']
    };

    return _h('div', { className:'fade-in' },
      _h('div', { className:'summary-hero' },
        _h('div', { className:'summary-hero-icon' }, '🏆'),
        _h('h2', null, 'Trening ukończony!'),
        _h('p', { style:{ color:'var(--t2)' } }, session.name)
      ),

      prs.length>0 && _h('div', { style:{ background:'var(--yellow-d)', border:'1px solid var(--yellow)', borderRadius:'var(--r2)', padding:14, marginBottom:14 } },
        _h('div', { style:{ fontWeight:700, color:'var(--yellow)', marginBottom:8 } }, '🎉 Nowe rekordy osobiste!'),
        prs.map(function(pr,i){ return _h('div', { key:i, style:{ fontSize:'.85rem', marginBottom:2 } }, pr.name+': ', _h('b', null, pr.e1rm+' kg'), ' (1RM est.)'); })
      ),

      // Czas treningu i przerw
      _h('div', { className:'card', style:{ marginBottom:14 } },
        _h('div', { style:{ fontWeight:700, marginBottom:12, fontSize:'.88rem', color:'var(--t2)' } }, '⏱ Czas sesji'),
        _h('div', { className:'grid-3', style:{ gap:8 } },
          _h('div', { style:{ textAlign:'center', padding:'12px 0' } },
            _h('div', { style:{ fontSize:'1.4rem', fontWeight:700, color:'var(--a-light)' } }, totalMin+'min'),
            _h('div', { style:{ fontSize:'.65rem', color:'var(--t3)', marginTop:2 } }, 'ŁĄCZNIE')
          ),
          _h('div', { style:{ textAlign:'center', padding:'12px 0' } },
            _h('div', { style:{ fontSize:'1.4rem', fontWeight:700, color:'var(--green)' } }, workMin+'min'),
            _h('div', { style:{ fontSize:'.65rem', color:'var(--t3)', marginTop:2 } }, 'PRACA')
          ),
          _h('div', { style:{ textAlign:'center', padding:'12px 0' } },
            _h('div', { style:{ fontSize:'1.4rem', fontWeight:700, color:'var(--yellow)' } }, restMin+'min'),
            _h('div', { style:{ fontSize:'.65rem', color:'var(--t3)', marginTop:2 } }, 'PRZERWY')
          )
        )
      ),

      _h('div', { className:'grid-3', style:{ marginBottom:14, gap:8 } },
        _h(ET.StatCard, { label:'Wolumen', value:(session.volume||0).toFixed(0)+' kg', color:'var(--green)' }),
        _h(ET.StatCard, { label:'Powtórzenia', value:session.totalReps, color:'var(--purple)' }),
        _h(ET.StatCard, { label:'Serie', value:doneSets, color:'var(--teal)' })
      ),

      rd && _h('div', { className:'card', style:{ marginBottom:14 } },
        _h('div', { style:{ fontWeight:700, marginBottom:10, fontSize:'.88rem', color:'var(--t2)' } }, '📊 Gotowość przed treningiem'),
        _h('div', { style:{ display:'flex', gap:6, flexWrap:'wrap' } },
          _h('div', { style:{ flex:1, textAlign:'center', padding:'8px', background:'var(--s3)', borderRadius:'var(--r2)' } },
            _h('div', { style:{ fontSize:'.6rem', color:'var(--t3)', marginBottom:4 } }, 'CHĘĆ'),
            _h('div', { style:{ fontWeight:700, fontSize:'.85rem' } }, rdLabels.willingness[rd.willingness||0])
          ),
          _h('div', { style:{ flex:1, textAlign:'center', padding:'8px', background:'var(--s3)', borderRadius:'var(--r2)' } },
            _h('div', { style:{ fontSize:'.6rem', color:'var(--t3)', marginBottom:4 } }, 'SAMOPOCZUCIE'),
            _h('div', { style:{ fontWeight:700, fontSize:'.85rem' } }, rdLabels.state[rd.state||0])
          ),
          _h('div', { style:{ flex:1, textAlign:'center', padding:'8px', background:'var(--s3)', borderRadius:'var(--r2)' } },
            _h('div', { style:{ fontSize:'.6rem', color:'var(--t3)', marginBottom:4 } }, 'ZMĘCZENIE'),
            _h('div', { style:{ fontWeight:700, fontSize:'.85rem' } }, rdLabels.fatigue[rd.fatigue||0])
          )
        )
      ),

      props.postWellbeing && _h('div', { className:'card', style:{ marginBottom:14 } },
        _h('div', { style:{ fontWeight:700, marginBottom:10, fontSize:'.88rem', color:'var(--t2)' } }, '🌡 Samopoczucie po treningu'),
        _h('div', { style:{ display:'flex', gap:8, flexWrap:'wrap' } },
          [
            { k:'energy', l:'Energia', icon:'⚡', c:'var(--yellow)' },
            { k:'mood', l:'Nastrój', icon:'😊', c:'var(--green)' },
            { k:'stress', l:'Stres', icon:'😰', c:'var(--red)' },
            { k:'motivation', l:'Motywacja', icon:'🔥', c:'var(--purple)' },
          ].map(function(sl) {
            var val = props.postWellbeing[sl.k];
            if (val == null) return null;
            return _h('div', { key:sl.k, style:{ textAlign:'center', flex:1 } },
              _h('div', { style:{ fontSize:'.85rem', fontWeight:700, color:sl.c } }, sl.icon+' '+val),
              _h('div', { style:{ fontSize:'.55rem', color:'var(--t3)' } }, sl.l)
            );
          })
        )
      ),

      // ── AI COACH ANALYSIS ────────────────────────────────────────────────
      _h(AIWorkoutAnalysis, { result:props.result, store:props.store }),

      _h('div', { style:{ display:'flex', gap:10, marginTop:6 } },
        _h('button', { className:'btn btn-primary', style:{ flex:1 }, onClick:function(){ navigate('dashboard'); } }, '🏠 Dashboard'),
        _h('button', { className:'btn btn-secondary', style:{ flex:1 }, onClick:props.onBack }, '📋 Lista treningów')
      )
    );
  }

  function AIWorkoutAnalysis(props) {
    var su = ET.useStore(); var store = props.store || su.store;
    var open = React.useState(true); var isOpen = open[0]; var setOpen = open[1];
    if (typeof ET.AIEngine === 'undefined') return null;
    var session = props.result && props.result.session;
    if (!session) return null;

    var workout = Object.assign({}, session, { id: '__current__' });
    var insights = ET.AIEngine.analyzeWorkout(workout, store);
    var typeColor = {achievement:'var(--yellow)', positive:'var(--green)', warning:'var(--orange)', info:'var(--a-light)'};
    var typeBg = {achievement:'rgba(234,179,8,.1)', positive:'rgba(34,197,94,.08)', warning:'rgba(249,115,22,.08)', info:'rgba(99,102,241,.08)'};

    return _h('div', { className:'card', style:{ marginBottom:14 } },
      _h('div', { style:{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:isOpen?12:0, cursor:'pointer' }, onClick:function(){ setOpen(!isOpen); } },
        _h('div', { style:{ fontWeight:700, fontSize:'.88rem', color:'var(--t2)', display:'flex', alignItems:'center', gap:8 } },
          _h('span', { style:{ fontSize:'1.1rem' } }, '🤖'),
          'Analiza AI'
        ),
        _h('span', { style:{ fontSize:'.7rem', color:'var(--t3)' } }, isOpen?'▲':'▼')
      ),
      isOpen && insights.map(function(ins, i) {
        return _h('div', { key:i, style:{ padding:'10px 12px', borderRadius:'var(--r2)', background:typeBg[ins.type]||'var(--s3)', border:'1px solid '+(typeColor[ins.type]||'var(--b1)')+'44', marginBottom:i<insights.length-1?8:0 } },
          _h('div', { style:{ display:'flex', gap:8, alignItems:'flex-start' } },
            _h('span', { style:{ fontSize:'1.1rem', flexShrink:0 } }, ins.icon),
            _h('div', null,
              _h('div', { style:{ fontWeight:700, fontSize:'.82rem', color:typeColor[ins.type]||'var(--t2)', marginBottom:3 } }, ins.title),
              _h('div', { style:{ fontSize:'.74rem', color:'var(--t2)', lineHeight:1.5 } }, ins.body)
            )
          )
        );
      })
    );
  }

  // ── AI COACH PLAN VIEW ────────────────────────────────────────────────────
  function AICoachView(props) {
    var su = ET.useStore(); var store = su.store, update = su.update;
    var toast = ET.useToast();
    var ps = React.useState(null); var selPlan = ps[0]; var setSelPlan = ps[1];

    var stagnation = typeof ET.AIEngine !== 'undefined' ? ET.AIEngine.detectStagnation(store) : {plateaus:[],improvements:[]};
    var corr = typeof ET.AIEngine !== 'undefined' ? ET.AIEngine.correlations(store) : [];

    var suggestions = selPlan && typeof ET.AIEngine !== 'undefined' ? ET.AIEngine.suggestPlanChanges(selPlan, store) : null;

    function applySuggestion(planId, exName, suggested) {
      update(function(s) {
        var overrides = Object.assign({}, s.planSuggestions||{});
        if (!overrides[planId]) overrides[planId] = {};
        overrides[planId][exName] = { weight:suggested.weight, sets:suggested.sets, reps:suggested.reps, rir:suggested.rir };
        return Object.assign({},s,{ planSuggestions:overrides });
      });
      toast('Sugestia zastosowana — aktywna przy następnym treningu ✓', 'success');
    }

    function removeSuggestion(planId, exName) {
      update(function(s) {
        var overrides = Object.assign({}, s.planSuggestions||{});
        if (overrides[planId]) { delete overrides[planId][exName]; }
        return Object.assign({},s,{ planSuggestions:overrides });
      });
      toast('Sugestia cofnięta', 'default');
    }

    var applied = store.planSuggestions||{};

    return _h('div', { className:'fade-in' },
      _h('div', { className:'page-hdr' },
        _h('div', null,
          _h('h1', null, '🤖 AI Coach'),
          _h('p', null, 'Sugestie oparte wyłącznie na Twoich danych')
        ),
        _h('button', { className:'btn btn-ghost', onClick:props.onBack }, '← Wróć')
      ),

      // Recovery score
      (function() {
        var rec = typeof ET.AIEngine !== 'undefined' ? ET.AIEngine.recovery(store) : null;
        if (!rec) return null;
        var col = rec.score>=65?'var(--green)':rec.score>=45?'var(--yellow)':'var(--red)';
        return _h('div', { className:'card', style:{ marginBottom:14, display:'flex', gap:12, alignItems:'center' } },
          _h('div', { style:{ width:54, height:54, borderRadius:'50%', background:col+'22', border:'3px solid '+col, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 } },
            _h('div', { style:{ fontWeight:700, fontSize:'.9rem', color:col } }, rec.score+'%')
          ),
          _h('div', { style:{ flex:1 } },
            _h('div', { style:{ fontWeight:700, fontSize:'.88rem', marginBottom:3 } }, '🔋 Regeneracja: '+rec.category),
            _h('div', { style:{ fontSize:'.72rem', color:'var(--t2)', lineHeight:1.4 } }, rec.recommendation),
            _h('div', { style:{ display:'flex', gap:6, flexWrap:'wrap', marginTop:6 } },
              rec.factors.map(function(f,i){
                return _h('span', { key:i, style:{ fontSize:'.62rem', padding:'2px 7px', borderRadius:20, background:f.color+'22', color:f.color, fontWeight:600 } },
                  (f.value>0?'+':'')+f.value+' '+f.label);
              })
            )
          )
        );
      })(),

      // Plan selector
      _h('div', { style:{ marginBottom:14 } },
        _h('div', { className:'section-hdr' }, _h('h2', null, 'Wybierz plan do analizy')),
        _h('div', { className:'grid-2', style:{ gap:8 } },
          WORKOUT_PLANS.map(function(p) {
            var isActive = selPlan && selPlan.id===p.id;
            var hasApplied = applied[p.id] && Object.keys(applied[p.id]).length > 0;
            return _h('button', { key:p.id,
              style:{ display:'flex', alignItems:'center', gap:10, padding:'12px 14px', borderRadius:'var(--r2)', border:'2px solid '+(isActive?p.color:'var(--b1)'), background:isActive?p.color+'18':'var(--s2)', cursor:'pointer', textAlign:'left', transition:'all .15s' },
              onClick:function(){ setSelPlan(isActive?null:p); }
            },
              _h('span', { style:{ fontSize:'1.4rem' } }, p.icon),
              _h('div', null,
                _h('div', { style:{ fontWeight:700, fontSize:'.85rem', color:isActive?p.color:'var(--t1)' } }, p.name),
                hasApplied && _h('div', { style:{ fontSize:'.6rem', color:'var(--green)', marginTop:2 } }, '✓ Aktywne sugestie')
              )
            );
          })
        )
      ),

      // Suggestions for selected plan
      selPlan && suggestions && _h('div', { className:'card', style:{ marginBottom:14 } },
        _h('div', { style:{ fontWeight:700, marginBottom:14, fontSize:'.88rem', color:'var(--t2)', display:'flex', gap:8 } },
          _h('span', { style:{ fontSize:'1rem' } }, selPlan.icon), selPlan.name, ' — sugerowane zmiany'
        ),
        suggestions.map(function(s, i) {
          var appliedHere = (applied[selPlan.id]||{})[s.original.name];
          var isChanged = s.changed;
          var borderColor = isChanged ? 'var(--green)' : 'var(--b1)';
          var bg = isChanged ? 'rgba(34,197,94,.06)' : 'var(--s3)';
          return _h('div', { key:i, style:{ padding:'12px', borderRadius:'var(--r2)', border:'1.5px solid '+borderColor, background:bg, marginBottom:8 } },
            _h('div', { style:{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:8 } },
              _h('div', { style:{ flex:1 } },
                _h('div', { style:{ fontWeight:700, fontSize:'.85rem', marginBottom:6, color:isChanged?'var(--green)':'var(--t1)' } },
                  (isChanged?'✦ ':'') + s.original.name
                ),
                _h('div', { style:{ display:'flex', gap:6, flexWrap:'wrap', marginBottom: isChanged?8:0 } },
                  // Original values
                  [
                    {l:'Serie', orig:s.original.sets, new:s.suggested.sets},
                    {l:'Powt.', orig:s.original.reps, new:s.suggested.reps},
                    {l:'Ciężar', orig:s.original.weight+'kg', new:s.suggested.weight+'kg'},
                    {l:'RIR', orig:s.original.rir, new:s.suggested.rir},
                  ].map(function(field, fi) {
                    var changed = String(field.orig) !== String(field.new);
                    return _h('div', { key:fi, style:{ textAlign:'center', padding:'4px 8px', borderRadius:'var(--r2)', background:'var(--s2)', border:'1px solid '+(changed?'var(--green)':'var(--b1)') } },
                      _h('div', { style:{ fontSize:'.55rem', color:'var(--t3)', marginBottom:2 } }, field.l),
                      changed
                        ? _h('div', null,
                            _h('span', { style:{ fontSize:'.7rem', color:'var(--t3)', textDecoration:'line-through', marginRight:4 } }, field.orig),
                            _h('span', { style:{ fontSize:'.78rem', fontWeight:700, color:'var(--green)' } }, field.new)
                          )
                        : _h('div', { style:{ fontSize:'.78rem', fontWeight:700, color:'var(--t2)' } }, field.orig)
                    );
                  })
                ),
                isChanged && s.reasons.map(function(r, ri) {
                  return _h('div', { key:ri, style:{ fontSize:'.72rem', color:'var(--t2)', background:'rgba(34,197,94,.08)', padding:'6px 8px', borderRadius:'var(--r2)', lineHeight:1.5, marginBottom:ri<s.reasons.length-1?4:0 } }, '📋 '+r);
                })
              ),
              isChanged && _h('div', { style:{ flexShrink:0 } },
                appliedHere
                  ? _h('button', { style:{ padding:'6px 10px', borderRadius:'var(--r2)', border:'1px solid var(--b1)', background:'var(--s3)', color:'var(--t3)', cursor:'pointer', fontSize:'.7rem' },
                      onClick:function(){ removeSuggestion(selPlan.id, s.original.name); }
                    }, '✓ Cofnij')
                  : _h('button', { style:{ padding:'6px 10px', borderRadius:'var(--r2)', border:'1px solid var(--green)', background:'rgba(34,197,94,.12)', color:'var(--green)', cursor:'pointer', fontSize:'.7rem', fontWeight:700 },
                      onClick:function(){ applySuggestion(selPlan.id, s.original.name, s.suggested); }
                    }, '✓ Zastosuj')
              )
            )
          );
        })
      ),

      // Stagnation analysis
      _h('div', { className:'card', style:{ marginBottom:14 } },
        _h('div', { style:{ fontWeight:700, marginBottom:10, fontSize:'.88rem' } }, '⚠️ Analiza stagnacji'),
        stagnation.plateaus.length===0
          ? _h('div', { style:{ color:'var(--green)', fontSize:'.8rem' } }, '✓ Brak stagnacji — aktywna progresja we wszystkich ćwiczeniach')
          : stagnation.plateaus.map(function(p, i) {
              return _h('div', { key:i, style:{ display:'flex', gap:10, padding:'8px 0', borderBottom:i<stagnation.plateaus.length-1?'1px solid var(--b1)':'none' } },
                _h('div', { style:{ flex:1 } },
                  _h('div', { style:{ fontWeight:700, fontSize:'.82rem', marginBottom:2 } }, p.name),
                  _h('div', { style:{ fontSize:'.7rem', color:'var(--t3)' } }, p.weight+'kg przez '+p.sessions+' sesje · '+p.days+' dni')
                ),
                _h('div', { style:{ padding:'3px 8px', borderRadius:20, background:'rgba(249,115,22,.12)', color:'var(--orange)', fontSize:'.65rem', fontWeight:700, alignSelf:'center' } }, 'PLATEAU')
              );
            })
      ),

      // Improvements
      stagnation.improvements.length>0 && _h('div', { className:'card', style:{ marginBottom:14 } },
        _h('div', { style:{ fontWeight:700, marginBottom:10, fontSize:'.88rem' } }, '📈 Mocne strony — aktywny progres'),
        stagnation.improvements.map(function(imp, i) {
          return _h('div', { key:i, style:{ display:'flex', gap:10, padding:'8px 0', borderBottom:i<stagnation.improvements.length-1?'1px solid var(--b1)':'none' } },
            _h('div', { style:{ flex:1 } },
              _h('div', { style:{ fontWeight:700, fontSize:'.82rem', marginBottom:2 } }, imp.name),
              _h('div', { style:{ fontSize:'.7rem', color:'var(--t3)' } }, imp.from+'kg → '+imp.to+'kg')
            ),
            _h('div', { style:{ padding:'3px 8px', borderRadius:20, background:'rgba(34,197,94,.12)', color:'var(--green)', fontSize:'.65rem', fontWeight:700, alignSelf:'center' } }, '+'+imp.pct+'%')
          );
        })
      ),

      // Correlations
      corr.length>0 && _h('div', { className:'card', style:{ marginBottom:14 } },
        _h('div', { style:{ fontWeight:700, marginBottom:10, fontSize:'.88rem' } }, '🔗 Korelacje wykryte w danych'),
        corr.map(function(c, i) {
          return _h('div', { key:i, style:{ padding:'8px 0', borderBottom:i<corr.length-1?'1px solid var(--b1)':'none' } },
            _h('div', { style:{ fontWeight:700, fontSize:'.8rem', marginBottom:3 } }, c.icon+' '+c.title),
            _h('div', { style:{ fontSize:'.72rem', color:'var(--t2)', lineHeight:1.5 } }, c.body)
          );
        })
      )
    );
  }

  // ── EDYCJA / RĘCZNE DODAWANIE TRENINGU ───────────────────────────────────
  function WorkoutEditSheet(props) {
    var w = props.workout;
    var isNew = !w;
    var initExercises = w && w.exercises && w.exercises.length
      ? w.exercises.map(function(ex) {
          var sets = ex.setsData || [];
          return {
            name:    ex.name||'',
            sets:    sets.length || (ex.sets||3),
            reps:    sets.length ? (sets[0].reps||0) : (ex.reps||0),
            weight:  sets.length ? (sets[0].weight||0) : (ex.weight||0),
          };
        })
      : [{ name:'', sets:3, reps:10, weight:0 }];

    var ds = React.useState({
      date:     w ? w.date       : ET.dstr(),
      name:     w ? w.name       : '',
      duration: w ? Math.round((w.duration||0)/60000) : 60,
      volume:   w ? (w.volume||0) : 0,
      notes:    w ? (w.notes||'') : '',
    });
    var data = ds[0]; var setData = ds[1];
    function upD(k,v){ setData(function(p){ var o={}; o[k]=v; return Object.assign({},p,o); }); }

    var exs = React.useState(initExercises);
    var exercises = exs[0]; var setExercises = exs[1];

    function upEx(i, k, v) {
      setExercises(function(prev){
        return prev.map(function(e, j){ if(j!==i) return e; var o={}; o[k]=v; return Object.assign({},e,o); });
      });
    }

    function addEx() { setExercises(function(p){ return p.concat([{ name:'', sets:3, reps:10, weight:0 }]); }); }
    function removeEx(i) { setExercises(function(p){ return p.filter(function(_,j){ return j!==i; }); }); }

    function calcVolume() {
      return exercises.reduce(function(t, ex){ return t + (ex.sets||0)*(ex.reps||0)*(ex.weight||0); }, 0);
    }

    function save() {
      var exFull = exercises.filter(function(e){ return e.name.trim(); }).map(function(e){
        var setsData = [];
        for (var i=0; i<(e.sets||1); i++) setsData.push({ id:i, reps:e.reps||0, weight:e.weight||0, done:true });
        return { name:e.name, sets:e.sets||0, reps:e.reps||0, weight:e.weight||0, setsData:setsData };
      });
      var vol = data.volume || calcVolume();
      var totalReps = exFull.reduce(function(t,e){ return t+(e.sets||0)*(e.reps||0); }, 0);
      var newW = {
        id:          w ? w.id : Date.now(),
        date:        data.date,
        name:        data.name || 'Trening',
        duration:    data.duration * 60000,
        volume:      vol,
        totalReps:   totalReps,
        exercises:   exFull,
        notes:       data.notes,
        prs:         w ? (w.prs||[]) : [],
        readiness:   w ? (w.readiness||null) : null,
      };
      props.update(function(s){
        var list = s.workouts || [];
        if (isNew) return Object.assign({},s,{ workouts:[newW].concat(list) });
        return Object.assign({},s,{ workouts:list.map(function(x){ return x.id===w.id?newW:x; }) });
      });
      props.toast(isNew?'Trening dodany ✓':'Zaktualizowano ✓','success');
      props.onClose();
    }

    function remove() {
      if (!confirm('Usunąć trening z historii?')) return;
      props.update(function(s){ return Object.assign({},s,{ workouts:(s.workouts||[]).filter(function(x){ return x.id!==w.id; }) }); });
      props.toast('Trening usunięty','default');
      props.onClose();
    }

    var fldStyle = { marginBottom:10 };
    var lblStyle = { fontSize:'.7rem', color:'var(--t3)', fontWeight:700, textTransform:'uppercase', letterSpacing:'.05em', display:'block', marginBottom:4 };
    var inputStyle = { width:'100%', boxSizing:'border-box' };

    return _h(ET.Sheet, { open:true, onClose:props.onClose, title:isNew?'Dodaj trening ręcznie':'Edytuj trening' },
      _h('div', { style:fldStyle },
        _h('label', { style:lblStyle }, 'Data'),
        _h('input', { type:'date', value:data.date, style:inputStyle, onChange:function(e){ upD('date',e.target.value); } })
      ),
      _h('div', { style:fldStyle },
        _h('label', { style:lblStyle }, 'Nazwa treningu'),
        _h('input', { type:'text', placeholder:'np. Góra / Siła', value:data.name, style:inputStyle, onChange:function(e){ upD('name',e.target.value); } })
      ),
      _h('div', { style:{ display:'flex', gap:10, marginBottom:10 } },
        _h('div', { style:{ flex:1 } },
          _h('label', { style:lblStyle }, 'Czas (min)'),
          _h('input', { type:'number', min:1, max:300, value:data.duration, style:inputStyle, onChange:function(e){ upD('duration',+e.target.value); } })
        ),
        _h('div', { style:{ flex:1 } },
          _h('label', { style:lblStyle }, 'Wolumen (kg) — auto'),
          _h('input', { type:'number', min:0, value:data.volume||calcVolume(), style:inputStyle, onChange:function(e){ upD('volume',+e.target.value); } })
        )
      ),

      _h('div', { style:{ marginBottom:8 } },
        _h('div', { style:{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 } },
          _h('label', { style:lblStyle }, 'Ćwiczenia'),
          _h('button', { style:{ fontSize:'.72rem', padding:'3px 10px', borderRadius:'var(--r2)', border:'1px solid var(--a)', background:'var(--a)', color:'white', cursor:'pointer' }, onClick:addEx }, '+ Dodaj ćwiczenie')
        ),
        exercises.map(function(ex, i) {
          return _h('div', { key:i, style:{ background:'var(--s3)', borderRadius:'var(--r2)', padding:10, marginBottom:8 } },
            _h('div', { style:{ display:'flex', gap:6, marginBottom:6 } },
              _h('input', { type:'text', placeholder:'Nazwa ćwiczenia', value:ex.name, style:{ flex:1 },
                onChange:function(e){ upEx(i,'name',e.target.value); } }),
              _h('button', { style:{ padding:'0 10px', borderRadius:'var(--r2)', border:'1px solid var(--b1)', background:'transparent', color:'var(--red)', cursor:'pointer', fontSize:'1rem' },
                onClick:function(){ removeEx(i); } }, '×')
            ),
            _h('div', { style:{ display:'flex', gap:6 } },
              _h('div', { style:{ flex:1, textAlign:'center' } },
                _h('label', { style:{ fontSize:'.6rem', color:'var(--t3)', display:'block', marginBottom:2 } }, 'Serie'),
                _h('input', { type:'number', min:1, max:20, value:ex.sets, style:{ width:'100%' }, onChange:function(e){ upEx(i,'sets',+e.target.value); } })
              ),
              _h('div', { style:{ flex:1, textAlign:'center' } },
                _h('label', { style:{ fontSize:'.6rem', color:'var(--t3)', display:'block', marginBottom:2 } }, 'Powt.'),
                _h('input', { type:'number', min:1, max:100, value:ex.reps, style:{ width:'100%' }, onChange:function(e){ upEx(i,'reps',+e.target.value); } })
              ),
              _h('div', { style:{ flex:1, textAlign:'center' } },
                _h('label', { style:{ fontSize:'.6rem', color:'var(--t3)', display:'block', marginBottom:2 } }, 'Ciężar (kg)'),
                _h('input', { type:'number', min:0, max:500, step:0.5, value:ex.weight, style:{ width:'100%' }, onChange:function(e){ upEx(i,'weight',+e.target.value); } })
              )
            )
          );
        })
      ),

      _h('div', { style:fldStyle },
        _h('label', { style:lblStyle }, 'Notatki (opcjonalnie)'),
        _h('textarea', { rows:2, placeholder:'np. dobry trening, bolał bark...', value:data.notes, style:Object.assign({},inputStyle,{resize:'vertical'}),
          onChange:function(e){ upD('notes',e.target.value); } })
      ),

      _h('div', { style:{ display:'flex', gap:8 } },
        !isNew && _h('button', { className:'btn btn-danger', style:{ flex:'0 0 auto' }, onClick:remove }, '🗑️'),
        _h('button', { className:'btn btn-primary', style:{ flex:1 }, onClick:save }, isNew?'Dodaj trening':'Zapisz zmiany')
      )
    );
  }

  // ── AUTOREGULACJA OBJ: propozycje progresji ciężaru ───────────────────────
  // Gdy w 2 ostatnich sesjach z ćwiczeniem faktyczny RIR ≥ planowanego
  // (użytkownik miał zapas), proponuj +2,5% ciężaru (zaokr. do 0,5 kg).
  function progressionProposals(store) {
    var out = [];
    getEffectivePlans(store).forEach(function(p) {
      var ov = (store.planSuggestions||{})[p.id] || {};
      (p.exercises||[]).forEach(function(ex) {
        var cur = ov[ex.name] && ov[ex.name].weight != null ? ov[ex.name].weight : (ex.weight||0);
        if (!(cur > 0)) return;
        var plannedRir = ex.rir != null ? ex.rir : 2;
        // 2 ostatnie sesje zawierające to ćwiczenie
        var sessions = [];
        (store.workouts||[]).some(function(w) {
          var e = (w.exercises||[]).find(function(x){ return x.name===ex.name; });
          if (e) sessions.push(e);
          return sessions.length >= 2;
        });
        if (sessions.length < 2) return;
        var allEasy = sessions.every(function(e) {
          var logged = (e.setsData||[]).filter(function(s){ return s.done && s.rpe != null; });
          return logged.length > 0 && logged.every(function(s){ return +s.rpe >= plannedRir; });
        });
        if (!allEasy) return;
        // Progresja już zastosowana (nadpisanie powyżej ciężaru z tych sesji) → czekaj na nowe sesje
        var sessionKg = 0;
        sessions.forEach(function(e){ (e.setsData||[]).forEach(function(s){ if (s.done && +s.weight > sessionKg) sessionKg = +s.weight; }); });
        if (ov[ex.name] && ov[ex.name].weight != null && ov[ex.name].weight > sessionKg) return;
        // Decyzja "ile podnieść" — w core (ETCore.computeProgressionProposal)
        var prop = window.ETCore && ETCore.computeProgressionProposal
          ? ETCore.computeProgressionProposal(cur, true)
          : { to: Math.max(cur + 0.5, Math.round(cur * 1.025 * 2) / 2) };
        if (!prop) return;
        out.push({ planId:p.id, planName:p.name, exName:ex.name, from:cur, to:prop.to, rir:plannedRir });
      });
    });
    return out;
  }

  // ── HELPER: efektywne plany (domyślne + nadpisania ze store) ────────────────
  function getEffectivePlans(store) {
    var overrides = store.workoutPlans || {};
    var customs = store.customWorkoutPlans || [];
    var base = WORKOUT_PLANS.map(function(p) {
      return overrides[p.id] ? Object.assign({}, p, overrides[p.id]) : p;
    });
    // każdy plan ma periodyzację (zakresy tygodni + deload) — domyślnie 1-4/5-8/9-12
    return base.concat(customs).map(function(p) {
      return p.ranges ? p : Object.assign({}, p, { ranges: defaultRanges() });
    });
  }

  // ── CELE PLANU: mapowanie na strefy z bazy wiedzy (Ratamess/ACSM) ─────────
  var PLAN_GOALS = [
    { id:'hypertrophy', label:'💪 Masa',        tempo:'3-1-2' },
    { id:'strength',    label:'🏋️ Siła',        tempo:'2-1-X' },
    { id:'endurance',   label:'🔥 Redukcja',    tempo:'2-0-2' },
    { id:'power',       label:'⚡ Moc',          tempo:'X-0-X' },
  ];
  var PLAN_LEVELS = [
    { id:'novice',       label:'Początkujący' },
    { id:'intermediate', label:'Średni' },
    { id:'advanced',     label:'Zaawansowany' },
  ];

  // Parametry ćwiczenia wg wytycznych: cel+poziom → serie/powt./RIR/przerwa/tempo
  function prescriptionFor(goal, level) {
    if (!window.ETCore || !ETCore.prescribe) return null;
    try {
      var p = ETCore.prescribe(goal, level);
      var g = PLAN_GOALS.find(function(x){ return x.id===goal; });
      return {
        sets: p.sets,
        reps: Math.round((p.repsMin + p.repsMax) / 2),
        rir: p.rir,
        rest: p.restSec,
        tempo: (g && g.tempo) || 'kontrola',
        pctMin: p.pct1RMMin, pctMax: p.pct1RMMax,
      };
    } catch(e) { return null; }
  }

  // ── CELE META-PLANU (Mój plan treningowy) ─────────────────────────────────
  // Cel planu steruje auto-podstawianiem parametrów przy zamianie/dodawaniu
  // ćwiczeń w aktywnym treningu (mapowanie na strefy Ratamess/ACSM w core).
  var META_GOALS = [
    { id:'masa',         label:'💪 Masa',         core:'hypertrophy' },
    { id:'redukcja',     label:'🔥 Redukcja',     core:'endurance' },
    { id:'rekompozycja', label:'♻️ Rekompozycja', core:'hypertrophy' },
    { id:'sila',         label:'🏋️ Siła',         core:'strength' },
    { id:'wytrzymalosc', label:'🏃 Wytrzymałość', core:'endurance' },
  ];
  function metaGoalPrescription(goalId, level) {
    var mg = META_GOALS.find(function(g){ return g.id===goalId; });
    if (!mg) return null;
    return prescriptionFor(mg.core, level||'intermediate');
  }
  function findMetaForUnit(store, unitId) {
    return getMetaPlans(store).find(function(m){
      return (m.units||[]).some(function(u){ return u.id===unitId; });
    }) || null;
  }

  // Bieżący tydzień planu: tydzień zalicza się, gdy KAŻDA jednostka siłowa
  // została wykonana (liczy się min. liczba sesji per jednostka).
  function planWeekInfo(store, units) {
    var str = (units||[]).filter(function(u){ return u.unitType!=='running'; });
    if (!str.length) return null;
    var now = Date.now();
    var inputs = str.map(function(u){
      var count = (store.workouts||[]).filter(function(w){ return w.planId===u.id; }).length;
      var ageDays = u.createdAt ? (now - new Date(u.createdAt).getTime())/86400000 : undefined;
      return { count:count, ageDays:ageDays };
    });
    // Logika w core (ETCore.computeWeekInfo): świeżo dodana jednostka (0 sesji,
    // <7 dni od utworzenia) nie cofa tygodnia całego planu do 1.
    if (window.ETCore && ETCore.computeWeekInfo) return ETCore.computeWeekInfo(inputs);
    var mature = inputs.filter(function(u){ return u.count>0 || u.ageDays===undefined || u.ageDays>=7; });
    var completed = mature.length ? Math.min.apply(null, mature.map(function(u){ return u.count; })) : 0;
    return { completedWeeks:completed, currentWeek:completed+1 };
  }

  // ── PODSUMOWANIE: serie / tydzień na grupę mięśniową ──────────────────────
  function groupForMuscle(m) {
    if (/^piersiowy/.test(m)) return 'klatka_piersiowa';
    if (/^(najszerszy|prostownik_grzbietu|pulapki|rownolegloboczny|obly)/.test(m)) return 'plecy';
    if (/^(czworoglowy|posladkowy|dwuglowy_uda|przywodziciele)/.test(m)) return 'nogi';
    if (/^(dwuglowy_ramienia|ramienny$|ramienno)/.test(m)) return 'biceps';
    if (/^trojglowy/.test(m)) return 'triceps';
    if (/^naramienny/.test(m)) return 'barki';
    if (/^(brzuchaty|plaszczkowaty)/.test(m)) return 'lydki';
    if (/^(zginacze_nadgarstka|prostowniki_nadgarstka|chwyt)/.test(m)) return 'przedramiona';
    return 'core_brzuch';
  }
  // Dopasowanie nazwy z planu do bazy: dokładne (bez wielkości liter), potem zawieranie
  function dbForName(name) {
    var n = (name||'').toLowerCase().trim();
    if (!n) return null;
    var list = ET.EXERCISES_BASIC||[];
    var exact = list.find(function(d){ return d.name.toLowerCase()===n; });
    if (exact) return exact;
    return list.find(function(d){
      var dn = d.name.toLowerCase();
      return dn.indexOf(n)!==-1 || n.indexOf(dn)!==-1;
    }) || null;
  }
  // Fallback: grupa mięśniowa ze słów kluczowych w nazwie (gdy brak w bazie)
  function groupsFromName(name) {
    var n = (name||'').toLowerCase();
    if (/podciąg|ściąganie|wiosł|pulldown|pull-?over|martwy ciąg|rdl|face ?pull|shrug|back extension/.test(n)) return ['plecy'];
    if (/przysiad|squat|hip ?thrust|wykrok|lunge|step-?up|prasa|glute|pośladk/.test(n)) return ['nogi'];
    if (/triceps|prostowanie ramion|french|pushdown|kickback|diament/.test(n)) return ['triceps'];
    if (/biceps|uginanie|curl/.test(n)) return ['biceps'];
    if (/ohp|żołnier|arnold|wznosy|unoszenia|raise|barki|delt/.test(n)) return ['barki'];
    if (/łydk|wspięcia|calf/.test(n)) return ['lydki'];
    if (/plank|deska|brzuch|crunch|dead ?bug|russian|hollow|mountain|pallof|core/.test(n)) return ['core_brzuch'];
    if (/przedram|chwyt|farmer|nadgarst/.test(n)) return ['przedramiona'];
    if (/wyciskanie|rozpiętki|pompk|crossover|dip|klatk/.test(n)) return ['klatka_piersiowa'];
    return [];
  }
  function weeklyMuscleSets(units) {
    var acc = {};
    units.forEach(function(u){
      if (u.unitType==='running') return;
      (u.exercises||[]).forEach(function(ex){
        var sets = +ex.sets||0; if (!sets||!ex.name) return;
        var db = dbForName(ex.name);
        var groups = [];
        if (db && db.muscles && db.muscles.length) {
          var seen = {};
          db.muscles.forEach(function(m){ var g=groupForMuscle(m); if(!seen[g]){ seen[g]=1; groups.push(g); } });
        } else if (db && db.tags && db.tags[0]) {
          groups = [db.tags[0]];
        } else {
          groups = groupsFromName(ex.name);
        }
        if (!groups.length) return;
        // wielostawowe rozdzielają serie między zaangażowane grupy
        var share = sets / groups.length;
        groups.forEach(function(g){ acc[g] = (acc[g]||0) + share; });
      });
    });
    return acc;
  }

  // ── WAŻONE SERIE / TYDZIEŃ: moc serii zależy od intensywności ─────────────
  // Ciężkie, niskopowtórzeniowe serie męczą bardziej: 5×5 liczy się ×1,5,
  // 5×10 ×1,0, serie 15+ powt. ×0,8. Limit praktyczny (MRV): ~20 ważonych
  // serii na grupę mięśniową tygodniowo.
  var WEIGHTED_SETS_MAX = 20;
  function setFatigueFactor(reps) {
    reps = +reps || 10;
    if (reps <= 6) return 1.5;
    if (reps <= 9) return 1.2;
    if (reps <= 12) return 1.0;
    return 0.8;
  }
  function weeklyWeightedSets(units) {
    var acc = {}, total = 0;
    units.forEach(function(u){
      if (u.unitType==='running') return;
      (u.exercises||[]).forEach(function(ex){
        var sets = +ex.sets||0; if (!sets||!ex.name) return;
        var db = dbForName(ex.name);
        // Rozciąganie nie generuje zmęczenia treningowego — poza licznikiem
        if (db && (db.tags||[])[0]==='rozciaganie') return;
        var weighted = sets * setFatigueFactor(ex.reps);
        total += weighted;
        var groups = [];
        if (db && db.muscles && db.muscles.length) {
          var seen = {};
          db.muscles.forEach(function(m){ var g=groupForMuscle(m); if(!seen[g]){ seen[g]=1; groups.push(g); } });
        } else if (db && db.tags && db.tags[0]) {
          groups = [db.tags[0]];
        } else {
          groups = groupsFromName(ex.name);
        }
        if (!groups.length) return;
        var share = weighted / groups.length;
        groups.forEach(function(g){ acc[g] = (acc[g]||0) + share; });
      });
    });
    return { perGroup:acc, total:total };
  }

  // ── EDYTOR PERIODYZACJI (wspólny dla jednostki i całego planu) ───────────
  // Jeden mechanizm: te same zakresy tygodni, tryby i przeliczenia na obu poziomach.
  var RANGE_COLORS = ['var(--a)','var(--green)','var(--purple)','var(--orange)','var(--teal)'];
  function RangesEditor(props) {
    var ranges = props.ranges || [];
    if (!ranges.length || ranges[0].startWeek == null) return null;
    function commit(rs) { props.onChange(rs); }
    function upRange(ri, field, val) {
      commit(ranges.map(function(r,j){ if(j!==ri)return r; var o={}; o[field]=val; return Object.assign({},r,o); }));
    }
    function shiftBoundary(ri, delta) {
      var rs = JSON.parse(JSON.stringify(ranges));
      var a=rs[ri], b=rs[ri+1];
      if(!a||!b||a.startWeek==null||b.startWeek==null) return;
      var ne=a.endWeek+delta;
      if(ne<a.startWeek) ne=a.startWeek;
      if(ne>=b.endWeek) ne=b.endWeek-1;
      a.endWeek=ne; b.startWeek=ne+1;
      commit(rs);
    }
    var total = ranges[ranges.length-1].endWeek || 12;
    function blockOf(w){ for(var i=0;i<ranges.length;i++){ if(w>=ranges[i].startWeek && w<=ranges[i].endWeek) return i; } return -1; }
    var baseObj = (props.exercises||[]).reduce(function(t,ex){ return t + (ex.sets||0)*(ex.reps||0)*(ex.weight||0); }, 0);

    return _h('div', { className:'card', style:{ marginBottom:14 } },
      _h('div', { style:{ fontWeight:700, marginBottom:12, fontSize:'.85rem', color:'var(--t2)' } }, props.title || '📆 Periodyzacja — zakresy tygodni'),
      _h('div', { style:{ display:'flex', gap:2, marginBottom:8 } },
        (function(){ var cells=[]; for(var w=1;w<=total;w++){ var bi=blockOf(w); cells.push(_h('div',{ key:w, style:{ flex:1, height:22, borderRadius:3, background: bi>=0?RANGE_COLORS[bi%RANGE_COLORS.length]:'var(--b1)', opacity:.85, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'.5rem', color:'#fff', fontWeight:700 } }, w)); } return cells; })()
      ),
      ranges.length>1 && _h('div', { style:{ display:'flex', gap:10, flexWrap:'wrap', marginBottom:10 } },
        ranges.slice(0,-1).map(function(rg, ri) {
          return _h('div', { key:ri, style:{ display:'flex', alignItems:'center', gap:4, fontSize:'.66rem', color:'var(--t3)' } },
            _h('span', null, 'Granica '+(ri+1)+'|'+(ri+2)+':'),
            _h('button', { className:'btn btn-ghost btn-sm', style:{ padding:'2px 7px' }, onClick:function(){ shiftBoundary(ri,-1); } }, '◀'),
            _h('b', { style:{ color:'var(--t1)' } }, 'tydz. '+rg.endWeek),
            _h('button', { className:'btn btn-ghost btn-sm', style:{ padding:'2px 7px' }, onClick:function(){ shiftBoundary(ri,1); } }, '▶')
          );
        })
      ),
      ranges.map(function(rg, ri) {
        return _h('div', { key:ri, style:{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap', padding:'8px 0', borderTop:ri>0?'1px solid var(--b1)':'none' } },
          _h('div', { style:{ fontWeight:700, fontSize:'.82rem', minWidth:82, color:RANGE_COLORS[ri%RANGE_COLORS.length] } }, 'Tydz. '+rg.startWeek+'–'+rg.endWeek),
          _h('div', { style:{ display:'flex', gap:4 } },
            [{ id:'progresja', l:'📈 Progresja' }, { id:'deload', l:'📉 Deload' }].map(function(m) {
              return _h('button', { key:m.id, className:'tag-btn'+(rg.mode===m.id?' active':''), style:{ fontSize:'.68rem' }, onClick:function(){ upRange(ri,'mode',m.id); } }, m.l);
            })
          ),
          _h('div', { style:{ display:'flex', alignItems:'center', gap:3 } },
            _h('span', { style:{ fontSize:'.64rem', color:'var(--t3)' } }, 'obj.'),
            _h('input', { type:'number', min:30, max:100, value:rg.volumePct!=null?rg.volumePct:80, style:{ width:52 }, onChange:function(e){ upRange(ri,'volumePct',+e.target.value); } }),
            _h('span', { style:{ fontSize:'.64rem', color:'var(--t3)' } }, '%')
          ),
          rg.mode==='deload' && _h('div', { style:{ display:'flex', alignItems:'center', gap:3 } },
            _h('span', { style:{ fontSize:'.7rem', color:'var(--t3)' } }, 'deload -'),
            _h('input', { type:'number', min:5, max:50, value:rg.deloadPct, style:{ width:50 }, onChange:function(e){ upRange(ri,'deloadPct',+e.target.value); } }),
            _h('span', { style:{ fontSize:'.7rem', color:'var(--t3)' } }, '%')
          )
        );
      }),
      // Obj: automatyczna objętość (Σ serie×powt.×ciężar) + cel per blok
      baseObj > 0 && _h('div', { style:{ marginTop:10, padding:'8px 10px', background:'var(--s3)', borderRadius:'var(--r2)' } },
        _h('div', { style:{ fontSize:'.72rem', fontWeight:700, marginBottom:4 } },
          '📊 Obj. jednostki (100%): '+baseObj.toLocaleString('pl-PL')+' kg'),
        _h('div', { style:{ display:'flex', gap:10, flexWrap:'wrap' } },
          ranges.map(function(rg, ri){
            var pct = rg.volumePct!=null?rg.volumePct:100;
            var obj = Math.round(baseObj*pct/100);
            var wMult = rg.mode==='deload' ? (1-(rg.deloadPct||15)/100) : 1;
            return _h('span', { key:ri, style:{ fontSize:'.64rem', color:RANGE_COLORS[ri%RANGE_COLORS.length] } },
              'Tydz. '+rg.startWeek+'–'+rg.endWeek+': ~'+Math.round(obj*wMult).toLocaleString('pl-PL')+' kg');
          })
        ),
        _h('div', { style:{ fontSize:'.62rem', color:'var(--t3)', marginTop:4 } },
          '💡 Sugestia progresji: gdy RIR z sesji ≥ planowanego przez 2 tyg., podnieś ciężar tak, by obj. wzrosła o ~2,5-5%.')
      ),
      _h('div', { style:{ fontSize:'.66rem', color:'var(--t3)', marginTop:8, lineHeight:1.5 } }, props.hint || '💡 Przesuwaj granice ◀▶ (np. 1-4 → 1-5), ustaw tryb i deload dla każdego bloku. Tydzień zalicza się po wszystkich treningach.')
    );
  }

  // ── EDYTOR PLANU (widok pojedynczego planu) ──────────────────────────────
  function PlanEditView(props) {
    var ep = React.useState(JSON.parse(JSON.stringify(props.plan)));
    var editing = ep[0], setEditing = ep[1];
    var pf = React.useState(-1); var pickerFor = pf[0], setPickerFor = pf[1];
    var pq = React.useState(''); var pickerQ = pq[0], setPickerQ = pq[1];
    var pt = React.useState(''); var pickerTag = pt[0], setPickerTag = pt[1];

    function upE(key, val) { setEditing(function(p){ var o={}; o[key]=val; return Object.assign({},p,o); }); }

    // Wybór ćwiczenia z bazy → auto-podstawienie parametrów wg celu planu
    function pickExercise(i, dbEx) {
      var goal = editing.goal || 'hypertrophy';
      var level = editing.level || 'intermediate';
      var pr = prescriptionFor(goal, level);
      setEditing(function(p) {
        var list = (p.exercises||[]).slice();
        var cur = Object.assign({}, list[i], { name: dbEx.name });
        if (pr) {
          cur.sets = pr.sets; cur.reps = pr.reps; cur.rir = pr.rir;
          cur.rest = pr.rest; cur.tempo = pr.tempo;
          cur.plan = pr.sets + '×' + pr.reps;
          // Sugestia ciężaru: 1RM Engine × tabela NSCA %1RM↔powt. (z zapasem RIR)
          try {
            var orm = window.etcore && ETCore.latestOrm ? ETCore.latestOrm(window.etcore, dbEx.name) : null;
            if (orm && orm.orm1rm && ETCore.suggestLoad) {
              var kg = ETCore.suggestLoad(orm.orm1rm, pr.reps, cur.rir);
              if (kg) cur.weight = kg;
            }
          } catch(e) {}
        }
        list[i] = cur;
        return Object.assign({}, p, { exercises:list });
      });
      setPickerFor(-1); setPickerQ('');
    }

    function addWarmup() {
      setEditing(function(p){ return Object.assign({},p,{ warmup:(p.warmup||[]).concat([{ n:'', s:1, r:0, note:'' }]) }); });
    }
    function upWarmup(i, field, val) {
      setEditing(function(p){
        return Object.assign({},p,{ warmup:p.warmup.map(function(item,j){ if(j!==i)return item; var o={}; o[field]=val; return Object.assign({},item,o); }) });
      });
    }
    function rmWarmup(i) {
      setEditing(function(p){ return Object.assign({},p,{ warmup:p.warmup.filter(function(_,j){ return j!==i; }) }); });
    }

    function addExercise() {
      var newEx = { name:'', plan:'3×10', sets:3, reps:10, weight:0, rir:2, tempo:'kontrola', rest:90, prog:'' };
      setEditing(function(p){ return Object.assign({},p,{ exercises:(p.exercises||[]).concat([newEx]) }); });
    }
    function upExercise(i, field, val) {
      setEditing(function(p){
        return Object.assign({},p,{ exercises:p.exercises.map(function(ex,j){
          if(j!==i)return ex;
          var o={}; o[field]=val;
          var updated = Object.assign({},ex,o);
          if(field==='sets'||field==='reps') updated.plan = updated.sets+'×'+updated.reps;
          return updated;
        })});
      });
    }
    function rmExercise(i) {
      setEditing(function(p){ return Object.assign({},p,{ exercises:p.exercises.filter(function(_,j){ return j!==i; }) }); });
    }
    function addSet(i) {
      setEditing(function(p){ return Object.assign({},p,{ exercises:p.exercises.map(function(ex,j){
        if(j!==i)return ex; var ns=(ex.sets||1)+1; return Object.assign({},ex,{sets:ns, plan:ns+'×'+ex.reps});
      })}); });
    }
    function rmSet(i) {
      setEditing(function(p){ return Object.assign({},p,{ exercises:p.exercises.map(function(ex,j){
        if(j!==i)return ex; var ns=Math.max(1,(ex.sets||1)-1); return Object.assign({},ex,{sets:ns, plan:ns+'×'+ex.reps});
      })}); });
    }
    function addWarmupSet(i) {
      setEditing(function(p){ return Object.assign({},p,{ warmup:p.warmup.map(function(item,j){
        if(j!==i)return item; return Object.assign({},item,{s:(item.s||1)+1});
      })}); });
    }
    function rmWarmupSet(i) {
      setEditing(function(p){ return Object.assign({},p,{ warmup:p.warmup.map(function(item,j){
        if(j!==i)return item; return Object.assign({},item,{s:Math.max(1,(item.s||1)-1)});
      })}); });
    }

    var ICONS = ['💪','🦵','🏋️','⚡','🔥','🧘','🏃','🤸','🥊','🎯','🌟','📋'];

    return _h('div', { style:{ paddingBottom:20 } },
      _h('div', { style:{ display:'flex', gap:8, marginBottom:16, position:'sticky', top:0, background:'var(--s1)', padding:'12px 0 8px', zIndex:5, borderBottom:'1px solid var(--b1)' } },
        _h('button', { className:'btn btn-ghost', onClick:props.onBack }, '←'),
        _h('button', { className:'btn btn-primary', style:{ flex:1 }, onClick:function(){ props.onSave(editing); } }, '✓ Zapisz plan'),
        (props.onReset || props.onDelete) && _h('button', {
          className:'btn btn-ghost', style:{ color: props.onDelete ? 'var(--red)' : 'var(--orange)' },
          onClick: props.onDelete || props.onReset
        }, props.onDelete ? '🗑' : '↩')
      ),

      _h('div', { className:'card', style:{ marginBottom:14 } },
        _h('div', { style:{ fontWeight:700, marginBottom:12, fontSize:'.85rem', color:'var(--t2)' } }, 'Informacje o planie'),
        _h('div', { className:'field' },
          _h('label', null, 'Ikona'),
          _h('div', { style:{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:6 } },
            ICONS.map(function(ic){ return _h('button', { key:ic, onClick:function(){ upE('icon',ic); },
              style:{ width:36, height:36, borderRadius:'var(--r2)', border:'2px solid '+(editing.icon===ic?'var(--a)':'var(--b1)'), background:editing.icon===ic?'var(--a-dim)':'var(--s3)', fontSize:'1.2rem', cursor:'pointer' } }, ic); })
          )
        ),
        _h('div', { className:'field' }, _h('label', null, 'Nazwa'), _h('input', { type:'text', value:editing.name, onChange:function(e){ upE('name',e.target.value); } })),
        _h('div', { className:'grid-2' },
          _h('div', { className:'field' }, _h('label', null, 'Dzień'), _h('input', { type:'text', value:editing.day||'', onChange:function(e){ upE('day',e.target.value); } })),
          _h('div', { className:'field' }, _h('label', null, 'Opis skrócony'), _h('input', { type:'text', value:editing.desc||'', onChange:function(e){ upE('desc',e.target.value); } }))
        )
      ),


      _h('div', { style:{ marginBottom:14 } },
        _h('div', { style:{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 } },
          _h('div', { style:{ fontWeight:700, fontSize:'.88rem' } }, '🔥 Rozgrzewka ('+((editing.warmup||[]).length)+')'),
          _h('button', { className:'btn btn-secondary btn-sm', onClick:addWarmup }, '+ Dodaj')
        ),
        (editing.warmup||[]).length===0 && _h('div', { style:{ color:'var(--t3)', fontSize:'.78rem', padding:'6px 0' } }, 'Brak ćwiczeń rozgrzewkowych'),
        (editing.warmup||[]).map(function(item, i) {
          return _h('div', { key:i, className:'card card-sm', style:{ marginBottom:6 } },
            _h('div', { style:{ display:'flex', gap:6, alignItems:'center', marginBottom:6 } },
              _h('input', { type:'text', value:item.n, placeholder:'Nazwa ćwiczenia', style:{ flex:1 }, onChange:function(e){ upWarmup(i,'n',e.target.value); } }),
              _h('button', { className:'btn btn-ghost btn-sm btn-icon', style:{ color:'var(--red)', flexShrink:0 }, onClick:function(){ rmWarmup(i); } }, '✕')
            ),
            _h('div', { style:{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap' } },
              _h('div', { style:{ display:'flex', alignItems:'center', gap:4 } },
                _h('button', { className:'btn btn-ghost btn-sm btn-icon', onClick:function(){ rmWarmupSet(i); } }, '−'),
                _h('span', { style:{ fontWeight:700, minWidth:20, textAlign:'center' } }, item.s||1),
                _h('button', { className:'btn btn-ghost btn-sm btn-icon', onClick:function(){ addWarmupSet(i); } }, '+'),
                _h('span', { style:{ fontSize:'.65rem', color:'var(--t3)' } }, 'serie')
              ),
              _h('div', { style:{ flex:1, minWidth:80 } },
                _h('label', { style:{ fontSize:'.6rem', color:'var(--t3)' } }, 'Powtórzenia'),
                _h('input', { type:'number', min:0, value:item.r||0, onChange:function(e){ upWarmup(i,'r',+e.target.value); } })
              ),
              _h('div', { style:{ flex:2, minWidth:100 } },
                _h('label', { style:{ fontSize:'.6rem', color:'var(--t3)' } }, 'Notatka'),
                _h('input', { type:'text', value:item.note||'', placeholder:'np. Łopatki do tyłu', onChange:function(e){ upWarmup(i,'note',e.target.value); } })
              )
            )
          );
        })
      ),

      // ── CEL + POZIOM: sterują auto-parametrami przy wyborze ćwiczenia ────
      _h('div', { className:'card card-sm', style:{ marginBottom:14 } },
        _h('div', { style:{ fontWeight:700, fontSize:'.8rem', color:'var(--t2)', marginBottom:8 } }, '🎯 Cel planu (auto-parametry wg ACSM/NSCA)'),
        _h('div', { style:{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:8 } },
          PLAN_GOALS.map(function(g) {
            var act = (editing.goal||'hypertrophy')===g.id;
            return _h('button', { key:g.id, className:'btn btn-sm '+(act?'btn-primary':'btn-secondary'),
              style:{ fontSize:'.72rem' }, onClick:function(){ upE('goal', g.id); } }, g.label);
          })
        ),
        _h('div', { style:{ display:'flex', gap:6, flexWrap:'wrap' } },
          PLAN_LEVELS.map(function(l) {
            var act = (editing.level||'intermediate')===l.id;
            return _h('button', { key:l.id, className:'btn btn-sm '+(act?'btn-primary':'btn-secondary'),
              style:{ fontSize:'.68rem' }, onClick:function(){ upE('level', l.id); } }, l.label);
          })
        ),
        (function() {
          var pr = prescriptionFor(editing.goal||'hypertrophy', editing.level||'intermediate');
          if (!pr) return null;
          return _h('div', { style:{ fontSize:'.66rem', color:'var(--a-light)', marginTop:8, background:'var(--a-dim)', borderRadius:'var(--r2)', padding:'5px 8px' } },
            'Nowe ćwiczenia dostaną: '+pr.sets+' serie × '+pr.reps+' powt. · RIR '+pr.rir+' · przerwa '+pr.rest+'s · '+pr.pctMin+'-'+pr.pctMax+'% 1RM');
        })()
      ),

      _h('div', { style:{ marginBottom:14 } },
        _h('div', { style:{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 } },
          _h('div', { style:{ fontWeight:700, fontSize:'.88rem' } }, '💪 Ćwiczenia ('+((editing.exercises||[]).length)+')'),
          _h('button', { className:'btn btn-secondary btn-sm', onClick:addExercise }, '+ Dodaj')
        ),
        (editing.exercises||[]).length===0 && _h('div', { style:{ color:'var(--t3)', fontSize:'.78rem', padding:'6px 0' } }, 'Brak ćwiczeń'),
        (editing.exercises||[]).map(function(ex, i) {
          return _h('div', { key:i, className:'card card-sm', style:{ marginBottom:8, background:'var(--s3)' } },
            _h('div', { style:{ display:'flex', gap:6, alignItems:'center', marginBottom:8 } },
              _h('div', { style:{ fontSize:'.72rem', fontWeight:700, color:'var(--t3)', minWidth:22 } }, i+1+'.'),
              _h('input', { type:'text', value:ex.name, placeholder:'Nazwa ćwiczenia *', style:{ flex:1 }, onChange:function(e){ upExercise(i,'name',e.target.value); } }),
              _h('button', { className:'btn btn-sm '+(pickerFor===i?'btn-primary':'btn-secondary'), style:{ flexShrink:0, padding:'6px 10px' }, title:'Wybierz z bazy ćwiczeń',
                onClick:function(){ setPickerFor(pickerFor===i?-1:i); setPickerQ(''); setPickerTag(''); } }, '📚'),
              _h('button', { className:'btn btn-ghost btn-sm btn-icon', style:{ color:'var(--red)', flexShrink:0 }, onClick:function(){ rmExercise(i); } }, '✕')
            ),
            // ── PICKER: baza 90 ćwiczeń, filtr + auto-parametry po wyborze ──
            pickerFor===i && _h('div', { style:{ marginBottom:8, background:'var(--s2)', border:'1px solid var(--b2)', borderRadius:'var(--r2)', padding:8 } },
              _h('input', { type:'text', placeholder:'🔍 Szukaj ćwiczenia...', value:pickerQ, autoFocus:true, style:{ width:'100%', marginBottom:6 },
                onChange:function(e){ setPickerQ(e.target.value); } }),
              _h('div', { style:{ display:'flex', gap:4, flexWrap:'wrap', marginBottom:6 } },
                _h('button', { style:{ padding:'3px 8px', borderRadius:12, border:'1px solid '+(pickerTag===''?'var(--a)':'var(--b2)'), background:pickerTag===''?'var(--a-dim)':'var(--s3)', color:pickerTag===''?'var(--a-light)':'var(--t3)', cursor:'pointer', fontSize:'.62rem', fontWeight:600 },
                  onClick:function(){ setPickerTag(''); } }, 'Wszystkie'),
                (ET.MUSCLE_GROUPS||[]).map(function(g) {
                  var active = pickerTag===g.tag;
                  return _h('button', { key:g.tag, style:{ padding:'3px 8px', borderRadius:12, border:'1px solid '+(active?'var(--a)':'var(--b2)'), background:active?'var(--a-dim)':'var(--s3)', color:active?'var(--a-light)':'var(--t3)', cursor:'pointer', fontSize:'.62rem', fontWeight:600, whiteSpace:'nowrap' },
                    onClick:function(){ setPickerTag(active?'':g.tag); } }, g.icon+' '+g.label);
                })
              ),
              _h('div', { style:{ maxHeight:200, overflowY:'auto' } },
                (function() {
                  var q = pickerQ.trim().toLowerCase();
                  var list = (ET.EXERCISES_BASIC||[]).filter(function(e) {
                    if (pickerTag && (e.tags||[])[0]!==pickerTag) return false;
                    return !q || e.name.toLowerCase().indexOf(q)!==-1;
                  }).slice(0, 40);
                  if (!list.length) return _h('div', { style:{ fontSize:'.72rem', color:'var(--t3)', padding:6 } }, 'Brak wyników');
                  return list.map(function(dbEx) {
                    var grp = (ET.MUSCLE_GROUPS||[]).find(function(g){ return (dbEx.tags||[])[0]===g.tag; });
                    return _h('div', { key:dbEx.id,
                      style:{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'7px 8px', borderBottom:'1px solid var(--b1)', cursor:'pointer', borderRadius:4 },
                      onClick:function(){ pickExercise(i, dbEx); } },
                      _h('div', null,
                        _h('div', { style:{ fontSize:'.78rem', fontWeight:600 } }, dbEx.name),
                        _h('div', { style:{ fontSize:'.62rem', color:'var(--t3)' } },
                          (grp?grp.label:'')+(dbEx.isCompound?' · wielostawowe':' · izolowane'))
                      ),
                      _h('span', { style:{ fontSize:'.9rem' } }, grp?grp.icon:'🏋️')
                    );
                  });
                })()
              )
            ),
            _h('div', { style:{ display:'flex', gap:6, alignItems:'center', flexWrap:'wrap', marginBottom:8 } },
              _h('div', { style:{ display:'flex', alignItems:'center', gap:4 } },
                _h('button', { className:'btn btn-ghost btn-sm btn-icon', onClick:function(){ rmSet(i); } }, '−'),
                _h('span', { style:{ fontWeight:700, minWidth:20, textAlign:'center', fontSize:'.95rem' } }, ex.sets||1),
                _h('button', { className:'btn btn-ghost btn-sm btn-icon', onClick:function(){ addSet(i); } }, '+'),
                _h('span', { style:{ fontSize:'.65rem', color:'var(--t3)' } }, 'serie')
              ),
              _h('span', { style:{ color:'var(--b2)', fontWeight:700 } }, '×'),
              _h('div', { style:{ flex:'0 0 75px' } },
                _h('label', { style:{ fontSize:'.6rem', color:'var(--t3)', display:'block', marginBottom:2 } }, 'Powt.'),
                _h('input', { type:'number', min:1, value:ex.reps||0, onChange:function(e){ upExercise(i,'reps',+e.target.value); } })
              ),
              _h('div', { style:{ flex:'0 0 85px' } },
                _h('label', { style:{ fontSize:'.6rem', color:'var(--t3)', display:'block', marginBottom:2 } }, 'Ciężar (kg)'),
                _h('input', { type:'number', min:0, step:2.5, value:ex.weight||0, onChange:function(e){ upExercise(i,'weight',+e.target.value); } })
              )
            ),
            _h('div', { style:{ display:'flex', gap:6, flexWrap:'wrap' } },
              _h('div', { style:{ flex:1, minWidth:70 } },
                _h('label', { style:{ fontSize:'.6rem', color:'var(--t3)', display:'block', marginBottom:2 } }, 'Przerwa (s)'),
                _h('input', { type:'number', min:0, step:15, value:ex.rest||90, onChange:function(e){ upExercise(i,'rest',+e.target.value); } })
              ),
              _h('div', { style:{ flex:1, minWidth:70 } },
                _h('label', { style:{ fontSize:'.6rem', color:'var(--t3)', display:'block', marginBottom:2 } }, 'Tempo'),
                _h('input', { type:'text', value:ex.tempo||'', placeholder:'3-1-1', onChange:function(e){ upExercise(i,'tempo',e.target.value); } })
              ),
              _h('div', { style:{ flex:'0 0 auto' } },
                _h('label', { style:{ fontSize:'.6rem', color:'var(--t3)', display:'block', marginBottom:2 } }, 'RIR'),
                _h(RirPicker, { value:ex.rir!=null?ex.rir:2, onChange:function(v){ upExercise(i,'rir',v); } })
              ),
              _h('div', { style:{ flex:2, minWidth:100 } },
                _h('label', { style:{ fontSize:'.6rem', color:'var(--t3)', display:'block', marginBottom:2 } }, 'Progresja'),
                _h('input', { type:'text', value:ex.prog||'', placeholder:'+2.5 kg/tydz', onChange:function(e){ upExercise(i,'prog',e.target.value); } })
              )
            )
          );
        })
      )
    );
  }

  // ── JEDNOSTKA BIEGOWA — edytor ───────────────────────────────────────────
  var RUN_TYPES = [
    { id:'easy',     label:'🐢 Spokojny',    desc:'Zone 2, regeneracyjny' },
    { id:'tempo',    label:'⚡ Tempo',        desc:'Zone 3-4, próg mleczanowy' },
    { id:'interval', label:'🔥 Interwały',   desc:'Zone 4-5, prędkość' },
    { id:'long',     label:'🛣️ Długi',       desc:'Zone 2, wytrzymałość' },
    { id:'fartlek',  label:'🎲 Fartlek',     desc:'Mieszany, zabawa tempem' },
  ];

  function RunUnitEditView(props) {
    var unit = props.unit;
    var us = React.useState(JSON.parse(JSON.stringify(unit)));
    var editing = us[0], setEditing = us[1];
    function up(k,v) { setEditing(function(e){ var c=Object.assign({},e); c[k]=v; return c; }); }

    return _h('div', { className:'fade-in' },
      _h('div', { style:{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 } },
        _h('button', { className:'btn btn-ghost btn-sm btn-icon', onClick:props.onBack }, '←'),
        _h('button', { className:'btn btn-primary btn-sm', onClick:function(){ props.onSave(editing); } }, '✓ Zapisz')
      ),
      _h('div', { className:'card', style:{ marginBottom:12 } },
        _h('div', { style:{ fontSize:'.65rem', fontWeight:700, color:'var(--t3)', textTransform:'uppercase', marginBottom:8 } }, 'Informacje'),
        _h('div', { style:{ display:'flex', gap:8, marginBottom:8 } },
          _h('div', { style:{ flex:1 } },
            _h('label', { style:{ fontSize:'.6rem', color:'var(--t3)', display:'block', marginBottom:2 } }, 'Nazwa'),
            _h('input', { type:'text', value:editing.name||'', style:{ width:'100%' }, onChange:function(e){ up('name',e.target.value); } })
          ),
          _h('div', { style:{ flex:1 } },
            _h('label', { style:{ fontSize:'.6rem', color:'var(--t3)', display:'block', marginBottom:2 } }, 'Dzień'),
            _h('input', { type:'text', value:editing.day||'', placeholder:'np. Wtorek', style:{ width:'100%' }, onChange:function(e){ up('day',e.target.value); } })
          )
        )
      ),
      _h('div', { className:'card', style:{ marginBottom:12 } },
        _h('div', { style:{ fontSize:'.65rem', fontWeight:700, color:'var(--t3)', textTransform:'uppercase', marginBottom:8 } }, 'Typ biegu'),
        _h('div', { style:{ display:'flex', gap:6, flexWrap:'wrap' } },
          RUN_TYPES.map(function(rt) {
            var active = editing.runType === rt.id;
            return _h('button', { key:rt.id, style:{
              padding:'8px 12px', borderRadius:'var(--r2)', border:'1px solid '+(active?'var(--green)':'var(--b2)'),
              background:active?'rgba(34,197,94,.12)':'var(--s3)', color:active?'var(--green)':'var(--t2)',
              cursor:'pointer', fontSize:'.72rem', fontWeight:600, textAlign:'left', flex:'1 1 45%', minWidth:130
            }, onClick:function(){ up('runType',rt.id); } },
              _h('div', null, rt.label),
              _h('div', { style:{ fontSize:'.6rem', color:'var(--t3)', marginTop:2 } }, rt.desc)
            );
          })
        )
      ),
      _h('div', { className:'card', style:{ marginBottom:12 } },
        _h('div', { style:{ fontSize:'.65rem', fontWeight:700, color:'var(--t3)', textTransform:'uppercase', marginBottom:8 } }, 'Parametry'),
        _h('div', { style:{ display:'flex', gap:8, flexWrap:'wrap' } },
          _h('div', { style:{ flex:'1 1 100px' } },
            _h('label', { style:{ fontSize:'.6rem', color:'var(--t3)', display:'block', marginBottom:2 } }, 'Dystans (km)'),
            _h('input', { type:'number', min:0, step:0.5, value:editing.distance||0, style:{ width:'100%' }, onChange:function(e){ up('distance',+e.target.value); } })
          ),
          _h('div', { style:{ flex:'1 1 100px' } },
            _h('label', { style:{ fontSize:'.6rem', color:'var(--t3)', display:'block', marginBottom:2 } }, 'Czas (min)'),
            _h('input', { type:'number', min:0, value:editing.duration||0, style:{ width:'100%' }, onChange:function(e){ up('duration',+e.target.value); } })
          ),
          _h('div', { style:{ flex:'1 1 100px' } },
            _h('label', { style:{ fontSize:'.6rem', color:'var(--t3)', display:'block', marginBottom:2 } }, 'Tempo (min/km)'),
            _h('input', { type:'text', value:editing.pace||'', placeholder:'5:30', style:{ width:'100%' }, onChange:function(e){ up('pace',e.target.value); } })
          )
        ),
        editing.runType === 'interval' && _h('div', { style:{ marginTop:8, display:'flex', gap:8 } },
          _h('div', { style:{ flex:1 } },
            _h('label', { style:{ fontSize:'.6rem', color:'var(--t3)', display:'block', marginBottom:2 } }, 'Powtórzenia'),
            _h('input', { type:'number', min:1, value:editing.intervalReps||6, style:{ width:'100%' }, onChange:function(e){ up('intervalReps',+e.target.value); } })
          ),
          _h('div', { style:{ flex:1 } },
            _h('label', { style:{ fontSize:'.6rem', color:'var(--t3)', display:'block', marginBottom:2 } }, 'Odcinek (m)'),
            _h('input', { type:'number', min:100, step:100, value:editing.intervalDist||400, style:{ width:'100%' }, onChange:function(e){ up('intervalDist',+e.target.value); } })
          ),
          _h('div', { style:{ flex:1 } },
            _h('label', { style:{ fontSize:'.6rem', color:'var(--t3)', display:'block', marginBottom:2 } }, 'Przerwa (s)'),
            _h('input', { type:'number', min:0, step:15, value:editing.intervalRest||90, style:{ width:'100%' }, onChange:function(e){ up('intervalRest',+e.target.value); } })
          )
        )
      ),
      _h('div', { className:'card' },
        _h('label', { style:{ fontSize:'.6rem', color:'var(--t3)', display:'block', marginBottom:2 } }, 'Notatki'),
        _h('textarea', { rows:2, value:editing.notes||'', placeholder:'np. bieg w parku, nawodnienie...', style:{ width:'100%', resize:'vertical' },
          onChange:function(e){ up('notes',e.target.value); } })
      ),
      props.onDelete && _h('button', { className:'btn btn-danger', style:{ width:'100%', marginTop:12 }, onClick:props.onDelete }, '🗑️ Usuń jednostkę')
    );
  }

  // ── META-PLANY: grupowanie jednostek treningowych ─────────────────────────
  function getMetaPlans(store) {
    var saved = store.trainingPlans || [];
    if (saved.length) return saved;
    var units = getEffectivePlans(store).map(function(p) {
      return Object.assign({}, p, { unitType:'strength' });
    });
    return [{ id:'default_plan', name:'Mój plan treningowy', icon:'📋', units:units }];
  }

  function saveMetaPlans(update, plans) {
    update(function(s) { return Object.assign({}, s, { trainingPlans: plans }); });
  }

  // ── EDYTOR PLANÓW (3 poziomy: plany → jednostki → edycja) ──────────────────
  function PlanEditorSheet(props) {
    var su = ET.useStore(); var store = su.store, update = su.update;
    var toast = ET.useToast();
    var ms = React.useState(null); var selMeta = ms[0], setSelMeta = ms[1];
    var us = React.useState(null); var selUnit = us[0], setSelUnit = us[1];
    var sg = React.useState(null); var selSeg = sg[0], setSelSeg = sg[1];

    var metaPlans = getMetaPlans(store);

    // Segmenty: etapy planu (np. kolejne 12 tygodni); jednostki bez segmentId → pierwszy
    function segsOf(mp) {
      return (mp.segments && mp.segments.length) ? mp.segments : [{ id:'seg_default', name:'Segment 1' }];
    }
    function currentSegId() {
      if (!selMeta) return null;
      var segs = segsOf(selMeta);
      return segs.some(function(s){ return s.id===selSeg; }) ? selSeg : segs[segs.length-1].id;
    }
    function renameSegment(segId) {
      var mp = JSON.parse(JSON.stringify(selMeta));
      var segs = segsOf(mp);
      var seg = segs.find(function(s){ return s.id===segId; });
      var name = prompt('Nowa nazwa segmentu', seg ? seg.name : '');
      if (!name || !seg) return;
      seg.name = name;
      mp.segments = segs;
      saveMetaPlan(mp); setSelMeta(mp);
      toast('Nazwa segmentu zmieniona ✓','success');
    }
    function addSegment() {
      var mp = JSON.parse(JSON.stringify(selMeta));
      var segs = segsOf(mp);
      var name = prompt('Nazwa nowego segmentu (np. "Tygodnie 13-24")', 'Segment '+(segs.length+1));
      if (!name) return;
      var seg = { id:'seg_'+Date.now(), name:name, createdAt:ET.dstr() };
      mp.segments = segs.concat([seg]);
      saveMetaPlan(mp); setSelMeta(mp); setSelSeg(seg.id);
      toast('Nowy segment utworzony — poprzednie jednostki zostają w historii','success');
    }

    function saveMetaPlan(metaPlan) {
      var updated = metaPlans.map(function(m){ return m.id===metaPlan.id ? metaPlan : m; });
      if (!metaPlans.find(function(m){ return m.id===metaPlan.id; })) updated = metaPlans.concat([metaPlan]);
      saveMetaPlans(update, updated);

      metaPlan.units.forEach(function(unit) {
        if (unit.unitType !== 'strength') return;
        if (unit._isCustom) {
          update(function(s){
            var list = (s.customWorkoutPlans||[]);
            var exists = list.find(function(p){ return p.id===unit.id; });
            return Object.assign({},s,{ customWorkoutPlans: exists ? list.map(function(p){ return p.id===unit.id?unit:p; }) : list.concat([unit]) });
          });
        } else {
          update(function(s){
            var ov = Object.assign({},s.workoutPlans||{}); ov[unit.id]=unit;
            return Object.assign({},s,{ workoutPlans:ov });
          });
        }
      });
    }

    function saveUnit(unit) {
      var mp = JSON.parse(JSON.stringify(selMeta));
      var idx = mp.units.findIndex(function(u){ return u.id===unit.id; });
      if (idx>=0) mp.units[idx] = unit; else mp.units.push(unit);
      saveMetaPlan(mp);
      setSelMeta(mp);
      toast('Jednostka zapisana ✓','success');
      setSelUnit(null);
    }

    function deleteUnit(unitId) {
      if (!confirm('Usunąć tę jednostkę?')) return;
      var mp = JSON.parse(JSON.stringify(selMeta));
      mp.units = mp.units.filter(function(u){ return u.id!==unitId; });
      saveMetaPlan(mp);
      setSelMeta(mp);
      toast('Jednostka usunięta','default');
      setSelUnit(null);
    }

    function addNewMeta() {
      var mp = { id:'plan_'+Date.now(), name:'Nowy plan', icon:'📋', units:[], goal:null, segments:[{ id:'seg_'+Date.now(), name:'Segment 1', createdAt:ET.dstr() }] };
      var updated = metaPlans.concat([mp]);
      saveMetaPlans(update, updated);
      setSelMeta(mp);
    }

    function deleteMetaPlan(planId) {
      if (!confirm('Usunąć cały plan?')) return;
      saveMetaPlans(update, metaPlans.filter(function(m){ return m.id!==planId; }));
      toast('Plan usunięty','default');
      setSelMeta(null);
    }

    function addStrengthUnit() {
      var unit = { id:'unit_'+Date.now(), unitType:'strength', _isCustom:true, segmentId:currentSegId(), createdAt:new Date().toISOString(), name:'Nowy trening', icon:'🏋️', day:'', desc:'', color:'var(--a)', badge:'badge-blue', warmup:[], exercises:[], cooldown:[] };
      setSelUnit(unit);
    }

    function addRunUnit() {
      var unit = { id:'rununit_'+Date.now(), unitType:'running', segmentId:currentSegId(), createdAt:new Date().toISOString(), name:'Bieg', day:'', runType:'easy', distance:5, duration:30, pace:'6:00', notes:'' };
      setSelUnit(unit);
    }

    function importCSV(e) {
      var file = e.target.files[0]; if (!file) return;
      var reader = new FileReader();
      reader.onload = function(ev) {
        var lines = ev.target.result.split('\n').map(function(l){ return l.replace(/\r/,''); });
        var warmup=[], exercises=[], cooldown=[];
        var planName = file.name.replace(/\.[^.]+$/,'');
        lines.slice(1).forEach(function(line) {
          if (!line.trim()) return;
          var cols = line.split(',').map(function(c){ return c.trim().replace(/^"|"$/g,''); });
          var type=(cols[0]||'').toLowerCase(), name=cols[1]||'';
          if (!name) return;
          if (type==='warmup'||type==='rozgrzewka') {
            warmup.push({ n:name, s:+cols[2]||1, r:+cols[3]||0, note:cols[7]||'' });
          } else if (type==='exercise'||type==='cwiczenie'||type==='ćwiczenie'||type==='ex') {
            exercises.push({ name:name, plan:(+cols[2]||3)+'×'+(+cols[3]||10), sets:+cols[2]||3, reps:+cols[3]||10, weight:+cols[4]||0, rest:+cols[5]||90, tempo:cols[6]||'kontrola', rir:+cols[7]!==undefined?+cols[7]:2, prog:cols[8]||'' });
          } else if (type==='cooldown'||type==='rozciąganie'||type==='rozciaganie') {
            cooldown.push({ n:name, d:cols[7]||'' });
          }
        });
        var imported = { id:'unit_'+Date.now(), unitType:'strength', _isCustom:true, segmentId:currentSegId(), createdAt:new Date().toISOString(), name:planName, icon:'📋', day:'Import', desc:exercises.length+' ćwiczeń', color:'var(--teal)', badge:'badge-teal', warmup:warmup, exercises:exercises, cooldown:cooldown };
        setSelUnit(imported);
        toast('Wczytano plik — sprawdź i zapisz','success');
      };
      reader.readAsText(file, 'UTF-8');
      e.target.value='';
    }

    function rangeSummary(p) {
      if (!p.ranges || !p.ranges.length || p.ranges[0].startWeek==null) return null;
      var deloads = p.ranges.filter(function(r){ return r.mode==='deload'; }).length;
      var last = p.ranges[p.ranges.length-1];
      return (last.endWeek||12)+' tyg.'+(deloads?' · '+deloads+'× deload':'');
    }

    // ── Poziom 3: edycja konkretnej jednostki ──
    if (selUnit) {
      if (selUnit.unitType === 'running') {
        return _h(RunUnitEditView, {
          unit: selUnit,
          onBack: function(){ setSelUnit(null); },
          onSave: saveUnit,
          onDelete: selMeta && selMeta.units.find(function(u){ return u.id===selUnit.id; }) ? function(){ deleteUnit(selUnit.id); } : null
        });
      }
      return _h(PlanEditView, {
        plan: selUnit,
        onBack: function(){ setSelUnit(null); },
        onSave: saveUnit,
        onReset: null,
        onDelete: selMeta && selMeta.units.find(function(u){ return u.id===selUnit.id; }) ? function(){ deleteUnit(selUnit.id); } : null
      });
    }

    // ── Poziom 2: jednostki w planie ──
    if (selMeta) {
      var segs = segsOf(selMeta);
      var activeSegId = currentSegId();
      var segUnits = selMeta.units.filter(function(u){ return (u.segmentId||segs[0].id)===activeSegId; });
      var strUnits = segUnits.filter(function(u){ return u.unitType!=='running'; });
      var runUnits = segUnits.filter(function(u){ return u.unitType==='running'; });
      return _h('div', { className:'fade-in' },
        _h('div', { className:'page-hdr' },
          _h('div', { style:{ display:'flex', alignItems:'center', gap:10 } },
            _h('button', { className:'btn btn-ghost btn-sm btn-icon', onClick:function(){ setSelMeta(null); } }, '←'),
            _h('div', null,
              _h('h1', null, selMeta.icon+' '+selMeta.name),
              _h('p', null, selMeta.units.length+' jednostek treningowych')
            )
          ),
          _h('div', { style:{ display:'flex', gap:6, flexWrap:'wrap' } },
            _h('button', { className:'btn btn-primary', style:{ fontSize:'.72rem', padding:'7px 10px' }, onClick:addStrengthUnit }, '💪 + Siłowy'),
            _h('button', { className:'btn btn-secondary', style:{ fontSize:'.72rem', padding:'7px 10px' }, onClick:addRunUnit }, '🏃 + Biegowy'),
            _h('label', { className:'btn btn-ghost', style:{ fontSize:'.72rem', padding:'7px 10px', cursor:'pointer' } },
              '📥 CSV',
              _h('input', { type:'file', accept:'.csv,.txt', style:{ display:'none' }, onChange:importCSV })
            )
          )
        ),

        _h('div', { style:{ display:'flex', gap:6, marginBottom:12 } },
          _h('input', { type:'text', placeholder:'Nazwa planu', value:selMeta.name, style:{ flex:1 },
            onChange:function(e) {
              var mp = Object.assign({}, selMeta, { name:e.target.value });
              setSelMeta(mp);
              saveMetaPlan(mp);
            }
          })
        ),

        // Cel planu — wpływa na auto-podstawianie parametrów przy zamianie/dodawaniu ćwiczeń
        _h('div', { className:'card', style:{ marginBottom:12 } },
          _h('div', { style:{ fontSize:'.65rem', fontWeight:700, color:'var(--t3)', textTransform:'uppercase', letterSpacing:'.06em', marginBottom:8 } }, '🎯 Cel planu'),
          _h('div', { style:{ display:'flex', gap:6, flexWrap:'wrap' } },
            META_GOALS.map(function(g){
              var act = selMeta.goal===g.id;
              return _h('button', { key:g.id, className:'btn btn-sm '+(act?'btn-primary':'btn-ghost'), style:{ fontSize:'.72rem' },
                onClick:function(){
                  var mp = Object.assign({}, selMeta, { goal: act?null:g.id });
                  setSelMeta(mp); saveMetaPlan(mp);
                } }, g.label);
            })
          ),
          selMeta.goal && _h('div', { style:{ fontSize:'.68rem', color:'var(--t3)', marginTop:8, lineHeight:1.5 } },
            '💡 Przy zamianie lub dodaniu ćwiczenia w aktywnym treningu serie, powtórzenia, RIR, przerwa i ciężar podstawią się automatycznie pod ten cel.')
        ),

        // Segmenty planu — etapy (np. kolejne 12 tygodni); historia poprzednich zostaje
        _h('div', { style:{ display:'flex', gap:6, flexWrap:'wrap', alignItems:'center', marginBottom:12 } },
          _h('span', { style:{ fontSize:'.65rem', fontWeight:700, color:'var(--t3)', textTransform:'uppercase', letterSpacing:'.06em' } }, '📆 Segment:'),
          segs.map(function(s){
            var act = s.id===activeSegId;
            // klik: wybór segmentu; klik w aktywny: zmiana nazwy
            return _h('button', { key:s.id, className:'chip', title:act?'Kliknij, by zmienić nazwę':'', style:{ cursor:'pointer', fontSize:'.68rem', border:'1px solid '+(act?'var(--a)':'var(--b1)'), background:act?'var(--a-dim)':'var(--s3)', color:act?'var(--a-light)':'var(--t2)' }, onClick:function(){ act ? renameSegment(s.id) : setSelSeg(s.id); } }, s.name+(act?' ✏️':''));
          }),
          _h('button', { className:'chip', style:{ cursor:'pointer', fontSize:'.68rem', border:'1px dashed var(--b1)', background:'transparent', color:'var(--t3)' }, onClick:addSegment }, '+ Segment')
        ),

        // Bieżący tydzień planu (tydzień = każda jednostka siłowa wykonana min. 1×)
        (function(){
          var wi = planWeekInfo(store, segUnits);
          if (!wi) return null;
          return _h('div', { className:'card card-accent', style:{ marginBottom:12, display:'flex', alignItems:'center', gap:10 } },
            _h('span', { style:{ fontSize:'1.2rem' } }, '📅'),
            _h('div', null,
              _h('div', { style:{ fontWeight:700, fontSize:'.85rem' } }, 'Tydzień '+wi.currentWeek+' planu'),
              _h('div', { style:{ fontSize:'.68rem', color:'var(--t3)', marginTop:2 } },
                wi.completedWeeks+' tyg. ukończonych — tydzień zalicza się po wykonaniu każdej jednostki siłowej')
            )
          );
        })(),

        // Periodyzacja SEGMENTU — jedno miejsce ustawień, obowiązuje dla wszystkich
        // jednostek w aktywnym segmencie (panel przeniesiony z edytora jednostki).
        (function(){
          var activeSeg = segs.find(function(s){ return s.id===activeSegId; }) || segs[0];
          return _h(RangesEditor, {
            ranges: (activeSeg.ranges && activeSeg.ranges.length) ? activeSeg.ranges : defaultRanges(),
            title:'📆 Periodyzacja segmentu „'+(activeSeg.name||'Segment 1')+'”',
            hint:'💡 Obowiązuje dla wszystkich jednostek w tym segmencie. Przesuwaj granice ◀▶, ustaw tryb i deload dla każdego bloku.',
            onChange:function(rs){
              var mp = JSON.parse(JSON.stringify(selMeta));
              mp.segments = segsOf(mp);
              var seg = mp.segments.find(function(s){ return s.id===activeSegId; }) || mp.segments[0];
              seg.ranges = rs;
              setSelMeta(mp); saveMetaPlan(mp);
            }
          });
        })(),

        strUnits.length > 0 && _h('div', { style:{ marginBottom:16 } },
          _h('div', { style:{ fontSize:'.65rem', fontWeight:700, color:'var(--t3)', textTransform:'uppercase', letterSpacing:'.08em', marginBottom:8 } }, '💪 Treningi siłowe ('+strUnits.length+')'),
          strUnits.map(function(p) {
            var summ = null; // periodyzacja jest teraz per segment, nie per jednostka
            return _h('div', { key:p.id, className:'card card-interactive',
              style:{ cursor:'pointer', marginBottom:8, borderLeft:'3px solid '+(p.color||'var(--a)') },
              onClick:function(){ setSelUnit(JSON.parse(JSON.stringify(p))); }
            },
              _h('div', { style:{ display:'flex', alignItems:'center', gap:10 } },
                _h('div', { style:{ width:36, height:36, borderRadius:'var(--r2)', background:'var(--s3)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.2rem', flexShrink:0 } }, p.icon||'🏋️'),
                _h('div', { style:{ flex:1, minWidth:0 } },
                  _h('div', { style:{ fontWeight:700, fontSize:'.85rem', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' } }, p.name),
                  _h('div', { style:{ fontSize:'.62rem', color:'var(--t3)', marginTop:2 } },
                    (p.day?p.day+' · ':'')+((p.exercises||[]).length)+' ćwiczeń'+(summ?' · '+summ:''))
                ),
                _h('span', { style:{ color:'var(--t3)', fontSize:'1.2rem' } }, '›')
              )
            );
          })
        ),

        runUnits.length > 0 && _h('div', { style:{ marginBottom:16 } },
          _h('div', { style:{ fontSize:'.65rem', fontWeight:700, color:'var(--t3)', textTransform:'uppercase', letterSpacing:'.08em', marginBottom:8 } }, '🏃 Treningi biegowe ('+runUnits.length+')'),
          runUnits.map(function(r) {
            var rtDef = RUN_TYPES.find(function(t){ return t.id===r.runType; });
            return _h('div', { key:r.id, className:'card card-interactive',
              style:{ cursor:'pointer', marginBottom:8, borderLeft:'3px solid var(--green)' },
              onClick:function(){ setSelUnit(JSON.parse(JSON.stringify(r))); }
            },
              _h('div', { style:{ display:'flex', alignItems:'center', gap:10 } },
                _h('div', { style:{ width:36, height:36, borderRadius:'var(--r2)', background:'rgba(34,197,94,.1)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.2rem', flexShrink:0 } }, '🏃'),
                _h('div', { style:{ flex:1, minWidth:0 } },
                  _h('div', { style:{ fontWeight:700, fontSize:'.85rem' } }, r.name||'Bieg'),
                  _h('div', { style:{ fontSize:'.62rem', color:'var(--t3)', marginTop:2 } },
                    (r.day?r.day+' · ':'')+(rtDef?rtDef.label+' · ':'')+(r.distance?r.distance+' km':'')+(r.pace?' · '+r.pace+'/km':''))
                ),
                _h('span', { style:{ color:'var(--t3)', fontSize:'1.2rem' } }, '›')
              )
            );
          })
        ),

        segUnits.length === 0 && _h('div', { className:'card', style:{ textAlign:'center', padding:'30px 16px', color:'var(--t3)' } },
          _h('div', { style:{ fontSize:'2rem', marginBottom:8 } }, '📋'),
          _h('div', { style:{ fontSize:'.82rem' } }, 'Brak jednostek w tym segmencie — dodaj trening siłowy lub biegowy')
        ),

        // Kafelek Podsumowanie — serie / tydzień na grupę mięśniową (aktywny segment)
        (function(){
          var acc = weeklyMuscleSets(segUnits);
          var rows = ET.MUSCLE_GROUPS.filter(function(g){ return acc[g.tag]>0; });
          if (!rows.length) return null;
          var segName = (segs.find(function(s){ return s.id===activeSegId; })||{}).name||'';
          return _h('div', { className:'card', style:{ marginTop:4, marginBottom:12 } },
            _h('div', { style:{ fontWeight:700, marginBottom:4, fontSize:'.88rem' } }, '📊 Podsumowanie — serie / tydzień'),
            _h('div', { style:{ fontSize:'.65rem', color:'var(--t3)', marginBottom:10 } },
              'Segment: '+segName+' · ćwiczenia wielostawowe rozdzielają serie między zaangażowane mięśnie'),
            _h('div', { style:{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(150px,1fr))', gap:6 } },
              rows.map(function(g){
                var v = Math.round(acc[g.tag]*10)/10;
                var col = v>=10 ? 'var(--green)' : v>=4 ? 'var(--a-light)' : 'var(--yellow)';
                return _h('div', { key:g.tag, style:{ display:'flex', alignItems:'center', gap:8, padding:'8px 10px', borderRadius:'var(--r2)', background:'var(--s3)', border:'1px solid var(--b1)' } },
                  _h('span', null, g.icon),
                  _h('div', { style:{ flex:1, fontSize:'.7rem', fontWeight:600 } }, g.label),
                  _h('span', { style:{ fontWeight:700, fontSize:'.8rem', color:col } }, v)
                );
              })
            ),
            _h('div', { style:{ fontSize:'.62rem', color:'var(--t3)', marginTop:8 } },
              '🟡 <4 mało · 🔵 4-9 OK · 🟢 10+ optimum hipertrofii (10-20 serii/tydz. na mięsień)')
          );
        })(),

        // Licznik MAKSYMALNEJ liczby serii / tydzień — ważony intensywnością
        // (ciężkie 5×5 męczy bardziej niż 5×10; limit ~20 ważonych serii/mięsień)
        (function(){
          var ws = weeklyWeightedSets(segUnits);
          var rows = ET.MUSCLE_GROUPS.filter(function(g){ return ws.perGroup[g.tag] > 0; });
          if (!rows.length) return null;
          var over = rows.filter(function(g){ return ws.perGroup[g.tag] > WEIGHTED_SETS_MAX; });
          return _h('div', { className:'card', style:{ marginBottom:12, borderLeft:'3px solid '+(over.length?'var(--red)':'var(--teal)') } },
            _h('div', { style:{ display:'flex', alignItems:'center', gap:10, marginBottom:4 } },
              _h('div', { style:{ fontWeight:700, fontSize:'.88rem', flex:1 } }, '🔋 Maks. serie / tydzień (ważone)'),
              _h('div', { style:{ fontSize:'1.2rem', fontWeight:800, color:over.length?'var(--red)':'var(--teal)' } },
                Math.round(ws.total*10)/10)
            ),
            _h('div', { style:{ fontSize:'.65rem', color:'var(--t3)', marginBottom:10 } },
              'Moc serii wg powtórzeń: ≤6 powt. ×1,5 · 7-9 ×1,2 · 10-12 ×1,0 · 13+ ×0,8 · limit '+WEIGHTED_SETS_MAX+'/mięsień'),
            rows.map(function(g){
              var v = Math.round(ws.perGroup[g.tag]*10)/10;
              var pct = Math.min(100, v/WEIGHTED_SETS_MAX*100);
              var col = v > WEIGHTED_SETS_MAX ? 'var(--red)' : v >= 14 ? 'var(--orange)' : 'var(--teal)';
              return _h('div', { key:g.tag, style:{ display:'flex', alignItems:'center', gap:8, marginBottom:5 } },
                _h('div', { style:{ width:120, fontSize:'.68rem', color:'var(--t2)', flexShrink:0 } }, g.icon+' '+g.label),
                _h('div', { style:{ flex:1, height:7, borderRadius:4, background:'var(--s3)', overflow:'hidden' } },
                  _h('div', { style:{ width:pct+'%', height:'100%', borderRadius:4, background:col } })
                ),
                _h('div', { style:{ width:58, fontSize:'.66rem', textAlign:'right', flexShrink:0, fontWeight:700, color:col } },
                  v+' / '+WEIGHTED_SETS_MAX)
              );
            }),
            over.length > 0 && _h('div', { style:{ fontSize:'.65rem', color:'var(--red)', marginTop:6, fontWeight:600 } },
              '⚠ Przekroczony limit: '+over.map(function(g){ return g.label; }).join(', ')+' — rozważ mniej serii lub lżejsze zakresy powtórzeń.')
          );
        })(),

        _h('button', { className:'btn btn-danger btn-sm', style:{ marginTop:16 }, onClick:function(){ deleteMetaPlan(selMeta.id); } }, '🗑️ Usuń cały plan')
      );
    }

    // ── Poziom 1: lista meta-planów ──
    return _h('div', { className:'fade-in' },
      _h('div', { className:'page-hdr' },
        _h('div', { style:{ display:'flex', alignItems:'center', gap:10 } },
          _h('button', { className:'btn btn-ghost btn-sm btn-icon', onClick:props.onClose }, '←'),
          _h('div', null,
            _h('h1', null, '📋 Edytor planów'),
            _h('p', null, metaPlans.length+' '+(metaPlans.length===1?'plan treningowy':'planów treningowych'))
          )
        ),
        _h('button', { className:'btn btn-primary', style:{ fontSize:'.75rem', padding:'8px 12px' }, onClick:addNewMeta }, '+ Nowy plan')
      ),

      metaPlans.map(function(mp) {
        var strCount = mp.units.filter(function(u){ return u.unitType!=='running'; }).length;
        var runCount = mp.units.filter(function(u){ return u.unitType==='running'; }).length;
        var parts = [];
        if (strCount) parts.push('💪 '+strCount+' siłow'+(strCount===1?'y':'ych'));
        if (runCount) parts.push('🏃 '+runCount+' biegow'+(runCount===1?'y':'ych'));

        return _h('div', { key:mp.id, className:'card card-interactive',
          style:{ cursor:'pointer', marginBottom:10, borderLeft:'3px solid var(--a)' },
          onClick:function(){ setSelMeta(JSON.parse(JSON.stringify(mp))); }
        },
          _h('div', { style:{ display:'flex', alignItems:'center', gap:12 } },
            _h('div', { style:{ width:48, height:48, borderRadius:'var(--r3)', background:'var(--s3)', border:'1px solid var(--b1)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.5rem', flexShrink:0 } }, mp.icon||'📋'),
            _h('div', { style:{ flex:1, minWidth:0 } },
              _h('div', { style:{ fontWeight:700, fontSize:'.95rem' } }, mp.name),
              _h('div', { style:{ fontSize:'.68rem', color:'var(--t3)', marginTop:3 } },
                parts.length ? parts.join(' · ') : 'Pusty plan — dotknij by dodać jednostki')
            ),
            _h('span', { style:{ color:'var(--t3)', fontSize:'1.3rem' } }, '›')
          )
        );
      }),

      metaPlans.length === 0 && _h('div', { className:'card', style:{ textAlign:'center', padding:'40px 16px', color:'var(--t3)' } },
        _h('div', { style:{ fontSize:'2.5rem', marginBottom:12 } }, '📋'),
        _h('div', { style:{ fontSize:'.88rem', marginBottom:6 } }, 'Brak planów treningowych'),
        _h('div', { style:{ fontSize:'.72rem' } }, 'Utwórz nowy plan i dodaj jednostki siłowe lub biegowe')
      )
    );
  }

  // ── GŁÓWNY MODUŁ ─────────────────────────────────────────────────────────
  function StrengthModule() {
    var su = ET.useStore(); var store = su.store;
    var nav = ET.useNav(); var initPlan = nav.params && nav.params.plan || null;
    var vs = React.useState(initPlan ? 'wellbeing_pre' : 'list'); var view = vs[0], setView = vs[1];
    var ps = React.useState(initPlan); var plan = ps[0], setPlan = ps[1];
    var rs = React.useState({ willingness:2, state:2, fatigue:2 }); var readiness = rs[0], setReadiness = rs[1];
    var res = React.useState(null); var result = res[0], setResult = res[1];
    var sp = React.useState(false); var showPicker = sp[0], setShowPicker = sp[1];
    var wb = React.useState(null); var postWb = wb[0], setPostWb = wb[1];
    var ew = React.useState(null); var editW = ew[0], setEditW = ew[1];
    var ma = React.useState(false); var showManualAdd = ma[0], setShowManualAdd = ma[1];
    var se = React.useState(false); var showEditor = se[0], setShowEditor = se[1];

    if (view==='ai-coach') return _h(AICoachView, { onBack:function(){ setView('list'); } });
    if (showEditor) return _h(PlanEditorSheet, { onClose:function(){ setShowEditor(false); } });

    function selectPlan(p) {
      setPlan(p); setShowPicker(false);
      setReadiness({ willingness:2, state:2, fatigue:2 }); setPostWb(null);
      setView('wellbeing_pre');
    }

    if (view==='wellbeing_pre' && plan) return _h(WellbeingStep, {
      plan:plan, tag:'przed treningiem '+plan.name,
      title:'Samopoczucie przed treningiem', stepLabel:'Krok 1 z 6',
      saveLabel:'→ Dalej: Gotowość',
      onNext:function(){ setView('readiness'); }, onSkip:function(){ setView('readiness'); }
    });
    if (view==='readiness' && plan) return _h(ReadinessStep, { plan:plan, readiness:readiness, setReadiness:setReadiness,
      onNext:function(){ setView('warmup'); }, onBack:function(){ setView('wellbeing_pre'); } });
    if (view==='warmup' && plan) return _h(WarmupStep, { plan:plan,
      onNext:function(){ setView('session'); }, onBack:function(){ setView('readiness'); } });
    if (view==='session' && plan) return _h(StrengthSession, { plan:plan, readiness:readiness,
      onFinish:function(r){ setResult(r); setView('cooldown'); }, onBack:function(){ setView('warmup'); } });
    if (view==='cooldown' && plan) return _h(CooldownStep, { plan:plan, onNext:function(){ setView('goals_check'); } });
    if (view==='goals_check' && plan) return _h(GoalCheckStep, { plan:plan, onNext:function(){ setView('wellbeing_post'); } });
    if (view==='wellbeing_post' && plan) return _h(WellbeingStep, {
      plan:plan, tag:'po treningu '+plan.name,
      title:'Samopoczucie po treningu', stepLabel:'Krok 6 z 6',
      saveLabel:'→ Zobacz podsumowanie',
      onNext:function(wbVals){ setPostWb(wbVals); setView('summary'); }
    });
    if (view==='summary' && result) return _h(WorkoutSummary, { result:result, readiness:readiness, postWellbeing:postWb, store:store, onBack:function(){ setView('list'); setPlan(null); } });

    // LIST VIEW
    var workouts = store.workouts || [];
    var update = su.update;
    var toast = ET.useToast();
    var effectivePlans = getEffectivePlans(store);

    return _h('div', { className:'fade-in' },
      _h('div', { className:'page-hdr' },
        _h('div', null,
          _h('h1', null, '💪 Trening siłowy'),
          _h('p', null, workouts.length + ' sesji')
        ),
        _h('div', { style:{ display:'flex', gap:8, flexWrap:'wrap' } },
          _h('button', { className:'btn btn-ghost', style:{ fontSize:'.75rem', padding:'8px 12px' }, onClick:function(){ setShowEditor(true); } }, '✏️ Edytuj plany')
        )
      ),

      ET.ACWRAlert && _h(ET.ACWRAlert, null),

      // ── KAFELKI NARZĘDZI (prompt 1.1) ──────────────────────────────────
      (function() {
        var acwrD = (typeof ET.acwrData==='function') ? ET.acwrData(store) : null;
        var acwrReady = acwrD && acwrD.ready;
        var az = acwrReady ? acwrD.zone : null;
        function tile(icon, label, sub, onClick) {
          return _h('div', { key:label, className:'card card-interactive', style:{ cursor:'pointer', padding:'14px 12px', textAlign:'center' }, onClick:onClick },
            _h('div', { style:{ fontSize:'1.5rem', marginBottom:4 } }, icon),
            _h('div', { style:{ fontWeight:700, fontSize:'.82rem' } }, label),
            sub && _h('div', { style:{ fontSize:'.62rem', color:'var(--t3)', marginTop:2 } }, sub)
          );
        }
        return _h('div', { className:'grid-2', style:{ gap:8, marginBottom:16 } },
          tile('🤖', 'AI Coach', 'Analiza treningu', function(){ setView('ai-coach'); }),
          tile('🧩', 'Kreator Planu', 'Ułóż plan', function(){ nav.navigate('planner'); }),
          _h('div', { key:'acwr', className:'card card-interactive', style:{ cursor:'pointer', padding:'14px 12px', textAlign:'center' }, onClick:function(){ nav.navigate('acwr'); } },
            _h('div', { style:{ fontSize:'1.5rem', marginBottom:4 } }, '📈'),
            _h('div', { style:{ fontWeight:700, fontSize:'.82rem' } }, 'ACWR'),
            acwrReady
              ? _h('div', { style:{ marginTop:4 } },
                  _h('div', { style:{ fontSize:'1rem', fontWeight:800, color:az.color } }, (Math.round(acwrD.acwr*100)/100).toFixed(2).replace('.',',')),
                  _h('div', { style:{ height:5, borderRadius:3, marginTop:5, background:'linear-gradient(90deg, var(--a-light) 0 40%, var(--green) 40% 65%, var(--orange) 65% 75%, var(--red) 75% 100%)', position:'relative' } },
                    _h('div', { style:{ position:'absolute', left:'calc('+Math.max(0,Math.min(100,acwrD.acwr/2*100))+'% - 1.5px)', top:-1, width:3, height:7, background:'var(--t1)', borderRadius:1 } })
                  )
                )
              : _h('div', { style:{ fontSize:'.62rem', color:'var(--t3)', marginTop:2 } }, acwrD&&acwrD.hasData ? 'Zbieranie danych' : 'Brak danych')
          ),
          tile('▶', 'Nowy Trening', 'Rozpocznij', function(){ setShowPicker(true); })
        );
      })(),

      // ── ANALIZA CORE: objętość per partia z Workout Engine (Faza 1) ─────
      (function() {
        if (!window.etcore || !ETCore.latestAnalysis) return null;
        var a = ETCore.latestAnalysis(window.etcore);
        if (!a || !a.totalVolume) return null;
        var groups = Object.keys(a.perGroup||{}).map(function(g){ return { g:g, v:a.perGroup[g] }; })
          .sort(function(x,y){ return y.v-x.v; }).slice(0,4);
        var maxV = groups.length ? groups[0].v : 1;
        var groupLabel = function(g){ var m=(ET.MUSCLE_GROUPS||[]).find(function(x){return x.tag===g;}); return m?m.label:g; };
        return _h('div', { className:'card', style:{ marginBottom:16 } },
          _h('div', { style:{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 } },
            _h('div', { style:{ fontSize:'.65rem', color:'var(--t3)', fontWeight:700, textTransform:'uppercase', letterSpacing:'.08em' } }, '🧠 Analiza ostatniej sesji (core)'),
            _h('span', { style:{ fontSize:'.68rem', color:'var(--t3)' } }, (a.date?ET.fmtDateShort(a.date)+' · ':'')+a.setsDone+'/'+a.setsTotal+' serii')
          ),
          _h('div', { style:{ display:'flex', gap:14, alignItems:'baseline', marginBottom:10 } },
            _h('div', null,
              _h('span', { style:{ fontSize:'1.3rem', fontWeight:800, color:'var(--a-light)' } }, a.totalVolume.toLocaleString('pl-PL')),
              _h('span', { style:{ fontSize:'.68rem', color:'var(--t3)', marginLeft:4 } }, 'kg objętości')
            ),
            _h('span', { style:{ fontSize:'.72rem', color: a.completionPct>=90?'var(--green)':'var(--orange)', fontWeight:700 } }, a.completionPct+'% ukończenia'),
            a.avgRpe!=null && _h('span', { style:{ fontSize:'.72rem', color:'var(--purple)', fontWeight:700 } }, 'RPE '+a.avgRpe)
          ),
          groups.map(function(row) {
            return _h('div', { key:row.g, style:{ display:'flex', alignItems:'center', gap:8, marginBottom:4 } },
              _h('div', { style:{ width:110, fontSize:'.7rem', color:'var(--t2)', flexShrink:0 } }, groupLabel(row.g)),
              _h('div', { style:{ flex:1, height:8, borderRadius:4, background:'var(--s3)', overflow:'hidden' } },
                _h('div', { style:{ width:Math.max(4,(row.v/maxV*100))+'%', height:'100%', borderRadius:4, background:'var(--a)' } })
              ),
              _h('div', { style:{ width:64, fontSize:'.66rem', color:'var(--t3)', textAlign:'right', flexShrink:0 } }, row.v.toLocaleString('pl-PL')+' kg')
            );
          })
        );
      })(),

      // ── 1RM ESTIMATION ENGINE: wyniki per ćwiczenie ───────────────────────
      (function() {
        if (!window.etcore || !ETCore.latestOrm) return null;
        // Zbierz wszystkie ćwiczenia z ostatniego treningu
        var lastW = (store.workouts||[])[0];
        if (!lastW || !lastW.exercises) return null;
        var ormRows = (lastW.exercises||[]).map(function(ex) {
          return { name:ex.name, result: ETCore.latestOrm(window.etcore, ex.name) };
        }).filter(function(r){ return r.result && r.result.orm1rm > 0; });
        if (!ormRows.length) return null;

        return _h('div', { className:'card', style:{ marginBottom:16 } },
          _h('div', { style:{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 } },
            _h('div', { style:{ fontSize:'.65rem', color:'var(--t3)', fontWeight:700, textTransform:'uppercase', letterSpacing:'.08em' } }, '💪 Estymowany 1RM'),
            _h('span', { style:{ fontSize:'.65rem', color:'var(--t3)' } }, 'po ostatnim treningu')
          ),
          ormRows.map(function(row) {
            var r = row.result;
            var delta = r.deltaFromPrevious;
            var deltaEl = delta != null
              ? _h('span', { style:{ fontSize:'.72rem', fontWeight:700, color: delta>=0?'var(--green)':'var(--red)', marginLeft:6 } },
                  (delta>=0?'+':'')+delta.toFixed(1)+' kg')
              : null;
            var confColor = r.confidence >= 70 ? 'var(--green)' : r.confidence >= 40 ? 'var(--orange)' : 'var(--red)';
            return _h('div', { key:row.name, style:{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'6px 0', borderBottom:'1px solid var(--s3)' } },
              _h('div', { style:{ flex:1 } },
                _h('div', { style:{ fontSize:'.82rem', fontWeight:600 } }, row.name),
                r.trendNote && _h('div', { style:{ fontSize:'.65rem', color:'var(--t2)', marginTop:2, lineHeight:1.4 } }, r.trendNote)
              ),
              _h('div', { style:{ textAlign:'right', flexShrink:0, marginLeft:8 } },
                _h('div', { style:{ fontSize:'1.05rem', fontWeight:800, color:'var(--a-light)' } },
                  r.orm1rm.toFixed(1)+' kg', deltaEl),
                _h('div', { style:{ fontSize:'.6rem', color:confColor } }, 'pewność '+r.confidence+'%')
              )
            );
          }),
          // Trend note (pierwsza seria z notatką) — jeśli nie wyświetlono inline
          (function() {
            var first = ormRows.find(function(r){ return r.result.trendNote; });
            return null; // już wyświetlamy inline per ćwiczenie
          })()
        );
      })(),

      // ── AUTOREGULACJA: propozycje +2,5% gdy RIR ≥ planu przez 2 sesje ────
      (function() {
        var props_ = progressionProposals(store);
        if (!props_.length) return null;
        return _h('div', { className:'card', style:{ marginBottom:16, borderLeft:'3px solid var(--green)' } },
          _h('div', { style:{ fontWeight:700, marginBottom:4, fontSize:'.88rem' } }, '📈 Propozycje progresji'),
          _h('div', { style:{ fontSize:'.68rem', color:'var(--t3)', marginBottom:10 } },
            'W 2 ostatnich sesjach RIR ≥ planowanego — masz zapas, czas podnieść ciężar (+2,5%).'),
          props_.map(function(pr, i) {
            return _h('div', { key:i, style:{ display:'flex', alignItems:'center', gap:10, padding:'8px 0', borderTop:i>0?'1px solid var(--b1)':'none' } },
              _h('div', { style:{ flex:1 } },
                _h('div', { style:{ fontWeight:600, fontSize:'.82rem' } }, pr.exName),
                _h('div', { style:{ fontSize:'.65rem', color:'var(--t3)', marginTop:2 } }, pr.planName)
              ),
              _h('div', { style:{ fontSize:'.82rem', fontVariantNumeric:'tabular-nums' } },
                _h('span', { style:{ color:'var(--t3)', textDecoration:'line-through', marginRight:6 } }, pr.from+' kg'),
                _h('span', { style:{ color:'var(--green)', fontWeight:700 } }, pr.to+' kg')
              ),
              _h('button', { className:'btn btn-sm', style:{ border:'1px solid var(--green)', background:'rgba(34,197,94,.12)', color:'var(--green)', fontWeight:700 },
                onClick:function(){
                  update(function(s) {
                    var all = Object.assign({}, s.planSuggestions||{});
                    var forPlan = Object.assign({}, all[pr.planId]||{});
                    forPlan[pr.exName] = Object.assign({}, forPlan[pr.exName]||{}, { weight:pr.to });
                    all[pr.planId] = forPlan;
                    return Object.assign({}, s, { planSuggestions:all });
                  });
                  toast(pr.exName+': '+pr.to+' kg od następnego treningu ✓', 'success');
                }
              }, '✓ Zastosuj')
            );
          })
        );
      })(),

      showPicker && _h(WorkoutPicker, { onSelect:selectPlan, onClose:function(){ setShowPicker(false); }, plans:effectivePlans }),
      showManualAdd && _h(WorkoutEditSheet, { workout:null, update:update, toast:toast, onClose:function(){ setShowManualAdd(false); } }),
      editW && _h(WorkoutEditSheet, { workout:editW, update:update, toast:toast, onClose:function(){ setEditW(null); } }),

      _h('div', { style:{ marginBottom:20 } },
        _h('div', { className:'section-hdr' }, _h('h2', null, 'Twoje plany treningowe')),
        _h('div', { className:'grid-2', style:{ gap:8 } },
          effectivePlans.map(function(p) {
            return _h('div', { key:p.id, className:'card card-interactive', style:{ cursor:'pointer', borderColor:'transparent', backgroundImage:'linear-gradient(135deg, var(--s2), var(--s3))', position:'relative' },
              onClick:function(){ selectPlan(p); } },
              p._isCustom && _h('div', { style:{ position:'absolute', top:6, right:8, fontSize:'.55rem', color:'var(--teal)', fontWeight:700 } }, '⭐ WŁASNY'),
              (store.workoutPlans||{})[p.id] && !p._isCustom && _h('div', { style:{ position:'absolute', top:6, right:8, fontSize:'.55rem', color:'var(--orange)', fontWeight:700 } }, '✏️ EDYTOWANY'),
              _h('div', { style:{ fontSize:'1.6rem', marginBottom:6 } }, p.icon),
              _h('div', { style:{ fontWeight:700, fontSize:'.9rem' } }, p.name),
              _h('div', { style:{ fontSize:'.65rem', color:'var(--t3)', marginTop:3 } }, p.day),
              _h('div', { style:{ fontSize:'.62rem', color:'var(--t2)', marginTop:6, lineHeight:1.4 } }, p.desc)
            );
          })
        )
      ),

      workouts.length === 0
        ? _h(ET.Placeholder, { icon:'🏋️', title:'Brak zapisanych treningów', desc:'Wybierz plan i zacznij swój pierwszy trening.' })
        : _h('div', null,
            _h('div', { className:'section-hdr' }, _h('h2', null, 'Historia')),
            workouts.map(function(w) {
              var totalMin = Math.round((w.duration||0)/60000);
              var workMin = w.workMs ? Math.round(w.workMs/60000) : totalMin;
              var restMin = w.restMs ? Math.round(w.restMs/60000) : 0;
              var rdColor = !w.readiness ? 'var(--t3)' : w.readiness.willingness===3?'var(--green)':w.readiness.willingness===1?'var(--red)':'var(--yellow)';
              return _h('div', { key:w.id, className:'card', style:{ marginBottom:8 } },
                _h('div', { style:{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:8 } },
                  _h('div', { style:{ flex:1 } },
                    _h('div', { style:{ fontWeight:700, marginBottom:2 } }, w.name),
                    _h('div', { style:{ fontSize:'.72rem', color:'var(--t3)', marginBottom:4 } }, ET.fmtDate(w.date) + ' · ' + workMin + 'min praca · ' + restMin + 'min przerwy'),
                    _h('div', { style:{ display:'flex', gap:4, flexWrap:'wrap' } },
                      _h('span', { className:'badge badge-blue' }, (w.volume||0).toFixed(0)+' kg'),
                      _h('span', { className:'badge badge-purple' }, (w.totalReps||0)+' powt.'),
                      w.prs&&w.prs.length>0 && _h('span', { className:'badge badge-yellow' }, '🎉 '+w.prs.length+' PR'),
                      w.readiness && _h('span', { style:{ fontSize:'.65rem', color:rdColor } }, ['','😤','😐','💪'][w.readiness.willingness||0])
                    )
                  ),
                  _h('div', { style:{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:8, flexShrink:0 } },
                    _h('div', { style:{ fontSize:'.72rem', color:'var(--t3)' } }, totalMin+'min'),
                    _h('button', { style:{ fontSize:'.7rem', padding:'4px 10px', borderRadius:'var(--r2)', border:'1px solid var(--b1)', background:'var(--s3)', color:'var(--t2)', cursor:'pointer' },
                      onClick:function(){ setEditW(w); }
                    }, '✏️ Edytuj')
                  )
                )
              );
            })
          )
    );
  }

  ET.StrengthModule = StrengthModule;
  ET.WORKOUT_PLANS = WORKOUT_PLANS;
  ET.getEffectivePlans = getEffectivePlans;
  ET.getMetaPlans = getMetaPlans;
})();
