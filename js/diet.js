(function() {
  'use strict';
  window.ET = window.ET || {};
  var _h = React.createElement;

  function DietModule() {
    var su = ET.useStore(); var store = su.store, update = su.update;
    var toast = ET.useToast();
    var sa = React.useState(false); var showAdd = sa[0], setShowAdd = sa[1];
    var fs = React.useState({ date:ET.dstr(), kcal:2000, protein:150, carbs:200, fat:70, water:2.5 });
    var f = fs[0], setF = fs[1];
    function upF(key, val) { setF(function(prev){ var o={}; o[key]=val; return Object.assign({},prev,o); }); }

    var p = store.profile;
    var targetKcal=2000, targetProtein=120, targetCarbs=200, targetFat=66;
    if (p.weight && p.height && p.age) {
      var bmr = 10*p.weight + 6.25*p.height - 5*p.age + (p.gender==='female'?-161:5);
      var mult = { sedentary:1.2, light:1.375, moderate:1.55, active:1.725, very_active:1.9 }[p.activityLevel]||1.55;
      targetKcal = Math.round(bmr*mult);
      targetProtein = Math.round(p.weight*1.8);
      targetCarbs = Math.round(targetKcal*.4/4);
      targetFat = Math.round(targetKcal*.3/9);
    }

    var today = (store.dietEntries||[]).find(function(e){ return e.date===ET.dstr(); });
    var entries = store.dietEntries||[];

    function save() {
      update(function(s){ return Object.assign({},s,{ dietEntries:[Object.assign({id:Date.now()},f)].concat((s.dietEntries||[]).filter(function(e){ return e.date!==f.date; })) }); });
      toast('Dieta zapisana ✓', 'success'); setShowAdd(false);
    }

    var MACROS = [
      { k:'kcal', l:'Kalorie', u:'kcal', min:500, max:6000, step:50, c:'var(--a-light)', t:targetKcal },
      { k:'protein', l:'Białko', u:'g', min:0, max:400, step:5, c:'var(--green)', t:targetProtein },
      { k:'carbs', l:'Węglowodany', u:'g', min:0, max:700, step:5, c:'var(--yellow)', t:targetCarbs },
      { k:'fat', l:'Tłuszcze', u:'g', min:0, max:300, step:5, c:'var(--orange)', t:targetFat },
    ];

    return _h('div', { className:'fade-in' },
      _h('div', { className:'page-hdr' },
        _h('div', null,
          _h('h1', null, 'Dieta'),
          _h('p', null, 'Cel: '+targetKcal+' kcal · '+targetProtein+'g białka')
        ),
        _h('button', { className:'btn btn-primary', onClick:function(){ setShowAdd(true); } }, '+ Wpis')
      ),

      _h('div', { className:'card card-accent', style:{ marginBottom:14 } },
        _h('div', { style:{ fontSize:'.65rem', color:'var(--t3)', fontWeight:700, textTransform:'uppercase', letterSpacing:'.08em', marginBottom:12 } }, 'Cel dzienny (Mifflin-St Jeor)'),
        _h('div', { className:'grid-4', style:{ gap:8 } },
          MACROS.map(function(m) {
            return _h('div', { key:m.k, style:{ textAlign:'center' } },
              _h('div', { style:{ fontSize:'1rem', fontWeight:700, color:m.c } }, m.t, _h('span', { style:{ fontSize:'.62rem', color:'var(--t3)' } }, m.u)),
              _h('div', { style:{ fontSize:'.62rem', color:'var(--t3)' } }, m.l)
            );
          })
        ),
        !p.weight && _h('div', { style:{ marginTop:10, fontSize:'.72rem', color:'var(--yellow)', display:'flex', alignItems:'center', gap:6 } },
          '⚠ Uzupełnij Profil (waga, wzrost, wiek) dla dokładnego wyliczenia'
        )
      ),

      today && _h('div', { className:'card', style:{ marginBottom:14 } },
        _h('div', { style:{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 } },
          _h('div', { style:{ fontSize:'.8rem', fontWeight:700, color:'var(--green)' } }, '✓ Wpis na dzisiaj'),
          _h('div', { style:{ fontSize:'.72rem', color:'var(--t3)' } }, ET.fmtDateShort(today.date))
        ),
        _h('div', { className:'grid-4', style:{ gap:8, marginBottom:12 } },
          MACROS.map(function(m) {
            return _h('div', { key:m.k, style:{ textAlign:'center' } },
              _h('div', { style:{ fontWeight:700, fontSize:'.95rem', color:m.c } }, today[m.k], _h('span', { style:{ fontSize:'.6rem', color:'var(--t3)' } }, m.u)),
              _h('div', { style:{ fontSize:'.6rem', color:'var(--t3)', marginBottom:4 } }, m.l),
              _h(ET.ProgressBar, { value:today[m.k]/m.t*100, color:m.c, height:3 })
            );
          })
        ),
        today.water && _h('div', { style:{ fontSize:'.78rem', color:'var(--teal)' } }, '💧 Woda: '+today.water+'L')
      ),

      entries.length===0 && _h(ET.Placeholder, { icon:'🥗', title:'Brak wpisów diety', desc:'Śledź kalorie i makroskładniki każdego dnia.' }),

      entries.map(function(e) {
        return _h('div', { key:e.id, className:'card card-sm', style:{ marginBottom:6 } },
          _h('div', { style:{ display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:6 } },
            _h('div', { style:{ fontSize:'.78rem', fontWeight:600 } }, ET.fmtDateShort(e.date)),
            _h('div', { style:{ display:'flex', gap:5, flexWrap:'wrap' } },
              _h('span', { className:'badge badge-blue' }, e.kcal+' kcal'),
              _h('span', { className:'badge badge-green' }, e.protein+'g B'),
              _h('span', { className:'badge badge-yellow' }, e.carbs+'g W'),
              _h('span', { className:'badge badge-orange' }, e.fat+'g T'),
              e.water && _h('span', { className:'badge badge-teal' }, '💧'+e.water+'L')
            )
          )
        );
      }),

      _h(ET.Sheet, { open:showAdd, onClose:function(){ setShowAdd(false); }, title:'Wpis diety' },
        _h('div', { className:'field' }, _h('label', null, 'Data'), _h('input', { type:'date', value:f.date, onChange:function(e){ upF('date',e.target.value); } })),
        MACROS.map(function(m) {
          return _h('div', { key:m.k, className:'field' },
            _h('label', { style:{ display:'flex', justifyContent:'space-between' } },
              _h('span', null, m.l),
              _h('span', { style:{ color:m.c, fontWeight:700 } }, f[m.k]+' '+m.u)
            ),
            _h('div', { className:'slider-wrap' }, _h('input', { type:'range', min:m.min, max:m.max, step:m.step, value:f[m.k], onChange:function(e){ upF(m.k,+e.target.value); } }))
          );
        }),
        _h('div', { className:'field' },
          _h('label', { style:{ display:'flex', justifyContent:'space-between' } },
            _h('span', null, '💧 Woda (L)'),
            _h('span', { style:{ color:'var(--teal)', fontWeight:700 } }, f.water+'L')
          ),
          _h('div', { className:'slider-wrap' }, _h('input', { type:'range', min:0, max:5, step:0.25, value:f.water, onChange:function(e){ upF('water',+e.target.value); } }))
        ),
        _h('button', { className:'btn btn-primary', style:{ width:'100%', marginTop:4 }, onClick:save }, 'Zapisz')
      )
    );
  }

  ET.DietModule = DietModule;
})();
