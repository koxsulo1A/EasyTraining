# TOM II – Model Danych (Część 1)

## 1. Cel dokumentu

Celem tego dokumentu jest zdefiniowanie kompletnego modelu danych aplikacji MMCars Fit App.
Model danych stanowi fundament całego systemu. Wszystkie moduły aplikacji korzystają z jednego wspólnego modelu danych.

## 2. Założenia

- Jedno źródło prawdy (Single Source of Truth).
- Offline First.
- Historia danych nigdy nie jest usuwana.
- Wszystkie dane posiadają wersjonowanie.
- AI Coach nie przechowuje własnych kopii danych.

## 3. Encja Użytkownik

### Cel

Przechowuje wszystkie podstawowe informacje niezbędne do działania aplikacji.

### Pola

| Pole | Typ | Opis |
|------|-----|------|
| id | UUID | Identyfikator |
| username | String | Nazwa użytkownika |
| birthDate | Date | Data urodzenia |
| sex | Enum | Płeć |
| height | Float | Wzrost |
| currentWeight | Float | Aktualna masa ciała |

### Reguły biznesowe

- Masa ciała jest aktualizowana wyłącznie poprzez historię pomiarów.
- Aktualna masa jest zawsze ostatnim wpisem z historii.
- Dane użytkownika nie mogą być duplikowane.

### Quality Standards

- Walidacja wszystkich pól.
- UUID generowany automatycznie.
- Obsługa migracji danych.

### Anti-Patterns

- Nie przechowywać wielu kopii tych samych danych.
- Nie usuwać historii zmian.

## 4. Historia masy ciała

Każdy pomiar zapisywany jest jako osobny rekord.

Pola:
- id
- userId
- weight
- measuredAt

Reguły:
- Historia jest nieusuwalna.
- Możliwa jest edycja błędnego wpisu z zachowaniem wersjonowania.

--- 

Koniec części 1.
