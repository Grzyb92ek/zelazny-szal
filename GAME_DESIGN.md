# Żelazny Szał — projekt gry

Stan lokalnego kodu w wersji **1.7.1**. Żelazny Szał to turowy autobattler fantasy w przeglądarce. Gracz wybiera postać, przygotowuje wyposażenie i uruchamia walkę. Ataki przebiegają automatycznie. Zwycięstwo pozwala przejść do kolejnej rundy, a śmierć kończy rozgrywkę.

## Przebieg rozgrywki i lokacje

1. Podaj pseudonim, wybierz klasę i dostępną podklasę. W aktualnym katalogu jest Barbarzyńca z podklasą Berserk. Wybór podklasy obowiązuje do końca rozgrywki.
2. Z **Menu głównego** przejdź do **Miasta** albo **Przygody**. Powrót między tymi lokacjami prowadzi przez menu.
3. W **Mieście** przyjmij zadanie z tablicy. Obecne zadanie wymaga zdobycia 3. poziomu i daje 10 złota. Nagrodę po spełnieniu warunku odbierasz z dziennika w Menu głównym lub Przygodzie.
4. **Przygoda** zawiera sklep, podgląd przeciwnika, walkę i dziennik. Po zwycięstwie przycisk „Kontynuuj” rozpoczyna kolejną rundę. HP, wyposażenie, plecak i postęp rozwoju przechodzą dalej. Odwiedziny w Mieście nie zużywają rundy ani nie odnawiają ofert.

[Katalog świata](data/world.js) · [Lokacje](js/locations.js) · [Zadania](js/quests.js) · [Rundy](js/game.js)

## Walka, statystyki i awans

- Gracz wykonuje swoją turę przed przeciwnikiem. Szybkość określa liczbę ataków w turze, a niewykorzystana część przechodzi na kolejną turę walki. Minimalna rozliczana szybkość to 0,25. Przeciwnicy domyślnie mają szybkość 1 i mogą zyskać szansę na krytyk przez efekt.
- Przebicie zmniejsza efektywny pancerz do minimum 0. Zwykły wzór ataku stosuje dolny próg 1 obrażenia po odjęciu pancerza, przed mnożnikiem obrażeń trafienia i redukcją otrzymywanych obrażeń. Krytyk mnoży obrażenia przed pancerzem. Unik pomija trafienie i jego skutki.
- Przywracanie zdrowia po trafieniu leczy do maksymalnego HP, także przy krytycznym, dodatkowym lub zabijającym trafieniu. Odbicie zadaje stałe obrażenia omijające pancerz. Obrażenia bezpośrednie z efektów i odbicie mogą podlegać redukcji otrzymywanych obrażeń. Dodatkowe ataki i kontrataki korzystają z reguł zwykłego trafienia, ale nie uruchamiają kolejnych dodatkowych ataków ani kontrataków. Gdy obie strony zginą przy tym samym rozliczeniu, gracz przegrywa.
- Zwycięstwo daje złoto, EXP i jednorazowe leczenie o wartość regeneracji, do limitu maksymalnego HP. Wymagane EXP to `50 × (poziom + 1)`. Nagroda za walkę to `50 + 5 × floor(poziom / 5)` plus bonus przeciwnika. Nadwyżka EXP zostaje, więc jedna walka może dać kilka poziomów.
- Przeciwnicy rotują kategoriami 1 → 2 → 3, po czym cykl się powtarza. W każdej rundzie gra losuje przeciwnika z bieżącej kategorii. W stosunku do rundy 1 każdy krok dodaje 22% bazowego HP i 10% bazowych obrażeń. HP zaokrągla się w dół, obrażenia w górę. Bazowe złoto rośnie o 1 co dwie rundy.

**Barbarzyńca** zaczyna ze 120 HP, 0 pancerza, 10 obrażeń, szybkością 1, 5% szansy na krytyk, 150% obrażeń krytycznych, regeneracją 6 i 20 złota. Bonus złota, leczenie przy trafieniu, odbicie i przebicie zaczynają od 0. Gra sumuje statystyki klasy, podklasy, odblokowanych umiejętności i założonych przedmiotów. Efekty mogą też dodawać premie warunkowe i trwałe, np. redukcję obrażeń lub minimalną szansę na krytyk.

