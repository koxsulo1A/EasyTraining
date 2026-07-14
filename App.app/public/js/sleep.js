(function() {
  'use strict';
  window.ET = window.ET || {};
  var _h = React.createElement;

  function SleepAddSheet(props) {
    var su = ET.useStore(); var store = su.store, update = su.update;
    var toast = ET.useToast();
    var fs = React.useState({ date:ET.dstr(), bedtime:'23:00', waketime:'07:00', quality:7, wakeups:0, notes:'' });
    var f = fs[0], setF = fs[1];
    function upF(key, val) { setF(function(prev){ var o={}; o[key]=val; return Object.assign({},prev,o); }); }

    function calcDur(b, w) {
      var bh=+b.split(':')[0], bm=+b.split(':')[1], wh=+w.split(':')[0], wm=+w.split(':')[1];
      var m=(wh*60+wm)-(bh*60+bm); if(m<0)m+=1440; return Math.round(m/60*10)/10;
    }

    function handleClose() {
      setF({ date:ET.dstr(), bedtime:'23:00', waketime:'07:00', quality:7, wakeups:0, notes:'' });
      props.onClose();
    }

    function save() {
      var dur = calcDur(f.bedtime, f.waketime);
      update(function(s){ return Object.assign({},s,{ sleepSessions:[Object.assign({},f,{id:Date.now(),duration:dur})].concat(s.sleepSessions) }); });
      // Core: Recovery Engine przelicza gotowość
      if (window.etcore) { try { window.etcore.bus.publish('SleepLogged', { duration:dur, quality:f.quality }, 'user'); } catch(e) { console.error('[core]', e); } }
      toast('Sen zapisany ✓', 'success');
      handleClose();
    }

    return _h(ET.Sheet, { open:props.open, onClose:handleClose, title:'Dodaj sen' },
      _h('div', { className:'field' }, _h('label', null, 'Data'), _h('input', { type:'date', value:f.date, onChange:function(e){ upF('date',e.target.value); } })),
      _h('div', { className:'grid-2' },
        _h('div', { className:'field' }, _h('label', null, 'Zaśnięcie'), _h('input', { type:'time', value:f.bedtime, onChange:function(e){ upF('bedtime',e.target.value); } })),
        _h('div', { className:'field' }, _h('label', null, 'Pobudka'), _h('input', { type:'time', value:f.waketime, onChange:function(e){ upF('waketime',e.target.value); } }))
      ),
      _h('div', { style:{ background:'var(--s3)', borderRadius:'var(--r2)', padding:12, marginBottom:14, textAlign:'center' } },
        _h('div', { style:{ fontSize:'.65rem', color:'var(--t3)' } }, 'Czas snu'),
        _h('div', { style:{ fontSize:'1.6rem', fontWeight:700 } }, calcDur(f.bedtime,f.waketime)+'h')
      ),
      _h('div', { className:'field' },
        _h('label', { style:{ display:'flex', justifyContent:'space-between' } }, _h('span', null, 'Jakość snu'), _h('span', { style:{ color:'var(--purple)', fontWeight:700 } }, f.quality+'/10')),
        _h('div', { className:'slider-wrap' }, _h('input', { type:'range', min:1, max:10, value:f.quality, onChange:function(e){ upF('quality',+e.target.value); } }))
      ),
      _h('div', { className:'field' },
        _h('label', { style:{ display:'flex', justifyContent:'space-between' } }, _h('span', null, 'Przebudzenia w nocy'), _h('span', { style:{ color:'var(--yellow)', fontWeight:700 } }, f.wakeups+'x')),
        _h('div', { className:'slider-wrap' }, _h('input', { type:'range', min:0, max:10, value:f.wakeups, onChange:function(e){ upF('wakeups',+e.target.value); } }))
      ),
      _h('div', { className:'field' }, _h('label', null, 'Notatki'), _h('textarea', { value:f.notes, onChange:function(e){ upF('notes',e.target.value); }, placeholder:'Jak spałeś? Sny, środowisko...' })),
      _h('button', { className:'btn btn-primary', style:{ width:'100%', marginTop:4 }, onClick:save }, 'Zapisz sen')
    );
  }

  function SleepModule() {
    var su = ET.useStore(); var store = su.store;
    var nav = ET.useNav(); var params = nav.params || {};
    var sa = React.useState(!!params.openAdd); var showAdd = sa[0], setShowAdd = sa[1];

    var sessions = store.sleepSessions||[];
    var avgDur = sessions.length ? (sessions.reduce(function(t,s){ return t+(s.duration||0); },0)/sessions.length).toFixed(1) : '—';
    var avgQual = sessions.length ? (sessions.reduce(function(t,s){ return t+(s.quality||0); },0)/sessions.length).toFixed(1) : '—';

    return _h('div', { className:'fade-in' },
      _h('div', { className:'page-hdr' },
        _h('div', null,
          _h('h1', null, 'Sen'),
          _h('p', null, sessions.length+' wpisów')
        ),
        _h('button', { className:'btn btn-primary', onClick:function(){ setShowAdd(true); } }, '+ Dodaj')
      ),

      sessions.length>0 && _h('div', { className:'grid-3', style:{ marginBottom:16 } },
        _h(ET.StatCard, { label:'Śr. czas snu', value:avgDur+'h', color:'var(--purple)' }),
        _h(ET.StatCard, { label:'Śr. jakość', value:avgQual+'/10', color:'var(--a-light)' }),
        _h(ET.StatCard, { label:'Wpisy', value:sessions.length, color:'var(--teal)' })
      ),

      sessions.length===0
        ? _h(ET.Placeholder, { icon:'😴', title:'Brak wpisów snu', desc:'Śledź godziny snu, jakość i gotowość do treningu.' })
        : sessions.map(function(s) {
            var rc2 = s.readiness>=70?'var(--green)':s.readiness>=40?'var(--yellow)':'var(--red)';
            return _h('div', { key:s.id, className:'card', style:{ marginBottom:8 } },
              _h('div', { style:{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:8 } },
                _h('div', null,
                  _h('div', { style:{ fontWeight:700, fontSize:'1rem' } }, s.duration+'h snu'),
                  _h('div', { style:{ fontSize:'.72rem', color:'var(--t3)', marginTop:2 } }, ET.fmtDate(s.date)+' · '+s.bedtime+' → '+s.waketime),
                  s.wakeups>0 && _h('div', { style:{ fontSize:'.7rem', color:'var(--yellow)', marginTop:3 } }, '⚡ '+s.wakeups+' przebudzeń')
                ),
                _h('div', { style:{ display:'flex', gap:5, flexWrap:'wrap', justifyContent:'flex-end' } },
                  _h('div', { className:'badge badge-purple' }, 'Jakość '+s.quality+'/10'),
                  s.readiness!=null && _h('div', { className:'badge', style:{ background:s.readiness>=70?'var(--green-d)':s.readiness>=40?'var(--yellow-d)':'var(--red-d)', color:rc2 } }, 'Got. '+s.readiness+'%')
                )
              )
            );
          }),

      _h(SleepAddSheet, { open:showAdd, onClose:function(){ setShowAdd(false); } })
    );
  }

  ET.SleepModule = SleepModule;
  ET.SleepAddSheet = SleepAddSheet;
})();
