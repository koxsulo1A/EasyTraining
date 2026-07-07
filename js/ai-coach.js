(function() {
  'use strict';
  window.ET = window.ET || {};
  var _h = React.createElement;
  ET.AIEngine = ET.AIEngine || {};

  // ═══════════════════════════════════════════════════════════════════════
  //  SKŁAD CIAŁA — BMI / WHR / Body Fat (spec 8.2, 12.1)
  // ═══════════════════════════════════════════════════════════════════════
  ET.bmi = function(weightKg, heightCm) {
    if (!weightKg || !heightCm) return null;
    var m = heightCm/100;
    return weightKg / (m*m);
  };
  ET.bmiCategory = function(bmi) {
    if (bmi==null) return null;
    if (bmi < 18.5) return { label:'Niedowaga', color:'var(--a-light)' };
    if (bmi < 25)   return { label:'Norma',     color:'var(--green)' };
    if (bmi < 30)   return { label:'Nadwaga',   color:'var(--orange)' };
    return { label:'Otyłość', color:'var(--red)' };
  };
  ET.whr = function(waist, hips) {
    if (!waist || !hips) return null;
    return waist/hips;
  };
  ET.whrCategory = function(whr, gender) {
    if (whr==null) return null;
    var male = gender !== 'female';
    var hi = male ? 1.0 : 0.85, mid = male ? 0.90 : 0.80;
    if (whr < mid) return { label:'Niskie ryzyko',  color:'var(--green)' };
    if (whr < hi)  return { label:'Umiarkowane',    color:'var(--orange)' };
    return { label:'Wysokie ryzyko', color:'var(--red)' };
  };
  ET.waistCategory = function(waist, gender) {
    if (!waist) return null;
    var limit = gender !== 'female' ? 102 : 88;
    return waist < limit ? { label:'W normie', color:'var(--green)' } : { label:'Podwyższony', color:'var(--red)' };
  };
  // US Navy body fat method (obwody w cm)
  ET.bodyFatNavy = function(gender, heightCm, neck, waist, hips) {
    if (!heightCm || !neck || !waist) return null;
    var log10 = function(x){ return x>0 ? Math.log(x)/Math.LN10 : null; };
    var bf;
    if (gender === 'female') {
      if (!hips) return null;
      var l1 = log10(waist + hips - neck), l2 = log10(heightCm);
      if (l1==null||l2==null) return null;
      bf = 495 / (1.29579 - 0.35004*l1 + 0.22100*l2) - 450;
    } else {
      var m1 = log10(waist - neck), m2 = log10(heightCm);
      if (m1==null||m2==null) return null;
      bf = 495 / (1.0324 - 0.19077*m1 + 0.15456*m2) - 450;
    }
    if (!isFinite(bf) || bf<=0 || bf>70) return null;
    return bf;
  };
  ET.bodyFatCategory = function(bf, gender) {
    if (bf==null) return null;
    var male = gender !== 'female';
    var t = male ? [6,14,18,25] : [14,21,25,32]; // athlete/fitness/average/obese thresholds
    if (bf < t[0]) return { label:'Bardzo niski', color:'var(--a-light)' };
    if (bf < t[1]) return { label:'Sportowy',     color:'var(--green)' };
    if (bf < t[2]) return { label:'Fitness',      color:'var(--green)' };
    if (bf < t[3]) return { label:'Przeciętny',   color:'var(--orange)' };
    return { label:'Podwyższony', color:'var(--red)' };
  };

  // Zbiorczy skład ciała dla pomiaru
  ET.bodyComp = function(meas, profile) {
    if (!meas) return {};
    var p = profile || {};
    var height = p.height || meas.height;
    var gender = p.gender || 'male';
    var bmi = ET.bmi(meas.weight, height);
    var whr = ET.whr(meas.waist, meas.hips);
    var bf  = ET.bodyFatNavy(gender, height, meas.neck, meas.waist, meas.hips);
    return {
      height:height, gender:gender,
      bmi:bmi, bmiCat: ET.bmiCategory(bmi),
      whr:whr, whrCat: ET.whrCategory(whr, gender),
      waistCat: ET.waistCategory(meas.waist, gender),
      bodyFat:bf, bodyFatCat: ET.bodyFatCategory(bf, gender)
    };
  };

  // ═══════════════════════════════════════════════════════════════════════
  //  AI COACH — BIEGANIE (reguły, spec 7.1–7.2)
  // ═══════════════════════════════════════════════════════════════════════
  function paceToSec(pace) {
    if (pace==null) return null;
    var s = String(pace).split(':');
    if (s.length!==2) return null;
    return (+s[0])*60 + (+s[1]);
  }
  function sumIn(runs, fromDays, toDays, todayMs) {
    var t=0;
    runs.forEach(function(r){
      var a = Math.floor((todayMs - new Date(r.date).getTime())/86400000);
      if (a>=fromDays && a<=toDays) t += (r.distance||0);
    });
    return t;
  }
  ET.AIEngine.coachRunning = function(store) {
    var runs = (store.runs||[]).filter(function(r){ return r.date; }).slice();
    var out = [];
    if (!runs.length) { return [{ type:'info', icon:'🏃', title:'Zacznij biegać', body:'Zaloguj kilka biegów, a trener przeanalizuje tempo, wolumen i regularność.' }]; }
    runs.sort(function(a,b){ return a.date>b.date?-1:1; }); // najnowszy pierwszy
    var todayMs = new Date(ET.dstr()).getTime();

    // Wolumen tydzień do tygodnia
    var wk = sumIn(runs, 0, 6, todayMs), prevWk = sumIn(runs, 7, 13, todayMs);
    if (prevWk > 0) {
      var chg = (wk-prevWk)/prevWk*100;
      if (chg > 30) out.push({ type:'warning', icon:'⚠️', title:'Szybki wzrost kilometrażu', body:'Tydzień do tygodnia +'+Math.round(chg)+'%. Utrzymaj wzrost do ~10% tygodniowo, by uniknąć kontuzji.' });
      else if (chg < -30) out.push({ type:'info', icon:'📉', title:'Spadek kilometrażu', body:'W tym tygodniu '+wk.toFixed(1)+' km vs '+prevWk.toFixed(1)+' km. Jeśli to nieplanowane, wróć do rytmu.' });
      else out.push({ type:'positive', icon:'✅', title:'Stabilny kilometraż', body:'Ten tydzień: '+wk.toFixed(1)+' km ('+(chg>=0?'+':'')+Math.round(chg)+'% vs poprzedni). Dobra progresja.' });
    } else if (wk>0) {
      out.push({ type:'info', icon:'📊', title:'Kilometraż tygodnia', body:'W tym tygodniu '+wk.toFixed(1)+' km. Zbieram dane do porównań.' });
    }

    // Trend tempa (3 najnowsze vs 3 wcześniejsze, tylko biegi typu run/tempo)
    var paced = runs.filter(function(r){ return paceToSec(r.pace)!=null; });
    if (paced.length>=4) {
      var recent = paced.slice(0,3).map(function(r){ return paceToSec(r.pace); });
      var older = paced.slice(3,6).map(function(r){ return paceToSec(r.pace); });
      var avgR = recent.reduce(function(a,b){return a+b;},0)/recent.length;
      var avgO = older.reduce(function(a,b){return a+b;},0)/older.length;
      var d = avgO - avgR; // dodatnie = szybciej
      if (d > 3) out.push({ type:'achievement', icon:'⚡', title:'Tempo rośnie', body:'Ostatnie biegi są śr. o '+Math.round(d)+' s/km szybsze. Świetna forma!' });
      else if (d < -5) out.push({ type:'warning', icon:'🐢', title:'Tempo spada', body:'Ostatnie biegi wolniejsze o '+Math.round(-d)+' s/km. Rozważ więcej regeneracji lub wolniejszych wybiegań.' });
    }

    // Regularność
    var last14 = runs.filter(function(r){ return Math.floor((todayMs-new Date(r.date).getTime())/86400000)<=13; }).length;
    if (last14 >= 6) out.push({ type:'positive', icon:'🔥', title:'Wysoka regularność', body:last14+' biegów w 2 tygodnie. Konsekwencja to podstawa progresu.' });
    else if (last14 <= 1) out.push({ type:'info', icon:'📅', title:'Mała regularność', body:'Tylko '+last14+' bieg w ostatnich 2 tygodniach. Nawet 2–3 biegi/tydz. dają duży efekt.' });

    // Reguła: rosnące tętno w kolejnych biegach = zmęczenie/przetrenowanie
    var hrSeq = runs.filter(function(r){ return r.avgHr>0; }).slice(0,4);
    if (hrSeq.length>=3) {
      var rising = hrSeq[0].avgHr>hrSeq[1].avgHr && hrSeq[1].avgHr>hrSeq[2].avgHr && (hrSeq[0].avgHr-hrSeq[2].avgHr)>=5;
      if (rising) out.push({ type:'warning', icon:'🚨', title:'Rosnące tętno = zmęczenie', body:'Średnie tętno rośnie w 3 kolejnych biegach (+'+(hrSeq[0].avgHr-hrSeq[2].avgHr)+' bpm). Możliwe przetrenowanie — rozważ dzień odpoczynku.' });
    }

    // Reguła: progresja tempa 4 tyg. vs poprzednie 4 tyg.
    function avgPaceWindow(from, to) {
      var ps = [];
      runs.forEach(function(r){ var a=Math.floor((todayMs-new Date(r.date).getTime())/86400000); if (a>=from&&a<=to){ var sec=paceToSec(r.pace); if (sec!=null) ps.push(sec); } });
      return ps.length ? ps.reduce(function(x,y){return x+y;},0)/ps.length : null;
    }
    var p4=avgPaceWindow(0,27), p4prev=avgPaceWindow(28,55);
    if (p4!=null && p4prev!=null) {
      var volNow=sumIn(runs,0,27,todayMs), volPrev=sumIn(runs,28,55,todayMs);
      var dp = p4prev - p4; // dodatnie = szybciej teraz
      if (dp<=-4 && volNow>=volPrev) out.push({ type:'warning', icon:'🐌', title:'Tempo spada mimo obciążenia', body:'Śr. tempo z 4 tyg. wolniejsze o '+Math.round(-dp)+' s/km przy niespadającym kilometrażu. Możliwe zmęczenie — rozważ deload.' });
      else if (dp>=4) out.push({ type:'achievement', icon:'📈', title:'Wydolność rośnie', body:'Śr. tempo z ostatnich 4 tyg. szybsze o '+Math.round(dp)+' s/km względem poprzednich 4 tyg.' });
    }

    // Reguła: bilans tygodniowy (długi / interwały / trucht)
    var last7 = runs.filter(function(r){ return Math.floor((todayMs-new Date(r.date).getTime())/86400000)<=6; });
    if (last7.length>=2) {
      var hasLongW = last7.some(function(r){ return r.type==='long' || (r.distance||0)>=12; });
      var hasIntW = last7.some(function(r){ return r.type==='interval'; });
      if (!hasLongW) out.push({ type:'info', icon:'🛣', title:'Brak treningu wytrzymałościowego', body:'W tym tygodniu brakuje długiego, spokojnego biegu. Dodaj go, by budować bazę tlenową.' });
      else if (!hasIntW) out.push({ type:'info', icon:'⚡', title:'Brak treningu szybkościowego', body:'W tym tygodniu brak interwałów. Dodaj sesję interwałową, by poprawić prędkość i próg mleczanowy.' });
    }

    // Reguła: stagnacja tempa na ~5 km (6 tyg.)
    var fives = runs.filter(function(r){ var d=r.distance||0; return d>=4 && d<=6 && paceToSec(r.pace)!=null; });
    var recent5 = fives.filter(function(r){ return Math.floor((todayMs-new Date(r.date).getTime())/86400000)<=42; });
    var older5 = fives.filter(function(r){ var a=Math.floor((todayMs-new Date(r.date).getTime())/86400000); return a>42 && a<=84; });
    if (recent5.length && older5.length) {
      var bestRecent = Math.min.apply(null, recent5.map(function(r){ return paceToSec(r.pace); }));
      var bestOlder = Math.min.apply(null, older5.map(function(r){ return paceToSec(r.pace); }));
      if (bestRecent >= bestOlder-2) out.push({ type:'info', icon:'🎯', title:'Tempo na ~5 km stoi w miejscu', body:'Najlepsze tempo na ~5 km nie poprawiło się od 6 tyg. Dodaj interwały 400 m, by przełamać próg mleczanowy.' });
    }

    // Tętno (wysokie strefy)
    var hrRuns = runs.slice(0,5).filter(function(r){ return r.avgHr>0; });
    if (hrRuns.length) {
      var avgHr = Math.round(hrRuns.reduce(function(t,r){return t+r.avgHr;},0)/hrRuns.length);
      if (avgHr >= 170) out.push({ type:'warning', icon:'❤️', title:'Wysokie tętno', body:'Śr. tętno ostatnich biegów: '+avgHr+' bpm. Włącz więcej biegów w niższych strefach (Zone 2).' });
    }

    return out.slice(0,8);
  };

  // ═══════════════════════════════════════════════════════════════════════
  //  AI COACH — POMIARY (reguły, spec 8.1)
  // ═══════════════════════════════════════════════════════════════════════
  ET.AIEngine.coachMeasurements = function(store) {
    var meas = (store.measurements||[]).filter(function(m){ return m.date; }).slice();
    var out = [];
    if (meas.length<1) return [{ type:'info', icon:'📏', title:'Brak pomiarów', body:'Dodaj pomiary, a trener oceni trendy wagi, obwodów i składu ciała.' }];
    meas.sort(function(a,b){ return a.date>b.date?-1:1; });
    var latest = meas[0], first = meas[meas.length-1], prev = meas[1];
    var profile = store.profile || {};

    function trend(key) {
      if (latest[key]==null || first[key]==null || meas.length<2) return null;
      return latest[key]-first[key];
    }

    // Waga
    var dw = trend('weight');
    if (dw!=null) {
      if (Math.abs(dw) < 0.3) out.push({ type:'info', icon:'⚖️', title:'Waga stabilna', body:'Od pierwszego pomiaru zmiana '+(dw>=0?'+':'')+dw.toFixed(1)+' kg. Masa utrzymana.' });
      else if (dw < 0) out.push({ type:'positive', icon:'📉', title:'Spadek wagi', body:latest.weight+' kg ('+dw.toFixed(1)+' kg od startu). Trzymaj deficyt kaloryczny i białko.' });
      else out.push({ type:'positive', icon:'📈', title:'Wzrost wagi', body:latest.weight+' kg (+'+dw.toFixed(1)+' kg od startu). Jeśli budujesz masę — dobrze.' });
    }

    // Pas
    var dwa = trend('waist');
    if (dwa!=null && Math.abs(dwa)>=0.5) {
      out.push(dwa<0
        ? { type:'achievement', icon:'🎯', title:'Pas w dół', body:'Obwód pasa '+dwa.toFixed(1)+' cm od startu ('+latest.waist+' cm). Silny sygnał redukcji tłuszczu.' }
        : { type:'warning', icon:'⚠️', title:'Pas rośnie', body:'Obwód pasa +'+dwa.toFixed(1)+' cm ('+latest.waist+' cm). Sprawdź bilans kaloryczny.' });
    }

    // Rekompozycja: pas w dół + biceps/udo w górę
    var db = trend('bicep'), dt = trend('thigh');
    if (dwa!=null && dwa<0 && ((db!=null&&db>0)||(dt!=null&&dt>0))) {
      out.push({ type:'achievement', icon:'💪', title:'Rekompozycja', body:'Pas maleje, a obwody mięśni rosną — tracisz tłuszcz i budujesz mięśnie jednocześnie.' });
    }

    // Skład ciała
    var comp = ET.bodyComp(latest, profile);
    if (comp.bmi!=null) {
      out.push({ type:'info', icon:'🧮', title:'BMI '+comp.bmi.toFixed(1)+' — '+(comp.bmiCat?comp.bmiCat.label:''),
        body:'BMI to zgrubny wskaźnik — u osób umięśnionych bywa zawyżone. Zwracaj większą uwagę na obwód pasa i skład ciała.' });
    } else if (!comp.height) {
      out.push({ type:'info', icon:'📐', title:'Uzupełnij wzrost', body:'Dodaj wzrost w Profilu, aby liczyć BMI i % tkanki tłuszczowej.' });
    }
    if (comp.bodyFat!=null) {
      out.push({ type:'info', icon:'🔬', title:'Tkanka tłuszczowa ~'+comp.bodyFat.toFixed(1)+'%'+(comp.bodyFatCat?' — '+comp.bodyFatCat.label:''),
        body:'Szacunek metodą obwodową (US Navy: szyja, pas'+(comp.gender==='female'?', biodra':'')+', wzrost). Traktuj jako trend, nie wartość absolutną.' });
    }

    // Reguła: waga spada, ale pas stoi → woda/glikogen, nie tłuszcz
    if (dw!=null && dwa!=null && dw < -0.5 && Math.abs(dwa) < 0.5) {
      out.push({ type:'info', icon:'💧', title:'Spadek wagi bez zmiany pasa', body:'Tracisz głównie wodę/glikogen, nie tłuszcz. Zadbaj o podaż białka i trening siłowy.' });
    }

    // Reguła: tempo chudnięcia
    var spanDays = Math.floor((new Date(latest.date).getTime() - new Date(first.date).getTime())/86400000);
    if (dw!=null && dw < 0 && spanDays >= 14) {
      var perWeek = (-dw)/(spanDays/7);
      if (perWeek > 1) out.push({ type:'warning', icon:'⚠️', title:'Chudniesz za szybko', body:'Ubytek ~'+perWeek.toFixed(1)+' kg/tydz. Ryzyko utraty mięśni i spowolnienia metabolizmu — rozważ mniejszy deficyt.' });
    }

    // Reguła: typ sylwetki wg WHR
    if (comp.whr!=null && comp.whrCat) {
      if (comp.whrCat.label !== 'Niskie ryzyko') {
        out.push({ type:'warning', icon:'🍎', title:'Sylwetka typu androidalnego', body:'WHR '+comp.whr.toFixed(2)+' powyżej normy — tłuszcz brzuszny. Priorytet: redukcja + trening siłowy, podwyższone ryzyko metaboliczne.' });
      } else if (comp.bmiCat && (comp.bmiCat.label==='Nadwaga' || comp.bmiCat.label==='Otyłość')) {
        out.push({ type:'info', icon:'🍐', title:'Typ gynoidalny', body:'WHR w normie mimo podwyższonego BMI — niższe ryzyko metaboliczne, ale redukcja nadal wskazana.' });
      }
    }

    // Reguła: BMI nadwaga, ale Body Fat w normie → BMI zawyżone masą mięśniową
    if (comp.bmiCat && comp.bmiCat.label==='Nadwaga' && comp.bodyFatCat && ['Bardzo niski','Sportowy','Fitness'].indexOf(comp.bodyFatCat.label)!==-1) {
      out.push({ type:'positive', icon:'💪', title:'BMI zawyżone przez mięśnie', body:'BMI wskazuje nadwagę, ale tkanka tłuszczowa jest w normie. Lepszym wskaźnikiem dla Ciebie jest Body Fat i obwód pasa.' });
    }

    return out.slice(0,8);
  };

  // ═══════════════════════════════════════════════════════════════════════
  //  AI COACH — WALIDATOR TRENINGU WG WYTYCZNYCH (ACSM/NSCA/Issurin/Wilson)
  // ═══════════════════════════════════════════════════════════════════════
  ET.AIEngine.coachPlan = function(store) {
    var out = [];
    if (!window.ETCore) return out;
    var now = Date.now();
    var workouts = store.workouts || [];
    var runs = store.runs || [];

    // 1. Objętość tygodniowa per partia (Schoenfeld: 10-20 serii/tydz.)
    var week = workouts.filter(function(w){ return (now - new Date(w.date).getTime()) <= 7*86400000; });
    if (week.length) {
      var setsPerGroup = {};
      week.forEach(function(w) {
        (w.exercises||[]).forEach(function(ex) {
          var db = (ET.EXERCISES_BASIC||[]).find(function(e){ return e.name===ex.name; });
          var tag = db && (db.tags||[])[0];
          if (!tag) return;
          var n = (ex.setsData||[]).filter(function(s){ return s.done; }).length || ex.sets || 0;
          setsPerGroup[tag] = (setsPerGroup[tag]||0) + n;
        });
      });
      var vol = ETCore.WEEKLY_VOLUME;
      Object.keys(setsPerGroup).forEach(function(tag) {
        var grp = (ET.MUSCLE_GROUPS||[]).find(function(g){ return g.tag===tag; });
        var label = grp ? grp.label : tag;
        if (grp && grp.size==='duza' && setsPerGroup[tag] < vol.setsPerMuscleMin) {
          out.push({ type:'info', icon:'📉', title:label+': mało objętości',
            body: setsPerGroup[tag]+' serii w 7 dni — dla wzrostu mięśni zalecane '+vol.setsPerMuscleMin+'-'+vol.setsPerMuscleMax+' ('+vol.source.split(';')[0]+').' });
        }
        if (setsPerGroup[tag] > vol.setsPerMuscleMax) {
          out.push({ type:'warning', icon:'📈', title:label+': bardzo dużo objętości',
            body: setsPerGroup[tag]+' serii w 7 dni przekracza zalecane maksimum '+vol.setsPerMuscleMax+' — ryzyko przekroczenia zdolności regeneracji ('+vol.source.split(';')[0]+').' });
        }
      });
    }

    // 2. Efekty rezydualne (Issurin): zanik adaptacji przy przerwie
    function daysSince(list) {
      if (!list.length) return null;
      var newest = Math.max.apply(null, list.map(function(x){ return new Date(x.date).getTime(); }));
      return Math.floor((now - newest) / 86400000);
    }
    var dStr = daysSince(workouts);
    if (dStr != null && dStr >= 3) {
      var decay = ETCore.residualDecayPct('siła maksymalna', dStr);
      if (decay != null && decay >= 66 && decay < 130) {
        out.push({ type:'warning', icon:'⏳', title:'Siła: adaptacja zanika',
          body: dStr+' dni bez treningu siłowego — efekt rezydualny siły utrzymuje się ~30 dni (Issurin 2010). Wróć do treningu, by nie tracić wypracowanej bazy.' });
      }
    }
    var dRun = daysSince(runs);
    if (dRun != null && dRun >= 20 && runs.length >= 3) {
      var decayA = ETCore.residualDecayPct('wydolność tlenowa', dRun);
      if (decayA != null && decayA >= 66 && decayA < 130) {
        out.push({ type:'info', icon:'🫁', title:'Wydolność: przerwa w bieganiu',
          body: dRun+' dni bez biegu — baza tlenowa utrzymuje się ~30 dni (Issurin 2010).' });
      }
    }

    // 3. Kolejność ćwiczeń w ostatnim treningu (Ratamess/NSCA)
    var last = workouts[0];
    if (last && (last.exercises||[]).length >= 2 && ETCore.validateExerciseOrder) {
      var metas = last.exercises.map(function(ex) {
        var db = (ET.EXERCISES_BASIC||[]).find(function(e){ return e.name===ex.name; });
        return db ? { isPower:db.isPower, isCompound:db.isCompound, isCore:db.isCoreEx } : {};
      });
      var viol = ETCore.validateExerciseOrder(metas);
      if (viol.length) {
        var v = viol[0];
        out.push({ type:'info', icon:'🔀', title:'Kolejność ćwiczeń do poprawy',
          body: '„'+last.exercises[v.laterIndex].name+'" (wielostawowe/moc) było po „'+last.exercises[v.earlierIndex].name+'" — duże, złożone ćwiczenia rób na początku sesji, gdy jesteś świeży (Ratamess 2009).' });
      }
    }

    // 4. Interferencja cardio×siła (Wilson 2012) — z realnych danych 28 dni
    var runs28 = runs.filter(function(r){ return (now - new Date(r.date).getTime()) <= 28*86400000; });
    var str28 = workouts.filter(function(w){ return (now - new Date(w.date).getTime()) <= 28*86400000; });
    if (runs28.length && str28.length && ETCore.concurrentTrainingCheck) {
      var warns = ETCore.concurrentTrainingCheck({
        goal: 'hypertrophy',
        cardioSessionsPerWeek: Math.round(runs28.length/4*10)/10,
        cardioMinutesPerWeek: Math.round(runs28.reduce(function(s,r){ return s+(+r.duration||0); },0)/4),
        cardioType: 'running',
        sameSessionAsStrength: false,
      });
      warns.forEach(function(wr) {
        if (wr.severity==='warning') out.push({ type:'warning', icon:'🏃', title:'Interferencja bieganie × siłownia', body: wr.message+' ('+wr.source+')' });
      });
    }

    if (!out.length && (workouts.length || runs.length)) {
      out.push({ type:'positive', icon:'✅', title:'Trening zgodny z wytycznymi',
        body:'Objętość, kolejność ćwiczeń i proporcje cardio/siła mieszczą się w zaleceniach ACSM/NSCA.' });
    }
    return out.slice(0, 6);
  };

  // ═══════════════════════════════════════════════════════════════════════
  //  WSPÓŁDZIELONY WIDOK LISTY WNIOSKÓW
  // ═══════════════════════════════════════════════════════════════════════
  var TYPE_COLOR = { positive:'var(--green)', warning:'var(--orange)', info:'var(--a-light)', achievement:'var(--yellow)' };
  var TYPE_BG    = { positive:'rgba(34,197,94,.08)', warning:'rgba(249,115,22,.08)', info:'rgba(99,102,241,.08)', achievement:'rgba(234,179,8,.08)' };
  ET.InsightList = function(insights) {
    return _h('div', null,
      (insights||[]).map(function(ins, i) {
        return _h('div', { key:i, style:{ padding:'10px 12px', borderRadius:'var(--r2)', background:TYPE_BG[ins.type]||'var(--s3)', border:'1px solid '+(TYPE_COLOR[ins.type]||'var(--b1)')+'44', marginBottom:8 } },
          _h('div', { style:{ display:'flex', gap:8, alignItems:'flex-start' } },
            _h('span', { style:{ fontSize:'1.1rem', flexShrink:0 } }, ins.icon),
            _h('div', null,
              _h('div', { style:{ fontWeight:700, fontSize:'.82rem', color:TYPE_COLOR[ins.type]||'var(--t2)', marginBottom:3 } }, ins.title),
              _h('div', { style:{ fontSize:'.76rem', color:'var(--t2)', lineHeight:1.5 } }, ins.body)
            )
          )
        );
      })
    );
  };
})();
