(function() {
  'use strict';
  window.ET = window.ET || {};
  var _h = React.createElement;

  var PRESETS = [
    { id:'tabata',  label:'Tabata',    icon:'🔥', workSec:20,  restSec:10, rounds:8,  desc:'20s praca / 10s odpoczynek × 8' },
    { id:'hiit',    label:'HIIT',      icon:'⚡', workSec:40,  restSec:20, rounds:6,  desc:'40s praca / 20s odpoczynek × 6' },
    { id:'emom',    label:'EMOM',      icon:'⏱', workSec:45,  restSec:15, rounds:10, desc:'45s praca / 15s przerwa × 10' },
    { id:'amrap',   label:'AMRAP',     icon:'🔄', workSec:600, restSec:0,  rounds:1,  desc:'10 minut — max rund', isAmrap:true },
    { id:'custom',  label:'Własny',    icon:'⚙️', workSec:30,  restSec:15, rounds:5,  desc:'Własna konfiguracja' },
  ];

  function beep(freq, dur) {
    try {
      var ctx = new (window.AudioContext || window.webkitAudioContext)();
      var osc = ctx.createOscillator();
      var gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
      osc.start(); osc.stop(ctx.currentTime + dur);
    } catch(e) {}
  }

  function tripleBeep() {
    beep(880, 0.12);
    setTimeout(function(){ beep(880, 0.12); }, 180);
    setTimeout(function(){ beep(1100, 0.4); }, 360);
  }

  function TimerRing(props) {
    var SIZE = 180, SW = 14;
    var r = (SIZE - SW) / 2;
    var circ = 2 * Math.PI * r;
    var dash = Math.min((props.pct / 100) * circ, circ);
    return _h('div', { style:{ position:'relative', width:SIZE, height:SIZE, flexShrink:0 } },
      _h('svg', { width:SIZE, height:SIZE, viewBox:'0 0 '+SIZE+' '+SIZE, style:{ display:'block' } },
        _h('circle', { cx:SIZE/2, cy:SIZE/2, r:r, fill:'none', stroke:'var(--s4)', strokeWidth:SW }),
        _h('circle', { cx:SIZE/2, cy:SIZE/2, r:r, fill:'none', stroke:props.color, strokeWidth:SW,
          strokeDasharray:dash+' '+circ, strokeLinecap:'round',
          transform:'rotate(-90 '+(SIZE/2)+' '+(SIZE/2)+')',
          style:{ transition:'stroke-dasharray .5s linear, stroke .3s' } })
      ),
      _h('div', { style:{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:4 } },
        _h('div', { style:{ fontSize:'2.6rem', fontWeight:700, color:props.color, fontVariantNumeric:'tabular-nums', lineHeight:1, transition:'color .3s' } }, props.timeStr),
        _h('div', { style:{ fontSize:'.6rem', fontWeight:700, color:props.color, textTransform:'uppercase', letterSpacing:'.12em', opacity:.75 } }, props.label)
      )
    );
  }

  function IntervalsModule() {
    var su = ET.useStore(); var store = su.store, update = su.update;
    var toast = ET.useToast();

    var sp = React.useState('tabata'); var sel = sp[0], setSel = sp[1];
    var cc = React.useState({ workSec:30, restSec:15, rounds:5 }); var customCfg = cc[0], setCustomCfg = cc[1];
    var ar = React.useState(0); var amrapRounds = ar[0], setAmrapRounds = ar[1];

    var ts = React.useState({ phase:'idle', currentRound:1, timeLeft:0, running:false, workSec:20, restSec:10, totalRounds:8 });
    var timer = ts[0], setTimer = ts[1];

    var sessionStartRef = React.useRef(null);
    var prevPhaseRef = React.useRef('idle');
    var savedRef = React.useRef(false);

    var preset = PRESETS.find(function(p){ return p.id===sel; }) || PRESETS[0];
    var isAmrap = preset.isAmrap;
    var cfg = sel === 'custom'
      ? { workSec:customCfg.workSec, restSec:customCfg.restSec, rounds:customCfg.rounds }
      : { workSec:preset.workSec, restSec:preset.restSec, rounds:preset.rounds };

    // Countdown tick — recursive via timeLeft dep
    React.useEffect(function() {
      if (!timer.running || timer.phase === 'done' || timer.phase === 'idle') return;
      var t = setTimeout(function() {
        setTimer(function(prev) {
          if (!prev.running) return prev;
          var tl = prev.timeLeft - 1;
          if (tl > 0) return Object.assign({}, prev, { timeLeft:tl });
          // Phase over → transition
          if (prev.phase === 'work') {
            if (prev.restSec > 0) return Object.assign({}, prev, { phase:'rest', timeLeft:prev.restSec });
            if (prev.currentRound >= prev.totalRounds) return Object.assign({}, prev, { phase:'done', running:false, timeLeft:0 });
            return Object.assign({}, prev, { currentRound:prev.currentRound+1, timeLeft:prev.workSec });
          }
          // rest → work
          if (prev.currentRound >= prev.totalRounds) return Object.assign({}, prev, { phase:'done', running:false, timeLeft:0 });
          return Object.assign({}, prev, { phase:'work', currentRound:prev.currentRound+1, timeLeft:prev.workSec });
        });
      }, 1000);
      return function() { clearTimeout(t); };
    }, [timer.timeLeft, timer.running]);

    // Beep on phase change
    React.useEffect(function() {
      if (timer.phase === prevPhaseRef.current) return;
      prevPhaseRef.current = timer.phase;
      if (timer.phase === 'work') beep(880, 0.2);
      else if (timer.phase === 'rest') beep(440, 0.35);
      else if (timer.phase === 'done') tripleBeep();
    }, [timer.phase]);

    // Save completed session
    React.useEffect(function() {
      if (timer.phase !== 'done' || !sessionStartRef.current || savedRef.current) return;
      savedRef.current = true;
      var dur = Math.round((Date.now() - sessionStartRef.current) / 1000);
      var session = { id:Date.now(), date:ET.dstr(), mode:sel, workSec:timer.workSec, restSec:timer.restSec, rounds:timer.totalRounds, duration:dur };
      if (isAmrap) session.amrapRounds = amrapRounds;
      update(function(s){ return Object.assign({}, s, { intervals:[session].concat(s.intervals||[]) }); });
      toast('Interwały zakończone! 🏆', 'success');
    }, [timer.phase]);

    function start() {
      sessionStartRef.current = Date.now();
      savedRef.current = false;
      setAmrapRounds(0);
      prevPhaseRef.current = 'work';
      beep(880, 0.2);
      setTimer({ phase:'work', currentRound:1, timeLeft:cfg.workSec, running:true, workSec:cfg.workSec, restSec:cfg.restSec, totalRounds:cfg.rounds });
    }

    function stop() {
      setTimer({ phase:'idle', currentRound:1, timeLeft:0, running:false, workSec:cfg.workSec, restSec:cfg.restSec, totalRounds:cfg.rounds });
      sessionStartRef.current = null;
      prevPhaseRef.current = 'idle';
    }

    function togglePause() {
      setTimer(function(p){ return Object.assign({}, p, { running:!p.running }); });
    }

    var isIdle = timer.phase === 'idle';
    var isDone = timer.phase === 'done';
    var isWork = timer.phase === 'work';
    var phaseColor = isWork ? 'var(--red)' : timer.phase === 'rest' ? 'var(--green)' : isDone ? 'var(--yellow)' : 'var(--s5)';
    var phaseLabel = isWork ? 'PRACA' : timer.phase === 'rest' ? 'ODPOCZYNEK' : isDone ? 'KONIEC!' : 'START';

    var totalSec = isWork ? timer.workSec : timer.phase === 'rest' ? timer.restSec : cfg.workSec;
    var pct = isIdle ? 0 : isDone ? 100 : totalSec > 0 ? ((totalSec - timer.timeLeft) / totalSec) * 100 : 0;

    var m = Math.floor(timer.timeLeft / 60), s2 = timer.timeLeft % 60;
    var timeStr = isIdle
      ? (cfg.workSec >= 60 ? Math.floor(cfg.workSec/60)+'m' : cfg.workSec+'s')
      : (m > 0 ? m + ':' + (s2 < 10 ? '0'+s2 : s2) : String(timer.timeLeft));

    var sessions = store.intervals || [];

    function fmtDur(sec) {
      if (!sec) return '—';
      if (sec < 60) return sec + 's';
      return Math.floor(sec/60) + 'min' + (sec%60 ? ' '+(sec%60)+'s' : '');
    }

    var modeLabel = { tabata:'Tabata', hiit:'HIIT', emom:'EMOM', amrap:'AMRAP', custom:'Custom' };

    return _h('div', { className:'fade-in' },
      _h('div', { className:'page-hdr' },
        _h('div', null,
          _h('h1', null, '⏱ Interwały'),
          _h('p', null, sessions.length + ' sesji łącznie')
        ),
        _h('div', null)
      ),

      // Preset tabs (only when idle)
      isIdle && _h('div', null,
        _h('div', { style:{ display:'flex', gap:5, flexWrap:'wrap', marginBottom:12 } },
          PRESETS.map(function(p) {
            return _h('button', { key:p.id, className:'tag-btn'+(sel===p.id?' active':''), onClick:function(){ setSel(p.id); } }, p.icon + ' ' + p.label);
          })
        ),
        sel === 'custom'
          ? _h('div', { className:'card', style:{ marginBottom:14 } },
              _h('div', { style:{ fontWeight:700, marginBottom:12, fontSize:'.88rem' } }, '⚙️ Własna konfiguracja'),
              _h('div', { className:'grid-3' },
                _h('div', { className:'field' },
                  _h('label', null, _h('span', null, 'Praca'), ' — ', _h('span', { style:{ color:'var(--red)', fontWeight:700 } }, customCfg.workSec+'s')),
                  _h('div', { className:'slider-wrap' }, _h('input', { type:'range', min:5, max:120, step:5, value:customCfg.workSec,
                    onChange:function(e){ setCustomCfg(function(c){ return Object.assign({},c,{workSec:+e.target.value}); }); } }))
                ),
                _h('div', { className:'field' },
                  _h('label', null, _h('span', null, 'Odpoczynek'), ' — ', _h('span', { style:{ color:'var(--green)', fontWeight:700 } }, customCfg.restSec+'s')),
                  _h('div', { className:'slider-wrap' }, _h('input', { type:'range', min:0, max:120, step:5, value:customCfg.restSec,
                    onChange:function(e){ setCustomCfg(function(c){ return Object.assign({},c,{restSec:+e.target.value}); }); } }))
                ),
                _h('div', { className:'field' },
                  _h('label', null, _h('span', null, 'Rundy'), ' — ', _h('span', { style:{ color:'var(--purple)', fontWeight:700 } }, customCfg.rounds+'×')),
                  _h('div', { className:'slider-wrap' }, _h('input', { type:'range', min:1, max:30, value:customCfg.rounds,
                    onChange:function(e){ setCustomCfg(function(c){ return Object.assign({},c,{rounds:+e.target.value}); }); } }))
                )
              )
            )
          : _h('div', { className:'card card-accent', style:{ marginBottom:14 } },
              _h('div', { style:{ fontWeight:700, marginBottom:6 } }, preset.icon + ' ' + preset.label),
              _h('div', { style:{ fontSize:'.82rem', color:'var(--t2)', marginBottom:10 } }, preset.desc),
              _h('div', { style:{ display:'flex', gap:8, flexWrap:'wrap' } },
                _h('span', { className:'chip', style:{ color:'var(--red)' } }, '⚡ '+preset.workSec+'s pracy'),
                preset.restSec > 0 && _h('span', { className:'chip', style:{ color:'var(--green)' } }, '😮‍💨 '+preset.restSec+'s przerwy'),
                _h('span', { className:'chip', style:{ color:'var(--purple)' } }, '🔄 '+preset.rounds+(preset.rounds===1?' runda':' rund'))
              )
            )
      ),

      // Timer circle
      _h('div', { className:'card', style:{ marginBottom:14, textAlign:'center', padding:'28px 20px' } },
        _h('div', { style:{ display:'flex', flexDirection:'column', alignItems:'center', gap:18 } },
          _h(TimerRing, { pct:pct, color:phaseColor, timeStr:timeStr, label:phaseLabel }),

          !isIdle && !isDone && _h('div', null,
            isAmrap
              ? _h('div', { style:{ display:'flex', flexDirection:'column', alignItems:'center', gap:10 } },
                  _h('div', { style:{ fontSize:'.8rem', color:'var(--t3)' } }, 'Ukończone rundy'),
                  _h('div', { style:{ display:'flex', alignItems:'center', gap:16 } },
                    _h('div', { style:{ fontSize:'2.4rem', fontWeight:700, color:'var(--yellow)' } }, amrapRounds),
                    _h('button', { className:'btn btn-primary', style:{ borderRadius:'50%', width:52, height:52, padding:0, fontSize:'1.6rem' }, onClick:function(){ setAmrapRounds(function(n){ return n+1; }); } }, '+')
                  )
                )
              : _h('div', { style:{ fontSize:'.82rem', color:'var(--t2)' } }, 'Runda ' + timer.currentRound + ' / ' + timer.totalRounds)
          ),

          isDone && _h('div', { style:{ textAlign:'center' } },
            _h('div', { style:{ fontSize:'1.2rem', fontWeight:700, color:'var(--yellow)', marginBottom:4 } }, '🏆 Ukończono!'),
            isAmrap && _h('div', { style:{ fontSize:'.9rem', color:'var(--t2)' } }, 'Wykonano ' + amrapRounds + ' rund')
          ),

          _h('div', { style:{ display:'flex', gap:10 } },
            isIdle
              ? _h('button', { className:'btn btn-primary btn-lg', style:{ width:160 }, onClick:start }, '▶ Start')
              : _h(React.Fragment, null,
                  !isDone && _h('button', { className:'btn '+(timer.running?'btn-secondary':'btn-primary'), style:{ width:110 }, onClick:togglePause },
                    timer.running ? '⏸ Pauza' : '▶ Wznów'
                  ),
                  _h('button', { className:'btn btn-ghost', style:{ color:'var(--red)' }, onClick:stop }, '■ Stop')
                )
          )
        )
      ),

      // Session history
      sessions.length > 0 && _h('div', null,
        _h('div', { className:'section-hdr' }, _h('h2', null, 'Ostatnie sesje')),
        sessions.slice(0, 10).map(function(s) {
          return _h('div', { key:s.id, className:'card card-sm', style:{ marginBottom:6, display:'flex', justifyContent:'space-between', alignItems:'center' } },
            _h('div', null,
              _h('div', { style:{ fontWeight:600, fontSize:'.88rem' } }, (modeLabel[s.mode]||s.mode) + ' · ' + s.rounds + ' rund'),
              _h('div', { style:{ fontSize:'.72rem', color:'var(--t3)', marginTop:2 } }, ET.fmtDate(s.date) + ' · ' + fmtDur(s.duration)),
              s.amrapRounds != null && _h('div', { style:{ fontSize:'.7rem', color:'var(--yellow)', marginTop:2 } }, '🔄 ' + s.amrapRounds + ' rund ukończonych')
            ),
            _h('div', { style:{ flexShrink:0 } },
              _h('span', { className:'badge badge-red' }, s.workSec+'s / '+(s.restSec||0)+'s')
            )
          );
        })
      ),

      sessions.length === 0 && _h(ET.Placeholder, { icon:'⏱', title:'Brak sesji', desc:'Wybierz tryb i rozpocznij pierwszy trening interwałowy.' })
    );
  }

  ET.IntervalsModule = IntervalsModule;
})();
