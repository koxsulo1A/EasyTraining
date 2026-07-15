(function() {
  'use strict';
  window.ET = window.ET || {};
  var _h = React.createElement;

  var LEVEL_COLORS = { 1:'var(--green)', 2:'var(--yellow)', 3:'var(--red)' };

  function levelBadge(lvl) {
    return _h('span', {
      style:{ fontSize:'.6rem', fontWeight:700, padding:'2px 7px', borderRadius:99,
        color:LEVEL_COLORS[lvl]||'var(--t3)', border:'1px solid '+(LEVEL_COLORS[lvl]||'var(--b1)')+'66',
        background:'transparent', whiteSpace:'nowrap' }
    }, (ET.LEVEL_LABELS && ET.LEVEL_LABELS[lvl]) || ('Poz. '+lvl));
  }

  // ── SZCZEGÓŁY ĆWICZENIA ──────────────────────────────────────────────────
  function ExerciseDetail(props) {
    var ex = props.exercise;
    if (!ex) return null;
    var isCorr = ex.type === 'korekcyjne';
    var groupLabel = '';
    if (isCorr) {
      var cond = (ET.CONDITIONS||[]).find(function(c){ return (ex.condition_tags||[]).indexOf(c.tag)!==-1; });
      groupLabel = cond ? cond.label : '';
    } else {
      var mg = (ET.MUSCLE_GROUPS||[]).find(function(m){ return (ex.tags||[]).indexOf(m.tag)!==-1; });
      groupLabel = mg ? mg.icon+' '+mg.label : '';
    }

    function row(label, value) {
      if (!value) return null;
      return _h('div', { style:{ marginBottom:12 } },
        _h('div', { style:{ fontSize:'.66rem', fontWeight:700, color:'var(--t3)', textTransform:'uppercase', letterSpacing:'.05em', marginBottom:4 } }, label),
        _h('div', { style:{ fontSize:'.86rem', color:'var(--t1)', lineHeight:1.55 } }, value)
      );
    }

    return _h(ET.Sheet, { open:props.open, onClose:props.onClose, title:ex.name },
      _h('div', { style:{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:16, alignItems:'center' } },
        _h('span', { className:'badge '+(isCorr?'badge-teal':'badge-blue') }, isCorr?'Korekcyjne':'Podstawowe'),
        groupLabel && _h('span', { className:'badge badge-purple' }, groupLabel),
        levelBadge(ex.difficulty)
      ),

      row('🧰 Sprzęt', ex.equipment),

      !isCorr && row('📋 Opis wykonania', ex.instructions),
      !isCorr && ex.common_mistakes && _h('div', { style:{ marginBottom:12, padding:'10px 12px', background:'rgba(239,68,68,.08)', border:'1px solid rgba(239,68,68,.3)', borderRadius:'var(--r2)' } },
        _h('div', { style:{ fontSize:'.66rem', fontWeight:700, color:'var(--red)', textTransform:'uppercase', letterSpacing:'.05em', marginBottom:4 } }, '⚠️ Najczęstsze błędy'),
        _h('div', { style:{ fontSize:'.84rem', color:'var(--t1)', lineHeight:1.5 } }, ex.common_mistakes)
      ),

      isCorr && row('🎯 Cel anatomiczny', ex.target_anatomy),
      isCorr && row('⚙️ Mechanizm działania', ex.mechanism),

      ex.contraindications && _h('div', { style:{ marginBottom:12, padding:'10px 12px', background:'rgba(249,115,22,.08)', border:'1px solid rgba(249,115,22,.3)', borderRadius:'var(--r2)' } },
        _h('div', { style:{ fontSize:'.66rem', fontWeight:700, color:'var(--orange)', textTransform:'uppercase', letterSpacing:'.05em', marginBottom:4 } }, '🚫 Przeciwwskazania'),
        _h('div', { style:{ fontSize:'.84rem', color:'var(--t1)', lineHeight:1.5 } }, ex.contraindications)
      )
    );
  }

  // ── KARTA ĆWICZENIA ──────────────────────────────────────────────────────
  function ExerciseCard(ex, onClick) {
    return _h('div', { key:ex.id, className:'card card-interactive', style:{ marginBottom:8, cursor:'pointer', padding:'12px 14px' }, onClick:onClick },
      _h('div', { style:{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:8 } },
        _h('div', { style:{ flex:1 } },
          _h('div', { style:{ display:'flex', alignItems:'center', gap:6 } },
            _h('div', { style:{ fontWeight:700, fontSize:'.9rem' } }, ex.name),
            ex.source==='web' && _h('span', { className:'badge badge-teal', style:{ fontSize:'.55rem' } }, '🌐 web')
          ),
          _h('div', { style:{ fontSize:'.72rem', color:'var(--t3)', marginTop:3 } }, '🧰 '+(ex.equipment||'—'))
        ),
        levelBadge(ex.difficulty)
      )
    );
  }

  // ── DODAJ ĆWICZENIE (Web/Admin) — trafia do shared_exercises, widoczne wszędzie ──
  function AddExerciseSheet(props) {
    var toast = ET.useToast();
    var fs = React.useState({ name:'', tag:(ET.MUSCLE_GROUPS||[])[0] && ET.MUSCLE_GROUPS[0].tag, equipment:'', difficulty:1,
      instructions:'', common_mistakes:'', isUnilateral:false, measurementType:'reps' });
    var f = fs[0], setF = fs[1];
    var saving = React.useState(false); var isSaving = saving[0], setSaving = saving[1];
    function upF(k,v){ setF(function(p){ var o={}; o[k]=v; return Object.assign({},p,o); }); }

    function save() {
      if (!f.name.trim()) { toast('Podaj nazwę ćwiczenia', 'error'); return; }
      setSaving(true);
      ET.addSharedExercise({
        name: f.name.trim(), type:'podstawowe', tags:[f.tag], equipment:f.equipment, difficulty:+f.difficulty,
        instructions:f.instructions, common_mistakes:f.common_mistakes,
        isUnilateral: !!f.isUnilateral, measurementType: f.measurementType
      }).then(function() {
        setSaving(false);
        toast('Ćwiczenie dodane — widoczne dla wszystkich ✓', 'success');
        props.onClose();
      }).catch(function(e) {
        setSaving(false);
        toast('Błąd: '+(e && e.message || e), 'error');
      });
    }

    return _h(ET.Sheet, { open:props.open, onClose:props.onClose, title:'➕ Nowe ćwiczenie (współdzielone)' },
      _h('div', { style:{ fontSize:'.72rem', color:'var(--t3)', marginBottom:14, lineHeight:1.5 } },
        'Dodane tu ćwiczenie trafia do wspólnej bazy — zobaczą je wszyscy użytkownicy (na telefonie i w przeglądarce).'),
      _h('div', { className:'field' }, _h('label', null, 'Nazwa *'), _h('input', { type:'text', value:f.name, placeholder:'np. Wyciskanie hantli nad głową', onChange:function(e){ upF('name', e.target.value); } })),
      _h('div', { className:'grid-2' },
        _h('div', { className:'field' },
          _h('label', null, 'Grupa mięśniowa'),
          _h('select', { value:f.tag, onChange:function(e){ upF('tag', e.target.value); } },
            (ET.MUSCLE_GROUPS||[]).map(function(g){ return _h('option', { key:g.tag, value:g.tag }, g.icon+' '+g.label); })
          )
        ),
        _h('div', { className:'field' }, _h('label', null, 'Sprzęt'), _h('input', { type:'text', value:f.equipment, placeholder:'np. Hantle', onChange:function(e){ upF('equipment', e.target.value); } }))
      ),
      _h('div', { className:'field' },
        _h('label', null, 'Trudność'),
        _h('div', { style:{ display:'flex', gap:6 } },
          [1,2,3].map(function(lvl){
            var active = +f.difficulty === lvl;
            return _h('button', { key:lvl, className:'tag-btn'+(active?' active':''), onClick:function(){ upF('difficulty', lvl); } }, (ET.LEVEL_LABELS && ET.LEVEL_LABELS[lvl]) || ('Poz. '+lvl));
          })
        )
      ),
      _h('div', { className:'field' }, _h('label', null, 'Opis wykonania'), _h('textarea', { value:f.instructions, style:{ minHeight:60 }, onChange:function(e){ upF('instructions', e.target.value); } })),
      _h('div', { className:'field' }, _h('label', null, 'Częste błędy'), _h('textarea', { value:f.common_mistakes, style:{ minHeight:50 }, onChange:function(e){ upF('common_mistakes', e.target.value); } })),
      _h('div', { className:'grid-2' },
        _h('div', { className:'field' },
          _h('label', null, 'Pomiar'),
          _h('select', { value:f.measurementType, onChange:function(e){ upF('measurementType', e.target.value); } },
            _h('option', { value:'reps' }, 'Powtórzenia'), _h('option', { value:'seconds' }, 'Czas (sekundy)')
          )
        ),
        _h('div', { className:'field' },
          _h('label', { style:{ display:'flex', alignItems:'center', gap:6, marginTop:20 } },
            _h('input', { type:'checkbox', checked:f.isUnilateral, onChange:function(e){ upF('isUnilateral', e.target.checked); } }),
            'Jednostronne (L/P)'
          )
        )
      ),
      _h('button', { className:'btn btn-primary', style:{ width:'100%' }, disabled:isSaving, onClick:save }, isSaving ? '...' : 'Dodaj ćwiczenie')
    );
  }

  // ── IMPORT CSV (Web/Admin) — wiele ćwiczeń naraz ──────────────────────────
  function ImportExercisesCsvSheet(props) {
    var toast = ET.useToast();
    var preview = React.useState(null); var parsed = preview[0], setParsed = preview[1]; // {rows, errors}
    var saving = React.useState(false); var isSaving = saving[0], setSaving = saving[1];
    var fileRef = React.useRef(null);

    function onFile(e) {
      var file = e.target.files[0]; if (!file) return;
      var reader = new FileReader();
      reader.onload = function(ev) {
        setParsed(ET.parseExerciseCsv(ev.target.result));
      };
      reader.readAsText(file, 'UTF-8');
    }

    function doImport() {
      if (!parsed || !parsed.rows.length) return;
      setSaving(true);
      ET.addSharedExercisesBulk(parsed.rows).then(function(rows) {
        setSaving(false);
        toast((rows||[]).length+' ćwiczeń zaimportowanych — widoczne dla wszystkich ✓', 'success');
        setParsed(null);
        props.onClose();
      }).catch(function(e) {
        setSaving(false);
        toast('Błąd: '+(e && e.message || e), 'error');
      });
    }

    return _h(ET.Sheet, { open:props.open, onClose:function(){ setParsed(null); props.onClose(); }, title:'📥 Import ćwiczeń z CSV' },
      _h('div', { style:{ fontSize:'.72rem', color:'var(--t3)', marginBottom:12, lineHeight:1.6 } },
        'Plik CSV z nagłówkiem, kolumny w kolejności:',
        _h('div', { style:{ background:'var(--s3)', borderRadius:'var(--r2)', padding:'8px 10px', marginTop:6, fontFamily:'monospace', fontSize:'.68rem', color:'var(--t2)' } },
          'nazwa,grupa,sprzet,trudnosc,opis,bledy,jednostronne,pomiar'),
        _h('div', { style:{ marginTop:6 } }, 'grupa = tag (np. klatka_piersiowa, plecy, nogi...) · jednostronne = tak/nie · pomiar = reps/seconds')
      ),
      _h('input', { type:'file', accept:'.csv,.txt', ref:fileRef, onChange:onFile, style:{ marginBottom:14 } }),
      parsed && _h('div', { style:{ marginBottom:14 } },
        parsed.errors.length > 0 && _h('div', { style:{ background:'rgba(239,68,68,.08)', border:'1px solid rgba(239,68,68,.3)', borderRadius:'var(--r2)', padding:'8px 10px', marginBottom:10, fontSize:'.7rem', color:'var(--red)' } },
          parsed.errors.map(function(e,i){ return _h('div', { key:i }, '⚠ '+e); })
        ),
        _h('div', { style:{ fontSize:'.78rem', fontWeight:700, marginBottom:8 } }, parsed.rows.length+' ćwiczeń do zaimportowania:'),
        _h('div', { style:{ maxHeight:200, overflowY:'auto' } },
          parsed.rows.map(function(r, i) {
            return _h('div', { key:i, style:{ padding:'6px 0', borderBottom:'1px solid var(--b1)', fontSize:'.78rem' } },
              _h('b', null, r.name), ' — ', r.tags[0], r.isUnilateral?' · L/P':'', r.measurementType==='seconds'?' · sekundy':'');
          })
        )
      ),
      _h('button', { className:'btn btn-primary', style:{ width:'100%' }, disabled:!parsed || !parsed.rows.length || isSaving, onClick:doImport },
        isSaving ? '...' : (parsed ? 'Importuj '+parsed.rows.length+' ćwiczeń' : 'Wybierz plik CSV powyżej'))
    );
  }

  // ── MODUŁ ────────────────────────────────────────────────────────────────
  function LibraryModule() {
    var q = React.useState(''); var query = q[0], setQuery = q[1];
    var tp = React.useState('podstawowe'); var typeFilter = tp[0], setTypeFilter = tp[1];
    var gf = React.useState('all'); var groupFilter = gf[0], setGroupFilter = gf[1];
    var sel = React.useState(null); var selected = sel[0], setSelected = sel[1];
    var showAdd = React.useState(false); var isAdding = showAdd[0], setIsAdding = showAdd[1];
    var showImp = React.useState(false); var isImporting = showImp[0], setIsImporting = showImp[1];
    ET.useSharedExercisesVersion && ET.useSharedExercisesVersion(); // re-render po doładowaniu/dodaniu współdzielonych ćwiczeń
    var auth = ET.useAuth ? ET.useAuth() : null;
    var isAdmin = !!(auth && auth.profile && auth.profile.role === 'admin');

    var qlc = query.trim().toLowerCase();
    function matchQuery(ex) {
      if (!qlc) return true;
      return ex.name.toLowerCase().indexOf(qlc)!==-1
        || (ex.equipment||'').toLowerCase().indexOf(qlc)!==-1
        || (ex.instructions||'').toLowerCase().indexOf(qlc)!==-1
        || (ex.target_anatomy||'').toLowerCase().indexOf(qlc)!==-1;
    }

    var basicTotal = (ET.EXERCISES_BASIC||[]).length;
    var corrTotal = (ET.EXERCISES_CORRECTIVE||[]).length;

    // Chipy filtra grupy zależne od typu
    var groups = typeFilter==='korekcyjne'
      ? (ET.CONDITIONS||[]).map(function(c){ return { id:c.tag, label:c.label }; })
      : (ET.MUSCLE_GROUPS||[]).map(function(m){ return { id:m.tag, label:m.icon+' '+m.label }; });

    // Budowa listy pogrupowanej
    var source = typeFilter==='korekcyjne' ? (ET.EXERCISES_CORRECTIVE||[]) : (ET.EXERCISES_BASIC||[]);
    var filtered = source.filter(function(ex) {
      if (!matchQuery(ex)) return false;
      if (groupFilter==='all') return true;
      return (ex.tags||[]).indexOf(groupFilter)!==-1 || (ex.condition_tags||[]).indexOf(groupFilter)!==-1;
    });

    // Grupowanie do sekcji
    var sections = [];
    groups.forEach(function(g) {
      if (groupFilter!=='all' && groupFilter!==g.id) return;
      var items = filtered.filter(function(ex){ return (ex.tags||[]).indexOf(g.id)!==-1 || (ex.condition_tags||[]).indexOf(g.id)!==-1; });
      if (items.length) sections.push({ label:g.label, items:items });
    });

    return _h('div', { className:'fade-in' },
      _h('div', { className:'page-hdr' },
        _h('div', null,
          _h('h1', null, '📚 Biblioteka ćwiczeń'),
          _h('p', null, basicTotal+' podstawowych · '+corrTotal+' korekcyjnych')
        ),
        isAdmin && _h('div', { style:{ display:'flex', gap:6 } },
          _h('button', { className:'btn btn-secondary', style:{ fontSize:'.78rem', padding:'8px 12px' }, onClick:function(){ setIsImporting(true); } }, '📥 Import CSV'),
          _h('button', { className:'btn btn-primary', style:{ fontSize:'.78rem', padding:'8px 12px' }, onClick:function(){ setIsAdding(true); } }, '➕ Dodaj ćwiczenie')
        )
      ),

      // Wyszukiwarka
      _h('div', { className:'field', style:{ marginBottom:12 } },
        _h('input', { type:'text', placeholder:'🔍 Szukaj ćwiczenia, sprzętu...', value:query, onChange:function(e){ setQuery(e.target.value); } })
      ),

      // Przełącznik typu
      _h('div', { style:{ display:'flex', gap:6, marginBottom:12 } },
        [{ id:'podstawowe', label:'🏋️ Podstawowe' }, { id:'korekcyjne', label:'🩹 Korekcyjne' }].map(function(t) {
          return _h('button', { key:t.id, className:'tag-btn'+(typeFilter===t.id?' active':''), style:{ flex:1 },
            onClick:function(){ setTypeFilter(t.id); setGroupFilter('all'); } }, t.label);
        })
      ),

      // Chipy grupy
      _h('div', { style:{ display:'flex', gap:5, flexWrap:'wrap', marginBottom:14 } },
        [{ id:'all', label:'Wszystkie' }].concat(groups).map(function(g) {
          return _h('button', { key:g.id, className:'tag-btn'+(groupFilter===g.id?' active':''),
            onClick:function(){ setGroupFilter(g.id); } }, g.label);
        })
      ),

      sections.length===0
        ? _h(ET.Placeholder, { icon:'🔍', title:'Brak wyników', desc:'Zmień wyszukiwanie lub filtr.' })
        : sections.map(function(sec, si) {
            return _h('div', { key:si, style:{ marginBottom:18 } },
              _h('div', { style:{ display:'flex', alignItems:'center', gap:8, marginBottom:8, paddingBottom:6, borderBottom:'1px solid var(--b1)' } },
                _h('span', { style:{ fontWeight:700, fontSize:'.9rem', color:'var(--t2)' } }, sec.label),
                _h('span', { style:{ fontSize:'.7rem', color:'var(--t3)' } }, '· '+sec.items.length)
              ),
              sec.items.map(function(ex){ return ExerciseCard(ex, function(){ setSelected(ex); }); })
            );
          }),

      _h(ExerciseDetail, { open:!!selected, exercise:selected, onClose:function(){ setSelected(null); } }),
      isAdmin && _h(AddExerciseSheet, { open:isAdding, onClose:function(){ setIsAdding(false); } }),
      isAdmin && _h(ImportExercisesCsvSheet, { open:isImporting, onClose:function(){ setIsImporting(false); } })
    );
  }

  ET.LibraryModule = LibraryModule;
  ET.ExerciseDetail = ExerciseDetail;
})();
