# Żelazny Szał — instrukcje dla Codex

## Praca i wykorzystanie zasobów

- Domyślnie pracuj lokalnie na aktualnym kodzie projektu.
- Ogranicz analizę do plików związanych z zadaniem oraz ich niezbędnych zależności i testów. Przy drobnych zmianach pomiń pełny audyt repozytorium.
- Wprowadzaj minimalne zmiany potrzebne do wykonania zadania. Nie odtwarzaj całej gry przy małych aktualizacjach i nie wykonuj niezamówionego refaktoringu.
- Zachowuj interfejs, grafikę i balans poza zakresem zadania. Istniejące mechaniki zmieniaj wyłącznie na polecenie użytkownika.
- Wykonuj testy adekwatne do zakresu zmian. Przy małych zadaniach pomiń rozbudowane plany i dokumentację.
- Po wykonaniu zadania krótko podsumuj zmiany, wynik testów i ewentualne problemy.

## Zasady projektowe

- Każda nowa uniwersalna statystyka bojowa powinna być domyślnie dostępna dla przedmiotów, klas postaci i przeciwników oraz obsługiwana przez Game Designer Studio.
- Wszystkie przyszłe efekty specjalne podłączaj do wspólnego systemu zdarzeń. Udostępniaj je w Game Designer Studio dla wszystkich kompatybilnych elementów gry.
- Efekty specjalne i modyfikatory zaawansowane współdzielą mechaniki, schemat walidacji i formularz Studio. Definicje modyfikatorów zapisuj niezależnie w `data/modifiers.js`, z własnymi parametrami, licznikami i powiązaniem z elementem gry.
- Definicje podklas, kół i punktów umiejętności zapisuj w `data/skills.js`. Gra i Studio współdzielą reguły i renderer z `js/skill-rules.js` oraz `js/skill-wheel.js`. Zachowuj moduły podklas i odblokowywania umiejętności w `js/subclasses.js` i `js/skills.js`.
- Połączenia koła definiują wymagania węzłów. Nowe statystyki i efekty podklas oraz umiejętności podłączaj do wspólnych rejestrów, walidacji Studio i panelu efektów postaci.
- Używaj lekkiego HTML, CSS i JavaScript bez zbędnych bibliotek. Projekt ma działać na telefonach i komputerach.
- Docelowy podział: index.html, style.css, js/items.js, js/enemies.js, js/classes.js, js/combat.js, js/shop.js, js/progression.js, js/ranking.js, js/game.js. Unikaj zbędnego rozdrobnienia i zależności cyklicznych.
- Ranking osobisty TOP 10: 100 pkt za wygraną walkę, 50 za awans, 25 za aktualnie wyposażony przedmiot niepospolity lub rzadki; broń dwuręczną licz raz. Pseudonim i ranking lokalny zapisuj bezpiecznie w localStorage.
- Nie dodawaj sekretów, tokenów ani danych prywatnych do publicznego repozytorium.
- Wersja bazowa do migracji: PlayDrop 1.0.16. Nie nazywaj migracji ukończoną, dopóki pełny kod gry nie trafi do repozytorium i nie zostanie sprawdzony.

## Wersjonowanie i publikacja

- Zachowuj numer wersji przy drobnych zmianach. Zwiększaj go przy uzgodnionym wydaniu lub na polecenie użytkownika.
- GitHub jest docelowym źródłem kodu. Wysyłaj zmiany do GitHuba wyłącznie na wyraźne polecenie użytkownika.
- Publikuj grę wyłącznie na wyraźne polecenie użytkownika i tylko na wskazanej platformie. Pamiętaj, że wysłanie zmian do gałęzi `main` może uruchomić publikację w GitHub Pages.
- PlayDrop aktualizuj wyłącznie wtedy, gdy użytkownik wprost zleci publikację na PlayDrop. Ogólna prośba o publikację albo wdrożenie na GitHubie nie jest zgodą na PlayDrop. Przy zleconej aktualizacji zachowaj istniejącą grę 80949 i jej adres https://www.playdrop.ai/@grzyb92ek/iron-fury-autobattler. Zgłoś problem, jeśli zleconej publikacji nie da się wykonać.
