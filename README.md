# homebridge-unifi-protect-webhook

Homebridge plugin that exposes local HTTP webhook endpoints and IMAP email triggers as HomeKit Motion Sensors for UniFi Protect / Reolink integration.

[Leggi in Italiano](./README.it.md)

## Features

- Multiple named webhook endpoints, each protected by a token.
- Email triggers via IMAP (Gmail supported with App Password) firing when a matching subject arrives.
- Per-trigger options: debounce (cooldown), active duration, IP allowlist, custom path.
- Security: local-network enforcement (RFC1918) enabled by default, per‑webhook tokens, optional admin secret for secure token reveal/regeneration.

## Installation

1. Place/install the plugin under Homebridge and run `npm install` in the plugin directory.
2. Restart Homebridge.
3. Configure via Homebridge UI (Platform: `ProtectWebhookPlatform`).

## Security

- Server binds by default to `0.0.0.0` but blocks non-local IPs if `enforceLocalOnly=true`.
- Always use webhook tokens. If empty, one is generated and stored in accessory context (not printed in logs).
- Further restrict with `allowedIps` (comma‑separated list).

### Token reveal (one-time) & regenerate

- Set an `adminSecret` to enable admin endpoints.
- Reveal token once (only if auto-generated and not revealed before):

```powershell
curl "http://<HB-IP>:12050/admin/webhooks/<NAME>/token?adminSecret=<ADMIN_SECRET>"
```

- Regenerate a lost token:

```powershell
curl -X POST "http://<HB-IP>:12050/admin/webhooks/<NAME>/regenerate?adminSecret=<ADMIN_SECRET>"
```

Notes:

- Admin endpoints are local‑network only; if `adminSecret` is set, it must be provided (header `x-admin-secret` or query `?adminSecret=`).
- Tokens are never logged; copy from the admin endpoint response and store securely.

## Configuration (Homebridge UI)

- bindAddress: HTTP server bind address (default 0.0.0.0).
- port: server port (default 12050).
- enforceLocalOnly: block non‑RFC1918 IPs if true (default true).
- adminSecret: secret for admin token endpoints (optional but recommended).
- webhooks: array
  - name: sensor/endpoint name.
  - path: HTTP path (default `/wh/<name>`), supports GET & POST.
  - token: if empty, auto-generated; supply via header `x-webhook-token` or `?token=`.
  - debounceSeconds: minimum time between activations.
  - durationSeconds: active ON duration before reset.
  - allowedIps: comma separated allowlist.
- emailTriggers: array (IMAP)
  - name: sensor name.
  - imapHost/Port/TLS: IMAP parameters (Gmail: `imap.gmail.com:993/TLS`).
  - imapUser / imapPassword: IMAP credentials (Gmail: App Password).
  - subjectMatch: regex or substring to match email subject.
  - debounceSeconds / durationSeconds: as above.

## Examples

Trigger webhook:

```powershell
curl -X POST "http://<HB-IP>:12050/wh/front-door?token=<TOKEN>"
```

Reolink email filter: set `subjectMatch` to a stable substring (e.g. `Reolink Alert`).

## Gmail Notes

- Enable 2FA + create an IMAP App Password.
- Emails are marked as read after being processed.

## Logging

Uses Homebridge logger (info/debug/warn/error). Enable debug for detailed request tracing.
