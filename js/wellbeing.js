(function() {
  'use strict';
  window.ET = window.ET || {};
  var _h = React.createElement;

  var WB_SLIDERS = [
    { k:'energy',     l:'Energia',      icon:'⚡', min:1, max:10, c:'var(--yellow)' },
    { k:'mood',       l:'Nastrój',      icon:'😊', min:1, max:10, c:'var(--green)'  },
    { k:'stress',     l:'Stres',        icon:'😰', min:1, max:10, c:'var(--red)'    },
    { k:'doms',       l:'DOMS',         icon:'🦵', min:0, max:5,  c:'var(--orange)' },
    { k:'motivation', l:'Motywacja',    icon:'🔥', min:1, max:10, c:'var(--purple)' },
  ];

  var DEFAULTS = { energy:7, mood:7, stress:3, doms:1, motivation:7, notes:'' };

  // ── Reusable form (używany w module i w strength) ───────────────────────────
  function WellbeingForm(props) {
    var f = props.values;
    var upF = props.onChange;
    var label = props.label || 'Samopoczucie';
    var sublabel = props.sublabel || '';

    return _h('div', { className:'fade-in' },
      _h('div', { style:{ marginBottom:16 } },
        _h('h2', { style:{ fontSize:'1.1rem', fontWeight:700, marginBottom:4 } }, label),
        sublabel && _h('div', { style:{ fontSize:'.75rem', color:'var(--t3)' } }, sublabel)
      ),

      _h('div', { className:'card', style:{ marginBottom:14 } },
        WB_SLIDERS.map(function(sl) {
          return _h('div', { key:sl.k, style:{ marginBottom:14 } },
            _h('div', { style:{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 } },
              _h('div', { style:{ fontSize:'.82rem', fontWeight:600, color:'var(--t2)' } }, sl.icon+' '+sl.l),
              _h('div', { style:{ fontSize:'1rem', fontWeight:700, color:sl.c } }, f[sl.k])
            ),
            _h('div', { className:'slider-wrap' },
              _h('input', { type:'range', min:sl.min, max:sl.max, value:f[sl.k],
                onChange:function(e){ upF(sl.k, +e.target.value); }
              })
            )
          );
        })
      ),

      _h('div', { className:'field' },
        _h('label', null, 'Notatki (opcjonalnie)'),
        _h('textarea', { value:f.notes, onChange:function(e){ upF('notes', e.target.value); }, placeholder:'Co wpłynęło na Twoje samopoczucie?', style:{ minHeight:60 } })
      ),

      _h('div', { style:{ display:'flex', gap:8 } },
        props.onSkip && _h('button', { className:'btn btn-ghost', style:{ flex:1 }, onClick:props.onSkip }, 'Pomiń'),
        _h('button', { className:'btn btn-primary', style:{ flex:2 }, onClick:props.onSave }, props.saveLabel || 'Zapisz')
      )
    );
  }

  // ── Główny moduł ────────────────────────────────────────────────────────────
  function WellbeingModule() {
    var su = ET.useStore(); var store = su.store, update = su.update;
    var toast = ET.useToast();
    var sa = React.useState(false); var showAdd = sa[0], setShowAdd = sa[1];
    var fv = React.useState(Object.assign({ date:ET.dstr() }, DEFAULTS));
    var f = fv[0], setF = fv[1];
    function upF(key, val) { setF(function(prev){ var o={}; o[key]=val; return Object.assign({},prev,o); }); }

    function save() {
      update(function(s){ return Object.assign({},s,{ wellbeingEntries:[Object.assign({id:Date.now()},f)].concat(s.wellbeingEntries||[]) }); });
      toast('Samopoczucie zapisane ✓', 'success'); setShowAdd(false);
    }

    function score(e) { return Math.round(((e.energy+e.mood+e.motivation)/3 - e.stress/2 - e.doms/2)*10)/10; }

    var entries = store.wellbeingEntries||[];
    var avgEnergy = entries.length ? (entries.reduce(function(t,e){ return t+(e.energy||0); },0)/entries.length).toFixed(1) : '—';
    var avgMood   = entries.length ? (entries.reduce(function(t,e){ return t+(e.mood||0);   },0)/entries.length).toFixed(1) : '—';

    return _h('div', { className:'fade-in' },
      _h('div', { className:'page-hdr' },
        _h('div', null,
          _h('h1', null, '🌡 Samopoczucie'),
          _h('p', null, entries.length+' wpisów')
        ),
        _h('button', { className:'btn btn-primary', onClick:function(){ setF(Object.assign({ date:ET.dstr() }, DEFAULTS)); setShowAdd(true); } }, '+ Dodaj')
      ),

      entries.length>0 && _h('div', { className:'grid-2', style:{ marginBottom:16 } },
        _h(ET.StatCard, { label:'Śr. energia', value:avgEnergy+'/10', color:'var(--yellow)' }),
        _h(ET.StatCard, { label:'Śr. nastrój', value:avgMood+'/10', color:'var(--green)' })
      ),

      entries.length===0
        ? _h(ET.Placeholder, { icon:'🌡', title:'Brak wpisów', desc:'Oceniaj codzienne samopoczucie: energię, nastrój, stres i DOMS.' })
        : entries.map(function(e) {
            var s = score(e);
            var sc = s>=6?'var(--green)':s>=3?'var(--yellow)':'var(--red)';
            return _h('div', { key:e.id, className:'card', style:{ marginBottom:8 } },
              _h('div', { style:{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:8 } },
                _h('div', null,
                  _h('div', { style:{ fontWeight:700 } }, ET.fmtDate(e.date)+(e.tag ? ' · '+e.tag : '')),
                  e.notes && _h('div', { style:{ fontSize:'.72rem', color:'var(--t2)', marginTop:3, fontStyle:'italic' } }, e.notes)
                ),
                _h('div', { style:{ textAlign:'right' } },
                  _h('div', { style:{ fontSize:'1.1rem', fontWeight:700, color:sc } }, (s > 0 ? '+' : '') + s)
                )
              ),
              _h('div', { style:{ display:'flex', gap:8, flexWrap:'wrap' } },
                WB_SLIDERS.map(function(sl) {
                  if (e[sl.k]==null) return null;
                  return _h('div', { key:sl.k, style:{ textAlign:'center', minWidth:50 } },
                    _h('div', { style:{ fontSize:'.75rem', fontWeight:700, color:sl.c } }, sl.icon+' '+e[sl.k]),
                    _h('div', { style:{ fontSize:'.55rem', color:'var(--t3)' } }, sl.l)
                  );
                })
              )
            );
          }),

      _h(ET.Sheet, { open:showAdd, onClose:function(){ setShowAdd(false); }, title:'Jak się dziś czujesz?' },
        _h('div', { className:'field' }, _h('label', null, 'Data'), _h('input', { type:'date', value:f.date, onChange:function(e){ upF('date',e.target.value); } })),
        _h(WellbeingForm, { values:f, onChange:upF, saveLabel:'Zapisz samopoczucie', onSave:save })
      )
    );
  }

  // Helper: zapis wpisu samopoczucia ze znacznikiem (np. 'przed treningiem')
  function saveWellbeingEntry(update, values, tag) {
    var entry = Object.assign({ id:Date.now(), date:ET.dstr() }, values);
    if (tag) entry.tag = tag;
    update(function(s){ return Object.assign({},s,{ wellbeingEntries:[entry].concat(s.wellbeingEntries||[]) }); });
  }

  ET.WellbeingForm = WellbeingForm;
  ET.WellbeingDefaults = DEFAULTS;
  ET.saveWellbeingEntry = saveWellbeingEntry;
  ET.WellbeingModule = WellbeingModule;
})();
