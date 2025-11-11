# Changelog

All notable changes to this project will be documented in this file.

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
