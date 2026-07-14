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
          _h('div', { style:{ fontWeight:700, fontSize:'.9rem', marginBottom:3 } }, ex.name),
          _h('div', { style:{ fontSize:'.72rem', color:'var(--t3)' } }, '🧰 '+(ex.equipment||'—'))
        ),
        levelBadge(ex.difficulty)
      )
    );
  }

  // ── MODUŁ ────────────────────────────────────────────────────────────────
  function LibraryModule() {
    var q = React.useState(''); var query = q[0], setQuery = q[1];
    var tp = React.useState('podstawowe'); var typeFilter = tp[0], setTypeFilter = tp[1];
    var gf = React.useState('all'); var groupFilter = gf[0], setGroupFilter = gf[1];
    var sel = React.useState(null); var selected = sel[0], setSelected = sel[1];

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
        _h('div', null)
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

      _h(ExerciseDetail, { open:!!selected, exercise:selected, onClose:function(){ setSelected(null); } })
    );
  }

  ET.LibraryModule = LibraryModule;
  ET.ExerciseDetail = ExerciseDetail;
})();
