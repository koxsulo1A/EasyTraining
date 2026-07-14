(function() {
  'use strict';
  window.ET = window.ET || {};

  // ── UTILITY ───────────────────────────────────────────────────────────────
  function avg(arr) { return arr.length ? arr.reduce(function(a,b){return a+b;},0)/arr.length : 0; }
  function sum(arr) { return arr.reduce(function(a,b){return a+b;},0); }
  function clamp(v,lo,hi) { return Math.min(Math.max(v,lo),hi); }
  function filterDays(entries, dateKey, days) {
    var cutoff = new Date(); cutoff.setDate(cutoff.getDate()-days); cutoff.setHours(0,0,0,0);
    return (entries||[]).filter(function(e){ return new Date(e[dateKey]+'T12:00') >= cutoff; });
  }
  function fmtDatePL(isoStr) {
    var d = new Date(isoStr+'T12:00');
    return d.toLocaleDateString('pl-PL',{day:'numeric',month:'short',year:'numeric'});
  }

  // ── RECOVERY ENGINE ───────────────────────────────────────────────────────
  var RecoveryEngine = {
    compute: function(store) {
      var score = 50;
      var factors = [];

      // Sleep
      var lastSleep = filterDays(store.sleepSessions||[], 'date', 2)[0];
      if (lastSleep) {
        var h = lastSleep.duration||0;
        var s = h>=8?22:h>=7?16:h>=6?8:h>=5?0:-10;
        score+=s; factors.push({label:'Sen '+h+'h', value:s, color:s>=0?'var(--green)':'var(--red)'});
      } else {
        factors.push({label:'Sen — brak danych', value:0, color:'var(--t3)'});
      }

      // Training load last 7d vs 4-week avg
      var w7 = filterDays(store.workouts||[], 'date', 7);
      var w28 = filterDays(store.workouts||[], 'date', 28);
      var vol7 = sum(w7.map(function(w){return w.volume||0;}));
      var weeklyAvg = w28.length ? sum(w28.map(function(w){return w.volume||0;}))/4 : 0;
      if (w7.length > 0) {
        var ratio = weeklyAvg>0 ? vol7/weeklyAvg : 1;
        var ls = ratio<0.7?10:ratio<1.0?5:ratio<1.2?0:ratio<1.5?-8:-18;
        score+=ls; factors.push({label:'Obciążenie siłowe '+vol7.toFixed(0)+'kg/tydz.', value:ls, color:ls>=0?'var(--green)':'var(--red)'});
      }

      // Running load
      var r7 = filterDays(store.runs||[], 'date', 7);
      var km7 = sum(r7.map(function(r){return r.distance||0;}));
      if (km7 > 0) {
        var rs = km7>60?-16:km7>40?-10:km7>20?-4:km7>5?2:4;
        score+=rs; factors.push({label:'Bieganie '+km7.toFixed(1)+'km/tydz.', value:rs, color:rs>=0?'var(--green)':'var(--red)'});
      }

      // Pain
      var pains = filterDays(store.painEntries||[], 'date', 7);
      if (pains.length > 0) {
        var maxP = Math.max.apply(null, pains.map(function(p){return p.intensity||0;}));
        var ps = maxP>=8?-22:maxP>=6?-14:maxP>=4?-7:-3;
        score+=ps; factors.push({label:'Ból maks. '+maxP+'/10', value:ps, color:'var(--red)'});
      }

      // Wellbeing (last 2 days)
      var wb = filterDays(store.wellbeingEntries||[], 'date', 2);
      var lastWb = wb[0];
      if (lastWb) {
        var ss2 = lastWb.stress ? (lastWb.stress>=8?-12:lastWb.stress>=6?-6:0) : 0;
        var es = lastWb.energy ? (lastWb.energy>=7?8:lastWb.energy>=4?3:-5) : 0;
        if (ss2!==0) { score+=ss2; factors.push({label:'Stres '+lastWb.stress+'/10', value:ss2, color:'var(--red)'}); }
        if (es!==0)  { score+=es;  factors.push({label:'Energia '+lastWb.energy+'/10', value:es, color:es>0?'var(--green)':'var(--red)'}); }
      }

      // Sauna bonus
      var sau = filterDays(store.saunaSessions||[], 'date', 2);
      if (sau.length > 0) { score+=8; factors.push({label:'Sauna '+sau.length+' sesja', value:8, color:'var(--orange)'}); }

      // Days since last workout
      var lastW = (store.workouts||[])[0];
      if (lastW) {
        var daysSince = Math.floor((Date.now()-new Date(lastW.date+'T12:00'))/86400000);
        if (daysSince===0)       { score-=5;  factors.push({label:'Trening dzisiaj', value:-5, color:'var(--yellow)'}); }
        else if (daysSince===1)  { score+=5;  factors.push({label:'1 dzień odpoczynku', value:5, color:'var(--green)'}); }
        else if (daysSince<=3)   { score+=10; factors.push({label:daysSince+'d odpoczynku', value:10, color:'var(--green)'}); }
        else if (daysSince>6)    { score-=5;  factors.push({label:daysSince+'d bez treningu', value:-5, color:'var(--yellow)'}); }
      }

      score = clamp(Math.round(score), 0, 100);
      var category = score>=80?'Doskonała':score>=65?'Dobra':score>=50?'Umiarkowana':score>=35?'Słaba':'Bardzo słaba';
      var recommendation = score>=80?'Doskonały dzień na intensywny trening lub PR.':
        score>=65?'Dobry dzień na pełny trening.':
        score>=50?'Trening możliwy, jednak zredukuj objętość o 10–15%.':
        score>=35?'Rozważ lekki trening lub aktywny odpoczynek.':
        'Priorytet: odpoczynek, sen i regeneracja. Unikaj intensywnego treningu.';

      return { score:score, category:category, recommendation:recommendation, factors:factors };
    }
  };

  // ── TRAINING ANALYZER ─────────────────────────────────────────────────────
  var TrainingAnalyzer = {
    analyzeWorkout: function(workout, store) {
      var all = (store.workouts||[]).filter(function(w){ return w.id!==workout.id; });
      var sameType = all.filter(function(w){ return w.name===workout.name; });
      var insights = [];

      // PRs
      if (workout.prs && workout.prs.length > 0) {
        insights.push({type:'achievement',icon:'🏆',
          title:workout.prs.length+' nowe rekordy osobiste',
          body:workout.prs.map(function(p){return p.name+': '+p.e1rm.toFixed(1)+'kg 1RM';}).join(' · ')
        });
      }

      // Volume vs average
      if (sameType.length >= 2) {
        var avgVol = avg(sameType.slice(0,5).map(function(w){return w.volume||0;}));
        var vol = workout.volume||0;
        var pct = avgVol>0 ? Math.round((vol-avgVol)/avgVol*100) : 0;
        if (Math.abs(pct) >= 6) {
          insights.push({type:pct>0?'positive':'warning',icon:pct>0?'📈':'📉',
            title:pct>0?'Wolumen +'+pct+'% powyżej średniej':'Wolumen '+pct+'% poniżej średniej',
            body:'Średnia z ostatnich '+Math.min(sameType.length,5)+' treningów: '+avgVol.toFixed(0)+'kg · Dzisiaj: '+vol.toFixed(0)+'kg'
          });
        }
      }

      // Duration anomaly
      if (sameType.length >= 2) {
        var avgDurMin = avg(sameType.slice(0,5).map(function(w){return (w.duration||0)/60000;}));
        var durMin = (workout.duration||0)/60000;
        if (durMin < avgDurMin*0.72) {
          insights.push({type:'info',icon:'⏱',title:'Znacznie krótszy trening',
            body:'Czas: '+Math.round(durMin)+'min vs śr. '+Math.round(avgDurMin)+'min. Celowe skrócenie, przeszkoda zewnętrzna?'
          });
        } else if (durMin > avgDurMin*1.35) {
          insights.push({type:'info',icon:'⏱',title:'Dłuższy trening niż zwykle',
            body:'Czas: '+Math.round(durMin)+'min vs śr. '+Math.round(avgDurMin)+'min. Dobra praca!'
          });
        }
      }

      // Plateaus for exercises in this workout
      var plateaus = TrainingAnalyzer.findPlateaus(workout.exercises||[], all);
      if (plateaus.length > 0) {
        insights.push({type:'warning',icon:'⚠️',title:'Stagnacja w '+plateaus.length+' ćwiczeniu/ach',
          body:plateaus.map(function(p){return p.name+' ('+p.weight+'kg × '+p.sessions+'x)';}).join(' · ')+'. Zmień bodziec: drop sety, pausa, zmiana tempa lub +2.5kg.'
        });
      }

      // Recovery context
      var recovery = RecoveryEngine.compute(store);
      insights.push({type:'info',icon:'🔋',title:'Regeneracja: '+recovery.score+'% ('+recovery.category+')',
        body:recovery.recommendation
      });

      return insights;
    },

    findPlateaus: function(exercises, history) {
      if (!exercises || !exercises.length || !history.length) return [];
      var plateaus = [];
      exercises.forEach(function(ex) {
        var exHist = [];
        history.slice(0,16).forEach(function(w) {
          var found = (w.exercises||[]).find(function(e){ return e.name===ex.name; });
          if (found) {
            var maxW = found.setsData ? Math.max.apply(null,[0].concat(found.setsData.map(function(s){return s.weight||0;}))) : (found.weight||0);
            exHist.push({date:w.date, maxWeight:maxW});
          }
        });
        if (exHist.length >= 3) {
          var last3 = exHist.slice(0,3);
          var mx = Math.max.apply(null, last3.map(function(e){return e.maxWeight;}));
          var mn = Math.min.apply(null, last3.map(function(e){return e.maxWeight;}));
          if (mx>0 && mx-mn<=2.5) {
            var daysSince = Math.floor((Date.now()-new Date(last3[last3.length-1].date+'T12:00'))/86400000);
            if (daysSince>=14) plateaus.push({name:ex.name, weight:mx, sessions:last3.length});
          }
        }
      });
      return plateaus;
    },

    analyzeProgress: function(store) {
      var w30 = filterDays(store.workouts||[], 'date', 30);
      var prev30 = (store.workouts||[]).filter(function(w){
        var d=(Date.now()-new Date(w.date+'T12:00'))/86400000; return d>=30&&d<60;
      });
      var insights = [];
      var vol30=sum(w30.map(function(w){return w.volume||0;}));
      var volPrev=sum(prev30.map(function(w){return w.volume||0;}));
      if (volPrev>0) {
        var vt=Math.round((vol30-volPrev)/volPrev*100);
        insights.push({category:'volume',type:vt>5?'positive':vt<-5?'warning':'neutral',
          metric:'Wolumen vs poprzedni miesiąc',value:vol30.toFixed(0)+'kg',change:(vt>0?'+':'')+vt+'%',detail:'Poprzedni: '+volPrev.toFixed(0)+'kg'});
      }
      var sessPerWeek = w30.length/4.3;
      if (w30.length>0) {
        insights.push({category:'frequency',type:sessPerWeek>=3?'positive':sessPerWeek>=2?'neutral':'warning',
          metric:'Częstotliwość',value:sessPerWeek.toFixed(1)+'/tydz.',change:'',detail:w30.length+' sesji w 30 dniach'});
      }
      var prs30=w30.reduce(function(t,w){return t+(w.prs&&w.prs.length||0);},0);
      if (prs30>0) insights.push({category:'prs',type:'positive',metric:'Rekordy',value:prs30+' PR',change:'',detail:'Systematyczny progres'});
      return insights;
    }
  };

  // ── STAGNATION DETECTOR ───────────────────────────────────────────────────
  var StagnationDetector = {
    analyze: function(store) {
      var workouts = store.workouts||[];
      var exMap = {};
      workouts.forEach(function(w) {
        (w.exercises||[]).forEach(function(ex) {
          if (!exMap[ex.name]) exMap[ex.name]=[];
          var maxW = ex.setsData ? Math.max.apply(null,[0].concat(ex.setsData.map(function(s){return s.weight||0;}))) : (ex.weight||0);
          exMap[ex.name].push({date:w.date, maxWeight:maxW});
        });
      });

      var plateaus=[], improvements=[];
      Object.keys(exMap).forEach(function(name) {
        var hist = exMap[name].sort(function(a,b){return b.date.localeCompare(a.date);});
        if (hist.length < 3) return;
        var r3=hist.slice(0,3), o3=hist.slice(3,6);
        var rmx=Math.max.apply(null,r3.map(function(e){return e.maxWeight;}));
        var rmn=Math.min.apply(null,r3.map(function(e){return e.maxWeight;}));
        if (rmx>0 && rmx-rmn<=2.5) {
          var days=Math.floor((Date.now()-new Date(r3[r3.length-1].date+'T12:00'))/86400000);
          if (days>=14) plateaus.push({name:name, weight:rmx, sessions:r3.length, days:days});
        }
        if (o3.length>=2) {
          var oAvg=avg(o3.map(function(e){return e.maxWeight;}));
          var rAvg=avg(r3.map(function(e){return e.maxWeight;}));
          if (oAvg>0 && rAvg>oAvg*1.04) {
            improvements.push({name:name, from:oAvg.toFixed(1), to:rAvg.toFixed(1), pct:((rAvg-oAvg)/oAvg*100).toFixed(1)});
          }
        }
      });

      // Weaknesses: plateaus that have been stuck longest
      var weakPoints = plateaus.slice().sort(function(a,b){return b.days-a.days;}).slice(0,3);

      return {plateaus:plateaus, improvements:improvements, weakPoints:weakPoints};
    }
  };

  // ── PLAN SUGGESTER ────────────────────────────────────────────────────────
  var PlanSuggester = {
    suggestChanges: function(plan, store) {
      var history = (store.workouts||[]).filter(function(w){return w.name===plan.name;});
      var exStats = {};
      history.slice(0,10).forEach(function(w){
        (w.exercises||[]).forEach(function(ex){
          if (!exStats[ex.name]) exStats[ex.name]={weights:[],sessions:0};
          var maxW = ex.setsData ? Math.max.apply(null,[0].concat(ex.setsData.map(function(s){return s.weight||0;}))) : (ex.weight||0);
          exStats[ex.name].weights.push(maxW);
          exStats[ex.name].sessions++;
        });
      });

      var painZones = filterDays(store.painEntries||[], 'date', 21).map(function(p){return (p.zone||'').toLowerCase();});
      var hasShoulderPain = painZones.some(function(z){return z.includes('bark')||z.includes('ramie');});
      var hasKneePain     = painZones.some(function(z){return z.includes('kolan');});
      var hasLowerBack    = painZones.some(function(z){return z.includes('plecy_d')||z.includes('plecy dolne');});

      return (plan.exercises||[]).map(function(ex) {
        var stat = exStats[ex.name];
        var changed=false, reasons=[], newEx=Object.assign({},ex);

        if (stat && stat.sessions >= 2) {
          var weights = stat.weights.filter(function(w){return w>0;});
          if (weights.length >= 3) {
            var last3 = weights.slice(0,3);
            var mx=Math.max.apply(null,last3), mn=Math.min.apply(null,last3);
            if (mx>0 && mx-mn<=2.5) {
              newEx = Object.assign({},newEx,{weight:Math.round((ex.weight+2.5)*10)/10});
              changed=true;
              reasons.push('Stagnacja ciężaru przez '+last3.length+' sesje ('+mx+'kg). Zwiększ o 2.5kg — akceptuj RIR +1 przy nowym ciężarze.');
            }
          }
        }

        var exL = ex.name.toLowerCase();
        if (hasShoulderPain && (exL.includes('wyciskanie')||exL.includes('hantle')||exL.includes('rozpiętki')||exL.includes('barki'))) {
          newEx = Object.assign({},newEx,{rir:Math.min((ex.rir||2)+1,4), weight:Math.max((newEx.weight||ex.weight)*0.9, ex.weight*0.9)});
          newEx.weight = Math.round(newEx.weight*10)/10;
          changed=true;
          reasons.push('Aktywny ból barku (14 dni). Zredukuj ciężar o 10% i zwiększ RIR o 1. Priorytet: technika i zakres ruchu.');
        }
        if (hasKneePain && (exL.includes('squat')||exL.includes('split squat')||exL.includes('przysiady')||exL.includes('leg press'))) {
          newEx = Object.assign({},newEx,{rir:Math.min((ex.rir||2)+1,4)});
          changed=true;
          reasons.push('Aktywny ból kolana. Zwiększ RIR +1, monitoruj głębokość przysiadu i kierunek kolan.');
        }
        if (hasLowerBack && (exL.includes('rdl')||exL.includes('martwy')||exL.includes('hip thrust'))) {
          newEx = Object.assign({},newEx,{reps:Math.min((ex.reps||8)+2,12), sets:Math.max((ex.sets||3)-1,2)});
          changed=true;
          reasons.push('Ból dolnego odcinka pleców. Zredukuj serie o 1, zwiększ powtórzenia — niższy ciężar, więcej kontroli ruchu.');
        }

        return {original:ex, suggested:newEx, changed:changed, reasons:reasons};
      });
    }
  };

  // ── RUNNING ANALYZER ──────────────────────────────────────────────────────
  var RunningAnalyzer = {
    analyzeRun: function(run, store) {
      var history = (store.runs||[]).filter(function(r){return r.id!==run.id;});
      var insights = [];

      if (history.length >= 2 && run.pace) {
        var paces = history.slice(0,8).filter(function(r){return r.pace;}).map(function(r){return r.pace;});
        if (paces.length >= 2) {
          var avgP = avg(paces);
          var diff = run.pace - avgP;
          if (Math.abs(diff) > 8) {
            insights.push({type:diff<0?'positive':'warning',icon:diff<0?'🚀':'🐢',
              title:diff<0?'Szybsze tempo +'+Math.abs(diff).toFixed(0)+'s/km':'Wolniejsze tempo o '+Math.abs(diff).toFixed(0)+'s/km',
              body:'Twoje tempo: '+run.pace+'s/km · Średnia z '+paces.length+' ostatnich biegów: '+avgP.toFixed(0)+'s/km'
            });
          }
        }
      }

      if (history.length >= 2) {
        var avgDist = avg(history.slice(0,6).map(function(r){return r.distance||0;}));
        if (avgDist > 0) {
          var distPct = ((run.distance||0)-avgDist)/avgDist*100;
          if (distPct > 25) {
            insights.push({type:'warning',icon:'⚠️',title:'Skok dystansu +'+Math.round(distPct)+'%',
              body:'Ten bieg jest o '+Math.round(distPct)+'% dłuższy niż średnia ('+avgDist.toFixed(1)+'km). Reguła 10%/tydzień — obserwuj przeciążenia.'
            });
          }
        }
      }

      var predictions = RunningAnalyzer.predictTimes(store);
      if (predictions) {
        insights.push({type:'info',icon:'🏅',title:'Szacowane czasy wyścigów',
          body:'5km: '+predictions['5km']+' · 10km: '+predictions['10km']+' · Półmaraton: '+predictions['HM']+' · Maraton: '+predictions['M']
        });
      }

      var recovery = RecoveryEngine.compute(store);
      insights.push({type:'info',icon:'🔋',title:'Regeneracja: '+recovery.score+'% — '+recovery.category,
        body:recovery.recommendation
      });

      return insights;
    },

    predictTimes: function(store) {
      var runs = (store.runs||[]).filter(function(r){return r.pace&&r.distance>=3;});
      if (runs.length === 0) return null;
      var bestPaceRun = runs.slice(0,10).reduce(function(best,r){return (!best||r.pace<best.pace)?r:best;}, null);
      if (!bestPaceRun) return null;
      var pace = bestPaceRun.pace, dist = bestPaceRun.distance;
      var baseSec = pace * dist;
      function riegel(d) { return baseSec * Math.pow(d/dist, 1.06); }
      function fmtSec(s) {
        var h=Math.floor(s/3600), m=Math.floor((s%3600)/60), sec=Math.floor(s%60);
        return h>0 ? h+'h '+m+'min' : m+'min '+sec+'s';
      }
      return {'5km':fmtSec(riegel(5)), '10km':fmtSec(riegel(10)), 'HM':fmtSec(riegel(21.097)), 'M':fmtSec(riegel(42.195))};
    }
  };

  // ── CORRELATION ENGINE ────────────────────────────────────────────────────
  var CorrelationEngine = {
    analyze: function(store) {
      var insights = [];
      var workouts = store.workouts||[];
      var sleeps = store.sleepSessions||[];
      var wbs = store.wellbeingEntries||[];
      var saunas = store.saunaSessions||[];

      // Sleep → Volume correlation
      if (sleeps.length >= 4 && workouts.length >= 4) {
        var pairs = workouts.slice(0,20).map(function(w){
          var s = sleeps.find(function(sl){return sl.date===w.date||Math.abs(new Date(sl.date+'T12:00')-new Date(w.date+'T12:00'))<86400000;});
          return s ? {vol:w.volume||0, sleep:s.duration||0} : null;
        }).filter(Boolean);
        if (pairs.length >= 4) {
          var good = pairs.filter(function(p){return p.sleep>=7;});
          var poor = pairs.filter(function(p){return p.sleep<6;});
          if (good.length>=2 && poor.length>=2) {
            var gVol=avg(good.map(function(p){return p.vol;})), pVol=avg(poor.map(function(p){return p.vol;}));
            if (gVol>pVol*1.06) {
              insights.push({icon:'😴→💪',title:'Sen poprawia wolumen',
                body:'Przy ≥7h snu wolumen jest o '+((gVol/pVol-1)*100).toFixed(0)+'% wyższy ('+gVol.toFixed(0)+'kg vs '+pVol.toFixed(0)+'kg). Śpij więcej!'
              });
            }
          }
        }
      }

      // Sauna → Wellbeing
      if (saunas.length >= 3 && wbs.length >= 4) {
        var saunaDays = new Set(saunas.map(function(s){return s.date;}));
        var afterSauna = wbs.filter(function(e){ var prev=new Date(e.date+'T12:00'); prev.setDate(prev.getDate()-1); var ps=prev.toISOString().slice(0,10); return saunaDays.has(ps); });
        var noSauna = wbs.filter(function(e){ var prev=new Date(e.date+'T12:00'); prev.setDate(prev.getDate()-1); var ps=prev.toISOString().slice(0,10); return !saunaDays.has(ps); });
        if (afterSauna.length>=2 && noSauna.length>=2) {
          var saunaEnergy=avg(afterSauna.map(function(e){return e.energy||0;}));
          var noSaunaEnergy=avg(noSauna.map(function(e){return e.energy||0;}));
          if (saunaEnergy>noSaunaEnergy*1.08) {
            insights.push({icon:'🔥→⚡',title:'Sauna poprawia energię',
              body:'Dzień po saunie energia wynosi śr. '+saunaEnergy.toFixed(1)+'/10 vs '+noSaunaEnergy.toFixed(1)+'/10 w inne dni. Sauna sprzyja regeneracji.'
            });
          }
        }
      }

      return insights;
    }
  };

  // ── REPORT GENERATOR ──────────────────────────────────────────────────────
  var ReportGenerator = {
    _build: function(days, store) {
      var ws = filterDays(store.workouts||[], 'date', days);
      var rs = filterDays(store.runs||[], 'date', days);
      var ss = filterDays(store.sleepSessions||[], 'date', days);
      var wb = filterDays(store.wellbeingEntries||[], 'date', days);
      var sau= filterDays(store.saunaSessions||[], 'date', days);
      return {
        workouts:ws, runs:rs, sleeps:ss, wbs:wb, saunas:sau,
        totalVol:sum(ws.map(function(w){return w.volume||0;})),
        totalKm:sum(rs.map(function(r){return r.distance||0;})),
        avgSleep:ss.length?avg(ss.map(function(s){return s.duration||0;})):0,
        avgEnergy:wb.length?avg(wb.map(function(e){return e.energy||0;})):0,
        prs:ws.reduce(function(t,w){return t+(w.prs&&w.prs.length||0);},0)
      };
    },

    weekly: function(store) {
      var d = ReportGenerator._build(7, store);
      var stagnation = StagnationDetector.analyze(store);
      var corr = CorrelationEngine.analyze(store);
      var recovery = RecoveryEngine.compute(store);
      var recs=[];
      if (d.avgSleep>0 && d.avgSleep<7) recs.push('Śr. sen '+d.avgSleep.toFixed(1)+'h to za mało. Cel: 7–8h — wpłynie pozytywnie na siłę i regenerację.');
      if (d.workouts.length>=5) recs.push(d.workouts.length+' treningów w tygodniu to wysoka częstotliwość. Monitoruj sygnały przetrenowania: obniżona motywacja, ból stawów, gorsza jakość snu.');
      if (stagnation.plateaus.length>0) recs.push('Stagnacja w '+stagnation.plateaus.slice(0,2).map(function(p){return p.name;}).join(', ')+'. Zmień bodziec: drop sety, pausa, inna liczba powtórzeń lub +2.5kg.');
      if (d.totalKm>50) recs.push('Wysoki kilometraż ('+d.totalKm.toFixed(1)+'km). Upewnij się że masz ≥1 dzień całkowitego odpoczynku i prawidłowe obuwie.');
      if (recs.length===0) recs.push('Tydzień wyglądał dobrze. Kontynuuj obecne podejście i monitoruj regenerację.');
      return {title:'Raport tygodniowy', period:'Ostatnie 7 dni', data:d, recovery:recovery, stagnation:stagnation, correlations:corr, recommendations:recs,
        stats:[
          {label:'Treningi',value:d.workouts.length,icon:'💪'},
          {label:'Wolumen',value:d.totalVol.toFixed(0)+'kg',icon:'🏋️'},
          {label:'Bieganie',value:d.totalKm.toFixed(1)+'km',icon:'🏃'},
          {label:'Śr. sen',value:d.avgSleep?d.avgSleep.toFixed(1)+'h':'—',icon:'😴'},
          {label:'Śr. energia',value:d.avgEnergy?d.avgEnergy.toFixed(1)+'/10':'—',icon:'⚡'},
          {label:'PR',value:d.prs,icon:'🏆'},
          {label:'Sauna',value:d.saunas.length+'x',icon:'🔥'},
          {label:'Regeneracja',value:recovery.score+'%',icon:'🔋'}
        ]};
    },

    monthly: function(store) {
      var d = ReportGenerator._build(30, store);
      var prev = (store.workouts||[]).filter(function(w){var df=(Date.now()-new Date(w.date+'T12:00'))/86400000;return df>=30&&df<60;});
      var prevVol=sum(prev.map(function(w){return w.volume||0;}));
      var stagnation=StagnationDetector.analyze(store);
      var corr=CorrelationEngine.analyze(store);
      var recs=[];
      if (prevVol>0){var vt=Math.round((d.totalVol-prevVol)/prevVol*100);
        if(vt>20) recs.push('Wolumen +'+vt+'% vs poprzedni miesiąc. Reguła progresji: unikaj wzrostu >10%/tydzień — ryzyko kontuzji.');
        else if(vt<-20) recs.push('Wolumen '+vt+'% vs poprzedni miesiąc. Celowa deload czy zmiana motywacji?');
      }
      if (stagnation.plateaus.length>=3) recs.push(stagnation.plateaus.length+' ćwiczeń w stagnacji. Rozważ tydzień deload lub zmianę programu (periodyzacja).');
      if (stagnation.improvements.length>=2) recs.push('Progres w '+stagnation.improvements.length+' ćwiczeniach. Program działa — kontynuuj, nie zmieniaj niepotrzebnie.');
      if (recs.length===0) recs.push('Miesiąc wyglądał stabilnie. Monitoruj dalszy postęp.');
      return {title:'Raport miesięczny',period:'Ostatnie 30 dni',data:d,stagnation:stagnation,correlations:corr,recommendations:recs,
        stats:[
          {label:'Treningi',value:d.workouts.length,icon:'💪'},
          {label:'Wolumen',value:d.totalVol.toFixed(0)+'kg',icon:'🏋️'},
          {label:'Bieganie',value:d.totalKm.toFixed(1)+'km',icon:'🏃'},
          {label:'PR',value:d.prs,icon:'🏆'},
          {label:'Poprawa ćwicz.',value:stagnation.improvements.length,icon:'📈'},
          {label:'Stagnacja',value:stagnation.plateaus.length,icon:'⚠️'}
        ]};
    },

    preCompetition: function(store) {
      var comps=(store.competitions||[]).filter(function(c){return new Date(c.date+'T12:00')>new Date();});
      var next=comps.length?comps[0]:null;
      var daysLeft=next?Math.ceil((new Date(next.date+'T12:00')-new Date())/86400000):null;
      var d=ReportGenerator._build(30,store);
      var recovery=RecoveryEngine.compute(store);
      var pred=RunningAnalyzer.predictTimes(store);
      var recs=[];
      if(daysLeft!==null){
        if(daysLeft<=7){recs.push('TAPER: Zredukuj objętość o 40–60%. Zachowaj intensywność — krótsze, szybkie odcinki.');recs.push('Sen 8+ godzin każdej nocy. Unikaj nowych ćwiczeń i eksperymentów z dietą.');}
        else if(daysLeft<=14){recs.push('Faza taper: Zmniejsz objętość o 20–30%, zachowaj intensywność 2× w tygodniu.');recs.push('Priorytet: regeneracja, nawodnienie, sen.');}
        else recs.push('Jeszcze '+daysLeft+' dni. Kontynuuj regularny plan i stopniowo zwiększaj specyficzność treningu.');
      } else recs.push('Brak zaplanowanych zawodów. Dodaj zawody w module Zawody.');
      if(recovery.score<60) recs.push('Niska regeneracja ('+recovery.score+'%). Odpoczynek jest ważniejszy niż jeszcze jeden trening przed startem.');
      return {title:'Raport przed zawodami',period:next?'Start: '+fmtDatePL(next.date)+' ('+daysLeft+'d)':'Brak zawodów',data:d,recovery:recovery,runPredictions:pred,recommendations:recs,
        stats:[
          {label:'Dni do startu',value:daysLeft!==null?daysLeft+'d':'—',icon:'📅'},
          {label:'Treningi/mies.',value:d.workouts.length,icon:'💪'},
          {label:'Km/mies.',value:d.totalKm.toFixed(1),icon:'🏃'},
          {label:'Regeneracja',value:recovery.score+'%',icon:'🔋'},
          {label:'Progn. 5km',value:pred?pred['5km']:'—',icon:'🏅'},
          {label:'Progn. 10km',value:pred?pred['10km']:'—',icon:'🏅'}
        ]};
    },

    postCompetition: function(store) {
      var recovery=RecoveryEngine.compute(store);
      var recs=[
        'Pierwsze 48–72h: aktywna regeneracja — spacery, rozciąganie, sauna.',
        'Unikaj intensywnych treningów przez 7–14 dni. Mięśnie i ścięgna regenerują się dłużej niż samopoczucie wskazuje.',
        'Uzupełnij węglowodany i białko (1.6–2.0g/kg) w pierwszych 48h.',
        'Oceń wynik i wyznacz nowe cele na kolejny sezon — najlepiej po 2–3 dniach odpoczynku.',
        'Powrót do pełnych treningów: 2–3 tygodnie po zawodach, stopniowo.'
      ];
      if(recovery.score<50) recs.unshift('Niska regeneracja ('+recovery.score+'%). Co najmniej 3 dni bez żadnego treningu.');
      return {title:'Raport po zawodach',period:'Protokół regeneracji',recovery:recovery,recommendations:recs,
        stats:[
          {label:'Regeneracja',value:recovery.score+'%',icon:'🔋'},
          {label:'Min. odpoczynku',value:'7–14 dni',icon:'😴'},
          {label:'Białko/dzień',value:'1.6–2g/kg',icon:'🥩'},
          {label:'Powrót',value:'2–3 tyg.',icon:'📅'}
        ]};
    }
  };

  // ── GOAL PREDICTOR ────────────────────────────────────────────────────────
  var GoalPredictor = {
    predict: function(goal, store) {
      var unit = (goal.unit||'').toLowerCase();
      var title = (goal.title||'').toLowerCase();
      var targetVal = parseFloat(goal.target);
      if (isNaN(targetVal)) return null;

      if (unit==='kg'&&!title.includes('waga')&&!title.includes('masa ciała')) {
        return GoalPredictor.strengthPrediction(goal, targetVal, store);
      }
      if (unit==='km'||unit.includes('km')) {
        return GoalPredictor.runningPrediction(goal, targetVal, store);
      }
      if (title.includes('waga')||title.includes('kg')||unit==='kg') {
        return GoalPredictor.weightPrediction(goal, targetVal, store);
      }
      return GoalPredictor.progressionPrediction(goal, store);
    },

    strengthPrediction: function(goal, target, store) {
      var titleWords = (goal.title||'').toLowerCase().split(/\s+/);
      var all = store.workouts||[];
      var exHistory=[];
      all.forEach(function(w){
        (w.exercises||[]).forEach(function(ex){
          if(titleWords.some(function(tw){return tw.length>3&&ex.name.toLowerCase().includes(tw);})){
            var maxW=ex.setsData?Math.max.apply(null,[0].concat(ex.setsData.map(function(s){return s.weight||0;}))):( ex.weight||0);
            if(maxW>0) exHistory.push({date:w.date, weight:maxW});
          }
        });
      });
      if(exHistory.length<2) return {possible:false, reason:'Za mało danych dla ćwiczenia z tytułu celu (min. 2 sesje).'};
      exHistory.sort(function(a,b){return a.date.localeCompare(b.date);});
      var recent=exHistory.slice(-6);
      var daySpan=(new Date(recent[recent.length-1].date+'T12:00')-new Date(recent[0].date+'T12:00'))/86400000;
      var weightGain=daySpan>0?(recent[recent.length-1].weight-recent[0].weight)/(daySpan/7):0;
      var current=recent[recent.length-1].weight;
      if(current>=target) return {possible:true,reason:'Cel już osiągnięty! Obecny max: '+current+'kg.',weeksLeft:0,current:current+'kg',target:target+'kg'};
      if(weightGain<=0) return {possible:false,reason:'Brak postępu ciężaru w ostatnich tygodniach. Zmień podejście do progresji.',current:current+'kg',target:target+'kg'};
      var weeksLeft=Math.ceil((target-current)/weightGain);
      var est=new Date(); est.setDate(est.getDate()+weeksLeft*7);
      return {possible:true, current:current+'kg', target:target+'kg', weeklyGain:weightGain.toFixed(2)+'kg/tydz.',
        weeksLeft:weeksLeft, estimatedDate:fmtDatePL(est.toISOString().slice(0,10)),
        confidence:weightGain>1?'wysoka':weightGain>0.3?'średnia':'niska',
        reason:'Przy tempie '+weightGain.toFixed(2)+'kg/tydz. cel '+target+'kg zostanie osiągnięty za ok. '+weeksLeft+' tygodni.'};
    },

    runningPrediction: function(goal, target, store) {
      var runs=store.runs||[];
      if(runs.length<3) return {possible:false,reason:'Za mało biegów (min. 3).'};
      var avgDist=avg(runs.slice(0,6).map(function(r){return r.distance||0;}));
      if(avgDist>=target) return {possible:true,reason:'Cel dystansu osiągnięty!',weeksLeft:0};
      var older=runs.slice(6,12);
      var olderAvg=older.length?avg(older.map(function(r){return r.distance||0;})):avgDist*0.9;
      var weeklyGain=(avgDist-olderAvg)/Math.max(older.length/1.5,2);
      if(weeklyGain<=0) return {possible:false,reason:'Brak progresji dystansu. Systematycznie zwiększaj o 10%/tydz.',current:avgDist.toFixed(1)+'km',target:target+'km'};
      var weeksLeft=Math.ceil((target-avgDist)/weeklyGain);
      var est=new Date(); est.setDate(est.getDate()+weeksLeft*7);
      return {possible:true, current:avgDist.toFixed(1)+'km', target:target+'km', weeklyGain:(weeklyGain>0?'+':'')+weeklyGain.toFixed(2)+'km/tydz.',
        weeksLeft:weeksLeft, estimatedDate:fmtDatePL(est.toISOString().slice(0,10)), confidence:'niska',
        reason:'Przy obecnym tempie wzrostu dystansu cel zostanie osiągnięty za ok. '+weeksLeft+' tygodni.'};
    },

    weightPrediction: function(goal, target, store) {
      var meas=store.measurements||[];
      if(meas.length<2) return {possible:false,reason:'Za mało pomiarów wagi (min. 2).'};
      var recent=meas.slice(0,6).reverse();
      var daySpan=(new Date(meas[0].date+'T12:00')-new Date(recent[0].date+'T12:00'))/86400000;
      var weeklyChange=daySpan>0?((meas[0].weight||0)-(recent[0].weight||0))/(daySpan/7):0;
      var current=meas[0].weight||0;
      if(Math.abs(current-target)<0.3) return {possible:true,reason:'Cel wagowy osiągnięty!',weeksLeft:0};
      var isLoss=target<current;
      if((isLoss&&weeklyChange>=0)||(!isLoss&&weeklyChange<=0)) return {possible:false,reason:'Tempo zmiany wagi nie sprzyja celowi. Skoryguj dietę.',current:current.toFixed(1)+'kg',target:target+'kg'};
      var weeksLeft=Math.ceil(Math.abs(target-current)/Math.abs(weeklyChange));
      var est=new Date(); est.setDate(est.getDate()+weeksLeft*7);
      return {possible:true, current:current.toFixed(1)+'kg', target:target+'kg', weeklyGain:(weeklyChange>0?'+':'')+weeklyChange.toFixed(2)+'kg/tydz.',
        weeksLeft:weeksLeft, estimatedDate:fmtDatePL(est.toISOString().slice(0,10)), confidence:'średnia',
        reason:'Przy obecnym tempie '+weeklyChange.toFixed(2)+'kg/tydz. cel zostanie osiągnięty za ok. '+weeksLeft+' tygodni.'};
    },

    progressionPrediction: function(goal, store) {
      var workouts=store.workouts||[];
      var sessions7=filterDays(workouts,'date',7).length;
      if(goal.progress<=0||sessions7===0) return null;
      var weeksToComplete=Math.ceil((100-goal.progress)/(goal.progress>0?Math.max(goal.progress/4,2):5));
      var est=new Date(); est.setDate(est.getDate()+weeksToComplete*7);
      return {possible:true, current:goal.progress+'%', target:'100%', weeklyGain:null,
        weeksLeft:weeksToComplete, estimatedDate:fmtDatePL(est.toISOString().slice(0,10)), confidence:'niska',
        reason:'Szacunek oparty na obecnym postępie ('+goal.progress+'%).'};
    }
  };

  // ── PUBLIC API ─────────────────────────────────────────────────────────────
  ET.AIEngine = {
    recovery:           function(store)         { return RecoveryEngine.compute(store); },
    analyzeWorkout:     function(workout,store)  { return TrainingAnalyzer.analyzeWorkout(workout,store); },
    analyzeProgress:    function(store)          { return TrainingAnalyzer.analyzeProgress(store); },
    analyzeRun:         function(run,store)      { return RunningAnalyzer.analyzeRun(run,store); },
    predictRunTimes:    function(store)          { return RunningAnalyzer.predictTimes(store); },
    detectStagnation:   function(store)          { return StagnationDetector.analyze(store); },
    suggestPlanChanges: function(plan,store)     { return PlanSuggester.suggestChanges(plan,store); },
    correlations:       function(store)          { return CorrelationEngine.analyze(store); },
    report:             function(type,store) {
      switch(type){
        case 'weekly':          return ReportGenerator.weekly(store);
        case 'monthly':         return ReportGenerator.monthly(store);
        case 'pre-competition': return ReportGenerator.preCompetition(store);
        case 'post-competition':return ReportGenerator.postCompetition(store);
        default: return null;
      }
    },
    predictGoal:        function(goal,store)     { return GoalPredictor.predict(goal,store); }
  };
})();
