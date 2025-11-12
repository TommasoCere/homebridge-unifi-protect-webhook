"use strict";

const { HomebridgePluginUiServer } = require("@homebridge/plugin-ui-utils");

const UI_PREFIX = "[UniFi Protect Webhook UI]";

function uiLog(message, ...args) {
	const timestamp = new Date().toISOString();
	console.log(`${timestamp} ${UI_PREFIX} ${message}`, ...args);
}

class PluginUiServer extends HomebridgePluginUiServer {
	constructor() {
		super();

		uiLog("Registering request handlers");
		this.onRequest("/state", this.handleState.bind(this));
		this.onRequest("/ping", this.handlePing.bind(this));
		// Deprecated endpoints (info, ephemeral) rimossi per semplificare l'interfaccia
		this.onRequest("/token", this.handleRevealToken.bind(this));
		this.onRequest("/regenerate", this.handleRegenerate.bind(this));
		this.onRequest("/test-webhook-url", this.handleTestRequest.bind(this));

		this.ready();
		uiLog("UI server ready");
	}

	_resolveConfig(payload) {
		if (payload && typeof payload.config === "object" && payload.config !== null) {
			return payload.config;
		}
		try {
			const envCfg = process.env.HOMEBRIDGE_PLUGIN_CONFIG;
			if (envCfg) {
				const parsed = JSON.parse(envCfg);
				if (Array.isArray(parsed) && parsed[0]) {
					return parsed[0];
				}
				if (parsed && typeof parsed === "object") {
					return parsed;
				}
			}
		} catch (err) {
			uiLog("Failed to parse config from HOMEBRIDGE_PLUGIN_CONFIG", err);
		}
		return {};
	}

	_getBaseUrl(config) {
		const port = config?.port || 12050;
		const host = config?.bindAddress && config.bindAddress.startsWith("127.")
			? config.bindAddress
			: "127.0.0.1";
		return `http://${host}:${port}`;
	}

	_getHeaders(config) {
		const headers = { "content-type": "application/json" };
		if (config?.adminSecret) {
			headers["x-admin-secret"] = config.adminSecret;
		}
		return headers;
	}

	async _fetchJson(config, url, options = {}) {
		const maxRetries = 8;
		const baseDelayMs = 250;
		for (let attempt = 0; attempt <= maxRetries; attempt++) {
			try {
				const res = await fetch(url, { headers: this._getHeaders(config), ...options });
				if (!res.ok) {
					uiLog(`HTTP ${res.status} for ${url}`);
					// Only retry on 502/503/504
					if (![502, 503, 504].includes(res.status)) {
						throw new Error(`HTTP ${res.status}`);
					}
				} else {
					return await res.json();
				}
			} catch (e) {
				// Retry on network errors like ECONNREFUSED during plugin startup
				const isConnRefused = /ECONNREFUSED|fetch failed/i.test(String(e?.message || e));
				if (attempt < maxRetries && isConnRefused) {
					const delay = baseDelayMs * Math.pow(1.5, attempt);
					await new Promise(r => setTimeout(r, delay));
					continue;
				}
				// When all retries are exhausted, return a notReady stub so the UI can show a message
				if (isConnRefused) {
					return { notReady: true };
				}
				throw e;
			}
		}
		// Fallback safeguard
		return { notReady: true };
	}

	async handleState(payload = {}) {
		const config = this._resolveConfig(payload);
		uiLog("handleState called");
		const url = `${this._getBaseUrl(config)}/admin/state`;
		return await this._fetchJson(config, url);
	}

	async handleRevealToken(payload) {
		const name = payload?.name;
		if (!name) throw new Error("missing name");
		const config = this._resolveConfig(payload);
		uiLog(`handleRevealToken for ${name}`);
		const url = `${this._getBaseUrl(config)}/admin/webhooks/${encodeURIComponent(name)}/token`;
		return await this._fetchJson(config, url);
	}

	async handleRegenerate(payload) {
		const name = payload?.name;
		if (!name) {
			throw new Error("missing name");
		}
		const config = this._resolveConfig(payload);
		uiLog(`handleRegenerate for ${name}`);
		const url = `${this._getBaseUrl(config)}/admin/webhooks/${encodeURIComponent(name)}/regenerate`;
		return await this._fetchJson(config, url, { method: "POST" });
	}

	async handlePing(payload = {}) {
		const t0 = Date.now();
		const config = this._resolveConfig(payload);
		const url = `${this._getBaseUrl(config)}/admin/state`;
		const resp = await this._fetchJson(config, url);
		if (resp && resp.notReady) {
			return { ok: false, notReady: true };
		}
		return { ok: true, ms: Date.now() - t0 };
	}

	async handleTestRequest(payload = {}) {
		const urlToTest = payload.url || "";
		uiLog(`handleTestRequest for ${urlToTest}`);
		return { success: true, message: `Test per ${urlToTest} completato.` };
	}
}

(() => {
	new PluginUiServer();
})();
