# NextBite

**Mangia meglio, al momento giusto.**

Prima release della web app di nutrizione adattiva, basata sull’SDD e sul mockup approvato: dashboard con colori tenui, diario, macro, ricette, progressi e una barra sempre disponibile per testo, foto e dettatura.

## Avvio rapido

Richiede Node.js 24 LTS e npm. Nessun servizio esterno necessario per provare la modalità locale.

```bash
npm ci
npm run dev
```

Apri http://localhost:3000. Completa l’onboarding oppure scegli **Esplora con dati di esempio**. In modalità locale i dati sono salvati solo nel browser; una nuova installazione parte senza dati personali. La demo è esplicitamente selezionata e usa dati di esempio.

## Cosa funziona nella 0.1.0

- Onboarding per adulti: obiettivo, dati personali, attività, preferenze, stima iniziale modificabile.
- Home: calorie, macro, un suggerimento prioritario, pasti, acqua, prossimo allenamento.
- Diario per data: ricerca in un catalogo iniziale, quantità, modifica/eliminazione, copia da ieri e routine.
- Alimenti personalizzati con valori per 100 g; quantità e calorie derivano sempre dai dati dell’alimento.
- Barra testo/audio: descrizioni con quantità esplicite, acqua, peso, allenamenti e richieste di idee. Ogni pasto viene mostrato per conferma.
- Dettatura dove supportata dal browser, con avvio esplicito e testo controllabile prima dell’invio.
- Foto allegata come riferimento locale: registrazione manuale, senza riconoscimento AI o upload.
- Peso con media mobile per giorni reali, grafico e riepilogo dei giorni registrati.
- Allenamenti manuali con sport, data, ora, durata e intensità.
- Ricette, ingredienti, porzioni, preferiti, piano di 7 giorni e lista della spesa derivata dal piano.
- Coach con suggerimenti di base basati su regole; nessuna API AI necessaria.
- Tema chiaro/scuro, layout mobile, navigazione da tastiera, dialoghi con focus ed Escape.
- Esportazione/importazione JSON validata, cancellazione locale e annullamento delle operazioni principali.
- Supabase opzionale: email/password, Google, recupero password e copia cloud manuale per utente con RLS.

## Configurazione Supabase

1. Crea un progetto Supabase ed esegui `supabase/migrations/202610070001_initial.sql` nell’SQL editor.
2. Copia `.env.example` in `.env.local` e inserisci la URL e la **chiave pubblica anon** del progetto. Non usare una service-role key.
3. In Authentication configura Site URL e URL di redirect per localhost e per il dominio distribuito.
4. Abilita email/password. Per Google configura il provider OAuth e la callback indicata da Supabase nel progetto Google.
5. Riavvia Next.js e accedi dal Profilo. Usa **Salva nel cloud** o **Carica dal cloud**. Il caricamento sostituisce i dati locali previa conferma; puoi annullarlo.

L’autenticazione non comporta caricamento automatico dei dati locali. La modalità attuale è una copia cloud esplicita dell’intero stato, con separazione per `auth.uid()`, non una sincronizzazione realtime. La migrazione abilita RLS e revoca l’accesso anonimo. Verifica con due utenti distinti prima dell’uso con dati reali. La cancellazione locale non cancella la copia cloud o l’account; queste operazioni verranno aggiunte alla gestione account.

## Verifiche

```bash
npm run typecheck
npm test
npm run build
npx playwright install chromium
npm run test:e2e
```

La pipeline GitHub Actions esegue typecheck, test del dominio, build e test browser desktop/mobile. I test browser verificano onboarding, conferma del pasto, acqua, peso, persistenza dopo reload, dialoghi e separazione piano/diario.

## Deploy

Compatibile con hosting Next.js, ad esempio Vercel. Importa il repository, usa Node.js 24 e aggiungi le due variabili pubbliche Supabase solo se vuoi usare il cloud. Il comando di build è `npm run build`. Per un server Node:

```bash
npm ci
npm run build
npm start
```

Nessun deploy esterno è incluso in questa modifica.

## Limiti e prossime release

Questa è la base utilizzabile del progetto, non l’implementazione completa di tutte le 169 sezioni dell’SDD.

- Catalogo di 16 alimenti con valori indicativi e quattro ricette: non un database verificato commerciale. Crudo/cotto è sempre esplicitato.
- Il parser locale riconosce un vocabolario limitato e quantità in g/kg; un cucchiaio di olio è una stima di 10 g da confermare. Non converte ml in grammi senza densità. Elementi non riconosciuti restano visibili e richiedono inserimento manuale.
- Il coach propone esempi e non formula prescrizioni mediche o diete cliniche. Non usa LLM e non adatta realmente il target allo storico in questa release.
- Preferenza senza lattosio supportata; gestione completa delle allergie non ancora disponibile.
- Target training/rest, barcode, riconoscimento foto AI, database esterni, wearable, analytics e account deletion sono successivi.
- Il piano salva una porzione per ricetta; il diario supporta porzioni multiple. Le ricette pianificate non vengono considerate pasti consumati.
- Manifest per installazione presente; service worker, caching shell offline e sincronizzazione delle operazioni offline sono successivi. Non è ancora garantito il caricamento dell’app senza rete.
- Dettatura dipende dal supporto browser e può usare il servizio di riconoscimento del browser. Richiede autorizzazione esplicita al microfono.
- Dati locali persistenti non cifrati: evita dispositivi condivisi per dati personali. Il backup cloud contiene l’intero stato e ha limite 5 MB.
- La formula iniziale usa Mifflin–St Jeor e un moltiplicatore di attività; senza sesso dichiarato usa un coefficiente medio esplicitamente indicato. È una stima orientativa.

L’SDD fornito resta separato dal repository pubblico. Le decisioni tecniche della prima release sono in [docs/IMPLEMENTATION.md](docs/IMPLEMENTATION.md).

## Immagini

Fotografie dimostrative da Unsplash; non rappresentano con precisione ingredienti o porzioni. URL di origine in [docs/ASSETS.md](docs/ASSETS.md). Il fallback illustrato è locale. Il font DM Sans viene richiesto da Google Fonts con fallback al font di sistema.
