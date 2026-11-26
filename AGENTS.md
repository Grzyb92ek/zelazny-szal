# Żelazny Szał — instrukcje dla Codex

- Rozwijaj zawsze najnowszy kod z repozytorium. Nie odtwarzaj całej gry przy małych aktualizacjach.
- Zmieniaj wyłącznie elementy wskazane przez twórcę. Zachowuj interfejs, grafikę, balans i mechaniki poza zakresem zadania.
- Używaj lekkiego HTML, CSS i JavaScript bez zbędnych bibliotek. Projekt ma działać na telefonach i komputerach.
- Docelowy podział: index.html, style.css, js/items.js, js/enemies.js, js/classes.js, js/combat.js, js/shop.js, js/progression.js, js/ranking.js, js/game.js. Unikaj zbędnego rozdrobnienia i zależności cyklicznych.
- Przed zmianą przeczytaj tylko potrzebne pliki i powiązane testy. Po zmianie sprawdź regresje, opisz zmiany i zwiększ wersję przy wydaniu.
- Ranking osobisty TOP 10: 100 pkt za wygraną walkę, 50 za awans, 25 za aktualnie wyposażony przedmiot niepospolity; broń dwuręczną licz raz. Pseudonim i ranking lokalny zapisuj bezpiecznie w localStorage.
- GitHub jest docelowym źródłem kodu; GitHub Pages ma publikować gałąź main. Publikuj kolejne wydania również na PlayDrop, zachowując istniejącą grę 80949 i jej adres https://www.playdrop.ai/@grzyb92ek/iron-fury-autobattler. Jeżeli publikacja jest niedostępna, wyraźnie to zgłoś.
- Nie dodawaj sekretów, tokenów ani danych prywatnych do publicznego repozytorium.
- Wersja bazowa do migracji: PlayDrop 1.0.16. Nie nazywaj migracji ukończoną, dopóki pełny kod gry nie trafi do repozytorium i nie zostanie sprawdzony.
