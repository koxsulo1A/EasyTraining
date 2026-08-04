(function() {
  'use strict';
  window.ET = window.ET || {};
  var _h = React.createElement;

  // ── TRENER (iOS/uniwersalny) — redesign „Aurora Glass" ────────────────────
  // Handoff sekcja 11: nagłówek trenera z kropką obecności, karta propozycji
  // korekty (fiolet, TERAZ→PO ZMIANIE), wątek wiadomości, pole tekstowe.
  // Ten ekran wcześniej był tylko `CoachPlaceholder` (brak realnej implementacji
  // na ŻADNEJ platformie) — to nie jest redesign istniejącego widoku, tylko
  // NOWA funkcja, więc buduję JEDEN wspólny `ET.CoachModule` (bez Classic/
  // Mobile split — nie ma nic do ochrony na web, tam też był tylko placeholder).
  //
  // KLUCZOWA DECYZJA (bez fabrykacji): apka nie ma ŻADNEGO backendu do
  // wieloosobowego czatu z prawdziwym trenerem (brak kont trenerskich, brak
  // tabeli wiadomości, brak realtime). Zamiast UDAWAĆ, że po drugiej stronie
  // jest człowiek (fałszywa „zielona kropka obecności", fałszywe „odpowiada
  // w 2h"), ekran jest szczery: to „Trener AI" — ta sama etykieta, którą apka
  // już używa dla ekranu ACWR na webie. Konkretnie:
  //  - Nagłówek: bot-avatar (gradient, ikona), BEZ kropki obecności/czasu
  //    odpowiedzi (to by sugerowało człowieka, którego nie ma).
  //  - „Karta propozycji korekty": generowana z REALNEJ analizy plateau
  //    (`ET.AIEngine.detectStagnation`, już istniejące, używane gdzie indziej).
  //    „Zastosuj w planie" NAPRAWDĘ zapisuje override RIR do
  //    `store.planSuggestions[planId][ćwiczenie]` — dokładnie ten sam
  //    mechanizm, z którego `StrengthSessionMobile`/`StrengthSessionClassic`
  //    już czytają przy starcie NOWEJ sesji (`js/strength.js` linia ok. 720).
  //    Efekt jest realny, tylko odroczony do następnej sesji z tym
  //    ćwiczeniem — design sugeruje zmianę „na żywo" w trakcie treningu, co
  //    nie jest technicznie możliwe z osobnego ekranu (stan sesji żyje
  //    lokalnie w komponencie treningu, nie w globalnym store).
  //  - „Wątek wiadomości": reużywa silnik pytań z widgetu Smart Coach
  //    (Dashboard) — `ET.aiCoachIntents`/`ET.analyzeAiCoachIntent` — te same
  //    prawdziwe, uczciwe odpowiedzi, w stylistyce dymków z designu. Pole
  //    tekstowe NIE udaje wolnego NLP (analyzeIntent bierze stały `id`, nie
  //    dowolny tekst) — filtruje/podświetla pasujące pytania zamiast
  //    zmyślać odpowiedź na cokolwiek.

  function findExercisePlans(store, exerciseName) {
    var out = [];
    (ET.getEffectivePlans ? ET.getEffectivePlans(store) : []).forEach(function(p) {
      if ((p.exercises||[]).some(function(e){ return e.name===exerciseName; })) out.push(p.id);
    });
    (ET.getMetaPlans ? ET.getMetaPlans(store) : []).forEach(function(mp) {
      (mp.units||[]).forEach(function(u) {
        if ((u.exercises||[]).some(function(e){ return e.name===exerciseName; })) out.push(u.id);
      });
    });
    return out;
  }
  function findExerciseDefault(store, exerciseName) {
    var found = null;
    (ET.getEffectivePlans ? ET.getEffectivePlans(store) : []).forEach(function(p) {
      (p.exercises||[]).forEach(function(e){ if (!found && e.name===exerciseName) found = e; });
    });
    if (!found) {
      (ET.getMetaPlans ? ET.getMetaPlans(store) : []).forEach(function(mp) {
        (mp.units||[]).forEach(function(u){ (u.exercises||[]).forEach(function(e){ if (!found && e.name===exerciseName) found = e; }); });
      });
    }
    return found;
  }

  function CorrectionCard(props) {
    var store = props.store, update = props.update, toast = props.toast;
    var dismissed = store.coachDismissed || [];
    var applied = store.coachApplied || {};
    // Potwierdzenie po „Zastosuj" jest stanem TRANSIENTNYM (tylko tej wizyty
    // na ekranie) — po ponownym wejściu karta przechodzi do kolejnej
    // propozycji, żeby nie zaśmiecać ekranu historią zastosowanych korekt.
    var ja = React.useState(null); var justApplied = ja[0], setJustApplied = ja[1];

    var suggestion = React.useMemo(function() {
      if (!window.ET.AIEngine || !ET.AIEngine.detectStagnation) return null;
      var st = ET.AIEngine.detectStagnation(store);
      var pick = (st.weakPoints||[]).concat(st.plateaus||[]).find(function(p){ return dismissed.indexOf(p.name)===-1 && !applied[p.name]; });
      if (!pick) return null;
      var def = findExerciseDefault(store, pick.name);
      if (!def) return null;
      var curRir = def.rir != null ? def.rir : 2;
      var newRir = Math.max(0, curRir - 1);
      if (newRir === curRir) return null;
      return { name:pick.name, weight:pick.weight, reps:def.reps, curRir:curRir, newRir:newRir, planIds:findExercisePlans(store, pick.name) };
    }, [store.workouts, store.coachDismissed, store.coachApplied]);

    if (!suggestion && !justApplied) return null;
    var view = justApplied || suggestion;

    function apply() {
      update(function(s) {
        var ps = Object.assign({}, s.planSuggestions||{});
        suggestion.planIds.forEach(function(pid) {
          var forPlan = Object.assign({}, ps[pid]||{});
          forPlan[suggestion.name] = Object.assign({}, forPlan[suggestion.name]||{}, { rir:suggestion.newRir });
          ps[pid] = forPlan;
        });
        var appliedMap = Object.assign({}, s.coachApplied||{}); appliedMap[suggestion.name] = true;
        return Object.assign({}, s, { planSuggestions:ps, coachApplied:appliedMap });
      });
      setJustApplied(suggestion);
      toast('Zastosowano — zadziała przy następnej sesji z tym ćwiczeniem ✓', 'success');
    }
    function reject() {
      update(function(s){ return Object.assign({}, s, { coachDismissed:(s.coachDismissed||[]).concat([suggestion.name]) }); });
    }

    var wasApplied = !!justApplied;
    suggestion = view;

    return _h('div', { style:{ padding:18, borderRadius:20, marginBottom:18,
      background: wasApplied ? 'rgba(16,185,129,.10)' : 'var(--purple-d)', border:'1px solid ' + (wasApplied ? 'rgba(16,185,129,.3)' : 'rgba(139,92,246,.35)') } },
      _h('div', { style:{ fontSize:10, fontWeight:800, letterSpacing:'.1em', color: wasApplied?'var(--green)':'var(--purple)', textTransform:'uppercase', marginBottom:12 } },
        wasApplied ? 'Korekta zastosowana' : 'Propozycja korekty — ' + suggestion.name),
      !wasApplied && _h('div', { style:{ display:'flex', alignItems:'center', gap:10, marginBottom:14, flexWrap:'wrap' } },
        _h('div', { style:{ flex:'1 1 120px' } },
          _h('div', { style:{ fontSize:9, fontWeight:800, color:'var(--t3)', letterSpacing:'.06em' } }, 'TERAZ'),
          _h('div', { style:{ fontSize:14, fontWeight:800, marginTop:3 } }, suggestion.weight + ' kg × ' + (suggestion.reps||'—') + ' · RIR ' + suggestion.curRir)
        ),
        _h('span', { style:{ color:'var(--purple)', fontSize:16 } }, '→'),
        _h('div', { style:{ flex:'1 1 120px' } },
          _h('div', { style:{ fontSize:9, fontWeight:800, color:'var(--t3)', letterSpacing:'.06em' } }, 'PO ZMIANIE'),
          _h('div', { style:{ fontSize:14, fontWeight:800, marginTop:3, color:'var(--purple)' } }, suggestion.weight + ' kg × max · RIR ' + suggestion.newRir)
        )
      ),
      _h('div', { style:{ fontSize:11.5, color:'var(--t2)', lineHeight:1.5, marginBottom:14 } },
        wasApplied ? 'Nowy cel RIR zadziała automatycznie przy następnym starcie tego ćwiczenia.'
          : suggestion.name + ' stoi w miejscu — spróbuj podejść bliżej upadku mięśniowego w ostatniej serii.'),
      !wasApplied && _h('div', { style:{ display:'flex', gap:10 } },
        _h('button', { onClick:reject, style:{ flex:1, padding:'10px', borderRadius:14, border:'1px solid var(--b2)', background:'var(--s3)', color:'var(--t2)', fontSize:12.5, fontWeight:700, cursor:'pointer' } }, 'Odrzuć'),
        _h('button', { onClick:apply, style:{ flex:1, padding:'10px', borderRadius:14, border:'none', background:'var(--purple)', color:'#fff', fontSize:12.5, fontWeight:700, cursor:'pointer' } }, 'Zastosuj w planie')
      )
    );
  }

  function CoachModule() {
    var su = ET.useStore(); var store = su.store, update = su.update;
    var toast = ET.useToast();

    var msgs = React.useState([]); var chat = msgs[0], setChat = msgs[1];
    var qs = React.useState(''); var query = qs[0], setQuery = qs[1];
    var pk = React.useState(null); var picking = pk[0], setPicking = pk[1]; // intent czekający na wybór ćwiczenia

    var intents = ET.aiCoachIntents || [];
    var exerciseNames = React.useMemo(function(){ return ET.getWorkoutExerciseNames ? ET.getWorkoutExerciseNames(store) : []; }, [store.workouts]);
    var filtered = intents.filter(function(it){ return !query || it.label.toLowerCase().indexOf(query.toLowerCase())!==-1; });

    function ask(intent, exercise) {
      setChat(function(c){ return c.concat({ from:'user', text: intent.icon + ' ' + intent.label + (exercise ? ' — ' + exercise : '') }); });
      var answer = ET.analyzeAiCoachIntent ? ET.analyzeAiCoachIntent(intent.id, exercise||null, store) : 'Analiza niedostępna.';
      setChat(function(c){ return c.concat({ from:'coach', text:answer }); });
      setPicking(null);
    }
    function pickIntent(intent) {
      if (intent.needsExercise) {
        if (!exerciseNames.length) { toast('Brak jeszcze zapisanych ćwiczeń do analizy', 'error'); return; }
        setPicking(intent);
        return;
      }
      ask(intent, null);
    }

    return _h('div', { className:'scr-in' },
      // ── NAGŁÓWEK ────────────────────────────────────────────────────
      _h('div', { style:{ display:'flex', alignItems:'center', gap:12, marginBottom:18 } },
        _h('div', { style:{ width:48, height:48, borderRadius:'50%', flexShrink:0, background:'linear-gradient(135deg,#8B5CF6,#3B82F6)',
          display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 8px 22px -6px rgba(139,92,246,.6)' } },
          _h('svg', { width:24, height:24, viewBox:'0 0 24 24', fill:'none', stroke:'#fff', strokeWidth:1.8, strokeLinecap:'round', strokeLinejoin:'round' },
            _h('path', { d:'M12 3a3 3 0 0 1 3 3v1h1a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2h-8a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h1V6a3 3 0 0 1 3-3zM9 13v1M15 13v1' }))),
        _h('div', null,
          _h('div', { style:{ fontSize:17, fontWeight:800 } }, 'Trener AI'),
          _h('div', { style:{ fontSize:11.5, color:'var(--t3)', marginTop:2 } }, 'Analizuje Twoje treningi i sugeruje korekty')
        )
      ),

      _h(CorrectionCard, { store:store, update:update, toast:toast }),

      // ── WĄTEK ─────────────────────────────────────────────────────────
      chat.length > 0 && _h('div', { style:{ display:'flex', flexDirection:'column', gap:10, marginBottom:16 } },
        chat.map(function(m, i) {
          var isCoach = m.from === 'coach';
          return _h('div', { key:i, style:{ display:'flex', justifyContent: isCoach ? 'flex-start' : 'flex-end' } },
            _h('div', { style:{ maxWidth:'82%', padding:'10px 14px', fontSize:12.5, lineHeight:1.5,
              borderRadius: isCoach ? '18px 18px 18px 6px' : '18px 18px 6px 18px',
              background: isCoach ? 'rgba(255,255,255,.045)' : 'rgba(59,130,246,.16)',
              color: isCoach ? 'var(--t1)' : 'var(--t1)', whiteSpace:'pre-wrap' } }, m.text)
          );
        })
      ),

      // ── WYBÓR ĆWICZENIA (gdy pytanie tego wymaga) ────────────────────
      picking && _h('div', { style:{ marginBottom:16 } },
        _h('div', { style:{ fontSize:11, color:'var(--t3)', marginBottom:8 } }, 'Które ćwiczenie?'),
        _h('div', { style:{ display:'flex', gap:6, flexWrap:'wrap' } },
          exerciseNames.slice(0,20).map(function(name) {
            return _h('button', { key:name, onClick:function(){ ask(picking, name); },
              style:{ padding:'6px 12px', borderRadius:100, border:'1px solid var(--b2)', background:'var(--s3)', color:'var(--t2)', fontSize:11.5, cursor:'pointer' } }, name);
          }),
          _h('button', { onClick:function(){ setPicking(null); },
            style:{ padding:'6px 12px', borderRadius:100, border:'none', background:'none', color:'var(--t3)', fontSize:11.5, cursor:'pointer' } }, 'Anuluj')
        )
      ),

      // ── PYTANIA (chipy) ───────────────────────────────────────────────
      !picking && _h('div', { style:{ display:'flex', flexDirection:'column', gap:8, marginBottom:16 } },
        filtered.map(function(it) {
          return _h('div', { key:it.id, onClick:function(){ pickIntent(it); },
            style:{ display:'flex', alignItems:'center', gap:10, padding:'11px 14px', borderRadius:16, background:'var(--s2)', border:'1px solid var(--b1)', cursor:'pointer' } },
            _h('span', { style:{ fontSize:15 } }, it.icon),
            _h('span', { style:{ fontSize:12.5, fontWeight:600, flex:1 } }, it.label),
            _h('span', { style:{ color:'var(--t3)', fontSize:12 } }, '›')
          );
        }),
        filtered.length===0 && _h('div', { style:{ fontSize:11.5, color:'var(--t3)', textAlign:'center', padding:'12px 0' } }, 'Brak pasujących pytań.')
      ),

      // ── POLE — filtruje pytania powyżej (bez wolnego NLP, patrz komentarz) ──
      _h('div', { style:{ display:'flex', alignItems:'center', gap:8, padding:'6px 6px 6px 16px', borderRadius:100, background:'var(--s2)', border:'1px solid var(--b1)' } },
        _h('input', { type:'text', value:query, onChange:function(e){ setQuery(e.target.value); }, placeholder:'Szukaj pytania…',
          style:{ flex:1, background:'none', border:'none', outline:'none', color:'var(--t1)', fontSize:13 } }),
        _h('div', { style:{ width:34, height:34, borderRadius:'50%', flexShrink:0, background:'var(--purple)', display:'flex', alignItems:'center', justifyContent:'center' } },
          _h('svg', { width:15, height:15, viewBox:'0 0 24 24', fill:'none', stroke:'#fff', strokeWidth:2.2, strokeLinecap:'round', strokeLinejoin:'round' }, _h('path', { d:'M12 19V5M5 12l7-7 7 7' })))
      )
    );
  }

  ET.CoachModule = CoachModule;
})();
