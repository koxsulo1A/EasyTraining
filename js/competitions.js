(function() {
  'use strict';
  window.ET = window.ET || {};
  var _h = React.createElement;

  var COMP_TYPES = [
    { id:'powerlifting', label:'Trójbój', icon:'🏋️' },
    { id:'running', label:'Bieganie', icon:'🏃' },
    { id:'crossfit', label:'CrossFit', icon:'💪' },
    { id:'bodybuilding', label:'Kulturystyka', icon:'🥇' },
    { id:'weightlifting', label:'Podnoszenie', icon:'⚡' },
    { id:'other', label:'Inne', icon:'🏆' },
  ];

  function CompetitionsModule() {
    var su = ET.useStore(); var store = su.store, update = su.update;
    var toast = ET.useToast();
    var sa = React.useState(false); var showAdd = sa[0], setShowAdd = sa[1];
    var sr = React.useState(null); var showResult = sr[0], setShowResult = sr[1];
    var fs = React.useState({ name:'', date:'', type:'powerlifting', location:'', goal:'', notes:'' });
    var f = fs[0], setF = fs[1];
    function upF(key, val) { setF(function(prev){ var o={}; o[key]=val; return Object.assign({},prev,o); }); }
    var rfs = React.useState({ place:'', score:'', scoreUnit:'', notes:'' });
    var rf = rfs[0], setRf = rfs[1];
    function upRf(key, val) { setRf(function(prev){ var o={}; o[key]=val; return Object.assign({},prev,o); }); }

    function addComp() {
      if (!f.name||!f.date) { toast('Podaj nazwę i datę zawodów', 'error'); return; }
      update(function(s){ return Object.assign({},s,{ competitions:[Object.assign({id:Date.now(),status:'upcoming'},f)].concat(s.competitions||[]) }); });
      toast('Zawody dodane ✓', 'success'); setShowAdd(false);
      setF({ name:'', date:'', type:'powerlifting', location:'', goal:'', notes:'' });
    }

    function saveResult() {
      update(function(s){
        return Object.assign({},s,{ competitions:(s.competitions||[]).map(function(c){
          return c.id===showResult ? Object.assign({},c,{ status:'completed', result:rf }) : c;
        })});
      });
      toast('Wynik zapisany ✓', 'success'); setShowResult(null);
      setRf({ place:'', score:'', scoreUnit:'', notes:'' });
    }

    var comps = store.competitions||[];
    var today = ET.dstr();
    var upcoming = comps.filter(function(c){ return c.status!=='completed'&&c.date>=today; });
    var completed = comps.filter(function(c){ return c.status==='completed'||c.date<today; });
    var rComp = comps.find(function(c){ return c.id===showResult; });

    function typeInfo(id) { return COMP_TYPES.find(function(t){ return t.id===id; })||COMP_TYPES[5]; }

    return _h('div', { className:'fade-in' },
      _h('div', { className:'page-hdr' },
        _h('div', null,
          _h('h1', null, 'Zawody'),
          _h('p', null, upcoming.length+' nadchodzących · '+completed.length+' ukończonych')
        ),
        _h('button', { className:'btn btn-primary', onClick:function(){ setShowAdd(true); } }, '+ Dodaj zawody')
      ),

      upcoming.length>0 && _h('div', { style:{ marginBottom:20 } },
        _h('div', { className:'section-hdr' }, _h('h2', null, 'Nadchodzące')),
        upcoming.sort(function(a,b){ return a.date>b.date?1:-1; }).map(function(c) {
          var ti = typeInfo(c.type);
          var days = ET.daysUntil(c.date);
          return _h('div', { key:c.id, className:'comp-card upcoming' },
            _h('div', { style:{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:8 } },
              _h('div', null,
                _h('div', { style:{ fontWeight:700, fontSize:'1rem', marginBottom:3 } }, ti.icon+' '+c.name),
                _h('div', { style:{ fontSize:'.78rem', color:'var(--t2)' } }, ET.fmtDate(c.date)+(c.location?' · '+c.location:'')),
                days>=0 && _h('div', { className:'comp-countdown' }, days===0?'🎯 DZISIAJ!':days===1?'⏰ JUTRO!':'⏱ Za '+days+' dni'),
                c.goal && _h('div', { style:{ fontSize:'.78rem', color:'var(--t3)', marginTop:6 } }, '🎯 Cel: '+c.goal)
              ),
              _h('div', { style:{ display:'flex', gap:6 } },
                _h('div', { className:'badge badge-blue' }, ti.label),
                _h('button', { className:'btn btn-sm btn-ghost', onClick:function(){ setShowResult(c.id); } }, 'Wynik')
              )
            )
          );
        })
      ),

      completed.length>0 && _h('div', null,
        _h('div', { className:'section-hdr' }, _h('h2', null, 'Ukończone')),
        completed.sort(function(a,b){ return a.date>b.date?-1:1; }).map(function(c) {
          var ti = typeInfo(c.type);
          return _h('div', { key:c.id, className:'comp-card completed' },
            _h('div', { style:{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:8 } },
              _h('div', null,
                _h('div', { style:{ fontWeight:700, fontSize:'.95rem', marginBottom:3 } }, ti.icon+' '+c.name),
                _h('div', { style:{ fontSize:'.72rem', color:'var(--t3)' } }, ET.fmtDate(c.date)+(c.location?' · '+c.location:'')),
                c.result && _h('div', { style:{ marginTop:6, display:'flex', gap:8, flexWrap:'wrap' } },
                  c.result.place && _h('span', { className:'badge badge-yellow' }, '🥇 '+c.result.place+'. miejsce'),
                  c.result.score && _h('span', { className:'badge badge-green' }, c.result.score+' '+c.result.scoreUnit),
                  c.result.notes && _h('div', { style:{ fontSize:'.72rem', color:'var(--t2)', width:'100%', marginTop:2, fontStyle:'italic' } }, c.result.notes)
                )
              ),
              _h('div', null,
                !c.result && _h('button', { className:'btn btn-sm btn-ghost', onClick:function(){ setShowResult(c.id); } }, 'Dodaj wynik')
              )
            )
          );
        })
      ),

      comps.length===0 && _h(ET.Placeholder, { icon:'🏆', title:'Brak zawodów', desc:'Planuj starty i rejestruj wyniki zawodów.' }),

      _h(ET.Sheet, { open:showAdd, onClose:function(){ setShowAdd(false); }, title:'Nowe zawody' },
        _h('div', { className:'field' }, _h('label', null, 'Nazwa *'), _h('input', { type:'text', placeholder:'np. Mistrzostwa Polski', value:f.name, onChange:function(e){ upF('name',e.target.value); } })),
        _h('div', { className:'grid-2' },
          _h('div', { className:'field' }, _h('label', null, 'Data *'), _h('input', { type:'date', value:f.date, onChange:function(e){ upF('date',e.target.value); } })),
          _h('div', { className:'field' }, _h('label', null, 'Miasto'), _h('input', { type:'text', placeholder:'np. Warszawa', value:f.location, onChange:function(e){ upF('location',e.target.value); } }))
        ),
        _h('div', { className:'field' },
          _h('label', null, 'Dyscyplina'),
          _h('div', { style:{ display:'flex', gap:6, flexWrap:'wrap' } },
            COMP_TYPES.map(function(t){ return _h('button', { key:t.id, className:'tag-btn'+(f.type===t.id?' active':''), onClick:function(){ upF('type',t.id); } }, t.icon+' '+t.label); })
          )
        ),
        _h('div', { className:'field' }, _h('label', null, 'Cel'), _h('input', { type:'text', placeholder:'np. Top 10, PR na ławce', value:f.goal, onChange:function(e){ upF('goal',e.target.value); } })),
        _h('div', { className:'field' }, _h('label', null, 'Notatki'), _h('textarea', { value:f.notes, onChange:function(e){ upF('notes',e.target.value); }, style:{ minHeight:60 } })),
        _h('button', { className:'btn btn-primary', style:{ width:'100%' }, onClick:addComp }, 'Dodaj zawody')
      ),

      rComp && _h(ET.Sheet, { open:!!showResult, onClose:function(){ setShowResult(null); }, title:'Wynik — '+rComp.name },
        _h('div', { className:'grid-2' },
          _h('div', { className:'field' }, _h('label', null, 'Miejsce'), _h('input', { type:'number', min:1, placeholder:'np. 5', value:rf.place, onChange:function(e){ upRf('place',e.target.value); } })),
          _h('div', { className:'field' }, _h('label', null, 'Wynik'), _h('input', { type:'text', placeholder:'np. 580', value:rf.score, onChange:function(e){ upRf('score',e.target.value); } }))
        ),
        _h('div', { className:'field' }, _h('label', null, 'Jednostka'), _h('input', { type:'text', placeholder:'np. kg, pkt, min', value:rf.scoreUnit, onChange:function(e){ upRf('scoreUnit',e.target.value); } })),
        _h('div', { className:'field' }, _h('label', null, 'Podsumowanie'), _h('textarea', { value:rf.notes, onChange:function(e){ upRf('notes',e.target.value); }, placeholder:'Jak poszło? Co zadziałało? Co poprawić?' })),
        _h('button', { className:'btn btn-primary', style:{ width:'100%' }, onClick:saveResult }, 'Zapisz wynik')
      )
    );
  }

  ET.CompetitionsModule = CompetitionsModule;
})();
