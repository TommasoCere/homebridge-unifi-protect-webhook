function escapeHtml(s) { return String(s).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c])); }
function escapeAttr(s) { return escapeHtml(s).replace(/"/g, '&quot;'); }

let pluginConfig = {};

async function request(path, body) {
  const payload = { ...(body || {}) };
  payload.config = pluginConfig || {};
  return await window.homebridge.request(path, payload);
}

async function loadPluginConfig() {
  try {
    const cfgArr = await window.homebridge.getPluginConfig();
    const hasArr = Array.isArray(cfgArr) && cfgArr.length > 0 && cfgArr[0];
    if (hasArr) {
      pluginConfig = cfgArr[0];
    } else {
      // Inizializza una configurazione di base per permettere la creazione del primo Webhook
      pluginConfig = {
        platform: 'ProtectWebhookPlatform',
        name: 'UniFi Protect Webhook',
        port: 12050,
        enforceLocalOnly: true,
        webhooks: [],
        emailTriggers: []
      };
    }
  } catch (e) {
    console.error('Impossibile recuperare la configurazione del plugin:', e);
    pluginConfig = {};
  }
}

async function persistConfig({ save = false } = {}) {
  // Update current config in Homebridge UI. Optionally save (may close the settings panel depending on UI context).
  try {
  const cfgNow = await window.homebridge.getPluginConfig();
  const arr = Array.isArray(cfgNow) ? cfgNow : [];
    const current = (arr[0] && typeof arr[0] === 'object') ? arr[0] : {};
    // Merge minimal to retain unexpected fields
    const merged = { ...current, ...pluginConfig };
    await window.homebridge.updatePluginConfig([merged]);
    const saveAvailable = typeof window.homebridge.savePluginConfig === 'function';
    const noticeEl = document.getElementById('saveNotice');
    if (save) {
      if (saveAvailable) {
        await window.homebridge.savePluginConfig();
        window.homebridge.toast.success('Configurazione salvata.');
        noticeEl && noticeEl.classList.add('hidden');
      } else {
        window.homebridge.toast.warning('Premi "Salva" in alto per applicare definitivamente.');
        noticeEl && noticeEl.classList.remove('hidden');
      }
    } else {
      window.homebridge.toast.success('Configurazione aggiornata.');
      if (!saveAvailable) {
        noticeEl && noticeEl.classList.remove('hidden');
      }
    }
  } catch (e) {
    window.homebridge.toast.error('Errore nel salvataggio configurazione: ' + (e?.message || e));
    throw e;
  }
}

function isConfigured() {
  // Homebridge saves platform entries as objects with `platform` equal to the alias
  return pluginConfig && typeof pluginConfig === 'object' && pluginConfig.platform === 'ProtectWebhookPlatform';
}

async function loadState() {
  try {
    const data = await request('/state');
    if (data && data.notReady) {
      setDiagMsg('Server non ancora pronto (prima configurazione o riavvio), attendo...');
      setTimeout(loadState, 800);
      return;
    }
    renderWebhooks(data.webhooks || []);
    renderEmails(data.emailTriggers || []);
    setDiagMsg('Stato aggiornato');
  } catch (e) {
    window.homebridge.toast.error('Errore nel caricamento stato: ' + (e?.message || e));
    setDiagMsg('Errore stato');
  }
}

function renderWebhooks(items) {
  const tbody = document.querySelector('#webhooksTable tbody');
  tbody.innerHTML = '';
  if (!items || items.length === 0) {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td colspan="4"><em>Nessun webhook. Crea il primo con il form qui sopra.</em></td>`;
    tbody.appendChild(tr);
    return;
  }
  for (const w of items) {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${escapeHtml(w.name)}</td>
      <td><code>${escapeHtml(w.path)}</code></td>
      <td><code>${escapeHtml(w.url)}</code></td>
      <td>
        ${w.revealed ? '' : `<button class="action" data-action="reveal" data-name="${escapeAttr(w.name)}">Rivela URL</button>`}
        <button class="action warn" data-action="regenerate" data-name="${escapeAttr(w.name)}">Rigenera</button>
        <button class="action danger" data-action="delete-wh" data-name="${escapeAttr(w.name)}">Elimina</button>
      </td>
    `;
    tbody.appendChild(tr);
  }
}

function renderEmails(items) {
  const tbody = document.querySelector('#emailTable tbody');
  tbody.innerHTML = '';
  for (const e of items) {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${escapeHtml(e.name)}</td>
      <td>${escapeHtml(e.imapHost || '')}</td>
      <td>${e.debounceSeconds ?? 0}</td>
      <td>${e.durationSeconds ?? 10}</td>
      <td><button class="action danger" data-action="delete-em" data-name="${escapeAttr(e.name)}">Elimina</button></td>
      
    `;
    tbody.appendChild(tr);
  }
}

function showOutput(text) {
  const sec = document.querySelector('#ephemeralOutput');
  const div = document.querySelector('#ephemeralContent');
  div.textContent = text;
  sec.classList.remove('hidden');
  sec.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

async function onTableClick(ev) {
  const btn = ev.target.closest('button[data-action]');
  if (!btn) return;
  const name = btn.getAttribute('data-name');
  const action = btn.getAttribute('data-action');
  try {
    btn.disabled = true;
    btn.classList.add('working');
    if (action === 'reveal' || action === 'regenerate' || action === 'delete-wh' || action === 'delete-em') {
      window.homebridge.toast.info(({
        'reveal': `Richiedo URL per '${name}'...`,
        'regenerate': `Rigenero token per '${name}'...`,
        'delete-wh': `Elimino webhook '${name}'...`,
        'delete-em': `Elimino trigger email '${name}'...`
      })[action]);
    }
    if (action === 'reveal') {
      const data = await request('/token', { name });
      if (data?.error) throw new Error(data.error);
      if (data?.notReady) {
        window.homebridge.toast.warning('Server non ancora pronto. Riprova tra qualche secondo o riavvia il bridge.');
        return;
      }
      showOutput(`URL (prima e unica rivelazione):\n${escapeHtml(data.url)}`);
      window.homebridge.toast.success(`URL rivelato per '${name}'.`);
      await loadState();
    } else if (action === 'regenerate') {
      if (!confirm(`Rigenerare il token permanente per '${name}'?`)) return;
      const data = await request('/regenerate', { name });
      if (data?.error) throw new Error(data.error);
      if (data?.notReady) {
        window.homebridge.toast.warning('Server non ancora pronto. Riprova tra qualche secondo o riavvia il bridge.');
        return;
      }
      // Aggiorna la configurazione persistente con il nuovo token
      const list = Array.isArray(pluginConfig.webhooks) ? pluginConfig.webhooks : [];
      const idx = list.findIndex(w => String(w.name) === String(name));
      if (idx >= 0) {
        // Salviamo il token generato lato backend (data.token) nella config
        list[idx] = {
          ...list[idx],
          token: data.token || list[idx].token, // fallback precedente se assente
          tokenAutogenerated: true,
          tokenRevealed: false // reset flag rivelazione
        };
        pluginConfig.webhooks = list;
        try {
          await persistConfig({ save: true });
        } catch (e) {
          window.homebridge.toast.error('Errore salvataggio nuovo token in config: ' + (e?.message || e));
        }
      } else {
        window.homebridge.toast.warning('Webhook non trovato in configurazione locale; il token è stato rigenerato solo in memoria.');
      }
      showOutput(`Nuovo token permanente (prima rivelazione):\n${escapeHtml(data.url)}`);
      window.homebridge.toast.success(`Token rigenerato per '${name}' e salvato in config.`);
      await loadState();
    } else if (action === 'delete-wh') {
      if (!confirm(`Eliminare il webhook '${name}' dalla configurazione?`)) return;
      const list = Array.isArray(pluginConfig.webhooks) ? pluginConfig.webhooks : [];
      const next = list.filter(w => String(w.name) !== String(name));
      pluginConfig.webhooks = next;
      await persistConfig({ save: true });
      setTimeout(loadState, 1200);
      window.homebridge.toast.success(`Webhook '${name}' eliminato. Riavvia Homebridge per rimuovere l'accessorio se ancora presente.`);
    } else if (action === 'delete-em') {
      if (!confirm(`Eliminare il trigger email '${name}' dalla configurazione?`)) return;
      const list = Array.isArray(pluginConfig.emailTriggers) ? pluginConfig.emailTriggers : [];
      const next = list.filter(w => String(w.name) !== String(name));
      pluginConfig.emailTriggers = next;
      await persistConfig({ save: true });
      setTimeout(loadState, 1200);
      window.homebridge.toast.success(`Trigger email '${name}' eliminato.`);
    }
  } catch (e) {
    window.homebridge.toast.error('Errore: ' + (e?.message || e));
  } finally {
    if (btn) { btn.disabled = false; btn.classList.remove('working'); }
  }
}

function setDiagMsg(msg) {
  const el = document.getElementById('diagMsg');
  if (el) el.textContent = msg;
}

async function ping() {
  const t0 = performance.now();
  try {
    if (!isConfigured()) {
      setDiagMsg('Plugin non configurato: imposta e riavvia.');
      return;
    }
    const res = await request('/ping');
    if (res && res.notReady) {
      setDiagMsg('Server non ancora pronto (ping).');
      return;
    }
    const dt = res?.ms ?? Math.round(performance.now() - t0);
    setDiagMsg(`Ping ok (${dt}ms)`);
  } catch (e) {
    setDiagMsg('Ping fallito');
  }
}

window.addEventListener('DOMContentLoaded', async () => {
  document.querySelector('#webhooksTable').addEventListener('click', onTableClick);
  // Rimosso refresh/ping globali: ora solo refresh sezioni

  // Refresh manuale rimosso

  // Add Webhook
  const whForm = document.getElementById('whAddForm');
  whForm && whForm.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    // Se la piattaforma non è ancora salvata, inizializziamo la base automaticamente
    if (!isConfigured()) {
      pluginConfig = {
        platform: 'ProtectWebhookPlatform',
        name: pluginConfig?.name || 'UniFi Protect Webhook',
        port: pluginConfig?.port || 12050,
        enforceLocalOnly: pluginConfig?.enforceLocalOnly !== false,
        webhooks: Array.isArray(pluginConfig?.webhooks) ? pluginConfig.webhooks : [],
        emailTriggers: Array.isArray(pluginConfig?.emailTriggers) ? pluginConfig.emailTriggers : []
      };
    }
    const rawName = document.getElementById('whName').value.trim();
    if (!rawName) {
      return window.homebridge.toast.error('Inserisci il Nome.');
    }
    if (/\s/.test(rawName)) {
      return window.homebridge.toast.error('Il Nome non deve contenere spazi.');
    }
    const name = rawName;
  const path = `/wh/${encodeURIComponent(name.toLowerCase())}`;
    const debounceSeconds = 0;
    const durationSeconds = 10;
    const list = Array.isArray(pluginConfig.webhooks) ? pluginConfig.webhooks : [];
    if (list.some(w => String(w.name) === name)) {
      return window.homebridge.toast.error('Esiste già un webhook con questo nome.');
    }
    list.push({ name, path, debounceSeconds, durationSeconds });
    pluginConfig.webhooks = list;
  // Prova salvataggio automatico; se non disponibile mostra avviso
  await persistConfig({ save: true });
    // Attendi che Homebridge applichi la nuova configurazione e avvii il server
    setTimeout(loadState, 1500);
    whForm.reset();
  window.homebridge.toast.success('Webhook creato e salvato. Dopo l’aggiornamento apparirà in tabella.');
  });

  // Add Email trigger
  const emForm = document.getElementById('emAddForm');
  emForm && emForm.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    if (!isConfigured()) {
      return window.homebridge.toast.error('Plugin non configurato. Salva la configurazione di base prima.');
    }
    const name = document.getElementById('emName').value.trim();
    const imapHost = document.getElementById('emImapHost').value.trim();
    const imapUser = document.getElementById('emImapUser').value.trim();
    const imapPassword = document.getElementById('emImapPassword').value.trim();
    const subjectMatch = document.getElementById('emSubject').value.trim();
    const debounceSeconds = Number(document.getElementById('emDebounce').value || 0);
    const durationSeconds = Number(document.getElementById('emDuration').value || 10);
    if (!name || !imapHost || !imapUser || !imapPassword || !subjectMatch) {
      return window.homebridge.toast.error('Compila tutti i campi richiesti.');
    }
    const list = Array.isArray(pluginConfig.emailTriggers) ? pluginConfig.emailTriggers : [];
    if (list.some(e => String(e.name) === name)) {
      return window.homebridge.toast.error('Esiste già un trigger email con questo nome.');
    }
    list.push({ name, imapHost, imapPort: 993, imapTls: true, imapUser, imapPassword, subjectMatch, debounceSeconds, durationSeconds });
    pluginConfig.emailTriggers = list;
    await persistConfig({ save: false });
    await loadState();
    emForm.reset();
  });

  await loadPluginConfig();
  loadState();

  // Copy URL button
  const copyBtn = document.getElementById('copyOutputBtn');
  copyBtn && copyBtn.addEventListener('click', () => {
    const txt = document.getElementById('ephemeralContent')?.textContent || '';
    // Cerca una riga che inizi con http
    const match = txt.match(/https?:\/\/[^\s]+/);
    if (!match) {
      return window.homebridge.toast.error('Nessun URL copiabile trovato.');
    }
    navigator.clipboard.writeText(match[0]).then(() => {
      window.homebridge.toast.success('URL copiato negli appunti.');
    }).catch(e => {
      window.homebridge.toast.error('Copia fallita: ' + (e?.message || e));
    });
  });
});
