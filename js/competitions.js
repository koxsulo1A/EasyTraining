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

  // Klasyczny widok — bez zmian, ścieżka WEB. Patrz dispatcher
  // `CompetitionsModule` i `CompetitionsModuleMobile` poniżej.
  function CompetitionsModuleClassic() {
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

  // Web zostaje przy widoku klasycznym; iOS dostaje redesign „Aurora Glass".
  function CompetitionsModule() {
    return ET.IS_WEB ? _h(CompetitionsModuleClassic, null) : _h(CompetitionsModuleMobile, null);
  }

  var MEDAL_COLOR = { 1:'#F59E0B', 2:'#C0C0D8', 3:'#B87333' };

  // ── ZAWODY (iOS) — redesign „Aurora Glass" ────────────────────────────────
  // Handoff sekcja 12: karta różowa najbliższego startu z odliczeniem, pasek
  // fazy treningowej (BLOK SIŁOWY→PEAKING), karta kategorii wagowej, 3 fazy
  // przygotowania, lista poprzednich startów z kolorem medalu.
  // Odstępstwa (real data, bez fabrykacji): apka NIE MA żadnego pola kategorii
  // wagowej ani fazy treningowej powiązanej z konkretnymi zawodami (sprawdzony
  // kształt store.competitions: name/date/type/location/goal/notes/status/
  // result — nic więcej). Pasek fazy i karta kategorii wagowej wymagałyby
  // DODANIA nowych pól wejściowych (poza zakresem redesignu widoku) — pominięte
  // zamiast zmyślać wartości. Zostaje: hero najbliższego startu z realnym
  // odliczeniem dni (`ET.daysUntil`), i lista poprzednich startów z kolorem
  // medalu — to jest w pełni realne z istniejących wyników.
  function CompetitionsModuleMobile() {
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

    var comps = store.competitions || [];
    var today = ET.dstr();
    var upcoming = comps.filter(function(c){ return c.status!=='completed' && c.date>=today; }).sort(function(a,b){ return a.date>b.date?1:-1; });
    var completed = comps.filter(function(c){ return c.status==='completed' || c.date<today; }).sort(function(a,b){ return a.date>b.date?-1:1; });
    var rComp = comps.find(function(c){ return c.id===showResult; });
    var hero = upcoming[0] || null;
    var restUpcoming = upcoming.slice(1);
    var withPlace = completed.filter(function(c){ return c.result && c.result.place; });

    function typeInfo(id) { return COMP_TYPES.find(function(t){ return t.id===id; }) || COMP_TYPES[5]; }

    return _h('div', { className:'scr-in' },
      _h('div', { style:{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:18 } },
        _h('div', { style:{ fontSize:27, fontWeight:800, letterSpacing:'-.03em' } }, 'Zawody'),
        _h('button', { onClick:function(){ setShowAdd(true); },
          style:{ width:36, height:36, borderRadius:'50%', border:'none', background:'var(--pink)', color:'#fff', fontSize:18, fontWeight:700, cursor:'pointer' } }, '+')
      ),

      comps.length===0 && _h(ET.Placeholder, { icon:'🏆', title:'Brak zawodów', desc:'Planuj starty i rejestruj wyniki zawodów.' }),

      // ── HERO: NAJBLIŻSZY START ────────────────────────────────────────
      hero && (function() {
        var ti = typeInfo(hero.type);
        var days = ET.daysUntil(hero.date);
        return _h('div', { className:'glass', style:{ padding:20, borderRadius:22, marginBottom:16, position:'relative', overflow:'hidden',
          background:'linear-gradient(158deg,rgba(236,72,153,.16),rgba(255,255,255,.02))', border:'1px solid rgba(236,72,153,.3)' } },
          _h('div', { style:{ position:'absolute', top:-60, right:-60, width:160, height:160, borderRadius:'50%', background:'radial-gradient(circle,rgba(236,72,153,.35),transparent 70%)', pointerEvents:'none' } }),
          _h('div', { style:{ position:'relative' } },
            _h('div', { style:{ display:'inline-flex', alignItems:'center', gap:6, padding:'4px 10px', borderRadius:100, background:'rgba(236,72,153,.16)', marginBottom:10 } },
              _h('span', { style:{ fontSize:10, fontWeight:800, letterSpacing:'.08em', color:'var(--pink)', textTransform:'uppercase' } },
                ET.fmtDate(hero.date) + (hero.location ? ' · ' + hero.location : ''))
            ),
            _h('div', { style:{ fontSize:21, fontWeight:800, letterSpacing:'-.02em', marginBottom:10 } }, ti.icon + ' ' + hero.name),
            days != null && days >= 0 && _h('div', { style:{ marginBottom:8 } },
              _h('span', { style:{ fontSize:40, fontWeight:800, letterSpacing:'-.03em', color:'var(--pink)' } }, days===0 ? 'DZIŚ' : days),
              days > 0 && _h('span', { style:{ fontSize:13, fontWeight:700, color:'var(--t2)', marginLeft:8 } }, 'dni zostało')
            ),
            hero.goal && _h('div', { style:{ fontSize:12.5, color:'var(--t2)', marginTop:6 } }, '🎯 ' + hero.goal),
            _h('div', { style:{ display:'flex', gap:8, marginTop:14 } },
              _h('span', { className:'chip' }, ti.label),
              _h('button', { onClick:function(){ setShowResult(hero.id); },
                style:{ marginLeft:'auto', padding:'6px 14px', borderRadius:100, border:'1px solid rgba(236,72,153,.4)', background:'rgba(236,72,153,.12)', color:'var(--pink)', fontSize:11.5, fontWeight:700, cursor:'pointer' } }, 'Wpisz wynik')
            )
          )
        );
      })(),

      // ── POZOSTAŁE NADCHODZĄCE ────────────────────────────────────────
      restUpcoming.length > 0 && _h('div', { style:{ marginBottom:20 } },
        _h('div', { style:{ fontSize:10, fontWeight:800, letterSpacing:'.1em', color:'var(--t3)', textTransform:'uppercase', marginBottom:10 } }, 'Nadchodzące'),
        _h('div', { style:{ display:'flex', flexDirection:'column', gap:8 } },
          restUpcoming.map(function(c) {
            var ti = typeInfo(c.type);
            var days = ET.daysUntil(c.date);
            return _h('div', { key:c.id, style:{ display:'flex', alignItems:'center', gap:12, padding:'11px 14px', borderRadius:16, background:'var(--s2)', border:'1px solid var(--b1)' } },
              _h('span', { style:{ fontSize:18, flexShrink:0 } }, ti.icon),
              _h('div', { style:{ flex:1, minWidth:0 } },
                _h('div', { style:{ fontSize:13, fontWeight:700 } }, c.name),
                _h('div', { style:{ fontSize:11, color:'var(--t3)', marginTop:2 } }, ET.fmtDate(c.date) + (c.location ? ' · ' + c.location : ''))
              ),
              days != null && _h('span', { style:{ fontSize:11.5, fontWeight:700, color:'var(--pink)', flexShrink:0 } }, 'za ' + days + ' dni')
            );
          })
        )
      ),

      // ── POPRZEDNIE STARTY ─────────────────────────────────────────────
      completed.length > 0 && _h('div', { style:{ marginBottom:20 } },
        _h('div', { style:{ fontSize:10, fontWeight:800, letterSpacing:'.1em', color:'var(--t3)', textTransform:'uppercase', marginBottom:10 } }, 'Poprzednie starty'),
        _h('div', { style:{ display:'flex', flexDirection:'column', gap:8 } },
          completed.map(function(c) {
            var ti = typeInfo(c.type);
            var place = c.result && c.result.place ? +c.result.place : null;
            var medalColor = place && MEDAL_COLOR[place] ? MEDAL_COLOR[place] : 'var(--t3)';
            return _h('div', { key:c.id, onClick:function(){ if (!c.result) setShowResult(c.id); },
              style:{ display:'flex', alignItems:'center', gap:12, padding:'11px 14px', borderRadius:16, background:'var(--s2)', border:'1px solid var(--b1)', cursor: c.result?'default':'pointer' } },
              _h('div', { style:{ width:28, height:28, borderRadius:9, flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:800,
                background: place ? 'color-mix(in srgb,'+medalColor+' 22%, transparent)' : 'var(--s3)', color: place ? medalColor : 'var(--t3)' } },
                place ? place : ti.icon),
              _h('div', { style:{ flex:1, minWidth:0 } },
                _h('div', { style:{ fontSize:13, fontWeight:700 } }, c.name),
                _h('div', { style:{ fontSize:11, color:'var(--t3)', marginTop:2 } }, ET.fmtDate(c.date))
              ),
              c.result && c.result.score
                ? _h('span', { style:{ fontSize:12, fontWeight:700, color:'var(--green)', flexShrink:0 } }, c.result.score + ' ' + (c.result.scoreUnit||''))
                : !c.result && _h('span', { style:{ fontSize:11, fontWeight:700, color:'var(--pink)', flexShrink:0 } }, 'Dodaj wynik')
            );
          })
        )
      ),

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
