(function() {
  'use strict';
  window.ET = window.ET || {};
  var _h = React.createElement;

  function ProfileModule() {
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

    function save() {
      update(function(s){ return Object.assign({},s,{ profile:Object.assign({},f) }); });
      toast('Profil zapisany ✓', 'success');
    }

    function clearAll() {
      if (!confirm('Czy na pewno chcesz usunąć WSZYSTKIE dane? Tej operacji nie można cofnąć!')) return;
      localStorage.removeItem('et_v1');
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

      _h('div', { onClick:handleVersionTap, style:{ textAlign:'center', padding:'20px 0 8px', color:'var(--t3)', fontSize:'.62rem', userSelect:'none', cursor:'default', letterSpacing:'.04em' } },
        'EasyTraining v1.0.0',
        tapCount > 0 && _h('span', { style:{ color:'var(--a)', marginLeft:6, fontWeight:700 } }, '['+tapCount+'/10]')
      )
    );
  }

  ET.ProfileModule = ProfileModule;
})();
