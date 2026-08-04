(function() {
  'use strict';
  window.ET = window.ET || {};
  var _h = React.createElement;

  var MEAS_FIELDS = [
    { k:'weight',  l:'Waga',        u:'kg', min:30, max:200, step:0.1, c:'var(--a-light)' },
    { k:'neck',    l:'Szyja',       u:'cm', min:25, max:60,  step:0.5, c:'var(--pink)'    },
    { k:'chest',   l:'Klatka',      u:'cm', min:50, max:200, step:0.5, c:'var(--orange)'  },
    { k:'waist',   l:'Pas',         u:'cm', min:40, max:200, step:0.5, c:'var(--green)'   },
    { k:'hips',    l:'Biodra',      u:'cm', min:50, max:200, step:0.5, c:'var(--purple)'  },
    { k:'bicep',   l:'Biceps',      u:'cm', min:20, max:80,  step:0.5, c:'var(--red)'     },
    { k:'forearm', l:'Przedramię',  u:'cm', min:15, max:50,  step:0.5, c:'#38BDF8'        },
    { k:'thigh',   l:'Udo',         u:'cm', min:30, max:100, step:0.5, c:'var(--yellow)'  },
    { k:'calf',    l:'Łydka',       u:'cm', min:20, max:60,  step:0.5, c:'var(--teal)'    },
  ];

  // Clickable body zones — natural anatomical path shapes, no weight zone
  var BODY_ZONES = [
    { k:'neck', l:'Szyja', c:'var(--pink)',
      paths:['M91,41 C90,47 89,52 89,58 L111,58 C111,52 110,47 109,41 Z'],
      lx:100, ly:52, la:'middle', lfs:5 },
    { k:'chest', l:'Klatka', c:'var(--orange)',
      paths:['M88,57 L112,57 C126,62 142,74 138,114 L62,114 C58,74 74,62 88,57 Z'],
      lx:100, ly:93, la:'middle', lfs:7 },
    { k:'waist', l:'Pas', c:'var(--green)',
      paths:['M62,114 L138,114 L134,148 L66,148 Z'],
      lx:100, ly:134, la:'middle', lfs:7 },
    { k:'hips', l:'Biodra', c:'var(--purple)',
      paths:['M66,148 L134,148 L140,184 L60,184 Z'],
      lx:100, ly:168, la:'middle', lfs:7 },
    { k:'bicep', l:'Biceps', c:'var(--red)',
      paths:['M55,72 C48,80 44,91 42,103 L41,117 L53,118 L52,101 C52,90 52,80 55,72 Z',
             'M145,72 C152,80 156,91 158,103 L159,117 L147,118 L148,101 C148,90 148,80 145,72 Z'],
      lx:46, ly:96, la:'middle', lfs:5.5, rot:-90 },
    { k:'forearm', l:'Przedramię', c:'#38BDF8',
      paths:['M41,117 L40,133 C39,141 41,147 45,150 L54,149 L53,118 Z',
             'M159,117 L160,133 C161,141 159,147 155,150 L146,149 L147,118 Z'],
      lx:46, ly:134, la:'middle', lfs:4.2, rot:-90 },
    { k:'thigh', l:'Udo', c:'var(--yellow)',
      paths:['M60,183 L72,247 L91,247 L88,183 Z','M112,183 L109,247 L128,247 L140,183 Z'],
      lx:76, ly:219, la:'middle', lfs:7 },
    { k:'calf', l:'Łydka', c:'var(--teal)',
      paths:['M72,247 L75,302 L90,302 L91,247 Z','M109,247 L110,302 L125,302 L128,247 Z'],
      lx:80, ly:277, la:'middle', lfs:5.5 },
  ];

  var PHOTO_SLOTS = [
    { k:'front',     l:'Przód'     },
    { k:'leftSide',  l:'Bok Lewy'  },
    { k:'back',      l:'Plecy'     },
    { k:'rightSide', l:'Bok Prawy' },
  ];

  var DEFAULT_VALS = { weight:75, neck:38, waist:80, hips:95, chest:100, bicep:35, forearm:28, thigh:55, calf:37 };

  function resizePhoto(file, cb) {
    var reader = new FileReader();
    reader.onload = function(e) {
      var img = new Image();
      img.onload = function() {
        var MAX = 700, w = img.width, h = img.height;
        if (w > MAX || h > MAX) {
          if (w > h) { h = Math.round(h*MAX/w); w = MAX; }
          else { w = Math.round(w*MAX/h); h = MAX; }
        }
        var c = document.createElement('canvas');
        c.width = w; c.height = h;
        c.getContext('2d').drawImage(img, 0, 0, w, h);
        cb(c.toDataURL('image/jpeg', 0.8));
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  // ── BODY SILHOUETTE ──────────────────────────────────────────────────────
  function BodySilhouette() {
    var se = React.createElement;
    var fill = 'var(--s2)', stroke = 'var(--b1)', sw = 1.5;
    return se('g', null,
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
      se('g', { opacity:0.12 },
        se('ellipse', { cx:88, cy:105, rx:10, ry:14, fill:'var(--t1)' }),
        se('ellipse', { cx:112, cy:105, rx:10, ry:14, fill:'var(--t1)' })
      )
    );
  }

  // ── BODY FIGURE — natural zone paths, no circles ─────────────────────────
  function BodyFigureMeasurements(props) {
    var active = props.active, f = props.values, onSelect = props.onSelect;
    var fieldMap = {};
    MEAS_FIELDS.forEach(function(m){ fieldMap[m.k] = m; });

    return _h('svg', { viewBox:'-25 -39 250 393', width:'100%', style:{ display:'block' } },
      _h(BodySilhouette, null),
      BODY_ZONES.map(function(z) {
        var field = fieldMap[z.k];
        var isActive = active === z.k;
        var col = z.c;
        var tx = z.rot ? 'rotate('+z.rot+','+z.lx+','+z.ly+')' : undefined;

        var shapeEls = z.paths.map(function(d, i) {
          return _h('path', { key:'p'+i, d:d,
            fill:col, fillOpacity: isActive ? '0.32' : '0.07',
            stroke:col, strokeOpacity: isActive ? '1' : '0.3',
            strokeWidth: isActive ? 1.5 : 0.8,
            style:{ cursor:'pointer', transition:'fill-opacity .2s',
                    filter: isActive ? 'drop-shadow(0 0 3px '+col+')' : 'none' },
            onClick:function(){ onSelect(z.k); }
          });
        });

        var nameEl = _h('text', { key:'ln', x:z.lx, y:z.ly, textAnchor:z.la,
          fontSize:z.lfs||7, fill: isActive ? col : 'var(--t2)',
          fontWeight: isActive ? '700' : '500', transform:tx,
          pointerEvents:'none', style:{ transition:'fill .2s' }
        }, z.l);

        // Show value below name in wide non-rotated zones
        var valEl = isActive && !z.rot && f[z.k] != null
          ? _h('text', { key:'lv', x:z.lx, y:z.ly+(z.lfs||7)+1, textAnchor:z.la,
              fontSize:(z.lfs||7)-0.5, fill:col, fontWeight:'700', pointerEvents:'none'
            }, f[z.k]+field.u)
          : null;

        return _h('g', { key:z.k }, shapeEls, nameEl, valEl);
      })
    );
  }

  // ── PHOTO SLOT (side column) ─────────────────────────────────────────────
  function PhotoSlotSide(props) {
    var slot = props.slot, src = props.src, onPhoto = props.onPhoto;
    return _h('div', { style:{ display:'flex', flexDirection:'column', alignItems:'center', gap:2 } },
      _h('label', { style:{ display:'block', cursor:'pointer', width:'100%' } },
        src
          ? _h('div', { style:{ position:'relative' } },
              _h('img', { src:src, style:{ width:'100%', aspectRatio:'3/4', objectFit:'cover',
                borderRadius:'var(--r2)', border:'2px solid var(--green)', display:'block' } }),
              _h('div', { style:{ position:'absolute', top:3, right:3, width:13, height:13,
                borderRadius:'50%', background:'var(--green)', display:'flex',
                alignItems:'center', justifyContent:'center', fontSize:'.5rem', color:'white' } }, '✓')
            )
          : _h('div', { style:{ width:'100%', aspectRatio:'3/4', borderRadius:'var(--r2)',
              border:'1.5px dashed var(--b1)', background:'var(--s3)',
              display:'flex', alignItems:'center', justifyContent:'center',
              color:'var(--t3)', fontSize:'1rem' } }, '+'),
        _h('input', { type:'file', accept:'image/*', capture:'environment', style:{ display:'none' },
          onChange:function(e){
            var f=e.target.files[0]; if(!f) return;
            resizePhoto(f, function(d){ onPhoto(slot.k, d); });
            e.target.value='';
          }
        })
      ),
      _h('div', { style:{ fontSize:'.58rem', color:src?'var(--green)':'var(--t3)',
        fontWeight:600, textAlign:'center', lineHeight:1.2 } }, slot.l)
    );
  }

  // ── MEASUREMENTS ADD SHEET ────────────────────────────────────────────────
  function MeasurementsAddSheet(props) {
    var su = ET.useStore(); var store = su.store, update = su.update;
    var toast = ET.useToast();
    var ac = React.useState('chest'); var activeSpot = ac[0], setActiveSpot = ac[1];
    var ph = React.useState({}); var photos = ph[0], setPhotos = ph[1];

    function getDefaults() {
      var last = (store.measurements||[])[0];
      var o = Object.assign({ date:ET.dstr() }, DEFAULT_VALS);
      if (last) MEAS_FIELDS.forEach(function(m){ if (last[m.k]!=null) o[m.k]=last[m.k]; });
      return o;
    }

    var fs = React.useState(getDefaults); var f = fs[0], setF = fs[1];
    function upF(key, val) { setF(function(prev){ var o={}; o[key]=val; return Object.assign({},prev,o); }); }

    // Edit mode: preload record data when sheet opens with an edit target
    React.useEffect(function() {
      if (props.open && props.edit) {
        var o = Object.assign({ date:props.edit.date }, DEFAULT_VALS);
        MEAS_FIELDS.forEach(function(m){ if (props.edit[m.k]!=null) o[m.k]=props.edit[m.k]; });
        setF(o);
        setPhotos(props.edit.photos || {});
      }
    }, [props.open, props.edit]);

    function handleClose() {
      setF(getDefaults());
      setActiveSpot('chest');
      setPhotos({});
      props.onClose();
    }

    function onPhoto(key, dataUrl) {
      setPhotos(function(p){ var o={}; o[key]=dataUrl; return Object.assign({},p,o); });
    }

    function save() {
      var pc = Object.keys(photos).length;
      var editRec = props.edit;
      update(function(s){
        var next;
        if (editRec) {
          next = Object.assign({}, s, {
            measurements: (s.measurements||[]).map(function(m){
              return m.id===editRec.id ? Object.assign({}, m, f, { photos:photos }) : m;
            })
          });
          if (ET.logChange) next = ET.logChange(next, { section:'measurements', title:'Edycja pomiaru', desc:'Zmieniono pomiar z '+ET.fmtDate(f.date) });
        } else {
          next = Object.assign({}, s, {
            measurements: [Object.assign({ id:Date.now() }, f, { photos:photos })].concat(s.measurements||[])
          });
        }
        return next;
      });
      // Core (TOM II): masa → historia masy ciała (append-only)
      if (window.etcore && f.weight) { try { window.etcore.bus.publish('WeightUpdated', { weight:f.weight, measuredAt: f.date ? new Date(f.date).getTime() : Date.now() }, 'user'); } catch(e) { console.error('[core]', e); } }
      toast(editRec ? 'Pomiar zaktualizowany ✓' : 'Pomiary zapisane'+(pc>0?' · '+pc+' zdjęć ✓':' ✓'), 'success');
      handleClose();
    }

    var activeField = MEAS_FIELDS.find(function(m){ return m.k===activeSpot; });
    var pc = Object.keys(photos).length;

    return _h(ET.Sheet, { open:props.open, onClose:handleClose, title:props.edit ? 'Edytuj pomiar' : 'Nowy pomiar' },

      // Date
      _h('div', { className:'field', style:{ marginBottom:10 } },
        _h('label', null, 'Data'),
        _h('input', { type:'date', value:f.date, onChange:function(e){ upF('date', e.target.value); } })
      ),

      // Weight — dedicated card: number input + slider
      _h('div', { className:'card', style:{ marginBottom:12 } },
        _h('div', { style:{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8 } },
          _h('div', { style:{ display:'flex', alignItems:'center', gap:8 } },
            _h('div', { style:{ width:11, height:11, borderRadius:'50%', background:'var(--a-light)', flexShrink:0 } }),
            _h('span', { style:{ fontWeight:700, fontSize:'.9rem' } }, 'Waga')
          ),
          _h('div', { style:{ display:'flex', alignItems:'center', gap:5 } },
            _h('input', { type:'number', min:30, max:300, step:0.1, value:f.weight,
              style:{ width:68, textAlign:'right', fontSize:'1.1rem', fontWeight:700,
                color:'var(--a-light)', background:'var(--s3)',
                border:'1px solid var(--b1)', borderRadius:'var(--r2)', padding:'4px 6px' },
              onChange:function(e){ var v=parseFloat(e.target.value); if(!isNaN(v)) upF('weight',v); }
            }),
            _h('span', { style:{ fontSize:'.78rem', color:'var(--t3)' } }, 'kg')
          )
        ),
        _h('div', { className:'slider-wrap' },
          _h('input', { type:'range', min:30, max:200, step:0.1, value:f.weight,
            onChange:function(e){ upF('weight', parseFloat(e.target.value)); }
          })
        )
      ),

      // Hint
      _h('div', { style:{ fontSize:'.66rem', color:'var(--t3)', textAlign:'center', marginBottom:5 } },
        'Kliknij część ciała aby wybrać pomiar'
      ),

      // 3-column grid: [photos-left] [body] [photos-right]
      _h('div', { style:{ display:'grid', gridTemplateColumns:'84px 1fr 84px', gap:8,
        alignItems:'stretch', marginBottom:10 } },
        // Left column: Przód (top) + Bok Lewy (bottom)
        _h('div', { style:{ display:'flex', flexDirection:'column', gap:8, justifyContent:'space-between' } },
          _h(PhotoSlotSide, { key:'front',    slot:PHOTO_SLOTS[0], src:photos.front,    onPhoto:onPhoto }),
          _h(PhotoSlotSide, { key:'leftSide', slot:PHOTO_SLOTS[1], src:photos.leftSide, onPhoto:onPhoto })
        ),
        // Center: body SVG
        _h(BodyFigureMeasurements, { active:activeSpot, values:f, onSelect:setActiveSpot }),
        // Right column: Plecy (top) + Bok Prawy (bottom)
        _h('div', { style:{ display:'flex', flexDirection:'column', gap:8, justifyContent:'space-between' } },
          _h(PhotoSlotSide, { key:'back',      slot:PHOTO_SLOTS[2], src:photos.back,      onPhoto:onPhoto }),
          _h(PhotoSlotSide, { key:'rightSide', slot:PHOTO_SLOTS[3], src:photos.rightSide, onPhoto:onPhoto })
        )
      ),

      // Active zone measurement control
      activeField && activeField.k !== 'weight' && _h('div', { className:'card', style:{ marginBottom:10 } },
        _h('div', { style:{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 } },
          _h('div', { style:{ display:'flex', gap:8, alignItems:'center' } },
            _h('div', { style:{ width:11, height:11, borderRadius:'50%', background:activeField.c, flexShrink:0 } }),
            _h('span', { style:{ fontWeight:700 } }, activeField.l)
          ),
          _h('div', { style:{ fontSize:'1.3rem', fontWeight:700, color:activeField.c } },
            f[activeField.k],
            _h('span', { style:{ fontSize:'.72rem', color:'var(--t3)', marginLeft:3 } }, activeField.u)
          )
        ),
        _h('div', { className:'slider-wrap' },
          _h('input', { type:'range', min:activeField.min, max:activeField.max, step:activeField.step,
            value:f[activeField.k],
            onChange:function(e){ upF(activeField.k, parseFloat(e.target.value)); }
          })
        ),
        _h('div', { style:{ display:'flex', justifyContent:'space-between', fontSize:'.6rem', color:'var(--t3)', marginTop:3 } },
          _h('span', null, activeField.min+activeField.u),
          _h('span', null, activeField.max+activeField.u)
        )
      ),

      // Quick-select chips (body measurements only, not weight)
      _h('div', { style:{ display:'flex', gap:5, flexWrap:'wrap', marginBottom:14 } },
        MEAS_FIELDS.filter(function(m){ return m.k!=='weight'; }).map(function(m) {
          var isAct = activeSpot === m.k;
          return _h('button', { key:m.k,
            style:{ padding:'5px 9px', borderRadius:'var(--r2)',
              border:'1px solid '+(isAct?m.c:'var(--b1)'),
              background:isAct?m.c+'22':'var(--s3)',
              color:isAct?m.c:'var(--t2)',
              cursor:'pointer', fontSize:'.68rem', fontWeight:600, transition:'all .15s' },
            onClick:function(){ setActiveSpot(m.k); }
          }, m.l+': '+f[m.k]+m.u);
        })
      ),

      _h('button', { className:'btn btn-primary', style:{ width:'100%' }, onClick:save },
        props.edit ? 'Zapisz zmiany' : (pc>0 ? 'Zapisz pomiary + '+pc+' zdjęć' : 'Zapisz pomiary')
      )
    );
  }

  // Klasyczny widok — bez zmian, ścieżka WEB. Patrz dispatcher
  // `MeasurementsModule` i `MeasurementsModuleMobile` poniżej.
  function MeasurementsModuleClassic() {
    var su = ET.useStore(); var store = su.store;
    var nav = ET.useNav(); var params = nav.params || {};
    var sa = React.useState(!!params.openAdd); var showAdd = sa[0], setShowAdd = sa[1];
    var lb = React.useState(null); var lightbox = lb[0], setLightbox = lb[1];
    var ed = React.useState(null); var editTarget = ed[0], setEditTarget = ed[1];
    var co = React.useState(false); var showCoach = co[0], setShowCoach = co[1];
    var ti = React.useState(null); var tileOpen = ti[0], setTileOpen = ti[1];

    function openEdit(m) { setEditTarget(m); setShowAdd(true); }

    var meas = store.measurements || [];
    var last = meas[0], prev = meas[1];
    var firstMeas = meas.length ? meas[meas.length-1] : null;

    if (showCoach) {
      var insights = (ET.AIEngine && ET.AIEngine.coachMeasurements) ? ET.AIEngine.coachMeasurements(store) : [];
      return _h('div', { className:'fade-in' },
        _h('div', { style:{ display:'flex', alignItems:'center', gap:10, marginBottom:16 } },
          _h('button', { className:'btn btn-ghost btn-sm btn-icon', onClick:function(){ setShowCoach(false); } }, '←'),
          _h('div', null,
            _h('h1', { style:{ fontSize:'1.1rem', fontWeight:700 } }, '🤖 AI Coach — Pomiary'),
            _h('div', { style:{ fontSize:'.72rem', color:'var(--t3)', marginTop:2 } }, 'Analiza trendów i składu ciała')
          )
        ),
        ET.InsightList ? ET.InsightList(insights) : null
      );
    }

    var comp = last ? ET.bodyComp(last, store.profile) : {};
    var height = (store.profile && store.profile.height) || null;

    function seriesFor(kind) {
      return meas.slice().reverse().map(function(m) {
        var v = kind==='bmi' ? ET.bmi(m.weight, height) : kind==='whr' ? ET.whr(m.waist, m.hips) : (m.waist!=null ? m.waist : null);
        return v!=null ? { date:m.date, val:v } : null;
      }).filter(Boolean);
    }
    function Sparkline(pts, color) {
      if (pts.length < 2) return _h('div', { style:{ fontSize:'.7rem', color:'var(--t3)', padding:'8px 0', textAlign:'center' } }, 'Za mało danych do wykresu');
      var vals = pts.map(function(p){ return p.val; });
      var min = Math.min.apply(null, vals), max = Math.max.apply(null, vals);
      var W=280, H=48, pad=5, rng=(max-min)||1;
      function x(i){ return pad + i/(pts.length-1)*(W-2*pad); }
      function y(v){ return H-pad - ((v-min)/rng)*(H-2*pad); }
      return _h('svg', { viewBox:'0 0 '+W+' '+H, style:{ width:'100%', height:'auto' } },
        _h('polyline', { points:pts.map(function(p,i){ return x(i)+','+y(p.val); }).join(' '), fill:'none', stroke:color||'var(--a-light)', strokeWidth:2 }),
        pts.map(function(p,i){ return _h('circle', { key:i, cx:x(i), cy:y(p.val), r:2, fill:color||'var(--a-light)' }); })
      );
    }
    var METRIC_TILES = [
      { id:'bmi',   label:'BMI',        val: comp.bmi!=null ? comp.bmi.toFixed(1) : '—', cat:comp.bmiCat },
      { id:'whr',   label:'WHR',        val: comp.whr!=null ? comp.whr.toFixed(2) : '—', cat:comp.whrCat },
      { id:'waist', label:'Obwód pasa', val: (last && last.waist!=null) ? last.waist+' cm' : '—', cat:comp.waistCat },
    ];

    function diff(key) {
      if (!last||!prev||last[key]==null||prev[key]==null) return null;
      return (last[key]-prev[key]).toFixed(1);
    }

    return _h('div', { className:'fade-in' },
      _h('div', { className:'page-hdr' },
        _h('div', null,
          _h('h1', null, '📏 Pomiary ciała'),
          _h('p', null, meas.length+' wpisów')
        ),
        _h('div', { style:{ display:'flex', gap:8, flexWrap:'wrap' } },
          _h('button', { className:'btn btn-ghost', style:{ fontSize:'.75rem', padding:'8px 12px' }, onClick:function(){ setShowCoach(true); } }, '🤖 AI Coach'),
          _h('button', { className:'btn btn-primary', onClick:function(){ setEditTarget(null); setShowAdd(true); } }, '+ Dodaj pomiar')
        )
      ),

      // ── 3 KAFELKI: BMI / WHR / OBWÓD PASA (prompt 3.1) ───────────────────
      last && _h('div', { style:{ marginBottom:14 } },
        _h('div', { className:'grid-3', style:{ gap:8 } },
          METRIC_TILES.map(function(t) {
            var c = t.cat ? t.cat.color : 'var(--t3)';
            var open = tileOpen===t.id;
            return _h('div', { key:t.id, className:'card', style:{ cursor:'pointer', textAlign:'center', padding:'12px 8px', borderTop:'3px solid '+c, background: open?'var(--s3)':'var(--s2)' },
              onClick:function(){ setTileOpen(open?null:t.id); } },
              _h('div', { style:{ fontSize:'.6rem', color:'var(--t3)', marginBottom:3 } }, t.label),
              _h('div', { style:{ fontSize:'1.4rem', fontWeight:800 } }, t.val),
              t.cat && _h('div', { style:{ fontSize:'.6rem', fontWeight:700, color:c, marginTop:2 } }, t.cat.label)
            );
          })
        ),
        tileOpen && (function() {
          var mt = METRIC_TILES.find(function(x){ return x.id===tileOpen; }) || {};
          return _h('div', { className:'card', style:{ marginTop:8, padding:'10px 12px' } },
            _h('div', { style:{ fontSize:'.66rem', color:'var(--t3)', marginBottom:6, textTransform:'uppercase', letterSpacing:'.05em', fontWeight:700 } }, 'Trend — '+mt.label),
            Sparkline(seriesFor(tileOpen), mt.cat && mt.cat.color)
          );
        })()
      ),

      last && _h('div', { className:'card card-accent', style:{ marginBottom:14, cursor:'pointer' }, onClick:function(){ openEdit(last); } },
        _h('div', { style:{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 } },
          _h('div', { style:{ fontSize:'.65rem', color:'var(--t3)', fontWeight:700,
            textTransform:'uppercase', letterSpacing:'.08em' } },
            'Ostatni pomiar — '+ET.fmtDate(last.date)
          ),
          _h('span', { style:{ fontSize:'.72rem', color:'var(--a-light)' } }, '✏️ Edytuj')
        ),
        last.photos && Object.keys(last.photos).length > 0 &&
          _h('div', { style:{ display:'flex', gap:5, marginBottom:12, overflowX:'auto' } },
            PHOTO_SLOTS.filter(function(sl){ return last.photos[sl.k]; }).map(function(sl){
              return _h('div', { key:sl.k, style:{ flexShrink:0, cursor:'pointer' },
                onClick:function(e){ e.stopPropagation(); setLightbox({ src:last.photos[sl.k], label:sl.l, date:last.date }); }
              },
                _h('img', { src:last.photos[sl.k],
                  style:{ width:64, height:84, objectFit:'cover', borderRadius:'var(--r2)', border:'1px solid var(--b1)', display:'block' } }),
                _h('div', { style:{ fontSize:'.5rem', color:'var(--t3)', textAlign:'center', marginTop:2 } }, sl.l)
              );
            })
          ),
        _h('div', { className:'grid-4', style:{ gap:8 } },
          MEAS_FIELDS.map(function(m) {
            if (last[m.k]==null) return null;
            var d = diff(m.k);
            var goodDown = m.k==='weight'||m.k==='waist'||m.k==='hips';
            var dc = d==null?'':parseFloat(d)===0?'var(--t3)':
              goodDown?(parseFloat(d)>0?'var(--red)':'var(--green)'):(parseFloat(d)>0?'var(--green)':'var(--red)');
            return _h('div', { key:m.k, style:{ textAlign:'center' } },
              _h('div', { style:{ fontSize:'1rem', fontWeight:700, color:m.c } },
                last[m.k], _h('span', { style:{ fontSize:'.62rem', color:'var(--t3)' } }, m.u)),
              _h('div', { style:{ fontSize:'.62rem', color:'var(--t3)' } }, m.l),
              d!=null && parseFloat(d)!==0 &&
                _h('div', { style:{ fontSize:'.6rem', color:dc, fontWeight:700 } }, (parseFloat(d)>0?'+':'')+d)
            );
          })
        )
      ),

      // ── BODY FAT (BMI/WHR/pas są w kafelkach powyżej) ────────────────────
      // Karta zawsze widoczna gdy jest pomiar — z podpowiedzią czego brakuje do wyliczenia
      last && _h('div', { className:'card', style:{ marginBottom:14 } },
        _h('div', { style:{ fontWeight:700, fontSize:'.82rem', color:'var(--t2)', marginBottom:10 } }, '🧬 Skład ciała'),
        comp.bodyFat!=null
          ? _h('div', { style:{ display:'flex', alignItems:'center', justifyContent:'space-between', background:'var(--s3)', borderRadius:'var(--r2)', padding:'10px 14px' } },
              _h('div', null,
                _h('div', { style:{ fontSize:'.6rem', color:'var(--t3)', marginBottom:2 } }, 'Tkanka tłuszczowa (US Navy)'),
                _h('div', { style:{ fontSize:'1.4rem', fontWeight:800 } }, comp.bodyFat.toFixed(1)+'%')
              ),
              comp.bodyFatCat && _h('span', { style:{ fontSize:'.72rem', fontWeight:700, color:comp.bodyFatCat.color } }, comp.bodyFatCat.label)
            )
          : _h('div', { style:{ fontSize:'.72rem', color:'var(--t3)', lineHeight:1.5 } },
              (function() {
                if (!comp.height) return '📐 Dodaj wzrost w Profilu, aby liczyć BMI i % tkanki tłuszczowej.';
                var missing = [];
                if (last.neck==null)  missing.push('szyja');
                if (last.waist==null) missing.push('pas');
                if (comp.gender==='female' && last.hips==null) missing.push('biodra');
                return '📐 Aby wyliczyć % tkanki tłuszczowej (US Navy), dodaj pomiar: '+(missing.join(', ')||'—')+'.';
              })()
            )
      ),

      // ── PORÓWNANIE Z PIERWSZYM POMIAREM (spec 8.3) ───────────────────────
      last && firstMeas && meas.length>1 && _h('div', { className:'card', style:{ marginBottom:14 } },
        _h('div', { style:{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 } },
          _h('div', { style:{ fontWeight:700, fontSize:'.82rem', color:'var(--t2)' } }, '📊 Zmiana od pierwszego pomiaru'),
          _h('div', { style:{ fontSize:'.6rem', color:'var(--t3)' } }, ET.fmtDate(firstMeas.date)+' → '+ET.fmtDate(last.date))
        ),
        _h('div', { className:'grid-4', style:{ gap:8 } },
          MEAS_FIELDS.map(function(m) {
            if (last[m.k]==null || firstMeas[m.k]==null) return null;
            var d = last[m.k]-firstMeas[m.k];
            if (Math.abs(d) < 0.05) return _h('div', { key:m.k, style:{ textAlign:'center' } },
              _h('div', { style:{ fontSize:'.95rem', fontWeight:700, color:m.c } }, last[m.k]),
              _h('div', { style:{ fontSize:'.6rem', color:'var(--t3)' } }, m.l),
              _h('div', { style:{ fontSize:'.6rem', color:'var(--t3)' } }, '→ 0')
            );
            var goodDown = m.k==='weight'||m.k==='waist'||m.k==='hips';
            var positive = goodDown ? d<0 : d>0;
            var col = positive ? 'var(--green)' : 'var(--red)';
            var arrow = d>0 ? '↑' : '↓';
            return _h('div', { key:m.k, style:{ textAlign:'center' } },
              _h('div', { style:{ fontSize:'.95rem', fontWeight:700, color:m.c } }, last[m.k]),
              _h('div', { style:{ fontSize:'.6rem', color:'var(--t3)' } }, m.l),
              _h('div', { style:{ fontSize:'.62rem', fontWeight:700, color:col } }, arrow+' '+(d>0?'+':'')+d.toFixed(1))
            );
          })
        )
      ),

      meas.length===0 && _h(ET.Placeholder, { icon:'📏', title:'Brak pomiarów',
        desc:'Kliknij część ciała na ludziku i ustaw wartość suwakiem.' }),

      meas.slice(last?1:0).map(function(m) {
        var hasPhotos = m.photos && Object.keys(m.photos).length > 0;
        return _h('div', { key:m.id, className:'card card-sm', style:{ marginBottom:6, cursor:'pointer' }, onClick:function(){ openEdit(m); } },
          _h('div', { style:{ display:'flex', justifyContent:'space-between', alignItems:'center',
            flexWrap:'wrap', gap:6, marginBottom:hasPhotos?8:0 } },
            _h('div', { style:{ fontSize:'.78rem', fontWeight:600, color:'var(--t2)' } }, ET.fmtDate(m.date)),
            _h('div', { style:{ display:'flex', gap:5, flexWrap:'wrap' } },
              MEAS_FIELDS.filter(function(fld){ return m[fld.k]!=null; }).map(function(fm){
                return _h('span', { key:fm.k, className:'chip', style:{ fontSize:'.65rem' } },
                  fm.l+': ', _h('b', { style:{ color:'var(--t1)', marginLeft:3 } }, m[fm.k]+fm.u));
              }),
              hasPhotos && _h('span', { className:'badge badge-teal', style:{ fontSize:'.6rem' } },
                '📸 '+Object.keys(m.photos).length)
            )
          ),
          hasPhotos && _h('div', { style:{ display:'flex', gap:4 } },
            PHOTO_SLOTS.filter(function(sl){ return m.photos[sl.k]; }).map(function(sl){
              return _h('div', { key:sl.k, style:{ cursor:'pointer' },
                onClick:function(e){ e.stopPropagation(); setLightbox({ src:m.photos[sl.k], label:sl.l, date:m.date }); }
              },
                _h('img', { src:m.photos[sl.k],
                  style:{ width:44, height:58, objectFit:'cover', borderRadius:'var(--r2)', border:'1px solid var(--b1)' } })
              );
            })
          )
        );
      }),

      _h(MeasurementsAddSheet, { open:showAdd, edit:editTarget, onClose:function(){ setShowAdd(false); setEditTarget(null); } }),

      lightbox && _h('div', {
        style:{ position:'fixed', inset:0, background:'rgba(0,0,0,.88)', zIndex:9999,
          display:'flex', alignItems:'center', justifyContent:'center', padding:16 },
        onClick:function(){ setLightbox(null); }
      },
        _h('div', { style:{ position:'relative', maxWidth:420, width:'100%' },
          onClick:function(e){ e.stopPropagation(); }
        },
          _h('img', { src:lightbox.src, style:{ width:'100%', borderRadius:'var(--r2)', display:'block' } }),
          _h('div', { style:{ padding:'8px 12px', background:'rgba(0,0,0,.7)',
            borderRadius:'0 0 var(--r2) var(--r2)', display:'flex', justifyContent:'space-between', alignItems:'center' } },
            _h('div', { style:{ color:'white', fontSize:'.82rem', fontWeight:600 } },
              lightbox.label,
              _h('span', { style:{ color:'#aaa', marginLeft:8, fontWeight:400 } }, ET.fmtDate(lightbox.date))
            ),
            _h('button', {
              style:{ background:'none', border:'1px solid rgba(255,255,255,.3)', color:'white',
                padding:'4px 10px', borderRadius:'var(--r2)', cursor:'pointer', fontSize:'.78rem' },
              onClick:function(){ setLightbox(null); }
            }, '✕')
          )
        )
      )
    );
  }

  // Web zostaje przy widoku klasycznym; iOS dostaje redesign „Aurora Glass".
  function MeasurementsModule() {
    return ET.IS_WEB ? _h(MeasurementsModuleClassic, null) : _h(MeasurementsModuleMobile, null);
  }

  // ── POMIARY (iOS) — redesign „Aurora Glass" ───────────────────────────────
  // Handoff sekcja 8: karta teal z masą ciała + sparkline, „OBWODY" jako
  // lista wierszy z paskiem, „ZDJĘCIA SYLWETKI" 3 sloty + „Porównaj".
  // Wejście danych (klikalny ludzik, suwaki, upload zdjęć) NIE jest objęte
  // makietą — `MeasurementsAddSheet` reużyty wprost, bez zmian.
  // Odstępstwa (real data, bez fabrykacji):
  //  - design ma plakietkę „cel 84,0 kg" — apka NIE ma pojęcia celu masy
  //    ciała nigdzie (sprawdzone: js/goals.js nie ma kategorii wagowej,
  //    profil też nie) — pominięte, zamiast zmyślać cel, którego user nigdy
  //    nie ustawił.
  //  - „OBWODY" pokazuje WSZYSTKIE zapisane obwody (apka śledzi 8, design
  //    ma sztywno 5) — nie obcinam realnych danych do liczby z makiety.
  //  - zdjęcia: apka ma 4 realne sloty (Przód/Bok Lewy/Plecy/Bok Prawy),
  //    design ma 3 (Przód/Bok/Tył) — zostają wszystkie 4, bo to więcej
  //    precyzyjnych, realnych danych, nie mniej.
  //  - BMI/WHR/skład ciała/porównanie-do-pierwszego-pomiaru to prawdziwe,
  //    już istniejące analizy spoza makiety — zostają pod spodem (jak
  //    AIWorkoutAnalysis w podsumowaniu treningu), zamiast je wyrzucać.
  function MeasurementsModuleMobile() {
    var su = ET.useStore(); var store = su.store;
    var sa = React.useState(false); var showAdd = sa[0], setShowAdd = sa[1];
    var lb = React.useState(null); var lightbox = lb[0], setLightbox = lb[1];
    var ed = React.useState(null); var editTarget = ed[0], setEditTarget = ed[1];
    var cmp = React.useState(false); var showCompare = cmp[0], setShowCompare = cmp[1];
    var co = React.useState(false); var showCoach = co[0], setShowCoach = co[1];

    function openEdit(m) { setEditTarget(m); setShowAdd(true); }

    var meas = store.measurements || [];
    var last = meas[0] || null, prev = meas[1] || null;
    var firstMeas = meas.length ? meas[meas.length-1] : null;
    var height = (store.profile && store.profile.height) || null;
    var comp = last ? ET.bodyComp(last, store.profile) : {};

    if (showCoach) {
      var insights = (ET.AIEngine && ET.AIEngine.coachMeasurements) ? ET.AIEngine.coachMeasurements(store) : [];
      return _h('div', { className:'scr-in' },
        _h('div', { style:{ display:'flex', alignItems:'center', gap:10, marginBottom:16 } },
          _h('button', { onClick:function(){ setShowCoach(false); },
            style:{ width:36, height:36, borderRadius:'50%', border:'1px solid var(--b1)', background:'var(--s2)', color:'var(--t2)', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' } },
            _h('svg', { width:15, height:15, viewBox:'0 0 24 24', fill:'none', stroke:'currentColor', strokeWidth:2.4, strokeLinecap:'round', strokeLinejoin:'round' }, _h('path', { d:'M15 6l-6 6 6 6' }))),
          _h('div', null,
            _h('div', { style:{ fontSize:15, fontWeight:800 } }, 'AI Coach — Pomiary'),
            _h('div', { style:{ fontSize:11.5, color:'var(--t3)' } }, 'Analiza trendów i składu ciała'))
        ),
        ET.InsightList ? ET.InsightList(insights) : null
      );
    }

    // Referencja do delty masy — najstarszy pomiar sprzed ≥42 dni, w braku
    // takiego: najstarszy dostępny (etykieta okresu liczona z realnych dat).
    var weightRef = null, weightRefWeeks = null;
    if (last && meas.length > 1) {
      var threshold = new Date(); threshold.setDate(threshold.getDate()-42);
      var thresholdKey = ET.dstr(threshold);
      weightRef = meas.slice(1).find(function(m){ return m.date <= thresholdKey; }) || meas[meas.length-1];
      if (weightRef && weightRef.weight != null && last.weight != null) {
        weightRefWeeks = Math.max(1, Math.round((new Date(last.date) - new Date(weightRef.date)) / (7*86400000)));
      } else weightRef = null;
    }
    var weightDelta = (weightRef && last.weight!=null && weightRef.weight!=null) ? +(last.weight - weightRef.weight).toFixed(1) : null;

    var weightSeries = meas.slice().reverse().filter(function(m){ return m.weight!=null; }).map(function(m){ return { date:m.date, val:m.weight }; });

    function FilledSparkline(pts, color) {
      if (pts.length < 2) return _h('div', { style:{ fontSize:11, color:'var(--t3)', padding:'16px 0', textAlign:'center' } }, 'Za mało danych do wykresu');
      var vals = pts.map(function(p){ return p.val; });
      var min = Math.min.apply(null, vals), max = Math.max.apply(null, vals);
      var W=280, H=56, pad=4, rng=(max-min)||1;
      function x(i){ return pad + i/(pts.length-1)*(W-2*pad); }
      function y(v){ return H-pad - ((v-min)/rng)*(H-2*pad); }
      var line = pts.map(function(p,i){ return x(i)+','+y(p.val); }).join(' ');
      var area = x(0)+','+H+' '+line+' '+x(pts.length-1)+','+H;
      return _h('svg', { viewBox:'0 0 '+W+' '+H, style:{ width:'100%', height:56, display:'block' } },
        _h('defs', null, _h('linearGradient', { id:'measSpark', x1:'0', y1:'0', x2:'0', y2:'1' },
          _h('stop', { offset:'0', stopColor:color, stopOpacity:'.35' }),
          _h('stop', { offset:'1', stopColor:color, stopOpacity:'0' }))),
        _h('polygon', { points:area, fill:'url(#measSpark)' }),
        _h('polyline', { points:line, fill:'none', stroke:color, strokeWidth:2, strokeLinecap:'round', strokeLinejoin:'round' })
      );
    }

    var CIRCUM_FIELDS = MEAS_FIELDS.filter(function(m){ return m.k!=='weight'; });

    return _h('div', { className:'scr-in' },
      _h('div', { style:{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:18 } },
        _h('div', { style:{ fontSize:27, fontWeight:800, letterSpacing:'-.03em' } }, 'Pomiary'),
        _h('div', { style:{ display:'flex', gap:8 } },
          _h('button', { onClick:function(){ setShowCoach(true); },
            style:{ width:36, height:36, borderRadius:'50%', border:'1px solid var(--b1)', background:'var(--s2)', color:'var(--t2)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', fontSize:15 } }, '🤖'),
          _h('button', { onClick:function(){ setEditTarget(null); setShowAdd(true); },
            style:{ width:36, height:36, borderRadius:'50%', border:'none', background:'var(--teal)', color:'var(--bg)', fontSize:18, fontWeight:700, cursor:'pointer' } }, '+')
        )
      ),

      !last && _h(ET.Placeholder, { icon:'📏', title:'Brak pomiarów', desc:'Kliknij część ciała na ludziku i ustaw wartość suwakiem.' }),

      // ── KARTA MASY CIAŁA ────────────────────────────────────────────────
      last && last.weight != null && _h('div', { className:'glass', style:{ padding:20, borderRadius:22, marginBottom:16,
        background:'linear-gradient(158deg,rgba(20,184,166,.14),rgba(255,255,255,.02))', border:'1px solid rgba(20,184,166,.28)' } },
        _h('div', { style:{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:6, flexWrap:'wrap', gap:8 } },
          _h('div', null,
            _h('div', { style:{ fontSize:9.5, fontWeight:800, letterSpacing:'.1em', color:'var(--t3)', textTransform:'uppercase', marginBottom:5 } }, 'Masa ciała'),
            _h('div', { style:{ fontSize:32, fontWeight:800, letterSpacing:'-.03em', color:'var(--teal)' } }, last.weight+' kg')
          ),
          weightDelta != null && _h('div', { style:{ display:'flex', alignItems:'center', gap:5, padding:'6px 11px', borderRadius:100, flexShrink:0,
            background: weightDelta===0 ? 'var(--s3)' : weightDelta>0 ? 'rgba(239,68,68,.12)' : 'rgba(16,185,129,.12)',
            color: weightDelta===0 ? 'var(--t3)' : weightDelta>0 ? 'var(--red)' : 'var(--green)' } },
            _h('span', { style:{ fontSize:12, fontWeight:800 } }, (weightDelta>0?'+':'')+weightDelta+' kg'),
            _h('span', { style:{ fontSize:10.5, opacity:.85 } }, '/ '+weightRefWeeks+' tyg.')
          )
        ),
        FilledSparkline(weightSeries, '#14B8A6')
      ),

      // ── OBWODY ────────────────────────────────────────────────────────
      last && _h('div', { style:{ marginBottom:20 } },
        _h('div', { style:{ fontSize:10, fontWeight:800, letterSpacing:'.1em', color:'var(--t3)', textTransform:'uppercase', marginBottom:10 } }, 'Obwody'),
        _h('div', { style:{ display:'flex', flexDirection:'column', gap:10 } },
          CIRCUM_FIELDS.filter(function(m){ return last[m.k]!=null; }).map(function(m) {
            var pct = Math.max(4, Math.min(100, (last[m.k]-m.min)/(m.max-m.min)*100));
            var d = (prev && prev[m.k]!=null) ? +(last[m.k]-prev[m.k]).toFixed(1) : null;
            return _h('div', { key:m.k, style:{ display:'flex', alignItems:'center', gap:12 } },
              _h('span', { style:{ width:78, flexShrink:0, fontSize:12.5, fontWeight:600, color:'var(--t2)' } }, m.l),
              _h('div', { style:{ width:88, height:5, borderRadius:3, background:'rgba(255,255,255,.08)', flexShrink:0, overflow:'hidden' } },
                _h('div', { style:{ width:pct+'%', height:'100%', borderRadius:3, background:m.c } })),
              _h('span', { style:{ fontSize:12.5, fontWeight:700, fontVariantNumeric:'tabular-nums' } }, last[m.k]+m.u),
              _h('span', { style:{ marginLeft:'auto', fontSize:11, fontWeight:700, color: d==null||d===0 ? 'var(--t3)' : (d>0?'var(--red)':'var(--green)') } },
                d==null ? '' : (d===0 ? '—' : (d>0?'+':'')+d))
            );
          })
        )
      ),

      // ── ZDJĘCIA SYLWETKI ──────────────────────────────────────────────
      last && _h('div', { style:{ marginBottom:20 } },
        _h('div', { style:{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 } },
          _h('span', { style:{ fontSize:10, fontWeight:800, letterSpacing:'.1em', color:'var(--t3)', textTransform:'uppercase' } }, 'Zdjęcia sylwetki'),
          prev && _h('span', { onClick:function(){ setShowCompare(true); }, style:{ fontSize:11.5, fontWeight:700, color:'var(--teal)', cursor:'pointer' } }, 'Porównaj')
        ),
        _h('div', { style:{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:8 } },
          PHOTO_SLOTS.map(function(sl) {
            var src = last.photos && last.photos[sl.k];
            return _h('div', { key:sl.k, style:{ cursor: src?'pointer':'default' },
              onClick:function(){ if (src) setLightbox({ src:src, label:sl.l, date:last.date }); } },
              src
                ? _h('img', { src:src, style:{ width:'100%', aspectRatio:'3/4', objectFit:'cover', borderRadius:14, border:'1px solid var(--b1)', display:'block' } })
                : _h('div', { style:{ width:'100%', aspectRatio:'3/4', borderRadius:14, border:'1.5px dashed var(--b2)', background:'var(--s2)',
                    display:'flex', alignItems:'center', justifyContent:'center' } },
                    _h('svg', { width:18, height:18, viewBox:'0 0 24 24', fill:'none', stroke:'var(--t3)', strokeWidth:1.6, strokeLinecap:'round', strokeLinejoin:'round' },
                      _h('path', { d:'M4 8a1 1 0 0 1 1-1h2l1.5-2h7L17 7h2a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1z' }), _h('circle', { cx:12, cy:13, r:3.3 }))),
              _h('div', { style:{ fontSize:9.5, fontWeight:600, color:src?'var(--t2)':'var(--t3)', textAlign:'center', marginTop:4 } }, sl.l)
            );
          })
        )
      ),

      // ── BMI / WHR / SKŁAD CIAŁA (poza makietą, prawdziwa analiza) ────────
      last && height && _h('div', { style:{ display:'flex', flexDirection:'column', gap:10, marginBottom:20 } },
        _h('div', { style:{ fontSize:10, fontWeight:800, letterSpacing:'.1em', color:'var(--t3)', textTransform:'uppercase', marginBottom:2 } }, 'Wskaźniki'),
        _h('div', { style:{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8 } },
          [
            { l:'BMI', v: comp.bmi!=null ? comp.bmi.toFixed(1) : '—', cat:comp.bmiCat },
            { l:'WHR', v: comp.whr!=null ? comp.whr.toFixed(2) : '—', cat:comp.whrCat },
            { l:'Tłuszcz', v: comp.bodyFat!=null ? comp.bodyFat.toFixed(1)+'%' : '—', cat:comp.bodyFatCat },
          ].map(function(t, i) {
            return _h('div', { key:i, style:{ padding:'12px 8px', borderRadius:14, background:'var(--s2)', border:'1px solid var(--b1)', textAlign:'center' } },
              _h('div', { style:{ fontSize:16, fontWeight:800 } }, t.v),
              _h('div', { style:{ fontSize:9, color:'var(--t3)', marginTop:3 } }, t.l),
              t.cat && _h('div', { style:{ fontSize:9, fontWeight:700, color:t.cat.color, marginTop:2 } }, t.cat.label)
            );
          })
        )
      ),

      // ── HISTORIA ──────────────────────────────────────────────────────
      meas.length > 0 && _h('div', { style:{ display:'flex', flexDirection:'column', gap:8 } },
        _h('div', { style:{ fontSize:10, fontWeight:800, letterSpacing:'.1em', color:'var(--t3)', textTransform:'uppercase', marginBottom:2 } }, 'Historia'),
        meas.map(function(m) {
          return _h('div', { key:m.id, onClick:function(){ openEdit(m); },
            style:{ display:'flex', alignItems:'center', gap:12, padding:'11px 14px', borderRadius:16, background:'var(--s2)', border:'1px solid var(--b1)', cursor:'pointer' } },
            _h('div', { style:{ flex:1, minWidth:0 } },
              _h('div', { style:{ fontSize:13, fontWeight:700 } }, ET.fmtDate(m.date)),
              _h('div', { style:{ fontSize:11, color:'var(--t3)', marginTop:2 } },
                MEAS_FIELDS.filter(function(fld){ return m[fld.k]!=null; }).map(function(fm){ return fm.l+' '+m[fm.k]+fm.u; }).join(' · '))
            ),
            m.photos && Object.keys(m.photos).length>0 && _h('span', { style:{ fontSize:11, color:'var(--teal)', fontWeight:700, flexShrink:0 } }, Object.keys(m.photos).length+' 📸')
          );
        })
      ),

      _h(MeasurementsAddSheet, { open:showAdd, edit:editTarget, onClose:function(){ setShowAdd(false); setEditTarget(null); } }),

      // ── PORÓWNAJ (najnowszy vs poprzedni pomiar, te same sloty) ─────────
      showCompare && prev && _h('div', { style:{ position:'fixed', inset:0, background:'rgba(0,0,0,.88)', zIndex:9999, display:'flex', flexDirection:'column',
        padding:'max(16px,env(safe-area-inset-top,0px)) 16px 16px' }, onClick:function(){ setShowCompare(false); } },
        _h('div', { style:{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 } },
          _h('span', { style:{ color:'#fff', fontWeight:700, fontSize:14 } }, 'Porównanie'),
          _h('button', { onClick:function(){ setShowCompare(false); }, style:{ background:'none', border:'1px solid rgba(255,255,255,.3)', color:'#fff', width:30, height:30, borderRadius:'50%', cursor:'pointer' } }, '✕')
        ),
        _h('div', { style:{ display:'flex', gap:12, overflowX:'auto' }, onClick:function(e){ e.stopPropagation(); } },
          PHOTO_SLOTS.filter(function(sl){ return (prev.photos&&prev.photos[sl.k]) || (last.photos&&last.photos[sl.k]); }).map(function(sl) {
            return _h('div', { key:sl.k, style:{ flexShrink:0, width:130 } },
              _h('div', { style:{ fontSize:11, color:'#fff', fontWeight:700, marginBottom:6, textAlign:'center' } }, sl.l),
              _h('div', { style:{ display:'flex', flexDirection:'column', gap:6 } },
                [{ m:prev, tag:ET.fmtDate(prev.date) }, { m:last, tag:ET.fmtDate(last.date) }].map(function(x, i) {
                  var src = x.m.photos && x.m.photos[sl.k];
                  return _h('div', { key:i, style:{ textAlign:'center' } },
                    src ? _h('img', { src:src, style:{ width:'100%', aspectRatio:'3/4', objectFit:'cover', borderRadius:10, display:'block' } })
                        : _h('div', { style:{ width:'100%', aspectRatio:'3/4', borderRadius:10, background:'rgba(255,255,255,.08)' } }),
                    _h('div', { style:{ fontSize:9.5, color:'#aaa', marginTop:3 } }, x.tag)
                  );
                })
              )
            );
          })
        )
      ),

      lightbox && _h('div', {
        style:{ position:'fixed', inset:0, background:'rgba(0,0,0,.88)', zIndex:9999,
          display:'flex', alignItems:'center', justifyContent:'center', padding:16 },
        onClick:function(){ setLightbox(null); }
      },
        _h('div', { style:{ position:'relative', maxWidth:420, width:'100%' }, onClick:function(e){ e.stopPropagation(); } },
          _h('img', { src:lightbox.src, style:{ width:'100%', borderRadius:'var(--r2)', display:'block' } }),
          _h('div', { style:{ padding:'8px 12px', background:'rgba(0,0,0,.7)', borderRadius:'0 0 var(--r2) var(--r2)', display:'flex', justifyContent:'space-between', alignItems:'center' } },
            _h('div', { style:{ color:'white', fontSize:'.82rem', fontWeight:600 } }, lightbox.label, _h('span', { style:{ color:'#aaa', marginLeft:8, fontWeight:400 } }, ET.fmtDate(lightbox.date))),
            _h('button', { style:{ background:'none', border:'1px solid rgba(255,255,255,.3)', color:'white', padding:'4px 10px', borderRadius:'var(--r2)', cursor:'pointer', fontSize:'.78rem' },
              onClick:function(){ setLightbox(null); } }, '✕')
          )
        )
      )
    );
  }

  ET.MeasurementsModule = MeasurementsModule;
  ET.MeasurementsAddSheet = MeasurementsAddSheet;
})();
