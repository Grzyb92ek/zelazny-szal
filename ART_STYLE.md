# Żelazny Szał — styl graficzny

Żelazny Szał opiera się na stylistyce grimdark fantasy. Panele są ciemne, obramowania przypominają metal, a złoto i czerwień wyróżniają kluczowe informacje. Istniejące grafiki najlepiej oceniać w skali, w jakiej pojawiają się w sklepie, plecaku i walce.

## Grafiki

| Element | Gdzie jest przechowywany i jak jest używany |
| --- | --- |
| Przedmioty | [`assets/items/`](assets/items/) — ikony PNG z przezroczystym tłem. Jedna ikona może służyć każdej rzadkości. W katalogu dostępny jest symbol zastępczy. |
| Barbarzyńca | [`barbarian.webp`](assets/barbarian.webp) — wspólna grafika postaci w interfejsie i walce. |
| Przeciwnicy | [`enemies.webp`](assets/enemies.webp) — arkusz sześciu pól w układzie 3 × 2. Można też przypisać osobny obraz. [Mapowanie pól](js/art.js) |
| Berserk | [`berserk.png`](assets/subclasses/berserk.png) — portret z czerwoną aurą. Używany przy wyborze podklasy i w medalionie, który może mieć też osobną grafikę. |

Zachowuj przezroczystość i proporcje grafik. Ikony przedmiotów powinny mieć czytelną sylwetkę w małej skali i wyraźny kontrast na ciemnej karcie. Nazwy i opisy wyświetla interfejs gry.

## Interfejs

- **Rzadkości:** biały oznacza pospolity, zielony niepospolity, a niebieski rzadki. Tekst podaje też nazwę rzadkości.
- **Sklep:** czerwony wyróżnia niedostępną cenę i zajęty slot, złoty ulepszenie, zielony przedmiot założony, a niebieski przedmiot w plecaku. Etykiety tekstowe zachowują czytelność bez polegania wyłącznie na kolorze.
- **Koło umiejętności:** centralny medalion, metaliczne pierścienie i generowane połączenia. Ciemny węzeł z kłódką jest zablokowany, czerwony dostępny, a złoto-czerwony odblokowany. Podpowiedź ma ciemne tło i złote obramowanie.
- **Układ:** na szerokim ekranie trzy kolumny dają osobne miejsce statystykom, Przygodzie i wyposażeniu. Poniżej 1024 px układ przechodzi do jednej kolumny, a oferty sklepu mieszczą się po dwie w rzędzie. Przy nowych grafikach zachowuj miejsce na czytelne opisy także na telefonie.

Reguły layoutu, kolorów, efektów i animacji są w [`style.css`](style.css). Styl koła i jego podpowiedzi jest w [`skill-wheel.css`](skill-wheel.css).