[Walka](js/combat.js) · [Statystyki postaci](js/state.js) · [Reguły efektów](js/effect-rules.js) · [Skalowanie przeciwników](js/enemies.js) · [Awans](js/progression.js)

## Wyposażenie, plecak, sklep i rzadkość

- **Wyposażenie** ma sześć slotów na obie ręce, zbroję, hełm, amulet i talizman. Broń dwuręczna zajmuje obie ręce i daje premie raz. Przy wymianie broni jednoręcznej można wybrać rękę. Broń dwuręczna wymaga miejsca na odkładane wyposażenie obu rąk.
- **Plecak** ma cztery pola. Mikstury tego samego typu się grupują. Kliknięcie zakłada wyposażenie lub używa mikstury. Prawy przycisk albo przytrzymanie otwiera menu użycia, założenia lub sprzedaży zależnie od przedmiotu. Sprzedaż działa z plecaka, po jednej sztuce, za 50% bazowej ceny przy domyślnych ustawieniach, z zaokrągleniem w dół. Miksturę można wypić przed walką w Przygodzie, gdy brakuje HP. Przedmioty w plecaku nie dają premii wyposażenia.
- **Sklep** losuje domyślnie do pięciu różnych przedmiotów wyposażenia bez powtórzeń w ramach oferty. Osobne losowanie z szansą 40% może dodać miksturę jako szóstą ofertę. Na rundę są dwa przelosowania po 3 złota. Studio pozwala zmienić limity, szanse, ceny i wagi, albo wyłączyć wybrane przedmioty.
- Zakup trafia do wolnego slotu albo do plecaka. Pełny plecak blokuje transakcję wymagającą wolnego pola. Etykiety pokazują zajętość, możliwość ulepszenia i posiadane egzemplarze. **UŻYWANY** i **W PLECAKU** porównują bazowe ID i mogą wystąpić razem. Zakupy, przelosowanie i zarządzanie wyposażeniem są zablokowane podczas walki.
- **Pospolity** (biały) przechodzi na **niepospolity** (zielony) po zakupie kolejnej pospolitej sztuki o tym samym ID. Dodatnie statystyki rosną ×1,5, ujemne zostają na dotychczasowym poziomie. Dwie niepospolite sztuki automatycznie łączą się w jedną **rzadką** (niebieską), bez kolejnego mnożnika statystyk. Połączenie zachowuje w pierwszej kolejności egzemplarz założony. Sklep pomija przedmioty, które gracz ma już w rzadkiej wersji. Mikstura jest przedmiotem użytkowym.

[Przedmioty](data/items.js) · [Rzadkości i opisy](js/items.js) · [Plecak i wyposażenie](js/inventory.js) · [Ustawienia sklepu](data/shop.js) · [Generowanie ofert i zakupy](js/shop.js)

## Efekty specjalne i modyfikatory

Katalog zawiera 38 nazwanych efektów. Każdy z 32 przedmiotów wyposażenia ma przypisany efekt dla wersji rzadkiej. Pozostałe nazwane efekty są używane w kole Berserka. Modyfikatory zaawansowane mają niezależne wartości i liczniki, a obecny katalog ich przypisań jest pusty.

Oba typy korzystają z tego samego silnika. Reguły obsługują m.in. warunki HP, szanse, częstotliwość, kumulację, czas trwania, limity, leczenie, dodatkowe i pomijane ataki, trwałe premie oraz zmianę złota. Efekty wyposażenia zależą od założonego egzemplarza i jego rzadkości. Efekty tymczasowe kończą się zgodnie z ustawioną regułą albo wraz z walką. Wybrane trwałe premie gracza obowiązują do końca rozgrywki również po zdjęciu przedmiotu.

Opisy w grze i w Studio powstają ze wspólnych reguł na podstawie aktualnych wartości. Można zastąpić je własnym tekstem. W panelu „Dodatkowe efekty” źródło jest oddzielone od opisu.

