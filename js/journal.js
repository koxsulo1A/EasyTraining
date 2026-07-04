(function() {
  'use strict';
  window.ET = window.ET || {};
  var _h = React.createElement;

  var MOODS = ['😡','😞','😐','🙂','😄'];
  var MOOD_LABELS = ['Fatalnie','Słabo','Neutralnie','Dobrze','Świetnie'];
  var TAGS = ['Siłowy','Bieganie','Sauna','Cardio','Mobilność','Regeneracja','Dieta','Sen','Cel','Refleksja'];

  function JournalModule() {
    var su = ET.useStore(); var store = su.store, update = su.update;
    var toast = ET.useToast();

    var sa = React.useState(false); var showAdd = sa[0], setShowAdd = sa[1];
    var sv = React.useState(null); var viewEntry = sv[0], setViewEntry = sv[1];

    var fe = React.useState({ date:ET.dstr(), title:'', body:'', mood:3, tags:[], energy:3 });
    var f = fe[0], setF = fe[1];
    function upF(k,v){ setF(function(p){ var o={}; o[k]=v; return Object.assign({},p,o); }); }
    function toggleTag(t){ upF('tags', f.tags.includes(t) ? f.tags.filter(function(x){ return x!==t; }) : f.tags.concat([t])); }

    function openAdd() {
      setF({ date:ET.dstr(), title:'', body:'', mood:3, tags:[], energy:3 });
      setShowAdd(true);
    }

    function save() {
      if (!f.body.trim()) { toast('Napisz coś w dzienniku', 'error'); return; }
      var entry = Object.assign({ id:Date.now() }, f);
      update(function(s){ return Object.assign({},s,{ journalEntries:[entry].concat(s.journalEntries||[]) }); });
      toast('Wpis zapisany ✓', 'success');
      setShowAdd(false);
    }

    var entries = store.journalEntries || [];

    // "Coming Soon" overlay — unlocked by clicking the text 10 times
    var unlocked = !!store.journalUnlocked;
    var cc = React.useState(0); var csClicks = cc[0], setCsClicks = cc[1];
    function tapComingSoon() {
      var n = csClicks + 1;
      if (n >= 10) {
        update(function(s){ return Object.assign({},s,{ journalUnlocked:true }); });
        toast('Dziennik odblokowany 🎉', 'success');
      }
      setCsClicks(n);
    }
    function withOverlay(content) {
      if (unlocked) return content;
      return _h('div', { style:{ position:'relative', minHeight:'70vh' } },
        content,
        _h('div', { style:{ position:'absolute', inset:0, zIndex:30,
          background:'rgba(8,8,16,.55)', backdropFilter:'blur(2px)', WebkitBackdropFilter:'blur(2px)',
          borderRadius:'var(--r2)', display:'flex', flexDirection:'column',
          alignItems:'center', justifyContent:'center', gap:8 } },
          _h('div', {
            style:{ fontSize:'1.6rem', fontWeight:800, color:'var(--t1)', letterSpacing:'.04em',
              cursor:'pointer', userSelect:'none', padding:'10px 24px' },
            onClick:tapComingSoon
          }, 'Coming Soon'),
          csClicks >= 3 && _h('div', { style:{ fontSize:'.7rem', color:'var(--t3)' } }, csClicks+'/10')
        )
      );
    }

    if (viewEntry) {
      var e = viewEntry;
      return _h('div', { className:'fade-in' },
        _h('div', { style:{ display:'flex', alignItems:'center', gap:10, marginBottom:20 } },
          _h('button', { className:'btn btn-ghost btn-sm btn-icon', onClick:function(){ setViewEntry(null); } }, '←'),
          _h('div', null,
            _h('h1', { style:{ fontSize:'1.1rem', fontWeight:700 } }, e.title || 'Wpis z ' + ET.fmtDate(e.date)),
            _h('div', { style:{ fontSize:'.72rem', color:'var(--t3)', marginTop:2 } }, ET.fmtDate(e.date) + ' · ' + MOODS[e.mood-1] + ' ' + MOOD_LABELS[e.mood-1])
          )
        ),
        e.tags && e.tags.length>0 && _h('div', { style:{ display:'flex', gap:5, flexWrap:'wrap', marginBottom:14 } },
          e.tags.map(function(t){ return _h('div', { key:t, className:'badge badge-teal' }, t); })
        ),
        _h('div', { className:'card' },
          _h('div', { style:{ fontSize:'.9rem', lineHeight:1.7, color:'var(--t1)', whiteSpace:'pre-wrap' } }, e.body)
        )
      );
    }

    return withOverlay(_h('div', { className:'fade-in' },
      _h('div', { className:'page-hdr' },
        _h('div', null,
          _h('h1', null, '📓 Dziennik'),
          _h('p', null, entries.length + ' wpisów')
        ),
        _h('button', { className:'btn btn-primary', onClick:openAdd }, '+ Nowy wpis')
      ),

      entries.length === 0
        ? _h(ET.Placeholder, { icon:'📓', title:'Brak wpisów', desc:'Prowadź dziennik treningowy — zapisuj cele, refleksje i postępy.' })
        : entries.map(function(e) {
            var preview = (e.body || '').slice(0, 120) + (e.body && e.body.length > 120 ? '...' : '');
            return _h('div', { key:e.id, className:'card card-interactive', style:{ marginBottom:8, cursor:'pointer' }, onClick:function(){ setViewEntry(e); } },
              _h('div', { style:{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:8, marginBottom:6 } },
                _h('div', { style:{ fontWeight:700, fontSize:'.9rem', flex:1 } }, e.title || 'Wpis z ' + ET.fmtDate(e.date)),
                _h('span', { style:{ fontSize:'1.1rem', flexShrink:0 } }, MOODS[(e.mood||3)-1])
              ),
              _h('div', { style:{ fontSize:'.72rem', color:'var(--t3)', marginBottom:6 } }, ET.fmtDate(e.date)),
              preview && _h('div', { style:{ fontSize:'.8rem', color:'var(--t2)', lineHeight:1.5, marginBottom:6 } }, preview),
              e.tags && e.tags.length>0 && _h('div', { style:{ display:'flex', gap:4, flexWrap:'wrap' } },
                e.tags.map(function(t){ return _h('div', { key:t, className:'badge badge-teal' }, t); })
              )
            );
          }),

      _h(ET.Sheet, { open:showAdd, onClose:function(){ setShowAdd(false); }, title:'Nowy wpis' },
        _h('div', { className:'field' },
          _h('label', null, 'Tytuł (opcjonalny)'),
          _h('input', { type:'text', placeholder:'np. Rekord na ławce!', value:f.title, onChange:function(e){ upF('title',e.target.value); } })
        ),
        _h('div', { className:'field' }, _h('label', null, 'Data'), _h('input', { type:'date', value:f.date, onChange:function(e){ upF('date',e.target.value); } })),

        _h('div', { className:'field' },
          _h('label', null, 'Nastrój'),
          _h('div', { style:{ display:'flex', gap:8, justifyContent:'space-between' } },
            MOODS.map(function(m, i) {
              var active = f.mood === (i+1);
              return _h('button', { key:i,
                style:{ flex:1, fontSize:'1.4rem', padding:'8px 4px', borderRadius:'var(--r2)', border:'1px solid '+(active?'var(--a)':'var(--b1)'), background:active?'var(--a-dim)':'var(--s3)', cursor:'pointer', transition:'all .15s' },
                onClick:function(){ upF('mood',i+1); }
              }, m);
            })
          ),
          _h('div', { style:{ textAlign:'center', fontSize:'.7rem', color:'var(--t3)', marginTop:4 } }, MOOD_LABELS[f.mood-1])
        ),

        _h('div', { className:'field' },
          _h('label', null, 'Tagi'),
          _h('div', { style:{ display:'flex', gap:5, flexWrap:'wrap' } },
            TAGS.map(function(t) {
              return _h('button', { key:t, className:'tag-btn'+(f.tags.includes(t)?' active':''), onClick:function(){ toggleTag(t); } }, t);
            })
          )
        ),

        _h('div', { className:'field' },
          _h('label', null, 'Treść *'),
          _h('textarea', { value:f.body, onChange:function(e){ upF('body',e.target.value); }, placeholder:'Co dzisiaj osiągnąłeś? Jak się czułeś? Jakie masz refleksje?', rows:6, style:{ minHeight:140 } })
        ),

        _h('button', { className:'btn btn-primary', style:{ width:'100%' }, onClick:save }, 'Zapisz wpis')
      )
    ));
  }

  ET.JournalModule = JournalModule;
})();
