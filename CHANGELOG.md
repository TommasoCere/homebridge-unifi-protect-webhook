# Changelog

All notable changes to this project will be documented in this file.

## [0.2.8] - 2025-01-12

### Added

- Modulo Logger centralizzato per gestione logging professionale
- Log diagnostici molto più visibili con timestamp e prefissi chiari
- Gestione robusta degli errori in tutti i moduli critici (server, webhooks, email)
- Banner di avvio per migliore identificazione nei log
- Error handler per server HTTP con logging completo

### Changed

- Rimossi prefissi confusi `[HBUP-WEBHOOK-UI]` in favore di `[UniFi Protect Webhook]` e `[UniFi Protect Webhook UI]`
- Tutti i moduli ora usano il Logger centralizzato per consistenza
- Errori critici ora sempre visibili anche in console, non solo nei log di Homebridge
- Setup di webhooks e email triggers continua anche se alcuni falliscono (resilienza)

### Fixed

- Eccezioni in punti critici non più silenziate
- Errori di avvio del server HTTP ora sempre loggati
- Fallimenti di connessione IMAP ora tracciati con retry automatico loggato

## [0.2.7] - 2025-01-12

### Debug UI Server

- Aggiunto logging diagnostico dettagliato in `homebridge-ui/server.js` per tracciare il caricamento del server UI.
- Console log per verificare se Homebridge esegue il server personalizzato.

## [0.2.6] - 2025-11-12

### Critical Fix

- **Critico**: server UI ora istanziato automaticamente invece di solo esportato; l'UI integrata ora si renderizza correttamente in Homebridge UI X.

## [0.2.5] - 2025-11-12

### Compatibility

- Aggiornati requisiti `engines`: Node `>=20`, Homebridge `>=1.8.0 || ^2.0.0` per allinearsi alla readiness di Homebridge 2.0.
- Nessun cambiamento funzionale, solo metadata per corretta rilevazione UI e flag "2.0 Ready".

## [0.2.4] - 2025-11-11

### Diagnostics

- Aggiunti pulsanti "Aggiorna stato" e "Ping" alla UI integrata per verificare la reattività del bridge.
- Migliorati messaggi di stato (barra diagnostica in alto) e gestione errori.

## [0.2.3] - 2025-11-11

### Fix Publish

- Forzata nuova versione dopo problemi di propagazione su npm (403/404 per 0.2.2). Nessuna modifica di codice.

## [0.2.2] - 2025-11-11

### Internals

- Rinominate le route di stato da `/admin/ui/state` a `/admin/state` coerentemente con la rimozione UI esterna.
- Pulizia riferimenti obsoleti nei README.

## [0.2.1] - 2025-11-11

### UI (Homebridge UI X)

- La UI amministrativa è ora interamente integrata nella pagina del plugin in Homebridge UI X.
- Rimossa la vecchia pagina esterna servita su `/admin/ui` (non più disponibile).
- Il bridge UI (`homebridge-ui/server.js`) inoltra in locale verso gli endpoint admin sicuri:
  - `/admin/state`, `/admin/webhooks/:name/info`, `/admin/webhooks/:name/ephemeral`, `/admin/webhooks/:name/regenerate`.
- Niente token permanenti nei log; generazione URL temporanei con token effimeri.

### Packaging / Metadata

- Aggiunta dichiarazione `homebridge.ui` in `package.json` per Homebridge UI X.
- Rimossa la vecchia directory `src/ui/` dal progetto (era la UI esterna).

 
## [0.2.0] - 2025-11-11

### Fix

- Corretto `package.json`: spostato `ui` a livello top per Homebridge UI X (prima era annidato in `homebridge`).
- Aggiunto `displayName` del plugin.
- Rimossa fisicamente la cartella legacy `src/ui/`.

 

## [0.1.8] - 2025-11-11

### New: Custom Admin UI

- Added a lightweight admin UI served at `/admin/ui`.
- Login with `adminSecret` (if configured) and generate a temporary full webhook URL via button (POST), without exposing permanent tokens.
- UI also shows current webhooks (name, path, base URL) and email triggers summary.

### Documentation

- Updated README (EN/IT) with custom UI instructions.

## [0.1.7] - 2025-11-11

### Features

- Admin endpoint POST `/admin/webhooks/:name/ephemeral` to generate a temporary full URL (short‑lived token) after configuration is complete.
- Webhook handlers accept ephemeral tokens until expiry (default 5 minutes), in addition to the permanent token.

### Config

- `webhooks[].path` is now required and must start with `/wh/` (schema enforces via regex). The runtime also normalizes the prefix for robustness.

### Security/Privacy

- Admin endpoints remain local‑only and require `adminSecret` if configured; logs still redact sensitive params.

## [0.1.6] - 2025-11-11

### UI/Compatibility

- Reverted to default layout (removed custom layout sections) to restore field rendering on older Homebridge Config UI versions.
- Restored array titles (Webhooks / Email triggers) so inputs appear reliably.

## [0.1.5] - 2025-11-11

### UI

- Fixed duplicated headings in settings (e.g., "Webhooks / Webhooks", "Email / Email triggers") by removing array titles and using section headers only.
- Improved readability of array items with per-item titles.

## [0.1.4] - 2025-11-11

### Performance

- IMAP email trigger processing now batches unseen message fetches using `fetch()` iterator instead of per‑message `fetchOne`.
- Batch marking messages as \Seen in chunks of 50 to reduce flag update round‑trips.
- Added lightweight processing lock to avoid overlapping bursts and race conditions when multiple 'exists' events fire quickly.
- Added keepalive options (NOOP every 5min) to reduce idle disconnects on some providers.

### Reliability

- Prevent double processing by queuing a single pending re-run if new mail arrives during batch processing.

### Internal

- No functional changes to matching logic; still generic (regex or substring) for any camera/platform mail alerts.


## [0.1.3] - 2025-11-11

### Added

- Admin endpoint /admin/webhooks/:name/info to retrieve a safe (possibly redacted) webhook URL.
- Admin endpoint /admin/webhooks (list) showing name + path (no tokens).

### Changed

- Request logging now redacts sensitive query parameters (token, adminSecret).
- Startup log and per-webhook readiness log now include base URL for easier copy/paste.
- Schema reorganized with tabbed layout (Generale / Webhooks / Email) and Email items collapsed by default.

### Security

- Avoid logging token or adminSecret anywhere; sensitive query params are replaced with REDACTED.

### Docs

- Updated README (EN + IT) with new endpoints, redaction info, and UI layout.

## [0.1.2] - 2025-11-11

- Bumped version to 0.1.2 in package.json and CHANGELOG.md.

## [0.1.1] - 2025-11-11

- Bilingual documentation (English + Italian) finalized.
- Added GitHub Actions workflow for automatic release & npm publish on tag push.
- Added publishConfig and files whitelist for a clean npm package.
- Migrated IMAP logic to imapflow (security & maintenance improvement).
- Improved changelog format (English) and metadata consistency.

## [0.1.0] - 2025-11-11

- Initial release.
- Homebridge platform with multiple webhooks, per-webhook tokens, local-only security enforcement, debounce/duration options.
- IMAP email triggers (Gmail supported) powered by imapflow.
- Admin endpoints for one-time token reveal and regeneration.
- Homebridge JSON schema, README (EN + IT) and metadata added.
