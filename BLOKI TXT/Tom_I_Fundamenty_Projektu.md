# TOM I – Fundamenty Projektu

## 1. Wizja projektu

### Cel projektu
MMCars Fit App nie jest klasyczną aplikacją treningową ani prostym dziennikiem ćwiczeń.

Jej celem jest stworzenie kompleksowego systemu wspierającego rozwój sportowy użytkownika poprzez analizę danych, planowanie treningów oraz inteligentne rekomendacje.

Aplikacja pomaga podejmować lepsze decyzje treningowe zamiast jedynie zapisywać wykonane ćwiczenia.

Docelowo system integruje trening siłowy, bieganie, regenerację, cele sportowe oraz współpracę z trenerem.

### Główna filozofia

- Aplikacja nie zastępuje trenera.
- Aplikacja nie zastępuje użytkownika.
- Aplikacja wspiera proces podejmowania decyzji.
- Każda rekomendacja wymaga akceptacji użytkownika lub trenera.

### Misja

Stworzyć najbardziej zaawansowany system wspierania treningu dostępny dla zwykłego użytkownika przy zachowaniu prostoty obsługi.

### Wizja długoterminowa

Platforma wspierająca współpracę użytkownika, trenera personalnego, AI Coach oraz w przyszłości fizjoterapeuty.

---

## 2. Cele projektu

### Cel główny

Pomagać użytkownikowi osiągać cele sportowe szybciej, bezpieczniej i bardziej świadomie.

### Cele funkcjonalne

- tworzenie planów treningowych,
- prowadzenie treningów,
- analiza progresu,
- analiza regeneracji,
- analiza biegania,
- analiza celów,
- współpraca z trenerem,
- inteligentne rekomendacje.

### Cele techniczne

System ma być:

- szybki,
- modularny,
- skalowalny,
- łatwy w rozwoju,
- odporny na błędy,
- gotowy na tysiące użytkowników.

---

## 3. Filozofia projektowa

- Dane ponad interfejs.
- AI analizuje i rekomenduje, ale nie podejmuje nieodwracalnych decyzji.
- Każda rekomendacja posiada uzasadnienie i poziom pewności.
- Offline First.
- Jedno źródło danych.
- Modułowa architektura.
- Skalowalność.
- Rozszerzalność.

---

## 4. Grupy użytkowników

1. Użytkownik.
2. Premium.
3. Trener personalny.
4. Administrator.

---

## 5. Model biznesowy (wizja docelowa)

Free, Premium (jednorazowy zakup) oraz AI Coach (subskrypcja).

**Na obecnym etapie nie implementować:**

- abonamentów,
- zakupów Premium,
- płatności,
- licencji,
- ograniczeń funkcjonalnych,
- reklam,
- infrastruktury sprzedażowej.

Projektować architekturę pod przyszły model biznesowy, ale nie implementować go do czasu ukończenia podstawowych modułów aplikacji.

---

## 6. Hierarchia decyzji

Trener → Użytkownik → AI Coach → Rule Engine

---

## 7. Architektura

Exercise Engine

↓

Workout Engine

↓

Progress Engine

↓

Running Engine

↓

Recovery Engine

↓

Fatigue Engine

↓

Goal Engine

↓

Analytics Engine

↓

Decision Engine

↓

Scoring Engine

↓

Confidence Engine

↓

Adaptation Engine

↓

Rule Engine

↓

AI Coach

---

## 8. AI Coach

AI Coach analizuje dane, interpretuje wyniki silników i przedstawia rekomendacje wraz z:

- uzasadnieniem,
- poziomem pewności,
- alternatywami,
- przewidywanymi skutkami.

---

## 9. Quality Standards

Każdy moduł:

- działa offline,
- posiada walidację,
- obsługuje błędy,
- jest testowalny,
- posiada pełne typowanie TypeScript,
- umożliwia dalszą rozbudowę.

---

## 10. Anti-Patterns

Nie wolno:

- duplikować modeli danych,
- umieszczać logiki biznesowej w UI,
- wykonywać obliczeń Engine w AI Coach,
- stosować magic numbers,
- tworzyć zależności cyklicznych,
- usuwać historii użytkownika bez świadomej decyzji.
