"use strict";

const { PluginUiServer } = require("@homebridge/plugin-ui-utils");

const UI_PREFIX = "[UniFi Protect Webhook UI]";

function uiLog(message, ...args) {
	const timestamp = new Date().toISOString();
	console.log(`${timestamp} ${UI_PREFIX} ${message}`, ...args);
}

uiLog("═══════════════════════════════════════");
uiLog("UI Server module loading...");
uiLog("═══════════════════════════════════════");

class UiServer extends PluginUiServer {
	constructor() {
		uiLog("Constructor called");
		super();
		
		uiLog("Registering request handlers...");
		this.onRequest("/state", this.handleState.bind(this));
		this.onRequest("/info", this.handleInfo.bind(this));
		this.onRequest("/ephemeral", this.handleEphemeral.bind(this));
		this.onRequest("/regenerate", this.handleRegenerate.bind(this));
		
		uiLog("Calling ready()...");
		this.ready();
		uiLog("✓ UI Server ready!");
	}  getConfig() {
    const cfgArr = this.homebridge.getPluginConfig() || [];
    return cfgArr[0] || {};
  }

  getBaseUrl() {
    const cfg = this.getConfig();
    const port = cfg.port || 12050;
    // per chiamate locali dalla UI integriamo sempre su loopback
    return `http://127.0.0.1:${port}`;
  }

  getHeaders() {
    const cfg = this.getConfig();
    const headers = { "content-type": "application/json" };
    if (cfg.adminSecret) headers["x-admin-secret"] = cfg.adminSecret;
    return headers;
  }

  async handleState() {
    uiLog("handleState() called");
    const url = `${this.getBaseUrl()}/admin/state`;
    uiLog("Fetching from:", url);
    const res = await fetch(url, { headers: this.getHeaders() });
    if (!res.ok) {
      uiLog("State fetch failed:", res.status);
      throw new Error(`HTTP ${res.status}`);
    }
    uiLog("State fetched successfully");
    return await res.json();
  }

  async handleInfo(payload) {
    uiLog("handleInfo() called for:", payload?.name);
    const name = payload?.name;
    if (!name) throw new Error("missing name");
    const url = `${this.getBaseUrl()}/admin/webhooks/${encodeURIComponent(name)}/info`;
    const res = await fetch(url, { headers: this.getHeaders() });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  }

  async handleEphemeral(payload) {
    uiLog("handleEphemeral() called for:", payload?.name);
    const name = payload?.name;
    const ttl = Math.max(10, Math.min(3600, parseInt(payload?.ttl || 300)));
    if (!name) throw new Error("missing name");
    const url = `${this.getBaseUrl()}/admin/webhooks/${encodeURIComponent(name)}/ephemeral?ttl=${ttl}`;
    const res = await fetch(url, { method: "POST", headers: this.getHeaders() });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  }

  async handleRegenerate(payload) {
    uiLog("handleRegenerate() called for:", payload?.name);
    const name = payload?.name;
    if (!name) throw new Error("missing name");
    const url = `${this.getBaseUrl()}/admin/webhooks/${encodeURIComponent(name)}/regenerate`;
    const res = await fetch(url, { method: "POST", headers: this.getHeaders() });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  }
}

// Istanzia e avvia il server (pattern IIFE)
uiLog("About to instantiate UiServer...");
(() => {
  new UiServer();
})();
uiLog("✓ UI Server module execution complete");
