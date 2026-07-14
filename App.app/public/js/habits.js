(function() {
  'use strict';
  window.ET = window.ET || {};
  var _h = React.createElement;

  var DEFAULT_HABITS = [
    { id:'h1', name:'Nawodnienie 2L', icon:'💧', color:'var(--teal)', cat:'Zdrowie' },
    { id:'h2', name:'Trening', icon:'💪', color:'var(--a)', cat:'Trening' },
    { id:'h3', name:'Rozciąganie 10min', icon:'🧘', color:'var(--purple)', cat:'Trening' },
    { id:'h4', name:'Sen 7h+', icon:'😴', color:'var(--blue)', cat:'Regeneracja' },
    { id:'h5', name:'Bez alkoholu', icon:'🚫', color:'var(--red)', cat:'Zdrowie' },
    { id:'h6', name:'Kroki 8000+', icon:'🚶', color:'var(--green)', cat:'Aktywność' },
  ];

  function todayKey() { return ET.dstr(); }

  function getLast7Days() {
    var days = [];
    for (var i=6; i>=0; i--) {
      var d = new Date(); d.setDate(d.getDate()-i);
      days.push(d.toISOString().slice(0,10));
    }
    return days;
  }

  function HabitsModule() {
    var su = ET.useStore(); var store = su.store, update = su.update;
    var toast = ET.useToast();

    var sa = React.useState(false); var showAdd = sa[0], setShowAdd = sa[1];
    var nf = React.useState({ name:'', icon:'⭐', color:'var(--a)', cat:'Inne' });
    var newHabit = nf[0], setNewHabit = nf[1];

    var habits = store.habits && store.habits.length > 0 ? store.habits : DEFAULT_HABITS;
    var logs = store.habitLogs || {};
    var today = todayKey();
    var last7 = getLast7Days();

    function toggle(habitId, dateKey) {
      var dk = dateKey || today;
      var dayLogs = logs[dk] || {};
      var newDayLogs = Object.assign({}, dayLogs);
      if (newDayLogs[habitId]) {
        delete newDayLogs[habitId];
      } else {
        newDayLogs[habitId] = true;
      }
      var newLogs = Object.assign({}, logs);
      newLogs[dk] = newDayLogs;
      update(function(s){ return Object.assign({},s,{ habitLogs:newLogs }); });
    }

    function addHabit() {
      if (!newHabit.name.trim()) { toast('Podaj nazwę nawyku', 'error'); return; }
      var h = Object.assign({ id:'h'+Date.now() }, newHabit);
      var newHabits = habits.concat([h]);
      update(function(s){ return Object.assign({},s,{ habits:newHabits }); });
      toast('Nawyk dodany ✓', 'success');
      setShowAdd(false);
      setNewHabit({ name:'', icon:'⭐', color:'var(--a)', cat:'Inne' });
    }

    function removeHabit(id) {
      var newHabits = habits.filter(function(h){ return h.id!==id; });
      update(function(s){ return Object.assign({},s,{ habits:newHabits }); });
    }

    var todayLogs = logs[today] || {};
    var todayDone = habits.filter(function(h){ return todayLogs[h.id]; }).length;
    var streak = (function(){
      var s = 0;
      var d = new Date();
      while (true) {
        var key = d.toISOString().slice(0,10);
        var dayL = logs[key] || {};
        if (Object.keys(dayL).length === 0 && key !== today) break;
        if (habits.some(function(h){ return dayL[h.id]; })) s++;
        else break;
        d.setDate(d.getDate()-1);
      }
      return s;
    })();

    var ICONS = ['⭐','🏃','💪','💧','🧘','😴','🥗','📚','🚶','🎯','🧠','✅','🔥','🌞','🎵'];
    var COLORS = ['var(--a)','var(--green)','var(--teal)','var(--purple)','var(--orange)','var(--red)','var(--yellow)','var(--blue)','var(--pink)'];

    return _h('div', { className:'fade-in' },
      _h('div', { className:'page-hdr' },
        _h('div', null,
          _h('h1', null, '✅ Nawyki'),
          _h('p', null, todayDone + '/' + habits.length + ' dziś · ' + streak + ' dni z rzędu')
        ),
        _h('button', { className:'btn btn-primary', onClick:function(){ setShowAdd(true); } }, '+ Nawyk')
      ),

      _h('div', { className:'grid-3', style:{ marginBottom:16, gap:8 } },
        _h(ET.StatCard, { label:'Dziś', value:todayDone+'/'+habits.length, color:'var(--a)' }),
        _h(ET.StatCard, { label:'Seria', value:streak+' dni', color:'var(--green)' }),
        _h(ET.StatCard, { label:'Nawyki', value:habits.length, color:'var(--teal)' })
      ),

      // DZISIEJSZE NAWYKI
      _h('div', { className:'card', style:{ marginBottom:14 } },
        _h('div', { style:{ fontWeight:700, fontSize:'.88rem', color:'var(--t2)', marginBottom:12 } }, '📅 Dzisiaj'),
        _h(ET.ProgressBar, { value: habits.length ? todayDone/habits.length*100 : 0 }),
        _h('div', { style:{ marginTop:12 } },
          habits.map(function(h) {
            var done = !!todayLogs[h.id];
            return _h('div', { key:h.id,
              style:{ display:'flex', alignItems:'center', gap:12, padding:'10px 0', borderBottom:'1px solid var(--b1)', cursor:'pointer', transition:'opacity .15s', opacity: done ? 0.6 : 1 },
              onClick:function(){ toggle(h.id); }
            },
              _h('div', { style:{ width:36, height:36, borderRadius:'50%', background: done ? h.color : 'var(--s3)', border:'2px solid '+(done?h.color:'var(--b1)'), display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1rem', flexShrink:0, transition:'all .2s' } },
                done ? '✓' : h.icon
              ),
              _h('div', { style:{ flex:1 } },
                _h('div', { style:{ fontWeight:600, fontSize:'.88rem', textDecoration: done?'line-through':'none', color: done?'var(--t3)':'var(--t1)' } }, h.name),
                _h('div', { style:{ fontSize:'.65rem', color:'var(--t3)', marginTop:1 } }, h.cat)
              ),
              _h('button', { className:'btn btn-ghost btn-sm btn-icon', style:{ color:'var(--t3)', fontSize:'.7rem' },
                onClick:function(e){ e.stopPropagation(); removeHabit(h.id); }
              }, '✕')
            );
          })
        )
      ),

      // HISTORIA 7 DNI
      _h('div', { className:'card' },
        _h('div', { style:{ fontWeight:700, fontSize:'.88rem', color:'var(--t2)', marginBottom:12 } }, '📊 Ostatnie 7 dni'),
        _h('div', { style:{ overflowX:'auto' } },
          _h('table', { style:{ width:'100%', borderCollapse:'collapse', fontSize:'.72rem' } },
            _h('thead', null,
              _h('tr', null,
                _h('th', { style:{ textAlign:'left', padding:'4px 6px', color:'var(--t3)', fontWeight:600, minWidth:100 } }, 'Nawyk'),
                last7.map(function(d) {
                  var label = d === today ? 'Dziś' : new Date(d+'T12:00:00').toLocaleDateString('pl',{weekday:'short'});
                  return _h('th', { key:d, style:{ textAlign:'center', padding:'4px 4px', color: d===today?'var(--a-light)':'var(--t3)', fontWeight: d===today?700:400 } }, label);
                })
              )
            ),
            _h('tbody', null,
              habits.map(function(h) {
                return _h('tr', { key:h.id },
                  _h('td', { style:{ padding:'6px', display:'flex', alignItems:'center', gap:6 } },
                    _h('span', { style:{ fontSize:'.9rem' } }, h.icon),
                    _h('span', { style:{ color:'var(--t1)' } }, h.name)
                  ),
                  last7.map(function(d) {
                    var done = !!(logs[d] && logs[d][h.id]);
                    return _h('td', { key:d, style:{ textAlign:'center', padding:'6px 4px', cursor:'pointer' },
                      onClick:function(){ toggle(h.id, d); }
                    },
                      _h('div', { style:{ width:22, height:22, borderRadius:'50%', margin:'0 auto', background:done?h.color:'var(--s3)', border:'1.5px solid '+(done?h.color:'var(--b1)'), display:'flex', alignItems:'center', justifyContent:'center', fontSize:'.7rem', color:'var(--bg)', transition:'all .2s' } },
                        done ? '✓' : ''
                      )
                    );
                  })
                );
              })
            )
          )
        )
      ),

      _h(ET.Sheet, { open:showAdd, onClose:function(){ setShowAdd(false); }, title:'Nowy nawyk' },
        _h('div', { className:'field' },
          _h('label', null, 'Nazwa nawyku *'),
          _h('input', { type:'text', placeholder:'np. Medytacja 10 min', value:newHabit.name, onChange:function(e){ setNewHabit(Object.assign({},newHabit,{name:e.target.value})); } })
        ),
        _h('div', { className:'field' },
          _h('label', null, 'Ikona'),
          _h('div', { style:{ display:'flex', gap:6, flexWrap:'wrap' } },
            ICONS.map(function(ic) {
              return _h('button', { key:ic,
                style:{ width:36, height:36, borderRadius:'var(--r2)', border:'1px solid '+(newHabit.icon===ic?'var(--a)':'var(--b1)'), background:newHabit.icon===ic?'var(--a-dim)':'var(--s3)', fontSize:'1rem', cursor:'pointer' },
                onClick:function(){ setNewHabit(Object.assign({},newHabit,{icon:ic})); }
              }, ic);
            })
          )
        ),
        _h('div', { className:'field' },
          _h('label', null, 'Kolor'),
          _h('div', { style:{ display:'flex', gap:6, flexWrap:'wrap' } },
            COLORS.map(function(c) {
              return _h('button', { key:c,
                style:{ width:28, height:28, borderRadius:'50%', background:c, border: newHabit.color===c?'3px solid var(--t1)':'2px solid transparent', cursor:'pointer' },
                onClick:function(){ setNewHabit(Object.assign({},newHabit,{color:c})); }
              });
            })
          )
        ),
        _h('div', { className:'field' },
          _h('label', null, 'Kategoria'),
          _h('input', { type:'text', placeholder:'np. Zdrowie, Trening, Sen...', value:newHabit.cat, onChange:function(e){ setNewHabit(Object.assign({},newHabit,{cat:e.target.value})); } })
        ),
        _h('button', { className:'btn btn-primary', style:{ width:'100%' }, onClick:addHabit }, 'Dodaj nawyk')
      )
    );
  }

  ET.HabitsModule = HabitsModule;
})();
