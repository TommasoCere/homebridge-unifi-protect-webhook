# homebridge-unifi-protect-webhook

Homebridge plugin to expose local Webhooks (and optional IMAP email triggers) as HomeKit Motion Sensors. Integrated UI in Homebridge Config UI X.

[Leggi in Italiano](./README.it.md)

## Quick Start

1. Install the plugin in Homebridge UI.
2. Open the plugin page, set `publicHost` or `publicBaseUrl`, then SAVE.
3. Create a Webhook, click “Reveal URL” or “Regenerate” to get the full link (with token), then SAVE.
4. Paste the URL into UniFi Protect (Outgoing Webhook).

The UI is draft‑only: it updates in‑memory config and enables the SAVE button. No direct calls to UniFi.

## Minimal Config

- `publicHost`: IP/hostname of the Homebridge machine (e.g. `192.168.1.50`).
- Or `publicBaseUrl`: full external URL (e.g. `https://homebridge.example.com/hb`). Use `trustProxyHeaders: true` behind reverse proxies.
- Default port: `12050`.

LAN example:

```json
{
  "platform": "ProtectWebhookPlatform",
  "publicHost": "192.168.1.50",
  "port": 12050
}
```

HTTPS / reverse proxy example:

```json
{
  "platform": "ProtectWebhookPlatform",
  "publicBaseUrl": "https://homebridge.example.com/hb",
  "trustProxyHeaders": true
}
```

Base URL priority: 1) `publicBaseUrl` 2) `X‑Forwarded‑*` (when `trustProxyHeaders=true`) 3) `publicHost` 4) auto‑detected private IPv4 5) `bindAddress`.

## Create and Use a Webhook

1. Enter Name (no spaces) and create.
2. “Reveal URL” (first reveal) or “Regenerate” (new token): UI generates the token client‑side and shows the full URL.
3. Click SAVE to persist the token to `config.json`.
4. In UniFi Protect: Settings → Integrations → Webhooks → Outgoing → paste the URL (including `?token=...`).

## If you see 127.0.0.1

Set `publicHost` (Homebridge IP) or `publicBaseUrl` (with `trustProxyHeaders=true` behind proxy). The UI URLs will use those values.

## Email Triggers (optional)

Add an IMAP trigger with host, user, password and `subjectMatch`. SAVE to activate.

## Security

- `enforceLocalOnly=true` limits access to LAN; use a secure reverse proxy for internet exposure.
- Set `adminSecret` if you’ll use admin endpoints via external scripts.
