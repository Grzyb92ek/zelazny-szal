# Żelazny Szał

Przeglądarkowy fantasy autobattler. Wersja bazowa: 1.0.16 z PlayDrop; migracja do osobnych plików bez zamierzonej zmiany rozgrywki.

Uruchamianie: otwórz index.html w przeglądarce lub użyj GitHub Pages (Settings → Pages → Deploy from a branch → main / root). Nie potrzeba npm ani budowania.

## Pliki

- index.html — struktura ekranów i kolejność skryptów.
- style.css — wygląd.
- js/items.js — katalog i ulepszanie przedmiotów.
- js/enemies.js — przeciwnicy i skalowanie.
- js/classes.js — klasy i pasywki.
- js/art.js — pikselowe SVG.
- js/state.js — stan i statystyki postaci.
- js/ranking.js — pseudonim i ranking lokalny.
- js/shop.js — sklep, ekwipunek, mikstury.
- js/progression.js — doświadczenie i awans.
- js/combat.js — walka.
- js/ui.js — renderowanie ekranów.
- js/locations.js — dane lokacji, dostępne przejścia oraz wyświetlanie menu głównego, mapy świata i areny.
- js/game.js — inicjalizacja i przechodzenie między rundami.

Skrypty klasyczne współdzielą zakres globalny. Nie zmieniaj kolejności ładowania bez sprawdzenia zależności. Ranking lokalny zależy od origin przeglądarki; wyniki z PlayDrop nie przechodzą automatycznie do GitHub Pages.

PlayDrop: https://www.playdrop.ai/@grzyb92ek/iron-fury-autobattler

Zasady dalszego rozwoju: AGENTS.md. Test: node tests/smoke.cjs (Node.js, bez zależności).
