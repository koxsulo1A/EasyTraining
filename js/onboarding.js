(function() {
  'use strict';
  window.ET = window.ET || {};
  var _h = React.createElement;

  // ── Onboarding + paywall (redesign „Aurora Glass") ───────────────────────
  // Handoff: EasyTraining Mobile Redesign, sekcja #2b. Tylko iOS (natywna
  // powłoka) — patrz OnboardingGate w app.js, który wpina ten ekran między
  // AuthGate a NativeShell dla kont bez `profile.onboardingDone`.
  //
  // Odstępstwa od makiety (potwierdzone z userem, real data — bez fabrykacji):
  //  - „Masz konto? Zaloguj się" pominięte na kroku 0 — logowanie już się
  //    odbyło w AuthGate, zanim ten ekran się pojawia, link byłby ślepy.
  //  - Paywall jest CZYSTO WIZUALNY: wybór planu/rozliczenia zapisuje się
  //    lokalnie w store.profile (plan, billingYearly) jako preferencja na
  //    przyszłość — apka nie ma integracji płatności (Stripe/App Store IAP)
  //    i NIC dziś nie blokuje na podstawie tego wyboru.
  //  - „Anulujesz w każdej chwili w App Store" zastąpione uczciwym opisem —
  //    nie ma prawdziwej subskrypcji do anulowania.
  //  - Kod trenera (krok 4) to czyste pole tekstowe — brak backendu do
  //    walidacji/dopasowania trenera, zapisywany jako preferencja.

  var GOALS = [
    { id:'strength', label:'Siła maksymalna', desc:'Ciężary, niskie powtórzenia, RIR blisko zera', color:'var(--a)',
      icon:'M6.5 8v8M3.8 10v4M17.5 8v8M20.2 10v4M6.5 12h11' },
    { id:'muscle', label:'Masa mięśniowa', desc:'Hipertrofia, umiarkowane ciężary, wysoka objętość', color:'var(--purple)',
      icon:'M9 21V10a3 3 0 0 1 3-3 3 3 0 0 1 3 3v11M6 21v-6a3 3 0 0 1 3-3M18 21v-6a3 3 0 0 1-3-3' },
    { id:'physique', label:'Sylwetka', desc:'Redukcja, rekompozycja, wygląd ciała', color:'var(--teal)',
      icon:'M12 3a3 3 0 1 0 0 6 3 3 0 0 0 0-6zM7 21v-6a5 5 0 0 1 5-5 5 5 0 0 1 5 5v6' },
    { id:'competition', label:'Start w zawodach', desc:'Peaking, kategoria wagowa, plan do dnia startu', color:'var(--pink)',
      icon:'M8 4h8v4a4 4 0 0 1-8 0zM8 5H5v2a3 3 0 0 0 3 3M16 5h3v2a3 3 0 0 1-3 3M12 12v4M9 20h6M10 20v-2h4v2' },
  ];
  var EXP_OPTS = [ { id:'<1', l:'Mniej niż rok' }, { id:'1-3', l:'1–3 lata' }, { id:'3-6', l:'3–6 lat' }, { id:'6+', l:'6+ lat' } ];
  var OB_DAYS = [ ['mon','Pn'], ['tue','Wt'], ['wed','Śr'], ['thu','Cz'], ['fri','Pt'], ['sat','So'], ['sun','Nd'] ];
  var TRAINER_OPTS = [
    { id:'code', label:'Mam kod trenera', desc:'Trener dodał Cię do swojej grupy' },
    { id:'search', label:'Szukam trenera', desc:'Dobierzemy trenera później, z poziomu Profilu' },
    { id:'solo', label:'Trenuję sam', desc:'Pełna kontrola, bez nadzoru trenera' },
  ];

  function checkIcon(size, color) {
    return _h('svg', { width:size, height:size, viewBox:'0 0 24 24', fill:'none', stroke:color||'#fff', strokeWidth:3, strokeLinecap:'round', strokeLinejoin:'round' },
      _h('path', { d:'M4 12.5l5.2 5.2L20 6.8' }));
  }
  function radioDot(active, color) {
    return _h('div', { style:{ width:22, height:22, borderRadius:'50%', flexShrink:0, border:'2px solid '+(active?color:'var(--b2)'),
      background:active?color:'transparent', display:'flex', alignItems:'center', justifyContent:'center' } },
      active && checkIcon(12, '#fff'));
  }

  // ── Wspólne kawałki: pasek postępu + stopka CTA ──────────────────────────
  function ObProgress(props) {
    return _h('div', { style:{ display:'flex', alignItems:'center', gap:12, marginBottom:24, flexShrink:0 } },
      _h('button', { onClick:props.onBack, 'aria-label':'Wstecz',
        style:{ width:34, height:34, borderRadius:'50%', border:'1px solid var(--b1)', background:'var(--s2)', color:'var(--t2)',
          display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, cursor:'pointer' } },
        _h('svg', { width:15, height:15, viewBox:'0 0 24 24', fill:'none', stroke:'currentColor', strokeWidth:2.4, strokeLinecap:'round', strokeLinejoin:'round' },
          _h('path', { d:'M15 6l-6 6 6 6' }))
      ),
      _h('div', { style:{ flex:1, display:'flex', gap:4 } },
        [1,2,3,4,5].map(function(n) {
          var done = n < props.step, active = n === props.step;
          return _h('div', { key:n, style:{ flex: active?2:1, height:4, borderRadius:2,
            background: done ? 'var(--a)' : active ? 'var(--a-light)' : 'rgba(255,255,255,.10)', transition:'flex .3s' } });
        })
      ),
      _h('span', { style:{ fontSize:11, fontWeight:700, color:'var(--t3)', flexShrink:0 } }, props.step + '/5')
    );
  }

  function ObCta(props) {
    var cls = !props.disabled && props.variant!=='white' ? 'btn-accent' : undefined;
    var style = { width:'100%', height:54, borderRadius:18, border:'none', fontWeight:800, fontSize:15,
      cursor: props.disabled ? 'default' : 'pointer' };
    if (props.disabled) { style.background = 'var(--s3)'; style.color = 'var(--t3)'; }
    else if (props.variant === 'white') { style.background = 'var(--t1)'; style.color = 'var(--bg)'; }
    return _h('div', { style:{ flexShrink:0, paddingTop:20 } },
      _h('button', { className:cls, disabled:props.disabled, onClick:props.onClick, style:style }, props.label),
      props.caption && _h('div', { style:{ textAlign:'center', fontSize:10.5, color:'var(--t3)', marginTop:10 } }, props.caption)
    );
  }

  // ── KROK 0: POWITANIE ────────────────────────────────────────────────────
  function ObWelcome(props) {
    return _h('div', { style:{ display:'flex', flexDirection:'column', flex:1, minHeight:0 } },
      _h('div', { style:{ flex:1, display:'flex', flexDirection:'column', justifyContent:'center', overflowY:'auto' } },
        _h('div', { style:{ width:62, height:62, borderRadius:20, background:'linear-gradient(150deg,#60A5FA,#3B82F6 45%,#8B5CF6)',
          display:'flex', alignItems:'center', justifyContent:'center', marginBottom:24, boxShadow:'0 12px 28px -6px rgba(59,130,246,.6)' } },
          _h('svg', { width:32, height:32, viewBox:'0 0 24 24', fill:'none', stroke:'#fff', strokeWidth:1.8, strokeLinecap:'round', strokeLinejoin:'round' },
            _h('path', { d:'M6.5 8v8M3.8 10v4M17.5 8v8M20.2 10v4M6.5 12h11' }))
        ),
        _h('h1', { style:{ fontSize:32, fontWeight:800, letterSpacing:'-.03em', lineHeight:1.15, marginBottom:14 } },
          'Trening prowadzony jak u trenera.'),
        _h('p', { style:{ fontSize:14, color:'var(--t2)', lineHeight:1.5, marginBottom:24 } },
          'EasyTraining planuje, śledzi i dostosowuje Twój trening — od pierwszej serii po start w zawodach.'),
        [
          'Plan dopasowany do celu i dostępności',
          'Zapis serii, RIR i przerw bez rozpraszania się',
          'Trener widzi Twoje postępy i koryguje plan',
        ].map(function(t, i) {
          return _h('div', { key:i, style:{ display:'flex', alignItems:'center', gap:10, marginBottom:12 } },
            _h('div', { style:{ width:26, height:26, borderRadius:8, background:'rgba(16,185,129,.14)', display:'flex',
              alignItems:'center', justifyContent:'center', flexShrink:0 } }, checkIcon(14, 'var(--green)')),
            _h('span', { style:{ fontSize:13, color:'var(--t2)' } }, t)
          );
        })
      ),
      _h(ObCta, { label:'Zacznij', variant:'white', onClick:props.onNext })
    );
  }

  // ── KROK 1: CEL ───────────────────────────────────────────────────────────
  function ObGoal(props) {
    return _h('div', { style:{ display:'flex', flexDirection:'column', flex:1, minHeight:0 } },
      _h('h2', { style:{ fontSize:22, fontWeight:800, marginBottom:6 } }, 'Jaki jest Twój cel?'),
      _h('p', { style:{ fontSize:12.5, color:'var(--t3)', marginBottom:20 } }, 'Dopasujemy plan i tempo progresji.'),
      _h('div', { style:{ display:'flex', flexDirection:'column', gap:10, overflowY:'auto' } },
        GOALS.map(function(g) {
          var active = props.value === g.id;
          return _h('div', { key:g.id, onClick:function(){ props.onChange(g.id); },
            style:{ display:'flex', alignItems:'center', gap:14, padding:'14px 16px', borderRadius:18, cursor:'pointer',
              background: active ? 'linear-gradient(158deg,color-mix(in srgb,'+g.color+' 15%, transparent),rgba(255,255,255,.02))' : 'var(--s2)',
              border:'1px solid ' + (active ? 'color-mix(in srgb,'+g.color+' 40%, transparent)' : 'var(--b1)') } },
            _h('div', { style:{ width:38, height:38, borderRadius:12, flexShrink:0, background:'color-mix(in srgb,'+g.color+' 18%, transparent)',
              display:'flex', alignItems:'center', justifyContent:'center' } },
              _h('svg', { width:19, height:19, viewBox:'0 0 24 24', fill:'none', stroke:g.color, strokeWidth:1.7, strokeLinecap:'round', strokeLinejoin:'round' },
                _h('path', { d:g.icon }))),
            _h('div', { style:{ flex:1, minWidth:0 } },
              _h('div', { style:{ fontSize:14, fontWeight:700 } }, g.label),
              _h('div', { style:{ fontSize:11, color:'var(--t3)', marginTop:2 } }, g.desc)),
            radioDot(active, g.color)
          );
        })
      ),
      _h(ObCta, { label:'Dalej', disabled:!props.value, onClick:props.onNext })
    );
  }

  // ── KROK 2: DOŚWIADCZENIE ────────────────────────────────────────────────
  function ObExperience(props) {
    return _h('div', { style:{ display:'flex', flexDirection:'column', flex:1, minHeight:0 } },
      _h('h2', { style:{ fontSize:22, fontWeight:800, marginBottom:6 } }, 'Twoje doświadczenie'),
      _h('p', { style:{ fontSize:12.5, color:'var(--t3)', marginBottom:20 } }, 'Ile lat regularnie trenujesz siłowo?'),
      _h('div', { style:{ display:'flex', flexDirection:'column', gap:10, overflowY:'auto' } },
        EXP_OPTS.map(function(o) {
          var active = props.value === o.id;
          return _h('div', { key:o.id, onClick:function(){ props.onChange(o.id); },
            style:{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'16px 18px', borderRadius:16, cursor:'pointer',
              background: active ? 'var(--a-dim)' : 'var(--s2)', border:'1px solid ' + (active ? 'var(--a)' : 'var(--b1)') } },
            _h('span', { style:{ fontSize:14, fontWeight:700, color: active ? 'var(--a-light)' : 'var(--t1)' } }, o.l),
            radioDot(active, 'var(--a-light)')
          );
        })
      ),
      _h(ObCta, { label:'Dalej', disabled:!props.value, onClick:props.onNext })
    );
  }

  // ── KROK 3: DOSTĘPNOŚĆ ────────────────────────────────────────────────────
  function ObAvailability(props) {
    var days = props.days;
    var count = Object.keys(days).filter(function(k){ return days[k]; }).length;
    // props.onToggleDay używa functional setState w rodzicu (nie tego
    // domknięcia `days`) — bezpieczne przy React 18 automatic batching,
    // gdzie kilka szybkich zmian w jednym takcie inaczej by się nadpisywało.
    function toggle(k) { props.onToggleDay(k); }
    var hint = count >= 4 ? count + ' dni × ' + props.duration + ' min — trener ułoży split push/pull/legs.'
      : count > 0 ? count + ' dni × ' + props.duration + ' min — trening całego ciała.' : null;
    return _h('div', { style:{ display:'flex', flexDirection:'column', flex:1, minHeight:0 } },
      _h('div', { style:{ overflowY:'auto', flex:1 } },
        _h('h2', { style:{ fontSize:22, fontWeight:800, marginBottom:6 } }, 'Kiedy masz czas?'),
        _h('p', { style:{ fontSize:12.5, color:'var(--t3)', marginBottom:18 } }, 'Wybierz dni treningowe.'),
        _h('div', { style:{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:6, marginBottom:22 } },
          OB_DAYS.map(function(d) {
            var active = !!days[d[0]];
            return _h('div', { key:d[0], onClick:function(){ toggle(d[0]); },
              style:{ height:56, borderRadius:14, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:5, cursor:'pointer',
                background: active ? 'linear-gradient(150deg,rgba(96,165,250,.24),rgba(59,130,246,.16))' : 'var(--s2)',
                border:'1px solid ' + (active ? 'var(--a-light)' : 'var(--b1)') } },
              _h('span', { style:{ fontSize:11, fontWeight:700, color: active ? 'var(--a-light)' : 'var(--t2)' } }, d[1]),
              _h('div', { style:{ width:5, height:5, borderRadius:'50%', background: active ? 'var(--a-light)' : 'transparent' } })
            );
          })
        ),
        _h('p', { style:{ fontSize:12.5, color:'var(--t2)', marginBottom:12, fontWeight:700 } }, 'Długość sesji'),
        _h('div', { style:{ display:'flex', gap:8, marginBottom:20 } },
          [45,60,90].map(function(m) {
            var active = props.duration === m;
            return _h('div', { key:m, onClick:function(){ props.onDurationChange(m); },
              style:{ flex:1, padding:'14px 0', textAlign:'center', borderRadius:14, cursor:'pointer',
                background: active ? 'var(--a-dim)' : 'var(--s2)', border:'1px solid ' + (active ? 'var(--a)' : 'var(--b1)') } },
              _h('span', { style:{ fontSize:15, fontWeight:800, color: active ? 'var(--a-light)' : 'var(--t1)' } }, m + ' min')
            );
          })
        ),
        hint && _h('div', { style:{ padding:'12px 14px', borderRadius:14, background:'rgba(96,165,250,.10)', border:'1px solid rgba(96,165,250,.28)',
          fontSize:12, color:'var(--a-light)', lineHeight:1.5 } }, hint)
      ),
      _h(ObCta, { label:'Dalej', disabled:count===0, onClick:props.onNext })
    );
  }

  // ── KROK 4: TRENER ────────────────────────────────────────────────────────
  function ObTrainer(props) {
    var code = props.code;
    function setChar(i, v) { props.onSetChar(i, (v||'').slice(-1).toUpperCase()); }
    return _h('div', { style:{ display:'flex', flexDirection:'column', flex:1, minHeight:0 } },
      _h('div', { style:{ overflowY:'auto', flex:1 } },
        _h('h2', { style:{ fontSize:22, fontWeight:800, marginBottom:6 } }, 'Trener'),
        _h('p', { style:{ fontSize:12.5, color:'var(--t3)', marginBottom:20 } }, 'Jak chcesz trenować?'),
        _h('div', { style:{ display:'flex', flexDirection:'column', gap:10 } },
          TRAINER_OPTS.map(function(o) {
            var active = props.value === o.id;
            return _h('div', { key:o.id, onClick:function(){ props.onChange(o.id); },
              style:{ padding:'14px 16px', borderRadius:16, cursor:'pointer',
                background: active ? 'var(--purple-d)' : 'var(--s2)', border:'1px solid ' + (active ? 'var(--purple)' : 'var(--b1)') } },
              _h('div', { style:{ display:'flex', alignItems:'center', justifyContent:'space-between' } },
                _h('div', null,
                  _h('div', { style:{ fontSize:14, fontWeight:700, color: active ? 'var(--purple)' : 'var(--t1)' } }, o.label),
                  _h('div', { style:{ fontSize:11, color:'var(--t3)', marginTop:2 } }, o.desc)),
                radioDot(active, 'var(--purple)')
              ),
              active && o.id === 'code' && _h('div', { style:{ display:'flex', gap:6, marginTop:14 }, onClick:function(e){ e.stopPropagation(); } },
                code.map(function(c, i) {
                  return _h('input', { key:i, value:c, maxLength:1, onChange:function(e){ setChar(i, e.target.value); },
                    style:{ width:'100%', height:48, textAlign:'center', fontSize:16, fontWeight:800, borderRadius:10,
                      background:'var(--s3)', color:'var(--t1)', border:'1px solid ' + (c ? 'rgba(96,165,250,.4)' : 'var(--s5)'), outline:'none' }
                  });
                })
              )
            );
          })
        )
      ),
      _h(ObCta, { label:'Dalej', disabled:!props.value, onClick:props.onNext })
    );
  }

  // ── KROK 5: PAYWALL (czysto wizualny — patrz komentarz na górze pliku) ──
  function ObPaywall(props) {
    var plan = props.plan, yearly = props.yearly;
    var PRICES = { pro:{ mo:149, yr:1430 }, solo:{ mo:49, yr:470 } };
    var PLANS = [
      { id:'pro', name:'PRO z trenerem', badge:'POLECANY', accent:true },
      { id:'solo', name:'SOLO', badge:null, accent:false },
    ];
    return _h('div', { style:{ display:'flex', flexDirection:'column', flex:1, minHeight:0 } },
      _h('div', { style:{ overflowY:'auto', flex:1 } },
        _h('h2', { style:{ fontSize:22, fontWeight:800, marginBottom:6, textAlign:'center' } }, 'Wybierz plan'),
        _h('p', { style:{ fontSize:12.5, color:'var(--t3)', marginBottom:20, textAlign:'center' } }, '7 dni za darmo, potem wybrany plan.'),
        _h('div', { style:{ display:'flex', flexDirection:'column', gap:12, marginBottom:16 } },
          PLANS.map(function(p) {
            var active = plan === p.id;
            var price = yearly ? PRICES[p.id].yr : PRICES[p.id].mo;
            var per = yearly ? '/rok' : '/mies.';
            var save = PRICES[p.id].mo*12 - PRICES[p.id].yr;
            var body = _h(React.Fragment, null,
              _h('div', { style:{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:6 } },
                _h('span', { style:{ fontSize:15, fontWeight:800 } }, p.name),
                p.badge && _h('span', { style:{ fontSize:9, fontWeight:800, letterSpacing:'.06em', color:'#fff',
                  background:'linear-gradient(135deg,#3B82F6,#8B5CF6)', padding:'4px 10px', borderRadius:'0 14px 0 10px' } }, p.badge)
              ),
              _h('div', { style:{ display:'flex', alignItems:'baseline', gap:5 } },
                _h('span', { style:{ fontSize:26, fontWeight:800, letterSpacing:'-.03em' } }, price + ' zł'),
                _h('span', { style:{ fontSize:11, color:'var(--t3)' } }, per)
              ),
              yearly && _h('div', { style:{ fontSize:10.5, color:'var(--green)', fontWeight:700, marginTop:4 } }, 'oszczędzasz ' + save + ' zł/rok')
            );
            if (p.accent && active) {
              return _h('div', { key:p.id, className:'cta-card', style:{ cursor:'pointer' }, onClick:function(){ props.onPlanChange(p.id); } },
                _h('div', { className:'cta-card-inner', style:{ padding:16 } }, body));
            }
            return _h('div', { key:p.id, onClick:function(){ props.onPlanChange(p.id); },
              style:{ padding:16, borderRadius:20, cursor:'pointer',
                background: active ? 'var(--s3)' : 'var(--s2)', border:'1px solid ' + (active ? 'var(--b3)' : 'var(--b1)') } }, body);
          })
        ),
        _h('div', { style:{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 16px', borderRadius:14,
          background:'var(--s2)', border:'1px solid var(--b1)', marginBottom:20 } },
          _h('span', { style:{ fontSize:12.5, fontWeight:600 } }, 'Rozliczenie roczne'),
          _h('div', { onClick:props.onToggleYearly,
            style:{ width:44, height:26, borderRadius:13, cursor:'pointer', background: yearly ? 'var(--a)' : 'var(--s4)', position:'relative', transition:'background .2s' } },
            _h('div', { style:{ position:'absolute', top:3, left: yearly ? 21 : 3, width:20, height:20, borderRadius:'50%', background:'#fff',
              transition:'left .28s cubic-bezier(.34,1.4,.5,1)' } })
          )
        ),
        _h('div', { style:{ display:'flex', flexDirection:'column', gap:9 } },
          ['Pełny plan dopasowany do celu', 'Zapis serii, RIR, ACWR i historia', 'Analiza AI po każdym treningu', 'Trener widzi Twoje postępy'].map(function(t, i) {
            return _h('div', { key:i, style:{ display:'flex', alignItems:'center', gap:9 } },
              checkIcon(15, 'var(--green)'),
              _h('span', { style:{ fontSize:12.5, color:'var(--t2)' } }, t)
            );
          })
        )
      ),
      _h(ObCta, { label:'Zacznij 7 dni bezpłatnie', onClick:props.onFinish, caption:'To ustawienie możesz zmienić później.' })
    );
  }

  // ── KONTENER ──────────────────────────────────────────────────────────────
  function OnboardingModule() {
    var su = ET.useStore(); var update = su.update;
    var ss = React.useState(0); var step = ss[0], setStep = ss[1];
    var gs = React.useState(null); var goal = gs[0], setGoal = gs[1];
    var exs = React.useState(null); var exp = exs[0], setExp = exs[1];
    var ds = React.useState({}); var days = ds[0], setDays = ds[1];
    var durs = React.useState(60); var duration = durs[0], setDuration = durs[1];
    var tms = React.useState(null); var trainerMode = tms[0], setTrainerMode = tms[1];
    var tcs = React.useState(['','','','','','']); var trainerCode = tcs[0], setTrainerCode = tcs[1];
    var pls = React.useState('pro'); var plan = pls[0], setPlan = pls[1];
    var bys = React.useState(true); var yearly = bys[0], setYearly = bys[1];

    function next() { setStep(function(s){ return Math.min(5, s+1); }); }
    function back() { setStep(function(s){ return Math.max(0, s-1); }); }

    function finish() {
      update(function(s) {
        return Object.assign({}, s, { profile: Object.assign({}, s.profile, {
          onboardingDone: true,
          goal: goal,
          experienceYears: exp,
          availabilityDays: Object.keys(days).filter(function(k){ return days[k]; }),
          sessionLength: duration,
          trainerMode: trainerMode,
          trainerCode: trainerMode === 'code' ? trainerCode.join('') : null,
          plan: plan,
          billingYearly: yearly,
        }) });
      });
    }

    var body;
    if (step === 0) {
      body = _h(ObWelcome, { onNext:next });
    } else {
      body = _h(React.Fragment, null,
        _h(ObProgress, { step:step, onBack:back }),
        step === 1 && _h(ObGoal, { value:goal, onChange:setGoal, onNext:next }),
        step === 2 && _h(ObExperience, { value:exp, onChange:setExp, onNext:next }),
        step === 3 && _h(ObAvailability, { days:days,
          onToggleDay:function(k){ setDays(function(prev){ var n = Object.assign({}, prev); n[k] = !n[k]; return n; }); },
          duration:duration, onDurationChange:setDuration, onNext:next }),
        step === 4 && _h(ObTrainer, { value:trainerMode, onChange:setTrainerMode, code:trainerCode,
          onSetChar:function(i, ch){ setTrainerCode(function(prev){ var n = prev.slice(); n[i] = ch; return n; }); }, onNext:next }),
        step === 5 && _h(ObPaywall, { plan:plan, onPlanChange:setPlan, yearly:yearly,
          onToggleYearly:function(){ setYearly(function(prev){ return !prev; }); }, onFinish:finish })
      );
    }

    return _h('div', { style:{ position:'relative', minHeight:'100vh', background:'var(--bg)', overflow:'hidden', display:'flex', flexDirection:'column' } },
      _h('div', { className:'aurora aurora-1' }),
      _h('div', { className:'aurora aurora-2' }),
      _h('div', { key:step, className:'scr-in', style:{ position:'relative', zIndex:1, flex:1, display:'flex', flexDirection:'column', minHeight:0,
        padding:'max(20px, env(safe-area-inset-top,0px)) 22px calc(20px + env(safe-area-inset-bottom,0px))',
        maxWidth:480, margin:'0 auto', width:'100%', boxSizing:'border-box' } },
        body
      )
    );
  }

  ET.OnboardingModule = OnboardingModule;
})();
