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

  // Klasyczny widok (log retrospektywny) — bez zmian, ścieżka WEB. Patrz
  // dispatcher `SaunaModule` i `SaunaModuleMobile` poniżej.
  function SaunaModuleClassic() {
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

  // Web zostaje przy widoku klasycznym; iOS dostaje redesign „Aurora Glass".
  function SaunaModule() {
    return ET.IS_WEB ? _h(SaunaModuleClassic, null) : _h(SaunaModuleMobile, null);
  }

  // ── SAUNA (iOS) — redesign „Aurora Glass" ─────────────────────────────────
  // Handoff sekcja 6: żywy licznik wejścia (pierścień 172px, „WEJŚCIE N Z M"),
  // Pauza/Koniec wejścia, dwie karty (temperatura/łącznie dziś), lista wejść
  // ze statusami. To realna zmiana modelu — klasyczny widok jest formularzem
  // WYPEŁNIANYM PO FAKCIE (jak poszła sesja), design pokazuje ŻYWY timer w
  // trakcie. Zdecydowałem się zbudować prawdziwy timer (analogicznie do
  // decyzji o sesji treningowej), bo bez niego pierścień odliczający jest
  // pozbawiony sensu — ale zakres jest dużo mniejszy niż trening (jeden
  // licznik, bez periodyzacji/Live Activity/zamiany ćwiczeń), więc zrobiłem
  // to bez dodatkowego pytania. Po zakończeniu ostatniego wejścia dane trafiają
  // do TEGO SAMEGO store.saunaSessions co dotychczas (Statystyki/AI Engine/
  // Dashboard czytają bez zmian). Ręczne dodanie sesji „po fakcie" zostaje
  // dostępne przez istniejący SaunaAddSheet (link pod głównym widokiem).
  function SaunaModuleMobile() {
    var su = ET.useStore(); var store = su.store, update = su.update;
    var toast = ET.useToast();

    var today = ET.dstr();
    var todaysSessions = (store.saunaSessions||[]).filter(function(s){ return s.date===today; });
    var todayMinFromLog = todaysSessions.reduce(function(t,s){ return t+(s.duration||0); },0);

    // ── SETUP (przed rozpoczęciem) ────────────────────────────────────────
    var tys = React.useState('finnish'); var type = tys[0], setType = tys[1];
    var tps = React.useState(80); var temp = tps[0], setTemp = tps[1];
    var rms = React.useState(15); var roundMin = rms[0], setRoundMin = rms[1];
    var trs = React.useState(3); var totalRounds = trs[0], setTotalRounds = trs[1];
    var rds = React.useState({ willingness:2, state:2, fatigue:2 }); var readiness = rds[0], setReadiness = rds[1];

    // ── ŻYWA SESJA ─────────────────────────────────────────────────────────
    var ls = React.useState(null); var live = ls[0], setLive = ls[1];
    // live = { currentRound, completedMin:[], paused, pauseLeftSec }
    var roundEndRef = React.useRef(null);
    var rls = React.useState(0); var remainingSec = rls[0], setRemainingSec = rls[1];
    var sa = React.useState(false); var showAdd = sa[0], setShowAdd = sa[1];
    var ffs = React.useState(null); var finishForm = ffs[0], setFinishForm = ffs[1]; // {hrAfter,feeling,notes} po ostatnim wejściu

    function syncRemaining() {
      if (!roundEndRef.current) return;
      setRemainingSec(Math.max(0, Math.ceil((roundEndRef.current - Date.now())/1000)));
    }
    React.useEffect(function() {
      if (!live || live.paused) return;
      var t = setInterval(syncRemaining, 500);
      return function(){ clearInterval(t); };
    }, [live && live.paused, !!live]);
    React.useEffect(function() {
      function onVisible() { if (document.visibilityState==='visible') syncRemaining(); }
      document.addEventListener('visibilitychange', onVisible);
      return function(){ document.removeEventListener('visibilitychange', onVisible); };
    }, []);

    function startSession() {
      roundEndRef.current = Date.now() + roundMin*60*1000;
      setRemainingSec(roundMin*60);
      setLive({ currentRound:1, completedMin:[], paused:false, pauseLeftSec:0 });
    }
    function pauseRound() {
      if (!live || live.paused) return;
      var leftSec = Math.max(0, Math.ceil((roundEndRef.current - Date.now())/1000));
      roundEndRef.current = null;
      setLive(function(p){ return Object.assign({}, p, { paused:true, pauseLeftSec:leftSec }); });
    }
    function resumeRound() {
      if (!live || !live.paused) return;
      roundEndRef.current = Date.now() + live.pauseLeftSec*1000;
      setRemainingSec(live.pauseLeftSec);
      setLive(function(p){ return Object.assign({}, p, { paused:false }); });
    }
    function endRound() {
      if (!live) return;
      var plannedSec = roundMin*60;
      var elapsedMin = Math.max(1, Math.round((plannedSec - (live.paused ? live.pauseLeftSec : remainingSec)) / 60));
      var completed = live.completedMin.concat([elapsedMin]);
      if (live.currentRound >= totalRounds) {
        setFinishForm({ hrAfter:90, feeling:8, notes:'' });
        setLive(function(p){ return Object.assign({}, p, { completedMin:completed }); });
        roundEndRef.current = null;
        return;
      }
      roundEndRef.current = Date.now() + roundMin*60*1000;
      setRemainingSec(roundMin*60);
      setLive({ currentRound:live.currentRound+1, completedMin:completed, paused:false, pauseLeftSec:0 });
    }
    function cancelSession() {
      roundEndRef.current = null;
      setLive(null);
    }
    function finishSession() {
      var totalDuration = (live.completedMin||[]).reduce(function(a,b){ return a+b; }, 0);
      var session = { id:Date.now(), date:today, duration:totalDuration, temp:temp, type:type,
        rounds:totalRounds, hrAfter:finishForm.hrAfter, feeling:finishForm.feeling, notes:finishForm.notes, readiness:readiness };
      update(function(s){
        var n = Object.assign({}, s, { saunaSessions:[session].concat(s.saunaSessions||[]) });
        return ET.syncGoals ? ET.syncGoals(n, 'sauna', session) : n;
      });
      toast('Sesja sauny zapisana ✓', 'success');
      setLive(null);
      setFinishForm(null);
    }

    function fmtMMSS(sec) { return Math.floor(sec/60) + ':' + String(sec%60).padStart(2,'0'); }

    // ── ARKUSZ ZAKOŃCZENIA (po ostatnim wejściu) ─────────────────────────
    if (finishForm) {
      return _h('div', { className:'scr-in' },
        _h('div', { style:{ textAlign:'center', marginBottom:22 } },
          _h('div', { style:{ width:64, height:64, borderRadius:'50%', margin:'0 auto 14px', background:'linear-gradient(135deg,#F97316,#F59E0B)',
            display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 8px 22px -6px rgba(249,115,22,.6)' } },
            _h('svg', { width:30, height:30, viewBox:'0 0 24 24', fill:'none', stroke:'#fff', strokeWidth:2.8, strokeLinecap:'round', strokeLinejoin:'round' }, _h('path', { d:'M4 12.5l5.2 5.2L20 6.8' }))),
          _h('div', { style:{ fontSize:22, fontWeight:800 } }, 'Sesja ukończona'),
          _h('div', { style:{ fontSize:12.5, color:'var(--t3)', marginTop:4 } }, totalRounds + ' wejścia · ' + (live.completedMin||[]).reduce(function(a,b){return a+b;},0) + ' min łącznie')
        ),
        _h('div', { className:'field' },
          _h('label', { style:{ display:'flex', justifyContent:'space-between' } }, _h('span', null, 'Tętno po (bpm)'), _h('span', { style:{ color:'var(--pink)', fontWeight:700 } }, finishForm.hrAfter)),
          _h('div', { className:'slider-wrap' }, _h('input', { type:'range', min:50, max:180, step:5, value:finishForm.hrAfter, onChange:function(e){ setFinishForm(Object.assign({},finishForm,{hrAfter:+e.target.value})); } }))
        ),
        _h('div', { className:'field' },
          _h('label', { style:{ display:'flex', justifyContent:'space-between' } }, _h('span', null, 'Samopoczucie'), _h('span', { style:{ color:'var(--green)', fontWeight:700 } }, finishForm.feeling+'/10')),
          _h('div', { className:'slider-wrap' }, _h('input', { type:'range', min:1, max:10, value:finishForm.feeling, onChange:function(e){ setFinishForm(Object.assign({},finishForm,{feeling:+e.target.value})); } }))
        ),
        _h('div', { className:'field' }, _h('label', null, 'Notatki'), _h('textarea', { value:finishForm.notes, onChange:function(e){ setFinishForm(Object.assign({},finishForm,{notes:e.target.value})); }, placeholder:'Zimny prysznic? Medytacja?' })),
        _h('button', { style:{ width:'100%', height:52, borderRadius:'var(--r4)', border:'none', fontSize:14, fontWeight:700, cursor:'pointer',
          background:'linear-gradient(150deg,#FB923C,#F97316 55%,#EA580C)', color:'#fff', boxShadow:'0 12px 28px -6px rgba(249,115,22,.6)' }, onClick:finishSession }, 'Zapisz sesję')
      );
    }

    // ── ŻYWY WIDOK (wejście w toku) ───────────────────────────────────────
    if (live) {
      var plannedSec = roundMin*60;
      var showSec = live.paused ? live.pauseLeftSec : remainingSec;
      var pct = plannedSec>0 ? Math.max(0, Math.min(1, showSec/plannedSec)) : 0;
      var RING_C = 2*Math.PI*81;
      var entries = [];
      for (var i=1;i<=totalRounds;i++) {
        var status = i < live.currentRound ? 'done' : i === live.currentRound ? 'active' : 'planned';
        entries.push({ n:i, status:status, min: live.completedMin[i-1] });
      }
      return _h('div', { className:'scr-in' },
        _h('div', { className:'glass', style:{ padding:'26px 20px', borderRadius:24, marginBottom:16, textAlign:'center',
          background:'linear-gradient(158deg,rgba(249,115,22,.14),rgba(255,255,255,.02))', border:'1px solid rgba(249,115,22,.28)' } },
          _h('div', { style:{ fontSize:10, fontWeight:800, letterSpacing:'.12em', color:'var(--orange)', textTransform:'uppercase', marginBottom:16 } },
            'WEJŚCIE ' + live.currentRound + ' Z ' + totalRounds),
          _h('div', { style:{ position:'relative', width:172, height:172, margin:'0 auto 18px' } },
            _h('svg', { width:172, height:172, viewBox:'0 0 172 172', style:{ transform:'rotate(-90deg)' } },
              _h('circle', { cx:86, cy:86, r:81, fill:'none', stroke:'rgba(255,255,255,.08)', strokeWidth:10 }),
              _h('circle', { cx:86, cy:86, r:81, fill:'none', stroke:'var(--orange)', strokeWidth:10, strokeLinecap:'round',
                strokeDasharray:RING_C, strokeDashoffset:RING_C*(1-pct), style:{ transition:'stroke-dashoffset .3s linear' } })
            ),
            _h('div', { style:{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' } },
              _h('span', { style:{ fontSize:38, fontWeight:800, letterSpacing:'-.03em', fontVariantNumeric:'tabular-nums' } }, fmtMMSS(showSec)),
              live.paused && _h('span', { style:{ fontSize:10.5, fontWeight:800, color:'var(--orange)', letterSpacing:'.08em', marginTop:2 } }, 'PAUZA')
            )
          ),
          _h('div', { style:{ display:'flex', gap:10 } },
            _h('button', { onClick: live.paused ? resumeRound : pauseRound,
              style:{ flex:1, height:48, borderRadius:16, border:'1px solid rgba(249,115,22,.4)', background:'rgba(249,115,22,.12)', color:'var(--orange)', fontWeight:700, fontSize:13, cursor:'pointer' } },
              live.paused ? 'Wznów' : 'Pauza'),
            _h('button', { onClick:endRound,
              style:{ flex:1, height:48, borderRadius:16, border:'none', background:'var(--orange)', color:'var(--bg)', fontWeight:800, fontSize:13, cursor:'pointer' } },
              live.currentRound >= totalRounds ? 'Koniec sesji' : 'Koniec wejścia')
          )
        ),

        _h('div', { style:{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:18 } },
          _h('div', { style:{ padding:'14px', borderRadius:16, background:'var(--s2)', border:'1px solid var(--b1)' } },
            _h('div', { style:{ fontSize:20, fontWeight:800, color:'var(--red)' } }, temp+'°C'),
            _h('div', { style:{ fontSize:9, fontWeight:800, color:'var(--t3)', letterSpacing:'.08em', marginTop:4 } }, 'TEMPERATURA')),
          _h('div', { style:{ padding:'14px', borderRadius:16, background:'var(--s2)', border:'1px solid var(--b1)' } },
            _h('div', { style:{ fontSize:20, fontWeight:800 } }, (todayMinFromLog + live.completedMin.reduce(function(a,b){return a+b;},0)) + ' min'),
            _h('div', { style:{ fontSize:9, fontWeight:800, color:'var(--t3)', letterSpacing:'.08em', marginTop:4 } }, 'ŁĄCZNIE DZIŚ'))
        ),

        _h('div', { style:{ display:'flex', flexDirection:'column', gap:8, marginBottom:18 } },
          entries.map(function(e) {
            var st = e.status==='done' ? { l:'Gotowe', c:'var(--green)', bg:'rgba(16,185,129,.10)', bd:'rgba(16,185,129,.28)' }
              : e.status==='active' ? { l:'Trwa', c:'var(--orange)', bg:'rgba(249,115,22,.10)', bd:'rgba(249,115,22,.28)' }
              : { l:'Zaplanowane', c:'var(--t3)', bg:'var(--s2)', bd:'var(--b1)' };
            return _h('div', { key:e.n, style:{ display:'flex', alignItems:'center', gap:12, padding:'10px 14px', borderRadius:14, background:st.bg, border:'1px solid '+st.bd } },
              _h('div', { style:{ width:24, height:24, borderRadius:8, flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:800,
                background:'color-mix(in srgb,'+st.c+' 20%, transparent)', color:st.c } }, e.status==='done' ? '✓' : e.n),
              _h('span', { style:{ flex:1, fontSize:13, fontWeight:600 } }, 'Wejście ' + e.n + (e.min ? ' · ' + e.min + ' min' : '')),
              _h('span', { style:{ fontSize:11, fontWeight:700, color:st.c } }, st.l)
            );
          })
        ),

        _h('button', { onClick:cancelSession, style:{ width:'100%', padding:'10px', border:'none', background:'none', color:'var(--t3)', fontSize:12, cursor:'pointer' } }, 'Anuluj sesję')
      );
    }

    // ── SETUP (nowa sesja) ────────────────────────────────────────────────
    return _h('div', { className:'scr-in' },
      _h('div', { style:{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:18 } },
        _h('div', { style:{ fontSize:27, fontWeight:800, letterSpacing:'-.03em' } }, 'Sauna'),
        todayMinFromLog>0 && _h('div', { style:{ fontSize:12, color:'var(--t3)' } }, 'Dziś: ' + todayMinFromLog + ' min')
      ),

      _h('div', { style:{ marginBottom:16 } },
        _h('div', { style:{ fontSize:10, fontWeight:800, letterSpacing:'.1em', color:'var(--t3)', textTransform:'uppercase', marginBottom:9 } }, 'Typ sauny'),
        _h('div', { style:{ display:'flex', gap:6, flexWrap:'wrap' } },
          SAUNA_TYPES.map(function(t) {
            var active = type===t.id;
            return _h('button', { key:t.id, onClick:function(){ setType(t.id); },
              style:{ padding:'9px 13px', borderRadius:12, cursor:'pointer', fontSize:12.5, fontWeight:600,
                background: active?'rgba(249,115,22,.14)':'var(--s2)', border:'1px solid '+(active?'var(--orange)':'var(--b1)'), color:active?'var(--orange)':'var(--t2)' } },
              t.icon+' '+t.label);
          })
        )
      ),

      _h('div', { className:'field' },
        _h('label', { style:{ display:'flex', justifyContent:'space-between' } }, _h('span', null, 'Temperatura'), _h('span', { style:{ color:'var(--red)', fontWeight:700 } }, temp+'°C')),
        _h('div', { className:'slider-wrap' }, _h('input', { type:'range', min:40, max:120, step:5, value:temp, onChange:function(e){ setTemp(+e.target.value); } }))
      ),
      _h('div', { className:'grid-2' },
        _h('div', { className:'field' },
          _h('label', { style:{ display:'flex', justifyContent:'space-between' } }, _h('span', null, 'Czas wejścia'), _h('span', { style:{ color:'var(--orange)', fontWeight:700 } }, roundMin+' min')),
          _h('div', { className:'slider-wrap' }, _h('input', { type:'range', min:5, max:30, step:5, value:roundMin, onChange:function(e){ setRoundMin(+e.target.value); } }))
        ),
        _h('div', { className:'field' },
          _h('label', { style:{ display:'flex', justifyContent:'space-between' } }, _h('span', null, 'Liczba wejść'), _h('span', { style:{ color:'var(--teal)', fontWeight:700 } }, totalRounds+'×')),
          _h('div', { className:'slider-wrap' }, _h('input', { type:'range', min:1, max:6, value:totalRounds, onChange:function(e){ setTotalRounds(+e.target.value); } }))
        )
      ),

      _h('div', { style:{ marginBottom:6 } },
        _h('div', { style:{ fontSize:10, fontWeight:800, letterSpacing:'.1em', color:'var(--t3)', textTransform:'uppercase', marginBottom:9 } }, 'Gotowość'),
        READINESS_FIELDS.map(function(field) {
          return _h('div', { key:field.key, style:{ marginBottom:10 } },
            _h('div', { style:{ fontSize:10.5, color:'var(--t3)', marginBottom:6 } }, field.label),
            _h('div', { style:{ display:'flex', gap:6 } },
              field.opts.map(function(opt, i) {
                var active = readiness[field.key] === (i+1);
                return _h('button', { key:i, onClick:function(){ var o={}; o[field.key]=i+1; setReadiness(Object.assign({},readiness,o)); },
                  style:{ flex:1, padding:'9px 4px', borderRadius:10, border:'1px solid '+(active?'var(--orange)':'var(--b1)'), background:active?'rgba(249,115,22,.12)':'var(--s2)', color:active?'var(--orange)':'var(--t2)', cursor:'pointer', fontSize:11, fontWeight:600 } }, opt);
              })
            )
          );
        })
      ),

      _h('button', { style:{ width:'100%', height:54, borderRadius:'var(--r4)', border:'none', fontSize:14.5, fontWeight:700, cursor:'pointer', marginTop:8,
        background:'linear-gradient(150deg,#FB923C,#F97316 55%,#EA580C)', color:'#fff', boxShadow:'0 12px 28px -6px rgba(249,115,22,.6)' }, onClick:startSession }, 'Rozpocznij sesję'),
      _h('button', { onClick:function(){ setShowAdd(true); },
        style:{ width:'100%', padding:'12px', border:'none', background:'none', color:'var(--t3)', fontSize:12, cursor:'pointer', marginTop:4 } }, 'Dodaj sesję z pamięci (bez licznika)'),

      _h(SaunaAddSheet, { open:showAdd, onClose:function(){ setShowAdd(false); } })
    );
  }

  ET.SaunaModule = SaunaModule;
  ET.SaunaAddSheet = SaunaAddSheet;
})();
