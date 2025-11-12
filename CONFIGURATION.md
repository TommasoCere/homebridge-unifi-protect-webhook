# Guida Configurazione - UniFi Protect Webhook

## ⚠️ PROBLEMA: Plugin installato ma non appare nei log

Se hai installato il plugin ma **non vedi alcun log** e **non appare nella lista dei plugin attivi**, significa che **manca la configurazione nel file config.json di Homebridge**.

## ✅ Soluzione: Aggiungere la piattaforma al config.json

### Passo 1: Aprire la configurazione di Homebridge

**Via Homebridge UI (Consigliato):**
1. Apri Homebridge Config UI X (di solito http://homebridge-ip:8581)
2. Vai su **Config** (icona ingranaggio in alto a destra)
3. Cerca la sezione `"platforms": []`

**Via file diretto:**
- Il file si trova di solito in `~/.homebridge/config.json`

### Passo 2: Aggiungere il blocco piattaforma

Aggiungi questo blocco nell'array `"platforms"`:

```json
{
  "platforms": [
    {
      "platform": "ProtectWebhookPlatform",
      "name": "UniFi Protect Webhook",
      "adminSecret": "tuo-secret-opzionale",
      "port": 12050,
      "bindAddress": "0.0.0.0",
      "enforceLocalOnly": true,
      "webhooks": [],
      "emailTriggers": []
    }
  ]
}
```

### Passo 3: Configurazione Minima

La configurazione **minima** richiesta è:

```json
{
  "platform": "ProtectWebhookPlatform",
  "name": "UniFi Protect Webhook"
}
```

### Passo 4: Esempio Completo config.json

```json
{
  "bridge": {
    "name": "Homebridge",
    "username": "XX:XX:XX:XX:XX:XX",
    "port": 51826,
    "pin": "123-45-678"
  },
  "platforms": [
    {
      "platform": "ProtectWebhookPlatform",
      "name": "UniFi Protect Webhook",
      "adminSecret": "my-secret-password",
      "port": 12050,
      "bindAddress": "0.0.0.0",
      "enforceLocalOnly": true,
      "webhooks": [],
      "emailTriggers": []
    }
  ]
}
```

## 🔍 Come verificare se la configurazione è corretta

Dopo aver aggiunto la piattaforma e riavviato Homebridge, dovresti vedere nei log:

```
═══════════════════════════════════════════════════
  UniFi Protect Webhook Plugin
  Webhook & Email triggers → HomeKit Motion Sensors
═══════════════════════════════════════════════════
[UniFi Protect Webhook] [MODULE] Plugin module loading...
[UniFi Protect Webhook] [MODULE] Homebridge API received
[UniFi Protect Webhook] [MODULE] Platform constructor called
```

## ⚙️ Parametri di Configurazione

| Parametro | Tipo | Default | Descrizione |
|-----------|------|---------|-------------|
| `platform` | string | **RICHIESTO** | Deve essere esattamente `"ProtectWebhookPlatform"` |
| `name` | string | **RICHIESTO** | Nome visualizzato (suggerito: "UniFi Protect Webhook") |
| `adminSecret` | string | null | Password per endpoint admin (generazione token, ecc.) |
| `port` | number | 12050 | Porta HTTP del server webhook |
| `bindAddress` | string | "0.0.0.0" | Indirizzo IP di ascolto |
| `enforceLocalOnly` | boolean | true | Blocca richieste da IP non locali (RFC1918) |
| `webhooks` | array | [] | Array di webhook configurati manualmente |
| `emailTriggers` | array | [] | Array di trigger email IMAP |

## 📝 Note Importanti

1. **`platform` DEVE essere esattamente `"ProtectWebhookPlatform"`** (case-sensitive)
2. Il campo `name` può essere qualsiasi cosa, ma `"UniFi Protect Webhook"` è consigliato
3. Dopo aver modificato `config.json`, **riavvia completamente Homebridge**
4. Se usi Homebridge UI X, il plugin dovrebbe apparire nella sezione "Plugins" dopo il riavvio
5. La UI Admin integrata apparirà nella pagina delle impostazioni del plugin (se configurato correttamente)

## 🐛 Troubleshooting

### Il plugin non appare dopo aver aggiunto la configurazione

1. Verifica che `"platform": "ProtectWebhookPlatform"` sia scritto correttamente
2. Verifica che la virgola JSON sia corretta (non dimenticare le virgole tra gli elementi dell'array)
3. Valida il JSON con un tool online (es. jsonlint.com)
4. Controlla i log di Homebridge per errori di parsing del config.json

### Vedo il plugin ma non la UI Admin

Se il plugin si carica ma non vedi il pannello Admin nella pagina delle impostazioni:
- Questo è il problema che stiamo debuggando con le versioni 0.2.7-0.2.8
- Controlla i log per messaggi `[UniFi Protect Webhook UI]`
- Verifica versione Homebridge >= 1.8.0
- Verifica versione Homebridge Config UI X (deve supportare custom UI)

### Il server HTTP non parte

Se vedi errori come "EADDRINUSE" o "EACCES":
- Cambia la `port` a un valore diverso (es. 12051, 12052, ecc.)
- Verifica che la porta non sia già in uso da un altro processo
- Su Linux/macOS, le porte < 1024 richiedono permessi root

## 📚 Risorse

- [README principale](./README.md)
- [README italiano](./README.it.md)
- [Changelog](./CHANGELOG.md)
- [GitHub Issues](https://github.com/TommasoCere/homebridge-unifi-protect-webhook/issues)

## 🆘 Aiuto

Se continui ad avere problemi:

1. Controlla i log completi di Homebridge
2. Verifica che il plugin sia installato: `npm list -g homebridge-unifi-protect-webhook`
3. Apri un issue su GitHub con:
   - Versione Homebridge
   - Versione Node.js
   - Il tuo config.json (RIMUOVI dati sensibili come adminSecret, password email, ecc.)
   - Log completi di avvio di Homebridge
