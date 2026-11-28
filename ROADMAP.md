# Żelazny Szał — stan i plan rozwoju

Stan na podstawie lokalnej wersji **1.7.1**. Reguły rozgrywki i lokalizacje danych opisuje [GAME_DESIGN.md](GAME_DESIGN.md), a historię zmian [CHANGELOG.md](CHANGELOG.md).

## Wdrożone

- Pętla kolejnych walk, skalowanie przeciwników, sklep, wyposażenie i sprzedaż z plecaka.
- Trzy rzadkości przedmiotów, efekty wyposażenia i wspólny silnik modyfikatorów.
- Barbarzyńca i podklasa Berserk, punkty rozwoju oraz osiem umiejętności.
- Menu, Miasto i Przygoda, tablica zadań oraz dziennik. Domyślnie jedno zadanie poziomowe.
- Ranking lokalny i globalny z obsługą podklas.
- Osobne lokalne Studio do edycji katalogów świata, przedmiotów, efektów, rozwoju i sklepu.

## Kierunki przewidziane przez obecną konfigurację

- Kolejne umiejętności, pierścienie, ścieżki i podklasy można dodać w Studio. Aktualny katalog zawiera wyłącznie koło Berserka. [Katalog rozwoju](data/skills.js)
- Edytory pozwalają tworzyć warianty istniejących typów zadań i lokacji. Dostępne są nagrody w złocie, warunek poziomu oraz najwyżej jedno aktywne Miasto i jedna aktywna Przygoda. Reguły walidacji są lokalnie w `tools/game-designer/world-schema.cjs`. [Katalog świata](data/world.js)
- Silnik obsługuje własne modyfikatory bez edycji nazwanych efektów. Katalog przypisań jest pusty i gotowy do uzupełnienia. [Modyfikatory](data/modifiers.js)

## Brak zatwierdzonego planu

W lokalnej dokumentacji i katalogach nie ma ustalonego kolejnego wydania, dat ani kolejności rozwoju. Nowe typy lokacji i zadań, dodatkowe typy przedmiotów użytkowych i samodzielny symulator walki pozostają poza aktualnym zakresem. Konkretne decyzje wpisuj tutaj po uzgodnieniu.
