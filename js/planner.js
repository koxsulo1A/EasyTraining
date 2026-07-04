(function() {
  'use strict';
  window.ET = window.ET || {};
  var _h = React.createElement;

  // ── SŁOWNIKI ─────────────────────────────────────────────────────────────
  var GOALS = [
    { id:'masa',     label:'Masa',              icon:'💪', sets:4, reps:'8-12',  rest:90  },
    { id:'sila',     label:'Siła',              icon:'🏋️', sets:5, reps:'3-5',   rest:180 },
    { id:'redukcja', label:'Redukcja',          icon:'🔥', sets:3, reps:'12-15', rest:60  },
    { id:'zdrowie',  label:'Zdrowie',           icon:'❤️', sets:3, reps:'10-12', rest:75  },
    { id:'powrot',   label:'Powrót po kontuzji',icon:'🩹', sets:2, reps:'10-12', rest:90, easyOnly:true },
  ];
  function goalDef(id){ return GOALS.find(function(g){ return g.id===id; }) || GOALS[0]; }

  // Ćwiczenia do unikania przy danej kontuzji (id z exercises-db)
  var AVOID = {
    dyskopatia_L:               ['pl1','no1','no9','no3','pl10','ba1','ba8','pl9'],
    przodopochylenie_miednicy:  ['pl1','no1'],
    kolana_valgus:              ['no1','no9'],
    tendinopatia_rzepki:        ['no1','no2','no9'],
    ITBS:                       ['no5','no8'],
    ciasnota_podbarkowa:        ['ba1','ba6','ba8','tr9','kp8'],
    niestabilnosc_barku:        ['ba1','ba8','kp8','tr9'],
    protrakcja_barkow:          ['ba6','ba8'],
    ograniczone_zgiecie_skokowe:['ly2'],
    niestabilnosc_skokowa:      ['ly4','ly10'],
  };

  // Szablony podziału wg liczby jednostek/tydzień
  var PUSH = { name:'Push — Klatka/Barki/Triceps', groups:['klatka_piersiowa','barki','triceps'] };
  var PULL = { name:'Pull — Plecy/Biceps', groups:['plecy','biceps','przedramiona'] };
  var LEGS = { name:'Nogi + Core', groups:['nogi','lydki','core_brzuch'] };
  var UPPER= { name:'Góra', groups:['klatka_piersiowa','plecy','barki'] };
  var LOWER= { name:'Dół', groups:['nogi','lydki','core_brzuch'] };

  var SPLITS = {
    2: [ { name:'Full Body A', groups:['nogi','klatka_piersiowa','plecy','barki','core_brzuch'] },
         { name:'Full Body B', groups:['nogi','plecy','klatka_piersiowa','biceps','triceps'] } ],
    3: [ PUSH, PULL, LEGS ],
    4: [ { name:'Góra A — Klatka/Plecy', groups:['klatka_piersiowa','plecy','core_brzuch'] },
         { name:'Dół A — Nogi', groups:['nogi','lydki'] },
         { name:'Góra B — Barki/Ramiona', groups:['barki','biceps','triceps'] },
         { name:'Dół B — Nogi/Core', groups:['nogi','core_brzuch'] } ],
    5: [ PUSH, PULL, LEGS, UPPER, LOWER ],
  };
  function getSplit(units) {
    if (SPLITS[units]) return SPLITS[units];
    if (units === 6) return [PUSH, PULL, LEGS,
      { name:'Push B', groups:['klatka_piersiowa','barki','triceps'] },
      { name:'Pull B', groups:['plecy','biceps','przedramiona'] },
      { name:'Nogi B', groups:['nogi','core_brzuch'] } ];
    // fallback: cykluj partie
    var all = ['nogi','klatka_piersiowa','plecy','barki','biceps','triceps','core_brzuch','lydki'];
    var out = [];
    for (var i=0;i<units;i++) out.push({ name:'Dzień '+(i+1), groups:[all[(i*2)%all.length], all[(i*2+1)%all.length]] });
    return out;
  }

  // ── GENERATOR PLANU ──────────────────────────────────────────────────────
  ET.generatePlan = function(opts) {
    var goal = goalDef(opts.goal);
    var split = getSplit(opts.units);
    var avoid = {};
    (opts.limitations||[]).forEach(function(c){ (AVOID[c]||[]).forEach(function(id){ avoid[id]=1; }); });

    var days = split.map(function(tpl, di) {
      var seen = {};
      var exs = [];
      // partia priorytetowa jako pierwsza + dodatkowe ćwiczenie
      var groups = tpl.groups.slice();
      [opts.prioritySmall, opts.priorityBig].forEach(function(pt) {
        if (pt && groups.indexOf(pt)!==-1) { groups = [pt].concat(groups.filter(function(g){ return g!==pt; })); }
      });
      groups.forEach(function(tag) {
        var pool = (ET.exercisesByTag ? ET.exercisesByTag(tag) : []).filter(function(e){ return e.type==='podstawowe' && !avoid[e.id] && !seen[e.id]; });
        if (goal.easyOnly) {
          // Powrót po kontuzji: preferuj najłatwiejsze
          pool = pool.filter(function(e){ return e.difficulty<=2; });
          pool.sort(function(a,b){ return (a.difficulty-b.difficulty) || (a.id<b.id?-1:1); });
        }
        // W innym wypadku zachowaj kolejność z bazy (główne ćwiczenia złożone jako pierwsze)
        var take = (tag===opts.priorityBig || tag===opts.prioritySmall) ? 2 : 1;
        for (var i=0;i<pool.length && i<take;i++) {
          seen[pool[i].id] = 1;
          exs.push({ id:pool[i].id, name:pool[i].name, tag:tag, sets:goal.sets, reps:goal.reps, rest:goal.rest });
        }
      });
      return { id:'d'+Date.now()+'_'+di, name:tpl.name, groups:tpl.groups.slice(), exercises:exs };
    });

    return {
      id: Date.now(),
      name: goal.label+' · '+opts.units+' dni/tydz',
      goal: opts.goal,
      units: opts.units,
      priorityBig: opts.priorityBig || null,
      prioritySmall: opts.prioritySmall || null,
      limitations: (opts.limitations||[]).slice(),
      createdAt: ET.dstr(),
      ranges: [
        { id:1, weeks:'1–4',  mode:'progresja', deloadPct:15 },
        { id:2, weeks:'5–8',  mode:'progresja', deloadPct:15 },
        { id:3, weeks:'9–12', mode:'deload',    deloadPct:15 },
      ],
      days: days
    };
  };

  function tagLabel(tag) {
    var m = (ET.MUSCLE_GROUPS||[]).find(function(x){ return x.tag===tag; });
    return m ? m.label : tag;
  }

  // ── SHEET: WYBÓR ĆWICZENIA (zamiana / dodanie) ───────────────────────────
  function ExercisePicker(props) {
    // props: open, lockTag (string|null), exclude (array ids), onPick, onClose, avoid
    var initTag = props.lockTag || ((ET.MUSCLE_GROUPS||[])[0] && ET.MUSCLE_GROUPS[0].tag);
    var tg = React.useState(initTag); var tag = tg[0], setTag = tg[1];
    React.useEffect(function(){ if (props.open && props.lockTag) setTag(props.lockTag); }, [props.open, props.lockTag]);

    var exclude = props.exclude || [];
    var avoid = props.avoid || {};
    var list = (ET.exercisesByTag ? ET.exercisesByTag(tag) : []).filter(function(e){ return e.type==='podstawowe' && exclude.indexOf(e.id)===-1; });

    return _h(ET.Sheet, { open:props.open, onClose:props.onClose, title:props.lockTag ? 'Zamień ćwiczenie' : 'Dodaj ćwiczenie' },
      props.lockTag
        ? _h('div', { style:{ fontSize:'.78rem', color:'var(--t2)', marginBottom:12 } }, 'Alternatywy dla partii: ', _h('b', null, tagLabel(props.lockTag)))
        : _h('div', { style:{ display:'flex', gap:5, flexWrap:'wrap', marginBottom:12 } },
            (ET.MUSCLE_GROUPS||[]).map(function(m) {
              return _h('button', { key:m.tag, className:'tag-btn'+(tag===m.tag?' active':''), onClick:function(){ setTag(m.tag); } }, m.icon+' '+m.label);
            })
          ),
      list.length===0
        ? _h('div', { style:{ fontSize:'.8rem', color:'var(--t3)', textAlign:'center', padding:'20px 0' } }, 'Brak dostępnych ćwiczeń.')
        : list.map(function(e) {
            var avoided = !!avoid[e.id];
            return _h('div', { key:e.id, className:'card card-interactive', style:{ marginBottom:6, cursor:'pointer', padding:'10px 12px', opacity:avoided?.55:1 }, onClick:function(){ props.onPick(e, tag); } },
              _h('div', { style:{ display:'flex', justifyContent:'space-between', alignItems:'center', gap:8 } },
                _h('div', null,
                  _h('div', { style:{ fontWeight:600, fontSize:'.85rem' } }, e.name),
                  _h('div', { style:{ fontSize:'.68rem', color:'var(--t3)' } }, '🧰 '+e.equipment)
                ),
                avoided && _h('span', { style:{ fontSize:'.6rem', color:'var(--orange)' } }, '⚠ kontuzja')
              )
            );
          })
    );
  }

  // ── WIDOK SZCZEGÓŁÓW / EDYCJI PLANU ──────────────────────────────────────
  function PlanDetail(props) {
    var su = ET.useStore(); var update = su.update;
    var toast = ET.useToast();
    var plan = props.plan;
    var pick = React.useState(null); var picker = pick[0], setPicker = pick[1]; // {dayIdx, exIdx?|null, lockTag}

    function mutate(fn) {
      update(function(s){ return Object.assign({}, s, { customPlans:(s.customPlans||[]).map(function(p){ return p.id===plan.id ? fn(JSON.parse(JSON.stringify(p))) : p; }) }); });
    }

    var avoid = {};
    (plan.limitations||[]).forEach(function(c){ (AVOID[c]||[]).forEach(function(id){ avoid[id]=1; }); });

    function setExField(dayIdx, exIdx, field, val) {
      mutate(function(p){ p.days[dayIdx].exercises[exIdx][field] = val; return p; });
    }
    function removeEx(dayIdx, exIdx) {
      mutate(function(p){ p.days[dayIdx].exercises.splice(exIdx,1); return p; });
    }
    function onPick(ex, tag) {
      var pk = picker;
      mutate(function(p) {
        var goal = goalDef(p.goal);
        var item = { id:ex.id, name:ex.name, tag:tag, sets:goal.sets, reps:goal.reps, rest:goal.rest };
        if (pk.exIdx != null) { // zamiana — zachowaj serie/powt.
          var old = p.days[pk.dayIdx].exercises[pk.exIdx];
          item.sets = old.sets; item.reps = old.reps; item.rest = old.rest;
          p.days[pk.dayIdx].exercises[pk.exIdx] = item;
        } else {
          p.days[pk.dayIdx].exercises.push(item);
        }
        return p;
      });
      setPicker(null);
      toast(pk.exIdx!=null ? 'Ćwiczenie zamienione ✓' : 'Ćwiczenie dodane ✓', 'success');
    }
    function setRange(ri, field, val) {
      mutate(function(p){ p.ranges[ri][field] = val; return p; });
    }

    var goal = goalDef(plan.goal);

    return _h('div', { className:'fade-in' },
      _h('div', { style:{ display:'flex', alignItems:'center', gap:10, marginBottom:16 } },
        _h('button', { className:'btn btn-ghost btn-sm btn-icon', onClick:props.onBack }, '←'),
        _h('div', { style:{ flex:1 } },
          _h('h1', { style:{ fontSize:'1.1rem', fontWeight:700 } }, goal.icon+' '+plan.name),
          _h('div', { style:{ fontSize:'.72rem', color:'var(--t3)', marginTop:2 } }, 'Utworzono '+ET.fmtDate(plan.createdAt))
        )
      ),

      // Zmienne dla zakresów tygodni
      _h('div', { className:'card', style:{ marginBottom:14 } },
        _h('div', { style:{ fontWeight:700, fontSize:'.88rem', marginBottom:10, color:'var(--t2)' } }, '📆 Zakresy tygodni'),
        (plan.ranges||[]).map(function(rg, ri) {
          return _h('div', { key:rg.id, style:{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap', padding:'8px 0', borderTop:ri>0?'1px solid var(--b1)':'none' } },
            _h('div', { style:{ fontWeight:700, fontSize:'.85rem', minWidth:64 } }, 'Tydz. '+rg.weeks),
            _h('div', { style:{ display:'flex', gap:4 } },
              [{ id:'progresja', l:'📈 Progresja' }, { id:'deload', l:'📉 Deload' }].map(function(m) {
                return _h('button', { key:m.id, className:'tag-btn'+(rg.mode===m.id?' active':''), style:{ fontSize:'.68rem' }, onClick:function(){ setRange(ri,'mode',m.id); } }, m.l);
              })
            ),
            rg.mode==='deload' && _h('div', { style:{ display:'flex', alignItems:'center', gap:4 } },
              _h('span', { style:{ fontSize:'.7rem', color:'var(--t3)' } }, '-'),
              _h('input', { type:'number', min:5, max:50, value:rg.deloadPct, style:{ width:52 }, onChange:function(e){ setRange(ri,'deloadPct',+e.target.value); } }),
              _h('span', { style:{ fontSize:'.7rem', color:'var(--t3)' } }, '%')
            )
          );
        }),
        _h('div', { style:{ fontSize:'.68rem', color:'var(--t3)', marginTop:8, lineHeight:1.5 } },
          '💡 Tydzień zalicza się po wykonaniu wszystkich '+plan.units+' treningów. Deload domyślnie -15%.')
      ),

      plan.limitations && plan.limitations.length>0 && _h('div', { style:{ display:'flex', gap:5, flexWrap:'wrap', marginBottom:14 } },
        plan.limitations.map(function(c) {
          var cond = (ET.CONDITIONS||[]).find(function(x){ return x.tag===c; });
          return _h('span', { key:c, className:'badge badge-orange' }, '⚠ '+(cond?cond.label:c));
        })
      ),

      // Dni treningowe
      (plan.days||[]).map(function(day, di) {
        return _h('div', { key:day.id, className:'card', style:{ marginBottom:12 } },
          _h('div', { style:{ fontWeight:700, fontSize:'.95rem', marginBottom:2 } }, 'Dzień '+(di+1)+' — '+day.name),
          _h('div', { style:{ fontSize:'.68rem', color:'var(--t3)', marginBottom:10 } }, (day.groups||[]).map(tagLabel).join(' · ')),

          _h('table', { className:'sets-table', style:{ width:'100%' } },
            _h('thead', null, _h('tr', null, _h('th',null,'Ćwiczenie'), _h('th',{style:{width:52}},'Serie'), _h('th',{style:{width:64}},'Powt.'), _h('th',{style:{width:76}},''))),
            _h('tbody', null,
              day.exercises.map(function(ex, ei) {
                return _h('tr', { key:ei },
                  _h('td', null,
                    _h('div', { style:{ fontWeight:600, fontSize:'.8rem' } }, ex.name),
                    _h('span', { className:'badge badge-teal', style:{ fontSize:'.58rem' } }, tagLabel(ex.tag))
                  ),
                  _h('td', null, _h('input', { type:'number', min:1, value:ex.sets, style:{ width:44 }, onChange:function(e){ setExField(di,ei,'sets',+e.target.value); } })),
                  _h('td', null, _h('input', { type:'text', value:ex.reps, style:{ width:56 }, onChange:function(e){ setExField(di,ei,'reps',e.target.value); } })),
                  _h('td', null,
                    _h('div', { style:{ display:'flex', gap:4 } },
                      _h('button', { className:'btn btn-ghost btn-sm', style:{ fontSize:'.62rem', padding:'2px 6px' }, onClick:function(){ setPicker({ dayIdx:di, exIdx:ei, lockTag:ex.tag }); } }, '↔'),
                      _h('button', { className:'btn btn-ghost btn-sm', style:{ fontSize:'.7rem', padding:'2px 6px', color:'var(--red)' }, onClick:function(){ removeEx(di,ei); } }, '✕')
                    )
                  )
                );
              })
            )
          ),
          _h('button', { className:'btn btn-ghost btn-sm', style:{ marginTop:8, width:'100%', borderStyle:'dashed' }, onClick:function(){ setPicker({ dayIdx:di, exIdx:null, lockTag:null }); } }, '+ Dodaj ćwiczenie')
        );
      }),

      _h(ExercisePicker, {
        open: !!picker,
        lockTag: picker ? picker.lockTag : null,
        exclude: picker ? (plan.days[picker.dayIdx].exercises.map(function(e){ return e.id; })) : [],
        avoid: avoid,
        onPick: onPick,
        onClose: function(){ setPicker(null); }
      })
    );
  }

  // ── KREATOR (wizard) ─────────────────────────────────────────────────────
  function CreatorSheet(props) {
    var st = React.useState(1); var step = st[0], setStep = st[1];
    var fo = React.useState({ goal:'masa', units:4, priorityBig:null, prioritySmall:null, limitations:[] });
    var form = fo[0], setForm = fo[1];
    function up(k,v){ setForm(function(p){ var o={}; o[k]=v; return Object.assign({},p,o); }); }
    function toggleLim(tag){ up('limitations', form.limitations.indexOf(tag)!==-1 ? form.limitations.filter(function(x){return x!==tag;}) : form.limitations.concat([tag])); }

    React.useEffect(function(){ if (props.open) { setStep(1); setForm({ goal:'masa', units:4, priorityBig:null, prioritySmall:null, limitations:[] }); } }, [props.open]);

    var bigGroups = (ET.MUSCLE_GROUPS||[]).filter(function(m){ return m.size==='duza'; });
    var smallGroups = (ET.MUSCLE_GROUPS||[]).filter(function(m){ return m.size==='mala'; });

    function finish() {
      var plan = ET.generatePlan(form);
      props.onCreate(plan);
    }

    return _h(ET.Sheet, { open:props.open, onClose:props.onClose, title:'Kreator planu · krok '+step+'/4' },
      step===1 && _h('div', null,
        _h('div', { style:{ fontWeight:700, marginBottom:10 } }, '🎯 Cel treningowy'),
        _h('div', { style:{ display:'flex', gap:6, flexWrap:'wrap' } },
          GOALS.map(function(g) {
            return _h('button', { key:g.id, className:'tag-btn'+(form.goal===g.id?' active':''), onClick:function(){ up('goal',g.id); } }, g.icon+' '+g.label);
          })
        ),
        _h('button', { className:'btn btn-primary', style:{ width:'100%', marginTop:18 }, onClick:function(){ setStep(2); } }, 'Dalej →')
      ),

      step===2 && _h('div', null,
        _h('div', { style:{ fontWeight:700, marginBottom:10 } }, '📅 Jednostki treningowe / tydzień'),
        _h('div', { style:{ display:'flex', gap:6, flexWrap:'wrap' } },
          [2,3,4,5,6].map(function(n) {
            return _h('button', { key:n, className:'tag-btn'+(form.units===n?' active':''), style:{ minWidth:44 }, onClick:function(){ up('units',n); } }, n);
          })
        ),
        _h('div', { style:{ fontSize:'.72rem', color:'var(--t3)', marginTop:10 } }, 'Podział: '+getSplit(form.units).map(function(d){ return d.name.split(' — ')[0].split(' (')[0]; }).join(' · ')),
        _h('div', { style:{ display:'flex', gap:8, marginTop:18 } },
          _h('button', { className:'btn btn-ghost', onClick:function(){ setStep(1); } }, '←'),
          _h('button', { className:'btn btn-primary', style:{ flex:1 }, onClick:function(){ setStep(3); } }, 'Dalej →')
        )
      ),

      step===3 && _h('div', null,
        _h('div', { style:{ fontWeight:700, marginBottom:6 } }, '⭐ Priorytet mięśni (opcjonalnie)'),
        _h('div', { style:{ fontSize:'.72rem', color:'var(--t3)', marginBottom:10 } }, 'Maks. 1 partia duża i 1 mała — dostaną dodatkowe ćwiczenie.'),
        _h('div', { style:{ fontSize:'.68rem', fontWeight:700, color:'var(--t3)', textTransform:'uppercase', marginBottom:6 } }, 'Duża'),
        _h('div', { style:{ display:'flex', gap:5, flexWrap:'wrap', marginBottom:12 } },
          bigGroups.map(function(m) {
            var a = form.priorityBig===m.tag;
            return _h('button', { key:m.tag, className:'tag-btn'+(a?' active':''), onClick:function(){ up('priorityBig', a?null:m.tag); } }, m.icon+' '+m.label);
          })
        ),
        _h('div', { style:{ fontSize:'.68rem', fontWeight:700, color:'var(--t3)', textTransform:'uppercase', marginBottom:6 } }, 'Mała'),
        _h('div', { style:{ display:'flex', gap:5, flexWrap:'wrap' } },
          smallGroups.map(function(m) {
            var a = form.prioritySmall===m.tag;
            return _h('button', { key:m.tag, className:'tag-btn'+(a?' active':''), onClick:function(){ up('prioritySmall', a?null:m.tag); } }, m.icon+' '+m.label);
          })
        ),
        _h('div', { style:{ display:'flex', gap:8, marginTop:18 } },
          _h('button', { className:'btn btn-ghost', onClick:function(){ setStep(2); } }, '←'),
          _h('button', { className:'btn btn-primary', style:{ flex:1 }, onClick:function(){ setStep(4); } }, 'Dalej →')
        )
      ),

      step===4 && _h('div', null,
        _h('div', { style:{ fontWeight:700, marginBottom:6 } }, '⚠️ Ograniczenia / kontuzje (opcjonalnie)'),
        _h('div', { style:{ fontSize:'.72rem', color:'var(--t3)', marginBottom:10 } }, 'Wykluczymy ćwiczenia obciążające wskazane obszary.'),
        _h('div', { style:{ display:'flex', gap:5, flexWrap:'wrap' } },
          (ET.CONDITIONS||[]).map(function(c) {
            var a = form.limitations.indexOf(c.tag)!==-1;
            return _h('button', { key:c.tag, className:'tag-btn'+(a?' active':''), onClick:function(){ toggleLim(c.tag); } }, (a?'✓ ':'')+c.label);
          })
        ),
        _h('div', { style:{ display:'flex', gap:8, marginTop:18 } },
          _h('button', { className:'btn btn-ghost', onClick:function(){ setStep(3); } }, '←'),
          _h('button', { className:'btn btn-primary', style:{ flex:1 }, onClick:finish }, '✨ Wygeneruj plan')
        )
      )
    );
  }

  // ── MODUŁ GŁÓWNY ─────────────────────────────────────────────────────────
  function PlannerModule() {
    var su = ET.useStore(); var store = su.store, update = su.update;
    var toast = ET.useToast();
    var cr = React.useState(false); var showCreator = cr[0], setShowCreator = cr[1];
    var op = React.useState(null); var openId = op[0], setOpenId = op[1];

    var plans = store.customPlans || [];
    var openPlan = openId ? plans.find(function(p){ return p.id===openId; }) : null;

    function createPlan(plan) {
      update(function(s){
        var st = Object.assign({}, s, { customPlans:[plan].concat(s.customPlans||[]) });
        if (ET.logChange) st = ET.logChange(st, { section:'planner', title:'Utworzono plan', desc:plan.name });
        return st;
      });
      setShowCreator(false);
      setOpenId(plan.id);
      toast('Plan wygenerowany ✓', 'success');
    }
    function deletePlan(id) {
      update(function(s){ return Object.assign({}, s, { customPlans:(s.customPlans||[]).filter(function(p){ return p.id!==id; }) }); });
      toast('Plan usunięty', 'success');
    }

    if (openPlan) return _h(PlanDetail, { plan:openPlan, onBack:function(){ setOpenId(null); } });

    return _h('div', { className:'fade-in' },
      _h('div', { className:'page-hdr' },
        _h('div', null,
          _h('h1', null, '🧩 Kreator planu'),
          _h('p', null, plans.length+' zapisanych planów')
        ),
        _h('button', { className:'btn btn-primary', onClick:function(){ setShowCreator(true); } }, '+ Nowy plan')
      ),

      _h('div', { className:'card card-accent', style:{ marginBottom:14, fontSize:'.82rem', color:'var(--t2)', lineHeight:1.6 } },
        '💡 Kreator zbuduje plan dopasowany do celu, liczby jednostek, priorytetów i kontuzji. Potem możesz edytować serie/powtórzenia i zamieniać ćwiczenia (przycisk ↔ dobiera alternatywy z tej samej partii).'),

      plans.length===0
        ? _h(ET.Placeholder, { icon:'🧩', title:'Brak planów', desc:'Kliknij „Nowy plan", aby uruchomić kreator.' })
        : plans.map(function(p) {
            var goal = goalDef(p.goal);
            var exCount = (p.days||[]).reduce(function(t,d){ return t+d.exercises.length; },0);
            return _h('div', { key:p.id, className:'card card-interactive', style:{ marginBottom:8, cursor:'pointer' }, onClick:function(){ setOpenId(p.id); } },
              _h('div', { style:{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:8 } },
                _h('div', { style:{ flex:1 } },
                  _h('div', { style:{ fontWeight:700, fontSize:'1rem', marginBottom:3 } }, goal.icon+' '+p.name),
                  _h('div', { style:{ fontSize:'.72rem', color:'var(--t3)' } }, (p.days||[]).length+' dni · '+exCount+' ćwiczeń · '+ET.fmtDate(p.createdAt)),
                  (p.priorityBig || p.prioritySmall) && _h('div', { style:{ display:'flex', gap:4, marginTop:6, flexWrap:'wrap' } },
                    p.priorityBig && _h('span', { className:'badge badge-blue' }, '⭐ '+tagLabel(p.priorityBig)),
                    p.prioritySmall && _h('span', { className:'badge badge-purple' }, '⭐ '+tagLabel(p.prioritySmall))
                  )
                ),
                _h('button', { className:'btn btn-ghost btn-sm', style:{ color:'var(--red)', flexShrink:0 }, onClick:function(e){ e.stopPropagation(); deletePlan(p.id); } }, '✕')
              )
            );
          }),

      _h(CreatorSheet, { open:showCreator, onClose:function(){ setShowCreator(false); }, onCreate:createPlan })
    );
  }

  ET.PlannerModule = PlannerModule;
})();
