(function() {
  'use strict';
  window.ET = window.ET || {};
  var _h = React.createElement;

  var TIMINGS = [
    { id:'morning',     label:'Rano',         icon:'🌅' },
    { id:'preworkout',  label:'Przed',         icon:'⚡' },
    { id:'postworkout', label:'Po',            icon:'💪' },
    { id:'evening',     label:'Wieczór',       icon:'🌙' },
    { id:'night',       label:'Noc',           icon:'😴' },
  ];

  var UNITS = ['g','mg','ml','mcg','IU','kapsułka','tabletka','łyżka'];

  var CAT_COLORS = {
    'Siła':         'var(--orange)',
    'Hipertrofia':  'var(--a)',
    'Wydolność':    'var(--green)',
    'Bieganie':     'var(--teal)',
    'Regeneracja':  'var(--purple)',
    'Sen':          'var(--a)',
    'Koncentracja': 'var(--yellow)',
    'Stres':        'var(--red)',
    'Hormony':      'var(--orange)',
    'Zdrowie':      'var(--green)',
    'Stawy':        'var(--teal)',
    'Dieta roślinna':'var(--green)',
    'ADHD':         'var(--yellow)',
    'Mózg':         'var(--purple)',
    'Witaminy i minerały': 'var(--teal)',
    'Serce':        'var(--red)',
    'Odporność':    'var(--green)',
    'Redukcja':     'var(--orange)',
    'Adaptogeny':   'var(--purple)',
    'Kości':        'var(--teal)',
    'Nastrój':      'var(--yellow)',
    'Skóra':        'var(--a)',
    'Wątroba':      'var(--green)',
    'Tarczyca':     'var(--teal)',
    'Krew':         'var(--red)',
    'Energia':      'var(--yellow)',
    'Pamięć':       'var(--purple)',
    'Gospodarka glukozowa': 'var(--green)',
    'Libido':       'var(--red)',
  };

  function catColor(cat) { return CAT_COLORS[cat] || 'var(--a)'; }

  function findDbEntry(name) {
    var db = (typeof ET.SUPP_DB !== 'undefined') ? ET.SUPP_DB : [];
    var nl = name ? name.toLowerCase() : '';
    return db.find(function(x){ return x.name.toLowerCase() === nl; }) || null;
  }

  // ── Tagi przyjmowania (z czym brać) — z bazy + znane grupy rozpuszczalne w tłuszczach ──
  function intakeTags(name) {
    var db = findDbEntry(name);
    var txt = db ? ((db.howToTake||[]).join(' ')+' '+(db.absorb||[]).join(' ')).toLowerCase() : '';
    var n = (name||'').toLowerCase();
    var tags = [];
    var fatSoluble = /witamina d|witamina k|witamina a|witamina e|omega|kryla|wiesiołka|kurkumina|koenzym q10|astaksantyna|luteina|zeaksantyna|likopen|cla\b/.test(n);
    if (fatSoluble || /tłuszcz/.test(txt)) tags.push({ t:'🥑 z tłuszczem', c:'var(--yellow)' });
    if (/pusty żołądek|na czczo/.test(txt)) tags.push({ t:'⭕ na czczo', c:'var(--purple)' });
    else if (/z posiłkiem/.test(txt)) tags.push({ t:'🍽 z posiłkiem', c:'var(--green)' });
    if (/z wodą|dużą ilością wody|rozpuścić w wodzie/.test(txt)) tags.push({ t:'💧 z wodą', c:'var(--a-light)' });
    return tags.slice(0,3);
  }

  // ── Pary suplementów, których NIE należy przyjmować razem (rozdziel min. 2 h) ──
  var INTERACTIONS = [
    ['żelazo','wapń'], ['żelazo','cynk'], ['żelazo','magnez'],
    ['żelazo','kofeina'], ['żelazo','zielonej herbaty'], ['żelazo','guarana'],
    ['cynk','wapń'], ['cynk','miedź'], ['wapń','magnez'],
    ['melatonina','kofeina'], ['zma','wapń'], ['zma','żelazo'],
  ];
  function conflictsWithin(entry, group) {
    var n = (entry.name||'').toLowerCase();
    var out = [];
    group.forEach(function(o){
      if (o.id===entry.id) return;
      var on = (o.name||'').toLowerCase();
      INTERACTIONS.forEach(function(p){
        if ((n.indexOf(p[0])!==-1 && on.indexOf(p[1])!==-1) || (n.indexOf(p[1])!==-1 && on.indexOf(p[0])!==-1)) {
          if (out.indexOf(o.name)===-1) out.push(o.name);
        }
      });
    });
    return out;
  }

  // ── Baza Detail Sheet ─────────────────────────────────────────────────────
  function SuppDetail(props) {
    var s = props.supp;
    var onAdd = props.onAdd;
    if (!s) return null;

    return _h('div', null,
      _h('div', { style:{ textAlign:'center', padding:'10px 0 14px' } },
        _h('div', { style:{ fontSize:'2.4rem' } }, s.icon),
        _h('div', { style:{ fontWeight:700, fontSize:'1.05rem', marginTop:6 } }, s.name),
        _h('div', { style:{ fontSize:'.72rem', color:'var(--t3)', marginTop:2 } }, s.nameEn),
        _h('div', { style:{ display:'flex', gap:4, flexWrap:'wrap', justifyContent:'center', marginTop:8 } },
          s.cat.map(function(c) {
            return _h('span', { key:c, style:{ fontSize:'.6rem', padding:'2px 8px', borderRadius:99, background:catColor(c)+'22', color:catColor(c), fontWeight:700 } }, c);
          })
        )
      ),

      _h('div', { style:{ background:'var(--s3)', borderRadius:'var(--r2)', padding:'10px 12px', marginBottom:12, fontSize:'.78rem', color:'var(--t2)', lineHeight:1.6 } }, s.desc),

      _h('div', { className:'grid-2', style:{ marginBottom:12 } },
        _h('div', { style:{ background:'var(--s3)', borderRadius:'var(--r2)', padding:'10px 12px' } },
          _h('div', { style:{ fontSize:'.6rem', fontWeight:700, color:'var(--t3)', textTransform:'uppercase', letterSpacing:'.05em', marginBottom:4 } }, '💊 Dawka optymalna'),
          _h('div', { style:{ fontSize:'.82rem', fontWeight:700, color:'var(--green)' } }, s.optDose)
        ),
        _h('div', { style:{ background:'var(--s3)', borderRadius:'var(--r2)', padding:'10px 12px' } },
          _h('div', { style:{ fontSize:'.6rem', fontWeight:700, color:'var(--t3)', textTransform:'uppercase', letterSpacing:'.05em', marginBottom:4 } }, '⏰ Kiedy'),
          s.timing.map(function(t,i){ return _h('div', { key:i, style:{ fontSize:'.75rem', color:'var(--t2)' } }, t); })
        )
      ),

      s.forms && s.forms.length > 0 && _h('div', { style:{ marginBottom:12 } },
        _h('div', { style:{ fontSize:'.65rem', fontWeight:700, color:'var(--t3)', textTransform:'uppercase', letterSpacing:'.05em', marginBottom:6 } }, '🧪 Standaryzacja / Formy'),
        _h('div', { style:{ background:'var(--s3)', borderRadius:'var(--r2)', padding:'8px 12px' } },
          s.forms.map(function(fm, i){ return _h('div', { key:i, style:{ fontSize:'.72rem', color:'var(--t2)', padding:'3px 0', borderBottom: i < s.forms.length-1 ? '1px solid var(--b1)' : 'none' } }, fm); })
        )
      ),

      s.howToTake && s.howToTake.length > 0 && _h('div', { style:{ marginBottom:12 } },
        _h('div', { style:{ fontSize:'.65rem', fontWeight:700, color:'var(--t3)', textTransform:'uppercase', letterSpacing:'.05em', marginBottom:6 } }, '📋 Jak stosować'),
        _h('ul', { style:{ margin:0, paddingLeft:16 } },
          s.howToTake.map(function(h,i){ return _h('li', { key:i, style:{ fontSize:'.72rem', color:'var(--t2)', marginBottom:3, lineHeight:1.5 } }, h); })
        )
      ),

      s.absorb && s.absorb.length > 0 && _h('div', { style:{ marginBottom:12 } },
        _h('div', { style:{ fontSize:'.65rem', fontWeight:700, color:'var(--t3)', textTransform:'uppercase', letterSpacing:'.05em', marginBottom:6 } }, '⬆️ Zwiększa wchłanianie'),
        _h('div', { style:{ display:'flex', gap:4, flexWrap:'wrap' } },
          s.absorb.map(function(a){ return _h('span', { key:a, className:'chip', style:{ fontSize:'.65rem', color:'var(--green)' } }, a); })
        )
      ),

      s.synergies && s.synergies.length > 0 && _h('div', { style:{ marginBottom:12 } },
        _h('div', { style:{ fontSize:'.65rem', fontWeight:700, color:'var(--t3)', textTransform:'uppercase', letterSpacing:'.05em', marginBottom:6 } }, '🤝 Synergie'),
        _h('div', { style:{ display:'flex', gap:4, flexWrap:'wrap' } },
          s.synergies.map(function(sy){ return _h('span', { key:sy, className:'chip', style:{ fontSize:'.65rem', color:'var(--a-light)' } }, sy); })
        )
      ),

      (s.avoidSupp || s.avoidFood || s.avoidMeds) && _h('div', { style:{ marginBottom:12 } },
        _h('div', { style:{ fontSize:'.65rem', fontWeight:700, color:'var(--t3)', textTransform:'uppercase', letterSpacing:'.05em', marginBottom:6 } }, '🚫 Unikaj łączenia'),
        _h('div', { style:{ background:'rgba(239,68,68,.06)', border:'1px solid rgba(239,68,68,.2)', borderRadius:'var(--r2)', padding:'8px 12px' } },
          s.avoidSupp && _h('div', { style:{ fontSize:'.72rem', color:'var(--red)', marginBottom:3 } }, '💊 '+s.avoidSupp),
          s.avoidFood && _h('div', { style:{ fontSize:'.72rem', color:'var(--red)', marginBottom:3 } }, '🍽 '+s.avoidFood),
          s.avoidMeds && _h('div', { style:{ fontSize:'.72rem', color:'var(--red)' } }, '💉 '+s.avoidMeds)
        )
      ),

      s.mistakes && s.mistakes.length > 0 && _h('div', { style:{ marginBottom:12 } },
        _h('div', { style:{ fontSize:'.65rem', fontWeight:700, color:'var(--t3)', textTransform:'uppercase', letterSpacing:'.05em', marginBottom:6 } }, '⚠️ Częste błędy'),
        _h('ul', { style:{ margin:0, paddingLeft:16 } },
          s.mistakes.map(function(m,i){ return _h('li', { key:i, style:{ fontSize:'.72rem', color:'var(--t2)', marginBottom:3, lineHeight:1.5 } }, m); })
        )
      ),

      s.worth && _h('div', { style:{ background:'rgba(34,197,94,.08)', border:'1px solid rgba(34,197,94,.25)', borderRadius:'var(--r2)', padding:'8px 12px', marginBottom:14 } },
        _h('div', { style:{ fontSize:'.65rem', fontWeight:700, color:'var(--t3)', textTransform:'uppercase', letterSpacing:'.05em', marginBottom:3 } }, '✅ Czy warto?'),
        _h('div', { style:{ fontSize:'.75rem', color:'var(--green)', lineHeight:1.5 } }, s.worth)
      ),

      onAdd && _h('button', { className:'btn btn-primary', style:{ width:'100%' }, onClick:function(){ onAdd(s); } }, '+ Dodaj do moich suplementów')
    );
  }

  // ── Plan Dzienny Detail Sheet ─────────────────────────────────────────────
  function PlanDetail(props) {
    var entry = props.entry;
    var db = findDbEntry(entry ? entry.name : '');
    if (!entry) return null;

    var tInfo = TIMINGS.find(function(t){ return t.id === entry.timing; }) || TIMINGS[0];

    return _h('div', null,
      _h('div', { style:{ textAlign:'center', padding:'8px 0 14px' } },
        _h('div', { style:{ fontSize:'2.2rem' } }, db ? db.icon : '💊'),
        _h('div', { style:{ fontWeight:700, fontSize:'1.05rem', marginTop:6 } }, entry.name),
        entry.dose && _h('div', { style:{ fontSize:'.8rem', color:'var(--green)', fontWeight:700, marginTop:4 } }, entry.dose+' '+entry.unit+' · '+tInfo.icon+' '+tInfo.label),
        entry.notes && _h('div', { style:{ fontSize:'.72rem', color:'var(--t3)', marginTop:4 } }, entry.notes)
      ),

      db && _h('div', null,
        db.desc && _h('div', { style:{ background:'var(--s3)', borderRadius:'var(--r2)', padding:'10px 12px', marginBottom:12, fontSize:'.78rem', color:'var(--t2)', lineHeight:1.6 } }, db.desc),

        db.howToTake && db.howToTake.length > 0 && _h('div', { style:{ marginBottom:12 } },
          _h('div', { style:{ fontSize:'.65rem', fontWeight:700, color:'var(--t3)', textTransform:'uppercase', letterSpacing:'.05em', marginBottom:6 } }, '📋 Jak przyjmować'),
          _h('ul', { style:{ margin:0, paddingLeft:16 } },
            db.howToTake.map(function(h,i){ return _h('li', { key:i, style:{ fontSize:'.72rem', color:'var(--t2)', marginBottom:3, lineHeight:1.5 } }, h); })
          )
        ),

        db.absorb && db.absorb.length > 0 && _h('div', { style:{ marginBottom:12 } },
          _h('div', { style:{ fontSize:'.65rem', fontWeight:700, color:'var(--t3)', textTransform:'uppercase', letterSpacing:'.05em', marginBottom:6 } }, '⬆️ Zwiększa wchłanianie'),
          _h('div', { style:{ display:'flex', gap:4, flexWrap:'wrap' } },
            db.absorb.map(function(a){ return _h('span', { key:a, className:'chip', style:{ fontSize:'.65rem', color:'var(--green)' } }, a); })
          )
        ),

        db.synergies && db.synergies.length > 0 && _h('div', { style:{ marginBottom:12 } },
          _h('div', { style:{ fontSize:'.65rem', fontWeight:700, color:'var(--t3)', textTransform:'uppercase', letterSpacing:'.05em', marginBottom:6 } }, '🤝 Najlepiej łączyć z'),
          _h('div', { style:{ display:'flex', gap:4, flexWrap:'wrap' } },
            db.synergies.map(function(sy){ return _h('span', { key:sy, className:'chip', style:{ fontSize:'.65rem', color:'var(--a-light)' } }, sy); })
          )
        ),

        (db.avoidSupp || db.avoidFood || db.avoidMeds) && _h('div', { style:{ marginBottom:12 } },
          _h('div', { style:{ fontSize:'.65rem', fontWeight:700, color:'var(--t3)', textTransform:'uppercase', letterSpacing:'.05em', marginBottom:6 } }, '🚫 Unikaj łączenia'),
          _h('div', { style:{ background:'rgba(239,68,68,.06)', border:'1px solid rgba(239,68,68,.2)', borderRadius:'var(--r2)', padding:'8px 12px' } },
            db.avoidSupp && _h('div', { style:{ fontSize:'.72rem', color:'var(--red)', marginBottom:3 } }, '💊 '+db.avoidSupp),
            db.avoidFood && _h('div', { style:{ fontSize:'.72rem', color:'var(--red)', marginBottom:3 } }, '🍽 '+db.avoidFood),
            db.avoidMeds && _h('div', { style:{ fontSize:'.72rem', color:'var(--red)' } }, '💉 '+db.avoidMeds)
          )
        ),

        db.timingNotes && _h('div', { style:{ background:'var(--s3)', borderRadius:'var(--r2)', padding:'8px 12px', marginBottom:12 } },
          _h('div', { style:{ fontSize:'.65rem', fontWeight:700, color:'var(--t3)', textTransform:'uppercase', letterSpacing:'.05em', marginBottom:4 } }, '⏰ Uwagi dot. pory'),
          _h('div', { style:{ fontSize:'.72rem', color:'var(--t2)', lineHeight:1.5 } }, db.timingNotes)
        )
      ),

      !db && _h('div', { style:{ background:'var(--s3)', borderRadius:'var(--r2)', padding:'12px', textAlign:'center', color:'var(--t3)', fontSize:'.75rem' } },
        'Brak dodatkowych informacji w bazie wiedzy dla tego suplementu.'
      )
    );
  }

  // ── Knowledge Base Tab ────────────────────────────────────────────────────
  function BasaTab(props) {
    var onAdd = props.onAdd;
    var db = (typeof ET.SUPP_DB !== 'undefined') ? ET.SUPP_DB : [];

    var qs = React.useState(''); var query = qs[0], setQuery = qs[1];
    var cs = React.useState(''); var selCat = cs[0], setSelCat = cs[1];
    var ds = React.useState(null); var detailSupp = ds[0], setDetailSupp = ds[1];

    var allCatsUsed = [];
    db.forEach(function(s){ s.cat.forEach(function(c){ if (allCatsUsed.indexOf(c) === -1) allCatsUsed.push(c); }); });

    var filtered = db.filter(function(s) {
      var matchQ = !query || s.name.toLowerCase().indexOf(query.toLowerCase()) !== -1 || (s.nameEn||'').toLowerCase().indexOf(query.toLowerCase()) !== -1 || (s.desc||'').toLowerCase().indexOf(query.toLowerCase()) !== -1;
      var matchC = !selCat || s.cat.indexOf(selCat) !== -1;
      return matchQ && matchC;
    });

    return _h('div', null,
      _h('div', { style:{ marginBottom:10 } },
        _h('input', { type:'text', placeholder:'🔍 Szukaj suplementu...', value:query, onChange:function(e){ setQuery(e.target.value); },
          style:{ width:'100%', boxSizing:'border-box', padding:'10px 14px', borderRadius:'var(--r2)', background:'var(--s3)', border:'1px solid var(--b1)', color:'var(--t1)', fontSize:'.82rem', outline:'none' }
        })
      ),

      _h('div', { style:{ display:'flex', gap:4, flexWrap:'wrap', marginBottom:14 } },
        _h('button', { className:'tag-btn'+(selCat===''?' active':''), onClick:function(){ setSelCat(''); }, style:{ fontSize:'.62rem' } }, 'Wszystkie'),
        allCatsUsed.map(function(c) {
          return _h('button', { key:c, className:'tag-btn'+(selCat===c?' active':''), onClick:function(){ setSelCat(selCat===c?'':c); },
            style:{ fontSize:'.62rem', borderColor:selCat===c?catColor(c):'var(--b1)', color:selCat===c?catColor(c):'var(--t2)' }
          }, c);
        })
      ),

      _h('div', { style:{ fontSize:'.65rem', color:'var(--t3)', marginBottom:8 } }, filtered.length+' suplementów'),

      filtered.length === 0 && _h(ET.Placeholder, { icon:'🔍', title:'Brak wyników', desc:'Spróbuj innego słowa kluczowego lub kategorii.' }),

      filtered.map(function(s) {
        var mainCat = s.cat[0];
        var c = catColor(mainCat);
        return _h('div', { key:s.id, className:'card card-sm', style:{ marginBottom:8, cursor:'pointer', borderLeft:'3px solid '+c },
          onClick:function(){ setDetailSupp(s); }
        },
          _h('div', { style:{ display:'flex', alignItems:'center', gap:12 } },
            _h('div', { style:{ fontSize:'1.4rem', flexShrink:0 } }, s.icon),
            _h('div', { style:{ flex:1, minWidth:0 } },
              _h('div', { style:{ fontWeight:700, fontSize:'.88rem', marginBottom:2 } }, s.name),
              _h('div', { style:{ fontSize:'.65rem', color:'var(--t3)', marginBottom:4 } }, s.nameEn),
              _h('div', { style:{ display:'flex', gap:3, flexWrap:'wrap' } },
                s.cat.map(function(cat){
                  return _h('span', { key:cat, style:{ fontSize:'.57rem', padding:'1px 6px', borderRadius:99, background:catColor(cat)+'20', color:catColor(cat) } }, cat);
                })
              )
            ),
            _h('div', { style:{ fontSize:'.7rem', color:'var(--green)', fontWeight:700, flexShrink:0 } }, s.optDose),
            _h('div', { style:{ color:'var(--t3)', fontSize:'.7rem', flexShrink:0 } }, '›')
          )
        );
      }),

      _h(ET.Sheet, { open:!!detailSupp, onClose:function(){ setDetailSupp(null); }, title:detailSupp?detailSupp.name:'' },
        detailSupp && _h(SuppDetail, { supp:detailSupp, onAdd:function(s){
          onAdd(s);
          setDetailSupp(null);
        } })
      )
    );
  }

  // ── Main Module ───────────────────────────────────────────────────────────
  function SupplementsModule() {
    var su = ET.useStore(); var store = su.store, update = su.update;
    var toast = ET.useToast();

    var tvs = React.useState('plan'); var tab = tvs[0], setTab = tvs[1];

    // Add sheet state
    var sa = React.useState(false); var showAdd = sa[0], setShowAdd = sa[1];
    var fs = React.useState({ name:'', dose:'', unit:'g', timing:'morning', notes:'' });
    var f = fs[0], setF = fs[1];
    function upF(key, val) { setF(function(prev){ var o={}; o[key]=val; return Object.assign({},prev,o); }); }

    // Edit sheet state
    var es = React.useState(null); var editEntry = es[0], setEditEntry = es[1];
    var efs = React.useState(null); var editF = efs[0], setEditF = efs[1];
    function upEF(key, val) { setEditF(function(prev){ var o={}; o[key]=val; return Object.assign({},prev,o); }); }

    // Plan detail sheet state
    var pds = React.useState(null); var planDetail = pds[0], setPlanDetail = pds[1];

    var today = ET.dstr();
    var suppls = store.supplements||[];
    var checks = store.supplementChecks||{};
    var todayChecks = checks[today]||{};

    function toggleCheck(id) {
      update(function(s) {
        var c = Object.assign({}, s.supplementChecks||{});
        var td = Object.assign({}, c[today]||{});
        td[id] = !td[id];
        c[today] = td;
        return Object.assign({}, s, { supplementChecks:c });
      });
    }

    function addSupplement() {
      if (!f.name) { toast('Podaj nazwę suplementu', 'error'); return; }
      update(function(s){ return Object.assign({},s,{ supplements:(s.supplements||[]).concat([Object.assign({id:Date.now()},f)]) }); });
      toast('Suplement dodany ✓', 'success');
      setShowAdd(false);
      setF({ name:'', dose:'', unit:'g', timing:'morning', notes:'' });
    }

    function addFromDB(s) {
      var newEntry = { id:Date.now(), name:s.name, dose:s.defaultDose, unit:s.defaultUnit, timing:s.defaultTiming, notes:s.nameEn };
      update(function(st){ return Object.assign({},st,{ supplements:(st.supplements||[]).concat([newEntry]) }); });
      toast(s.name+' dodano do planu ✓', 'success');
      setTab('plan');
    }

    function removeSupplement(id) {
      update(function(s){ return Object.assign({},s,{ supplements:(s.supplements||[]).filter(function(x){ return x.id!==id; }) }); });
      toast('Usunięto', 'default');
    }

    function openEdit(s) {
      setEditEntry(s);
      setEditF({ name:s.name, dose:s.dose||'', unit:s.unit||'g', timing:s.timing||'morning', notes:s.notes||'' });
    }

    function saveEdit() {
      update(function(st){
        return Object.assign({}, st, {
          supplements: (st.supplements||[]).map(function(x){
            return x.id === editEntry.id ? Object.assign({}, x, editF) : x;
          })
        });
      });
      toast('Zapisano zmiany ✓', 'success');
      setEditEntry(null);
      setEditF(null);
    }

    var doneCount = suppls.filter(function(s){ return todayChecks[s.id]; }).length;
    var timingGroups = {};
    TIMINGS.forEach(function(t){ timingGroups[t.id] = suppls.filter(function(s){ return s.timing===t.id; }); });

    return _h('div', { className:'fade-in' },
      _h('div', { className:'page-hdr' },
        _h('div', null,
          _h('h1', null, '💊 Suplementy'),
          _h('p', null, tab==='plan' ? 'Dzisiaj: '+doneCount+'/'+suppls.length+' przyjęto' : (typeof ET.SUPP_DB !== 'undefined' ? ET.SUPP_DB.length : 0)+' suplementów w bazie')
        ),
        tab==='plan' && _h('button', { className:'btn btn-primary', onClick:function(){ setShowAdd(true); } }, '+ Dodaj')
      ),

      _h('div', { style:{ display:'flex', gap:6, marginBottom:16 } },
        _h('button', { className:'tag-btn'+(tab==='plan'?' active':''), onClick:function(){ setTab('plan'); } }, '📋 Plan dzienny'),
        _h('button', { className:'tag-btn'+(tab==='baza'?' active':''), onClick:function(){ setTab('baza'); } }, '📚 Baza wiedzy')
      ),

      // ── PLAN DZIENNY ──────────────────────────────────────────────────────
      tab==='plan' && suppls.length>0 && _h('div', { className:'card', style:{ marginBottom:14 } },
        _h('div', { style:{ display:'flex', justifyContent:'space-between', marginBottom:10 } },
          _h('div', { style:{ fontWeight:700, fontSize:'.9rem' } }, '📋 Plan na dzisiaj'),
          _h('div', { style:{ fontSize:'.72rem', color:'var(--t3)' } }, new Date().toLocaleDateString('pl-PL', { weekday:'long' }))
        ),
        _h(ET.ProgressBar, { value:suppls.length?doneCount/suppls.length*100:0, color:'var(--green)', height:4 }),
        _h('div', { style:{ marginTop:10 } },
          TIMINGS.map(function(t) {
            var grp = timingGroups[t.id];
            if (!grp.length) return null;
            return _h('div', { key:t.id, style:{ marginBottom:10 } },
              _h('div', { style:{ fontSize:'.65rem', fontWeight:700, color:'var(--t3)', textTransform:'uppercase', letterSpacing:'.08em', marginBottom:5 } }, t.icon+' '+t.label),
              grp.map(function(s) {
                var checked = !!todayChecks[s.id];
                var confl = conflictsWithin(s, grp);
                var tags = intakeTags(s.name);
                return _h('div', { key:s.id, className:'suppl-item'+(checked?' checked':''),
                  style:{ display:'flex', alignItems:'center', gap:10, borderLeft:confl.length?'3px solid var(--red)':'none', paddingLeft:confl.length?8:0 }
                },
                  _h('div', {
                    className:'suppl-check',
                    onClick:function(e){ e.stopPropagation(); toggleCheck(s.id); },
                    style:{ flexShrink:0, cursor:'pointer' }
                  }, checked ? '✓' : ''),
                  _h('div', {
                    style:{ flex:1, cursor:'pointer', padding:'2px 0' },
                    onClick:function(){ setPlanDetail(s); }
                  },
                    _h('div', { style:{ fontWeight:600, fontSize:'.88rem' } }, s.name),
                    s.dose && _h('div', { style:{ fontSize:'.72rem', color:'var(--t3)' } }, s.dose+' '+s.unit),
                    tags.length>0 && _h('div', { style:{ display:'flex', gap:3, flexWrap:'wrap', marginTop:3 } },
                      tags.map(function(tg){ return _h('span', { key:tg.t, style:{ fontSize:'.58rem', padding:'1px 6px', borderRadius:99, background:'var(--s3)', border:'1px solid var(--b1)', color:tg.c, fontWeight:600 } }, tg.t); })
                    ),
                    confl.length>0 && _h('div', { style:{ fontSize:'.62rem', color:'var(--red)', marginTop:3, fontWeight:600 } },
                      '⚠ Nie łącz z: '+confl.join(', ')+' — rozdziel min. 2 h')
                  ),
                  _h('div', { style:{ fontSize:'.7rem', color:'var(--t3)', flexShrink:0, opacity:0.5 } }, 'ℹ')
                );
              })
            );
          })
        )
      ),

      tab==='plan' && suppls.length===0 && _h(ET.Placeholder, { icon:'💊', title:'Brak suplementów', desc:'Dodaj suplementy ręcznie lub przejdź do Bazy wiedzy, aby wybrać z gotowej listy.' }),

      tab==='plan' && suppls.length>0 && _h('div', { style:{ marginBottom:14 } },
        _h('div', { className:'section-hdr' }, _h('h2', null, 'Moje suplementy')),
        suppls.map(function(s) {
          var tInfo = TIMINGS.find(function(t){ return t.id===s.timing; })||TIMINGS[0];
          return _h('div', { key:s.id, className:'card card-sm', style:{ marginBottom:6, display:'flex', alignItems:'center', gap:12 } },
            _h('div', { style:{ flex:1, minWidth:0 } },
              _h('div', { style:{ fontWeight:600, fontSize:'.88rem' } }, s.name),
              _h('div', { style:{ fontSize:'.72rem', color:'var(--t3)', marginTop:2 } }, (s.dose?s.dose+' '+s.unit+' · ':'')+tInfo.icon+' '+tInfo.label)
            ),
            _h('button', { className:'btn btn-ghost btn-sm btn-icon', onClick:function(){ openEdit(s); } }, '✏️'),
            _h('button', { className:'btn btn-ghost btn-sm btn-icon', style:{ color:'var(--red)' }, onClick:function(){ removeSupplement(s.id); } }, '✕')
          );
        })
      ),

      // ── BAZA WIEDZY ───────────────────────────────────────────────────────
      tab==='baza' && _h(BasaTab, { onAdd:addFromDB }),

      // ── PLAN DETAIL SHEET ─────────────────────────────────────────────────
      _h(ET.Sheet, { open:!!planDetail, onClose:function(){ setPlanDetail(null); }, title:planDetail?planDetail.name:'' },
        planDetail && _h(PlanDetail, { entry:planDetail })
      ),

      // ── EDIT SHEET ────────────────────────────────────────────────────────
      _h(ET.Sheet, { open:!!editEntry, onClose:function(){ setEditEntry(null); setEditF(null); }, title:'Edytuj suplement' },
        editF && _h('div', null,
          _h('div', { className:'field' }, _h('label', null, 'Nazwa'), _h('input', { type:'text', value:editF.name, onChange:function(e){ upEF('name',e.target.value); } })),
          _h('div', { className:'grid-2' },
            _h('div', { className:'field' }, _h('label', null, 'Dawka'), _h('input', { type:'text', value:editF.dose, onChange:function(e){ upEF('dose',e.target.value); } })),
            _h('div', { className:'field' }, _h('label', null, 'Jednostka'),
              _h('select', { value:editF.unit, onChange:function(e){ upEF('unit',e.target.value); } },
                UNITS.map(function(u){ return _h('option', { key:u, value:u }, u); })
              )
            )
          ),
          _h('div', { className:'field' },
            _h('label', null, 'Pora przyjmowania'),
            _h('div', { style:{ display:'flex', gap:6, flexWrap:'wrap' } },
              TIMINGS.map(function(t) {
                return _h('button', { key:t.id, className:'tag-btn'+(editF.timing===t.id?' active':''), onClick:function(){ upEF('timing',t.id); } }, t.icon+' '+t.label);
              })
            )
          ),
          _h('div', { className:'field' }, _h('label', null, 'Notatki'), _h('textarea', { value:editF.notes, onChange:function(e){ upEF('notes',e.target.value); }, placeholder:'Producent, forma, wskazówki...', style:{ minHeight:60 } })),
          _h('button', { className:'btn btn-primary', style:{ width:'100%' }, onClick:saveEdit }, 'Zapisz zmiany')
        )
      ),

      // ── ADD SHEET ─────────────────────────────────────────────────────────
      _h(ET.Sheet, { open:showAdd, onClose:function(){ setShowAdd(false); }, title:'Nowy suplement' },
        _h('div', { className:'field' }, _h('label', null, 'Nazwa *'), _h('input', { type:'text', placeholder:'np. Kreatyna, Omega-3, Wit. D3', value:f.name, onChange:function(e){ upF('name',e.target.value); } })),
        _h('div', { className:'grid-2' },
          _h('div', { className:'field' }, _h('label', null, 'Dawka'), _h('input', { type:'text', placeholder:'np. 5', value:f.dose, onChange:function(e){ upF('dose',e.target.value); } })),
          _h('div', { className:'field' }, _h('label', null, 'Jednostka'),
            _h('select', { value:f.unit, onChange:function(e){ upF('unit',e.target.value); } },
              UNITS.map(function(u){ return _h('option', { key:u, value:u }, u); })
            )
          )
        ),
        _h('div', { className:'field' },
          _h('label', null, 'Pora przyjmowania'),
          _h('div', { style:{ display:'flex', gap:6, flexWrap:'wrap' } },
            TIMINGS.map(function(t) {
              return _h('button', { key:t.id, className:'tag-btn'+(f.timing===t.id?' active':''), onClick:function(){ upF('timing',t.id); } }, t.icon+' '+t.label);
            })
          )
        ),
        _h('div', { className:'field' }, _h('label', null, 'Notatki'), _h('textarea', { value:f.notes, onChange:function(e){ upF('notes',e.target.value); }, placeholder:'Producent, forma, wskazówki...', style:{ minHeight:60 } })),
        _h('button', { className:'btn btn-primary', style:{ width:'100%' }, onClick:addSupplement }, 'Dodaj suplement')
      )
    );
  }

  ET.SupplementsModule = SupplementsModule;
  // Helpery współdzielone z arkuszem suplementów na Dashboardzie
  ET.suppIntakeTags = intakeTags;
  ET.suppConflictsWithin = conflictsWithin;
})();
