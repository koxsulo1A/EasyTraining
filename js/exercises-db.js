(function() {
  'use strict';
  window.ET = window.ET || {};

  // ── GRUPY MIĘŚNIOWE (ćwiczenia podstawowe) ───────────────────────────────
  ET.MUSCLE_GROUPS = [
    { tag:'klatka_piersiowa', label:'Klatka piersiowa', icon:'🫁', size:'duza' },
    { tag:'plecy',            label:'Plecy',             icon:'🔙', size:'duza' },
    { tag:'nogi',             label:'Nogi (uda/pośladki)', icon:'🦵', size:'duza' },
    { tag:'biceps',           label:'Biceps',            icon:'💪', size:'mala' },
    { tag:'triceps',          label:'Triceps',           icon:'🔱', size:'mala' },
    { tag:'barki',            label:'Barki',             icon:'🤸', size:'mala' },
    { tag:'lydki',            label:'Łydki',             icon:'🦿', size:'mala' },
    { tag:'przedramiona',     label:'Przedramiona',      icon:'🤙', size:'mala' },
    { tag:'core_brzuch',      label:'Core / Brzuch',     icon:'🧘', size:'mala' },
  ];

  // ── REGIONY CIAŁA (ćwiczenia korekcyjne) ─────────────────────────────────
  ET.BODY_REGIONS = [
    { id:'stopa_skok',     label:'Stopa / staw skokowy' },
    { id:'kolano',         label:'Kolano' },
    { id:'biodro_miednica',label:'Biodro / miednica' },
    { id:'kregoslup',      label:'Kręgosłup / tułów' },
    { id:'barki_lopatki',  label:'Barki / łopatki' },
  ];

  // ── PRZYPADŁOŚCI / DOLEGLIWOŚCI (tagi korekcyjne) ────────────────────────
  ET.CONDITIONS = [
    { tag:'przodopochylenie_miednicy',   label:'Przodopochylenie miednicy',            region:'biodro_miednica' },
    { tag:'protrakcja_barkow',           label:'Barki do przodu (protrakcja)',         region:'barki_lopatki' },
    { tag:'kolana_valgus',               label:'Kolana do środka (valgus)',            region:'kolano' },
    { tag:'ograniczone_zgiecie_skokowe', label:'Ograniczone zgięcie stawu skokowego',  region:'stopa_skok' },
    { tag:'tendinopatia_rzepki',         label:'Tendinopatia rzepki (kolano skoczka)', region:'kolano' },
    { tag:'dyskopatia_L',                label:'Dyskopatia lędźwiowa',                 region:'kregoslup' },
    { tag:'ciasnota_podbarkowa',         label:'Ciasnota podbarkowa / impingement',    region:'barki_lopatki' },
    { tag:'niestabilnosc_barku',         label:'Niestabilność barku',                  region:'barki_lopatki' },
    { tag:'niestabilnosc_skokowa',       label:'Niestabilność stawu skokowego',        region:'stopa_skok' },
    { tag:'ITBS',                        label:'Pasmo biodrowo-piszczelowe / ból boczny kolana', region:'kolano' },
  ];

  // Helper skrótowy dla podstawowych
  function B(id, name, tag, equipment, lvl, instructions, mistakes) {
    return { id:id, name:name, type:'podstawowe', tags:[tag], equipment:equipment, difficulty:lvl,
      instructions:instructions, common_mistakes:mistakes };
  }
  // Helper skrótowy dla korekcyjnych
  function C(id, name, cond, region, target, mechanism, lvl, equipment) {
    return { id:id, name:name, type:'korekcyjne', condition_tags:[cond], body_region:region,
      target_anatomy:target, mechanism:mechanism, difficulty:lvl, equipment:equipment, tags:[cond] };
  }

  // ═══════════════════════════════════════════════════════════════════════
  //  A. ĆWICZENIA PODSTAWOWE (90)
  // ═══════════════════════════════════════════════════════════════════════
  ET.EXERCISES_BASIC = [
    // A1. KLATKA PIERSIOWA
    B('kp1','Wyciskanie sztangi na ławce płaskiej','klatka_piersiowa','Ławka, sztanga',2,'Leżąc, stopy na podłodze, ściągnij łopatki. Opuść sztangę do dolnej części klatki, wypchnij dynamicznie.','Odrywanie stóp, brak ściągnięcia łopatek, odbijanie od klatki'),
    B('kp2','Wyciskanie hantli na ławce płaskiej','klatka_piersiowa','Ławka, hantle',2,'Leżąc, hantle nad klatką. Opuszczaj do boków klatki z łokciami ~45°, wypchnij.','Zbyt szerokie łokcie (90°), brak kontroli w dolnym punkcie'),
    B('kp3','Wyciskanie sztangi na ławce skośnej (30–45°)','klatka_piersiowa','Ławka skośna, sztanga',2,'Kąt 30–45°. Sztanga opada do górnej części klatki. Większy nacisk na górny akton.','Zbyt stromy kąt (>60° → barki), odbijanie'),
    B('kp4','Rozpiętki z hantlami na ławce płaskiej','klatka_piersiowa','Ławka, hantle',2,'Leżąc, hantle nad klatką, lekko ugięte łokcie. Otwieraj klatkę szerokim łukiem.','Prostowanie ramion, za duży ciężar'),
    B('kp5','Pompki klasyczne','klatka_piersiowa','Brak',1,'Dłonie na szerokość barków, ciało w linii prostej. Opuszczaj klatkę do podłogi, łokcie ~45° od tułowia.','Opadanie bioder, łokcie na zewnątrz, brak pełnego zakresu'),
    B('kp6','Wyciskanie na maszynie Hammer','klatka_piersiowa','Maszyna',1,'Siedząc, plecy dociśnięte. Wypychaj uchwyty przed siebie. Dobra izolacja.','Zbyt szybkie tempo, przeprost w łokciach'),
    B('kp7','Cable crossover','klatka_piersiowa','Wyciągi',2,'Stań między wyciągami, uchwyty na wysokości barków. Ściągaj linki w dół i do środka.','Za duży ciężar, pochylanie tułowia'),
    B('kp8','Dipy z pochyleniem do przodu','klatka_piersiowa','Poręcze',3,'Pochyl tułów ~45°, opuszczaj do rozciągnięcia klatki.','Pionowa pozycja (→ triceps), zbyt głęboko'),
    B('kp9','Wyciskanie wąskim chwytem na skosie','klatka_piersiowa','Ławka skośna, sztanga',3,'Chwyt na szerokość barków. Sztanga do środkowej części klatki. Akcent na wewnętrzną część.','Za wąski chwyt (→ triceps)'),
    B('kp10','Pompki z nogami na podwyższeniu','klatka_piersiowa','Podwyższenie',2,'Stopy na ławce, dłonie na podłodze. Nacisk na górną część klatki.','Opadanie bioder, brak pełnego zakresu'),

    // A2. PLECY
    B('pl1','Martwy ciąg klasyczny','plecy','Sztanga',3,'Stopy na szer. bioder, sztanga nad śródstopiem. Plecy proste. Wstań prowadząc sztangę blisko piszczeli.','Zaokrąglone plecy, sztanga daleko od ciała'),
    B('pl2','Podciąganie na drążku nachwytem','plecy','Drążek',2,'Ściągnij łopatki, podciągnij brodę nad drążek. Opadaj kontrolowanie.','Bujanie, niepełne opuszczanie'),
    B('pl3','Wiosłowanie sztangą w opadzie','plecy','Sztanga',2,'Tułów pochylony ~45°, przyciągaj do dolnej części brzucha.','Zaokrąglone plecy, szarpanie'),
    B('pl4','Wiosłowanie hantlą w podporze (jednorącz)','plecy','Ławka, hantla',1,'Kolano i dłoń na ławce. Przyciągaj hantlę do biodra, łokieć blisko ciała.','Rotacja tułowia, opuszczanie barku'),
    B('pl5','Ściąganie drążka wyciągu górnego (szeroki chwyt)','plecy','Wyciąg górny',1,'Ściągnij drążek do górnej części klatki, ściągając łopatki.','Odchylanie tułowia, ciągnięcie za kark'),
    B('pl6','Wiosłowanie na wyciągu dolnym (close grip)','plecy','Wyciąg dolny',1,'Przyciągaj do brzucha, prostując plecy na końcu.','Zaokrąglone plecy, zbyt szybkie tempo'),
    B('pl7','Pull-over z hantlą','plecy','Ławka, hantla',2,'Leżąc w poprzek, hantla za głowę z lekko ugiętymi łokciami.','Za duży ciężar, prostowanie ramion'),
    B('pl8','Face pull','plecy','Wyciąg, lina',1,'Przyciągaj do czoła, odwodząc przedramiona na zewnątrz.','Za duży ciężar, brak rotacji zewnętrznej'),
    B('pl9','Back extension na ławce rzymskiej','plecy','Ławka rzymska',1,'Unieś tułów do linii prostej, napinając prostowniki i pośladki.','Przeprost w lędźwiach'),
    B('pl10','Wiosłowanie podchwytem (Yates row)','plecy','Sztanga',2,'Tułów ~30°, chwyt podchwytem. Przyciągaj do dolnej części brzucha.','Zaokrąglone plecy, odchylanie tułowia'),

    // A3. NOGI
    B('no1','Przysiad ze sztangą (high bar)','nogi','Stojak, sztanga',2,'Sztanga na pułapkach. Zejdź do przysiadu, kolana nad stopami.','Pięty odrywają się, kolana do środka'),
    B('no2','Przysiad bułgarski','nogi','Ławka, hantle',2,'Tylna stopa na ławce. Opuszczaj biodro pionowo w dół.','Kolano zapada się, tułów pochyla się'),
    B('no3','Martwy ciąg rumuński (RDL)','nogi','Sztanga',2,'Lekko ugięte kolana, wypchnij biodra w tył. Sztanga wzdłuż ud.','Zaokrąglone plecy, zbyt proste nogi'),
    B('no4','Hip thrust','nogi','Ławka, sztanga',1,'Plecy na ławce, sztanga na biodrach. Wypchnij biodra w górę.','Przeprost w lędźwiach, za szybkie tempo'),
    B('no5','Wykroki chodzone z hantlami','nogi','Hantle',1,'Długi krok w przód, opuść tylne kolano. Idź dalej.','Za krótki krok, tułów pochyla się'),
    B('no6','Prasa do nóg (leg press)','nogi','Maszyna',1,'Plecy dociśnięte. Wypychaj platformę, nie prostuj kolan do końca.','Odrywanie pośladków, przeprost kolan'),
    B('no7','Przysiad goblet','nogi','Kettlebell/hantla',1,'Ciężar przy klatce. Wykonaj głęboki przysiad z prostymi plecami.','Pięty odrywają się, kolana do środka'),
    B('no8','Wykroki w tył (reverse lunges)','nogi','Hantle (opcja)',1,'Krok w tył, opuść tylne kolano. Biodra i tułów pionowo.','Tułów pochyla się do przodu'),
    B('no9','Przysiad przedni (front squat)','nogi','Stojak, sztanga',3,'Sztanga na przednich barkach, łokcie wysoko.','Łokcie opadają, tułów pochyla się'),
    B('no10','Step-up na skrzynię','nogi','Skrzynia, hantle',1,'Wejdź na skrzynię bez odbijania drugą nogą.','Odbijanie, kolano zapada się'),

    // A4. BICEPS
    B('bi1','Uginanie ramion ze sztangą stojąc','biceps','Sztanga',1,'Łokcie przy tułowiu. Ugnij ramiona, napinając biceps.','Bujanie, odrywanie łokci'),
    B('bi2','Uginanie z hantlami naprzemienne','biceps','Hantle',1,'Uginaj z supinacją (wykręcaniem nadgarstka).','Bujanie, rotacja tułowia'),
    B('bi3','Uginanie na modlitewniku (preacher curl)','biceps','Ławka Scott, sztanga EZ',1,'Ramiona na poduszce. Uginaj pełny zakres.','Za duży ciężar, odrywanie ramion'),
    B('bi4','Uginanie młotkowe (hammer curl)','biceps','Hantle',1,'Dłonie do siebie (chwyt młotkowy). Uginaj obie ręce.','Bujanie, szybkie opuszczanie'),
    B('bi5','Uginanie na wyciągu dolnym z linką prostą','biceps','Wyciąg dolny',1,'Linka podchwytem, łokcie przy tułowiu.','Odchylanie tułowia'),
    B('bi6','Uginanie na ławce skośnej (incline curl)','biceps','Ławka skośna, hantle',1,'Ramiona zwisają. Uginaj z supinacją. Rozciąga biceps w dole.','Bujanie, skracanie zakresu'),
    B('bi7','Uginanie koncentrowane','biceps','Ławka, hantla',1,'Łokieć oparty o wewn. stronę uda. Izoluje biceps.','Odbijanie od uda'),
    B('bi8','Uginanie ze sztangą EZ','biceps','Sztanga EZ',1,'Chwyć w zewnętrznych wygięciach. Mniejsze obciążenie nadgarstków.','Bujanie, niepełny zakres'),
    B('bi9','Uginanie z liną na wyciągu górnym','biceps','Wyciąg górny, lina',2,'Ramiona na wys. barków. Przyciągaj do głowy.','Za duży ciężar'),
    B('bi10','Uginanie Zottman','biceps','Hantle',2,'Uginaj z supinacją, opuszczaj nachwytem. Pracuje biceps + przedramię.','Za duży ciężar, brak kontroli rotacji'),

    // A5. TRICEPS
    B('tr1','French press (skull crusher)','triceps','Ławka, sztanga EZ',2,'Leżąc, opuszczaj sztangę do czoła. Wyprostuj.','Łokcie na zewnątrz, opuszczanie na nos'),
    B('tr2','Prostowanie ramion na wyciągu (pushdown)','triceps','Wyciąg górny',1,'Łokcie przy tułowiu. Prostuj przedramiona w dół.','Odchylanie tułowia, odrywanie łokci'),
    B('tr3','Dipy na ławce','triceps','Dwie ławki',1,'Dłonie na ławce za plecami. Łokcie idą do tyłu.','Łokcie na boki, za głęboko'),
    B('tr4','Overhead extension z hantlą','triceps','Hantla',1,'Hantla za głową, łokcie blisko uszu. Prostuj ramiona w górę.','Łokcie na boki, wyginanie pleców'),
    B('tr5','Overhead extension na wyciągu z liną','triceps','Wyciąg górny, lina',1,'Tyłem do wyciągu, wypychaj przedramiona w górę.','Wyginanie pleców'),
    B('tr6','Pompki diamentowe','triceps','Brak',2,'Dłonie razem pod klatką (diament). Łokcie blisko ciała.','Łokcie na boki, opadanie bioder'),
    B('tr7','Kickback z hantlą w opadzie','triceps','Ławka, hantla',1,'Ramię równolegle do podłogi. Prostuj przedramię w tył.','Bujanie ramieniem'),
    B('tr8','Wyciskanie wąskim chwytem na płaskiej','triceps','Ławka, sztanga',2,'Chwyt na szer. barków, łokcie blisko ciała.','Za szeroki chwyt (→ klatka)'),
    B('tr9','Dipy na poręczach (pionowo)','triceps','Poręcze',3,'Tułów pionowo, łokcie blisko ciała. Izolacja tricepsa.','Pochylanie do przodu (→ klatka)'),
    B('tr10','Prostowanie z gumą (band pushdown)','triceps','Guma',1,'Guma zaczepiona nad głową. Prostuj przedramiona w dół.','Odrywanie łokci'),

    // A6. BARKI
    B('ba1','OHP sztangą stojąc','barki','Sztanga',2,'Wypchnij nad głowę, głowa przechodzi pod sztangę.','Odchylanie tułowia, za szeroki chwyt'),
    B('ba2','Wznosy hantli bokiem','barki','Hantle',1,'Lekko ugięte łokcie. Unieś do poziomu barków, jakbyś wylewał dzbanek.','Bujanie, przekraczanie linii barków'),
    B('ba3','Wznosy hantli przodem','barki','Hantle',1,'Unieś przed siebie do wysokości oczu. Naprzemiennie.','Bujanie, za wysoko'),
    B('ba4','Arnold press','barki','Ławka, hantle',2,'Hantle przed klatką, dłonie do siebie. Wypychaj z rotacją na zewnątrz.','Zbyt szybka rotacja'),
    B('ba5','Rear delt fly (wznosy w opadzie)','barki','Ławka, hantle',2,'Tułów na udach, unieś ramiona na boki. Celuje w tylny akton.','Bujanie, za duży ciężar'),
    B('ba6','Upright row (przyciąganie do brody)','barki','Sztanga EZ',2,'Wąski chwyt, przyciągaj wzdłuż ciała do brody.','Za wysoko (impingement)'),
    B('ba7','Cable lateral raise','barki','Wyciąg dolny',1,'Bokiem do wyciągu, unieś ramię w bok.','Bujanie, za duży ciężar'),
    B('ba8','Behind-the-neck press (tylko zdrowe barki!)','barki','Sztanga',3,'Sztanga za karkiem, wypychaj nad głowę.','Za szeroki chwyt, przeciwwskazane przy impingemencie'),
    B('ba9','Reverse fly na pec-deck','barki','Maszyna pec-deck',1,'Przodem do maszyny, otwieraj ramiona do tyłu.','Za duży ciężar'),
    B('ba10','Combo raise (wznosy przód + bok)','barki','Hantle',2,'Unieś w przód → opuść → unieś w bok. Cały naramienny.','Bujanie'),

    // A7. ŁYDKI
    B('ly1','Wspięcia na palcach stojąc (maszyna)','lydki','Maszyna',1,'Opuść pięty poniżej platformy, wspnij się maksymalnie.','Za szybkie tempo, brak pełnego zakresu'),
    B('ly2','Wspięcia ze sztangą na plecach','lydki','Sztanga, podest',1,'Stopy na podeście, pięty w powietrzu. Wspnij się maksymalnie.','Za duży ciężar, ugięte kolana'),
    B('ly3','Wspięcia na palcach siedząc','lydki','Maszyna',1,'Kolana pod wałkami. Celuje w płaszczkowatego (soleus).','Za szybkie tempo'),
    B('ly4','Wspięcia na jednej nodze stojąc','lydki','Hantla (opcja)',2,'Na podeście, jedna noga. Większa intensywność.','Utrata równowagi'),
    B('ly5','Ośle wspięcia (donkey calf raise)','lydki','Partner/maszyna',2,'Pochylony tułów, partner obciąża biodra.','Zaokrąglone plecy'),
    B('ly6','Wspięcia na prasie do nóg','lydki','Prasa do nóg',1,'Stopy na dole platformy, nogi proste. Wypychaj palcami.','Ugięte kolana'),
    B('ly7','Skoki na skakance na palcach','lydki','Skakanka',1,'Pięty nie dotykają podłoża. Buduje wytrzymałość łydek.','Pięty uderzają o podłoże'),
    B('ly8','Wspięcia z hantlą na kolanie siedząc','lydki','Ławka, hantla',1,'Hantla na kolanie (na ręczniku). Wariant domowy.','Hantla spada'),
    B('ly9','Farmer walk na palcach','lydki','Hantle (opcja)',1,'Chodź na palcach z maksymalnym wspięciem.','Opadanie pięt'),
    B('ly10','Pogo jumps (szybkie podskoki na palcach)','lydki','Brak',2,'Płytkie podskoki tylko z palców. Buduje moc i sprężystość.','Zginanie kolan'),

    // A8. PRZEDRAMIONA
    B('pr1','Zwijanie nadgarstków podchwytem (wrist curl)','przedramiona','Ławka, sztanga',1,'Przedramiona na udach, nadgarstki poza kolanami. Zwijaj w górę.','Za duży ciężar, odrywanie przedramion'),
    B('pr2','Zwijanie nadgarstków nachwytem (reverse wrist curl)','przedramiona','Ławka, sztanga',1,'Chwyt nachwytem. Zwijaj nadgarstki w górę. Celuje w prostowniki.','Za duży ciężar'),
    B('pr3','Spacer farmera (farmer’s walk)','przedramiona','Hantle/kettlebells',2,'Ciężkie hantle, idź określony dystans. Buduje siłę chwytu.','Garbienie się'),
    B('pr4','Dead hang na czas','przedramiona','Drążek',1,'Zwieś na drążku, utrzymaj jak najdłużej. Czysta praca chwytu.','Brak progresji czasowej'),
    B('pr5','Nawijanie linki z obciążeniem (wrist roller)','przedramiona','Wałek, linka, ciężar',2,'Nawijaj linkę na wałek, obracając nadgarstki. Potem rozwijaj.','Pomaganie ramionami'),
    B('pr6','Ściskanie grippera','przedramiona','Gripper',1,'Ściskaj do zamknięcia, utrzymaj 2–3 s. Izolacja chwytu.','Za mocny opór'),
    B('pr7','Zginanie nadgarstków za plecami','przedramiona','Sztanga',2,'Stań ze sztangą za plecami nachwytem. Zwijaj nadgarstki w górę.','Za duży ciężar'),
    B('pr8','Cable hammer curl','przedramiona','Wyciąg dolny, lina',1,'Chwyć linę młotkowo. Dodatkowa praca przedramienia.','Bujanie'),
    B('pr9','Plate pinch (szczypanie talerzy)','przedramiona','Talerze',2,'Złącz talerze gładką stroną na zewnątrz. Chwyć palcami i utrzymaj.','Zbyt dużo talerzy'),
    B('pr10','Reverse curl (uginanie nachwytem)','przedramiona','Sztanga EZ',1,'Chwyć nachwytem na szer. barków. Pracuje brachioradialis.','Bujanie'),

    // A9. CORE / BRZUCH
    B('co1','Plank (deska)','core_brzuch','Brak',1,'Podpór na przedramionach. Ciało w linii prostej. Napnij brzuch i pośladki.','Opadanie bioder, wyginanie lędźwi'),
    B('co2','Dead bug (martwy robak)','core_brzuch','Brak',1,'Leżenie tyłem, naprzemiennie opuszczaj przeciwną rękę i nogę.','Odrywanie pleców od podłogi'),
    B('co3','Spięcia brzucha leżąc (crunch)','core_brzuch','Brak',1,'Unieś łopatki z maty, napinając górny brzuch. Nie ciągnij szyi.','Ciągnięcie za szyję, odrywanie całych pleców'),
    B('co4','Unoszenie nóg w zwisie (hanging leg raise)','core_brzuch','Drążek',3,'Unieś proste lub zgięte nogi do poziomu bioder. Opuszczaj kontrolowanie.','Bujanie ciałem'),
    B('co5','Russian twist','core_brzuch','Talerz/hantla',1,'Siad z lekko odchylonym tułowiem. Skręcaj tułów na boki.','Za szybko, ruchy tylko ramionami'),
    B('co6','Bird dog (pies myśliwski)','core_brzuch','Brak',1,'Klęk podparty. Naprzemiennie wyciągaj przeciwną rękę i nogę. Utrzymaj 2–3 s.','Rotacja bioder'),
    B('co7','Mountain climbers','core_brzuch','Brak',2,'Podpór jak do pompek. Naprzemiennie przyciągaj kolana do klatki.','Opadanie bioder'),
    B('co8','Pallof press','core_brzuch','Wyciąg',1,'Stań bokiem do wyciągu. Wypychaj linkę przed siebie, opierając się rotacji.','Rotacja tułowia w stronę wyciągu'),
    B('co9','Hollow body hold','core_brzuch','Brak',2,'Leżenie tyłem, ręce za głową, nogi proste uniesione ~15 cm. Lędźwie dociśnięte.','Odrywanie lędźwi od maty'),
    B('co10','Cable crunch','core_brzuch','Wyciąg górny, lina',2,'Klęcząc, linka przy głowie. Zwijaj tułów w dół. Pełny zakres z obciążeniem.','Ciągnięcie ramionami, brak zgięcia tułowia'),
  ];

  // ═══════════════════════════════════════════════════════════════════════
  //  B. ĆWICZENIA KOREKCYJNE (100)
  // ═══════════════════════════════════════════════════════════════════════
  ET.EXERCISES_CORRECTIVE = [
    // B1. PRZODOPOCHYLENIE MIEDNICY
    C('pm1','90/90 breathing','przodopochylenie_miednicy','biodro_miednica','Przepona, ZOA','Ustawia miednicę neutralnie, przywraca oddech przeponowy',1,'Brak'),
    C('pm2','Mostek biodrowy z przytrzymaniem','przodopochylenie_miednicy','biodro_miednica','Pośladki wielkie','Izometryczna aktywacja pośladków w tylnym pochyleniu miednicy',1,'Brak'),
    C('pm3','Dead bug','przodopochylenie_miednicy','biodro_miednica','Tłocznia brzuszna','Wzmacnia poprzeczny brzucha z plecami dociśniętymi do podłogi',1,'Brak'),
    C('pm4','Pelvic tilt w klęku','przodopochylenie_miednicy','biodro_miednica','Głębokie brzucha','Świadome tylne pochylenie miednicy — ruch odwrotny do przodopochylenia',1,'Brak'),
    C('pm5','Rozciąganie zginaczy bioder w wykroku','przodopochylenie_miednicy','biodro_miednica','Biodrowo-lędźwiowy, prosty uda','Rozciąga napięte zginacze pociągające miednicę do przodu',1,'Brak'),
    C('pm6','Hip thrust z lekkim obciążeniem','przodopochylenie_miednicy','biodro_miednica','Pośladki wielkie, średnie','Dynamicznie wzmacnia pośladki przeciwdziałające przodopochyleniu',1,'Sztanga/guma'),
    C('pm7','Dociskanie lędźwi do ściany','przodopochylenie_miednicy','biodro_miednica','Świadomość miednicy','Użytkownik uczy się dociskać odcinek lędźwiowy do ściany',1,'Ściana'),
    C('pm8','Plank z tylnym pochyleniem miednicy','przodopochylenie_miednicy','biodro_miednica','Core, pośladki','Plank z aktywnym podwijaniem miednicy — uczy neutralnej pozycji pod obciążeniem',1,'Brak'),
    C('pm9','Single-leg RDL bez obciążenia','przodopochylenie_miednicy','biodro_miednica','Pośladki, tył uda','Stabilizacja miednicy na jednej nodze bez obciążania lędźwi',1,'Brak'),
    C('pm10','Child’s pose (pozycja dziecka)','przodopochylenie_miednicy','biodro_miednica','Prostowniki lędźwi','Rozciąga napięte prostowniki utrwalające lordozę',1,'Brak'),

    // B2. PROTRAKCJA BARKÓW
    C('pb1','Face pull z rotacją zewnętrzną','protrakcja_barkow','barki_lopatki','Tylny naramienny, rotatory, równoległoboczne','Bezpośrednio przeciwdziała protrakcji, cofa łopatki',1,'Wyciąg/guma'),
    C('pb2','Serratus wall slide','protrakcja_barkow','barki_lopatki','Zębaty przedni','Aktywuje zębaty — dociska łopatkę do żeber',1,'Ściana'),
    C('pb3','Rozciąganie klatki w framudze','protrakcja_barkow','barki_lopatki','Piersiowy większy i mniejszy','Rozciąga napięte mięśnie pociągające barki do przodu',1,'Framuga'),
    C('pb4','Scapula push-up','protrakcja_barkow','barki_lopatki','Zębaty przedni, stabilizatory','W podporze: wypychaj klatkę (protrakcja) i ściągaj łopatki (retrakcja)',1,'Brak'),
    C('pb5','Band pull-apart','protrakcja_barkow','barki_lopatki','Tylne naramienne, równoległoboczne','Rozciąganie gumy przed klatką, ściąganie łopatek',1,'Guma'),
    C('pb6','YTWL w opadzie','protrakcja_barkow','barki_lopatki','Cały kompleks łopatki','Ręce w kształt liter Y, T, W, L — aktywuje wszystkie funkcje łopatki',1,'Lekkie hantle'),
    C('pb7','Dead hang z depresją','protrakcja_barkow','barki_lopatki','Przestrzeń podbarkowa','Zwis z aktywnym ściąganiem barków od uszu',2,'Drążek'),
    C('pb8','Wall angel','protrakcja_barkow','barki_lopatki','Mobilność piersiowego, retrakcja','Plecy przy ścianie, sliding ramion w górę i w dół',2,'Ściana'),
    C('pb9','Rozciąganie górnego czworobocznego','protrakcja_barkow','barki_lopatki','Górne pułapki, dźwigacz łopatki','Przechylanie głowy w bok i skręt',1,'Brak'),
    C('pb10','Bottoms-up kettlebell carry','protrakcja_barkow','barki_lopatki','Pierścień rotatorów, stabilizatory','Chodzenie z kettlem do góry dnem — kokontrakcja barku',3,'Kettlebell'),

    // B3. KOLANA VALGUS
    C('kv1','Polly squat (przysiad z gumą na kolanach)','kolana_valgus','kolano','Odwodziciele biodra, rotatory zewn.','Guma wypycha kolana do środka — użytkownik aktywnie walczy',1,'Guma'),
    C('kv2','Banded bridge','kolana_valgus','kolano','Pośladek średni, wielki','Guma nad kolanami, wypychaj kolana na zewnątrz przy unoszeniu bioder',1,'Guma'),
    C('kv3','Clamshell (muszelka) z gumą','kolana_valgus','kolano','Rotatory zewnętrzne biodra','Leżąc bokiem, otwieraj kolana jak muszlę, stopy razem',1,'Guma'),
    C('kv4','Lateral band walk','kolana_valgus','kolano','Pośladek średni','Guma na kostkach, lekki przysiad, idź bokiem',1,'Guma'),
    C('kv5','Box pistol squat regression','kolana_valgus','kolano','Cały łańcuch nogi','Schodzenie na jednej nodze na skrzynię — kontrola kolana w osi',2,'Skrzynia'),
    C('kv6','Short foot (krótka stopa)','kolana_valgus','kolano','M. piszczelowy tylny','Buduje czynnościowy łuk stopy — stabilna stopa = lepszy tor kolana',1,'Brak'),
    C('kv7','Wzniosy na palcach z piłką między kostkami','kolana_valgus','kolano','Mm. strzałkowe','Piłka wymusza prawidłową pozycję pięty',1,'Piłka'),
    C('kv8','TRX squat','kolana_valgus','kolano','Wzorzec przysiadu','Linki pomagają utrzymać tułów i uczą toru kolan przy odciążeniu',1,'TRX'),
    C('kv9','Step-up z wypychaniem kolana na zewnątrz','kolana_valgus','kolano','Odwodziciele, pośladki','Świadome wypychanie kolana przy wchodzeniu na skrzynię',1,'Skrzynia'),
    C('kv10','Wall sit z piłką między kolanami','kolana_valgus','kolano','Odwodziciele, VMO','Plecy przy ścianie, piłka między kolanami, ściskaj przy przysiadzie',1,'Piłka'),

    // B4. OGRANICZONE ZGIĘCIE STAWU SKOKOWEGO
    C('zs1','Knee-to-wall','ograniczone_zgiecie_skokowe','stopa_skok','Staw skokowo-goleniowy','Kontrolowany dosuw kolana do ściany z dociśniętą piętą',1,'Ściana'),
    C('zs2','Rozciąganie łydki w wykroku przy ścianie','ograniczone_zgiecie_skokowe','stopa_skok','Brzuchaty i płaszczkowaty','Tylna noga prosta, pięta dociśnięta — dwie pozycje',1,'Ściana'),
    C('zs3','Banded ankle mobilization','ograniczone_zgiecie_skokowe','stopa_skok','Staw skokowy, torebka przednia','Guma wspomaga tylny ślizg kości skokowej',1,'Guma, podest'),
    C('zs4','Foam rolling łydek','ograniczone_zgiecie_skokowe','stopa_skok','Powięź brzuchatego i płaszczkowatego','Rozluźnia napięte mięśnie blokujące zgięcie grzbietowe',1,'Wałek'),
    C('zs5','Ekscentryczne opadanie pięt z podestu','ograniczone_zgiecie_skokowe','stopa_skok','Łydka + zakres zgięcia grzbietowego','Powoli opuszczaj pięty poniżej poziomu podestu',1,'Podest'),
    C('zs6','Przysiad z piętami na talerzach','ograniczone_zgiecie_skokowe','stopa_skok','Wzorzec przysiadu','Uniesienie pięt kompensuje brak zgięcia — rozwiązanie tymczasowe',1,'Talerze'),
    C('zs7','Goblet squat z wypychaniem kolan do przodu','ograniczone_zgiecie_skokowe','stopa_skok','Zgięcie grzbietowe + przysiad','Ciężar pomaga pogłębić zakres',1,'Kettlebell'),
    C('zs8','Mobilizacja kości skokowej — ślizg tylny','ograniczone_zgiecie_skokowe','stopa_skok','Talus','Partner lub guma pomaga wykonać ślizg tylny',2,'Guma/partner'),
    C('zs9','Eccentric calf raises','ograniczone_zgiecie_skokowe','stopa_skok','Łydka + zakres','Szybkie wspięcie, bardzo wolne opadanie (3–5 s)',2,'Podest'),
    C('zs10','Dynamic dorsiflexion drill','ograniczone_zgiecie_skokowe','stopa_skok','Funkcjonalne zgięcie w chodzie','Powolny krok w przód — pięta pierwsza, kolano nad palce',1,'Brak'),

    // B5. TENDINOPATIA RZEPKI
    C('tp1','Spanish squat','tendinopatia_rzepki','kolano','Ścięgno rzepki','Przysiad z gumą za kolanami, izometria 30–45 s — bezpieczny start',2,'Guma'),
    C('tp2','TKE (Terminal Knee Extension)','tendinopatia_rzepki','kolano','VMO, ścięgno rzepki','Guma za kolanem, przeprost w staniu — izoluje VMO',1,'Guma'),
    C('tp3','Isometric box squat hold','tendinopatia_rzepki','kolano','Ścięgno rzepki','Zejdź na skrzynię, utrzymaj 30–60 s — stymuluje regenerację',1,'Skrzynia'),
    C('tp4','Step-up z ekscentryką','tendinopatia_rzepki','kolano','Ścięgno rzepki','Wejdź na skrzynię, opuszczaj się bardzo wolno (3–5 s)',1,'Skrzynia'),
    C('tp5','Przysiad bułgarski z izometrią','tendinopatia_rzepki','kolano','Ścięgno rzepki, przednia noga','Zejdź do przysiadu, utrzymaj dół 20–30 s',2,'Ławka'),
    C('tp6','Wall sit z progresją czasu','tendinopatia_rzepki','kolano','Ścięgno rzepki, wyprostny','Plecy przy ścianie, kolana ~90°. Progresja: 30 s → 60 s → z obciążeniem',1,'Ściana'),
    C('tp7','Leg extension 90°–45°','tendinopatia_rzepki','kolano','Ścięgno rzepki, VMO','Maszyna w bezpiecznym zakresie (od 90° do 45° zgięcia)',1,'Maszyna'),
    C('tp8','Reverse lunge z kontrolowanym opadaniem','tendinopatia_rzepki','kolano','Ścięgno rzepki, cała noga','Krok w tył, bardzo wolne opadanie — mniej obciążające niż wykroki w przód',1,'Hantle (opcja)'),
    C('tp9','Leg press izometrycznie','tendinopatia_rzepki','kolano','Ścięgno rzepki','Utrzymaj pozycję przy zgięciu ~60° przez 30–45 s',1,'Maszyna'),
    C('tp10','Foam rolling quads (nie roluj ścięgna!)','tendinopatia_rzepki','kolano','Powięź czworogłowego','Delikatne rolowanie przedniego uda — zmniejsza napięcie ciągnące za ścięgno',1,'Wałek'),

    // B6. DYSKOPATIA LĘDŹWIOWA
    C('dl1','Dead bug','dyskopatia_L','kregoslup','Poprzeczny brzucha, tłocznia','Trenuje core bez obciążania krążków międzykręgowych',1,'Brak'),
    C('dl2','Bird dog','dyskopatia_L','kregoslup','Wielodzielny, prostownik grzbietu','Wzmacnia lokalne stabilizatory odcinkowe przy neutralnej miednicy',1,'Brak'),
    C('dl3','Plank + side plank','dyskopatia_L','kregoslup','Core globalny i lokalny','Wzmacnia tłocznię brzuszną. Side plank angażuje quadratus lumborum',1,'Brak'),
    C('dl4','Mostek biodrowy (glute bridge)','dyskopatia_L','kregoslup','Pośladki, tył uda','Unoszenie bioder bez obciążania kręgosłupa — odciąża lędźwie',1,'Brak'),
    C('dl5','McKenzie press-up','dyskopatia_L','kregoslup','Tylna część krążka','Leżąc na brzuchu, wypychaj klatkę, biodra na macie. Centralizuje ból',1,'Brak'),
    C('dl6','Hip thrust z lekką gumą','dyskopatia_L','kregoslup','Pośladki','Pośladki przejmują pracę od zmęczonych prostowników lędźwi',1,'Guma'),
    C('dl7','Cat-cow z oddechem','dyskopatia_L','kregoslup','Mobilność segmentalna','Delikatna mobilizacja zsynchronizowana z oddechem — poprawia odżywienie krążków',1,'Brak'),
    C('dl8','Neural flossing — nerw kulszowy','dyskopatia_L','kregoslup','Nerw kulszowy','Naprzemiennie zginaj stopę grzbietowo i podeszwowo przy uniesionej nodze',1,'Brak'),
    C('dl9','Sumo deadlift z lekkim kettlebells','dyskopatia_L','kregoslup','Wzorzec unoszenia — bezpiecznie','Szeroki rozstaw, plecy proste, ruch z bioder',1,'Kettlebell'),
    C('dl10','Wall squat z piłką za plecami','dyskopatia_L','kregoslup','Noga + core bez obciążania','Piłka między ścianą a plecami odciąża kręgosłup',1,'Piłka, ściana'),

    // B7. CIASNOTA PODBARKOWA
    C('cp1','Dead hang z depresją łopatek','ciasnota_podbarkowa','barki_lopatki','Przestrzeń podbarkowa','Grawitacyjna dekompresja przestrzeni podbarkowej',2,'Drążek'),
    C('cp2','Serratus wall slide','ciasnota_podbarkowa','barki_lopatki','Zębaty przedni','Rotuje łopatkę do góry → otwiera przestrzeń podbarkową',1,'Ściana'),
    C('cp3','Rotacja zewnętrzna z gumą (łokieć przy tułowiu)','ciasnota_podbarkowa','barki_lopatki','Rotatory zewnętrzne','Stabilizuje głowę kości ramiennej w panewce',1,'Guma'),
    C('cp4','Scapula pull-up','ciasnota_podbarkowa','barki_lopatki','Dolne pułapki, równoległoboczne','Zwieś, ściągnij łopatki bez zginania łokci — aktywuje dolne pułapki',2,'Drążek'),
    C('cp5','Thumb-up lateral raise','ciasnota_podbarkowa','barki_lopatki','Naramienny + rotatory','Unoszenie z kciukami w górę — zmniejsza ryzyko impingementu',1,'Lekkie hantle'),
    C('cp6','Sleeper stretch','ciasnota_podbarkowa','barki_lopatki','Tylna torebka stawowa','Rozciąganie napiętej torebki tylnej',1,'Brak'),
    C('cp7','Foam rolling klatki i przedniego barku','ciasnota_podbarkowa','barki_lopatki','Powięź piersiowa','Uwalnia napięcia pociągające bark do przodu',1,'Wałek/piłka'),
    C('cp8','YTWL w opadzie','ciasnota_podbarkowa','barki_lopatki','Wszystkie stabilizatory łopatki','Ręce w literach Y, T, W, L — wzmacnia cały kompleks',1,'Lekkie hantle'),
    C('cp9','Ekscentryczne opuszczanie w wyciskaniu','ciasnota_podbarkowa','barki_lopatki','Rotatory, ekscentryka','Wypychaj dynamicznie, opuszczaj bardzo wolno (5 s)',2,'Maszyna/hantle'),
    C('cp10','Rear delt fly (wznosy w opadzie)','ciasnota_podbarkowa','barki_lopatki','Tylne naramienne, równoległoboczne','Wzmacnia tylny akton — przeciwdziała dominacji przedniego barku',1,'Lekkie hantle'),

    // B8. NIESTABILNOŚĆ BARKU
    C('nb1','Rotacja zewnętrzna z przytrzymaniem','niestabilnosc_barku','barki_lopatki','Rotatory zewnętrzne','Izometryczne przytrzymanie 10–15 s w skrajnej rotacji',1,'Guma'),
    C('nb2','Bottoms-up kettlebell carry','niestabilnosc_barku','barki_lopatki','Cały kompleks barkowy','Wymusza reaktywną kokontrakcję',3,'Kettlebell'),
    C('nb3','Wall stabilization drill','niestabilnosc_barku','barki_lopatki','Stabilizatory panewki','Dłoń przy ścianie, małe ruchy okrężne z wyprostowanym ramieniem',1,'Ściana'),
    C('nb4','Push-up plus','niestabilnosc_barku','barki_lopatki','Zębaty przedni','Pompka + dodatkowe wypchnięcie klatki na górze (protrakcja)',1,'Brak'),
    C('nb5','Wiosłowanie z izometrią na górze','niestabilnosc_barku','barki_lopatki','Równoległoboczne, tylny naramienny','Przytrzymanie 5–10 s przy biodrze',2,'Ławka, hantla'),
    C('nb6','4-way shoulder isometrics','niestabilnosc_barku','barki_lopatki','Rotatory, odwodziciele','4 pozycje izometrycznie po 10–15 s — pełna stabilizacja',1,'Ściana/guma'),
    C('nb7','Plank z unoszeniem ręki','niestabilnosc_barku','barki_lopatki','Core + stabilizacja barku','W desce unieś jedną rękę i utrzymaj',2,'Brak'),
    C('nb8','Suitcase carry','niestabilnosc_barku','barki_lopatki','Anty-rotacja tułowia + stabilizacja barku','Chodź z kettlem w jednej ręce — bark stabilizuje biernie',2,'Kettlebell'),
    C('nb9','Rzut i złapanie piłki lekarskiej przy ścianie','niestabilnosc_barku','barki_lopatki','Szybka kokontrakcja','Rzuć lekką piłkę o ścianę, złap — uczy szybkiej stabilizacji',2,'Piłka lekarska'),
    C('nb10','Eccentric side raise','niestabilnosc_barku','barki_lopatki','Rotatory + naramienny','Unieś z pomocą, opuszczaj skrajnie wolno (5–7 s)',1,'Lekka hantla'),

    // B9. NIESTABILNOŚĆ STAWU SKOKOWEGO
    C('ns1','Stanie na jednej nodze (single-leg stance)','niestabilnosc_skokowa','stopa_skok','Propriocepcja, mm. strzałkowe','Progresja: oczy otwarte → zamknięte → na poduszce → na BOSU',1,'Poduszka sensomot.'),
    C('ns2','Wzniosy na palcach z piłką między kostkami','niestabilnosc_skokowa','stopa_skok','Mm. strzałkowe, trójgłowy łydki','Piłka wymusza prawidłową pozycję pięty',1,'Piłka'),
    C('ns3','Eccentric eversion','niestabilnosc_skokowa','stopa_skok','Mm. strzałkowe długi i krótki','Guma stawia opór w inwersji — aktywnie wypychaj stopę na zewnątrz',1,'Guma'),
    C('ns4','Ankle alphabet','niestabilnosc_skokowa','stopa_skok','Wszystkie mięśnie wokół stawu','„Pisz” alfabet palcami stopy — pełny zakres we wszystkich płaszczyznach',1,'Brak'),
    C('ns5','Hop to stabilization','niestabilnosc_skokowa','stopa_skok','Dynamiczna stabilizacja','Wyskocz i wyląduj na jednej nodze — ustabilizuj',2,'Brak'),
    C('ns6','Chodzenie na palcach + piętach + bokach stóp','niestabilnosc_skokowa','stopa_skok','Wszystkie stabilizatory','20 m na palcach, 20 m na piętach, 20 m na zewn. krawędziach',1,'Brak'),
    C('ns7','BOSU squat','niestabilnosc_skokowa','stopa_skok','Propriocepcja + siła','Przysiad na niestabilnym podłożu',2,'BOSU/poduszka'),
    C('ns8','Single-leg jump rope','niestabilnosc_skokowa','stopa_skok','Dynamiczna stabilizacja + wytrzymałość','Skoki na skakance na jednej nodze',2,'Skakanka'),
    C('ns9','Star excursion balance test — treningowo','niestabilnosc_skokowa','stopa_skok','Propriocepcja w wielu płaszczyznach','Sięganie drugą nogą w 4–8 kierunków na jednej nodze',2,'Taśma na podłodze'),
    C('ns10','Eccentric single-leg calf raise','niestabilnosc_skokowa','stopa_skok','Siła + kontrola ekscentryczna','Wspięcie na jednej nodze, opadanie bardzo wolno (5 s)',2,'Podest'),

    // B10. ITBS
    C('it1','Standing ITB stretch','ITBS','kolano','Pasmo biodrowo-piszczelowe','Skrzyżuj nogi, pochyl tułów w bok od bolącej strony',1,'Brak'),
    C('it2','Mostek jednonóż z przytrzymaniem','ITBS','kolano','Pośladek średni, wielki','Unoszenie bioder na jednej nodze, przytrzymanie 3 s',1,'Brak'),
    C('it3','Clamshell z gumą + przytrzymanie','ITBS','kolano','Rotatory zewnętrzne biodra','Otwórz kolana i przytrzymaj 5 s',1,'Guma'),
    C('it4','Lateral band walk','ITBS','kolano','Pośladek średni, odwodziciele','Guma na kostkach, idź bokiem — dynamiczna aktywacja',1,'Guma'),
    C('it5','Side plank z unoszeniem nogi','ITBS','kolano','QL, pośladek średni','Łączy stabilizację boczną tułowia z pracą odwodzicieli',2,'Brak'),
    C('it6','Foam rolling ITB (nie przy ostrym stanie!)','ITBS','kolano','Powięź pasma','Powoli roluj od biodra do kolana — nie roluj samego kolana',1,'Wałek'),
    C('it7','Assisted single-leg squat','ITBS','kolano','Wzorzec stabilizacji na jednej nodze','Trzymając TRX/słupek, zejdź na jednej nodze — kolano nie ucieka',1,'TRX/słupek'),
    C('it8','Lateral lunges','ITBS','kolano','Odwodziciele, przywodziciele','Krok w bok, przysiad na jednej nodze, druga prosta',1,'Brak'),
    C('it9','Banded bridge + abduction','ITBS','kolano','Pośladek średni','Guma nad kolanami, unieś biodra i odwiedź kolana na górze',1,'Guma'),
    C('it10','Pallof press + lunge','ITBS','kolano','Core + biodro','Wypchnij linkę i zejdź do wykroku — stabilizacja przy ruchu nogi',2,'Wyciąg'),
  ];

  // ── PRECYZYJNE TAGI MIĘŚNIOWE (akton/mięsień) — prompt 1.2.1 ─────────────
  ET.MUSCLE_TAGS = {
    piersiowy_gorny:'Klatka górna', piersiowy_srodkowy:'Klatka środkowa', piersiowy_dolny:'Klatka dolna',
    piersiowy_wewnetrzny:'Klatka wewnętrzna', piersiowy_zewnetrzny:'Klatka zewnętrzna',
    najszerszy_gorny:'Najszerszy (góra)', najszerszy_srodkowy:'Najszerszy (środek)', najszerszy_dolny:'Najszerszy (dół)',
    prostownik_grzbietu:'Prostownik grzbietu', pulapki:'Czworoboczny (kaptur)', rownolegloboczny:'Równoległoboczny', obly_wiekszy:'Obły większy',
    czworoglowy:'Czworogłowy uda', posladkowy_wielki:'Pośladkowy wielki', posladkowy_sredni:'Pośladkowy średni',
    dwuglowy_uda:'Dwugłowy uda', przywodziciele:'Przywodziciele',
    dwuglowy_ramienia:'Dwugłowy ramienia', ramienny:'Ramienny', ramienno_promieniowy:'Ramienno-promieniowy',
    trojglowy_dluga_glowa:'Triceps (długa głowa)', trojglowy_boczna_glowa:'Triceps (boczna głowa)', trojglowy_przysrodkowa:'Triceps (przyśrodkowa)',
    naramienny_przedni:'Naramienny przedni', naramienny_srodkowy:'Naramienny środkowy', naramienny_tylny:'Naramienny tylny',
    brzuchaty:'Brzuchaty łydki', plaszczkowaty:'Płaszczkowaty',
    zginacze_nadgarstka:'Zginacze nadgarstka', prostowniki_nadgarstka:'Prostowniki nadgarstka', chwyt:'Siła chwytu',
    prosty_brzucha:'Prosty brzucha', skosne:'Skośne brzucha', poprzeczny:'Poprzeczny brzucha', prostownik_ledzwi:'Prostownik lędźwi',
  };

  var PRECISE = {
    // Klatka
    kp1:['piersiowy_srodkowy','piersiowy_dolny'], kp2:['piersiowy_srodkowy'], kp3:['piersiowy_gorny'],
    kp4:['piersiowy_zewnetrzny','piersiowy_srodkowy'], kp5:['piersiowy_srodkowy','piersiowy_dolny'], kp6:['piersiowy_srodkowy'],
    kp7:['piersiowy_wewnetrzny','piersiowy_dolny'], kp8:['piersiowy_dolny'], kp9:['piersiowy_gorny','piersiowy_wewnetrzny'], kp10:['piersiowy_gorny'],
    // Plecy
    pl1:['prostownik_grzbietu','najszerszy_dolny','pulapki'], pl2:['najszerszy_gorny','obly_wiekszy'], pl3:['najszerszy_srodkowy','rownolegloboczny'],
    pl4:['najszerszy_srodkowy'], pl5:['najszerszy_gorny','obly_wiekszy'], pl6:['najszerszy_srodkowy','rownolegloboczny'],
    pl7:['najszerszy_gorny'], pl8:['naramienny_tylny','rownolegloboczny'], pl9:['prostownik_grzbietu'], pl10:['najszerszy_dolny','rownolegloboczny'],
    // Nogi
    no1:['czworoglowy','posladkowy_wielki'], no2:['czworoglowy','posladkowy_wielki','przywodziciele'], no3:['dwuglowy_uda','posladkowy_wielki'],
    no4:['posladkowy_wielki','posladkowy_sredni'], no5:['czworoglowy','posladkowy_wielki'], no6:['czworoglowy','posladkowy_wielki'],
    no7:['czworoglowy','posladkowy_wielki'], no8:['posladkowy_wielki','czworoglowy'], no9:['czworoglowy'], no10:['posladkowy_wielki','czworoglowy'],
    // Biceps
    bi1:['dwuglowy_ramienia'], bi2:['dwuglowy_ramienia'], bi3:['dwuglowy_ramienia'], bi4:['ramienno_promieniowy','ramienny'], bi5:['dwuglowy_ramienia'],
    bi6:['dwuglowy_ramienia'], bi7:['dwuglowy_ramienia'], bi8:['dwuglowy_ramienia'], bi9:['dwuglowy_ramienia'], bi10:['ramienno_promieniowy','dwuglowy_ramienia'],
    // Triceps
    tr1:['trojglowy_dluga_glowa'], tr2:['trojglowy_boczna_glowa'], tr3:['trojglowy_boczna_glowa','trojglowy_przysrodkowa'], tr4:['trojglowy_dluga_glowa'],
    tr5:['trojglowy_dluga_glowa'], tr6:['trojglowy_boczna_glowa'], tr7:['trojglowy_boczna_glowa'], tr8:['trojglowy_boczna_glowa','trojglowy_przysrodkowa'],
    tr9:['trojglowy_dluga_glowa'], tr10:['trojglowy_boczna_glowa'],
    // Barki
    ba1:['naramienny_przedni','naramienny_srodkowy'], ba2:['naramienny_srodkowy'], ba3:['naramienny_przedni'], ba4:['naramienny_przedni','naramienny_srodkowy'],
    ba5:['naramienny_tylny'], ba6:['naramienny_srodkowy','pulapki'], ba7:['naramienny_srodkowy'], ba8:['naramienny_srodkowy','naramienny_przedni'],
    ba9:['naramienny_tylny'], ba10:['naramienny_przedni','naramienny_srodkowy'],
    // Łydki
    ly1:['brzuchaty'], ly2:['brzuchaty'], ly3:['plaszczkowaty'], ly4:['brzuchaty'], ly5:['brzuchaty'],
    ly6:['brzuchaty','plaszczkowaty'], ly7:['brzuchaty'], ly8:['plaszczkowaty'], ly9:['brzuchaty'], ly10:['brzuchaty'],
    // Przedramiona
    pr1:['zginacze_nadgarstka'], pr2:['prostowniki_nadgarstka'], pr3:['chwyt'], pr4:['chwyt'], pr5:['zginacze_nadgarstka','prostowniki_nadgarstka'],
    pr6:['chwyt'], pr7:['zginacze_nadgarstka'], pr8:['ramienno_promieniowy','chwyt'], pr9:['chwyt'], pr10:['prostowniki_nadgarstka','ramienno_promieniowy'],
    // Core
    co1:['poprzeczny','prosty_brzucha'], co2:['poprzeczny'], co3:['prosty_brzucha'], co4:['prosty_brzucha'], co5:['skosne'],
    co6:['prostownik_ledzwi','poprzeczny'], co7:['prosty_brzucha','skosne'], co8:['skosne','poprzeczny'], co9:['prosty_brzucha'], co10:['prosty_brzucha'],
  };
  ET.EXERCISES_BASIC.forEach(function(ex){ ex.muscles = PRECISE[ex.id] || []; });

  // Wszystkie ćwiczenia razem
  ET.EXERCISES = ET.EXERCISES_BASIC.concat(ET.EXERCISES_CORRECTIVE);

  // ── HELPERY WYSZUKIWANIA ─────────────────────────────────────────────────
  ET.exerciseById = function(id) {
    for (var i=0;i<ET.EXERCISES.length;i++) if (ET.EXERCISES[i].id===id) return ET.EXERCISES[i];
    return null;
  };
  ET.exercisesByTag = function(tag) {
    return ET.EXERCISES.filter(function(e){ return (e.tags||[]).indexOf(tag)!==-1; });
  };
  ET.exercisesByCondition = function(cond) {
    return ET.EXERCISES_CORRECTIVE.filter(function(e){ return (e.condition_tags||[]).indexOf(cond)!==-1; });
  };
  ET.exercisesByMuscle = function(m) {
    return ET.EXERCISES_BASIC.filter(function(e){ return (e.muscles||[]).indexOf(m)!==-1; });
  };
  ET.muscleLabel = function(m) { return (ET.MUSCLE_TAGS && ET.MUSCLE_TAGS[m]) || m; };
  ET.LEVEL_LABELS = { 1:'Początkujący', 2:'Średni', 3:'Zaawansowany' };
})();
