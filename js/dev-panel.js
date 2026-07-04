(function() {
  'use strict';
  window.ET = window.ET || {};
  var _h = React.createElement;

  // ── SEEDED PRNG (LCG) ─────────────────────────────────────────────────────
  function Rand(seed) {
    var s = (((seed || 42) & 0xffffffff) >>> 0) + 1;
    return {
      next: function(){ s = ((s * 1664525 + 1013904223) & 0xffffffff) >>> 0; return s / 4294967296; },
      int:  function(lo, hi){ return lo + Math.floor(this.next()*(hi-lo+1)); },
      f:    function(lo, hi){ return lo + this.next()*(hi-lo); },
      bool: function(p){ return this.next() < (p===undefined?0.5:p); },
      pick: function(arr){ return arr[Math.floor(this.next()*arr.length)]; },
      gauss:function(mu, sig){ var u=this.next()||0.001, v=this.next()||0.001; return mu+sig*Math.sqrt(-2*Math.log(u))*Math.cos(6.2832*v); }
    };
  }

  // ── ATHLETE PROFILES ──────────────────────────────────────────────────────
  var PROFILES = {
    beginner: {
      label:'Początkujący', icon:'🌱', desc:'6 mies. treningu, 2-3x/tydz.',
      str:{ bench:45, dead:65, squat:55, ohp:32, row:42, gain:1.8 },
      run:{ pace:395, dist:3.0, paceGain:-3, distGain:0.1 },
      weight:82, weightChange:-0.20, sleep:{avg:6.8, var:1.2},
      trainDays:[1,3,5], runDays:[6], saunaDays:[], painChance:0.04
    },
    intermediate: {
      label:'Średniozaawansowany', icon:'💪', desc:'2-3 lata, 3-4x/tydz.',
      str:{ bench:88, dead:130, squat:105, ohp:58, row:72, gain:0.55 },
      run:{ pace:330, dist:7.5, paceGain:-1.5, distGain:0.25 },
      weight:78, weightChange:-0.05, sleep:{avg:7.2, var:0.9},
      trainDays:[1,2,4,5], runDays:[3,6], saunaDays:[2,5], painChance:0.06
    },
    advanced: {
      label:'Zaawansowany', icon:'🏆', desc:'5+ lat, 4-5x/tydz.',
      str:{ bench:132, dead:195, squat:162, ohp:88, row:100, gain:0.18 },
      run:{ pace:292, dist:10, paceGain:-0.5, distGain:0.08 },
      weight:84, weightChange:0.04, sleep:{avg:7.8, var:0.6},
      trainDays:[1,2,4,5,6], runDays:[3], saunaDays:[0,3,6], painChance:0.08
    },
    powerlifter: {
      label:'Trójboista', icon:'🏋️', desc:'Specjalista siłowy, ciężkie obciążenia.',
      str:{ bench:145, dead:225, squat:205, ohp:80, row:92, gain:0.22 },
      run:{ pace:null, dist:0, paceGain:0, distGain:0 },
      weight:92, weightChange:0.15, sleep:{avg:7.5, var:0.8},
      trainDays:[1,2,4,5], runDays:[], saunaDays:[3,6], painChance:0.12
    },
    bodybuilder: {
      label:'Kulturysta', icon:'🦾', desc:'Hipertrofia, 5x/tydz.',
      str:{ bench:105, dead:145, squat:130, ohp:70, row:85, gain:0.30 },
      run:{ pace:360, dist:4, paceGain:-1, distGain:0.1 },
      weight:86, weightChange:0.10, sleep:{avg:7.6, var:0.7},
      trainDays:[1,2,3,4,5], runDays:[6], saunaDays:[3,0], painChance:0.07
    },
    marathonRunner: {
      label:'Maratończyk', icon:'🏃', desc:'Specjalista biegowy, 4-5 biegów/tydz.',
      str:{ bench:62, dead:82, squat:70, ohp:42, row:52, gain:0.08 },
      run:{ pace:302, dist:14, paceGain:-2.2, distGain:0.8 },
      weight:68, weightChange:-0.08, sleep:{avg:8.0, var:0.5},
      trainDays:[2,5], runDays:[1,3,4,6,0], saunaDays:[0,3], painChance:0.08
    },
    hybrid: {
      label:'Hybrid Athlete', icon:'⚡', desc:'Siła + bieganie, równowaga.',
      str:{ bench:100, dead:150, squat:125, ohp:65, row:80, gain:0.35 },
      run:{ pace:318, dist:9, paceGain:-1.8, distGain:0.45 },
      weight:77, weightChange:-0.02, sleep:{avg:7.5, var:0.7},
      trainDays:[1,3,5], runDays:[2,4,6], saunaDays:[0,3], painChance:0.07
    },
    weightLoss: {
      label:'Redukcja', icon:'🔥', desc:'Cel: -10kg, kardio + siłownia.',
      str:{ bench:65, dead:90, squat:75, ohp:42, row:55, gain:0.45 },
      run:{ pace:370, dist:5, paceGain:-2, distGain:0.3 },
      weight:95, weightChange:-0.35, sleep:{avg:6.5, var:1.3},
      trainDays:[1,3,5], runDays:[2,4,6], saunaDays:[0,4], painChance:0.06
    },
    injured: {
      label:'Kontuzjowany', icon:'🤕', desc:'Aktywny ból kolana i barku.',
      str:{ bench:78, dead:110, squat:85, ohp:44, row:60, gain:0.05 },
      run:{ pace:380, dist:4, paceGain:0.5, distGain:-0.05 },
      weight:80, weightChange:0.10, sleep:{avg:6.2, var:1.5},
      trainDays:[1,4], runDays:[6], saunaDays:[2,5], painChance:0.55
    },
    overtrained: {
      label:'Przetrenowany', icon:'😵', desc:'Za dużo za szybko — sygnały ostrzegawcze.',
      str:{ bench:92, dead:138, squat:110, ohp:60, row:74, gain:-0.05 },
      run:{ pace:310, dist:11, paceGain:1.5, distGain:0.5 },
      weight:75, weightChange:-0.40, sleep:{avg:5.8, var:1.8},
      trainDays:[1,2,3,4,5,6], runDays:[0,3], saunaDays:[], painChance:0.20
    }
  };

  // ── EXERCISE TEMPLATES PER PLAN TYPE ─────────────────────────────────────
  var GEN_PLANS = [
    { name:'Góra / Siła', id:'pon_gora_sila',
      exs:[ {n:'Wyciskanie sztangi', s:5, r:5, rel:'bench', ratio:1.0},
             {n:'Podciąganie + Maszyna', s:5, r:6, rel:null, base:0},
             {n:'Wyciskanie hantli skos', s:3, r:8, rel:'bench', ratio:0.22},
             {n:'Wiosło maszyna', s:4, r:8, rel:'row', ratio:1.0},
             {n:'Face pull', s:3, r:15, rel:null, base:17},
             {n:'Biceps hantle', s:3, r:10, rel:null, base:10} ] },
    { name:'Dół + Core', id:'sr_dol_core',
      exs:[ {n:'Hip Thrust', s:4, r:10, rel:'squat', ratio:0.5},
             {n:'RDL', s:3, r:8, rel:'dead', ratio:0.55},
             {n:'Split Squat', s:3, r:8, rel:null, base:10},
             {n:'Plank', s:3, r:40, rel:null, base:0},
             {n:'Dead Bug', s:3, r:10, rel:null, base:0} ] },
    { name:'Góra / Hipertrofia', id:'pt_gora_hiper',
      exs:[ {n:'Hantle skos', s:3, r:10, rel:'bench', ratio:0.24},
             {n:'Ściąganie drążka', s:3, r:10, rel:'row', ratio:0.72},
             {n:'Wiosło jednorącz', s:3, r:12, rel:'row', ratio:0.28},
             {n:'Rozpiętki', s:3, r:15, rel:'bench', ratio:0.10},
             {n:'Biceps', s:3, r:12, rel:null, base:10},
             {n:'Triceps', s:3, r:12, rel:null, base:18},
             {n:'Y-raise', s:3, r:15, rel:null, base:3} ] },
    { name:'FullBody', id:'sob_fullbody',
      exs:[ {n:'Przysiad', s:3, r:10, rel:'squat', ratio:0.85},
             {n:'Wyciskanie sztangi', s:3, r:8, rel:'bench', ratio:0.90},
             {n:'Martwy ciąg', s:2, r:5, rel:'dead', ratio:0.90},
             {n:'Wiosło maszyna', s:3, r:10, rel:'row', ratio:0.90},
             {n:'OHP', s:3, r:8, rel:'ohp', ratio:1.0} ] }
  ];

  // ── DATA GENERATOR ────────────────────────────────────────────────────────
  var DataGenerator = {
    generate: function(profileId, days, seed, mode) {
      var profile = PROFILES[profileId] || PROFILES.intermediate;
      var rng = Rand(seed || 42);
      var today = new Date(); today.setHours(12,0,0,0);
      var data = { workouts:[], runs:[], sleepSessions:[], wellbeingEntries:[],
                   painEntries:[], saunaSessions:[], measurements:[], goals:[], weekPlans:[] };

      var workoutIdx = 0, runIdx = 0;

      for (var d = days; d >= 0; d--) {
        var date = new Date(today.getTime() - d * 86400000);
        var dateStr = date.toISOString().slice(0,10);
        var dow = (date.getDay() + 6) % 7; // 0=Mon…6=Sun
        var isTrainDay = profile.trainDays.indexOf(date.getDay()) !== -1;
        var isRunDay   = profile.runDays.indexOf(date.getDay()) !== -1;
        var isSaunaDay = profile.saunaDays.indexOf(date.getDay()) !== -1;

        // Sleep (every day)
        var sleepH = Math.max(3, Math.min(12, rng.gauss(profile.sleep.avg, profile.sleep.var/2)));
        var sleepReadiness = Math.round(Math.max(0, Math.min(100, rng.gauss(65, 18))));
        if (sleepH >= 8) sleepReadiness = Math.min(100, sleepReadiness + 15);
        if (sleepH < 6)  sleepReadiness = Math.max(0,   sleepReadiness - 20);
        data.sleepSessions.push({ id:date.getTime()-1, date:dateStr,
          duration:Math.round(sleepH*10)/10, readiness:sleepReadiness, quality:rng.int(1,5) });

        // Workout
        if (isTrainDay && rng.bool(0.88)) {
          var wResult = DataGenerator._genWorkout(profile, workoutIdx, dateStr, rng);
          data.workouts.push(wResult.workout);
          // Pre-workout wellbeing
          data.wellbeingEntries.push({ id:date.getTime()-100, date:dateStr,
            tag:'przed treningiem', energy:rng.int(4,9), mood:rng.int(4,9), stress:rng.int(1,6), motivation:rng.int(5,10) });
          // Post-workout wellbeing
          var postEnergy = Math.max(1, Math.min(10, rng.gauss(7.5, 1.5)));
          data.wellbeingEntries.push({ id:date.getTime()-50, date:dateStr,
            tag:'po treningu', energy:Math.round(postEnergy), mood:rng.int(6,10), stress:rng.int(1,4), motivation:rng.int(6,10) });
          workoutIdx++;
        }

        // Run
        if (isRunDay && profile.run.pace && rng.bool(0.85)) {
          data.runs.push(DataGenerator._genRun(profile, runIdx, dateStr, rng));
          runIdx++;
        }

        // Sauna
        if (isSaunaDay && rng.bool(0.70)) {
          data.saunaSessions.push({ id:date.getTime()-200, date:dateStr,
            duration:rng.int(25, 60), temp:rng.int(80, 100), type:'Fińska',
            notes:rng.bool(0.3)?'Świetna regeneracja':'', humidity:rng.int(10,40) });
        }

        // Pain (random, higher chance for injured/overtrained)
        if (rng.bool(profile.painChance)) {
          var painZones = ['bark_l','bark_p','klatka','kolan_l','kolan_p','plecy_d','plecy_g','biodro_l'];
          data.painEntries.push({ id:date.getTime()-300, date:dateStr,
            zone:rng.pick(painZones), intensity:rng.int(2, profileId==='injured'?8:profileId==='overtrained'?7:5),
            notes:rng.bool(0.4)?'Po treningu':'', label:rng.pick(['Ból ostry','Ból tępy','Dyskomfort']) });
        }

        // Measurements (every ~14 days)
        if (d % 14 === 0) {
          var weeksSince = (days - d) / 7;
          var w = profile.weight + weeksSince * profile.weightChange + rng.gauss(0, 0.3);
          data.measurements.push({ id:date.getTime()-400, date:dateStr,
            weight:Math.round(w*10)/10,
            chest:Math.round((rng.gauss(100, 3) + weeksSince * (profile.weightChange > 0 ? 0.15 : -0.1))*10)/10,
            waist:Math.round((rng.gauss(83, 4)  + weeksSince * (profile.weightChange > 0 ? 0.10 : -0.20))*10)/10,
            hips: Math.round((rng.gauss(98, 3))*10)/10,
            bicep:Math.round((rng.gauss(34, 2) + weeksSince * 0.05)*10)/10,
            thigh:Math.round((rng.gauss(56, 3))*10)/10,
            calf: Math.round((rng.gauss(38, 2))*10)/10 });
        }
      }

      // Goals
      data.goals = DataGenerator._genGoals(profile);

      // Sort descending by date (newest first)
      data.workouts.sort(function(a,b){return b.date.localeCompare(a.date);});
      data.runs.sort(function(a,b){return b.date.localeCompare(a.date);});
      data.sleepSessions.sort(function(a,b){return b.date.localeCompare(a.date);});
      data.wellbeingEntries.sort(function(a,b){return b.date.localeCompare(a.date);});
      data.saunaSessions.sort(function(a,b){return b.date.localeCompare(a.date);});
      data.measurements.sort(function(a,b){return b.date.localeCompare(a.date);});
      return data;
    },

    _genWorkout: function(profile, idx, dateStr, rng) {
      var planDef = GEN_PLANS[idx % GEN_PLANS.length];
      var prevPRs = {};
      var exercises = planDef.exs.map(function(ex) {
        var baseW = ex.rel === 'bench' ? profile.str.bench :
                    ex.rel === 'dead'  ? profile.str.dead  :
                    ex.rel === 'squat' ? profile.str.squat :
                    ex.rel === 'ohp'   ? profile.str.ohp   :
                    ex.rel === 'row'   ? profile.str.row   : (ex.base||0);
        var progress = 1 + (idx * profile.str.gain) / Math.max(baseW, 1) / 20;
        var w = Math.max(0, Math.round(baseW * (ex.ratio||1) * progress / 2.5) * 2.5);
        var noise = rng.gauss(0, 0.04);
        w = Math.max(0, Math.round((w * (1 + noise)) / 2.5) * 2.5);
        var setsData = [];
        for (var si = 0; si < ex.s; si++) {
          var repVar = rng.bool(0.7) ? ex.r : ex.r + rng.int(-1, 2);
          setsData.push({ id:si, reps:Math.max(1, repVar), weight:w, done:true });
        }
        return { name:ex.n, sets:ex.s, reps:ex.r, weight:w, setsData:setsData };
      });

      var volume = exercises.reduce(function(t, e) {
        return t + e.setsData.reduce(function(st, s){ return st + s.reps*s.weight; }, 0);
      }, 0);
      var totalReps = exercises.reduce(function(t, e) {
        return t + e.setsData.reduce(function(st, s){ return st + s.reps; }, 0);
      }, 0);

      var prs = [];
      if (idx > 0 && rng.bool(0.20)) {
        var prEx = rng.pick(exercises.filter(function(e){ return e.weight > 0; }));
        if (prEx) prs.push({ name:prEx.name, e1rm:Math.round(prEx.weight * (1 + prEx.setsData[0].reps/30) * 10)/10 });
      }

      var durMin = rng.int(45, 90);
      return {
        workout: {
          id: Date.now() - Math.random()*1e9,
          date: dateStr,
          name: planDef.name,
          planId: planDef.id,
          duration: durMin * 60000,
          workMs: Math.round(durMin * 0.65) * 60000,
          restMs: Math.round(durMin * 0.35) * 60000,
          volume: volume,
          totalReps: totalReps,
          exercises: exercises,
          prs: prs,
          readiness: { willingness:rng.int(1,3), state:rng.int(1,3), fatigue:rng.int(1,3) }
        }
      };
    },

    _genRun: function(profile, idx, dateStr, rng) {
      if (!profile.run.pace) return null;
      var pace = Math.max(200, profile.run.pace + idx * profile.run.paceGain + rng.gauss(0, 10));
      var dist = Math.max(1, profile.run.dist + idx * profile.run.distGain + rng.gauss(0, 1));
      dist = Math.round(dist * 10) / 10;
      pace = Math.round(pace);
      var durMin = Math.round(dist * pace / 60);
      var fmtPace = Math.floor(pace/60) + ':' + String(Math.floor(pace%60)).padStart(2,'0');
      var types = ['easy','easy','easy','tempo','long','intervals','recovery'];
      return {
        id: Date.now() - Math.random()*1e9,
        date: dateStr,
        type: idx % 4 === 0 ? 'long' : idx % 7 === 0 ? 'intervals' : 'easy',
        distance: dist,
        duration: durMin,
        pace: fmtPace,
        avgHr: rng.int(130, 175),
        elevation: rng.int(0, 80),
        readiness: { willingness:rng.int(1,3), state:rng.int(1,3), fatigue:rng.int(1,3) },
        notes: ''
      };
    },

    _genGoals: function(profile) {
      var goals = [
        { id:Date.now()+1, title:'Bench Press '+Math.round(profile.str.bench*1.3)+'kg', term:'medium', target:Math.round(profile.str.bench*1.3), unit:'kg', deadline:'', progress:Math.round(profile.str.bench/(profile.str.bench*1.3)*100), workouts:['pon_gora_sila'] },
        { id:Date.now()+2, title:'Martwy Ciąg '+Math.round(profile.str.dead*1.2)+'kg', term:'long', target:Math.round(profile.str.dead*1.2), unit:'kg', deadline:'', progress:Math.round(profile.str.dead/(profile.str.dead*1.2)*100), workouts:[] },
        { id:Date.now()+3, title:'Waga docelowa '+(profile.weight+profile.weightChange*20).toFixed(0)+'kg', term:'medium', target:(profile.weight+profile.weightChange*20).toFixed(1), unit:'kg', deadline:'', progress:40, workouts:[] }
      ];
      if (profile.run.pace) {
        goals.push({ id:Date.now()+4, title:'Przebiegnąć 10 km', term:'short', target:10, unit:'km', deadline:'', progress:35, workouts:[] });
      }
      return goals;
    }
  };

  // ── AI TEST RUNNER ────────────────────────────────────────────────────────
  var AITestRunner = {
    run: function(store) {
      if (typeof ET.AIEngine === 'undefined') return { error:'ET.AIEngine not loaded' };
      var t0 = Date.now();
      var results = {};
      try { results.recovery    = ET.AIEngine.recovery(store); } catch(e){ results.recovery = {error:e.message}; }
      try { results.stagnation  = ET.AIEngine.detectStagnation(store); } catch(e){ results.stagnation = {error:e.message}; }
      try { results.correlations= ET.AIEngine.correlations(store); } catch(e){ results.correlations = {error:e.message}; }
      try { results.weeklyReport= ET.AIEngine.report('weekly', store); } catch(e){ results.weeklyReport = {error:e.message}; }
      try { results.monthlyReport=ET.AIEngine.report('monthly', store); } catch(e){ results.monthlyReport = {error:e.message}; }
      try { results.runTimes    = ET.AIEngine.predictRunTimes(store); } catch(e){ results.runTimes = {error:e.message}; }
      try {
        var w = (store.workouts||[])[0];
        results.workoutAnalysis = w ? ET.AIEngine.analyzeWorkout(w, store) : [];
      } catch(e){ results.workoutAnalysis = {error:e.message}; }
      results._execMs = Date.now() - t0;
      return results;
    }
  };

  // ── DEV PANEL UI ──────────────────────────────────────────────────────────
  function DevPanel() {
    var su = ET.useStore(); var store = su.store, update = su.update;
    var nav = ET.useNav(); var navigate = nav.navigate;
    var toast = ET.useToast();

    var tbs = React.useState('dashboard'); var tab = tbs[0]; var setTab = tbs[1];
    var gps = React.useState('intermediate'); var genProfile = gps[0]; var setGenProfile = gps[1];
    var gds = React.useState(90); var genDays = gds[0]; var setGenDays = gds[1];
    var gss = React.useState(42); var genSeed = gss[0]; var setGenSeed = gss[1];
    var ais = React.useState(null); var aiResults = ais[0]; var setAiResults = ais[1];
    var dbs = React.useState('workouts'); var dbCol = dbs[0]; var setDbCol = dbs[1];
    var cms = React.useState(null); var confirmAction = cms[0]; var setConfirmAction = cms[1];
    var lgs = React.useState([]); var logs = lgs[0]; var setLogs = lgs[1];

    var LOG_LIMIT = 200;

    React.useEffect(function() {
      var orig = console.log.bind(console);
      console.log = function() {
        orig.apply(console, arguments);
        var msg = Array.from(arguments).map(function(a){ try{return typeof a==='object'?JSON.stringify(a):String(a);}catch(e){return String(a);} }).join(' ');
        setLogs(function(prev){ return [{t:new Date().toLocaleTimeString('pl-PL'), msg:msg, lvl:'log'}].concat(prev).slice(0, LOG_LIMIT); });
      };
      var origE = console.error.bind(console);
      console.error = function() {
        origE.apply(console, arguments);
        var msg = Array.from(arguments).map(String).join(' ');
        setLogs(function(prev){ return [{t:new Date().toLocaleTimeString('pl-PL'), msg:msg, lvl:'error'}].concat(prev).slice(0, LOG_LIMIT); });
      };
    }, []);

    function applyData(generated, mode) {
      update(function(s) {
        if (mode === 'replace') {
          return Object.assign({}, s, {
            workouts: generated.workouts,
            runs: generated.runs,
            sleepSessions: generated.sleepSessions,
            wellbeingEntries: generated.wellbeingEntries,
            painEntries: generated.painEntries,
            saunaSessions: generated.saunaSessions,
            measurements: generated.measurements,
            goals: generated.goals
          });
        }
        return Object.assign({}, s, {
          workouts: generated.workouts.concat(s.workouts||[]),
          runs: generated.runs.concat(s.runs||[]),
          sleepSessions: generated.sleepSessions.concat(s.sleepSessions||[]),
          wellbeingEntries: generated.wellbeingEntries.concat(s.wellbeingEntries||[]),
          painEntries: generated.painEntries.concat(s.painEntries||[]),
          saunaSessions: generated.saunaSessions.concat(s.saunaSessions||[]),
          measurements: generated.measurements.concat(s.measurements||[]),
          goals: (s.goals||[]).concat(generated.goals)
        });
      });
    }

    function quickGenerate(profileId, days) {
      var t0 = Date.now();
      var data = DataGenerator.generate(profileId, days, genSeed);
      var mode = (store.workouts||[]).length === 0 ? 'replace' : 'append';
      if ((store.workouts||[]).length > 0) {
        setConfirmAction({ profileId:profileId, days:days, data:data });
        return;
      }
      applyData(data, 'replace');
      toast('Wygenerowano '+data.workouts.length+' treningów, '+data.runs.length+' biegów w '+(Date.now()-t0)+'ms ✓', 'success');
    }

    function generateCustom(mode) {
      var t0 = Date.now();
      var data = DataGenerator.generate(genProfile, genDays, genSeed);
      applyData(data, mode);
      setConfirmAction(null);
      toast('Wygenerowano '+data.workouts.length+' treningów, '+data.runs.length+' biegów w '+(Date.now()-t0)+'ms ✓', 'success');
    }

    function clearDatabase() {
      if (!confirm('Usunąć WSZYSTKIE dane? Tej operacji nie można cofnąć!')) return;
      update(function(s){ return Object.assign({},s,{ workouts:[], runs:[], sleepSessions:[], wellbeingEntries:[], painEntries:[], saunaSessions:[], measurements:[], goals:[], weekPlans:[] }); });
      toast('Baza danych wyczyszczona', 'default');
    }

    function runAITest() {
      var t0 = Date.now();
      var results = AITestRunner.run(store);
      setAiResults(results);
      toast('Testy AI ukończone w '+(Date.now()-t0)+'ms', 'success');
    }

    // ── HEADER ───────────────────────────────────────────────────────────────
    var TABS = [
      {id:'dashboard', label:'📊 Dashboard'},
      {id:'generator', label:'🎲 Generator'},
      {id:'ai_test',   label:'🤖 AI Test'},
      {id:'database',  label:'🗄 Baza'},
      {id:'logs',      label:'📋 Logi'},
      {id:'settings',  label:'⚙️ Ustawienia'}
    ];

    var colMap = { workouts:'workouts',runs:'runs',sleepSessions:'sleepSessions',wellbeingEntries:'wellbeingEntries',saunaSessions:'saunaSessions',measurements:'measurements',goals:'goals',painEntries:'painEntries' };

    return _h('div', { style:{ minHeight:'100%', background:'var(--bg)' } },
      // ── Top bar
      _h('div', { style:{ position:'sticky', top:0, zIndex:50, background:'var(--s2)', borderBottom:'1px solid var(--b1)', padding:'10px 16px', display:'flex', alignItems:'center', gap:12 } },
        _h('div', { style:{ width:8, height:8, borderRadius:'50%', background:'var(--red)' } }),
        _h('div', { style:{ fontWeight:700, fontSize:'.9rem', flex:1 } }, '🛠 Developer Panel'),
        _h('div', { style:{ fontSize:'.65rem', color:'var(--t3)', fontFamily:'monospace' } }, 'v1.0.0-dev'),
        _h('button', { style:{ padding:'5px 12px', borderRadius:'var(--r2)', border:'1px solid var(--b1)', background:'var(--s3)', color:'var(--t2)', cursor:'pointer', fontSize:'.72rem' },
          onClick:function(){ navigate('profile'); }
        }, '✕ Zamknij')
      ),

      // ── Tab nav
      _h('div', { style:{ display:'flex', gap:4, overflowX:'auto', padding:'8px 16px', background:'var(--s3)', borderBottom:'1px solid var(--b1)' } },
        TABS.map(function(t) {
          return _h('button', { key:t.id,
            style:{ padding:'5px 12px', borderRadius:'var(--r2)', border:'none', background:tab===t.id?'var(--a)':'transparent', color:tab===t.id?'white':'var(--t3)', cursor:'pointer', fontSize:'.72rem', fontWeight:700, whiteSpace:'nowrap', transition:'all .12s' },
            onClick:function(){ setTab(t.id); }
          }, t.label);
        })
      ),

      // ── Confirm dialog
      confirmAction && _h('div', { style:{ position:'fixed', inset:0, background:'rgba(0,0,0,.6)', zIndex:100, display:'flex', alignItems:'center', justifyContent:'center', padding:24 } },
        _h('div', { style:{ background:'var(--s2)', borderRadius:'var(--r3)', padding:24, maxWidth:360, width:'100%' } },
          _h('div', { style:{ fontWeight:700, marginBottom:8 } }, '⚠️ Baza zawiera dane'),
          _h('div', { style:{ fontSize:'.8rem', color:'var(--t2)', marginBottom:20 } }, 'Znaleziono '+((store.workouts||[]).length)+' treningów. Co zrobić z nowymi danymi?'),
          _h('div', { style:{ display:'flex', flexDirection:'column', gap:8 } },
            _h('button', { style:{ padding:'10px', borderRadius:'var(--r2)', border:'none', background:'var(--a)', color:'white', cursor:'pointer', fontWeight:700 },
              onClick:function(){ applyData(confirmAction.data,'append'); setConfirmAction(null); toast('Dane dołączone ✓','success'); }
            }, '➕ Dołącz do istniejących'),
            _h('button', { style:{ padding:'10px', borderRadius:'var(--r2)', border:'1px solid var(--red)', background:'none', color:'var(--red)', cursor:'pointer', fontWeight:700 },
              onClick:function(){ applyData(confirmAction.data,'replace'); setConfirmAction(null); toast('Dane zastąpione ✓','success'); }
            }, '🔄 Zastąp wszystkie dane'),
            _h('button', { style:{ padding:'10px', borderRadius:'var(--r2)', border:'1px solid var(--b1)', background:'none', color:'var(--t3)', cursor:'pointer' },
              onClick:function(){ setConfirmAction(null); }
            }, 'Anuluj')
          )
        )
      ),

      _h('div', { style:{ padding:16 } },

        // ── DASHBOARD ──────────────────────────────────────────────────────
        tab==='dashboard' && _h('div', { className:'fade-in' },
          _h('div', { className:'grid-4', style:{ marginBottom:16 } },
            _h(ET.StatCard, { label:'Treningi', value:(store.workouts||[]).length, color:'var(--a-light)' }),
            _h(ET.StatCard, { label:'Biegi', value:(store.runs||[]).length, color:'var(--green)' }),
            _h(ET.StatCard, { label:'Sen', value:(store.sleepSessions||[]).length, color:'var(--purple)' }),
            _h(ET.StatCard, { label:'Samopoczucie', value:(store.wellbeingEntries||[]).length, color:'var(--yellow)' })
          ),
          _h('div', { className:'grid-4', style:{ marginBottom:20 } },
            _h(ET.StatCard, { label:'Bóle', value:(store.painEntries||[]).length, color:'var(--red)' }),
            _h(ET.StatCard, { label:'Sauna', value:(store.saunaSessions||[]).length, color:'var(--orange)' }),
            _h(ET.StatCard, { label:'Pomiary', value:(store.measurements||[]).length, color:'var(--teal)' }),
            _h(ET.StatCard, { label:'Cele', value:(store.goals||[]).length, color:'var(--pink)' })
          ),
          _h('div', { className:'section-hdr' }, _h('h2', null, '⚡ Szybkie akcje')),
          _h('div', { style:{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 } },
            [
              {l:'30 dni — Średniozaaw.',   icon:'📅', fn:function(){ quickGenerate('intermediate', 30); }},
              {l:'90 dni — Średniozaaw.',   icon:'📆', fn:function(){ quickGenerate('intermediate', 90); }},
              {l:'365 dni — Średniozaaw.',  icon:'📅', fn:function(){ quickGenerate('intermediate', 365); }},
              {l:'Elite Athlete',           icon:'🏆', fn:function(){ quickGenerate('advanced', 365); }},
              {l:'Początkujący 90d',        icon:'🌱', fn:function(){ quickGenerate('beginner', 90); }},
              {l:'Kontuzjowany 60d',        icon:'🤕', fn:function(){ quickGenerate('injured', 60); }},
              {l:'Przetrenowany 90d',       icon:'😵', fn:function(){ quickGenerate('overtrained', 90); }},
              {l:'Maratończyk 180d',        icon:'🏃', fn:function(){ quickGenerate('marathonRunner', 180); }},
              {l:'Trójboista 180d',         icon:'🏋️', fn:function(){ quickGenerate('powerlifter', 180); }},
              {l:'Hybrid 90d',              icon:'⚡', fn:function(){ quickGenerate('hybrid', 90); }},
            ].map(function(btn, i) {
              return _h('button', { key:i,
                style:{ display:'flex', alignItems:'center', gap:8, padding:'10px 12px', borderRadius:'var(--r2)', border:'1px solid var(--b1)', background:'var(--s2)', cursor:'pointer', textAlign:'left', fontSize:'.75rem', fontWeight:600, color:'var(--t1)', transition:'all .12s' },
                onClick:btn.fn
              }, _h('span', {style:{fontSize:'1rem'}}, btn.icon), btn.l);
            })
          ),
          _h('div', { style:{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginTop:8 } },
            _h('button', { style:{ padding:'10px', borderRadius:'var(--r2)', border:'1px solid var(--red)', background:'none', color:'var(--red)', cursor:'pointer', fontSize:'.78rem', fontWeight:700 }, onClick:clearDatabase }, '🗑 Wyczyść bazę danych'),
            _h('button', { style:{ padding:'10px', borderRadius:'var(--r2)', border:'1px solid var(--b1)', background:'none', color:'var(--t2)', cursor:'pointer', fontSize:'.78rem' },
              onClick:function(){
                var exp = JSON.stringify(store, null, 2);
                var blob = new Blob([exp],{type:'application/json'});
                var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download='et_backup_'+Date.now()+'.json'; a.click();
                toast('Backup wyeksportowany ✓','success');
              }
            }, '💾 Eksport JSON')
          )
        ),

        // ── GENERATOR ─────────────────────────────────────────────────────
        tab==='generator' && _h('div', { className:'fade-in' },
          _h('div', { style:{ marginBottom:14 } },
            _h('div', { className:'section-hdr' }, _h('h2', null, 'Profil atlety')),
            _h('div', { style:{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:8 } },
              Object.keys(PROFILES).map(function(pid) {
                var p = PROFILES[pid];
                var isActive = genProfile===pid;
                return _h('button', { key:pid,
                  style:{ display:'flex', alignItems:'center', gap:8, padding:'10px 12px', borderRadius:'var(--r2)', border:'1.5px solid '+(isActive?'var(--a)':'var(--b1)'), background:isActive?'rgba(99,102,241,.1)':'var(--s2)', cursor:'pointer', textAlign:'left', transition:'all .12s' },
                  onClick:function(){ setGenProfile(pid); }
                },
                  _h('span', {style:{fontSize:'1.1rem'}}, p.icon),
                  _h('div', null,
                    _h('div', {style:{fontWeight:700, fontSize:'.78rem', color:isActive?'var(--a-light)':'var(--t1)'} }, p.label),
                    _h('div', {style:{fontSize:'.6rem', color:'var(--t3)'} }, p.desc)
                  )
                );
              })
            )
          ),
          _h('div', { className:'card', style:{ marginBottom:14 } },
            _h('div', { style:{ fontWeight:700, marginBottom:12, fontSize:'.85rem' } }, '⚙️ Konfiguracja'),
            _h('div', { className:'field' },
              _h('label', null, 'Okres: '+genDays+' dni'),
              _h('input', { type:'range', min:7, max:365, value:genDays, onChange:function(e){ setGenDays(+e.target.value); } })
            ),
            _h('div', { className:'field' },
              _h('label', null, 'Ziarno losowości: '+genSeed),
              _h('input', { type:'range', min:1, max:9999, value:genSeed, onChange:function(e){ setGenSeed(+e.target.value); } })
            ),
            _h('div', { style:{ display:'flex', gap:4, flexWrap:'wrap' } },
              [7,30,90,180,365].map(function(d){
                return _h('button', { key:d, style:{ padding:'5px 12px', borderRadius:20, fontSize:'.72rem', fontWeight:700, border:'1px solid '+(genDays===d?'var(--a)':'var(--b1)'), background:genDays===d?'var(--a)':'var(--s3)', color:genDays===d?'white':'var(--t2)', cursor:'pointer' },
                  onClick:function(){ setGenDays(d); }
                }, d+'d');
              })
            )
          ),
          _h('div', { style:{ display:'flex', gap:8 } },
            _h('button', { style:{ flex:1, padding:'12px', borderRadius:'var(--r2)', border:'none', background:'var(--a)', color:'white', cursor:'pointer', fontWeight:700, fontSize:'.85rem' },
              onClick:function(){ quickGenerate(genProfile, genDays); }
            }, '🎲 Generuj dane'),
            _h('button', { style:{ padding:'12px 16px', borderRadius:'var(--r2)', border:'1px solid var(--b1)', background:'var(--s3)', color:'var(--t2)', cursor:'pointer', fontSize:'.8rem' },
              onClick:function(){ setGenSeed(Math.floor(Math.random()*9998)+1); }
            }, '🎰 Losuj seed')
          )
        ),

        // ── AI TEST ───────────────────────────────────────────────────────
        tab==='ai_test' && _h('div', { className:'fade-in' },
          _h('button', { style:{ width:'100%', padding:'12px', borderRadius:'var(--r2)', border:'none', background:'linear-gradient(135deg,var(--purple),var(--a))', color:'white', cursor:'pointer', fontWeight:700, fontSize:'.85rem', marginBottom:16 },
            onClick:runAITest
          }, '🤖 Uruchom wszystkie testy AI'),
          aiResults && _h('div', null,
            _h('div', { style:{ fontSize:'.65rem', color:'var(--t3)', fontFamily:'monospace', marginBottom:10 } }, 'Czas wykonania: '+aiResults._execMs+'ms'),
            // Recovery
            aiResults.recovery && !aiResults.recovery.error && _h('div', { className:'card', style:{ marginBottom:10 } },
              _h('div', { style:{ fontWeight:700, marginBottom:8, fontSize:'.82rem' } }, '🔋 Recovery Engine'),
              _h('div', { style:{ display:'flex', gap:8, alignItems:'center', marginBottom:8 } },
                _h('div', { style:{ fontWeight:700, fontSize:'1.5rem', color:aiResults.recovery.score>=65?'var(--green)':'var(--orange)' } }, aiResults.recovery.score+'%'),
                _h('div', null,
                  _h('div', { style:{ fontSize:'.78rem', color:'var(--t2)' } }, aiResults.recovery.category),
                  _h('div', { style:{ fontSize:'.65rem', color:'var(--t3)' } }, aiResults.recovery.recommendation)
                )
              ),
              _h('div', { style:{ display:'flex', gap:4, flexWrap:'wrap' } },
                (aiResults.recovery.factors||[]).map(function(f,i){
                  return _h('span', { key:i, style:{ fontSize:'.6rem', padding:'2px 6px', borderRadius:20, background:f.color+'22', color:f.color } }, (f.value>0?'+':'')+f.value+' '+f.label);
                })
              )
            ),
            // Stagnation
            aiResults.stagnation && !aiResults.stagnation.error && _h('div', { className:'card', style:{ marginBottom:10 } },
              _h('div', { style:{ fontWeight:700, marginBottom:8, fontSize:'.82rem' } }, '⚠️ Stagnation Detector'),
              _h('div', { style:{ fontSize:'.75rem' } }, 'Plateaus: '+aiResults.stagnation.plateaus.length+' · Improvements: '+aiResults.stagnation.improvements.length)
            ),
            // Run Times
            aiResults.runTimes && !aiResults.runTimes.error && _h('div', { className:'card', style:{ marginBottom:10 } },
              _h('div', { style:{ fontWeight:700, marginBottom:8, fontSize:'.82rem' } }, '🏅 Run Predictions'),
              _h('div', { className:'grid-4' },
                [['5km',aiResults.runTimes['5km']],['10km',aiResults.runTimes['10km']],['HM',aiResults.runTimes['HM']],['M',aiResults.runTimes['M']]].map(function(p){
                  return _h('div', { key:p[0], style:{ textAlign:'center' } },
                    _h('div', { style:{ fontSize:'.6rem', color:'var(--t3)' } }, p[0]),
                    _h('div', { style:{ fontWeight:700, fontSize:'.75rem' } }, p[1])
                  );
                })
              )
            ),
            // Workout Analysis
            aiResults.workoutAnalysis && Array.isArray(aiResults.workoutAnalysis) && aiResults.workoutAnalysis.length>0 && _h('div', { className:'card', style:{ marginBottom:10 } },
              _h('div', { style:{ fontWeight:700, marginBottom:8, fontSize:'.82rem' } }, '💪 Workout Analysis (last)'),
              aiResults.workoutAnalysis.map(function(ins, i){
                return _h('div', { key:i, style:{ fontSize:'.72rem', padding:'4px 0', borderBottom:'1px solid var(--b1)', display:'flex', gap:8 } },
                  _h('span', null, ins.icon),
                  _h('span', { style:{ color:'var(--t2)' } }, ins.title)
                );
              })
            ),
            // Weekly Report summary
            aiResults.weeklyReport && !aiResults.weeklyReport.error && _h('div', { className:'card', style:{ marginBottom:10 } },
              _h('div', { style:{ fontWeight:700, marginBottom:8, fontSize:'.82rem' } }, '📅 Weekly Report'),
              (aiResults.weeklyReport.recommendations||[]).map(function(r, i){
                return _h('div', { key:i, style:{ fontSize:'.72rem', color:'var(--t2)', padding:'3px 0' } }, '→ '+r);
              })
            )
          )
        ),

        // ── DATABASE ──────────────────────────────────────────────────────
        tab==='database' && _h('div', { className:'fade-in' },
          _h('div', { style:{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:14 } },
            Object.keys(colMap).map(function(col) {
              var count = (store[col]||[]).length;
              return _h('button', { key:col, style:{ padding:'5px 10px', borderRadius:20, fontSize:'.68rem', fontWeight:700, border:'1px solid '+(dbCol===col?'var(--a)':'var(--b1)'), background:dbCol===col?'var(--a)':'var(--s3)', color:dbCol===col?'white':'var(--t2)', cursor:'pointer' },
                onClick:function(){ setDbCol(col); }
              }, col+' ('+count+')');
            })
          ),
          _h('div', { style:{ background:'var(--s3)', borderRadius:'var(--r2)', padding:12, maxHeight:380, overflow:'auto' } },
            _h('pre', { style:{ fontSize:'.62rem', color:'var(--t2)', fontFamily:'monospace', lineHeight:1.5, whiteSpace:'pre-wrap', wordBreak:'break-all', margin:0 } },
              JSON.stringify((store[dbCol]||[]).slice(0,10), null, 2)
            )
          ),
          _h('div', { style:{ marginTop:8, fontSize:'.65rem', color:'var(--t3)' } }, 'Wyświetla pierwsze 10 rekordów. Łącznie: '+((store[dbCol]||[]).length))
        ),

        // ── LOGS ──────────────────────────────────────────────────────────
        tab==='logs' && _h('div', { className:'fade-in' },
          _h('div', { style:{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 } },
            _h('div', { style:{ fontSize:'.78rem', fontWeight:700 } }, 'Konsola ('+logs.length+' wpisów)'),
            _h('button', { style:{ padding:'4px 10px', fontSize:'.68rem', border:'1px solid var(--b1)', borderRadius:'var(--r2)', background:'none', color:'var(--t3)', cursor:'pointer' },
              onClick:function(){ setLogs([]); }
            }, 'Wyczyść')
          ),
          _h('div', { style:{ background:'#0a0a14', borderRadius:'var(--r2)', padding:10, maxHeight:450, overflow:'auto', fontFamily:'monospace' } },
            logs.length===0 ? _h('div', { style:{ color:'#555', fontSize:'.7rem' } }, 'Brak logów. Logi pojawiają się przy użyciu aplikacji.') :
            logs.map(function(l, i) {
              return _h('div', { key:i, style:{ fontSize:'.62rem', padding:'2px 0', borderBottom:'1px solid rgba(255,255,255,.04)', color:l.lvl==='error'?'#ef4444':'#a0a0c0', display:'flex', gap:8 } },
                _h('span', { style:{ color:'#555', flexShrink:0, minWidth:65 } }, l.t),
                _h('span', { style:{ wordBreak:'break-all' } }, l.msg)
              );
            })
          )
        ),

        // ── SETTINGS ──────────────────────────────────────────────────────
        tab==='settings' && _h('div', { className:'fade-in' },
          _h('div', { className:'card', style:{ marginBottom:14 } },
            _h('div', { style:{ fontWeight:700, marginBottom:12, fontSize:'.85rem' } }, '🏠 Dashboard'),
            _h('div', { style:{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 0' } },
              _h('div', null,
                _h('div', { style:{ fontWeight:600, fontSize:'.88rem' } }, 'Klasyczny dashboard'),
                _h('div', { style:{ fontSize:'.72rem', color:'var(--t3)', marginTop:3 } }, 'Przywraca stary widok z suwakiem gotowości i siatką skrótów')
              ),
              _h('button', {
                style:{ padding:'8px 16px', borderRadius:'var(--r2)', border:'1px solid '+(store.settings&&store.settings.useOldDashboard?'var(--green)':'var(--b1)'), background:store.settings&&store.settings.useOldDashboard?'var(--green-d)':'var(--s3)', color:store.settings&&store.settings.useOldDashboard?'var(--green)':'var(--t2)', cursor:'pointer', fontSize:'.78rem', fontWeight:700, transition:'all .15s' },
                onClick:function(){
                  var cur = store.settings&&store.settings.useOldDashboard;
                  update(function(s){ return Object.assign({},s,{ settings:Object.assign({},s.settings||{},{ useOldDashboard:!cur }) }); });
                  toast((cur ? 'Nowy' : 'Klasyczny')+' dashboard aktywny ✓', 'success');
                }
              }, store.settings&&store.settings.useOldDashboard ? '✓ Aktywny' : 'Włącz')
            )
          ),
          _h('div', { className:'card', style:{ marginBottom:14 } },
            _h('div', { style:{ fontWeight:700, marginBottom:12, fontSize:'.85rem' } }, '🔧 Informacje o aplikacji'),
            [
              ['Wersja', '1.0.0-dev'],
              ['Środowisko', 'Development'],
              ['React', React.version],
              ['Klucz magazynu', 'et_v1'],
              ['Rozmiar danych', (JSON.stringify(store).length/1024).toFixed(1)+' KB'],
              ['Moduły AI', typeof ET.AIEngine !== 'undefined' ? '✓ Załadowane' : '✗ Brak'],
            ].map(function(row, i) {
              return _h('div', { key:i, style:{ display:'flex', justifyContent:'space-between', padding:'6px 0', borderBottom:'1px solid var(--b1)', fontSize:'.78rem' } },
                _h('span', { style:{ color:'var(--t3)' } }, row[0]),
                _h('span', { style:{ fontWeight:600, color:'var(--t1)', fontFamily:'monospace' } }, row[1])
              );
            })
          ),
          _h('div', { className:'card', style:{ marginBottom:14, borderColor:'var(--red)' } },
            _h('div', { style:{ fontWeight:700, marginBottom:8, fontSize:'.85rem', color:'var(--red)' } }, '⚠️ Strefa niebezpieczna'),
            _h('div', { style:{ display:'flex', flexDirection:'column', gap:8 } },
              _h('button', { style:{ padding:'10px', borderRadius:'var(--r2)', border:'1px solid var(--red)', background:'none', color:'var(--red)', cursor:'pointer', fontSize:'.8rem', fontWeight:700 },
                onClick:clearDatabase
              }, '🗑 Wyczyść bazę danych'),
              _h('button', { style:{ padding:'10px', borderRadius:'var(--r2)', border:'1px solid var(--red)', background:'none', color:'var(--red)', cursor:'pointer', fontSize:'.8rem', fontWeight:700 },
                onClick:function(){
                  if(!confirm('Zresetować aplikację? Wszystkie dane zostaną utracone!')) return;
                  localStorage.removeItem('et_v1');
                  window.location.reload();
                }
              }, '🔄 Resetuj aplikację')
            )
          ),
          _h('div', { className:'card' },
            _h('div', { style:{ fontWeight:700, marginBottom:12, fontSize:'.85rem' } }, '📤 Import / Export'),
            _h('div', { style:{ display:'flex', gap:8 } },
              _h('button', { style:{ flex:1, padding:'10px', borderRadius:'var(--r2)', border:'1px solid var(--a)', background:'none', color:'var(--a-light)', cursor:'pointer', fontSize:'.78rem', fontWeight:700 },
                onClick:function(){
                  var exp = JSON.stringify(store);
                  var blob = new Blob([exp],{type:'application/json'});
                  var a = document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='et_backup_'+Date.now()+'.json'; a.click();
                  toast('Eksportowano ✓','success');
                }
              }, '💾 Eksportuj JSON'),
              _h('button', { style:{ flex:1, padding:'10px', borderRadius:'var(--r2)', border:'1px solid var(--b1)', background:'none', color:'var(--t2)', cursor:'pointer', fontSize:'.78rem' },
                onClick:function(){
                  var inp = document.createElement('input'); inp.type='file'; inp.accept='.json';
                  inp.onchange = function(e){
                    var file = e.target.files[0]; if(!file) return;
                    var reader = new FileReader();
                    reader.onload = function(ev){
                      try {
                        var data = JSON.parse(ev.target.result);
                        if(confirm('Zaimportować dane? Zastąpi wszystkie obecne dane.')) {
                          update(function(){ return data; });
                          toast('Zaimportowano ✓','success');
                        }
                      } catch(err){ toast('Błąd: nieprawidłowy plik JSON','default'); }
                    };
                    reader.readAsText(file);
                  };
                  inp.click();
                }
              }, '📥 Importuj JSON')
            )
          )
        )
      )
    );
  }

  ET.DevPanel = DevPanel;
})();
