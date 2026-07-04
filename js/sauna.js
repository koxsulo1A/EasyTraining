(function() {
  'use strict';
  window.ET = window.ET || {};
  var _h = React.createElement;

  var SAUNA_TYPES = [
    { id:'finnish', label:'Fińska (sucha)', icon:'🪵' },
    { id:'infrared', label:'Podczerwień', icon:'🌡' },
    { id:'steam', label:'Para (mokra)', icon:'💨' },
    { id:'outdoor', label:'Zewnętrzna', icon:'🌿' },
  ];

  var READINESS_FIELDS = [
    { key:'willingness', label:'Chęć na saunę', opts:['😤 Bez chęci','😐 Ujdzie','🔥 Pełna!'] },
    { key:'state',       label:'Samopoczucie',   opts:['😞 Słabo','😐 Normalnie','😄 Świetnie'] },
    { key:'fatigue',     label:'Zmęczenie',       opts:['😴 Bardzo zmęczony','😐 Umiarkowane','⚡ Brak zmęczenia'] },
  ];

  function SaunaAddSheet(props) {
    var su = ET.useStore(); var update = su.update;
    var toast = ET.useToast();
    var st = React.useState('readiness'); var step = st[0], setStep = st[1];
    var rd = React.useState({ willingness:2, state:2, fatigue:2 }); var readiness = rd[0], setReadiness = rd[1];
    var fs = React.useState({ date:ET.dstr(), duration:20, temp:80, type:'finnish', hrAfter:90, feeling:8, rounds:1, notes:'' });
    var f = fs[0], setF = fs[1];
    function upF(key, val) { setF(function(prev){ var o={}; o[key]=val; return Object.assign({},prev,o); }); }

    function handleClose() {
      setStep('readiness');
      setReadiness({ willingness:2, state:2, fatigue:2 });
      setF({ date:ET.dstr(), duration:20, temp:80, type:'finnish', hrAfter:90, feeling:8, rounds:1, notes:'' });
      props.onClose();
    }

    function save() {
      var session = Object.assign({ id:Date.now() }, f, { readiness:readiness });
      update(function(s){
        var n = Object.assign({},s,{ saunaSessions:[session].concat(s.saunaSessions) });
        return ET.syncGoals ? ET.syncGoals(n, 'sauna', session) : n;
      });
      toast('Sesja sauny zapisana ✓', 'success');
      handleClose();
    }

    return _h(ET.Sheet, { open:props.open, onClose:handleClose, title:step==='readiness'?'Gotowość do sauny':'Nowa sesja sauny' },

      step==='readiness' && _h('div', null,
        READINESS_FIELDS.map(function(field) {
          return _h('div', { key:field.key, style:{ marginBottom:14 } },
            _h('div', { style:{ fontSize:'.72rem', fontWeight:700, color:'var(--t3)', textTransform:'uppercase', letterSpacing:'.06em', marginBottom:8 } }, field.label),
            _h('div', { style:{ display:'flex', gap:6 } },
              field.opts.map(function(opt, i) {
                var active = readiness[field.key] === (i+1);
                return _h('button', { key:i,
                  style:{ flex:1, padding:'10px 4px', borderRadius:'var(--r2)', border:'1px solid '+(active?'var(--a)':'var(--b1)'), background:active?'var(--a-dim)':'var(--s3)', color:active?'var(--a-light)':'var(--t2)', cursor:'pointer', fontSize:'.68rem', fontWeight:600, lineHeight:1.3, textAlign:'center', transition:'all .15s' },
                  onClick:function(){ var o={}; o[field.key]=i+1; setReadiness(Object.assign({},readiness,o)); }
                }, opt);
              })
            )
          );
        }),
        _h('button', { className:'btn btn-primary', style:{ width:'100%', marginTop:6 }, onClick:function(){ setStep('form'); } }, '→ Dalej: Uzupełnij sesję')
      ),

      step==='form' && _h('div', null,
        _h('div', { className:'field' }, _h('label', null, 'Data'), _h('input', { type:'date', value:f.date, onChange:function(e){ upF('date',e.target.value); } })),

        _h('div', { className:'field' },
          _h('label', null, 'Typ sauny'),
          _h('div', { style:{ display:'flex', gap:6, flexWrap:'wrap' } },
            SAUNA_TYPES.map(function(t) {
              return _h('button', { key:t.id, className:'tag-btn'+(f.type===t.id?' active':''), onClick:function(){ upF('type',t.id); } }, t.icon+' '+t.label);
            })
          )
        ),

        _h('div', { className:'grid-2' },
          _h('div', { className:'field' },
            _h('label', { style:{ display:'flex', justifyContent:'space-between' } }, _h('span', null, 'Czas (min)'), _h('span', { style:{ color:'var(--orange)', fontWeight:700 } }, f.duration+'min')),
            _h('div', { className:'slider-wrap' }, _h('input', { type:'range', min:5, max:120, step:5, value:f.duration, onChange:function(e){ upF('duration',+e.target.value); } }))
          ),
          _h('div', { className:'field' },
            _h('label', { style:{ display:'flex', justifyContent:'space-between' } }, _h('span', null, 'Temperatura (°C)'), _h('span', { style:{ color:'var(--red)', fontWeight:700 } }, f.temp+'°C')),
            _h('div', { className:'slider-wrap' }, _h('input', { type:'range', min:40, max:120, step:5, value:f.temp, onChange:function(e){ upF('temp',+e.target.value); } }))
          )
        ),

        _h('div', { className:'grid-2' },
          _h('div', { className:'field' },
            _h('label', { style:{ display:'flex', justifyContent:'space-between' } }, _h('span', null, 'Rundy'), _h('span', { style:{ color:'var(--teal)', fontWeight:700 } }, f.rounds+'×')),
            _h('div', { className:'slider-wrap' }, _h('input', { type:'range', min:1, max:10, value:f.rounds, onChange:function(e){ upF('rounds',+e.target.value); } }))
          ),
          _h('div', { className:'field' },
            _h('label', { style:{ display:'flex', justifyContent:'space-between' } }, _h('span', null, 'Tętno po (bpm)'), _h('span', { style:{ color:'var(--pink)', fontWeight:700 } }, f.hrAfter)),
            _h('div', { className:'slider-wrap' }, _h('input', { type:'range', min:50, max:180, step:5, value:f.hrAfter, onChange:function(e){ upF('hrAfter',+e.target.value); } }))
          )
        ),

        _h('div', { className:'field' },
          _h('label', { style:{ display:'flex', justifyContent:'space-between' } }, _h('span', null, 'Samopoczucie po'), _h('span', { style:{ color:'var(--green)', fontWeight:700 } }, f.feeling+'/10')),
          _h('div', { className:'slider-wrap' }, _h('input', { type:'range', min:1, max:10, value:f.feeling, onChange:function(e){ upF('feeling',+e.target.value); } }))
        ),

        _h('div', { className:'field' }, _h('label', null, 'Notatki'), _h('textarea', { value:f.notes, onChange:function(e){ upF('notes',e.target.value); }, placeholder:'Jak się czułeś? Zimny prysznic? Medytacja?' })),

        _h('div', { style:{ display:'flex', gap:8 } },
          _h('button', { className:'btn btn-ghost', onClick:function(){ setStep('readiness'); } }, '← Wróć'),
          _h('button', { className:'btn btn-primary', style:{ flex:1 }, onClick:save }, 'Zapisz sesję')
        )
      )
    );
  }

  function SaunaModule() {
    var su = ET.useStore(); var store = su.store;
    var nav = ET.useNav(); var params = nav.params || {};
    var sa = React.useState(!!params.openAdd); var showAdd = sa[0], setShowAdd = sa[1];

    var sessions = store.saunaSessions || [];
    var totalMin = sessions.reduce(function(t,s){ return t+(s.duration||0); },0);
    var avgTemp = sessions.length ? Math.round(sessions.reduce(function(t,s){ return t+(s.temp||0); },0)/sessions.length) : 0;

    return _h('div', { className:'fade-in' },
      _h('div', { className:'page-hdr' },
        _h('div', null,
          _h('h1', null, '🔥 Sauna'),
          _h('p', null, sessions.length+' sesji')
        ),
        _h('button', { className:'btn btn-primary', onClick:function(){ setShowAdd(true); } }, '+ Nowa sesja')
      ),

      sessions.length>0 && _h('div', { className:'grid-3', style:{ marginBottom:16 } },
        _h(ET.StatCard, { label:'Łączny czas', value:totalMin+' min', color:'var(--orange)' }),
        _h(ET.StatCard, { label:'Śr. temperatura', value:avgTemp+'°C', color:'var(--red)' }),
        _h(ET.StatCard, { label:'Sesje', value:sessions.length, color:'var(--yellow)' })
      ),

      sessions.length===0
        ? _h(ET.Placeholder, { icon:'🔥', title:'Brak sesji sauny', desc:'Rejestruj sesje sauny z oceną gotowości i samopoczuciem.' })
        : sessions.map(function(s) {
            var typeInfo = SAUNA_TYPES.find(function(t){ return t.id===s.type; }) || SAUNA_TYPES[0];
            var rdColor = !s.readiness ? 'var(--t3)' : s.readiness.willingness===3?'var(--green)':s.readiness.willingness===1?'var(--red)':'var(--yellow)';
            return _h('div', { key:s.id, className:'card', style:{ marginBottom:8 } },
              _h('div', { style:{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:8 } },
                _h('div', null,
                  _h('div', { style:{ fontWeight:700, fontSize:'1rem', marginBottom:3 } }, typeInfo.icon+' '+typeInfo.label),
                  _h('div', { style:{ fontSize:'.72rem', color:'var(--t3)', marginBottom:4 } }, ET.fmtDate(s.date)+' · '+s.duration+' min · '+s.rounds+'× rundy'),
                  _h('div', { style:{ display:'flex', gap:4, flexWrap:'wrap' } },
                    _h('div', { className:'badge badge-red' }, s.temp+'°C'),
                    _h('div', { className:'badge badge-orange' }, '😊 '+s.feeling+'/10'),
                    s.hrAfter && _h('div', { className:'badge badge-pink' }, '❤ '+s.hrAfter+' bpm'),
                    s.readiness && _h('span', { style:{ fontSize:'.72rem', color:rdColor } }, ['','😤','😐','🔥'][s.readiness.willingness||0])
                  ),
                  s.notes && _h('div', { style:{ fontSize:'.72rem', color:'var(--t2)', marginTop:4, fontStyle:'italic' } }, s.notes)
                )
              )
            );
          }),

      _h(SaunaAddSheet, { open:showAdd, onClose:function(){ setShowAdd(false); } })
    );
  }

  ET.SaunaModule = SaunaModule;
  ET.SaunaAddSheet = SaunaAddSheet;
})();
