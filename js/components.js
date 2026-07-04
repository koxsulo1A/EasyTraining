(function() {
  'use strict';
  window.ET = window.ET || {};
  var _h = React.createElement;

  // ── UTILS ────────────────────────────────────────
  function dstr(d) { d = d || new Date(); return d.toISOString().slice(0,10); }
  function fmtDate(d) { return new Date(d).toLocaleDateString('pl-PL', { day:'numeric', month:'short', year:'numeric' }); }
  function fmtDateShort(d) { return new Date(d).toLocaleDateString('pl-PL', { day:'numeric', month:'short' }); }
  function greeting() { var h = new Date().getHours(); return h < 12 ? 'Dzień dobry' : h < 18 ? 'Cześć' : 'Dobry wieczór'; }
  function calcPace(distKm, durMin) {
    if (!distKm || !durMin) return '—';
    var s = durMin * 60 / distKm;
    return Math.floor(s/60) + ':' + String(Math.round(s%60)).padStart(2,'0');
  }
  function daysUntil(dateStr) {
    var d = new Date(dateStr + 'T12:00');
    var today = new Date(); today.setHours(0,0,0,0);
    return Math.round((d - today) / 86400000);
  }
  function groupByWeek(entries, dateKey) {
    var weeks = {};
    entries.forEach(function(e) {
      var d = new Date(e[dateKey] + 'T12:00');
      var mon = new Date(d); mon.setDate(d.getDate() - (d.getDay()||7) + 1);
      var key = mon.toISOString().slice(0,10);
      if (!weeks[key]) weeks[key] = [];
      weeks[key].push(e);
    });
    return weeks;
  }
  function last30Days() {
    var d = new Date(); d.setDate(d.getDate()-30); return d;
  }

  // ── TOAST ────────────────────────────────────────
  var ToastCtx = React.createContext(null);

  function ToastProvider(props) {
    var t = React.useState([]);
    var toasts = t[0], setToasts = t[1];
    var show = React.useCallback(function(msg, type) {
      var id = Date.now() + Math.random();
      type = type || 'default';
      setToasts(function(prev) { return prev.concat([{ id:id, msg:msg, type:type }]); });
      setTimeout(function() { setToasts(function(prev) { return prev.filter(function(x){ return x.id !== id; }); }); }, 2800);
    }, []);

    return _h(ToastCtx.Provider, { value: show },
      props.children,
      _h('div', { style:{ position:'fixed', top:20, right:20, zIndex:9999, display:'flex', flexDirection:'column', gap:6, pointerEvents:'none' } },
        toasts.map(function(t) {
          var bg = t.type==='success' ? 'rgba(16,185,129,.18)' : t.type==='error' ? 'rgba(239,68,68,.18)' : 'var(--s4)';
          var border = t.type==='success' ? '1px solid var(--green)' : t.type==='error' ? '1px solid var(--red)' : '1px solid var(--b2)';
          var color = t.type==='success' ? 'var(--green)' : t.type==='error' ? 'var(--red)' : 'var(--t1)';
          return _h('div', { key:t.id, style:{ background:bg, border:border, color:color, borderRadius:'var(--r2)', padding:'10px 16px', fontSize:'.85rem', fontWeight:600, boxShadow:'0 8px 32px rgba(0,0,0,.5)', animation:'fadeIn .2s ease', minWidth:160 } }, t.msg);
        })
      )
    );
  }

  function useToast() { return React.useContext(ToastCtx); }

  // ── SHARED COMPONENTS ────────────────────────────
  function ReadinessRing(props) {
    var value = props.value || 0, size = props.size || 80, stroke = props.stroke || 6, color = props.color || 'var(--a)';
    var r = (size - stroke) / 2;
    var circ = 2 * Math.PI * r;
    return _h('div', { className:'ring-wrap', style:{ width:size, height:size } },
      _h('svg', { width:size, height:size, viewBox:'0 0 '+size+' '+size },
        _h('circle', { cx:size/2, cy:size/2, r:r, fill:'none', stroke:'var(--s4)', strokeWidth:stroke }),
        _h('circle', { cx:size/2, cy:size/2, r:r, fill:'none', stroke:color, strokeWidth:stroke,
          strokeDasharray:(circ*(value/100))+' '+circ, strokeLinecap:'round' })
      ),
      _h('div', { className:'ring-label' }, _h('span', { style:{ fontSize:'.82rem' } }, value+'%'))
    );
  }

  function ProgressBar(props) {
    var value = props.value || 0, color = props.color || 'var(--a)', height = props.height || 6;
    return _h('div', { className:'progress', style:{ height:height } },
      _h('div', { className:'progress-fill', style:{ width:Math.min(value,100)+'%', background:color } })
    );
  }

  function Sheet(props) {
    React.useEffect(function() {
      if (props.open) { document.body.style.overflow = 'hidden'; }
      else { document.body.style.overflow = ''; }
      return function() { document.body.style.overflow = ''; };
    }, [props.open]);

    if (!props.open) return null;
    return _h('div', { className:'sheet-overlay', onClick:props.onClose },
      _h('div', { className:'sheet', onClick:function(e){ e.stopPropagation(); } },
        _h('div', { className:'sheet-handle' }),
        props.title && _h('h2', null, props.title),
        props.children
      )
    );
  }

  function Placeholder(props) {
    return _h('div', { className:'module-placeholder fade-in' },
      _h('div', { className:'module-placeholder-icon' }, props.icon),
      _h('h2', null, props.title),
      _h('p', null, props.desc)
    );
  }

  function StatCard(props) {
    return _h('div', { className:'card card-sm', style:{ textAlign:'center' } },
      _h('div', { style:{ fontSize:'1.1rem', fontWeight:700, color:props.color||'var(--a-light)', marginBottom:2 } }, props.value),
      _h('div', { style:{ fontSize:'.62rem', color:'var(--t3)' } }, props.label)
    );
  }

  // ── SVG CHARTS (interactive tooltips) ────────────────────────────────────

  var TOOLTIP_STYLE = { minHeight:20, marginBottom:4, textAlign:'center' };
  var TOOLTIP_CHIP = { display:'inline-block', fontSize:'.7rem', fontWeight:700, borderRadius:6, padding:'2px 10px', background:'var(--s3)' };

  function fmtVal(v) { return typeof v==='number' ? (v%1 ? v.toFixed(1) : v) : v; }

  function calcHoverIdx(clientX, rect, len) {
    var pct = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    return Math.round(pct * (len - 1));
  }

  function BarChart(props) {
    var data = props.data || [];
    var color = props.color || 'var(--a)';
    var h = props.height || 80;
    var unit = props.unit || '';
    var hs = React.useState(null); var hi = hs[0], setHi = hs[1];
    if (!data.length) return _h('div', { style:{ color:'var(--t3)', fontSize:'.78rem', padding:'20px 0', textAlign:'center' } }, 'Brak danych');
    var max = Math.max.apply(null, data.map(function(d){ return d.value||0; })) || 1;
    var hd = hi !== null ? data[hi] : null;
    return _h('div', null,
      _h('div', { style:TOOLTIP_STYLE },
        hd && _h('span', { style:Object.assign({},TOOLTIP_CHIP,{color:color}) }, hd.label+': '+fmtVal(hd.value)+(unit?' '+unit:''))
      ),
      _h('div', { className:'bar-chart', style:{ height:h+'px' } },
        data.map(function(d,i) {
          var pct = (d.value||0)/max;
          var active = hi===i;
          return _h('div', { key:i, className:'bar-chart-bar',
            style:{ height:Math.max(2,pct*h)+'px', background:color, opacity:active?1:0.72, flexBasis:0, flexGrow:1, cursor:'pointer', transition:'opacity .1s' },
            onMouseEnter:function(){ setHi(i); }, onMouseLeave:function(){ setHi(null); },
            onTouchStart:function(e){ e.preventDefault(); setHi(i); }
          });
        })
      ),
      _h('div', { className:'bar-chart-labels' },
        data.map(function(d,i){ return _h('div', { key:i, className:'bar-chart-label' }, d.label); })
      )
    );
  }

  function LineChart(props) {
    var data = props.data || [];
    var color = props.color || 'var(--a)';
    var h = props.height || 52;
    var unit = props.unit || '';
    var hs = React.useState(null); var hi = hs[0], setHi = hs[1];
    if (data.length < 2) return _h('div', { style:{ color:'var(--t3)', fontSize:'.78rem', padding:'16px 0', textAlign:'center' } }, 'Za mało danych');
    var vals = data.map(function(d){ return d.value||0; });
    var min = Math.min.apply(null, vals);
    var max = Math.max.apply(null, vals);
    var range = max - min || 1;
    var W = 1000, H = h;
    var pts = data.map(function(d,i){ var x=(i/(data.length-1))*W, y=H-((d.value-min)/range)*H; return x+','+y; }).join(' ');
    var hd = hi!==null ? data[hi] : null;
    var hx = hi!==null ? (hi/(data.length-1))*W : -1;
    function onMove(cx, rect) { setHi(calcHoverIdx(cx, rect, data.length)); }
    return _h('div', { style:{ position:'relative' } },
      _h('div', { style:TOOLTIP_STYLE },
        hd && _h('span', { style:Object.assign({},TOOLTIP_CHIP,{color:color}) }, hd.label+': '+fmtVal(hd.value)+(unit?' '+unit:''))
      ),
      _h('svg', {
        viewBox:'0 0 '+W+' '+H, preserveAspectRatio:'none',
        style:{ width:'100%', height:h+'px', overflow:'visible', cursor:'crosshair', touchAction:'none', display:'block' },
        onMouseMove:function(e){ onMove(e.clientX, e.currentTarget.getBoundingClientRect()); },
        onMouseLeave:function(){ setHi(null); },
        onTouchStart:function(e){ e.preventDefault(); onMove(e.touches[0].clientX, e.currentTarget.getBoundingClientRect()); },
        onTouchMove:function(e){ e.preventDefault(); onMove(e.touches[0].clientX, e.currentTarget.getBoundingClientRect()); },
      },
        hi!==null && _h('line', { x1:hx, y1:0, x2:hx, y2:H, stroke:color, strokeWidth:2, strokeDasharray:'8 5', opacity:0.35, style:{ vectorEffect:'non-scaling-stroke' } }),
        _h('polyline', { points:pts, fill:'none', stroke:color, strokeWidth:1.5, strokeLinecap:'round', strokeLinejoin:'round', opacity:.9, style:{ vectorEffect:'non-scaling-stroke' } }),
        data.map(function(d,i){
          var x=(i/(data.length-1))*W, y=H-((d.value-min)/range)*H, active=hi===i;
          return _h('circle', { key:i, cx:x, cy:y, r:active?4:2.5, fill:color, opacity:active?1:.85, style:{ vectorEffect:'non-scaling-stroke' } });
        })
      ),
      _h('div', { className:'bar-chart-labels' },
        data.map(function(d,i){ return _h('div', { key:i, className:'bar-chart-label' }, d.label); })
      )
    );
  }

  // MultiLineChart — serie znormalizowane do 0-100 przed przekazaniem
  function MultiLineChart(props) {
    var series = props.series || [];
    var h = props.height || 62;
    var W = 1000, H = h;
    var hs = React.useState(null); var hi = hs[0], setHi = hs[1];
    var first = series.find(function(s){ return s.data && s.data.length >= 2; });
    if (!first) return _h('div', { style:{ color:'var(--t3)', fontSize:'.78rem', padding:'20px 0', textAlign:'center' } }, 'Za mało danych');
    var hx = hi!==null ? (hi/(first.data.length-1))*W : -1;
    function onMove(cx, rect) { setHi(calcHoverIdx(cx, rect, first.data.length)); }
    return _h('div', null,
      _h('div', { style:{ display:'flex', gap:10, flexWrap:'wrap', marginBottom:5 } },
        series.map(function(s){
          return _h('div', { key:s.label, style:{ display:'flex', alignItems:'center', gap:5 } },
            _h('div', { style:{ width:18, height:2.5, background:s.color, borderRadius:2 } }),
            _h('div', { style:{ fontSize:'.6rem', color:'var(--t3)' } }, s.label)
          );
        })
      ),
      _h('div', { style:{ minHeight:20, marginBottom:4, display:'flex', gap:6, flexWrap:'wrap', alignItems:'center' } },
        hi!==null && [
          _h('span', { key:'lbl', style:{ fontSize:'.62rem', color:'var(--t3)', fontWeight:700 } }, first.data[hi].label+':'),
          series.map(function(s){
            var v = s.data[hi] ? s.data[hi].value : null;
            return v!=null ? _h('span', { key:s.label, style:{ fontSize:'.62rem', fontWeight:700, color:s.color, background:s.color+'18', borderRadius:4, padding:'1px 6px' } },
              s.label+' '+Math.round(v)+'%'
            ) : null;
          })
        ]
      ),
      _h('svg', {
        viewBox:'0 0 '+W+' '+H, preserveAspectRatio:'none',
        style:{ width:'100%', height:h+'px', overflow:'visible', cursor:'crosshair', touchAction:'none', display:'block' },
        onMouseMove:function(e){ onMove(e.clientX, e.currentTarget.getBoundingClientRect()); },
        onMouseLeave:function(){ setHi(null); },
        onTouchStart:function(e){ e.preventDefault(); onMove(e.touches[0].clientX, e.currentTarget.getBoundingClientRect()); },
        onTouchMove:function(e){ e.preventDefault(); onMove(e.touches[0].clientX, e.currentTarget.getBoundingClientRect()); },
      },
        hi!==null && _h('line', { x1:hx, y1:0, x2:hx, y2:H, stroke:'var(--t3)', strokeWidth:1, strokeDasharray:'4 3', opacity:0.3 }),
        series.map(function(s){
          if (!s.data || s.data.length < 2) return null;
          var cnt = s.data.length;
          var pts = s.data.map(function(d,i){ var x=(i/(cnt-1))*W, y=H-Math.max(0,Math.min(1,(d.value||0)/100))*H; return x+','+y; }).join(' ');
          return _h('g', { key:s.label },
            _h('polyline', { points:pts, fill:'none', stroke:s.color, strokeWidth:1.5, strokeLinecap:'round', strokeLinejoin:'round', opacity:.85, style:{ vectorEffect:'non-scaling-stroke' } }),
            s.data.map(function(d,i){
              var x=(i/(cnt-1))*W, y=H-Math.max(0,Math.min(1,(d.value||0)/100))*H, active=hi===i;
              return _h('circle', { key:i, cx:x, cy:y, r:active?4:2.5, fill:s.color, opacity:active?1:.85, style:{ vectorEffect:'non-scaling-stroke' } });
            })
          );
        })
      ),
      _h('div', { className:'bar-chart-labels' },
        first.data.map(function(d,i){ return _h('div', { key:i, className:'bar-chart-label' }, d.label); })
      )
    );
  }

  Object.assign(window.ET, {
    dstr: dstr, fmtDate: fmtDate, fmtDateShort: fmtDateShort,
    greeting: greeting, calcPace: calcPace, daysUntil: daysUntil,
    groupByWeek: groupByWeek, last30Days: last30Days,
    ToastCtx: ToastCtx, ToastProvider: ToastProvider, useToast: useToast,
    ReadinessRing: ReadinessRing, ProgressBar: ProgressBar,
    Sheet: Sheet, Placeholder: Placeholder, StatCard: StatCard,
    BarChart: BarChart, LineChart: LineChart, MultiLineChart: MultiLineChart,
  });
})();
