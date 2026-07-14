(function() {
  'use strict';
  window.ET = window.ET || {};
  var _h = React.createElement;

  var PHOTO_SPOTS = [
    { id:'front_top',    label:'Przód — klatka', icon:'👤', pos:{ top:'8%',  left:'50%',  transform:'translateX(-50%)' } },
    { id:'front_bottom', label:'Przód — dół',    icon:'🦵', pos:{ top:'52%', left:'50%',  transform:'translateX(-50%)' } },
    { id:'left_side',    label:'Lewy bok',        icon:'◀',  pos:{ top:'30%', left:'8%',   transform:'none' } },
    { id:'right_side',   label:'Prawy bok',       icon:'▶',  pos:{ top:'30%', right:'8%',  transform:'none' } },
    { id:'back',         label:'Plecy',           icon:'🔙', pos:{ bottom:'8%',left:'50%', transform:'translateX(-50%)' } },
    { id:'face',         label:'Twarz',           icon:'😊', pos:{ top:'8%',  right:'8%',  transform:'none' } },
    { id:'other',        label:'Inne / Detal',    icon:'📷', pos:{ bottom:'8%',right:'8%', transform:'none' } },
  ];

  function resizePhoto(file, cb) {
    var reader = new FileReader();
    reader.onload = function(e) {
      var img = new Image();
      img.onload = function() {
        var MAX = 700;
        var w = img.width, h = img.height;
        if (w > MAX || h > MAX) {
          if (w > h) { h = Math.round(h*MAX/w); w = MAX; }
          else { w = Math.round(w*MAX/h); h = MAX; }
        }
        var canvas = document.createElement('canvas');
        canvas.width = w; canvas.height = h;
        canvas.getContext('2d').drawImage(img, 0, 0, w, h);
        cb(canvas.toDataURL('image/jpeg', 0.8));
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  function PhotosModule() {
    var su = ET.useStore(); var store = su.store, update = su.update;
    var toast = ET.useToast();

    var sd = React.useState(false); var showDialog = sd[0], setShowDialog = sd[1];
    var ls = React.useState(null); var lightbox = ls[0], setLightbox = ls[1];
    var sg = React.useState(null); var activeSpot = sg[0], setActiveSpot = sg[1];
    var sw = React.useState(''); var sessionWeight = sw[0], setSessionWeight = sw[1];
    var sn = React.useState(''); var sessionNote = sn[0], setSessionNote = sn[1];
    var sp = React.useState({}); var spotPhotos = sp[0], setSpotPhotos = sp[1]; // {spotId: dataUrl}
    var fi = React.useRef(null);
    var cmp = React.useState(false); var showCompare = cmp[0], setShowCompare = cmp[1];
    var cps = React.useState(null); var comparePos = cps[0], setComparePos = cps[1];

    var photos = store.photos||[];

    // Pozycje, dla których istnieją zdjęcia (do porównania)
    var spotsWithPhotos = PHOTO_SPOTS.filter(function(sp){ return photos.some(function(p){ return p.spot===sp.id; }); });
    var comparePhotos = comparePos ? photos.filter(function(p){ return p.spot===comparePos; }).slice().sort(function(a,b){ return a.date.localeCompare(b.date); }) : [];

    // group photos by session date for gallery
    var sessions = (function() {
      var map = {};
      photos.forEach(function(p) {
        var key = p.sessionId || p.date;
        if (!map[key]) map[key] = { date:p.date, weight:p.weight, note:p.note, spots:[], sessionId:key };
        map[key].spots.push(p);
      });
      return Object.values(map).sort(function(a,b){ return b.date.localeCompare(a.date); });
    })();

    function openSpotUpload(spotId) {
      setActiveSpot(spotId);
      fi.current && fi.current.click();
    }

    function handleFile(e) {
      var file = e.target.files[0];
      if (!file || !activeSpot) return;
      resizePhoto(file, function(dataUrl) {
        setSpotPhotos(function(prev){ var o={}; o[activeSpot]=dataUrl; return Object.assign({},prev,o); });
        toast('Zdjęcie dodane — zapisz sesję', 'default');
      });
      e.target.value = '';
    }

    function openNewSession() {
      setSpotPhotos({});
      setSessionWeight('');
      setSessionNote('');
      setActiveSpot(null);
      setShowDialog(true);
    }

    function saveSession() {
      var ids = Object.keys(spotPhotos);
      if (ids.length === 0) { toast('Dodaj co najmniej jedno zdjęcie', 'error'); return; }
      var sessionId = Date.now();
      var newPhotos = ids.map(function(spotId) {
        var spot = PHOTO_SPOTS.find(function(s){ return s.id===spotId; });
        return {
          id: sessionId + '_' + spotId,
          sessionId: String(sessionId),
          date: ET.dstr(),
          src: spotPhotos[spotId],
          spot: spotId,
          spotLabel: spot ? spot.label : spotId,
          weight: sessionWeight || null,
          note: sessionNote || ''
        };
      });
      update(function(s){ return Object.assign({},s,{ photos:newPhotos.concat(s.photos||[]) }); });
      toast(ids.length+' zdjęć zapisano ✓', 'success');
      setShowDialog(false);
    }

    function removePhoto(id) {
      if (!confirm('Usunąć zdjęcie?')) return;
      update(function(s){ return Object.assign({},s,{ photos:(s.photos||[]).filter(function(p){ return p.id!==id; }) }); });
      toast('Zdjęcie usunięto', 'default');
      if (lightbox && lightbox.id === id) setLightbox(null);
    }

    return _h('div', { className:'fade-in' },
      _h('div', { className:'page-hdr' },
        _h('div', null,
          _h('h1', null, '📸 Zdjęcia sylwetki'),
          _h('p', null, sessions.length+' sesji · '+photos.length+' zdjęć')
        ),
        _h('div', { style:{ display:'flex', gap:8, flexWrap:'wrap' } },
          photos.length>0 && _h('button', { className:'btn btn-ghost', style:{ fontSize:'.75rem', padding:'8px 12px' }, onClick:function(){ setComparePos(spotsWithPhotos[0] && spotsWithPhotos[0].id); setShowCompare(true); } }, '🔄 Porównanie'),
          _h('button', { className:'btn btn-primary', onClick:openNewSession }, '📷 Nowa sesja')
        )
      ),
      _h('input', { ref:fi, type:'file', accept:'image/*', style:{ display:'none' }, onChange:handleFile }),

      // ── PORÓWNANIE (spec 14.2) ───────────────────────────────────────────
      _h(ET.Sheet, { open:showCompare, onClose:function(){ setShowCompare(false); }, title:'Porównanie sylwetki' },
        _h('div', { style:{ fontSize:'.75rem', color:'var(--t3)', marginBottom:10 } }, 'Wybierz pozycję — zdjęcia od najstarszego do najnowszego:'),
        _h('div', { style:{ display:'flex', gap:5, flexWrap:'wrap', marginBottom:14 } },
          spotsWithPhotos.map(function(sp) {
            return _h('button', { key:sp.id, className:'tag-btn'+(comparePos===sp.id?' active':''), onClick:function(){ setComparePos(sp.id); } }, sp.icon+' '+sp.label);
          })
        ),
        comparePhotos.length===0
          ? _h('div', { style:{ fontSize:'.8rem', color:'var(--t3)', textAlign:'center', padding:'20px 0' } }, 'Brak zdjęć dla tej pozycji.')
          : _h('div', { style:{ display:'flex', gap:10, overflowX:'auto', paddingBottom:8 } },
              comparePhotos.map(function(p, i) {
                return _h('div', { key:p.id, style:{ flexShrink:0, textAlign:'center' } },
                  _h('img', { src:p.src, loading:'lazy', style:{ width:150, height:200, objectFit:'cover', borderRadius:'var(--r2)', border:'1px solid '+(i===0?'var(--b1)':i===comparePhotos.length-1?'var(--green)':'var(--b1)'), display:'block' } }),
                  _h('div', { style:{ fontSize:'.66rem', color:'var(--t2)', marginTop:4, fontWeight:600 } }, ET.fmtDate(p.date)),
                  _h('div', { style:{ fontSize:'.58rem', color:'var(--t3)' } }, i===0?'start':i===comparePhotos.length-1?'teraz':'',
                    p.weight?' · '+p.weight+' kg':'')
                );
              })
            )
      ),

      photos.length===0 && !showDialog
        ? _h(ET.Placeholder, { icon:'📸', title:'Brak zdjęć', desc:'Dokumentuj postępy sylwetki. Kliknij część ciała na ludziku żeby dodać zdjęcie.' })
        : sessions.map(function(sess) {
            return _h('div', { key:sess.sessionId, className:'card', style:{ marginBottom:14 } },
              _h('div', { style:{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 } },
                _h('div', null,
                  _h('div', { style:{ fontWeight:700, fontSize:'.9rem' } }, ET.fmtDate(sess.date)),
                  _h('div', { style:{ display:'flex', gap:6, marginTop:4 } },
                    sess.weight && _h('span', { className:'chip', style:{ fontSize:'.65rem' } }, sess.weight+' kg'),
                    sess.note && _h('span', { className:'chip', style:{ fontSize:'.65rem' } }, sess.note)
                  )
                ),
                _h('span', { className:'badge badge-teal' }, sess.spots.length+' zdjęć')
              ),
              _h('div', { style:{ display:'flex', gap:6, flexWrap:'wrap' } },
                sess.spots.map(function(p) {
                  return _h('div', { key:p.id, style:{ position:'relative', cursor:'pointer' }, onClick:function(){ setLightbox(p); } },
                    _h('img', { src:p.src, alt:p.spotLabel||'', loading:'lazy', style:{ width:80, height:80, objectFit:'cover', borderRadius:'var(--r2)', border:'1px solid var(--b1)' } }),
                    _h('div', { style:{ position:'absolute', bottom:2, left:0, right:0, textAlign:'center', fontSize:'.5rem', color:'white', background:'rgba(0,0,0,.5)', borderRadius:'0 0 var(--r2) var(--r2)', padding:'1px 2px' } }, p.spotLabel)
                  );
                })
              )
            );
          }),

      // ── Nowa sesja zdjęciowa ─────────────────────────────────────────────
      _h(ET.Sheet, { open:showDialog, onClose:function(){ setShowDialog(false); }, title:'Nowa sesja zdjęciowa' },
        _h('div', { className:'grid-2', style:{ marginBottom:14 } },
          _h('div', { className:'field', style:{ margin:0 } },
            _h('label', null, 'Waga (kg)'),
            _h('input', { type:'number', step:0.1, placeholder:'np. 82.5', value:sessionWeight, onChange:function(e){ setSessionWeight(e.target.value); } })
          ),
          _h('div', { className:'field', style:{ margin:0 } },
            _h('label', null, 'Notatka'),
            _h('input', { type:'text', placeholder:'np. 4 tyg. diety', value:sessionNote, onChange:function(e){ setSessionNote(e.target.value); } })
          )
        ),

        _h('div', { style:{ fontSize:'.72rem', color:'var(--t3)', marginBottom:12, textAlign:'center' } }, 'Kliknij przycisk przy każdej pozycji żeby dodać zdjęcie'),

        // Body figure with spot buttons
        _h('div', { style:{ position:'relative', width:'100%', paddingBottom:'110%', userSelect:'none' } },
          // SVG body
          _h('div', { style:{ position:'absolute', left:'50%', top:'5%', transform:'translateX(-50%)', width:'38%' } },
            _h('svg', { viewBox:'0 0 200 300', width:'100%' },
              _h('ellipse', { cx:100, cy:28, rx:20, ry:24, fill:'var(--s2)', stroke:'var(--b1)', strokeWidth:1.5 }),
              _h('rect', { x:91, y:50, width:18, height:14, rx:4, fill:'var(--s2)', stroke:'var(--b1)', strokeWidth:1.5 }),
              _h('path', { d:'M62 64 Q58 68 56 75 L50 130 Q48 145 55 150 L75 152 L80 180 L120 180 L125 152 L145 150 Q152 145 150 130 L144 75 Q142 68 138 64 Z', fill:'var(--s2)', stroke:'var(--b1)', strokeWidth:1.5 }),
              _h('path', { d:'M62 64 Q52 72 48 85 L42 120 Q40 128 44 132 L54 134 L58 130 L56 75 Z', fill:'var(--s2)', stroke:'var(--b1)', strokeWidth:1.5 }),
              _h('path', { d:'M138 64 Q148 72 152 85 L158 120 Q160 128 156 132 L146 134 L142 130 L144 75 Z', fill:'var(--s2)', stroke:'var(--b1)', strokeWidth:1.5 }),
              _h('path', { d:'M44 132 L40 155 Q38 165 42 168 L50 168 L54 134 Z', fill:'var(--s2)', stroke:'var(--b1)', strokeWidth:1.5 }),
              _h('path', { d:'M156 132 L160 155 Q162 165 158 168 L150 168 L146 134 Z', fill:'var(--s2)', stroke:'var(--b1)', strokeWidth:1.5 }),
              _h('path', { d:'M75 180 L68 240 Q66 250 72 252 L84 252 L88 180 Z', fill:'var(--s2)', stroke:'var(--b1)', strokeWidth:1.5 }),
              _h('path', { d:'M125 180 L132 240 Q134 250 128 252 L116 252 L112 180 Z', fill:'var(--s2)', stroke:'var(--b1)', strokeWidth:1.5 }),
              _h('path', { d:'M72 252 L70 292 Q70 298 76 298 L84 298 Q88 296 86 292 L84 252 Z', fill:'var(--s2)', stroke:'var(--b1)', strokeWidth:1.5 }),
              _h('path', { d:'M128 252 L130 292 Q130 298 124 298 L116 298 Q112 296 114 292 L116 252 Z', fill:'var(--s2)', stroke:'var(--b1)', strokeWidth:1.5 })
            )
          ),

          // Photo spot buttons positioned around the body
          PHOTO_SPOTS.map(function(spot) {
            var hasPhoto = !!spotPhotos[spot.id];
            var posStyle = Object.assign({ position:'absolute', display:'flex', flexDirection:'column', alignItems:'center', gap:3 }, spot.pos);
            return _h('div', { key:spot.id, style:posStyle },
              hasPhoto
                ? _h('div', { style:{ position:'relative', cursor:'pointer' }, onClick:function(){ openSpotUpload(spot.id); } },
                    _h('img', { src:spotPhotos[spot.id], style:{ width:52, height:52, objectFit:'cover', borderRadius:'var(--r2)', border:'2px solid var(--green)', display:'block' } }),
                    _h('div', { style:{ position:'absolute', top:-5, right:-5, width:16, height:16, borderRadius:'50%', background:'var(--green)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'.6rem', color:'white' } }, '✓')
                  )
                : _h('button', {
                    style:{ width:52, height:52, borderRadius:'var(--r2)', border:'1.5px dashed var(--b1)', background:'var(--s3)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.2rem', color:'var(--t3)', transition:'all .15s' },
                    onClick:function(){ openSpotUpload(spot.id); }
                  }, spot.icon),
              _h('div', { style:{ fontSize:'.52rem', color:hasPhoto?'var(--green)':'var(--t3)', fontWeight:600, textAlign:'center', maxWidth:60 } }, spot.label)
            );
          })
        ),

        Object.keys(spotPhotos).length > 0 && _h('div', { style:{ marginTop:8, fontSize:'.75rem', color:'var(--green)', textAlign:'center' } },
          '✓ '+Object.keys(spotPhotos).length+' zdjęć gotowych do zapisania'
        ),

        _h('button', { className:'btn btn-primary', style:{ width:'100%', marginTop:12 }, onClick:saveSession }, 'Zapisz sesję zdjęciową')
      ),

      // ── Lightbox ─────────────────────────────────────────────────────────
      lightbox && _h('div', { className:'photo-lightbox', onClick:function(){ setLightbox(null); } },
        _h('div', { style:{ position:'relative' }, onClick:function(e){ e.stopPropagation(); } },
          _h('img', { src:lightbox.src, alt:'' }),
          _h('div', { style:{ position:'absolute', top:8, right:8, display:'flex', gap:6 } },
            _h('button', { className:'btn btn-danger btn-sm', onClick:function(){ removePhoto(lightbox.id); } }, '🗑 Usuń'),
            _h('button', { className:'btn btn-secondary btn-sm', onClick:function(){ setLightbox(null); } }, '✕')
          ),
          _h('div', { style:{ background:'rgba(0,0,0,.7)', borderRadius:'0 0 var(--r2) var(--r2)', padding:'8px 12px', textAlign:'center' } },
            _h('div', { style:{ fontWeight:700, marginBottom:2 } }, lightbox.spotLabel || ET.fmtDate(lightbox.date)),
            _h('div', { style:{ fontSize:'.75rem', color:'var(--t3)' } }, ET.fmtDate(lightbox.date)),
            lightbox.weight && _h('span', { style:{ color:'var(--a-light)', marginRight:8 } }, lightbox.weight+' kg'),
            lightbox.note && _h('span', { style:{ color:'var(--t2)' } }, lightbox.note)
          )
        )
      )
    );
  }

  ET.PhotosModule = PhotosModule;
})();
