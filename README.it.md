# homebridge-unifi-protect-webhook

Plugin per Homebridge che espone endpoint Webhook locali e trigger via Email IMAP come Sensori di Movimento in HomeKit.

[English README](./README.md)

## Funzionalità

- Più webhook nominabili, ognuno con token di autenticazione, che attivano un Sensore di Movimento in HomeKit.
- Trigger via Email usando IMAP (supporto Gmail con App Password): attiva quando arriva una mail con oggetto corrispondente.
- Opzioni per singolo webhook/email: debounce (cooldown), durata ON, allowlist IP, path personalizzato.
- Sicurezza: enforcement di rete locale (RFC1918) abilitato di default, token per ogni webhook, possibilità di bind su indirizzo specifico.

## Installazione

1. **Installa il plugin sul server Homebridge**:
   ```bash
   npm install -g homebridge-unifi-protect-webhook
   ```

2. **Configura nel `config.json`** (via Homebridge UI o manualmente):
   ```json
   {
     "platforms": [
       {
         "platform": "ProtectWebhookPlatform",
         "name": "UniFi Protect Webhook",
         "port": 12050
       }
     ]
   }
   ```
   **⚠️ IMPORTANTE**: Il campo `"platform"` deve essere esattamente `"ProtectWebhookPlatform"`.

3. **Riavvia Homebridge**

4. **Verifica installazione**:
   ```bash
   npm list -g homebridge-unifi-protect-webhook
   ```
   Dovresti vedere la versione installata. Se vedi `(empty)`, il plugin non è installato.

### Dove trovare la UI Amministrativa (integrata)

Se vedi solo il form di configurazione e non il pannello Admin:

1. Assicurati di usare Homebridge UI X >= 1.8.0 (o Homebridge 2.0) con Node >= 20.
2. Aggiorna il plugin alla v0.2.5 o superiore (i metadata `engines` abilitano correttamente l’iniezione UI).
3. Esegui un hard‑refresh del browser (Ctrl+F5) o svuota la cache.
4. Se ancora non compare, controlla nei log di Homebridge in avvio: l’UI integrata viene caricata automaticamente; eventuali errori in `homebridge-ui/server.js` impediscono la visualizzazione del pannello.

Una volta visibile, il pannello Admin consente di:

- Visualizzare info sicure del webhook (token redatto fino alla prima rivelazione se auto-generato).
- Generare URL temporanei con token a vita breve.
- Rigenerare il token permanente (con prima rivelazione nel response).
- Rivelare una sola volta un token auto‑generato.
- Usare Ping/Aggiorna per una diagnostica rapida.

## Sicurezza

- Il server per default ascolta su `0.0.0.0` ma blocca gli IP non locali (enforceLocalOnly=true). Puoi cambiare `bindAddress` se necessario.
- Usa sempre i token per i webhook. Se lasci vuoto, il plugin ne genera uno e lo salva nel contesto dell'accessorio (persistente in Homebridge).
- Puoi ulteriormente restringere con `allowedIps` (lista separata da virgole).

### Token, URL & UI Integrata in Homebridge

- Imposta un `adminSecret` nella configurazione del plugin per usare gli endpoint amministrativi.
- Per vedere il token di un webhook (solo se auto-generato e non ancora rivelato):

```powershell
curl "http://<IP-HB>:12050/admin/webhooks/<NOME>/token?adminSecret=<ADMIN_SECRET>"
```

- Per visualizzare un URL base del webhook (token redatto se non ancora rivelato):

```powershell
curl "http://<IP-HB>:12050/admin/webhooks/<NOME>/info?adminSecret=<ADMIN_SECRET>"
```

- Per rigenerare un token smarrito:

```powershell
curl -X POST "http://<IP-HB>:12050/admin/webhooks/<NOME>/regenerate?adminSecret=<ADMIN_SECRET>"
```

UI integrata (dentro Homebridge Config UI):

- Apri la pagina del plugin: in alto trovi la configurazione e sotto il pannello Admin.
- Usa "Genera URL temporaneo" per ottenere un URL a vita breve (token effimero) senza esporre il token permanente.
- Con "Rigenera token" ottieni un nuovo token (con prima rivelazione inclusa nella risposta).

Nota:

