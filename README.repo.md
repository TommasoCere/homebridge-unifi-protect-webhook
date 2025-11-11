# Repository Setup

Questo file riassume i passi per inizializzare e pubblicare il repository.

## Inizializzazione locale

```powershell
git init
git add .
git commit -m "chore: initial commit"
git branch -M main
```

## Creazione repo remota (GitHub CLI opzionale)

Se usi GitHub CLI:

```powershell
gh repo create tommasocere/homebridge-unifi-protect-webhook --public --source . --remote origin --push
```

Manuale da interfaccia web:

1. Crea il repository pubblico `tommasocere/homebridge-unifi-protect-webhook` su GitHub.
2. Aggiungi origin:

```powershell
git remote add origin https://github.com/tommasocere/homebridge-unifi-protect-webhook.git
git push -u origin main
```

## Tag e release

Per pubblicare la versione corrente (0.1.0):

```powershell
git tag v0.1.0
git push origin v0.1.0
```
Poi crea la release su GitHub agganciata al tag.

## Aggiornamento versione

1. Modifica `package.json` incrementando la versione.
2. Commit:

```powershell
git commit -am "chore: bump version to v0.x.x"
git tag v0.x.x
git push origin main --tags
```

## Audit sicurezza

```powershell
npm run audit
```

Risolvi eventuali vulnerabilità aggiornando le dipendenze.

## Pubblicazione su npm (opzionale)

```powershell
npm publish --access public
```

Assicurati che il nome del pacchetto non sia già occupato.
