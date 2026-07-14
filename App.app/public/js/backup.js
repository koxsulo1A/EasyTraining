(function() {
  'use strict';
  window.ET = window.ET || {};
  var _h = React.createElement;

  var PLAN_COLUMNS = ['Tydzień','Dzień','Nazwa ćwiczenia','Partia','Serie','Powtórzenia','Ciężar','RPE','Notatki'];

  // ── POBIERANIE PLIKU ─────────────────────────────────────────────────────
  function download(filename, content, mime) {
    var blob = content instanceof Blob ? content : new Blob([content], { type:mime || 'text/plain;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click();
    setTimeout(function(){ try{ document.body.removeChild(a); }catch(e){} URL.revokeObjectURL(url); }, 150);
  }
  ET.downloadFile = download;

  // ── CSV ──────────────────────────────────────────────────────────────────
  function csvCell(v) {
    v = (v==null ? '' : String(v));
    if (/[";,\n\r]/.test(v)) return '"' + v.replace(/"/g,'""') + '"';
    return v;
  }
  ET.toCSV = function(headers, rows) {
    var sep = ';'; // przyjazne dla polskiego Excela
    var lines = [headers.map(csvCell).join(sep)];
    rows.forEach(function(r){ lines.push(r.map(csvCell).join(sep)); });
    return '﻿' + lines.join('\r\n'); // BOM = poprawne polskie znaki w Excelu
  };
  ET.parseCSV = function(text) {
    text = String(text).replace(/^﻿/, '');
    var firstLine = (text.split(/\r?\n/)[0]) || '';
    var sep = (firstLine.split(';').length > firstLine.split(',').length) ? ';' : ',';
    var rows = [], row = [], cur = '', inQ = false;
    for (var i=0;i<text.length;i++) {
      var ch = text[i];
      if (inQ) {
        if (ch === '"') { if (text[i+1] === '"') { cur += '"'; i++; } else inQ = false; }
        else cur += ch;
      } else {
        if (ch === '"') inQ = true;
        else if (ch === sep) { row.push(cur); cur = ''; }
        else if (ch === '\n') { row.push(cur); rows.push(row); row = []; cur = ''; }
        else if (ch === '\r') { /* pomiń */ }
        else cur += ch;
      }
    }
    if (cur !== '' || row.length) { row.push(cur); rows.push(row); }
    // odrzuć całkowicie puste wiersze
    return rows.filter(function(r){ return r.some(function(c){ return String(c).trim() !== ''; }); });
  };

  // ── XLSX (minimalny, poprawny zapis — zip STORED + CRC32) ────────────────
  var _crc;
  function crc32(bytes) {
    if (!_crc) { _crc = []; for (var n=0;n<256;n++){ var c=n; for (var k=0;k<8;k++) c=(c&1)?(0xEDB88320^(c>>>1)):(c>>>1); _crc[n]=c>>>0; } }
    var crc = 0xFFFFFFFF;
    for (var i=0;i<bytes.length;i++) crc = (crc>>>8) ^ _crc[(crc ^ bytes[i]) & 0xFF];
    return (crc ^ 0xFFFFFFFF) >>> 0;
  }
  function strBytes(s) { return new TextEncoder().encode(s); }
  function u16(n){ return [n & 0xff, (n>>8) & 0xff]; }
  function u32(n){ return [n & 0xff, (n>>8) & 0xff, (n>>16) & 0xff, (n>>>24) & 0xff]; }

  ET.buildZip = function(files) { // files: [{name, data:Uint8Array}]
    var parts = [], central = [], offset = 0;
    files.forEach(function(f) {
      var nameB = strBytes(f.name), crc = crc32(f.data), size = f.data.length;
      var lh = new Uint8Array([].concat(u32(0x04034b50), u16(20), u16(0), u16(0), u16(0), u16(0), u32(crc), u32(size), u32(size), u16(nameB.length), u16(0)));
      parts.push(lh, nameB, f.data);
      var cd = new Uint8Array([].concat(u32(0x02014b50), u16(20), u16(20), u16(0), u16(0), u16(0), u16(0), u32(crc), u32(size), u32(size), u16(nameB.length), u16(0), u16(0), u16(0), u16(0), u32(0), u32(offset)));
      central.push(cd, nameB);
      offset += lh.length + nameB.length + f.data.length;
    });
    var centralStart = offset, centralSize = 0;
    central.forEach(function(c){ centralSize += c.length; });
    var eocd = new Uint8Array([].concat(u32(0x06054b50), u16(0), u16(0), u16(files.length), u16(files.length), u32(centralSize), u32(centralStart), u16(0)));
    var all = parts.concat(central, [eocd]);
    var total = all.reduce(function(t,a){ return t + a.length; }, 0);
    var out = new Uint8Array(total), p = 0;
    all.forEach(function(a){ out.set(a, p); p += a.length; });
    return out;
  };

  function xesc(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
  function colLetter(n){ var s=''; n++; while(n>0){ var m=(n-1)%26; s=String.fromCharCode(65+m)+s; n=Math.floor((n-1)/26); } return s; }

  // rows: tablica tablic (wiersze); pierwszy wiersz = nagłówek
  ET.buildXlsx = function(rows, sheetName) {
    sheetName = sheetName || 'Arkusz1';
    var sheetData = '';
    rows.forEach(function(cells, ri) {
      sheetData += '<row r="'+(ri+1)+'">';
      cells.forEach(function(val, ci) {
        var ref = colLetter(ci) + (ri+1);
        var isNum = ri>0 && val!=='' && val!=null && !isNaN(val) && String(val).trim()!=='' && /^-?\d+(\.\d+)?$/.test(String(val).trim());
        if (isNum) sheetData += '<c r="'+ref+'"><v>'+String(val).trim()+'</v></c>';
        else sheetData += '<c r="'+ref+'" t="inlineStr"><is><t xml:space="preserve">'+xesc(val==null?'':val)+'</t></is></c>';
      });
      sheetData += '</row>';
    });
    var sheetXml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>'+sheetData+'</sheetData></worksheet>';
    var workbookXml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="'+xesc(sheetName)+'" sheetId="1" r:id="rId1"/></sheets></workbook>';
    var wbRels = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/></Relationships>';
    var rootRels = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>';
    var contentTypes = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>';
    var files = [
      { name:'[Content_Types].xml', data:strBytes(contentTypes) },
      { name:'_rels/.rels', data:strBytes(rootRels) },
      { name:'xl/workbook.xml', data:strBytes(workbookXml) },
      { name:'xl/_rels/workbook.xml.rels', data:strBytes(wbRels) },
      { name:'xl/worksheets/sheet1.xml', data:strBytes(sheetXml) },
    ];
    return ET.buildZip(files);
  };

  // ── PLAN → WIERSZE ───────────────────────────────────────────────────────
  function guessPartia(name) {
    var n = String(name).toLowerCase();
    if (/wyciskan|rozpiętk|pompk|klatk|crossover/.test(n)) return 'klatka_piersiowa';
    if (/wiosł|podciąg|ściąg|martwy ciąg|face pull|plec|pull-over|pulldown/.test(n)) return 'plecy';
    if (/przysiad|hip thrust|rdl|wykrok|split|step-up|prasa|nog/.test(n)) return 'nogi';
    if (/biceps|uginan/.test(n)) return 'biceps';
    if (/triceps|french|prostowanie ram/.test(n)) return 'triceps';
    if (/bark|ohp|press|wznos|raise|arnold|delt|unoszeni/.test(n)) return 'barki';
    if (/łydk|calf|wspięci/.test(n)) return 'lydki';
    if (/plank|dead bug|brzuch|core|russian|hollow|crunch/.test(n)) return 'core_brzuch';
    return '';
  }

  ET.plansToRows = function(plans) {
    var rows = [PLAN_COLUMNS.slice()];
    (plans||[]).forEach(function(plan, di) {
      (plan.exercises||[]).forEach(function(ex) {
        rows.push([
          1,                       // Tydzień (szablon tygodniowy)
          di+1,                    // Dzień
          ex.name || '',
          guessPartia(ex.name),
          ex.sets != null ? ex.sets : '',
          ex.reps != null ? ex.reps : '',
          ex.weight != null ? ex.weight : '',
          ex.rpe != null ? ex.rpe : (ex.rir!=null ? '' : ''),
          [ex.plan, ex.tempo?('Tempo '+ex.tempo):'', ex.prog].filter(Boolean).join(' · ')
        ]);
      });
    });
    return rows;
  };

  // ── CSV/ROWS → STRUKTURA PLANU (import) ──────────────────────────────────
  function norm(s){ return String(s||'').trim().toLowerCase().replace(/\s+/g,' '); }
  ET.parsePlanRows = function(rows) {
    if (!rows || rows.length < 2) return { ok:false, error:'Plik nie zawiera danych.' };
    var header = rows[0].map(norm);
    // Dopasowanie kolumn odporne na kolizje (np. "tydzień" zawiera "dzień"):
    // każda kolumna może zostać przypisana tylko raz, a kolejność liczy się (tydzień przed dniem).
    var used = {};
    function find(pred) {
      for (var i=0;i<header.length;i++) { if (used[i]) continue; if (pred(header[i])) { used[i]=1; return i; } }
      return -1;
    }
    var ci = {};
    ci.week   = find(function(h){ return h.indexOf('tydz')!==-1 || h.indexOf('week')!==-1; });
    ci.day    = find(function(h){ return h.indexOf('tydz')===-1 && (h.indexOf('dzie')!==-1 || h==='day' || h.indexOf('day')!==-1); });
    ci.name   = find(function(h){ return h.indexOf('nazwa')!==-1 || h.indexOf('ćwicz')!==-1 || h.indexOf('cwicz')!==-1 || h.indexOf('exercise')!==-1; });
    ci.part   = find(function(h){ return h.indexOf('partia')!==-1 || h==='part'; });
    ci.sets   = find(function(h){ return h.indexOf('serie')!==-1 || h.indexOf('sets')!==-1; });
    ci.reps   = find(function(h){ return h.indexOf('powtórz')!==-1 || h.indexOf('powtorz')!==-1 || h.indexOf('reps')!==-1; });
    ci.weight = find(function(h){ return h.indexOf('ciężar')!==-1 || h.indexOf('ciezar')!==-1 || h.indexOf('weight')!==-1 || h.indexOf('%')!==-1; });
    ci.rpe    = find(function(h){ return h.indexOf('rpe')!==-1; });
    ci.notes  = find(function(h){ return h.indexOf('notat')!==-1 || h.indexOf('notes')!==-1; });
    if (ci.name === -1) return { ok:false, error:'Brak kolumny "Nazwa ćwiczenia".' };
    var items = [];
    for (var r=1;r<rows.length;r++) {
      var row = rows[r];
      var name = ci.name>=0 ? String(row[ci.name]||'').trim() : '';
      if (!name) continue;
      items.push({
        week:   ci.week>=0 ? String(row[ci.week]||'').trim() : '',
        day:    ci.day>=0 ? String(row[ci.day]||'').trim() : '',
        name:   name,
        partia: ci.part>=0 ? String(row[ci.part]||'').trim() : '',
        sets:   ci.sets>=0 ? String(row[ci.sets]||'').trim() : '',
        reps:   ci.reps>=0 ? String(row[ci.reps]||'').trim() : '',
        weight: ci.weight>=0 ? String(row[ci.weight]||'').trim() : '',
        rpe:    ci.rpe>=0 ? String(row[ci.rpe]||'').trim() : '',
        notes:  ci.notes>=0 ? String(row[ci.notes]||'').trim() : '',
      });
    }
    if (!items.length) return { ok:false, error:'Nie znaleziono żadnych ćwiczeń.' };
    var weeks = {}, days = {};
    items.forEach(function(it){ if(it.week) weeks[it.week]=1; if(it.day) days[it.day]=1; });
    return { ok:true, items:items, weekCount:Object.keys(weeks).length, dayCount:Object.keys(days).length };
  };

  // ── SCALANIE / ZASTĘPOWANIE KOPII (import danych) ────────────────────────
  ET.applyBackup = function(current, imported, mode) {
    if (mode === 'replace') return Object.assign({}, current, imported);
    var next = Object.assign({}, current);
    Object.keys(imported).forEach(function(k) {
      var iv = imported[k], cv = current[k];
      if (Array.isArray(iv) && Array.isArray(cv)) {
        var map = {}, out = [];
        cv.concat(iv).forEach(function(item) {
          var key = (item && item.id != null) ? String(item.id) : JSON.stringify(item);
          if (!(key in map)) { map[key] = out.length; out.push(item); } else out[map[key]] = item;
        });
        next[k] = out;
      } else if (iv && typeof iv === 'object' && !Array.isArray(iv) && cv && typeof cv === 'object') {
        next[k] = Object.assign({}, cv, iv);
      } else {
        next[k] = iv;
      }
    });
    return next;
  };

  function countSummary(store) {
    return [
      ['Treningi siłowe', (store.workouts||[]).length],
      ['Biegi', (store.runs||[]).length],
      ['Sauna', (store.saunaSessions||[]).length],
      ['Sen', (store.sleepSessions||[]).length],
      ['Pomiary', (store.measurements||[]).length],
      ['Ból', (store.painEntries||[]).length],
      ['Cele', (store.goals||[]).length],
      ['Wpisy dziennika', (store.journalEntries||[]).length],
    ];
  }

  // ── MODUŁ ────────────────────────────────────────────────────────────────
  function BackupModule() {
    var su = ET.useStore(); var store = su.store, update = su.update;
    var toast = ET.useToast();
    var pend = React.useState(null); var pending = pend[0], setPending = pend[1]; // {store} do importu kopii
    var planPrev = React.useState(null); var planPreview = planPrev[0], setPlanPreview = planPrev[1];
    var backupInput = React.useRef(null);
    var planInput = React.useRef(null);

    var today = ET.dstr();

    // — Kopia JSON —
    function exportBackup() {
      var json = JSON.stringify(store, null, 2);
      download('easytraining-kopia-'+today+'.json', json, 'application/json;charset=utf-8');
      toast('Kopia zapasowa pobrana ✓', 'success');
    }
    function onBackupFile(e) {
      var file = e.target.files && e.target.files[0];
      e.target.value = '';
      if (!file) return;
      var reader = new FileReader();
      reader.onload = function() {
        try {
          var data = JSON.parse(reader.result);
          if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error('zły format');
          setPending({ data:data });
        } catch(err) { toast('Nieprawidłowy plik kopii (oczekiwano .json)', 'error'); }
      };
      reader.readAsText(file);
    }
    function applyPending(mode) {
      var data = pending.data;
      update(function(s){ return ET.applyBackup(s, data, mode); });
      setPending(null);
      toast(mode==='replace' ? 'Dane zastąpione kopią ✓' : 'Dane scalone z kopią ✓', 'success');
    }

    // — Plan CSV/XLSX —
    function exportPlanCSV() {
      var rows = ET.plansToRows(ET.WORKOUT_PLANS || []);
      var csv = ET.toCSV(rows[0], rows.slice(1));
      download('plan-treningowy-'+today+'.csv', csv, 'text/csv;charset=utf-8');
      toast('Plan wyeksportowany do CSV ✓', 'success');
    }
    function exportPlanXLSX() {
      var rows = ET.plansToRows(ET.WORKOUT_PLANS || []);
      var bytes = ET.buildXlsx(rows, 'Plan');
      download('plan-treningowy-'+today+'.xlsx', new Blob([bytes], { type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }));
      toast('Plan wyeksportowany do Excela ✓', 'success');
    }
    function onPlanFile(e) {
      var file = e.target.files && e.target.files[0];
      e.target.value = '';
      if (!file) return;
      if (/\.xlsx$/i.test(file.name)) { toast('Import .xlsx: zapisz najpierw jako CSV w Excelu.', 'error'); return; }
      var reader = new FileReader();
      reader.onload = function() {
        var parsed = ET.parseCSV(reader.result);
        var res = ET.parsePlanRows(parsed);
        if (!res.ok) { toast(res.error, 'error'); return; }
        setPlanPreview(Object.assign({ name:file.name }, res));
      };
      reader.readAsText(file);
    }
    function confirmPlanImport() {
      var rec = {
        id: Date.now(),
        name: 'Import: ' + planPreview.name,
        importedAt: today,
        weekCount: planPreview.weekCount,
        dayCount: planPreview.dayCount,
        items: planPreview.items
      };
      update(function(s){
        var st = Object.assign({}, s, { importedPlans: [rec].concat(s.importedPlans||[]) });
        if (ET.logChange) st = ET.logChange(st, { section:'backup', title:'Import planu', desc:planPreview.items.length+' ćwiczeń z '+planPreview.name });
        return st;
      });
      setPlanPreview(null);
      toast('Plan zaimportowany ✓', 'success');
    }

    var imported = store.importedPlans || [];

    return _h('div', { className:'fade-in' },
      _h('div', { className:'page-hdr' },
        _h('div', null,
          _h('h1', null, '💾 Kopia i eksport'),
          _h('p', null, 'Zabezpiecz dane i przenoś plany treningowe')
        ),
        _h('div', null)
      ),

      // ukryte inputy plików
      _h('input', { ref:backupInput, type:'file', accept:'.json,application/json', style:{ display:'none' }, onChange:onBackupFile }),
      _h('input', { ref:planInput, type:'file', accept:'.csv,.xlsx,text/csv', style:{ display:'none' }, onChange:onPlanFile }),

      // ── KOPIA ZAPASOWA ───────────────────────────────────────────────────
      _h('div', { className:'card', style:{ marginBottom:14 } },
        _h('div', { style:{ fontWeight:700, fontSize:'1rem', marginBottom:4 } }, '🗄 Kopia zapasowa danych'),
        _h('div', { style:{ fontSize:'.78rem', color:'var(--t2)', lineHeight:1.5, marginBottom:12 } },
          'Pamięć przeglądarki (localStorage) bywa zawodna. Regularnie pobieraj kopię wszystkich danych i trzymaj ją w bezpiecznym miejscu.'),

        _h('div', { style:{ display:'flex', gap:5, flexWrap:'wrap', marginBottom:12 } },
          countSummary(store).map(function(c,i){
            return _h('span', { key:i, className:'chip', style:{ fontSize:'.66rem' } }, c[0]+': '+c[1]);
          })
        ),

        _h('div', { style:{ display:'flex', gap:8, flexWrap:'wrap' } },
          _h('button', { className:'btn btn-primary', onClick:exportBackup }, '⬇️ Eksportuj kopię (.json)'),
          _h('button', { className:'btn btn-secondary', onClick:function(){ backupInput.current && backupInput.current.click(); } }, '⬆️ Importuj kopię')
        ),

        pending && _h('div', { style:{ marginTop:14, padding:'12px 14px', background:'var(--yellow-d)', border:'1px solid var(--yellow)', borderRadius:'var(--r2)' } },
          _h('div', { style:{ fontWeight:700, color:'var(--yellow)', marginBottom:6, fontSize:'.85rem' } }, '⚠️ Jak wczytać kopię?'),
          _h('div', { style:{ fontSize:'.78rem', color:'var(--t2)', lineHeight:1.5, marginBottom:10 } },
            _h('b', null, 'Zastąp'), ' — usuwa obecne dane i wstawia te z kopii. ',
            _h('b', null, 'Scal'), ' — łączy wpisy z kopii z obecnymi (bez duplikatów wg id).'),
          _h('div', { style:{ display:'flex', gap:8, flexWrap:'wrap' } },
            _h('button', { className:'btn btn-danger btn-sm', onClick:function(){ applyPending('replace'); } }, 'Zastąp wszystko'),
            _h('button', { className:'btn btn-primary btn-sm', onClick:function(){ applyPending('merge'); } }, 'Scal'),
            _h('button', { className:'btn btn-ghost btn-sm', onClick:function(){ setPending(null); } }, 'Anuluj')
          )
        )
      ),

      // ── PLAN TRENINGOWY ──────────────────────────────────────────────────
      _h('div', { className:'card', style:{ marginBottom:14 } },
        _h('div', { style:{ fontWeight:700, fontSize:'1rem', marginBottom:4 } }, '📋 Plan treningowy (CSV / Excel)'),
        _h('div', { style:{ fontSize:'.78rem', color:'var(--t2)', lineHeight:1.5, marginBottom:12 } },
          'Eksportuj swoje plany do arkusza lub wczytaj plan z pliku. Kolumny: '+PLAN_COLUMNS.join(', ')+'.'),

        _h('div', { style:{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:8 } },
          _h('button', { className:'btn btn-secondary btn-sm', onClick:exportPlanCSV }, '⬇️ Plany → CSV'),
          _h('button', { className:'btn btn-secondary btn-sm', onClick:exportPlanXLSX }, '⬇️ Plany → Excel (.xlsx)'),
          _h('button', { className:'btn btn-primary btn-sm', onClick:function(){ planInput.current && planInput.current.click(); } }, '⬆️ Importuj plan (CSV)')
        ),

        planPreview && _h('div', { style:{ marginTop:8, padding:'12px 14px', background:'var(--s3)', border:'1px solid var(--a)', borderRadius:'var(--r2)' } },
          _h('div', { style:{ fontWeight:700, marginBottom:6, fontSize:'.85rem' } }, '👀 Podgląd importu'),
          _h('div', { style:{ fontSize:'.78rem', color:'var(--t2)', marginBottom:10 } },
            planPreview.items.length+' ćwiczeń · '+planPreview.weekCount+' tyg. · '+planPreview.dayCount+' dni'),
          _h('div', { style:{ maxHeight:140, overflowY:'auto', marginBottom:10 } },
            planPreview.items.slice(0,8).map(function(it,i){
              return _h('div', { key:i, style:{ fontSize:'.72rem', color:'var(--t2)', padding:'2px 0' } },
                'T'+(it.week||'?')+'/D'+(it.day||'?')+' · '+it.name+' · '+(it.sets||'?')+'×'+(it.reps||'?'));
            }),
            planPreview.items.length>8 && _h('div', { style:{ fontSize:'.7rem', color:'var(--t3)', marginTop:4 } }, '… i '+(planPreview.items.length-8)+' więcej')
          ),
          _h('div', { style:{ display:'flex', gap:8 } },
            _h('button', { className:'btn btn-primary btn-sm', onClick:confirmPlanImport }, 'Zapisz plan'),
            _h('button', { className:'btn btn-ghost btn-sm', onClick:function(){ setPlanPreview(null); } }, 'Anuluj')
          )
        ),

        imported.length>0 && _h('div', { style:{ marginTop:14 } },
          _h('div', { style:{ fontSize:'.7rem', fontWeight:700, color:'var(--t3)', textTransform:'uppercase', letterSpacing:'.05em', marginBottom:8 } }, 'Zaimportowane plany'),
          imported.map(function(p) {
            return _h('div', { key:p.id, style:{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'8px 0', borderBottom:'1px solid var(--b1)' } },
              _h('div', null,
                _h('div', { style:{ fontWeight:600, fontSize:'.82rem' } }, p.name),
                _h('div', { style:{ fontSize:'.7rem', color:'var(--t3)' } }, (p.items?p.items.length:0)+' ćwiczeń · '+ET.fmtDate(p.importedAt))
              ),
              _h('button', { className:'btn btn-ghost btn-sm', style:{ color:'var(--red)' }, onClick:function(){
                update(function(s){ return Object.assign({}, s, { importedPlans:(s.importedPlans||[]).filter(function(x){ return x.id!==p.id; }) }); });
              } }, '✕')
            );
          })
        )
      )
    );
  }

  ET.BackupModule = BackupModule;
})();
