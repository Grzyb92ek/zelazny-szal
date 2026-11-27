# Globalny ranking Żelaznego Szału

Frontend odczytuje TOP 100 metodą GET i przesyła zakończoną rozgrywkę metodą POST do `/functions/v1/global-ranking`. Publiczny adres projektu jest w `js/global-ranking.js`. Ten sam frontend działa na GitHub Pages i w PlayDrop. Gracze nie potrzebują konta, klucza API ani sesji Supabase.

## Wdrożenie Supabase

Wykonaj polecenia w katalogu zawierającym folder `supabase`, używając konta Supabase z dostępem do projektu `adwcphvqyvemyiluixcg`. Logowanie w CLI otworzy stronę Supabase.

```powershell
npx supabase login
npx supabase link --project-ref adwcphvqyvemyiluixcg
npx supabase db push --remote
$rankingSecret = node -e "process.stdout.write(require('node:crypto').randomBytes(32).toString('hex'))"
npx supabase secrets set "RANKING_RATE_SECRET=$rankingSecret" --remote=adwcphvqyvemyiluixcg
Remove-Variable rankingSecret
npx supabase functions deploy global-ranking --remote=adwcphvqyvemyiluixcg --use-api
```

Jeśli projekt ma własną historię migracji, przed `db push` uzgodnij ją z lokalnymi plikami. Alternatywnie właściciel projektu może wykonać plik `migrations/20261127000100_global_ranking.sql` jednorazowo w SQL Editor i kontynuować od konfiguracji sekretu. Klucz bazy dostarcza środowisko funkcji. Własne sekrety przechowuj w Edge Function Secrets.

Publiczna funkcja ma `verify_jwt = false` w konfiguracji. CORS dopuszcza także osadzone przeglądarki, które wysyłają origin `null`. Wysyłka nie wymaga rejestracji ani ciasteczek. [Wdrażanie funkcji](https://supabase.com/docs/guides/functions/deploy) · [Sekrety funkcji](https://supabase.com/docs/guides/functions/secrets).

## Testy i wydanie

```powershell
node tests/smoke.cjs
node tests/global-ranking.mjs
$testDeps = Join-Path ([IO.Path]::GetTempPath()) 'zelazny-ranking-test-deps'
npm install --prefix $testDeps --no-audit --no-fund --ignore-scripts @electric-sql/pglite
node tests/global-ranking-db.mjs $testDeps
```

1. Sprawdź, czy publiczne GET zwraca HTTP 200 i tablicę wyników. Sprawdź też błędny POST, który powinien zwrócić HTTP 400. Obie operacje nie dodają wyników testowych.
2. Uruchom lokalną kopię gry przez HTTP. Zakończ nową rozgrywkę, sprawdź obie zakładki, a następnie odśwież globalny ranking. Użyj odrębnego projektu testowego albo ustalonego pseudonimu testowego, który właściciel projektu usunie po próbie.
3. Sprawdź, że wyłączenie internetu nie blokuje lokalnego zapisu i że powrót internetu wysyła oczekujący wynik. Testy jednostkowe i migracji obejmują ponowienie z tym samym identyfikatorem.
4. Po potwierdzeniu połączenia i zapisu podnieś wersję widoczną w `index.html`, jej atrybut `data-version` oraz wersje w adresach skryptów i arkusza stylów. Wdróż przez `main` i sprawdź publiczną stronę gry.

## Bezpieczeństwo i ograniczenia

- RLS i uprawnienia bazy blokują odczyt oraz modyfikację tabel i wywołanie RPC przez role klienckie. Funkcja serwerowa jest jedynym interfejsem gry do rankingu. Serwer waliduje typy, zakresy i spójność punktacji. Gra wyświetla pseudonimy jako tekst.
- Identyfikator UUID jest kluczem głównym. Powtórny zapis zwraca potwierdzenie bez aktualizacji istniejącego rekordu. Wynik nie jest ręcznie wysyłany z interfejsu. Gra przechowuje go do ponowienia przy otwarciu rankingu, starcie gry lub powrocie połączenia.
- Limit wynosi 20 poprawnych prób zapisu na godzinę na adres rozpoznany z nagłówka proxy i 600 łącznie. Adresy są zastępowane skrótem HMAC. Nieustalony adres korzysta ze wspólnego limitu. Jeżeli infrastruktura przekazuje adres proxy zamiast klienta albo pozwala nadpisać nagłówek, limit adresowy może łączyć graczy lub zostać ominięty. Limit łączny pozostaje skuteczny. Z publicznego endpointu można korzystać również poza grą.
- Walka odbywa się w przeglądarce. Osoba modyfikująca klienta może podać pozornie prawidłowe statystyki, pseudonim, datę lub inny UUID. Serwer sprawdza zgodność wyniku z regułami punktacji, ale nie potwierdza przebiegu walki ani tożsamości gracza. Taka weryfikacja wymaga rozgrywki po stronie serwera albo odtwarzalnych, weryfikowanych zapisów walki.
- Data zakończenia jest podawana przez klienta, dzięki czemu wynik wysłany po odzyskaniu internetu zachowuje datę rozgrywki. Data nie decyduje o miejscu przy remisie.
