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

  Object.assign(ET, {
    SharedExercisesLoader: SharedExercisesLoader,
    addSharedExercise: addSharedExercise,
    useSharedExercisesVersion: useSharedExercisesVersion
  });
})();
