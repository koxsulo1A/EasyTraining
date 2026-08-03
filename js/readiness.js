(function() {
  'use strict';
  window.ET = window.ET || {};
  var _h = React.createElement;

  // ══════════════════════════════════════════════════════════════════════
  // GOTOWOŚĆ — ekran „Gotowość" (WEB), design „EasyTraining Aplikacja".
  // Spec: docs/segment-02-samopoczucie.md w projekcie designu. Wynik dnia,
  // check-in poranny, log snu, gotowość przed treningiem, trendy 7-dniowe.
  //
  // Klucz dnia: ET.dstr() — celowo NIE lokalny helper jak w dashboard.js/
  // plan.js, bo wellbeingEntries/sleepSessions są już zapisywane tym
  // kluczem gdzie indziej w aplikacji (np. DailyWellbeingCheck w app.js).
  // Użycie innego klucza tutaj rozjechałoby wpisy z tej samej doby.
  // Znany bug UTC w dstr() (components.js:7) zgłoszony osobno.
  // ══════════════════════════════════════════════════════════════════════

  var DOW = ['Nd','Pn','Wt','Śr','Cz','Pt','So'];
  var SECTION_LABEL = { fontSize:9, fontWeight:800, lineHeight:1, letterSpacing:'.14em', color:'var(--t3)' };

  var CHECKIN_FIELDS = [
    { key:'energy',     label:'Energia' },
    { key:'mood',       label:'Nastrój' },
    { key:'stress',     label:'Stres' },
    { key:'motivation', label:'Motywacja' },
  ];
  var FACES = ['😞','😕','😐','🙂','😄'];

  var PRE_FIELDS = [
    { key:'willingness', label:'Chęć', opts:['Bez chęci','Ujdzie','Pełna!'] },
    { key:'state',       label:'Samopoczucie', opts:['Słabo','Normalnie','Świetnie'] },
    { key:'fatigue',     label:'Zmęczenie', opts:['Bardzo','Średnie','Brak'] },
  ];

  function todayCheckin(store) {
    return (store.wellbeingEntries || []).find(function(e){ return e.date === ET.dstr() && !e.tag; }) || null;
  }
  function todaySleep(store) {
    return (store.sleepSessions || []).find(function(e){ return e.date === ET.dstr(); }) || null;
  }

  // Wynik gotowości dnia — średnia dostępnych składników (spec §3). Brak obu
  // źródeł (sen + check-in) → null, nigdy 0 (nie fałszujemy wyniku).
  function computeReadiness(store) {
    var ci = todayCheckin(store), sl = todaySleep(store);
    var comps = [];
    if (sl) {
      comps.push({ key:'sleep',   label:'SEN',        val:sl.duration.toFixed(1)+'h', w:Math.min(1, sl.duration/8), color:'var(--purple)' });
      comps.push({ key:'quality', label:'JAKOŚĆ SNU',  val:sl.quality+'/10',           w:sl.quality/10,               color:'var(--purple)' });
    }
    if (ci) {
      comps.push({ key:'energy',     label:'ENERGIA',    val:ci.energy+'/10',           w:ci.energy/10,             color:'var(--yellow)' });
      comps.push({ key:'calm',       label:'SPOKÓJ',     val:(10-ci.stress)+'/10',      w:(10-ci.stress)/10,        color:'var(--teal)' });
      comps.push({ key:'motivation', label:'MOTYWACJA',  val:ci.motivation+'/10',       w:ci.motivation/10,         color:'var(--orange)' });
      comps.push({ key:'mood',       label:'NASTRÓJ',    val:ci.mood+'/10',             w:ci.mood/10,               color:'var(--green)' });
    }
    if (!comps.length) return { score:null, comps:[] };
    var avg = comps.reduce(function(a,c){ return a+c.w; }, 0) / comps.length;
    return { score:Math.max(0, Math.min(100, Math.round(avg*100))), comps:comps };
  }

  function stepBtn(onClick, glyph) {
    return _h('div', { onClick:onClick, style:{ width:26, height:26, borderRadius:9, background:'rgba(255,255,255,.05)', border:'1px solid rgba(255,255,255,.10)', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:'var(--t2)', fontSize:13, fontWeight:800, userSelect:'none' } }, glyph);
  }
  function dotsRow(value, max, onSet, color) {
    var arr = []; for (var i=1;i<=max;i++) arr.push(i);
    return _h('div', { style:{ display:'flex', gap:4 } },
      arr.map(function(i) {
        var on = i <= (value||0);
        return _h('div', { key:i, onClick:function(){ onSet(i); }, style:{ flex:1, height:28, borderRadius:8, cursor:'pointer',
          background: on ? 'color-mix(in srgb,'+color+' 55%, transparent)' : 'rgba(255,255,255,.05)',
          border:'1px solid ' + (on ? 'color-mix(in srgb,'+color+' 70%, transparent)' : 'rgba(255,255,255,.09)'),
          transition:'background .18s' } });
      })
    );
  }

  function ReadinessModule() {
    var su = ET.useStore(); var store = su.store, update = su.update;

    var cs = React.useState('dots'); var checkinStyle = cs[0], setCheckinStyle = cs[1];

    var ci = todayCheckin(store);
    var sl = todaySleep(store);
    var readiness = computeReadiness(store);

    function upsertCheckin(patch) {
      update(function(s) {
        var list = s.wellbeingEntries || [];
        var existing = list.find(function(e){ return e.date === ET.dstr() && !e.tag; });
        var next;
        if (existing) {
          next = list.map(function(e){ return e === existing ? Object.assign({}, e, patch) : e; });
        } else {
          next = [Object.assign({ id:Date.now(), date:ET.dstr(), energy:5, mood:5, stress:5, motivation:5 }, patch)].concat(list);
        }
        return Object.assign({}, s, { wellbeingEntries:next });
      });
      if (window.etcore) { try { window.etcore.bus.publish('WellbeingLogged', patch, 'user'); } catch(e) {} }
    }
    function upsertSleep(patch) {
      update(function(s) {
        var list = s.sleepSessions || [];
        var existing = list.find(function(e){ return e.date === ET.dstr(); });
        // Sesje z innych źródeł (generator w dev-panel, import) mogą mieć samo
        // `duration` bez godzin — bez tych fallbacków merged.bedtime/waketime
        // bywały undefined i calcDur wywalał całą aplikację (undefined.split).
        var base = Object.assign({ id:Date.now(), date:ET.dstr(), bedtime:'23:00', waketime:'07:00', quality:7, wakeups:0, notes:'' }, existing || {});
        var merged = Object.assign({}, base, patch);
        merged.duration = calcDur(merged.bedtime, merged.waketime);
        var next = existing ? list.map(function(e){ return e === existing ? merged : e; }) : [merged].concat(list);
        return Object.assign({}, s, { sleepSessions:next });
      });
      if (window.etcore) { try { window.etcore.bus.publish('SleepLogged', patch, 'user'); } catch(e) {} }
    }
    function calcDur(b, w) {
      var bh=+b.split(':')[0], bm=+b.split(':')[1], wh=+w.split(':')[0], wm=+w.split(':')[1];
      var m=(wh*60+wm)-(bh*60+bm); if(m<0) m+=1440; return Math.round(m/60*10)/10;
    }
    function stepTime(field, delta) {
      var cur = (sl && sl[field]) || (field==='bedtime' ? '23:00' : '07:00');
      var h=+cur.split(':')[0], m=+cur.split(':')[1];
      var total = (h*60+m+delta+1440*24) % 1440;
      var nh = Math.floor(total/60), nm = total%60;
      var patch = {}; patch[field] = String(nh).padStart(2,'0')+':'+String(nm).padStart(2,'0');
      upsertSleep(patch);
    }

    // ── GOTOWOŚĆ PRZED TRENINGIEM (spec §2 — store.preReadiness) ──
    var pre = store.preReadiness || { willingness:2, state:2, fatigue:2 };
    function setPre(key, val) {
      update(function(s){ var p = Object.assign({}, s.preReadiness || { willingness:2, state:2, fatigue:2 }); p[key]=val; return Object.assign({}, s, { preReadiness:p }); });
    }
    var prePct = Math.round(((pre.willingness-1)/2 + (pre.state-1)/2 + (pre.fatigue-1)/2) / 3 * 100);
    var preColor = prePct>=70 ? 'var(--green)' : prePct>=40 ? 'var(--yellow)' : 'var(--red)';

    // ── TRENDY 7 DNI ──
    var trends = React.useMemo(function() {
      var todayMs = new Date(ET.dstr()).getTime();
      var days = [];
      for (var i=6;i>=0;i--) {
        var d = new Date(todayMs - i*86400000);
        var key = ET.dstr(d);
        days.push({ key:key, label:DOW[d.getDay()], isToday:i===0,
          sleep:(store.sleepSessions||[]).find(function(e){ return e.date===key; }),
          checkin:(store.wellbeingEntries||[]).find(function(e){ return e.date===key && !e.tag; }) });
      }
      function row(label, color, get, unit, maxHint) {
        var vals = days.map(function(d){ var v=get(d); return v==null?null:v; });
        var present = vals.filter(function(v){ return v!=null; });
        var max = Math.max(maxHint, present.length?Math.max.apply(null,present):0);
        var avg = present.length ? (present.reduce(function(a,b){return a+b;},0)/present.length) : null;
        return { label:label, avg: avg==null ? 'brak danych' : 'śr. '+avg.toFixed(1)+unit,
          bars: days.map(function(d,idx){
            var v = vals[idx];
            var h = v==null ? 3 : Math.max(4, Math.round(v/max*100));
            return { label:d.label, h:h+'%', color: v==null ? 'rgba(255,255,255,.06)' : (d.isToday ? color : 'color-mix(in srgb,'+color+' 55%, transparent)'), labelColor: d.isToday ? 'var(--a-light)' : 'var(--t3)' };
          }) };
      }
      return [
        row('Sen', 'var(--purple)', function(d){ return d.sleep ? d.sleep.duration : null; }, 'h', 8),
        row('Jakość snu', 'var(--purple)', function(d){ return d.sleep ? d.sleep.quality : null; }, '/10', 10),
        row('Energia', 'var(--yellow)', function(d){ return d.checkin ? d.checkin.energy : null; }, '/10', 10),
        row('Stres', 'var(--red)', function(d){ return d.checkin ? d.checkin.stress : null; }, '/10', 10),
      ];
    }, [store.sleepSessions, store.wellbeingEntries]);

    var scoreColor = readiness.score==null ? 'var(--t3)' : readiness.score>=80 ? 'var(--green)' : readiness.score>=60 ? 'var(--a-light)' : 'var(--yellow)';
    var title = readiness.score==null ? 'Brak danych' : readiness.score>=80 ? 'Świetna forma' : readiness.score>=60 ? 'Gotowość w normie' : 'Odpuść objętość';
    var advice = readiness.score==null ? 'Zrób check-in albo zaloguj sen, żeby zobaczyć wynik dnia.'
      : readiness.score>=80 ? 'Organizm w pełnej gotowości — możesz celować w rekordy.'
      : readiness.score>=60 ? 'Trzymaj się planu, ale nie ustawiaj dziś rekordów.'
      : 'Rozważ −20% objętości albo dzień techniczny.';
    var dash = 314.2;
    var offset = readiness.score==null ? dash : dash * (1 - readiness.score/100);

    return _h('div', { className:'scr-in', style:{ display:'flex', flexDirection:'column', gap:18 } },

      // ══ PIERŚCIEŃ + SKŁADNIKI ══
      _h('div', { style:{ display:'flex', gap:16, flexWrap:'wrap' } },
        _h('div', { className:'glass', style:{ flex:'1 1 320px', minWidth:300, display:'flex', gap:18, alignItems:'center', padding:20, borderRadius:22 } },
          _h('div', { style:{ position:'relative', flex:'none', width:118, height:118 } },
            _h('svg', { width:118, height:118, viewBox:'0 0 118 118', style:{ transform:'rotate(-90deg)' } },
              _h('defs', null, _h('linearGradient', { id:'wReadyRing', x1:'0', y1:'0', x2:'1', y2:'1' },
                _h('stop', { offset:'0', stopColor:'#60A5FA' }), _h('stop', { offset:'.55', stopColor:'#3B82F6' }), _h('stop', { offset:'1', stopColor:'#8B5CF6' }))),
              _h('circle', { cx:59, cy:59, r:50, fill:'none', stroke:'rgba(255,255,255,.07)', strokeWidth:9 }),
              _h('circle', { cx:59, cy:59, r:50, fill:'none', stroke: readiness.score==null ? 'rgba(255,255,255,.12)' : 'url(#wReadyRing)', strokeWidth:9, strokeLinecap:'round', strokeDasharray:dash, strokeDashoffset:offset, style:{ transition:'stroke-dashoffset .5s cubic-bezier(.2,.8,.2,1)' } })
            ),
            _h('div', { style:{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:3 } },
              _h('span', { style:{ fontSize:34, fontWeight:800, lineHeight:1, letterSpacing:'-.045em', fontVariantNumeric:'tabular-nums' } }, readiness.score==null ? '—' : readiness.score),
              _h('span', { style:{ fontSize:8, fontWeight:800, letterSpacing:'.14em', color:'var(--t3)' } }, 'GOTOWOŚĆ')
            )
          ),
          _h('div', { style:{ display:'flex', flexDirection:'column', gap:9, minWidth:0 } },
            _h('span', { style:SECTION_LABEL }, new Date().toLocaleDateString('pl-PL',{ weekday:'long', day:'numeric', month:'long' }).toUpperCase()),
            _h('div', { style:{ fontSize:20, fontWeight:800, letterSpacing:'-.028em', color:scoreColor } }, title),
            _h('div', { style:{ fontSize:12.5, fontWeight:400, lineHeight:1.5, color:'var(--t2)', textWrap:'pretty' } }, advice)
          )
        ),
        _h('div', { className:'wcard', style:{ flex:'1 1 340px', minWidth:300, display:'flex', flexDirection:'column', gap:11, padding:20, borderRadius:22 } },
          _h('span', { style:SECTION_LABEL }, 'SKŁADNIKI WYNIKU'),
          readiness.comps.length === 0
            ? _h('div', { style:{ fontSize:12, color:'var(--t3)', padding:'12px 0' } }, 'Brak check-inu ani snu dzisiaj.')
            : readiness.comps.map(function(c) {
                return _h('div', { key:c.key, style:{ display:'flex', alignItems:'center', gap:11 } },
                  _h('span', { style:{ flex:'0 0 104px', fontSize:10.5, fontWeight:600, letterSpacing:'.06em', color:'var(--t3)' } }, c.label),
                  _h('div', { style:{ flex:1, height:6, borderRadius:3, background:'rgba(255,255,255,.07)', overflow:'hidden' } },
                    _h('div', { style:{ height:'100%', borderRadius:3, width:(c.w*100)+'%', background:c.color, transition:'width .5s cubic-bezier(.2,.8,.2,1)' } })),
                  _h('span', { style:{ flex:'0 0 58px', textAlign:'right', fontSize:11.5, fontWeight:800, fontVariantNumeric:'tabular-nums', color:c.color } }, c.val)
                );
              })
        )
      ),

      // ══ CHECK-IN + SEN ══
      _h('div', { style:{ display:'flex', gap:16, flexWrap:'wrap', alignItems:'stretch' } },

        _h('div', { className:'wcard', style:{ flex:'1 1 420px', minWidth:340, display:'flex', flexDirection:'column', gap:14, padding:20, borderRadius:22 } },
          _h('div', { style:{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:12, flexWrap:'wrap' } },
            _h('div', { style:{ display:'flex', flexDirection:'column', gap:5 } },
              _h('span', { style:SECTION_LABEL }, 'CHECK-IN PORANNY'),
              _h('span', { style:{ fontSize:13, fontWeight:700, color: ci ? 'var(--green)' : 'var(--t3)' } }, ci ? 'Zapisany' : 'Jeszcze nie dziś')
            ),
            _h('div', { style:{ display:'flex', gap:4, padding:4, borderRadius:12, background:'rgba(255,255,255,.04)', border:'1px solid rgba(255,255,255,.08)' } },
              [{ id:'dots', name:'1–10' }, { id:'emoji', name:'Emoji' }].map(function(t) {
                var on = checkinStyle === t.id;
                return _h('div', { key:t.id, onClick:function(){ setCheckinStyle(t.id); },
                  style:{ padding:'7px 12px', borderRadius:9, cursor:'pointer', fontSize:11, fontWeight:700,
                    color: on ? 'var(--a-light)' : 'var(--t3)', background: on ? 'rgba(59,130,246,.16)' : 'transparent', transition:'background .2s,color .2s' } }, t.name);
              })
            )
          ),
          CHECKIN_FIELDS.map(function(f) {
            var val = ci ? ci[f.key] : null;
            return _h('div', { key:f.key, style:{ display:'flex', flexDirection:'column', gap:8 } },
              _h('div', { style:{ display:'flex', alignItems:'baseline', justifyContent:'space-between', gap:10 } },
                _h('span', { style:{ fontSize:12, fontWeight:700, letterSpacing:'-.01em' } }, f.label),
                _h('span', { style:{ fontSize:12, fontWeight:800, fontVariantNumeric:'tabular-nums', color:'var(--t2)' } }, val==null ? '—' : val+'/10')
              ),
              checkinStyle === 'dots'
                ? dotsRow(val, 10, function(v){ var p={}; p[f.key]=v; upsertCheckin(p); }, 'var(--a)')
                : _h('div', { style:{ display:'flex', gap:6 } },
                    FACES.map(function(face, i) {
                      var faceVal = (i+1)*2;
                      var on = val!=null && Math.ceil(val/2) === i+1;
                      return _h('div', { key:i, onClick:function(){ var p={}; p[f.key]=faceVal; upsertCheckin(p); },
                        style:{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:5, padding:'9px 4px', borderRadius:12, cursor:'pointer',
                          background: on ? 'rgba(59,130,246,.16)' : 'rgba(255,255,255,.04)', border:'1px solid ' + (on ? 'rgba(96,165,250,.34)' : 'rgba(255,255,255,.08)') } },
                        _h('span', { style:{ fontSize:18 } }, face));
                    })
                  )
            );
          })
        ),

        _h('div', { style:{ flex:'1 1 320px', minWidth:300, display:'flex', flexDirection:'column', gap:14, padding:20, borderRadius:22,
          background:'linear-gradient(158deg,rgba(139,92,246,.12),rgba(255,255,255,.02))', border:'1px solid rgba(139,92,246,.26)' } },
          _h('div', { style:{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:12 } },
            _h('span', { style:SECTION_LABEL }, 'SEN — OSTATNIA NOC'),
            _h('span', { style:{ fontSize:22, fontWeight:800, letterSpacing:'-.035em', fontVariantNumeric:'tabular-nums', color:'#A78BFA' } }, sl ? sl.duration.toFixed(1)+'h' : '—')
          ),
          _h('div', { style:{ display:'flex', gap:9 } },
            [{ key:'bedtime', label:'ZAŚNIĘCIE' }, { key:'waketime', label:'POBUDKA' }].map(function(t) {
              return _h('div', { key:t.key, style:{ flex:1, display:'flex', flexDirection:'column', gap:8, padding:12, borderRadius:15, background:'rgba(0,0,0,.26)', border:'1px solid rgba(255,255,255,.07)' } },
                _h('span', { style:{ fontSize:8.5, fontWeight:800, letterSpacing:'.12em', color:'var(--t3)' } }, t.label),
                _h('div', { style:{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:6 } },
                  stepBtn(function(){ stepTime(t.key, -15); }, '−'),
                  _h('span', { style:{ fontSize:16, fontWeight:800, fontVariantNumeric:'tabular-nums' } }, (sl && sl[t.key]) || (t.key==='bedtime'?'23:00':'07:00')),
                  stepBtn(function(){ stepTime(t.key, 15); }, '+')
                )
              );
            })
          ),
          _h('div', { style:{ display:'flex', flexDirection:'column', gap:8 } },
            _h('div', { style:{ display:'flex', alignItems:'baseline', justifyContent:'space-between' } },
              _h('span', { style:{ fontSize:12, fontWeight:700 } }, 'Jakość snu'),
              _h('span', { style:{ fontSize:12, fontWeight:800, color:'#A78BFA', fontVariantNumeric:'tabular-nums' } }, sl ? sl.quality+'/10' : '—')
            ),
            dotsRow(sl?sl.quality:null, 10, function(v){ upsertSleep({ quality:v }); }, '#A78BFA')
          ),
          _h('div', { style:{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:10, padding:'12px 14px', borderRadius:15, background:'rgba(0,0,0,.26)', border:'1px solid rgba(255,255,255,.07)' } },
            _h('span', { style:{ fontSize:11.5, fontWeight:700 } }, 'Przebudzenia'),
            _h('div', { style:{ display:'flex', alignItems:'center', gap:8 } },
              stepBtn(function(){ upsertSleep({ wakeups:Math.max(0, ((sl&&sl.wakeups)||0)-1) }); }, '−'),
              _h('span', { style:{ minWidth:20, textAlign:'center', fontSize:15, fontWeight:800, fontVariantNumeric:'tabular-nums' } }, (sl&&sl.wakeups)||0),
              stepBtn(function(){ upsertSleep({ wakeups:((sl&&sl.wakeups)||0)+1 }); }, '+')
            )
          ),
          _h('span', { style:{ fontSize:10.5, fontWeight:400, lineHeight:1.45, color:'var(--t3)', textWrap:'pretty' } },
            sl ? 'Pierwsze dotknięcie tworzy wpis dnia — bez osobnego zapisu.' : 'Ustaw godziny lub jakość, żeby zapisać dzisiejszy sen.')
        )
      ),

      // ══ GOTOWOŚĆ PRZED TRENINGIEM ══
      _h('div', { className:'wcard', style:{ display:'flex', flexDirection:'column', gap:14, padding:20, borderRadius:22 } },
        _h('div', { style:{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:14, flexWrap:'wrap' } },
          _h('div', { style:{ display:'flex', flexDirection:'column', gap:5 } },
            _h('span', { style:SECTION_LABEL }, 'GOTOWOŚĆ PRZED TRENINGIEM'),
            _h('span', { style:{ fontSize:11.5, fontWeight:400, lineHeight:1.4, color:'var(--t2)' } }, 'Trzypunktowa skala zapisywana razem z sesją — z niej liczy się obciążenie w ACWR.')
          ),
          _h('span', { style:{ padding:'6px 12px', borderRadius:100, background:'color-mix(in srgb,'+preColor+' 16%, transparent)', border:'1px solid color-mix(in srgb,'+preColor+' 40%, transparent)', fontSize:10.5, fontWeight:800, color:preColor } }, prePct+'%')
        ),
        _h('div', { style:{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(240px,1fr))', gap:10 } },
          PRE_FIELDS.map(function(f) {
            return _h('div', { key:f.key, style:{ display:'flex', flexDirection:'column', gap:9, padding:14, borderRadius:16, background:'rgba(0,0,0,.24)', border:'1px solid rgba(255,255,255,.07)' } },
              _h('span', { style:{ fontSize:8.5, fontWeight:800, letterSpacing:'.12em', color:'var(--t3)' } }, f.label),
              _h('div', { style:{ display:'flex', gap:6 } },
                f.opts.map(function(name, i) {
                  var on = pre[f.key] === i+1;
                  return _h('div', { key:i, onClick:function(){ setPre(f.key, i+1); },
                    style:{ flex:1, padding:'9px 6px', borderRadius:11, textAlign:'center', cursor:'pointer', fontSize:10, fontWeight:700, lineHeight:1.3, transition:'background .18s',
                      background: on ? 'rgba(59,130,246,.16)' : 'rgba(255,255,255,.04)', border:'1px solid ' + (on ? 'rgba(96,165,250,.34)' : 'rgba(255,255,255,.08)'), color: on ? 'var(--a-light)' : 'var(--t2)' } }, name);
                })
              )
            );
          })
        )
      ),

      // ══ TRENDY 7 DNI ══
      _h('div', { className:'wcard', style:{ display:'flex', flexDirection:'column', gap:14, padding:20, borderRadius:22 } },
        _h('span', { style:SECTION_LABEL }, 'OSTATNIE 7 DNI'),
        trends.map(function(t) {
          return _h('div', { key:t.label, style:{ display:'flex', alignItems:'center', gap:12 } },
            _h('div', { style:{ flex:'0 0 118px', display:'flex', flexDirection:'column', gap:4 } },
              _h('span', { style:{ fontSize:11.5, fontWeight:700 } }, t.label),
              _h('span', { style:{ fontSize:9.5, fontWeight:600, color:'var(--t3)' } }, t.avg)
            ),
            _h('div', { style:{ flex:1, display:'flex', alignItems:'flex-end', gap:5, height:44 } },
              t.bars.map(function(b, i) {
                return _h('div', { key:i, style:{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:5 } },
                  _h('div', { style:{ width:'100%', borderRadius:'4px 4px 0 0', height:b.h, background:b.color, transition:'height .4s cubic-bezier(.2,.8,.2,1)' } }),
                  _h('span', { style:{ fontSize:8, fontWeight:700, color:b.labelColor } }, b.label)
                );
              })
            )
          );
        })
      )
    );
  }

  ET.ReadinessModule = ReadinessModule;
})();
