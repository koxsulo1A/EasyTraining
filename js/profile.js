(function() {
  'use strict';
  window.ET = window.ET || {};
  var _h = React.createElement;

  // Klasyczny widok — bez zmian, ścieżka WEB. Patrz dispatcher `ProfileModule`
  // i `ProfileModuleMobile` poniżej.
  function ProfileModuleClassic() {
    var su = ET.useStore(); var store = su.store, update = su.update;
    var toast = ET.useToast();
    var nav = ET.useNav(); var navigate = nav.navigate;
    var tcs = React.useState(0); var tapCount = tcs[0]; var setTapCount = tcs[1];
    var tapTimer = React.useRef(null);

    function handleVersionTap() {
      clearTimeout(tapTimer.current);
      var next = tapCount + 1;
      setTapCount(next);
      if (next >= 10) { setTapCount(0); navigate('dev'); return; }
      tapTimer.current = setTimeout(function(){ setTapCount(0); }, 3000);
    }
    var fs = React.useState(Object.assign({}, store.profile));
    var f = fs[0], setF = fs[1];
    function upF(key, val) { setF(function(prev){ var o={}; o[key]=val; return Object.assign({},prev,o); }); }

    var authTop = ET.useAuth ? ET.useAuth() : null;
    var isAdmin = !!(authTop && authTop.profile && authTop.profile.role === 'admin');

    // ── Ustawienia (⚙): widgety Dashboardu, menu boczne/dolne, kafelki ──────
    var sset = React.useState(false); var showSettings = sset[0], setShowSettings = sset[1];
    var FLAT_NAV = (ET.NAV_GROUPS||[]).reduce(function(a,g){ return a.concat(g.items); }, []);
    var LOCKED_NAV = ['dashboard','profile']; // zawsze widoczne — inaczej nie wrócisz do ustawień

    function menuOf(kind) { return (store.menuSettings||{})[kind] || {}; }
    function saveMenu(kind, patch) {
      update(function(s){
        var all = Object.assign({}, s.menuSettings||{});
        all[kind] = Object.assign({}, all[kind]||{}, patch);
        return Object.assign({}, s, { menuSettings:all });
      });
    }
    function sortedItems(items, kind) {
      var order = menuOf(kind).order || [];
      if (!order.length) return items.slice();
      return items.slice().sort(function(a,b){
        var ia = order.indexOf(a.id), ib = order.indexOf(b.id);
        if (ia===-1 && ib===-1) return items.indexOf(a)-items.indexOf(b);
        if (ia===-1) return 1; if (ib===-1) return -1;
        return ia-ib;
      });
    }
    function moveItem(items, kind, id, dir) {
      var list = sortedItems(items, kind).map(function(i){ return i.id; });
      var idx = list.indexOf(id), ni = idx+dir;
      if (idx<0 || ni<0 || ni>=list.length) return;
      var t = list[idx]; list[idx]=list[ni]; list[ni]=t;
      saveMenu(kind, { order:list });
    }
    function toggleHidden(kind, id) {
      var hidden = (menuOf(kind).hidden||[]).slice();
      var i = hidden.indexOf(id);
      if (i===-1) hidden.push(id); else hidden.splice(i,1);
      saveMenu(kind, { hidden:hidden });
    }
    // Wiersz edytora menu: ▲▼ kolejność, 👁 widoczność
    function menuEditorRows(items, kind) {
      var hidden = menuOf(kind).hidden || [];
      return sortedItems(items, kind).map(function(item, idx, arr) {
        var isHidden = hidden.indexOf(item.id)!==-1;
        var locked = LOCKED_NAV.indexOf(item.id)!==-1;
        return _h('div', { key:item.id, style:{ display:'flex', alignItems:'center', gap:8, padding:'6px 0', borderBottom:'1px solid var(--b1)', opacity:isHidden?0.45:1 } },
          _h('span', { style:{ width:22, textAlign:'center' } }, item.icon),
          _h('span', { style:{ flex:1, fontSize:'.8rem' } }, item.label),
          _h('button', { className:'btn btn-ghost btn-sm btn-icon', disabled:idx===0, style:{ opacity:idx===0?0.3:1 }, onClick:function(){ moveItem(items, kind, item.id, -1); } }, '▲'),
          _h('button', { className:'btn btn-ghost btn-sm btn-icon', disabled:idx===arr.length-1, style:{ opacity:idx===arr.length-1?0.3:1 }, onClick:function(){ moveItem(items, kind, item.id, 1); } }, '▼'),
          locked
            ? _h('span', { style:{ width:32, textAlign:'center', fontSize:'.7rem', color:'var(--t3)' } }, '🔒')
            : _h('button', { className:'btn btn-ghost btn-sm btn-icon', title:isHidden?'Pokaż':'Ukryj', onClick:function(){ toggleHidden(kind, item.id); } }, isHidden?'🚫':'👁')
        );
      });
    }
    // Pula dodatkowych kafelków Szybki start (moduły spoza domyślnej szóstki)
    var TILE_POOL = FLAT_NAV.filter(function(i){
      return ['dashboard','profile','strength','running','sauna','supplements','measurements','sleep'].indexOf(i.id)===-1;
    });

    function save() {
      update(function(s){ return Object.assign({},s,{ profile:Object.assign({},f) }); });
      toast('Profil zapisany ✓', 'success');
    }

    function clearAll() {
      if (!confirm('Czy na pewno chcesz usunąć WSZYSTKIE dane? Tej operacji nie można cofnąć!')) return;
      if (ET.AccountStorage) ET.AccountStorage.clearAccountData(); else localStorage.removeItem('et_v1');
      window.location.reload();
    }

    var p = store.profile;
    var targetKcal = '—', bmrVal = '—';
    if (p.weight && p.height && p.age) {
      var bmr = Math.round(10*p.weight + 6.25*p.height - 5*p.age + (p.gender==='female'?-161:5));
      var mult = { sedentary:1.2, light:1.375, moderate:1.55, active:1.725, very_active:1.9 }[p.activityLevel]||1.55;
      bmrVal = bmr;
      targetKcal = Math.round(bmr*mult);
    }

    var totalWorkouts = (store.workouts||[]).length;
    var totalRuns = (store.runs||[]).length;
    var totalKm = (store.runs||[]).reduce(function(t,r){ return t+(r.distance||0); },0).toFixed(1);
    var totalVol = (store.workouts||[]).reduce(function(t,w){ return t+(w.volume||0); },0).toFixed(0);

    return _h('div', { className:'fade-in' },
      _h('div', { className:'page-hdr' },
        _h('h1', null, 'Profil'),
        _h('button', { className:'btn btn-primary', onClick:save }, 'Zapisz')
      ),

      _h('div', { className:'grid-4', style:{ marginBottom:20 } },
        _h(ET.StatCard, { label:'Treningi', value:totalWorkouts, color:'var(--a-light)' }),
        _h(ET.StatCard, { label:'Biegi', value:totalRuns, color:'var(--green)' }),
        _h(ET.StatCard, { label:'Km', value:totalKm, color:'var(--teal)' }),
        _h(ET.StatCard, { label:'Wolumen', value:totalVol+' kg', color:'var(--purple)' })
      ),

      _h('div', { className:'card', style:{ marginBottom:14 } },
        _h('div', { style:{ fontWeight:700, marginBottom:14, fontSize:'.9rem', color:'var(--t2)' } }, '👤 Dane osobowe'),
        _h('div', { className:'grid-2' },
          _h('div', { className:'field' }, _h('label', null, 'Imię'), _h('input', { type:'text', value:f.name||'', onChange:function(e){ upF('name',e.target.value); } })),
          _h('div', { className:'field' }, _h('label', null, 'Wiek'), _h('input', { type:'number', min:1, max:120, value:f.age||'', onChange:function(e){ upF('age',+e.target.value); } })),
          _h('div', { className:'field' }, _h('label', null, 'Waga (kg)'), _h('input', { type:'number', step:0.1, value:f.weight||'', onChange:function(e){ upF('weight',+e.target.value); } })),
          _h('div', { className:'field' }, _h('label', null, 'Wzrost (cm)'), _h('input', { type:'number', value:f.height||'', onChange:function(e){ upF('height',+e.target.value); } }))
        ),
        _h('div', { className:'field' }, _h('label', null, 'Płeć'),
          _h('select', { value:f.gender||'male', onChange:function(e){ upF('gender',e.target.value); } },
            _h('option', { value:'male' }, 'Mężczyzna'), _h('option', { value:'female' }, 'Kobieta')
          )
        ),
        _h('div', { className:'field' }, _h('label', null, 'Dyscyplina / sport'), _h('input', { type:'text', placeholder:'np. Trójbój siłowy, Bieganie', value:f.sport||'', onChange:function(e){ upF('sport',e.target.value); } })),
        _h('div', { className:'field' }, _h('label', null, 'Poziom aktywności'),
          _h('select', { value:f.activityLevel||'moderate', onChange:function(e){ upF('activityLevel',e.target.value); } },
            _h('option', { value:'sedentary' }, 'Siedzący tryb życia'),
            _h('option', { value:'light' }, 'Lekka aktywność (1-3 dni/tydz.)'),
            _h('option', { value:'moderate' }, 'Umiarkowana (3-5 dni/tydz.)'),
            _h('option', { value:'active' }, 'Wysoka aktywność (6-7 dni/tydz.)'),
            _h('option', { value:'very_active' }, 'Bardzo wysoka / 2x dziennie')
          )
        )
      ),

      p.weight && p.height && p.age && _h('div', { className:'card card-accent', style:{ marginBottom:14 } },
        _h('div', { style:{ fontWeight:700, marginBottom:12, fontSize:'.9rem', color:'var(--t2)' } }, '⚡ Metabolizm (Mifflin-St Jeor)'),
        _h('div', { className:'grid-2', style:{ gap:8 } },
          _h(ET.StatCard, { label:'BMR (podstawowy)', value:bmrVal+' kcal', color:'var(--a-light)' }),
          _h(ET.StatCard, { label:'TDEE (z aktywnością)', value:targetKcal+' kcal', color:'var(--green)' })
        )
      ),

      // 👤 Konto — status logowania/synchronizacji
      (function() {
        var auth = ET.useAuth ? ET.useAuth() : null;
        if (!auth) return null;
        if (!auth.available) {
          return _h('div', { className:'card', style:{ marginBottom:14 } },
            _h('div', { style:{ fontWeight:700, marginBottom:4, fontSize:'.9rem' } }, '👤 Konto'),
            _h('div', { style:{ fontSize:'.72rem', color:'var(--t3)' } }, 'Synchronizacja niedostępna (brak połączenia z serwerem). Aplikacja działa offline.')
          );
        }
        if (auth.status === 'authed') {
          var roleLabel = { user:'Użytkownik', admin:'Administrator', trainer:'Trener' }[auth.profile && auth.profile.role] || 'Użytkownik';
          return _h('div', { className:'card', style:{ marginBottom:14 } },
            _h('div', { style:{ display:'flex', alignItems:'center', gap:12 } },
              _h('div', { style:{ width:42, height:42, borderRadius:'50%', background:'var(--a-dim)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.2rem', flexShrink:0 } }, '👤'),
              _h('div', { style:{ flex:1, minWidth:0 } },
                _h('div', { style:{ fontWeight:700, fontSize:'.85rem', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' } }, auth.profile && auth.profile.email),
                _h('div', { style:{ fontSize:'.68rem', color:'var(--a-light)', marginTop:2 } }, '✓ Zsynchronizowano · '+roleLabel)
              ),
              _h('button', { className:'btn btn-ghost btn-sm', onClick:auth.signOut }, 'Wyloguj')
            )
          );
        }
        // guest (tryb offline)
        return _h('div', { className:'card', style:{ marginBottom:14 } },
          _h('div', { style:{ display:'flex', alignItems:'center', gap:12 } },
            _h('div', { style:{ width:42, height:42, borderRadius:'50%', background:'var(--s3)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.2rem', flexShrink:0 } }, '👤'),
            _h('div', { style:{ flex:1 } },
              _h('div', { style:{ fontWeight:700, fontSize:'.85rem' } }, 'Tryb offline'),
              _h('div', { style:{ fontSize:'.68rem', color:'var(--t3)', marginTop:2 } }, 'Dane tylko na tym urządzeniu')
            ),
            _h('button', { className:'btn btn-primary btn-sm', onClick:auth.loginFromSettings }, 'Zaloguj się')
          )
        );
      })(),

      // ⚙ Ustawienia — kafelek rozwijany: widgety, menu boczne/dolne, kafelki
      _h('div', { className:'card', style:{ marginBottom:14, cursor:'pointer' }, onClick:function(){ setShowSettings(!showSettings); } },
        _h('div', { style:{ display:'flex', alignItems:'center', gap:12 } },
          _h('div', { style:{ width:42, height:42, borderRadius:'var(--r2)', background:'var(--s3)', border:'1px solid var(--b1)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.3rem', flexShrink:0 } }, '⚙️'),
          _h('div', { style:{ flex:1 } },
            _h('div', { style:{ fontWeight:700, fontSize:'.9rem' } }, 'Ustawienia'),
            _h('div', { style:{ fontSize:'.68rem', color:'var(--t3)', marginTop:2 } }, 'Widgety Dashboardu · menu boczne · menu dolne · kafelki')
          ),
          _h('span', { style:{ color:'var(--t3)' } }, showSettings?'▴':'▾')
        )
      ),

      showSettings && _h('div', { className:'fade-in' },
        // (a) Widgety Dashboardu
        _h('div', { className:'card', style:{ marginBottom:10 } },
          _h('div', { style:{ fontWeight:700, marginBottom:4, fontSize:'.85rem' } }, '🖥 Widgety na Dashboardzie'),
          _h('p', { style:{ fontSize:'.7rem', color:'var(--t3)', marginBottom:10 } }, 'Odznacz, których nie chcesz widzieć na ekranie głównym.'),
          (ET.DASHBOARD_WIDGETS||[]).map(function(w) {
            var on = (store.dashboardWidgets||{})[w.id] !== false;
            return _h('label', { key:w.id, style:{ display:'flex', alignItems:'center', gap:10, padding:'7px 0', borderBottom:'1px solid var(--b1)', cursor:'pointer' } },
              _h('input', { type:'checkbox', checked:on, onChange:function(){
                update(function(s){
                  var d = Object.assign({}, s.dashboardWidgets||{});
                  d[w.id] = !on;
                  return Object.assign({}, s, { dashboardWidgets:d });
                });
              } }),
              _h('span', { style:{ fontSize:'.8rem' } }, w.icon+' '+w.label)
            );
          })
        ),

        // (d) Dodatkowe kafelki Szybki start
        _h('div', { className:'card', style:{ marginBottom:10 } },
          _h('div', { style:{ fontWeight:700, marginBottom:4, fontSize:'.85rem' } }, '➕ Dodatkowe kafelki na Dashboardzie'),
          _h('p', { style:{ fontSize:'.7rem', color:'var(--t3)', marginBottom:10 } }, 'Zaznacz moduły, które chcesz mieć jako kafelki w "Szybki start".'),
          TILE_POOL.map(function(item) {
            var on = (store.quickTiles||[]).indexOf(item.id)!==-1;
            return _h('label', { key:item.id, style:{ display:'flex', alignItems:'center', gap:10, padding:'7px 0', borderBottom:'1px solid var(--b1)', cursor:'pointer' } },
              _h('input', { type:'checkbox', checked:on, onChange:function(){
                update(function(s){
                  var qt = (s.quickTiles||[]).slice();
                  var i = qt.indexOf(item.id);
                  if (i===-1) qt.push(item.id); else qt.splice(i,1);
                  return Object.assign({}, s, { quickTiles:qt });
                });
              } }),
              _h('span', { style:{ fontSize:'.8rem' } }, item.icon+' '+item.label)
            );
          })
        ),

        // (b) Menu boczne (desktop)
        _h('div', { className:'card', style:{ marginBottom:10 } },
          _h('div', { style:{ fontWeight:700, marginBottom:4, fontSize:'.85rem' } }, '📑 Menu boczne (desktop)'),
          _h('p', { style:{ fontSize:'.7rem', color:'var(--t3)', marginBottom:10 } }, '▲▼ zmienia kolejność (w obrębie sekcji), 👁 ukrywa pozycję.'),
          menuEditorRows(FLAT_NAV, 'sidebar')
        ),

        // (c) Menu dolne (mobile)
        _h('div', { className:'card', style:{ marginBottom:10 } },
          _h('div', { style:{ fontWeight:700, marginBottom:4, fontSize:'.85rem' } }, '📱 Menu dolne (mobile)'),
          _h('p', { style:{ fontSize:'.7rem', color:'var(--t3)', marginBottom:10 } }, 'Maks. kilka ikon naraz — ukryte pozycje trafiają do "Więcej".'),
          menuEditorRows(ET.MOBILE_TABS||[], 'mobile')
        ),

        // (e) Live Activity (iOS) — test diagnostyczny
        _h('div', { className:'card', style:{ marginBottom:10 } },
          _h('div', { style:{ fontWeight:700, marginBottom:4, fontSize:'.85rem' } }, '🏝 Live Activity (iOS)'),
          _h('p', { style:{ fontSize:'.7rem', color:'var(--t3)', marginBottom:10 } },
            'Panel treningu na ekranie blokady i w Dynamic Island (iOS 16.2+). Test pokaże panel na 8 sekund — zablokuj telefon zaraz po kliknięciu.'),
          _h('button', { className:'btn btn-secondary', style:{ width:'100%' }, onClick:function(){
            if (!ET.LiveActivity) { toast('Moduł niedostępny', 'error'); return; }
            ET.LiveActivity.test().then(function(r){
              if (r.ok) toast('Live Activity wystartowała ✓ — zablokuj ekran', 'success');
              else toast('Nie działa: '+(r.reason||'nieznany powód'), 'error');
            });
          } }, '🧪 Testuj Live Activity')
        ),

        // (f) Panel kont — tylko dla Administratora
        isAdmin && _h(ET.AdminPanel, null)
      ),

      _h('div', { className:'card', style:{ marginBottom:14 } },
        _h('div', { style:{ fontWeight:700, marginBottom:8, fontSize:'.9rem', color:'var(--t2)' } }, '🤖 AI Export'),
        _h('p', { style:{ fontSize:'.8rem', color:'var(--t3)', marginBottom:14, lineHeight:1.6 } },
          'Eksportuje dane z ostatnich 30 dni do pliku JSON. Wklej go do ChatGPT, Claude lub innego modelu AI i poproś o analizę i zalecenia treningowe.'
        ),
        _h('button', { className:'btn btn-lg', style:{ width:'100%', background:'linear-gradient(135deg,var(--purple),var(--a))', color:'#fff', border:'none', marginBottom:8 }, onClick:function(){ ET.exportAI(store); toast('Eksport AI gotowy! ✓','success'); } }, '🤖 EKSPORT AI — ostatnie 30 dni')
      ),

      _h('div', { className:'card', style:{ borderColor:'var(--red)' } },
        _h('div', { style:{ fontWeight:700, marginBottom:8, fontSize:'.9rem', color:'var(--red)' } }, '⚠ Strefa niebezpieczna'),
        _h('p', { style:{ fontSize:'.8rem', color:'var(--t3)', marginBottom:12 } }, 'Usuwa wszystkie dane z localStorage. Nieodwracalne!'),
        _h('button', { className:'btn btn-danger', style:{ width:'100%' }, onClick:clearAll }, '🗑 Usuń wszystkie dane')
      ),

      // Stempel kompilacji — pozwala od razu sprawdzić na telefonie, czy po
      // instalacji .ipa faktycznie działa nowe wydanie (wstrzykiwany przez
      // scripts/build-web.mjs; przy pracy z repo bez buildu pokazuje "dev").
      _h('div', { onClick:handleVersionTap, style:{ textAlign:'center', padding:'20px 0 8px', color:'var(--t3)', fontSize:'.62rem', userSelect:'none', cursor:'default', letterSpacing:'.04em' } },
        'EasyTraining v1.0.0',
        _h('div', { style:{ marginTop:3, fontFamily:'monospace', fontSize:'.58rem', opacity:.75 } }, 'build ' + (window.ET_BUILD || 'dev')),
        tapCount > 0 && _h('span', { style:{ color:'var(--a)', marginLeft:6, fontWeight:700 } }, '['+tapCount+'/10]')
      )
    );
  }

  // Web zostaje przy widoku klasycznym; iOS dostaje redesign „Aurora Glass".
  function ProfileModule() {
    return ET.IS_WEB ? _h(ProfileModuleClassic, null) : _h(ProfileModuleMobile, null);
  }

  var PLAN_LABELS = { pro:'PRO z trenerem', solo:'SOLO' };
  var PLAN_PRICES = { pro:{ mo:149, yr:1430 }, solo:{ mo:49, yr:470 } };

  // ── PROFIL I ABONAMENT (iOS) — redesign „Aurora Glass" ────────────────────
  // Handoff sekcja 13: avatar+dane, karta abonamentu (gradientowa ramka +
  // shimmer), 4 korzyści, lista ustawień z chevronami.
  // Odstępstwo (real data, bez fabrykacji): design pokazuje AKTYWNĄ płatną
  // subskrypcję („do 12.08.2026", „odnawia się automatycznie") — apka nie ma
  // integracji płatności (ta sama decyzja co w onboardingu: `store.profile.plan`
  // to lokalna PREFERENCJA z onboardingu, nie realny stan subskrypcji). Karta
  // pokazuje wybrany plan uczciwie jako preferencję, bez zmyślonej daty
  // odnowienia. „USTAWIENIA" z designu (Jednostki kg/cm, Domyślna przerwa,
  // Przypomnienia) w większości NIE ISTNIEJĄ jako realne przełączniki w tej
  // apce — lista poniżej linkuje do sekcji, które NAPRAWDĘ istnieją
  // (widgety/menu, Synchronizacja z Apple Health, Eksport danych do AI,
  // Strefa niebezpieczna), reużywając ich sprawdzoną logikę bez zmian.
  function ProfileModuleMobile() {
    var su = ET.useStore(); var store = su.store, update = su.update;
    var toast = ET.useToast();
    var nav = ET.useNav(); var navigate = nav.navigate;
    var tcs = React.useState(0); var tapCount = tcs[0], setTapCount = tcs[1];
    var tapTimer = React.useRef(null);
    function handleVersionTap() {
      clearTimeout(tapTimer.current);
      var next = tapCount + 1; setTapCount(next);
      if (next >= 10) { setTapCount(0); navigate('dev'); return; }
      tapTimer.current = setTimeout(function(){ setTapCount(0); }, 3000);
    }

    var fs = React.useState(Object.assign({}, store.profile));
    var f = fs[0], setF = fs[1];
    function upF(key, val) { setF(function(prev){ var o={}; o[key]=val; return Object.assign({},prev,o); }); }
    function save() { update(function(s){ return Object.assign({},s,{ profile:Object.assign({},f) }); }); toast('Profil zapisany ✓', 'success'); }
    function clearAll() {
      if (!confirm('Czy na pewno chcesz usunąć WSZYSTKIE dane? Tej operacji nie można cofnąć!')) return;
      if (ET.AccountStorage) ET.AccountStorage.clearAccountData(); else localStorage.removeItem('et_v1');
      window.location.reload();
    }

    var auth = ET.useAuth ? ET.useAuth() : null;
    var isAdmin = !!(auth && auth.profile && auth.profile.role === 'admin');
    var open = React.useState(null); var openPanel = open[0], setOpenPanel = open[1]; // 'edit'|'settings'|'danger'|null

    var p = store.profile;
    var plan = p.plan; // 'pro'|'solo'|undefined (nieustawione — user pominął/nie przeszedł onboardingu)
    var totalWorkouts = (store.workouts||[]).length;
    var totalRuns = (store.runs||[]).length;
    var totalKm = (store.runs||[]).reduce(function(t,r){ return t+(r.distance||0); },0).toFixed(1);
    var totalVol = (store.workouts||[]).reduce(function(t,w){ return t+(w.volume||0); },0).toFixed(0);

    var SETTINGS_ROWS = [
      { id:'edit', icon:'✏️', label:'Dane osobowe', sub:'Imię, wiek, waga, wzrost, aktywność' },
      { id:'health', icon:'🍎', label:'Synchronizacja zdrowia', sub:'Import biegów z Apple Health' },
      { id:'export', icon:'🤖', label:'Eksport danych do AI', sub:'JSON z ostatnich 30 dni' },
      { id:'settings', icon:'⚙️', label:'Widgety i menu', sub:'Dashboard, kafelki, kolejność' },
      { id:'danger', icon:'🗑', label:'Usuń wszystkie dane', sub:'Nieodwracalne', danger:true },
    ];

    return _h('div', { className:'scr-in' },
      // ── NAGŁÓWEK ────────────────────────────────────────────────────
      _h('div', { style:{ display:'flex', alignItems:'center', gap:14, marginBottom:20 } },
        _h('div', { style:{ width:58, height:58, borderRadius:'50%', flexShrink:0, background:'linear-gradient(135deg,#3B82F6,#8B5CF6)',
          display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, fontWeight:800, color:'#fff' } },
          (p.name || '?').trim().charAt(0).toUpperCase()),
        _h('div', null,
          _h('div', { style:{ fontSize:21, fontWeight:800, letterSpacing:'-.02em' } }, p.name || 'Bez imienia'),
          _h('div', { style:{ fontSize:12, color:'var(--t3)', marginTop:3 } },
            [p.weight && p.weight+' kg', p.height && p.height+' cm', p.age && p.age+' lat'].filter(Boolean).join(' · ') || 'Uzupełnij dane w ustawieniach')
        )
      ),

      // ── KARTA PLANU (informacyjna — patrz komentarz nad komponentem) ─────
      plan && _h('div', { className:'cta-card', style:{ marginBottom:14 } },
        _h('div', { className:'cta-card-inner' },
          _h('div', { style:{ display:'flex', alignItems:'center', gap:6, marginBottom:8 } },
            _h('span', { style:{ color:'var(--yellow)', fontSize:14 } }, '★'),
            _h('span', { style:{ fontSize:10, fontWeight:800, letterSpacing:'.08em', color:'var(--t2)', textTransform:'uppercase' } }, PLAN_LABELS[plan] || plan)
          ),
          _h('div', { style:{ fontSize:13, fontWeight:700, marginBottom:4 } }, 'Wybrany plan'),
          _h('div', { style:{ fontSize:12, color:'var(--t3)', lineHeight:1.5 } },
            PLAN_PRICES[plan] ? (p.billingYearly ? PLAN_PRICES[plan].yr + ' zł / rok' : PLAN_PRICES[plan].mo + ' zł / miesiąc') + ' · preferencja z onboardingu' : 'Ustawione w onboardingu'),
          _h('div', { style:{ fontSize:10.5, color:'var(--t3)', marginTop:8, fontStyle:'italic' } }, 'Płatności nie są jeszcze podłączone — nic nie jest dziś pobierane.')
        )
      ),

      !plan && _h('div', { style:{ padding:16, borderRadius:18, background:'var(--s2)', border:'1px dashed var(--b2)', marginBottom:14, fontSize:12, color:'var(--t3)', textAlign:'center' } },
        'Brak wybranego planu — dostępne po przejściu onboardingu.'),

      // ── W ABONAMENCIE ─────────────────────────────────────────────────
      _h('div', { style:{ display:'flex', flexDirection:'column', gap:9, marginBottom:20 } },
        ['Plan dopasowany do celu i dostępności', 'Zapis serii, RIR, ACWR i historia', 'Analiza AI po każdym treningu', 'Trener AI widzi Twoje postępy'].map(function(t, i) {
          return _h('div', { key:i, style:{ display:'flex', alignItems:'center', gap:9 } },
            _h('svg', { width:15, height:15, viewBox:'0 0 24 24', fill:'none', stroke:'var(--green)', strokeWidth:3, strokeLinecap:'round', strokeLinejoin:'round' }, _h('path', { d:'M4 12.5l5.2 5.2L20 6.8' })),
            _h('span', { style:{ fontSize:12.5, color:'var(--t2)' } }, t)
          );
        })
      ),

      // ── STATYSTYKI ────────────────────────────────────────────────────
      _h('div', { style:{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:8, marginBottom:20 } },
        [
          { l:'Treningi', v:totalWorkouts, c:'var(--a-light)' }, { l:'Biegi', v:totalRuns, c:'var(--green)' },
          { l:'Km', v:totalKm, c:'var(--teal)' }, { l:'Wolumen', v:totalVol+' kg', c:'var(--purple)' },
        ].map(function(s, i) {
          return _h('div', { key:i, style:{ padding:'12px 6px', borderRadius:14, background:'var(--s2)', border:'1px solid var(--b1)', textAlign:'center' } },
            _h('div', { style:{ fontSize:14, fontWeight:800, color:s.c } }, s.v),
            _h('div', { style:{ fontSize:8.5, color:'var(--t3)', marginTop:3 } }, s.l)
          );
        })
      ),

      // ── KONTO ─────────────────────────────────────────────────────────
      auth && auth.available && _h('div', { style:{ display:'flex', alignItems:'center', gap:12, padding:'12px 14px', borderRadius:16, background:'var(--s2)', border:'1px solid var(--b1)', marginBottom:20 } },
        _h('div', { style:{ width:36, height:36, borderRadius:'50%', flexShrink:0, background: auth.status==='authed' ? 'var(--a-dim)' : 'var(--s3)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:14 } }, '👤'),
        _h('div', { style:{ flex:1, minWidth:0 } },
          _h('div', { style:{ fontSize:12.5, fontWeight:700, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' } },
            auth.status==='authed' ? (auth.profile && auth.profile.email) : 'Tryb offline'),
          _h('div', { style:{ fontSize:10.5, color:'var(--t3)', marginTop:2 } }, auth.status==='authed' ? 'Zsynchronizowano' : 'Dane tylko na tym urządzeniu')
        ),
        auth.status==='authed'
          ? _h('button', { onClick:auth.signOut, style:{ padding:'6px 12px', borderRadius:100, border:'1px solid var(--b2)', background:'none', color:'var(--t2)', fontSize:11, fontWeight:700, cursor:'pointer' } }, 'Wyloguj')
          : _h('button', { onClick:auth.loginFromSettings, style:{ padding:'6px 12px', borderRadius:100, border:'none', background:'var(--a-light)', color:'var(--bg)', fontSize:11, fontWeight:700, cursor:'pointer' } }, 'Zaloguj')
      ),

      // ── USTAWIENIA (lista z chevronami) ───────────────────────────────
      _h('div', { style:{ marginBottom:20 } },
        _h('div', { style:{ fontSize:10, fontWeight:800, letterSpacing:'.1em', color:'var(--t3)', textTransform:'uppercase', marginBottom:10 } }, 'Ustawienia'),
        _h('div', { style:{ borderRadius:18, background:'var(--s2)', border:'1px solid var(--b1)', overflow:'hidden' } },
          SETTINGS_ROWS.map(function(row, i) {
            return _h('div', { key:row.id, onClick:function(){ row.id==='danger' ? clearAll() : setOpenPanel(openPanel===row.id?null:row.id); },
              style:{ display:'flex', alignItems:'center', gap:12, padding:'13px 14px', cursor:'pointer',
                borderBottom: i < SETTINGS_ROWS.length-1 ? '1px solid rgba(255,255,255,.05)' : 'none' } },
              _h('span', { style:{ fontSize:16, flexShrink:0 } }, row.icon),
              _h('div', { style:{ flex:1, minWidth:0 } },
                _h('div', { style:{ fontSize:13, fontWeight:600, color: row.danger?'var(--red)':'var(--t1)' } }, row.label),
                _h('div', { style:{ fontSize:10.5, color:'var(--t3)', marginTop:1 } }, row.sub)
              ),
              row.id!=='danger' && _h('span', { style:{ color:'var(--t3)', fontSize:13, transform: openPanel===row.id ? 'rotate(90deg)' : 'none', transition:'transform .15s' } }, '›')
            );
          })
        )
      ),

      openPanel === 'edit' && _h('div', { className:'card', style:{ marginBottom:14 } },
        _h('div', { className:'grid-2' },
          _h('div', { className:'field' }, _h('label', null, 'Imię'), _h('input', { type:'text', value:f.name||'', onChange:function(e){ upF('name',e.target.value); } })),
          _h('div', { className:'field' }, _h('label', null, 'Wiek'), _h('input', { type:'number', min:1, max:120, value:f.age||'', onChange:function(e){ upF('age',+e.target.value); } })),
          _h('div', { className:'field' }, _h('label', null, 'Waga (kg)'), _h('input', { type:'number', step:0.1, value:f.weight||'', onChange:function(e){ upF('weight',+e.target.value); } })),
          _h('div', { className:'field' }, _h('label', null, 'Wzrost (cm)'), _h('input', { type:'number', value:f.height||'', onChange:function(e){ upF('height',+e.target.value); } }))
        ),
        _h('div', { className:'field' }, _h('label', null, 'Płeć'),
          _h('select', { value:f.gender||'male', onChange:function(e){ upF('gender',e.target.value); } },
            _h('option', { value:'male' }, 'Mężczyzna'), _h('option', { value:'female' }, 'Kobieta'))),
        _h('div', { className:'field' }, _h('label', null, 'Dyscyplina / sport'), _h('input', { type:'text', value:f.sport||'', onChange:function(e){ upF('sport',e.target.value); } })),
        _h('button', { className:'btn btn-primary', style:{ width:'100%' }, onClick:save }, 'Zapisz')
      ),

      openPanel === 'health' && _h('div', { className:'card', style:{ marginBottom:14 } },
        _h('p', { style:{ fontSize:'.8rem', color:'var(--t3)', marginBottom:12, lineHeight:1.6 } }, 'Importuje biegi z Apple Health (tylko iPhone, HealthKit).'),
        _h('button', { className:'btn btn-secondary', style:{ width:'100%' }, onClick:function(){ ET.connectAppleHealth && ET.connectAppleHealth(update, toast); } }, '🍎 Połącz z Apple Health')
      ),

      openPanel === 'export' && _h('div', { className:'card', style:{ marginBottom:14 } },
        _h('p', { style:{ fontSize:'.8rem', color:'var(--t3)', marginBottom:12, lineHeight:1.6 } }, 'Eksportuje dane z ostatnich 30 dni do pliku JSON — wklej do dowolnego modelu AI po analizę.'),
        _h('button', { className:'btn', style:{ width:'100%', background:'linear-gradient(135deg,var(--purple),var(--a))', color:'#fff', border:'none' },
          onClick:function(){ ET.exportAI(store); toast('Eksport AI gotowy! ✓','success'); } }, '🤖 Eksport AI — 30 dni')
      ),

      openPanel === 'settings' && _h('div', { className:'card', style:{ marginBottom:14 } },
        _h('p', { style:{ fontSize:'.78rem', color:'var(--t3)', marginBottom:10 } }, 'Pełny edytor widgetów i menu — na razie dostępny w klasycznym widoku Profilu (web) lub w Ustawieniach po dalszej rozbudowie tego ekranu.'),
        isAdmin && ET.AdminPanel && _h(ET.AdminPanel, null)
      ),

      _h('div', { onClick:handleVersionTap, style:{ textAlign:'center', padding:'20px 0 8px', color:'var(--t3)', fontSize:10, userSelect:'none', letterSpacing:'.04em' } },
        'EasyTraining v1.0.0',
        _h('div', { style:{ marginTop:3, fontFamily:'monospace', fontSize:9, opacity:.75 } }, 'build ' + (window.ET_BUILD || 'dev')),
        tapCount > 0 && _h('span', { style:{ color:'var(--a)', marginLeft:6, fontWeight:700 } }, '['+tapCount+'/10]')
      )
    );
  }

  ET.ProfileModule = ProfileModule;
})();