[Biblioteka efektów](data/effects.js) · [Modyfikatory zaawansowane](data/modifiers.js) · [Wykonanie](js/effects.js) · [Opisy i parametry](js/effect-rules.js)

## Podklasa i koło umiejętności

**Berserk** ma dwa pierścienie i cztery ścieżki. Zaczyna z 1 punktem i dostaje 1 za każdy poziom. Każda obecna umiejętność kosztuje 1 punkt i nie wymaga poziomu wyższego niż 1. Węzły wewnętrzne odblokowuje się bezpośrednio z centrum, a zewnętrzne wymagają odpowiadającego węzła wewnętrznego. Punkty wydaje się poza walką, po rozliczeniu awansu i nagród.

| Ścieżka | Wewnętrzny węzeł | Zewnętrzny węzeł |
| --- | --- | --- |
| Krew | Żądza krwi daje 2 HP po trafieniu | Krwawy trans leczy o dodatkowe 5 HP przy krytyku poniżej 50% własnego HP |
| Szał | Berserkerski szał zwiększa obrażenia o 20% poniżej 50% własnego HP | Nieokiełznana furia zwiększa szybkość o 0,5 poniżej 25% własnego HP |
| Zniszczenie | Brutalna siła daje +3 obrażeń i +2 przebicia | Egzekutor zwiększa obrażenia o 25% wobec przeciwnika poniżej 25% HP |
| Cierpienie | Pogarda dla bólu daje +1 obrażeń po otrzymanym trafieniu do końca walki, do +10 | Ostatni szał raz na walkę po przeżytym spadku poniżej 20% HP leczy o 15% maks. HP i daje +20% obrażeń do końca walki |

[Podklasy i koła](data/skills.js) · [Odblokowanie węzłów](js/skills.js)

## Ranking

Po śmierci wynik trafia do lokalnego TOP 10 i do kolejki wysyłki do globalnego TOP 100 w Supabase. Oba rankingi wyświetlają klasę z podklasą, jeśli wynik ją zawiera. Za zwycięstwo gracz otrzymuje 100 pkt, za awans 50 pkt, a za aktualnie założony przedmiot niepospolity lub rzadki 25 pkt. Broń dwuręczna liczy się raz. Remisy rozstrzyga najpierw runda, a potem poziom. Zapis lokalny zależy od adresu, pod którym uruchomiono grę.

[Ranking lokalny](js/ranking.js) · [Klient rankingu globalnego](js/global-ranking.js) · [Supabase](supabase/README.md)

## Game Designer Studio

Na Windows lokalna gra uruchamia się przez `start-game.bat` pod adresem `127.0.0.1:8766`. Studio uruchamia się przez `tools/game-designer/start-designer.bat` pod adresem `127.0.0.1:8765`. Oba skrypty wymagają Node.js.

| Obszar edycji | Dane i możliwości |
| --- | --- |
| Przedmioty | [`items.js`](data/items.js) — typy, ceny, statystyki, grafiki, podgląd rzadkości |
| Przeciwnicy, klasy, zadania, lokacje | [`world.js`](data/world.js) — skalowanie rundy, statystyki, zdolności przeciwników, nagrody, przypisania do lokacji |
| Podklasy i koła umiejętności | [`skills.js`](data/skills.js) — dostępność, punkty, grafiki, węzły, połączenia i wymagania, edytowalne układy pierścieni |
| Efekty specjalne i modyfikatory zaawansowane | [`effects.js`](data/effects.js) i [`modifiers.js`](data/modifiers.js) — wspólne reguły oraz osobne wartości i przypisania modyfikatorów |
| Ustawienia sklepu | [`shop.js`](data/shop.js) — liczba ofert i przelosowań, szansa mikstury, ceny, dostępność i wagi |

Studio pracuje na szkicu i waliduje dane przed zapisem. Obsługuje import, eksport, kopie oraz przywracanie katalogów. Zapisane dane wczytuje odświeżona gra. Narzędzia Studio, instrukcja w `tools/game-designer/README.md` i kopie są lokalne. [Plan i ograniczenia](ROADMAP.md)