- Dalla v0.2.0 la vecchia pagina esterna `/admin/ui` è stata rimossa. Usa la pagina del plugin dentro Homebridge UI.
- Dalla v0.2.5 il campo `engines` richiede versioni moderne per essere contrassegnato come pronto per Homebridge 2.0.

Note:

- Gli endpoint admin sono accessibili solo da rete locale; se `adminSecret` è impostato, è obbligatorio fornirlo (header `x-admin-secret` o query `?adminSecret=`).
- I token non vengono scritti nei log e le query sensibili nei log vengono redatte (`token`/`adminSecret`). Usa gli endpoint admin per recuperarli e conservali in modo sicuro.

## UI Config (schema)

La pagina di configurazione usa il layout standard di Homebridge per massima compatibilità. Il `path` è obbligatorio e deve iniziare con `/wh/`. Se lo imposti manualmente, assicurati che sia univoco.

## Configurazione (Homebridge UI)

- bindAddress: indirizzo di bind del server HTTP (es. IP della macchina Homebridge).
- port: porta del server (default 12050).
- enforceLocalOnly: se attivo, blocca richieste da IP non privati.
- adminSecret: segreto per endpoint admin (reveal/regenerate token), opzionale ma consigliato.
- webhooks: array di webhook
  - name: nome sensore/endpoint.
  - path: percorso HTTP (default `/wh/<nome>`); accetta GET e POST.
  - token: se vuoto viene generato automaticamente; invialo via header `x-webhook-token` o query `?token=`.
  - debounceSeconds: tempo minimo tra due attivazioni.
  - durationSeconds: per quanto resta "attivo" il sensore prima del reset.
  - allowedIps: allowlist IP separata da virgole, opzionale.
- emailTriggers: array di trigger IMAP
  - name: nome sensore.
  - imapHost/Port/TLS: parametri IMAP (Gmail: `imap.gmail.com:993/TLS`).
  - imapUser/imapPassword: credenziali IMAP. Per Gmail usa un'App Password.
  - subjectMatch: regex o substring da cercare nell'oggetto della mail.
  - debounceSeconds, durationSeconds: come sopra.

## Esempi

Chiamata webhook via curl:

```powershell
curl -X POST "http://<IP-HB>:12050/wh/camera-ingresso?token=<TOKEN>"
```

Filtro email per Reolink: imposta `subjectMatch` a una parte fissa dell'oggetto che Reolink invia (es. `Reolink Alert`).

## Note Gmail

- Abilita l'autenticazione a due fattori e crea un'App Password IMAP.
- Le email vengono marcate come lette quando intercettate come trigger.

## Log

Il plugin usa i log di Homebridge (info/debug/warn/error). Abilita il livello debug in Homebridge per un tracciamento dettagliato delle richieste.

## Child Bridge (tasto Plugin Logs)

Per ottenere il tasto "Plugin Logs" dedicato e isolare eventuali crash, esegui il plugin come **Child Bridge**:

1. Apri Homebridge UI → Plugins → `homebridge-unifi-protect-webhook`.
2. Clicca sulla chiave inglese (impostazioni).
3. Abilita l’opzione **Run as Child Bridge** (a volte chiamata "Enable Child Bridge").
4. Salva e riavvia Homebridge.

Benefici:

- Processo separato: un problema nei webhook o IMAP non manda giù il bridge principale.
- Log dedicati: vedrai il banner del plugin e le righe diagnostiche nella scheda Plugin Logs.
- Riavvii più semplici e isolamento della memoria.

Note:

- Nessuna modifica di configurazione necessaria; si riusano le voci già presenti nel config.json.
- La porta resta la stessa; assicurati che non sia già usata da altri plugin in Child Bridge.
- Se i log non compaiono al primo riavvio, disabilita e riabilita l’opzione Child Bridge e riavvia nuovamente.

Esempio di linee attese in avvio dopo l’abilitazione:

```text
═══════════════════════════════════════════════════
  UniFi Protect Webhook Plugin
  Webhook & Email triggers → HomeKit Motion Sensors
═══════════════════════════════════════════════════
```

Seguono tipicamente righe diagnostiche come:

```text
[DIAGNOSTIC] Creating HTTP server...
[DIAGNOSTIC] Server created, setting up webhooks...
```
