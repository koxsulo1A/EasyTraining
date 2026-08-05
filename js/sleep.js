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

  // Klasyczny widok — bez zmian, ścieżka WEB. Patrz dispatcher `SleepModule`
  // i `SleepModuleMobile` poniżej.
  function SleepModuleClassic() {
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

  // Web zostaje przy widoku klasycznym; iOS dostaje redesign „Aurora Glass".
  function SleepModule() {
    return ET.IS_WEB ? _h(SleepModuleClassic, null) : _h(SleepModuleMobile, null);
  }

  var SLEEP_DAYS = ['Pn','Wt','Śr','Cz','Pt','So','Nd'];
  function dkey(d) { return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'); }
  function fmtHM(hoursFloat) {
    var totalMin = Math.round(hoursFloat*60);
    var h = Math.floor(totalMin/60), m = totalMin%60;
    return h+' h '+m+' min';
  }

  // ── SEN (iOS) — redesign „Aurora Glass" ───────────────────────────────────
  // Handoff sekcja 7: karta żółta z czasem snu + jakością, pasek faz snu,
  // dwie karty (HRV/tętno spocz.), wykres 7 nocy.
  // Odstępstwo (real data, bez fabrykacji): apka NIE ma żadnej integracji z
  // wearable/HealthKit dla snu — `js/health.js` importuje tylko BIEGI z Apple
  // Health, zero HRV/tętna spoczynkowego/faz snu w store.sleepSessions
  // (tylko bedtime/waketime/quality/wakeups z ręcznego formularza). Wymyślanie
  // tych liczb wprowadzałoby usera w błąd co do jego prawdziwej fizjologii —
  // zamiast tego: pasek faz zastąpiony realnym zaśnięcie→pobudka, a karty
  // HRV/tętno zastąpione realnymi PRZEBUDZENIA i ŚREDNIA 7 DNI.
  function SleepModuleMobile() {
    var su = ET.useStore(); var store = su.store;
    var nav = ET.useNav(); var params = nav.params || {};
    var sa = React.useState(!!params.openAdd); var showAdd = sa[0], setShowAdd = sa[1];

    var sessions = store.sleepSessions || [];
    var latest = sessions[0] || null;

    var week = React.useMemo(function() {
      var days = [];
      var now = new Date();
      for (var i = 6; i >= 0; i--) {
        var d = new Date(now); d.setDate(now.getDate()-i);
        var key = dkey(d);
        var entry = sessions.find(function(s){ return s.date === key; });
        days.push({ key:key, label:SLEEP_DAYS[(d.getDay()+6)%7], dur: entry ? entry.duration : 0, isToday: i===0 });
      }
      return days;
    }, [sessions]);
    var max7 = week.reduce(function(m,d){ return Math.max(m, d.dur); }, 0);
    var withData = week.filter(function(d){ return d.dur>0; });
    var avg7 = withData.length ? withData.reduce(function(t,d){ return t+d.dur; },0)/withData.length : null;

    return _h('div', { className:'scr-in' },
      _h('div', { style:{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:18 } },
        _h('div', { style:{ fontSize:27, fontWeight:800, letterSpacing:'-.03em' } }, 'Sen'),
        _h('button', { onClick:function(){ setShowAdd(true); },
          style:{ width:36, height:36, borderRadius:'50%', border:'none', background:'var(--yellow)', color:'var(--bg)', fontSize:18, fontWeight:700, cursor:'pointer' } }, '+')
      ),

      !latest && _h(ET.Placeholder, { icon:'😴', title:'Brak wpisów snu', desc:'Śledź godziny snu, jakość i przebudzenia.' }),

      latest && _h('div', { className:'glass', style:{ padding:20, borderRadius:22, marginBottom:16,
        background:'linear-gradient(158deg,rgba(245,158,11,.14),rgba(255,255,255,.02))', border:'1px solid rgba(245,158,11,.28)' } },
        _h('div', { style:{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:16, flexWrap:'wrap', gap:10 } },
          _h('div', null,
            _h('div', { style:{ fontSize:9.5, fontWeight:800, letterSpacing:'.1em', color:'var(--t3)', textTransform:'uppercase', marginBottom:5 } }, 'Czas snu'),
            _h('div', { style:{ fontSize:32, fontWeight:800, letterSpacing:'-.03em', color:'var(--yellow)' } }, fmtHM(latest.duration||0))
          ),
          _h('div', { style:{ textAlign:'right' } },
            _h('div', { style:{ fontSize:9.5, fontWeight:800, letterSpacing:'.1em', color:'var(--t3)', textTransform:'uppercase', marginBottom:5 } }, 'Jakość'),
            _h('div', { style:{ fontSize:22, fontWeight:800, letterSpacing:'-.02em' } }, (latest.quality||0)+'/10')
          )
        ),
        _h('div', { style:{ display:'flex', alignItems:'center', gap:10, padding:'12px 14px', borderRadius:14, background:'rgba(255,255,255,.04)' } },
          _h('svg', { width:16, height:16, viewBox:'0 0 24 24', fill:'none', stroke:'var(--yellow)', strokeWidth:1.8, strokeLinecap:'round', strokeLinejoin:'round' },
            _h('path', { d:'M20.5 13A8 8 0 1 1 11 3.5 6.2 6.2 0 0 0 20.5 13z' })),
          _h('span', { style:{ fontSize:13, fontWeight:700 } }, latest.bedtime),
          _h('span', { style:{ color:'var(--t3)', fontSize:12 } }, '→'),
          _h('svg', { width:16, height:16, viewBox:'0 0 24 24', fill:'none', stroke:'var(--yellow)', strokeWidth:1.8, strokeLinecap:'round', strokeLinejoin:'round' },
            _h('circle', { cx:12, cy:12, r:4 }), _h('path', { d:'M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4' })),
          _h('span', { style:{ fontSize:13, fontWeight:700 } }, latest.waketime),
          latest.wakeups > 0 && _h('span', { style:{ marginLeft:'auto', fontSize:11, fontWeight:700, color:'var(--orange)' } }, latest.wakeups+' przebudzeń')
        )
      ),

      latest && _h('div', { style:{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:20 } },
        _h('div', { style:{ padding:'14px', borderRadius:16, background:'var(--s2)', border:'1px solid var(--b1)' } },
          _h('div', { style:{ fontSize:20, fontWeight:800 } }, latest.wakeups||0),
          _h('div', { style:{ fontSize:9, fontWeight:800, color:'var(--t3)', letterSpacing:'.08em', marginTop:4 } }, 'PRZEBUDZENIA')),
        _h('div', { style:{ padding:'14px', borderRadius:16, background:'var(--s2)', border:'1px solid var(--b1)' } },
          _h('div', { style:{ fontSize:20, fontWeight:800 } }, avg7==null ? '—' : fmtHM(avg7)),
          _h('div', { style:{ fontSize:9, fontWeight:800, color:'var(--t3)', letterSpacing:'.08em', marginTop:4 } }, 'ŚREDNIA 7 DNI'))
      ),

      _h('div', { style:{ marginBottom:20 } },
        _h('div', { style:{ fontSize:10, fontWeight:800, letterSpacing:'.1em', color:'var(--t3)', textTransform:'uppercase', marginBottom:12 } }, '7 nocy'),
        _h('div', { style:{ display:'flex', alignItems:'flex-end', gap:8, height:90 } },
          week.map(function(d) {
            var h = max7 > 0 ? Math.max(4, Math.round(d.dur/max7*100)) : 4;
            var bg = d.isToday ? 'linear-gradient(180deg,#FBBF24,#F97316)' : d.dur>0 ? 'rgba(245,158,11,.4)' : 'rgba(255,255,255,.06)';
            return _h('div', { key:d.key, style:{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:6 },
              title: d.dur>0 ? fmtHM(d.dur) : 'brak wpisu' },
              _h('div', { style:{ width:'100%', borderRadius:'4px 4px 0 0', height:h+'%', background:bg, transition:'height .4s cubic-bezier(.2,.8,.2,1)' } }),
              _h('span', { style:{ fontSize:9, fontWeight:700, color: d.isToday ? 'var(--yellow)' : 'var(--t3)' } }, d.label)
            );
          })
        )
      ),

      sessions.length > 0 && _h('div', { style:{ display:'flex', flexDirection:'column', gap:8, marginBottom:20 } },
        _h('div', { style:{ fontSize:10, fontWeight:800, letterSpacing:'.1em', color:'var(--t3)', textTransform:'uppercase', marginBottom:2 } }, 'Historia'),
        sessions.slice(0, 10).map(function(s) {
          return _h('div', { key:s.id, style:{ display:'flex', alignItems:'center', gap:12, padding:'11px 14px', borderRadius:16, background:'var(--s2)', border:'1px solid var(--b1)' } },
            _h('div', { style:{ flex:1, minWidth:0 } },
              _h('div', { style:{ fontSize:13, fontWeight:700 } }, fmtHM(s.duration||0)),
              _h('div', { style:{ fontSize:11, color:'var(--t3)', marginTop:2 } }, ET.fmtDate(s.date)+' · '+s.bedtime+' → '+s.waketime)
            ),
            _h('span', { style:{ fontSize:11.5, fontWeight:700, color:'var(--purple)', flexShrink:0 } }, 'Jakość '+s.quality+'/10')
          );
        })
      ),

      _h(SleepAddSheet, { open:showAdd, onClose:function(){ setShowAdd(false); } })
    );
  }

  ET.SleepModule = SleepModule;
  ET.SleepAddSheet = SleepAddSheet;
})();
