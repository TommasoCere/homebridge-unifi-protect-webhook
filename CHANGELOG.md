# Changelog

All notable changes to this project will be documented in this file.

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
