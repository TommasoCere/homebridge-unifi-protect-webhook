"use strict";

const { HomebridgePluginUiServer } = require("@homebridge/plugin-ui-utils");

class PluginUiServer extends HomebridgePluginUiServer {
	constructor() {
		super();

		this.onRequest("/test-webhook-url", this.handleTestRequest.bind(this));

		this.ready();
	}

	async handleTestRequest(payload = {}) {
		try {
			const urlToTest = payload.url || "";
			console.log(`Test richiesto per l'URL: ${urlToTest}`);
			return { success: true, message: `Test per ${urlToTest} completato.` };
		} catch (error) {
			return { success: false, message: error.message };
		}
	}
}

(() => {
	return new PluginUiServer();
})();
