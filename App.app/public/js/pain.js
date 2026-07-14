(function() {
  'use strict';
  window.ET = window.ET || {};
  var _h = React.createElement;

  // Natural anatomical zones — shapes: {d:path} or {e:[cx,cy,rx,ry]} (ellipse)
  var FRONT_ZONES = [
    { id:'glowa',        label:'Głowa',         shapes:[{e:[100,22,17,20]}] },
    { id:'kark',         label:'Kark/Szyja',    shapes:[{d:'M90,41 C89,47 89,52 89,58 L111,58 C111,52 111,47 110,41 Z'}] },
    { id:'bark_l',       label:'Bark lewy',     shapes:[{d:'M89,58 C80,59 63,63 55,72 C53,75 51,78 50,82 L100,82 L100,59 Z'}] },
    { id:'bark_p',       label:'Bark prawy',    shapes:[{d:'M111,58 C120,59 137,63 145,72 C147,75 149,78 150,82 L100,82 L100,59 Z'}] },
    { id:'klatka',       label:'Klatka',        shapes:[{d:'M50,82 L150,82 L149,116 L51,116 Z'}] },
    { id:'brzuch',       label:'Brzuch/Core',   shapes:[{d:'M51,116 L149,116 L148,150 L52,150 Z'}] },
    { id:'biodro_l',     label:'Biodro lewe',   shapes:[{d:'M52,150 L100,150 L100,182 L79,182 C68,175 58,164 52,150 Z'}] },
    { id:'biodro_p',     label:'Biodro prawe',  shapes:[{d:'M148,150 L100,150 L100,182 L121,182 C132,175 142,164 148,150 Z'}] },
    { id:'bicep_l',      label:'Biceps lewy',   shapes:[{d:'M55,72 C48,80 44,91 42,103 L41,117 L53,118 L52,101 C52,90 52,80 55,72 Z'}] },
    { id:'bicep_p',      label:'Biceps prawy',  shapes:[{d:'M145,72 C152,80 156,91 158,103 L159,117 L147,118 L148,101 C148,90 148,80 145,72 Z'}] },
    { id:'lokiec_l',     label:'Łokieć lewy',   shapes:[{d:'M41,117 L40,135 L53,135 L53,118 Z'}] },
    { id:'lokiec_p',     label:'Łokieć prawy',  shapes:[{d:'M159,117 L160,135 L147,135 L147,118 Z'}] },
    { id:'nadgarstek_l', label:'Przedramię/Nadgarstek L', shapes:[{d:'M40,135 L39,177 C38,185 39,191 43,193 L52,192 L54,149 L45,150 C41,147 39,141 40,135 Z'},{e:[44,199,7,9]}] },
    { id:'nadgarstek_p', label:'Przedramię/Nadgarstek P', shapes:[{d:'M160,135 L161,177 C162,185 161,191 157,193 L148,192 L146,149 L155,150 C159,147 161,141 160,135 Z'},{e:[156,199,7,9]}] },
    { id:'udo_l',        label:'Udo lewe',      shapes:[{d:'M79,182 L72,232 L91,232 L91,182 Z'}] },
    { id:'udo_p',        label:'Udo prawe',     shapes:[{d:'M109,182 L109,232 L128,232 L121,182 Z'}] },
    { id:'kolano_l',     label:'Kolano lewe',   shapes:[{d:'M72,232 L71,256 L90,256 L91,232 Z'}] },
    { id:'kolano_p',     label:'Kolano prawe',  shapes:[{d:'M109,232 L110,256 L129,256 L128,232 Z'}] },
    { id:'lydka_l',      label:'Łydka lewa',    shapes:[{d:'M71,256 L75,294 L90,294 L90,256 Z'}] },
    { id:'lydka_p',      label:'Łydka prawa',   shapes:[{d:'M110,256 L110,294 L125,294 L129,256 Z'}] },
    { id:'kostka_l',     label:'Kostka lewa',   shapes:[{d:'M75,294 L75,310 L89,310 L90,294 Z'}] },
    { id:'kostka_p',     label:'Kostka prawa',  shapes:[{d:'M110,294 L111,310 L125,310 L125,294 Z'}] },
  ];

  var BACK_ZONES = [
    { id:'glowa_tyl',    label:'Głowa/Tył',      shapes:[{e:[100,22,17,20]}] },
    { id:'kark_tyl',     label:'Kark/Tył',       shapes:[{d:'M90,41 C89,47 89,52 89,58 L111,58 C111,52 111,47 110,41 Z'}] },
    { id:'bark_l_tyl',   label:'Bark lewy',      shapes:[{d:'M89,58 C80,59 63,63 55,72 C53,75 51,78 50,82 L100,82 L100,59 Z'}] },
    { id:'bark_p_tyl',   label:'Bark prawy',     shapes:[{d:'M111,58 C120,59 137,63 145,72 C147,75 149,78 150,82 L100,82 L100,59 Z'}] },
    { id:'plecy_g',      label:'Plecy górne',    shapes:[{d:'M50,82 L150,82 L149,122 L51,122 Z'}] },
    { id:'plecy_d',      label:'Plecy dolne',    shapes:[{d:'M51,122 L149,122 L148,150 L52,150 Z'}] },
    { id:'posladek_l',   label:'Pośladek lewy',  shapes:[{d:'M52,150 L100,150 L100,182 L79,182 C68,175 58,164 52,150 Z'}] },
    { id:'posladek_p',   label:'Pośladek prawy', shapes:[{d:'M148,150 L100,150 L100,182 L121,182 C132,175 142,164 148,150 Z'}] },
    { id:'tricep_l',     label:'Triceps lewy',   shapes:[{d:'M55,72 C48,80 44,91 42,103 L41,117 L53,118 L52,101 C52,90 52,80 55,72 Z'}] },
    { id:'tricep_p',     label:'Triceps prawy',  shapes:[{d:'M145,72 C152,80 156,91 158,103 L159,117 L147,118 L148,101 C148,90 148,80 145,72 Z'}] },
    { id:'lokiec_l_tyl', label:'Łokieć lewy',    shapes:[{d:'M41,117 L40,135 L53,135 L53,118 Z'}] },
    { id:'lokiec_p_tyl', label:'Łokieć prawy',   shapes:[{d:'M159,117 L160,135 L147,135 L147,118 Z'}] },
    { id:'hamstring_l',  label:'Udo tył lewe',   shapes:[{d:'M79,182 L72,232 L91,232 L91,182 Z'}] },
    { id:'hamstring_p',  label:'Udo tył prawe',  shapes:[{d:'M109,182 L109,232 L128,232 L121,182 Z'}] },
    { id:'kolano_l_tyl', label:'Kolano lewe',    shapes:[{d:'M72,232 L71,256 L90,256 L91,232 Z'}] },
    { id:'kolano_p_tyl', label:'Kolano prawe',   shapes:[{d:'M109,232 L110,256 L129,256 L128,232 Z'}] },
    { id:'lydka_l_tyl',  label:'Łydka lewa',     shapes:[{d:'M71,256 L75,294 L90,294 L90,256 Z'}] },
    { id:'lydka_p_tyl',  label:'Łydka prawa',    shapes:[{d:'M110,256 L110,294 L125,294 L129,256 Z'}] },
    { id:'pieta_l',      label:'Pięta lewa',     shapes:[{d:'M75,294 L75,310 L89,310 L90,294 Z'}] },
    { id:'pieta_p',      label:'Pięta prawa',    shapes:[{d:'M110,294 L111,310 L125,310 L125,294 Z'}] },
  ];

  var PAIN_TYPES = [
    { id:'acute',   label:'Ostry/nagły',   icon:'⚡', color:'var(--red)'    },
    { id:'chronic', label:'Przewlekły',    icon:'🔄', color:'var(--orange)' },
    { id:'doms',    label:'DOMS',          icon:'🦵', color:'var(--yellow)' },
    { id:'injury',  label:'Kontuzja',      icon:'🩹', color:'var(--red)'   },
    { id:'strain',  label:'Naciągnięcie',  icon:'💢', color:'var(--purple)' },
  ];

  function levelColor(l) { return l<=3?'var(--green)':l<=6?'var(--yellow)':l<=8?'var(--orange)':'var(--red)'; }
  function typeInfo(id)  { return PAIN_TYPES.find(function(t){ return t.id===id; })||PAIN_TYPES[0]; }
  function allZones()    { return FRONT_ZONES.concat(BACK_ZONES); }

  function BodyFigurePain(props) {
    var selected = props.selected || [];
    var onToggle = props.onToggle;
    var side = props.side || 'front';
    var zones = side === 'front' ? FRONT_ZONES : BACK_ZONES;
    var se = React.createElement;
    var fill = 'var(--s2)';
    var stroke = 'var(--b1)';
    var sw = 1.5;

    return se('svg', { viewBox:'0 0 200 315', width:'100%', style:{ maxWidth:230, display:'block', margin:'0 auto' } },
      // Body silhouette
      se('ellipse', { cx:100, cy:22, rx:18, ry:21, fill:fill, stroke:stroke, strokeWidth:sw }),
      se('path', { d:'M92,41 C90,47 89,52 89,58 L111,58 C111,52 110,47 108,41 Z', fill:fill, stroke:stroke, strokeWidth:sw }),
      se('path', { d:'M89,58 C80,59 63,63 55,72 C49,79 47,88 48,98 L52,152 C56,160 61,167 68,173 L79,182 L121,182 C134,172 144,162 148,152 L152,98 C153,88 151,79 145,72 C137,63 120,59 111,58 Z', fill:fill, stroke:stroke, strokeWidth:sw }),
      se('path', { d:'M55,72 C48,80 44,91 42,103 L40,133 C39,141 41,147 45,150 L54,149 L52,101 C52,90 52,80 55,72 Z', fill:fill, stroke:stroke, strokeWidth:sw }),
      se('path', { d:'M145,72 C148,80 148,90 148,101 L146,149 L155,150 C159,147 161,141 160,133 L158,103 C156,91 152,80 145,72 Z', fill:fill, stroke:stroke, strokeWidth:sw }),
      se('path', { d:'M45,150 L39,177 C38,185 39,191 43,193 L52,192 L54,149 Z', fill:fill, stroke:stroke, strokeWidth:sw }),
      se('path', { d:'M146,149 L148,192 L157,193 C161,191 162,185 161,177 L155,150 Z', fill:fill, stroke:stroke, strokeWidth:sw }),
      se('ellipse', { cx:44, cy:199, rx:7, ry:9, fill:fill, stroke:stroke, strokeWidth:sw }),
      se('ellipse', { cx:156, cy:199, rx:7, ry:9, fill:fill, stroke:stroke, strokeWidth:sw }),
      se('path', { d:'M79,182 L71,247 C70,254 73,259 78,260 L89,259 L91,182 Z', fill:fill, stroke:stroke, strokeWidth:sw }),
      se('path', { d:'M109,182 L111,259 L122,260 C127,259 130,254 129,247 L121,182 Z', fill:fill, stroke:stroke, strokeWidth:sw }),
      se('path', { d:'M78,260 L75,300 C75,306 78,310 82,310 L89,310 L89,259 Z', fill:fill, stroke:stroke, strokeWidth:sw }),
      se('path', { d:'M111,259 L111,310 L118,310 C122,310 125,306 125,300 L122,260 Z', fill:fill, stroke:stroke, strokeWidth:sw }),

      // Back detail: spine line
      side === 'back' && se('line', { x1:100, y1:59, x2:100, y2:178, stroke:'var(--b1)', strokeWidth:1, strokeDasharray:'4,3', opacity:0.5 }),

      // Natural clickable zones
      zones.map(function(z) {
        var isSelected = selected.indexOf(z.id) !== -1;
        return se('g', { key:z.id, style:{ cursor:'pointer' }, onClick:function(){ onToggle(z.id); } },
          se('title', null, z.label),
          z.shapes.map(function(sh, i) {
            var common = {
              key:i,
              fill:'var(--red)', fillOpacity: isSelected ? '0.45' : '0.04',
              stroke:'var(--red)', strokeOpacity: isSelected ? '0.9' : '0.18',
              strokeWidth: isSelected ? 1.4 : 0.7,
              style:{ transition:'fill-opacity .15s, stroke-opacity .15s',
                      filter: isSelected ? 'drop-shadow(0 0 3px var(--red))' : 'none' }
            };
            return sh.e
              ? se('ellipse', Object.assign(common, { cx:sh.e[0], cy:sh.e[1], rx:sh.e[2], ry:sh.e[3] }))
              : se('path', Object.assign(common, { d:sh.d }));
          })
        );
      })
    );
  }

  // ── BLOK KOREKCYJNY (scalony z Dolegliwości) ─────────────────────────────
  var REGEN_DAYS = 28;
  function ailmentsKey(a){ return (a||[]).slice().sort().join(','); }
  function buildBlockRecord(ailments, seed) {
    var exs = ET.generatePhysioBlock ? ET.generatePhysioBlock(ailments, seed) : [];
    return { exerciseIds: exs.map(function(e){ return e.id; }), generatedAt: ET.dstr(), ailmentsKey: ailmentsKey(ailments), seed: seed };
  }
  function daysSince(d) { return Math.floor((new Date(ET.dstr()).getTime() - new Date(d).getTime())/86400000); }

  function PainModule() {
    var su = ET.useStore(); var store = su.store, update = su.update;
    var toast = ET.useToast();
    var sa = React.useState(false); var showAdd = sa[0], setShowAdd = sa[1];
    var si = React.useState('front'); var side = si[0], setSide = si[1];
    var ei = React.useState(null); var editId = ei[0], setEditId = ei[1];
    var ss = React.useState(false); var showSettings = ss[0], setShowSettings = ss[1];
    var sb = React.useState(false); var showBlock = sb[0], setShowBlock = sb[1];
    var dt = React.useState(null); var detail = dt[0], setDetail = dt[1];
    var fl = React.useState(false); var flash = fl[0], setFlash = fl[1];
    var emptyForm = { date:ET.dstr(), bodyParts:[], type:'doms', level:3, duration:'', notes:'' };
    var fs = React.useState(emptyForm);
    var f = fs[0], setF = fs[1];
    function upF(key, val) { setF(function(prev){ var o={}; o[key]=val; return Object.assign({},prev,o); }); }

    var ailments = store.ailments || [];
    var block = store.physioBlock || null;
    var blockExs = block ? block.exerciseIds.map(function(id){ return ET.exerciseById(id); }).filter(Boolean) : [];

    // Auto-regeneracja bloku: zmiana dolegliwości / brak / >28 dni
    React.useEffect(function() {
      if (!ailments.length) return;
      var needs = !block || block.ailmentsKey !== ailmentsKey(ailments) || daysSince(block.generatedAt) >= REGEN_DAYS;
      if (needs) update(function(s){ return Object.assign({}, s, { physioBlock: buildBlockRecord(s.ailments||[], (block&&block.seed)||0) }); });
    }, [ailmentsKey(ailments)]);

    function toggleAilment(tag) {
      update(function(s) {
        var cur = s.ailments || [];
        var next = cur.indexOf(tag)!==-1 ? cur.filter(function(x){ return x!==tag; }) : cur.concat([tag]);
        var rec = next.length ? buildBlockRecord(next, (s.physioBlock&&s.physioBlock.seed)||0) : null;
        var st = Object.assign({}, s, { ailments: next, physioBlock: rec });
        if (ET.logChange) {
          var cond = (ET.CONDITIONS||[]).find(function(c){ return c.tag===tag; });
          st = ET.logChange(st, { section:'pain', title:(next.indexOf(tag)!==-1?'Dodano dolegliwość':'Usunięto dolegliwość'), desc:(cond?cond.label:tag) });
        }
        return st;
      });
    }

    function regenerate() {
      update(function(s){ var seed=((s.physioBlock&&s.physioBlock.seed)||0)+1; return Object.assign({}, s, { physioBlock: buildBlockRecord(s.ailments||[], seed) }); });
      setFlash(true); setTimeout(function(){ setFlash(false); }, 600);
      toast('Wygenerowano nowy blok korekcyjny 🔄', 'success');
    }

    function toggleBodyPart(id) {
      var parts = f.bodyParts || [];
      var newParts = parts.indexOf(id) !== -1
        ? parts.filter(function(p){ return p !== id; })
        : parts.concat([id]);
      upF('bodyParts', newParts);
    }

    function openNew() {
      setF(emptyForm); setSide('front'); setEditId(null); setShowAdd(true);
    }

    function openEdit(e) {
      setF({ date:e.date, bodyParts:e.bodyParts||[], type:e.type, level:e.level, duration:e.duration||'', notes:e.notes||'' });
      setSide('front'); setEditId(e.id); setShowAdd(true);
    }

    function save() {
      var parts = f.bodyParts || [];
      if (parts.length === 0) { toast('Zaznacz miejsce bólu na ludziku', 'error'); return; }
      var all = allZones();
      var label = parts.map(function(id){ var z = all.find(function(z){ return z.id===id; }); return z ? z.label : id; }).join(', ');
      update(function(s){
        var next;
        if (editId) {
          next = Object.assign({},s,{ painEntries:(s.painEntries||[]).map(function(e){
            return e.id===editId ? Object.assign({},e,f,{bodyPart:label}) : e;
          }) });
          if (ET.logChange) next = ET.logChange(next, { section:'pain', title:'Edycja wpisu bólu', desc:label+' · '+f.level+'/10' });
        } else {
          next = Object.assign({},s,{ painEntries:[Object.assign({id:Date.now()},f,{bodyPart:label})].concat(s.painEntries||[]) });
        }
        return next;
      });
      toast(editId ? 'Wpis zaktualizowany ✓' : 'Ból zapisany ✓', 'success');
      setShowAdd(false); setEditId(null);
    }

    var entries = store.painEntries||[];
    var activeCount = entries.filter(function(e){ return e.type!=='doms'; }).length;

    return _h('div', { className:'fade-in' },
      _h('div', { className:'page-hdr' },
        _h('div', null,
          _h('h1', null, '🩹 Dolegliwości i ból'),
          _h('p', null, entries.length+' wpisów bólu · '+ailments.length+' dolegliwości')
        ),
        _h('div', { style:{ display:'flex', gap:8, flexWrap:'wrap' } },
          _h('button', { className:'btn btn-ghost', style:{ fontSize:'.75rem', padding:'8px 12px' }, onClick:function(){ setShowSettings(true); } }, '⚙️ Ustawienia'),
          _h('button', { className:'btn btn-primary', onClick:openNew }, '➕ Dodaj ból')
        )
      ),

      // ── DZIENNIK BÓLU (poziomy pasek) ────────────────────────────────────
      _h('div', { style:{ fontSize:'.7rem', fontWeight:700, color:'var(--t3)', textTransform:'uppercase', letterSpacing:'.05em', marginBottom:8 } }, 'Dziennik bólu'),
      entries.length===0
        ? _h('div', { style:{ fontSize:'.8rem', color:'var(--t3)', padding:'8px 0', marginBottom:6 } }, 'Brak wpisów — kliknij „Dodaj ból".')
        : _h('div', { style:{ display:'flex', gap:8, overflowX:'auto', paddingBottom:8, marginBottom:6 } },
            entries.map(function(e) {
              var ti = typeInfo(e.type), lc = levelColor(e.level);
              var bars = Math.max(1, Math.ceil(e.level/2));
              return _h('div', { key:e.id, className:'card', style:{ flexShrink:0, width:172, cursor:'pointer', padding:'10px 12px', borderColor:e.level>=7?'var(--red)':e.level>=4?'var(--orange)':'var(--b1)' }, onClick:function(){ openEdit(e); } },
                _h('div', { style:{ fontSize:'.66rem', color:'var(--t3)', marginBottom:3 } }, ET.fmtDate(e.date)),
                _h('div', { style:{ fontWeight:700, fontSize:'.82rem', marginBottom:6, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' } }, e.bodyPart || 'Brak lokalizacji'),
                _h('div', { style:{ display:'flex', gap:3, marginBottom:5 } },
                  [1,2,3,4,5].map(function(n){ return _h('div', { key:n, style:{ flex:1, height:5, borderRadius:2, background: n<=bars ? lc : 'var(--b1)' } }); })
                ),
                _h('span', { className:'badge', style:{ background:ti.color+'22', color:ti.color, fontSize:'.6rem' } }, ti.icon+' '+ti.label)
              );
            })
          ),

      // ── BLOK KOREKCYJNY ──────────────────────────────────────────────────
      _h('div', { style:{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:12, marginBottom:8 } },
        _h('div', { style:{ fontSize:'.7rem', fontWeight:700, color:'var(--t3)', textTransform:'uppercase', letterSpacing:'.05em' } }, 'Twój blok korekcyjny'),
        blockExs.length>0 && _h('button', { className:'btn btn-ghost btn-sm', style:{ fontSize:'.68rem' }, onClick:regenerate }, '🔄 Regeneruj')
      ),
      ailments.length===0
        ? _h('div', { className:'card', style:{ textAlign:'center', padding:'18px 14px' } },
            _h('div', { style:{ fontSize:'1.6rem', marginBottom:6 } }, '🩺'),
            _h('div', { style:{ fontSize:'.8rem', color:'var(--t2)', marginBottom:10 } }, 'Zaznacz swoje dolegliwości, aby dostać blok ćwiczeń korekcyjnych.'),
            _h('button', { className:'btn btn-secondary btn-sm', onClick:function(){ setShowSettings(true); } }, '⚙️ Wybierz dolegliwości')
          )
        : _h('div', { style:{ opacity: flash?0.35:1, transition:'opacity .3s' } },
            blockExs.map(function(ex, i) {
              var cond = (ET.CONDITIONS||[]).find(function(c){ return (ex.condition_tags||[]).indexOf(c.tag)!==-1; });
              return _h('div', { key:ex.id, className:'card card-interactive', style:{ marginBottom:6, cursor:'pointer', display:'flex', gap:10, alignItems:'center', padding:'10px 12px' }, onClick:function(){ setDetail(ex); } },
                _h('div', { style:{ width:26, height:26, borderRadius:'50%', background:'var(--a-dim)', color:'var(--a-light)', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, fontSize:'.8rem', flexShrink:0 } }, i+1),
                _h('div', { style:{ flex:1 } },
                  _h('div', { style:{ fontWeight:600, fontSize:'.84rem' } }, ex.name),
                  cond && _h('div', { style:{ fontSize:'.64rem', color:'var(--teal)' } }, cond.label)
                ),
                _h('span', { style:{ color:'var(--t3)' } }, '›')
              );
            }),
            blockExs.length>0 && _h('button', { className:'btn btn-primary', style:{ width:'100%', marginTop:4 }, onClick:function(){ setShowBlock(true); } }, '▶️ Wykonaj blok')
          ),

      // ── SAMOPOCZUCIE (przeniesione tutaj) — pod blokiem korekcyjnym ──────
      _h(WellbeingInline, null),

      _h(ET.Sheet, { open:showAdd, onClose:function(){ setShowAdd(false); setEditId(null); }, title:editId ? 'Edytuj wpis bólu' : 'Nowy wpis bólu' },
        _h('div', { className:'field' }, _h('label', null, 'Data'), _h('input', { type:'date', value:f.date, onChange:function(e){ upF('date',e.target.value); } })),

        _h('div', { style:{ fontSize:'.75rem', fontWeight:700, color:'var(--t2)', marginBottom:8 } }, '📍 Kliknij część ciała, w której boli'),

        _h('div', { style:{ display:'flex', justifyContent:'center', marginBottom:12 } },
          _h('div', { style:{ display:'flex', gap:0, borderRadius:'var(--r2)', overflow:'hidden', border:'1px solid var(--b1)' } },
            _h('button', {
              style:{ padding:'6px 20px', fontSize:'.78rem', fontWeight:600, background:side==='front'?'var(--a)':'var(--s3)', color:side==='front'?'white':'var(--t2)', border:'none', cursor:'pointer', transition:'all .15s' },
              onClick:function(){ setSide('front'); }
            }, '👤 Przód'),
            _h('button', {
              style:{ padding:'6px 20px', fontSize:'.78rem', fontWeight:600, background:side==='back'?'var(--a)':'var(--s3)', color:side==='back'?'white':'var(--t2)', border:'none', cursor:'pointer', transition:'all .15s' },
              onClick:function(){ setSide('back'); }
            }, '🔄 Tył')
          )
        ),

        _h(BodyFigurePain, { selected:f.bodyParts||[], onToggle:toggleBodyPart, side:side }),

        (f.bodyParts||[]).length > 0 && _h('div', { style:{ display:'flex', gap:5, flexWrap:'wrap', marginTop:8, marginBottom:4 } },
          (f.bodyParts||[]).map(function(id) {
            var all = allZones();
            var z = all.find(function(z){ return z.id===id; });
            return _h('div', { key:id, style:{ display:'flex', alignItems:'center', gap:4, background:'rgba(239,68,68,0.12)', border:'1px solid var(--red)', borderRadius:'var(--r2)', padding:'3px 8px', fontSize:'.7rem' } },
              _h('span', { style:{ color:'var(--red)' } }, z ? z.label : id),
              _h('button', { style:{ background:'none', border:'none', color:'var(--t3)', cursor:'pointer', padding:0, fontSize:'.75rem' }, onClick:function(){ toggleBodyPart(id); } }, '✕')
            );
          })
        ),

        _h('div', { className:'field', style:{ marginTop:14 } },
          _h('label', null, 'Typ bólu'),
          _h('div', { style:{ display:'flex', gap:6, flexWrap:'wrap' } },
            PAIN_TYPES.map(function(t) {
              return _h('button', { key:t.id, className:'tag-btn'+(f.type===t.id?' active':''), onClick:function(){ upF('type',t.id); } }, t.icon+' '+t.label);
            })
          )
        ),

        _h('div', { className:'field' },
          _h('label', { style:{ display:'flex', justifyContent:'space-between' } },
            _h('span', null, 'Intensywność bólu'),
            _h('span', { style:{ color:levelColor(f.level), fontWeight:700, fontSize:'1rem' } }, f.level+'/10')
          ),
          _h('div', { className:'slider-wrap' }, _h('input', { type:'range', min:1, max:10, value:f.level, onChange:function(e){ upF('level',+e.target.value); } })),
          _h('div', { style:{ display:'flex', justifyContent:'space-between', fontSize:'.62rem', color:'var(--t3)' } },
            _h('span', null, 'Ledwo czuć'), _h('span', null, 'Umiarkowany'), _h('span', null, 'Silny')
          )
        ),

        _h('div', { className:'field' }, _h('label', null, 'Czas trwania'), _h('input', { type:'text', placeholder:'np. 3 dni, od tygodnia', value:f.duration, onChange:function(e){ upF('duration',e.target.value); } })),
        _h('div', { className:'field' }, _h('label', null, 'Notatki'), _h('textarea', { value:f.notes, onChange:function(e){ upF('notes',e.target.value); }, placeholder:'Kiedy boli? Co pomaga?', style:{ minHeight:60 } })),
        _h('button', { className:'btn btn-primary', style:{ width:'100%' }, onClick:save }, editId ? 'Zapisz zmiany' : 'Zapisz wpis')
      ),

      // ── USTAWIENIA: wybór dolegliwości ───────────────────────────────────
      _h(ET.Sheet, { open:showSettings, onClose:function(){ setShowSettings(false); }, title:'Twoje dolegliwości' },
        _h('div', { style:{ fontSize:'.78rem', color:'var(--t2)', marginBottom:14, lineHeight:1.5 } },
          'Zaznacz dolegliwości, które Cię dotyczą. Na tej podstawie dobierzemy blok korekcyjny (5–15 min).'),
        (ET.BODY_REGIONS||[]).map(function(region) {
          var conds = (ET.CONDITIONS||[]).filter(function(c){ return c.region===region.id; });
          if (!conds.length) return null;
          return _h('div', { key:region.id, style:{ marginBottom:14 } },
            _h('div', { style:{ fontSize:'.68rem', fontWeight:700, color:'var(--t3)', textTransform:'uppercase', letterSpacing:'.05em', marginBottom:8 } }, region.label),
            _h('div', { style:{ display:'flex', gap:6, flexWrap:'wrap' } },
              conds.map(function(c) {
                var active = ailments.indexOf(c.tag)!==-1;
                return _h('button', { key:c.tag, className:'tag-btn'+(active?' active':''), onClick:function(){ toggleAilment(c.tag); } }, (active?'✓ ':'')+c.label);
              })
            )
          );
        })
      ),

      // ── WYKONAJ BLOK: checklist ──────────────────────────────────────────
      _h(BlockRunSheet, { open:showBlock, onClose:function(){ setShowBlock(false); }, exercises:blockExs, toast:toast }),

      _h(ET.ExerciseDetail, { open:!!detail, exercise:detail, onClose:function(){ setDetail(null); } })
    );
  }

  // Sheet wykonania bloku — prosta checklista
  function BlockRunSheet(props) {
    var ck = React.useState({}); var checked = ck[0], setChecked = ck[1];
    React.useEffect(function(){ if (props.open) setChecked({}); }, [props.open]);
    var exs = props.exercises || [];
    var done = exs.filter(function(e){ return checked[e.id]; }).length;
    return _h(ET.Sheet, { open:props.open, onClose:props.onClose, title:'Blok korekcyjny' },
      _h('div', { style:{ marginBottom:10 } },
        _h('div', { style:{ display:'flex', justifyContent:'space-between', marginBottom:4 } },
          _h('span', { style:{ fontSize:'.72rem', color:'var(--t3)' } }, 'Postęp'),
          _h('span', { style:{ fontSize:'.72rem', color:'var(--a-light)', fontWeight:700 } }, done+'/'+exs.length)
        ),
        _h(ET.ProgressBar, { value: exs.length ? done/exs.length*100 : 0 })
      ),
      exs.map(function(ex) {
        var on = !!checked[ex.id];
        return _h('div', { key:ex.id, className:'suppl-item'+(on?' checked':''), onClick:function(){ setChecked(function(c){ var o={}; o[ex.id]=!c[ex.id]; return Object.assign({},c,o); }); } },
          _h('div', { className:'suppl-check' }, on?'✓':''),
          _h('div', { style:{ flex:1 } },
            _h('div', { style:{ fontWeight:600, fontSize:'.85rem' } }, ex.name),
            _h('div', { style:{ fontSize:'.68rem', color:'var(--t2)' } }, ex.mechanism || ex.target_anatomy || '')
          )
        );
      }),
      _h('button', { className:'btn btn-primary', style:{ width:'100%', marginTop:12 }, onClick:function(){ props.toast(done>=exs.length&&exs.length ? 'Blok ukończony 🎉' : 'Zapisano postęp', 'success'); props.onClose(); } },
        done>=exs.length && exs.length ? '🏆 Zakończ' : 'Zamknij')
    );
  }

  // Samopoczucie osadzone w module Dolegliwości i ból (dawny osobny moduł „Samopoczucie").
  function WellbeingInline() {
    var su = ET.useStore(); var update = su.update;
    var toast = ET.useToast();
    var wv = React.useState(Object.assign({}, ET.WellbeingDefaults || {}));
    var vals = wv[0], setVals = wv[1];
    var savedToday = (su.store.wellbeingEntries||[]).some(function(e){ return e.date===ET.dstr() && !e.tag; });
    function up(k,v){ setVals(function(p){ var o={}; o[k]=v; return Object.assign({},p,o); }); }
    function save(){ if (ET.saveWellbeingEntry) ET.saveWellbeingEntry(update, vals, ''); toast('Samopoczucie zapisane ✓', 'success'); }
    if (!ET.WellbeingForm) return null;
    return _h('div', { style:{ marginTop:20 } },
      _h('div', { style:{ fontSize:'.7rem', fontWeight:700, color:'var(--t3)', textTransform:'uppercase', letterSpacing:'.05em', marginBottom:8 } },
        '🌡 Jak się dziś czujesz?'+(savedToday?' · zapisano dziś ✓':'')),
      _h('div', { className:'card' },
        _h(ET.WellbeingForm, { values:vals, onChange:up, saveLabel:'Zapisz samopoczucie', onSave:save })
      )
    );
  }

  ET.PainModule = PainModule;
})();
