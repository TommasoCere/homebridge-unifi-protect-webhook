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
		this.onRequest("/info", this.handleInfo.bind(this));
		this.onRequest("/ephemeral", this.handleEphemeral.bind(this));
		this.onRequest("/regenerate", this.handleRegenerate.bind(this));
		this.onRequest("/test-webhook-url", this.handleTestRequest.bind(this));

		this.ready();
		uiLog("UI server ready");
	}

	_getPluginConfig() {
		const cfgArr = this.homebridge.getPluginConfig() || [];
		return cfgArr[0] || {};
	}

	_getBaseUrl() {
		const cfg = this._getPluginConfig();
		const port = cfg.port || 12050;
		return `http://127.0.0.1:${port}`;
	}

	_getHeaders() {
		const cfg = this._getPluginConfig();
		const headers = { "content-type": "application/json" };
		if (cfg.adminSecret) {
			headers["x-admin-secret"] = cfg.adminSecret;
		}
		return headers;
	}

	async _fetchJson(url, options = {}) {
		const res = await fetch(url, { headers: this._getHeaders(), ...options });
		if (!res.ok) {
			uiLog(`HTTP ${res.status} for ${url}`);
			throw new Error(`HTTP ${res.status}`);
		}
		return await res.json();
	}

	async handleState() {
		uiLog("handleState called");
		return await this._fetchJson(`${this._getBaseUrl()}/admin/state`);
	}

	async handleInfo(payload) {
		const name = payload?.name;
		if (!name) {
			throw new Error("missing name");
		}
		uiLog(`handleInfo for ${name}`);
		const url = `${this._getBaseUrl()}/admin/webhooks/${encodeURIComponent(name)}/info`;
		return await this._fetchJson(url);
	}

	async handleEphemeral(payload) {
		const name = payload?.name;
		if (!name) {
			throw new Error("missing name");
		}
		const ttl = Math.max(10, Math.min(3600, parseInt(payload?.ttl || 300)));
		uiLog(`handleEphemeral for ${name} ttl=${ttl}`);
		const url = `${this._getBaseUrl()}/admin/webhooks/${encodeURIComponent(name)}/ephemeral?ttl=${ttl}`;
		return await this._fetchJson(url, { method: "POST" });
	}

	async handleRegenerate(payload) {
		const name = payload?.name;
		if (!name) {
			throw new Error("missing name");
		}
		uiLog(`handleRegenerate for ${name}`);
		const url = `${this._getBaseUrl()}/admin/webhooks/${encodeURIComponent(name)}/regenerate`;
		return await this._fetchJson(url, { method: "POST" });
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
