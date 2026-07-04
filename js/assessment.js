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
    { id:'onerm', cat:'Siła', name:'Test siły (1RM est.)', icon:'🏋️', unit:'kg',
      hint:'Podnieś ciężar na kilka powtórzeń — oszacujemy 1RM (Epley).',
      inputs:[
        { k:'weight', l:'Ciężar (kg)', min:1, max:400, step:2.5, def:80 },
        { k:'reps', l:'Powtórzenia', min:1, max:15, step:1, def:5 }
      ],
      evaluate:function(v, p){
        var e1rm = v.weight * (1 + v.reps/30);
        var bw = (p&&p.weight)||0;
        var b;
        if (bw>0) {
          var ratio = e1rm/bw;
          b = ratio<0.75?band('Początkujący','var(--orange)'):ratio<1.25?band('Średniozaawansowany','var(--green)'):band('Zaawansowany','var(--a-light)');
          b.extra = '1RM ≈ '+e1rm.toFixed(0)+' kg · '+ratio.toFixed(2)+'× masy ciała';
        } else {
          b = band('1RM ≈ '+e1rm.toFixed(0)+' kg','var(--a-light)');
          b.extra = 'Uzupełnij wagę w profilu, by ocenić względem masy ciała.';
        }
        return b;
      }
    },
  ];
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

  // ── ZAKŁADKA: TESTY ──────────────────────────────────────────────────────
  function TestsTab() {
    var su = ET.useStore(); var store = su.store, update = su.update;
    var toast = ET.useToast();
    var sel = React.useState(null); var active = sel[0], setActive = sel[1];
    var vs = React.useState({}); var vals = vs[0], setVals = vs[1];

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

    return _h('div', null,
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
          var t = testById(r.testId) || { name:r.testId, icon:'🧪' };
          return _h('div', { key:r.id, style:{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'7px 0', borderBottom:'1px solid var(--b1)' } },
            _h('div', null,
              _h('div', { style:{ fontSize:'.78rem', fontWeight:600 } }, t.icon+' '+t.name),
              _h('div', { style:{ fontSize:'.66rem', color:'var(--t3)' } }, ET.fmtDate(r.date)+(r.result.extra?' · '+r.result.extra:''))
            ),
            _h('span', { style:{ fontSize:'.66rem', fontWeight:700, color:r.result.color } }, r.result.label)
          );
        })
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
      _h('div', { className:'card card-accent', style:{ fontSize:'.8rem', color:'var(--t2)', marginBottom:14, lineHeight:1.5 } },
        '💡 Zaznacz zaobserwowane odchylenia statyki i wzorców ruchowych. Wykryte problemy możesz przenieść do Dolegliwości, by dobrać ćwiczenia korekcyjne.'),

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
    var TABS = [{ id:'tests', l:'🧪 Testy' }, { id:'posture', l:'🧍 Postawa' }, { id:'checkin', l:'📋 Check-in' }];
    return _h('div', { className:'fade-in' },
      _h('div', { className:'page-hdr' },
        _h('div', null,
          _h('h1', null, '🧪 Testy i ocena'),
          _h('p', null, 'Wydolność · postawa · check-in tygodniowy')
        ),
        _h('div', null)
      ),
      _h('div', { style:{ display:'flex', gap:6, marginBottom:16 } },
        TABS.map(function(t) {
          return _h('button', { key:t.id, className:'tag-btn'+(tab===t.id?' active':''), style:{ flex:1 }, onClick:function(){ setTab(t.id); } }, t.l);
        })
      ),
      tab==='tests' && _h(TestsTab, null),
      tab==='posture' && _h(PostureTab, null),
      tab==='checkin' && _h(CheckinTab, null)
    );
  }

  ET.AssessmentModule = AssessmentModule;
})();
