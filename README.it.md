# homebridge-unifi-protect-webhook

Plugin per Homebridge che espone endpoint Webhook locali e trigger via Email IMAP come Sensori di Movimento in HomeKit.

# homebridge-unifi-protect-webhook

Plugin per Homebridge che espone endpoint Webhook locali e trigger via Email IMAP come Sensori di Movimento in HomeKit.

[English README](./README.md)

## Funzionalità
## UniFi Protect Webhook (Homebridge)
- Più webhook nominabili, ognuno con token di autenticazione, che attivano un Sensore di Movimento in HomeKit.
Plugin Homebridge che espone Webhook locali (e opzionalmente trigger email IMAP) come Sensori di Movimento in HomeKit. UI integrata in Homebridge Config UI X.
- Opzioni per singolo webhook/email: debounce (cooldown), durata ON, allowlist IP, path personalizzato.
Questa versione usa una UI “solo bozza” (draft‑only): la pagina del plugin modifica la configurazione in memoria e abilita il pulsante SALVA. Niente chiamate dirette a UniFi Protect: la creazione/aggiornamento del webhook su UniFi è manuale.

## Installazione Rapida

1. Cerca e installa il plugin “UniFi Protect Webhook” da Homebridge UI.
2. Apri la pagina del plugin e configura i campi minimi (vedi sotto), quindi SALVA.
3. Crea un Webhook dalla UI del plugin, poi clicca “Rivela URL” o “Rigenera” per ottenere il link completo (con token). Clicca SALVA per confermare le modifiche.
4. Copia l’URL in UniFi Protect (Impostazioni → Integrations → Webhooks → Outgoing).

## Configurazione Minima

- `publicHost` oppure `publicBaseUrl`: usati per costruire l’URL che andrai a copiare in UniFi.
  - `publicHost`: IP/hostname della macchina Homebridge (es. `192.168.1.50`).
  - `publicBaseUrl`: URL completo esterno (es. `https://homebridge.miodominio.it/hb`). Consigliato con reverse proxy/HTTPS.
- Porta predefinita del server webhook: `12050`.

Esempi:

```json
{
  # UniFi Protect Webhook (Homebridge)

  Plugin Homebridge per trasformare Webhook locali (e opzionali trigger email IMAP) in Sensori di Movimento HomeKit. UI integrata in Homebridge Config UI X.

  [English README](./README.md)

  ## Installazione rapida

  1. Installa il plugin da Homebridge UI.
  2. Apri la pagina del plugin e imposta `publicHost` o `publicBaseUrl`, poi SALVA.
  3. Crea un Webhook, clicca “Rivela URL” o “Rigenera” per ottenere il link (con token) e SALVA.
  4. In UniFi Protect incolla l’URL in Outgoing Webhook.

  La UI è “solo bozza” (draft‑only): aggiorna la configurazione in memoria e abilita il pulsante SALVA. Nessuna chiamata diretta a UniFi.

  ## Configurazione minima

  - `publicHost`: IP/hostname di Homebridge (es. `192.168.1.50`).
  - In alternativa `publicBaseUrl`: URL esterno completo (es. `https://homebridge.miodominio.it/hb`). Usa `trustProxyHeaders: true` dietro reverse proxy.
  - Porta predefinita: `12050`.

  Esempio LAN:

  ```json
  {
    "platform": "ProtectWebhookPlatform",
    "publicHost": "192.168.1.50",
    "port": 12050
  }
  ```

  Esempio HTTPS/reverse proxy:

  ```json
  {
    "platform": "ProtectWebhookPlatform",
    "publicBaseUrl": "https://homebridge.miodominio.it/hb",
    "trustProxyHeaders": true
  }
  ```

  Priorità base URL: 1) `publicBaseUrl` 2) `X‑Forwarded‑*` (se `trustProxyHeaders=true`) 3) `publicHost` 4) IP privato auto‑rilevato 5) `bindAddress`.

## Creare e usare un Webhook

  1. Inserisci il Nome (senza spazi) e crea il Webhook.
  2. “Rivela URL” (prima rivelazione) o “Rigenera” (nuovo token): la UI genera il token lato client e mostra l’URL completo.
  3. Clicca SALVA per rendere persistente il token nel `config.json`.
  4. In UniFi Protect: Settings → Integrations → Webhooks → Outgoing → incolla l’URL (incluso `?token=...`).

## Se vedi 127.0.0.1

  Imposta `publicHost` (IP di Homebridge) oppure `publicBaseUrl` (con `trustProxyHeaders=true` dietro proxy). L’URL mostrato nella UI userà questi valori.

## Trigger Email (opzionale)

  Aggiungi un trigger IMAP con host, utente, password e `subjectMatch`. SALVA per attivare.

## Sicurezza

- `enforceLocalOnly=true` limita l’accesso alla LAN. Per esposizione esterna usa un reverse proxy sicuro.
- Imposta `adminSecret` se usi endpoint admin via script.
In UniFi Protect: Settings → Integrations → Webhooks → Outgoing → incolla l’URL (incluso `?token=...`).
