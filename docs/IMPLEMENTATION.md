# NextBite 0.1.0 — decisioni implementative

## UI approvata

La base è il primo mockup, con dashboard e navigazione Oggi / Diario / Progressi / Scopri / Coach. La barra testo, audio e foto riprende l’elemento apprezzato del secondo mockup ed è sempre disponibile nell’app. Nome finale: NextBite. Colori: verde bosco, salvia, bianco caldo; macro in pesca, lavanda e ambra. Desktop con sidebar; mobile con cinque azioni inferiori. I dettagli di ricetta e inserimento pasto usano dialoghi adattivi.

## Struttura

- `src/app`: shell Next.js App Router, metadata e stili.
- `src/components`: shell interattiva e primitive UI condivise.
- `src/features/nutrition`: tipi Zod, somme, formula iniziale, date, trend e insight.
- `src/features/foods`: catalogo, ricette, parser locale.
- `src/lib`: persistenza e client Supabase opzionale.
- `supabase/migrations`: copia cloud per utente con RLS.
- `tests`: golden tests numerici e flussi browser desktop/mobile.

Le viste sono selezionate da frammenti URL, preservando lo stato dell’app e la navigazione back/forward. Non ci sono API server con segreti né chiamate a servizi AI. I dati sono validati prima della persistenza e all’importazione/caricamento cloud. Il rendering React mantiene il contenuto utente come testo, mai HTML arbitrario.

La UI iniziale è una shell client per mantenere la stessa esperienza locale/cloud. Una release successiva dividerà ogni pagina in componenti feature e introdurrà le tabelle normalizzate dell’SDD con Server Actions/API validate. La copia JSON attuale non sostituisce questo modello di produzione.

## Invarianti

1. Le calorie sono derivate dai valori dichiarati per 100 g e dalle quantità.
2. Ricette e descrizioni passano da una preview modificabile prima della registrazione.
3. Non si inventano alimenti sconosciuti o quantità precise da foto.
4. Nessuna modifica automatica del target a seguito di un allenamento o di una pesata.
5. Una ricetta pianificata non è un pasto consumato.
6. Date giornaliere nel fuso del profilo; timestamp di creazione ISO UTC.
7. Dati corrotti non vengono sovrascritti automaticamente. Esportazione e reset restano disponibili.
8. La sincronizzazione cloud richiede un’azione dell’utente autenticato e RLS separa gli utenti.
9. La demo è una scelta esplicita e non viene popolata a ogni apertura.

## Verifiche e limiti operativi

I test unitari coprono quantità, parser, numeri decimali italiani, timezone/DST, formula e media mobile; i test browser coprono onboarding, registrazioni e persistenza. L’integrazione Supabase è configurabile ma richiede credenziali e un database reali per verificarne i flussi email/OAuth e le policy RLS. Il controllo di queste integrazioni non è simulato come verifica reale.

La prossima priorità è normalizzare il dominio sul database e aggiungere integrazione alimenti verificati, sincronizzazione per entità, account deletion e una suite RLS con due account. Solo dopo vengono AI foto/coach e adattamento del fabbisogno, come nell’SDD.
