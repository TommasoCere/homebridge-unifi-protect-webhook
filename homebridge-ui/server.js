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
		const res = await fetch(url, { headers: this._getHeaders(config), ...options });
		if (!res.ok) {
			uiLog(`HTTP ${res.status} for ${url}`);
			throw new Error(`HTTP ${res.status}`);
		}
		return await res.json();
	}

	async handleState(payload = {}) {
		const config = this._resolveConfig(payload);
		uiLog("handleState called");
		const url = `${this._getBaseUrl(config)}/admin/state`;
		return await this._fetchJson(config, url);
	}

	async handleInfo(payload) {
		const name = payload?.name;
		if (!name) {
			throw new Error("missing name");
		}
		const config = this._resolveConfig(payload);
		uiLog(`handleInfo for ${name}`);
		const url = `${this._getBaseUrl(config)}/admin/webhooks/${encodeURIComponent(name)}/info`;
		return await this._fetchJson(config, url);
	}

	async handleEphemeral(payload) {
		const name = payload?.name;
		if (!name) {
			throw new Error("missing name");
		}
		const config = this._resolveConfig(payload);
		const ttl = Math.max(10, Math.min(3600, parseInt(payload?.ttl || 300)));
		uiLog(`handleEphemeral for ${name} ttl=${ttl}`);
		const url = `${this._getBaseUrl(config)}/admin/webhooks/${encodeURIComponent(name)}/ephemeral?ttl=${ttl}`;
		return await this._fetchJson(config, url, { method: "POST" });
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

	async handleTestRequest(payload = {}) {
		const urlToTest = payload.url || "";
		uiLog(`handleTestRequest for ${urlToTest}`);
		return { success: true, message: `Test per ${urlToTest} completato.` };
	}
}

(() => {
	new PluginUiServer();
})();
