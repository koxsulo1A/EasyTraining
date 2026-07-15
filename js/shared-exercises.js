(function() {
  'use strict';
  window.ET = window.ET || {};
  var _h = React.createElement;

  // Ćwiczenia dodane przez administratora na stronie webowej (tabela
  // shared_exercises w Supabase) — widoczne dla wszystkich zalogowanych,
  // scalane z lokalną (offline) bazą EXERCISES_BASIC, żeby pickery/kreator/
  // biblioteka pokazywały je bez żadnych dodatkowych zmian.

  var listeners = [];
  function notify() { listeners.slice().forEach(function(fn){ fn(); }); }
  function useSharedExercisesVersion() {
    var s = React.useState(0); var v = s[0], setV = s[1];
    React.useEffect(function() {
      function onChange() { setV(function(n){ return n+1; }); }
      listeners.push(onChange);
      return function() { listeners = listeners.filter(function(f){ return f !== onChange; }); };
    }, []);
    return v;
  }

  function mergeIntoBasic(rows) {
    var basic = ET.EXERCISES_BASIC || (ET.EXERCISES_BASIC = []);
    var existing = {}; basic.forEach(function(e){ existing[e.id] = true; });
    rows.forEach(function(row) {
      var id = 'shared_' + row.id;
      if (existing[id]) return;
      var ex = Object.assign({}, row.data || {}, { id:id, name:row.name, source:'web' });
      basic.push(ex);
      existing[id] = true;
    });
    if (ET.EXERCISES_CORRECTIVE) ET.EXERCISES = (ET.EXERCISES_BASIC||[]).concat(ET.EXERCISES_CORRECTIVE);
    notify();
  }

  function SharedExercisesLoader() {
    var loadedRef = React.useRef(false);
    React.useEffect(function() {
      if (!ET.supabase || loadedRef.current) return;
      loadedRef.current = true;
      ET.supabase.from('shared_exercises').select('*').then(function(res) {
        if (res.error) { console.warn('[shared-exercises] load error:', res.error); return; }
        if (res.data && res.data.length) mergeIntoBasic(res.data);
      });
    }, []);
    return null;
  }

  // exFields: { name, tags:[tag], equipment, difficulty, instructions, common_mistakes, isUnilateral, measurementType }
  function addSharedExercise(exFields) {
    if (!ET.supabase) return Promise.reject(new Error('Brak połączenia z serwerem'));
    return ET.supabase.from('shared_exercises').insert({ name: exFields.name, data: exFields }).select().single()
      .then(function(res) {
        if (res.error) throw res.error;
        mergeIntoBasic([res.data]);
        return res.data;
      });
  }

  // Import wielu ćwiczeń naraz (CSV) — jeden zbiorczy insert zamiast N pojedynczych.
  function addSharedExercisesBulk(list) {
    if (!ET.supabase) return Promise.reject(new Error('Brak połączenia z serwerem'));
    if (!list || !list.length) return Promise.resolve([]);
    var rows = list.map(function(exFields){ return { name: exFields.name, data: exFields }; });
    return ET.supabase.from('shared_exercises').insert(rows).select()
      .then(function(res) {
        if (res.error) throw res.error;
        mergeIntoBasic(res.data || []);
        return res.data;
      });
  }

  // Parsuje CSV: nazwa,grupa,sprzet,trudnosc,opis,bledy,jednostronne,pomiar
  function parseExerciseCsv(text) {
    var lines = text.split(/\r?\n/).map(function(l){ return l.trim(); }).filter(Boolean);
    var out = [], errors = [];
    lines.slice(1).forEach(function(line, i) {
      var cols = line.split(',').map(function(c){ return c.trim().replace(/^"|"$/g,''); });
      var name = cols[0];
      if (!name) { errors.push('Wiersz '+(i+2)+': brak nazwy'); return; }
      out.push({
        name: name,
        type: 'podstawowe',
        tags: [cols[1] || 'core_brzuch'],
        equipment: cols[2] || '',
        difficulty: +cols[3] || 1,
        instructions: cols[4] || '',
        common_mistakes: cols[5] || '',
        isUnilateral: /^(tak|true|1)$/i.test(cols[6]||''),
        measurementType: /^sec/i.test(cols[7]||'') ? 'seconds' : 'reps'
      });
    });
    return { rows: out, errors: errors };
  }

  Object.assign(ET, {
    SharedExercisesLoader: SharedExercisesLoader,
    addSharedExercise: addSharedExercise,
    addSharedExercisesBulk: addSharedExercisesBulk,
    parseExerciseCsv: parseExerciseCsv,
    useSharedExercisesVersion: useSharedExercisesVersion
  });
})();
