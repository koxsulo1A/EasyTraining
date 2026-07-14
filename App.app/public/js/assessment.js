(function() {
  'use strict';
  window.ET = window.ET || {};
  var _h = React.createElement;

  function band(label, color, extra) { return { label:label, color:color, extra:extra||'' }; }

  // ═══════════════════════════════════════════════════════════════════════
  //  KATALOG TESTÓW WYDOLNOŚCIOWYCH (spec 12)
  // ═══════════════════════════════════════════════════════════════════════
  var TESTS = [
    { id:'cooper', cat:'Wydolność', name:'Test Coopera (VO₂max)', icon:'🏃', unit:'m',
      hint:'Przebiegnij maksymalny dystans w 12 minut.',
      inputs:[{ k:'dist', l:'Dystans (m)', min:800, max:5000, step:10, def:2400 }],
      evaluate:function(v){
        var vo2 = (v.dist - 504.9) / 44.73;
        var b = vo2<35?band('Słaba','var(--red)'):vo2<42?band('Przeciętna','var(--orange)'):vo2<50?band('Dobra','var(--green)'):vo2<56?band('Bardzo dobra','var(--green)'):band('Wybitna','var(--a-light)');
        b.extra = 'VO₂max ≈ '+vo2.toFixed(1)+' ml/kg/min';
        return b;
      }
    },
    { id:'pushups', cat:'Wytrzymałość', name:'Pompki (1 min)', icon:'💪', unit:'powt.',
      hint:'Maksymalna liczba poprawnych pompek w 60 s.',
      inputs:[{ k:'reps', l:'Powtórzenia', min:0, max:120, step:1, def:25 }],
      evaluate:function(v, p){
        var male = (p&&p.gender)!=='female';
        var t = male?[20,35,45]:[12,22,32];
        var r=v.reps;
        return r<t[0]?band('Poniżej normy','var(--red)'):r<t[1]?band('Przeciętna','var(--orange)'):r<t[2]?band('Dobra','var(--green)'):band('Bardzo dobra','var(--a-light)');
      }
    },
    { id:'situps', cat:'Wytrzymałość', name:'Brzuszki (1 min)', icon:'🧎', unit:'powt.',
      hint:'Test YMCA — liczba brzuszków w 60 s.',
      inputs:[{ k:'reps', l:'Powtórzenia', min:0, max:120, step:1, def:30 }],
      evaluate:function(v, p){
        var male = (p&&p.gender)!=='female';
        var t = male?[25,35,45]:[20,30,40];
        var r=v.reps;
        return r<t[0]?band('Poniżej normy','var(--red)'):r<t[1]?band('Przeciętna','var(--orange)'):r<t[2]?band('Dobra','var(--green)'):band('Bardzo dobra','var(--a-light)');
      }
    },
    { id:'sitreach', cat:'Elastyczność', name:'Sit-and-Reach', icon:'🤸', unit:'cm',
      hint:'Skłon w siadzie — cm względem linii palców (ujemne = przed palcami).',
      inputs:[{ k:'cm', l:'Zasięg (cm)', min:-20, max:40, step:1, def:5 }],
      evaluate:function(v){
        var c=v.cm;
        return c<-5?band('Słaba','var(--red)'):c<0?band('Poniżej średniej','var(--orange)'):c<10?band('Średnia','var(--green)'):c<15?band('Dobra','var(--green)'):band('Bardzo dobra','var(--a-light)');
      }
    },
    { id:'step3', cat:'Wydolność', name:'Test schodowy 3-min', icon:'🪜', unit:'bpm',
      hint:'Wchodź i schodź ze stopnia (~30 cm) w rytmie 96/min przez 3 min. Zaraz po zmierz tętno.',
      inputs:[{ k:'hr', l:'Tętno po (bpm)', min:60, max:220, step:1, def:120 }],
      evaluate:function(v, p){
        var male = (p&&p.gender)!=='female';
        var vo2 = male ? (111.33 - 0.42*v.hr) : (65.81 - 0.1847*v.hr);
        var b = vo2<35?band('Słaba','var(--red)'):vo2<42?band('Przeciętna','var(--orange)'):vo2<50?band('Dobra','var(--green)'):band('Bardzo dobra','var(--a-light)');
        b.extra = 'VO₂max ≈ '+vo2.toFixed(1)+' ml/kg/min (test Queens College)';
        return b;
      }
    },
    { id:'sit2stand', cat:'Wytrzymałość', name:'Wstawania z krzesła (30 s)', icon:'🪑', unit:'powt.',
      hint:'Ile razy wstaniesz i usiądziesz w 30 s (ręce skrzyżowane na klatce).',
      inputs:[{ k:'reps', l:'Powtórzenia', min:0, max:60, step:1, def:14 }],
      evaluate:function(v, p){
        var age = (p&&p.age)||35;
        var thr = age<60 ? [12,17] : age<70 ? [11,15] : [9,13];
        var r=v.reps;
        return r<thr[0]?band('Poniżej normy','var(--red)'):r<thr[1]?band('Przeciętna','var(--orange)'):band('Dobra','var(--green)');
      }
    },
  ];

  // ── 1RM: wzory (prompt 7.2) ──────────────────────────────────────────────
  function oneRM(weight, reps) {
    if (reps <= 1) return weight;
    var epley   = weight * (1 + reps/30);
    var brzycki = weight * 36 / (37 - reps);
    var lombardi= weight * Math.pow(reps, 0.10);
    var chosen, name;
    if (reps < 6) { chosen = brzycki; name = 'Brzycki'; }
    else if (reps <= 10) { chosen = epley; name = 'Epley'; }
    else { chosen = lombardi; name = 'Lombardi'; }
    return { value: chosen, formula: name, epley:epley, brzycki:brzycki, lombardi:lombardi };
  }
  // Ryzykowne ćwiczenia wg dolegliwości (blokada testu maksymalnego)
  var ONERM_RISK = {
    dyskopatia_L: ['martwy ciąg','przysiad'],
    przodopochylenie_miednicy: ['martwy ciąg'],
    ciasnota_podbarkowa: ['ohp','wyciskanie'],
    niestabilnosc_barku: ['ohp','wyciskanie'],
    tendinopatia_rzepki: ['przysiad'],
  };
  function riskFor(exName, ailments) {
    var n = String(exName).toLowerCase(), hits = [];
    (ailments||[]).forEach(function(a){ (ONERM_RISK[a]||[]).forEach(function(kw){ if (n.indexOf(kw)!==-1 && hits.indexOf(a)===-1) hits.push(a); }); });
    return hits;
  }
  function testById(id){ return TESTS.find(function(t){ return t.id===id; }); }

  // ═══════════════════════════════════════════════════════════════════════
  //  OCENA POSTAWY (spec 11)
  // ═══════════════════════════════════════════════════════════════════════
  var POSTURE = [
    { group:'Statyka', items:[
      { k:'knee_valgus', l:'Koślawe kolana (do środka)', flag:'kolana_valgus' },
      { k:'spine', l:'Skrzywienie kręgosłupa' },
      { k:'shoulders_protraction', l:'Barki wysunięte do przodu', flag:'protrakcja_barkow' },
      { k:'pelvis_tilt', l:'Przodopochylenie miednicy', flag:'przodopochylenie_miednicy' },
    ]},
    { group:'Ruchy podstawowe', items:[
      { k:'gait', l:'Nieprawidłowy wzorzec chodu' },
      { k:'toe_walk', l:'Problem z chodzeniem na palcach' },
      { k:'heel_walk', l:'Problem z chodzeniem na piętach' },
      { k:'floor_rise', l:'Trudność przy wstawaniu z podłogi' },
    ]},
    { group:'Wzorce przy obciążeniu', items:[
      { k:'squat_valgus', l:'Koślawienie kolan w przysiadzie', flag:'kolana_valgus' },
      { k:'shoulder_rotation', l:'Ograniczona rotacja barków', flag:'ciasnota_podbarkowa' },
    ]},
  ];

  // ═══════════════════════════════════════════════════════════════════════
  //  CHECK-IN TYGODNIOWY (spec 15)
  // ═══════════════════════════════════════════════════════════════════════
  var SCALE5 = [
    { k:'appetite', l:'Apetyt', icon:'🍽' },
    { k:'libido',   l:'Libido', icon:'❤️' },
    { k:'energy',   l:'Energia', icon:'⚡' },
    { k:'motivation', l:'Motywacja', icon:'🔥' },
  ];

  function Scale(props) {
    return _h('div', { style:{ display:'flex', gap:5 } },
      [1,2,3,4,5].map(function(n) {
        var a = props.value===n;
        return _h('button', { key:n,
          style:{ flex:1, padding:'8px 0', borderRadius:'var(--r2)', border:'1px solid '+(a?'var(--a)':'var(--b1)'), background:a?'var(--a-dim)':'var(--s3)', color:a?'var(--a-light)':'var(--t2)', cursor:'pointer', fontWeight:700, fontSize:'.85rem' },
          onClick:function(){ props.onChange(n); }
        }, n);
      })
    );
  }

  // ── TEST 1RM (dedykowany, prompt 7.2) ────────────────────────────────────
  function OneRMSheet(props) {
    var su = ET.useStore(); var store = su.store, update = su.update;
    var toast = ET.useToast();
    var ex = React.useState(''); var exName = ex[0], setExName = ex[1];
    var mt = React.useState('B'); var method = mt[0], setMethod = mt[1];
    var vs = React.useState({ weight:80, reps:5 }); var vals = vs[0], setVals = vs[1];
    var profile = store.profile||{}, ailments = store.ailments||[];
    var risks = riskFor(exName, ailments);
    React.useEffect(function(){ if(props.open){ setExName(''); setMethod('B'); setVals({ weight:80, reps:5 }); } }, [props.open]);

    var result = null;
    if (exName) {
      if (method==='B') { var r = oneRM(vals.weight, vals.reps); result = (typeof r==='object') ? r : { value:r, formula:'—' }; }
      else { result = { value: vals.weight, formula:'maksymalny' }; }
    }
    function save() {
      if(!exName){ toast('Wybierz ćwiczenie','error'); return; }
      var e1 = result ? result.value : 0, bw = profile.weight||0;
      var b2 = bw>0 ? (e1/bw<0.75?{label:'Początkujący',color:'var(--orange)'}:e1/bw<1.25?{label:'Średniozaawansowany',color:'var(--green)'}:{label:'Zaawansowany',color:'var(--a-light)'}) : {label:'1RM '+e1.toFixed(0)+' kg',color:'var(--a-light)'};
      var rec = { id:Date.now(), testId:'onerm', date:ET.dstr(), values:{ exercise:exName, weight:vals.weight, reps:vals.reps, method:method, e1rm:e1 },
        result:{ label:b2.label, color:b2.color, extra:exName+' · 1RM ≈ '+e1.toFixed(0)+' kg'+(method==='B'&&result?' ('+result.formula+')':'') } };
      update(function(s){ var st=Object.assign({},s,{ fitnessTests:[rec].concat(s.fitnessTests||[]) }); if(ET.logChange) st=ET.logChange(st,{ section:'assessment', title:'Test 1RM: '+exName, desc:e1.toFixed(0)+' kg' }); return st; });
      toast('Wynik 1RM zapisany ✓','success'); props.onClose();
    }
    var exNames = (ET.EXERCISES_BASIC||[]).map(function(e){ return e.name; });
    return _h(ET.Sheet, { open:props.open, onClose:props.onClose, title:'Test 1RM' },
      _h('div', { className:'field' },
        _h('label', null, 'Ćwiczenie'),
        _h('input', { type:'text', list:'onerm-ex', placeholder:'Zacznij pisać nazwę…', value:exName, onChange:function(e){ setExName(e.target.value); } }),
        _h('datalist', { id:'onerm-ex' }, exNames.map(function(n,i){ return _h('option', { key:i, value:n }); }))
      ),
      risks.length>0 && _h('div', { style:{ padding:'8px 12px', background:'rgba(239,68,68,.1)', border:'1px solid var(--red)', borderRadius:'var(--r2)', fontSize:'.74rem', color:'var(--red)', marginBottom:12, lineHeight:1.4 } },
        '⚠️ Przy Twoich dolegliwościach ('+risks.map(function(a){ var c=(ET.CONDITIONS||[]).find(function(x){return x.tag===a;}); return c?c.label:a; }).join(', ')+') odradzamy test maksymalny — użyj metody B z bezpiecznym ciężarem.'),
      _h('div', { style:{ display:'flex', gap:6, marginBottom:12 } },
        [{id:'B',l:'B: Szacowanie'},{id:'A',l:'A: Maksymalny'}].map(function(m){
          var disabled = m.id==='A' && risks.length>0;
          return _h('button', { key:m.id, className:'tag-btn'+(method===m.id?' active':''), style:{ flex:1, fontSize:'.7rem', opacity:disabled?.45:1 }, onClick:function(){ if(!disabled) setMethod(m.id); } }, m.l);
        })
      ),
      method==='A'
        ? _h('div', null,
            _h('div', { className:'card card-accent', style:{ fontSize:'.73rem', color:'var(--t2)', lineHeight:1.5, marginBottom:12 } },
              '🔥 Protokół: 5–10× 50% CM → 3–5× 70% → 1–2× 80% → 1× 90% → próby maksymalne (+2.5–5 kg) aż do nieudanej. Wpisz ostatni udany ciężar.'),
            _h('div', { className:'field' },
              _h('label', { style:{ display:'flex', justifyContent:'space-between' } }, _h('span',null,'Ostatni udany ciężar (kg)'), _h('span',{style:{color:'var(--a-light)',fontWeight:700}},vals.weight)),
              _h('div', { className:'slider-wrap' }, _h('input', { type:'range', min:20, max:400, step:2.5, value:vals.weight, onChange:function(e){ setVals(Object.assign({},vals,{ weight:+e.target.value })); } }))
            )
          )
        : _h('div', { className:'grid-2' },
            _h('div', { className:'field' }, _h('label', null, 'Ciężar (kg)'), _h('input', { type:'number', min:1, step:2.5, value:vals.weight, onChange:function(e){ setVals(Object.assign({},vals,{ weight:+e.target.value })); } })),
            _h('div', { className:'field' }, _h('label', null, 'Powtórzenia'), _h('input', { type:'number', min:1, max:20, value:vals.reps, onChange:function(e){ setVals(Object.assign({},vals,{ reps:+e.target.value })); } }))
          ),
      exName && result && _h('div', { style:{ padding:'12px 14px', borderRadius:'var(--r2)', background:'var(--s3)', border:'1px solid var(--a)', textAlign:'center', marginBottom:14 } },
        _h('div', { style:{ fontSize:'1.4rem', fontWeight:800, color:'var(--a-light)' } }, result.value.toFixed(0)+' kg'),
        _h('div', { style:{ fontSize:'.7rem', color:'var(--t3)', marginTop:3 } },
          method==='B' ? 'Szacowany 1RM (wzór '+result.formula+', ±5%: '+(result.value*0.95).toFixed(0)+'–'+(result.value*1.05).toFixed(0)+' kg)' : 'Zmierzony 1RM')
      ),
      _h('button', { className:'btn btn-primary', style:{ width:'100%' }, onClick:save }, 'Zapisz wynik 1RM')
    );
  }

  // ── ZAKŁADKA: TESTY ──────────────────────────────────────────────────────
  function TestsTab() {
    var su = ET.useStore(); var store = su.store, update = su.update;
    var toast = ET.useToast();
    var sel = React.useState(null); var active = sel[0], setActive = sel[1];
    var vs = React.useState({}); var vals = vs[0], setVals = vs[1];
    var o1 = React.useState(false); var show1rm = o1[0], setShow1rm = o1[1];

    function openTest(t) {
      var init = {}; t.inputs.forEach(function(inp){ init[inp.k]=inp.def; });
      setVals(init); setActive(t);
    }
    function save() {
      var res = active.evaluate(vals, store.profile);
      var rec = { id:Date.now(), testId:active.id, date:ET.dstr(), values:Object.assign({},vals), result:res };
      update(function(s){
        var st = Object.assign({}, s, { fitnessTests:[rec].concat(s.fitnessTests||[]) });
        if (ET.logChange) st = ET.logChange(st, { section:'assessment', title:'Test: '+active.name, desc:res.label });
        return st;
      });
      toast('Wynik zapisany ✓', 'success');
      setActive(null);
    }

    var results = store.fitnessTests || [];
    var cats = {};
    TESTS.forEach(function(t){ (cats[t.cat]=cats[t.cat]||[]).push(t); });

    var last1rm = results.find(function(r){ return r.testId==='onerm'; });

    return _h('div', null,
      // Dedykowany test 1RM (wybór ćwiczenia + metoda)
      _h('div', { style:{ marginBottom:16 } },
        _h('div', { style:{ fontSize:'.7rem', fontWeight:700, color:'var(--t3)', textTransform:'uppercase', letterSpacing:'.05em', marginBottom:8 } }, 'Siła'),
        _h('div', { className:'card card-interactive', style:{ cursor:'pointer', padding:'12px 14px' }, onClick:function(){ setShow1rm(true); } },
          _h('div', { style:{ display:'flex', justifyContent:'space-between', alignItems:'center', gap:8 } },
            _h('div', null,
              _h('div', { style:{ fontWeight:700, fontSize:'.88rem' } }, '🏋️ Test 1RM'),
              _h('div', { style:{ fontSize:'.68rem', color:'var(--t3)', marginTop:2 } }, last1rm ? 'Ostatni: '+(last1rm.values&&last1rm.values.exercise||'')+' · '+ET.fmtDate(last1rm.date) : 'Wybierz ćwiczenie, metoda A/B')
            ),
            last1rm
              ? _h('span', { style:{ fontSize:'.66rem', fontWeight:700, color:last1rm.result.color, border:'1px solid '+last1rm.result.color+'66', borderRadius:99, padding:'3px 8px' } }, last1rm.result.label)
              : _h('span', { style:{ color:'var(--t3)', fontSize:'1.1rem' } }, '›')
          )
        )
      ),
      Object.keys(cats).map(function(cat) {
        return _h('div', { key:cat, style:{ marginBottom:16 } },
          _h('div', { style:{ fontSize:'.7rem', fontWeight:700, color:'var(--t3)', textTransform:'uppercase', letterSpacing:'.05em', marginBottom:8 } }, cat),
          cats[cat].map(function(t) {
            var last = results.find(function(r){ return r.testId===t.id; });
            return _h('div', { key:t.id, className:'card card-interactive', style:{ marginBottom:6, cursor:'pointer', padding:'12px 14px' }, onClick:function(){ openTest(t); } },
              _h('div', { style:{ display:'flex', justifyContent:'space-between', alignItems:'center', gap:8 } },
                _h('div', null,
                  _h('div', { style:{ fontWeight:700, fontSize:'.88rem' } }, t.icon+' '+t.name),
                  last && _h('div', { style:{ fontSize:'.68rem', color:'var(--t3)', marginTop:2 } }, 'Ostatni: '+ET.fmtDate(last.date))
                ),
                last
                  ? _h('span', { style:{ fontSize:'.66rem', fontWeight:700, color:last.result.color, border:'1px solid '+last.result.color+'66', borderRadius:99, padding:'3px 8px' } }, last.result.label)
                  : _h('span', { style:{ color:'var(--t3)', fontSize:'1.1rem' } }, '›')
              )
            );
          })
        );
      }),

      _h(ET.Sheet, { open:!!active, onClose:function(){ setActive(null); }, title:active?active.name:'' },
        active && _h('div', null,
          _h('div', { className:'card card-accent', style:{ fontSize:'.8rem', color:'var(--t2)', marginBottom:14, lineHeight:1.5 } }, '💡 '+active.hint),
          active.inputs.map(function(inp) {
            return _h('div', { key:inp.k, className:'field' },
              _h('label', { style:{ display:'flex', justifyContent:'space-between' } }, _h('span', null, inp.l), _h('span', { style:{ color:'var(--a-light)', fontWeight:700 } }, vals[inp.k])),
              _h('div', { className:'slider-wrap' },
                _h('input', { type:'range', min:inp.min, max:inp.max, step:inp.step, value:vals[inp.k], onChange:function(e){ var o={}; o[inp.k]=parseFloat(e.target.value); setVals(Object.assign({},vals,o)); } })
              ),
              _h('input', { type:'number', min:inp.min, max:inp.max, step:inp.step, value:vals[inp.k], style:{ marginTop:6 }, onChange:function(e){ var o={}; o[inp.k]=parseFloat(e.target.value)||0; setVals(Object.assign({},vals,o)); } })
            );
          }),
          (function(){
            var r = active.evaluate(vals, store.profile);
            return _h('div', { style:{ padding:'12px 14px', borderRadius:'var(--r2)', background:'var(--s3)', border:'1px solid '+r.color+'66', marginBottom:14, textAlign:'center' } },
              _h('div', { style:{ fontSize:'1.1rem', fontWeight:800, color:r.color } }, r.label),
              r.extra && _h('div', { style:{ fontSize:'.72rem', color:'var(--t2)', marginTop:4 } }, r.extra)
            );
          })(),
          _h('button', { className:'btn btn-primary', style:{ width:'100%' }, onClick:save }, 'Zapisz wynik')
        )
      ),

      results.length>0 && _h('div', { style:{ marginTop:8 } },
        _h('div', { style:{ fontSize:'.7rem', fontWeight:700, color:'var(--t3)', textTransform:'uppercase', letterSpacing:'.05em', marginBottom:8 } }, 'Historia wyników'),
        results.slice(0,12).map(function(r) {
          var t = testById(r.testId) || { name: r.testId==='onerm' ? 'Test 1RM' : r.testId, icon:'🏋️' };
          return _h('div', { key:r.id, style:{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'7px 0', borderBottom:'1px solid var(--b1)' } },
            _h('div', null,
              _h('div', { style:{ fontSize:'.78rem', fontWeight:600 } }, t.icon+' '+t.name),
              _h('div', { style:{ fontSize:'.66rem', color:'var(--t3)' } }, ET.fmtDate(r.date)+(r.result.extra?' · '+r.result.extra:''))
            ),
            _h('span', { style:{ fontSize:'.66rem', fontWeight:700, color:r.result.color } }, r.result.label)
          );
        })
      ),

      _h(OneRMSheet, { open:show1rm, onClose:function(){ setShow1rm(false); } })
    );
  }

  // ── TESTY WZORCÓW RUCHOWYCH (prompt 6.2) ─────────────────────────────────
  var MOVEMENT_TESTS = [
    { id:'ohs', name:'Overhead Squat', icon:'🏋️', desc:'Przysiad z rękami wyprostowanymi nad głową. Obserwuj dolną fazę.',
      questions:[
        { q:'Czy pięty odrywają się od podłoża?', flag:'ograniczone_zgiecie_skokowe' },
        { q:'Czy kolana uciekają do środka (valgus)?', flag:'kolana_valgus' },
        { q:'Czy tułów pochyla się mocno do przodu?', flag:'przodopochylenie_miednicy' },
      ] },
    { id:'thomas', name:'Test Thomasa', icon:'🛏', desc:'Leżąc na krawędzi łóżka przyciągnij jedno kolano do klatki. Obserwuj drugą nogę.',
      questions:[
        { q:'Czy druga noga unosi się z podłoża?', flag:'przodopochylenie_miednicy' },
        { q:'Czy udo drugiej nogi jest powyżej linii bioder?', flag:'przodopochylenie_miednicy' },
      ] },
    { id:'wall', name:'Test ścienny', icon:'🧱', desc:'Stań plecami do ściany (pięty, pośladki, plecy, głowa).',
      questions:[
        { q:'Czy głowa nie dotyka ściany bez wysiłku?', flag:'protrakcja_barkow' },
        { q:'Czy nie możesz unieść rąk nad głowę bez odrywania pleców?', flag:'protrakcja_barkow' },
        { q:'Czy odcinek lędźwiowy mocno odstaje od ściany?', flag:'przodopochylenie_miednicy' },
      ] },
    { id:'ober', name:'Test Obera', icon:'🦵', desc:'Leżąc bokiem, górna noga wyprostowana i odwiedziona — opuść ją swobodnie.',
      questions:[
        { q:'Czy noga utrzymuje się w górze (nie opada)?', flag:'ITBS' },
      ] },
    { id:'apley', name:'Rotacja barku (Apley)', icon:'🤙', desc:'Spróbuj dotknąć dłoni na plecach — jedna od góry, druga od dołu.',
      questions:[
        { q:'Czy dłonie nie stykają się (duża odległość)?', flag:'ciasnota_podbarkowa' },
        { q:'Czy odczuwasz ból lub blokadę w barku?', flag:'niestabilnosc_barku' },
      ] },
    { id:'balance', name:'Balans na jednej nodze', icon:'⚖️', desc:'Stań na jednej nodze z zamkniętymi oczami przez 20 s.',
      questions:[
        { q:'Czy tracisz równowagę przed upływem 20 s?', flag:'niestabilnosc_skokowa' },
      ] },
  ];

  function MovementTests() {
    var su = ET.useStore(); var update = su.update; var toast = ET.useToast();
    var sel = React.useState(null); var active = sel[0], setActive = sel[1];
    var an = React.useState({}); var answers = an[0], setAnswers = an[1];
    var dn = React.useState(false); var showResult = dn[0], setShowResult = dn[1];
    function open(t){ setActive(t); setAnswers({}); setShowResult(false); }
    function setAns(i, val){ setAnswers(function(p){ var o={}; o[i]=val; return Object.assign({},p,o); }); }

    var flags = [];
    if (active) active.questions.forEach(function(q,i){ if (answers[i]===true && q.flag && flags.indexOf(q.flag)===-1) flags.push(q.flag); });

    function addToAilments(){
      update(function(s){ var cur=s.ailments||[]; var merged=cur.slice(); flags.forEach(function(f){ if(merged.indexOf(f)===-1) merged.push(f); }); return Object.assign({},s,{ ailments:merged }); });
      toast('Dodano do Dolegliwości ✓ — blok korekcyjny zaktualizowany','success');
      setActive(null);
    }

    return _h('div', { style:{ marginBottom:18 } },
      _h('div', { style:{ fontSize:'.7rem', fontWeight:700, color:'var(--t3)', textTransform:'uppercase', letterSpacing:'.05em', marginBottom:8 } }, 'Testy wzorców ruchowych'),
      MOVEMENT_TESTS.map(function(t){
        return _h('div', { key:t.id, className:'card card-interactive', style:{ marginBottom:6, cursor:'pointer', padding:'12px 14px' }, onClick:function(){ open(t); } },
          _h('div', { style:{ fontWeight:700, fontSize:'.86rem' } }, t.icon+' '+t.name),
          _h('div', { style:{ fontSize:'.68rem', color:'var(--t3)', marginTop:2 } }, t.desc)
        );
      }),
      _h(ET.Sheet, { open:!!active, onClose:function(){ setActive(null); }, title:active?active.name:'' },
        active && (!showResult
          ? _h('div', null,
              _h('div', { className:'card card-accent', style:{ fontSize:'.78rem', color:'var(--t2)', marginBottom:14, lineHeight:1.5 } }, '📋 '+active.desc),
              active.questions.map(function(q,i){
                return _h('div', { key:i, style:{ marginBottom:12 } },
                  _h('div', { style:{ fontSize:'.82rem', marginBottom:6 } }, q.q),
                  _h('div', { style:{ display:'flex', gap:6 } },
                    [{v:true,l:'Tak'},{v:false,l:'Nie'}].map(function(o){
                      var a = answers[i]===o.v;
                      return _h('button', { key:String(o.v), className:'tag-btn'+(a?' active':''), style:{ flex:1 }, onClick:function(){ setAns(i,o.v); } }, o.l);
                    })
                  )
                );
              }),
              _h('button', { className:'btn btn-primary', style:{ width:'100%', marginTop:6 }, onClick:function(){ setShowResult(true); } }, 'Zobacz wynik')
            )
          : _h('div', null,
              flags.length===0
                ? _h('div', { style:{ textAlign:'center', padding:'16px 0' } },
                    _h('div', { style:{ fontSize:'2rem', marginBottom:8 } }, '✅'),
                    _h('div', { style:{ fontWeight:700, color:'var(--green)' } }, 'Brak wyraźnych odchyleń'),
                    _h('div', { style:{ fontSize:'.78rem', color:'var(--t2)', marginTop:6 } }, 'Wzorzec wygląda prawidłowo w tym teście.')
                  )
                : _h('div', null,
                    _h('div', { style:{ fontWeight:700, marginBottom:8 } }, 'Prawdopodobne problemy:'),
                    flags.map(function(f){
                      var cond = (ET.CONDITIONS||[]).find(function(c){ return c.tag===f; });
                      var ex = ET.exercisesByCondition ? (ET.exercisesByCondition(f)[0]) : null;
                      return _h('div', { key:f, className:'card', style:{ marginBottom:8, borderLeft:'3px solid var(--orange)' } },
                        _h('div', { style:{ fontWeight:700, fontSize:'.85rem' } }, cond?cond.label:f),
                        ex && _h('div', { style:{ fontSize:'.72rem', color:'var(--t2)', marginTop:3 } }, 'Sugerowane ćwiczenie: '+ex.name)
                      );
                    }),
                    _h('button', { className:'btn btn-primary', style:{ width:'100%', marginTop:6 }, onClick:addToAilments }, '➕ Dodaj do Dolegliwości i zaktualizuj blok')
                  ),
              _h('button', { className:'btn btn-ghost', style:{ width:'100%', marginTop:8 }, onClick:function(){ setShowResult(false); } }, '← Popraw odpowiedzi')
            )
        )
      )
    );
  }

  // ── ZAKŁADKA: POSTAWA ────────────────────────────────────────────────────
  function PostureTab() {
    var su = ET.useStore(); var store = su.store, update = su.update;
    var toast = ET.useToast();
    var fs = React.useState({}); var findings = fs[0], setFindings = fs[1];

    function toggle(k){ setFindings(function(p){ var o={}; o[k]=!p[k]; return Object.assign({},p,o); }); }

    var flagged = [];
    POSTURE.forEach(function(g){ g.items.forEach(function(it){ if (findings[it.k] && it.flag && flagged.indexOf(it.flag)===-1) flagged.push(it.flag); }); });

    function save() {
      var rec = { id:Date.now(), date:ET.dstr(), findings:Object.assign({},findings), flags:flagged.slice() };
      update(function(s){
        var st = Object.assign({}, s, { postureAssessments:[rec].concat(s.postureAssessments||[]) });
        if (ET.logChange) st = ET.logChange(st, { section:'assessment', title:'Ocena postawy', desc:flagged.length+' zaznaczonych odchyleń' });
        return st;
      });
      toast('Ocena postawy zapisana ✓', 'success');
      setFindings({});
    }
    function addToAilments() {
      update(function(s){
        var cur = s.ailments||[];
        var merged = cur.slice();
        flagged.forEach(function(f){ if (merged.indexOf(f)===-1) merged.push(f); });
        return Object.assign({}, s, { ailments:merged });
      });
      toast('Dodano do Dolegliwości ✓ — sprawdź blok korekcyjny', 'success');
    }

    var history = store.postureAssessments || [];

    return _h('div', null,
      _h(MovementTests, null),

      _h('div', { className:'card card-accent', style:{ fontSize:'.8rem', color:'var(--t2)', marginBottom:14, lineHeight:1.5 } },
        '💡 Poniżej zaznacz zaobserwowane odchylenia statyki. Wykryte problemy możesz przenieść do Dolegliwości, by dobrać ćwiczenia korekcyjne.'),

      POSTURE.map(function(g) {
        return _h('div', { key:g.group, style:{ marginBottom:14 } },
          _h('div', { style:{ fontSize:'.7rem', fontWeight:700, color:'var(--t3)', textTransform:'uppercase', letterSpacing:'.05em', marginBottom:8 } }, g.group),
          g.items.map(function(it) {
            var on = !!findings[it.k];
            return _h('div', { key:it.k, className:'suppl-item'+(on?' checked':''), onClick:function(){ toggle(it.k); } },
              _h('div', { className:'suppl-check' }, on?'✓':''),
              _h('div', { style:{ flex:1 } },
                _h('div', { style:{ fontWeight:600, fontSize:'.85rem' } }, it.l),
                it.flag && on && _h('div', { style:{ fontSize:'.62rem', color:'var(--orange)', marginTop:2 } }, '→ możliwa korekcja')
              )
            );
          })
        );
      }),

      flagged.length>0 && _h('div', { style:{ display:'flex', gap:8, marginBottom:12, flexWrap:'wrap' } },
        _h('button', { className:'btn btn-secondary btn-sm', onClick:addToAilments }, '➕ Dodaj '+flagged.length+' do Dolegliwości')
      ),
      _h('button', { className:'btn btn-primary', style:{ width:'100%' }, onClick:save }, 'Zapisz ocenę postawy'),

      history.length>0 && _h('div', { style:{ marginTop:16 } },
        _h('div', { style:{ fontSize:'.7rem', fontWeight:700, color:'var(--t3)', textTransform:'uppercase', letterSpacing:'.05em', marginBottom:8 } }, 'Historia ocen'),
        history.slice(0,8).map(function(h) {
          var cnt = Object.keys(h.findings||{}).filter(function(k){ return h.findings[k]; }).length;
          return _h('div', { key:h.id, style:{ display:'flex', justifyContent:'space-between', padding:'6px 0', borderBottom:'1px solid var(--b1)', fontSize:'.76rem' } },
            _h('span', { style:{ color:'var(--t2)' } }, ET.fmtDate(h.date)),
            _h('span', { style:{ color:cnt?'var(--orange)':'var(--green)' } }, cnt?cnt+' odchyleń':'brak odchyleń')
          );
        })
      )
    );
  }

  // ── ZAKŁADKA: CHECK-IN ───────────────────────────────────────────────────
  function CheckinTab() {
    var su = ET.useStore(); var store = su.store, update = su.update;
    var toast = ET.useToast();
    var fs = React.useState({ date:ET.dstr(), weight:'', appetite:3, libido:3, energy:3, motivation:3, painLoc:'', painLevel:0 });
    var f = fs[0], setF = fs[1];
    function up(k,v){ setF(function(p){ var o={}; o[k]=v; return Object.assign({},p,o); }); }

    function save() {
      var rec = Object.assign({ id:Date.now() }, f, { weight: f.weight!=='' ? parseFloat(f.weight) : null });
      update(function(s){
        var st = Object.assign({}, s, { checkins:[rec].concat(s.checkins||[]) });
        if (ET.logChange) st = ET.logChange(st, { section:'assessment', title:'Check-in tygodniowy', desc:'Energia '+f.energy+'/5 · Motywacja '+f.motivation+'/5' });
        return st;
      });
      toast('Check-in zapisany ✓', 'success');
      setF({ date:ET.dstr(), weight:'', appetite:3, libido:3, energy:3, motivation:3, painLoc:'', painLevel:0 });
    }

    var history = store.checkins || [];

    return _h('div', null,
      _h('div', { className:'card card-accent', style:{ fontSize:'.8rem', color:'var(--t2)', marginBottom:14, lineHeight:1.5 } },
        '💡 Wypełniaj raz w tygodniu, aby śledzić samopoczucie i regenerację w szerszym ujęciu.'),

      _h('div', { className:'grid-2' },
        _h('div', { className:'field' }, _h('label', null, 'Data'), _h('input', { type:'date', value:f.date, onChange:function(e){ up('date',e.target.value); } })),
        _h('div', { className:'field' }, _h('label', null, 'Waga (kg)'), _h('input', { type:'number', step:0.1, placeholder:'np. 82.5', value:f.weight, onChange:function(e){ up('weight',e.target.value); } }))
      ),

      SCALE5.map(function(sc) {
        return _h('div', { key:sc.k, className:'field' },
          _h('label', null, sc.icon+' '+sc.l),
          _h(Scale, { value:f[sc.k], onChange:function(v){ up(sc.k, v); } })
        );
      }),

      _h('div', { className:'field' },
        _h('label', null, '🤕 Ból — lokalizacja'),
        _h('input', { type:'text', placeholder:'np. prawe kolano, dolny grzbiet', value:f.painLoc, onChange:function(e){ up('painLoc',e.target.value); } })
      ),
      _h('div', { className:'field' },
        _h('label', { style:{ display:'flex', justifyContent:'space-between' } }, _h('span', null, 'Natężenie bólu'), _h('span', { style:{ color:f.painLevel>=6?'var(--red)':f.painLevel>=3?'var(--orange)':'var(--green)', fontWeight:700 } }, f.painLevel+'/10')),
        _h('div', { className:'slider-wrap' }, _h('input', { type:'range', min:0, max:10, value:f.painLevel, onChange:function(e){ up('painLevel',+e.target.value); } }))
      ),

      _h('button', { className:'btn btn-primary', style:{ width:'100%', marginTop:6 }, onClick:save }, 'Zapisz check-in'),

      history.length>0 && _h('div', { style:{ marginTop:16 } },
        _h('div', { style:{ fontSize:'.7rem', fontWeight:700, color:'var(--t3)', textTransform:'uppercase', letterSpacing:'.05em', marginBottom:8 } }, 'Historia check-inów'),
        history.slice(0,8).map(function(h) {
          return _h('div', { key:h.id, className:'card', style:{ marginBottom:6, padding:'10px 12px' } },
            _h('div', { style:{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:4 } },
              _h('span', { style:{ fontWeight:700, fontSize:'.8rem' } }, ET.fmtDate(h.date)),
              h.weight!=null && _h('span', { className:'chip', style:{ fontSize:'.65rem' } }, h.weight+' kg')
            ),
            _h('div', { style:{ display:'flex', gap:8, flexWrap:'wrap', fontSize:'.68rem', color:'var(--t2)' } },
              _h('span', null, '🍽 '+h.appetite),
              _h('span', null, '❤️ '+h.libido),
              _h('span', null, '⚡ '+h.energy),
              _h('span', null, '🔥 '+h.motivation),
              (h.painLevel>0||h.painLoc) && _h('span', { style:{ color:'var(--red)' } }, '🤕 '+(h.painLoc||'ból')+' '+h.painLevel+'/10')
            )
          );
        })
      )
    );
  }

  // ── MODUŁ ────────────────────────────────────────────────────────────────
  function AssessmentModule() {
    var tb = React.useState('tests'); var tab = tb[0], setTab = tb[1];
    var TABS = [{ id:'tests', l:'🧪 Testy' }, { id:'posture', l:'🧍 Postawa' }];
    return _h('div', { className:'fade-in' },
      _h('div', { className:'page-hdr' },
        _h('div', null,
          _h('h1', null, '🧪 Testy i ocena'),
          _h('p', null, 'Wydolność · postawa i wzorce ruchowe')
        ),
        _h('div', null)
      ),
      _h('div', { style:{ display:'flex', gap:6, marginBottom:16 } },
        TABS.map(function(t) {
          return _h('button', { key:t.id, className:'tag-btn'+(tab===t.id?' active':''), style:{ flex:1 }, onClick:function(){ setTab(t.id); } }, t.l);
        })
      ),
      tab==='tests' && _h(TestsTab, null),
      tab==='posture' && _h(PostureTab, null)
    );
  }

  ET.AssessmentModule = AssessmentModule;
})();
