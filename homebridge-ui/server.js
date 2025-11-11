"use strict";

const { PluginUiServer } = require("@homebridge/plugin-ui-utils");

class UiServer extends PluginUiServer {
  constructor() {
    super();

    this.onRequest("/state", this.handleState.bind(this));
    this.onRequest("/info", this.handleInfo.bind(this));
    this.onRequest("/ephemeral", this.handleEphemeral.bind(this));
    this.onRequest("/regenerate", this.handleRegenerate.bind(this));

    this.ready();
  }

  getConfig() {
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
    const url = `${this.getBaseUrl()}/admin/ui/state`;
    const res = await fetch(url, { headers: this.getHeaders() });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  }

  async handleInfo(payload) {
    const name = payload?.name;
    if (!name) throw new Error("missing name");
    const url = `${this.getBaseUrl()}/admin/webhooks/${encodeURIComponent(name)}/info`;
    const res = await fetch(url, { headers: this.getHeaders() });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  }

  async handleEphemeral(payload) {
    const name = payload?.name;
    const ttl = Math.max(10, Math.min(3600, parseInt(payload?.ttl || 300)));
    if (!name) throw new Error("missing name");
    const url = `${this.getBaseUrl()}/admin/webhooks/${encodeURIComponent(name)}/ephemeral?ttl=${ttl}`;
    const res = await fetch(url, { method: "POST", headers: this.getHeaders() });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  }

  async handleRegenerate(payload) {
    const name = payload?.name;
    if (!name) throw new Error("missing name");
    const url = `${this.getBaseUrl()}/admin/webhooks/${encodeURIComponent(name)}/regenerate`;
    const res = await fetch(url, { method: "POST", headers: this.getHeaders() });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  }
}

module.exports = UiServer;
