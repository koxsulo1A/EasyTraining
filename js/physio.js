(function() {
  'use strict';
  window.ET = window.ET || {};
  var _h = React.createElement;

  var REGEN_DAYS = 28; // blok regenerowany co 4 tygodnie

  // Prosty stabilny hash nazwy/id → liczba
  function hashId(s) {
    var h = 0; s = String(s);
    for (var i=0;i<s.length;i++) { h = (h*31 + s.charCodeAt(i)) & 0xffffff; }
    return h;
  }

  // ── ALGORYTM DOPASOWANIA (spec 6.2) ──────────────────────────────────────
  // Grupuje dolegliwości wg regionów, wybiera 1–2 najbardziej punktowane regiony,
  // z każdego dobiera 1–2 ćwiczenia preferując niższy poziom trudności.
  ET.generatePhysioBlock = function(ailments, seed) {
    seed = seed || 0;
    if (!ailments || !ailments.length) return [];
    var conds = ET.CONDITIONS || [];

    var regionScore = {};      // region -> liczba dolegliwości
    var regionAilments = {};   // region -> [tagi]
    ailments.forEach(function(tag) {
      var c = conds.find(function(x){ return x.tag===tag; });
      if (!c) return;
      regionScore[c.region] = (regionScore[c.region]||0) + 1;
      (regionAilments[c.region] = regionAilments[c.region] || []).push(tag);
    });

    // Regiony wg punktacji malejąco; przy remisie stabilnie wg nazwy
    var regions = Object.keys(regionScore).sort(function(a,b){
      if (regionScore[b] !== regionScore[a]) return regionScore[b]-regionScore[a];
      return a < b ? -1 : 1;
    });
    var topRegions = regions.slice(0, 2); // maks 2 regiony

    var block = [];
    topRegions.forEach(function(region) {
      var tags = regionAilments[region];
      var pool = [];
      tags.forEach(function(tag) {
        (ET.exercisesByCondition ? ET.exercisesByCondition(tag) : []).forEach(function(ex) {
          if (pool.indexOf(ex) === -1) pool.push(ex);
        });
      });
      // Klucz sortowania: poziom trudności (główny) + rozrzut wg seed (poboczny)
      pool.sort(function(a,b) {
        var ka = (a.difficulty||1)*1000 + ((hashId(a.id)+seed) % 1000);
        var kb = (b.difficulty||1)*1000 + ((hashId(b.id)+seed) % 1000);
        return ka - kb;
      });
      var picked = 0;
      for (var i=0;i<pool.length && picked<2;i++) {
        if (block.indexOf(pool[i]) === -1) { block.push(pool[i]); picked++; }
      }
    });

    return block.slice(0, 4); // maks 4 ćwiczenia w bloku
  };

  function ailmentsKey(a) { return (a||[]).slice().sort().join(','); }

  function buildBlockRecord(ailments, seed) {
    var exs = ET.generatePhysioBlock(ailments, seed);
    return {
      exerciseIds: exs.map(function(e){ return e.id; }),
      generatedAt: ET.dstr(),
      ailmentsKey: ailmentsKey(ailments),
      seed: seed
    };
  }

  function daysBetween(d1, d2) {
    var a = new Date(d1), b = new Date(d2);
    return Math.floor((b - a) / 86400000);
  }

  // ── MODUŁ ────────────────────────────────────────────────────────────────
  function PhysioModule() {
    var su = ET.useStore(); var store = su.store, update = su.update;
    var toast = ET.useToast();
    var sel = React.useState(null); var selected = sel[0], setSelected = sel[1];

    var ailments = store.ailments || [];
    var block = store.physioBlock || null;

    // Auto-regeneracja: brak bloku / zmiana dolegliwości / >28 dni
    React.useEffect(function() {
      if (!ailments.length) return;
      var needs = !block
        || block.ailmentsKey !== ailmentsKey(ailments)
        || daysBetween(block.generatedAt, ET.dstr()) >= REGEN_DAYS;
      if (needs) {
        update(function(s){ return Object.assign({}, s, { physioBlock: buildBlockRecord(s.ailments||[], (block&&block.seed||0)) }); });
      }
    }, [ailmentsKey(ailments)]);

    function toggleAilment(tag) {
      update(function(s) {
        var cur = s.ailments || [];
        var next = cur.indexOf(tag)!==-1 ? cur.filter(function(x){ return x!==tag; }) : cur.concat([tag]);
        var rec = next.length ? buildBlockRecord(next, (s.physioBlock&&s.physioBlock.seed)||0) : null;
        var st = Object.assign({}, s, { ailments: next, physioBlock: rec });
        if (ET.logChange) {
          var cond = (ET.CONDITIONS||[]).find(function(c){ return c.tag===tag; });
          var added = next.indexOf(tag)!==-1;
          st = ET.logChange(st, { section:'physio', title:(added?'Dodano dolegliwość':'Usunięto dolegliwość'), desc:(cond?cond.label:tag) });
        }
        return st;
      });
    }

    function regenerate() {
      update(function(s) {
        var seed = ((s.physioBlock&&s.physioBlock.seed)||0) + 1;
        return Object.assign({}, s, { physioBlock: buildBlockRecord(s.ailments||[], seed) });
      });
      toast('Wygenerowano nowy blok korekcyjny 🔄', 'success');
    }

    var blockExs = block ? block.exerciseIds.map(function(id){ return ET.exerciseById(id); }).filter(Boolean) : [];
    var estMin = blockExs.length ? Math.max(5, Math.min(15, blockExs.length*4)) : 0;

    // Regiony objęte blokiem (do podpisu)
    var blockRegions = [];
    blockExs.forEach(function(ex) {
      var r = (ET.BODY_REGIONS||[]).find(function(x){ return x.id===ex.body_region; });
      if (r && blockRegions.indexOf(r.label)===-1) blockRegions.push(r.label);
    });

    return _h('div', { className:'fade-in' },
      _h('div', { className:'page-hdr' },
        _h('div', null,
          _h('h1', null, '🩺 Dolegliwości'),
          _h('p', null, ailments.length ? ailments.length+' zaznaczonych · blok '+blockExs.length+' ćw.' : 'Zaznacz dolegliwości, by dostać blok korekcyjny')
        ),
        _h('div', null)
      ),

      _h('div', { className:'card card-accent', style:{ marginBottom:14, fontSize:'.82rem', color:'var(--t2)', lineHeight:1.6 } },
        '💡 Zaznacz aktualne dolegliwości. Aplikacja dobierze krótki blok (5–15 min, 2–4 ćwiczenia) ćwiczeń korekcyjnych. Blok odświeża się automatycznie co 4 tygodnie lub po zmianie dolegliwości.'
      ),

      // ── WYBÓR DOLEGLIWOŚCI (pogrupowane wg regionu) ──────────────────────
      (ET.BODY_REGIONS||[]).map(function(region) {
        var conds = (ET.CONDITIONS||[]).filter(function(c){ return c.region===region.id; });
        if (!conds.length) return null;
        return _h('div', { key:region.id, style:{ marginBottom:14 } },
          _h('div', { style:{ fontSize:'.7rem', fontWeight:700, color:'var(--t3)', textTransform:'uppercase', letterSpacing:'.05em', marginBottom:8 } }, region.label),
          _h('div', { style:{ display:'flex', gap:6, flexWrap:'wrap' } },
            conds.map(function(c) {
              var active = ailments.indexOf(c.tag)!==-1;
              return _h('button', { key:c.tag, className:'tag-btn'+(active?' active':''), onClick:function(){ toggleAilment(c.tag); } },
                (active?'✓ ':'')+c.label);
            })
          )
        );
      }),

      // ── BLOK KOREKCYJNY ──────────────────────────────────────────────────
      _h('div', { style:{ marginTop:22 } },
        _h('div', { style:{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:8, marginBottom:10 } },
          _h('div', null,
            _h('div', { style:{ fontWeight:700, fontSize:'1rem' } }, '🧩 Twój blok korekcyjny'),
            blockExs.length>0 && _h('div', { style:{ fontSize:'.72rem', color:'var(--t3)', marginTop:2 } },
              '~'+estMin+' min · '+blockExs.length+' ćwiczeń'+(blockRegions.length?' · '+blockRegions.join(', '):''))
          ),
          blockExs.length>0 && _h('button', { className:'btn btn-secondary btn-sm', onClick:regenerate }, '🔄 Regeneruj')
        ),

        blockExs.length===0
          ? _h(ET.Placeholder, { icon:'🩺', title:'Brak bloku', desc:'Zaznacz przynajmniej jedną dolegliwość powyżej, aby wygenerować blok korekcyjny.' })
          : _h('div', null,
              blockExs.map(function(ex, i) {
                var cond = (ET.CONDITIONS||[]).find(function(c){ return (ex.condition_tags||[]).indexOf(c.tag)!==-1; });
                var lvlColor = { 1:'var(--green)', 2:'var(--yellow)', 3:'var(--red)' }[ex.difficulty]||'var(--t3)';
                return _h('div', { key:ex.id, className:'card card-interactive', style:{ marginBottom:8, cursor:'pointer', display:'flex', gap:12, alignItems:'flex-start' }, onClick:function(){ setSelected(ex); } },
                  _h('div', { style:{ width:30, height:30, borderRadius:'50%', background:'var(--a-dim)', color:'var(--a-light)', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, fontSize:'.85rem', flexShrink:0 } }, i+1),
                  _h('div', { style:{ flex:1 } },
                    _h('div', { style:{ fontWeight:700, fontSize:'.9rem', marginBottom:3 } }, ex.name),
                    _h('div', { style:{ fontSize:'.72rem', color:'var(--t2)', lineHeight:1.4 } }, ex.mechanism),
                    _h('div', { style:{ display:'flex', gap:6, marginTop:5, flexWrap:'wrap' } },
                      cond && _h('span', { className:'badge badge-teal' }, cond.label),
                      _h('span', { style:{ fontSize:'.6rem', fontWeight:700, color:lvlColor, border:'1px solid '+lvlColor+'66', borderRadius:99, padding:'2px 7px' } }, (ET.LEVEL_LABELS&&ET.LEVEL_LABELS[ex.difficulty])||('Poz. '+ex.difficulty)),
                      _h('span', { style:{ fontSize:'.66rem', color:'var(--t3)' } }, '🧰 '+ex.equipment)
                    )
                  ),
                  _h('span', { style:{ color:'var(--t3)', fontSize:'1.1rem', flexShrink:0 } }, '›')
                );
              }),
              block && _h('div', { style:{ fontSize:'.66rem', color:'var(--t3)', textAlign:'center', marginTop:6 } },
                'Wygenerowano: '+ET.fmtDate(block.generatedAt)+' · następna auto-regeneracja po '+REGEN_DAYS+' dniach')
            )
      ),

      _h(ET.ExerciseDetail, { open:!!selected, exercise:selected, onClose:function(){ setSelected(null); } })
    );
  }

  ET.PhysioModule = PhysioModule;
})();
