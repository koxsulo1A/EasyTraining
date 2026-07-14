(function() {
  'use strict';
  window.ET = window.ET || {};

  function exportAI(store) {
    var cutoff = new Date(); cutoff.setDate(cutoff.getDate()-30);
    var ff = function(d){ return new Date(d+'T12:00') >= cutoff; };
    var payload = {
      exportDate: new Date().toISOString(),
      periodDays: 30,
      app: 'EasyTraining',
      instructions: [
        'Przeanalizuj dane treningowe użytkownika z ostatnich 30 dni.',
        'Dostarcz spersonalizowane zalecenia dotyczące:',
        '1. Optymalizacji planu treningowego (objętość, intensywność, regeneracja)',
        '2. Diety i suplementacji w kontekście celów',
        '3. Jakości snu i gotowości do treningu',
        '4. Progresji w ćwiczeniach siłowych (1RM, wolumen)',
        '5. Trendów zdrowotnych (pomiary, samopoczucie)',
        'Odpowiadaj po polsku. Bądź konkretny i oparty na danych.',
      ].join('\n'),
      profile: store.profile,
      workouts: (store.workouts||[]).filter(function(w){ return ff(w.date); }),
      runs: (store.runs||[]).filter(function(r){ return ff(r.date); }),
      sleepSessions: (store.sleepSessions||[]).filter(function(s){ return ff(s.date); }),
      saunaSessions: (store.saunaSessions||[]).filter(function(s){ return ff(s.date); }),
      dietEntries: (store.dietEntries||[]).filter(function(e){ return ff(e.date); }),
      measurements: (store.measurements||[]).filter(function(m){ return ff(m.date); }),
      wellbeingEntries: (store.wellbeingEntries||[]).filter(function(e){ return ff(e.date); }),
      painEntries: (store.painEntries||[]).filter(function(e){ return ff(e.date); }),
      goals: store.goals||[],
      supplements: store.supplements||[],
      competitions: (store.competitions||[]).filter(function(c){ return c.date&&ff(c.date)||c.status==='upcoming'; }),
    };
    var blob = new Blob([JSON.stringify(payload, null, 2)], { type:'application/json' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url; a.download = 'easytraining-ai-'+ET.dstr()+'.json'; a.click();
    URL.revokeObjectURL(url);
  }

  ET.exportAI = exportAI;
})();
