"use strict";

// Homebridge platform plugin that exposes multiple local webhook endpoints and IMAP email triggers
// as HomeKit Motion Sensors. Includes security controls for local-network-only access and per-webhook tokens.

const { v4: uuidv4 } = require("uuid");
const createServer = require("./server");
const setupWebhooks = require("./webhooks");
const setupEmailTriggers = require("./email");

let hap; // set by Homebridge

const PLUGIN_NAME = "homebridge-unifi-protect-webhook";
const PLATFORM_NAME = "ProtectWebhookPlatform";

module.exports = (api) => {
	hap = api.hap;
	api.registerPlatform(PLUGIN_NAME, PLATFORM_NAME, ProtectWebhookPlatform);
};

class ProtectWebhookPlatform {
	constructor(log, config, api) {
		this.log = log;
		this.api = api;
		this.config = config || {};

		this.accessories = new Map(); // name -> accessory
		this.webhooks = Array.isArray(this.config.webhooks) ? this.config.webhooks : [];
		this.emailTriggers = Array.isArray(this.config.emailTriggers) ? this.config.emailTriggers : [];
		this.adminSecret = this.config.adminSecret || null; // optional secret for admin endpoints

		// Ephemeral tokens store: Map<webhookName, Array<{token, expiresAt}>>
		this._ephemeralTokens = new Map();

		// Security options
		this.bindAddress = this.config.bindAddress || "0.0.0.0"; // default: all interfaces (but we'll enforce local-only)
		this.port = this.config.port || 12050;
		this.enforceLocalOnly = this.config.enforceLocalOnly !== false; // default true

		// start once homebridge finished launching (so cached accessories are available)
		if (api) {
			this.api.on("didFinishLaunching", () => {
				try {
					this._initialize();
				} catch (e) {
					this.log.error("Initialization failed:", e);
				}
			});
		}
	}

	// Called for restored accessories from cache
	configureAccessory(accessory) {
		this.log.debug("Restoring accessory from cache:", accessory.displayName);
		this.accessories.set(accessory.context.key, accessory);
		// ensure service present
		const service = accessory.getService(hap.Service.MotionSensor) ||
			accessory.addService(hap.Service.MotionSensor, accessory.displayName);
		service.updateCharacteristic(hap.Characteristic.MotionDetected, false);
	}

	_initialize() {
		const { app, server } = createServer(this);
		this.app = app;
		this.server = server;
		setupWebhooks(this);
		setupEmailTriggers(this);
		this.log.info(`${PLUGIN_NAME} ready: ${this.webhooks.length} webhook(s), ${this.emailTriggers.length} email trigger(s)`);
	}



	_getOrCreateAccessory(key, displayName) {
		const uuid = this.api.hap.uuid.generate(`${PLATFORM_NAME}:${key}`);
		let accessory = this.accessories.get(key);
		if (accessory) {
			accessory.displayName = displayName;
		} else {
			accessory = new this.api.platformAccessory(displayName, uuid);
			accessory.context = { key };
			accessory.category = hap.Categories.SENSOR;
			accessory.addService(hap.Service.MotionSensor, displayName);
			this.api.registerPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [accessory]);
			this.log.info(`Registered accessory '${displayName}'`);
		}
		this.accessories.set(key, accessory);
		return accessory;
	}

	_triggerAccessory(name, accessory, durationMs) {
		const service = accessory.getService(hap.Service.MotionSensor);
		service.updateCharacteristic(hap.Characteristic.MotionDetected, true);
		if (accessory._resetTimer) clearTimeout(accessory._resetTimer);
		accessory._resetTimer = setTimeout(() => {
			service.updateCharacteristic(hap.Characteristic.MotionDetected, false);
		}, Math.max(0, durationMs || 10000));
		this.log.debug(`Accessory '${name}' set to ON for ${Math.max(0, durationMs || 10000)}ms`);
	}

	_matchSubject(subject, pattern) {
		if (!pattern) return false;
		try {
			const rx = new RegExp(pattern);
			return rx.test(subject);
		} catch (_) {
			return subject.includes(String(pattern));
		}
	}

	_getRemoteIp(req) {
		// Do not trust proxies by default
		const ip = (req.socket && req.socket.remoteAddress) || req.ip || "";
		// strip IPv6 prefix ::ffff:
		return ip.startsWith("::ffff:") ? ip.substring(7) : ip;
	}

	_isPrivateIp(ip) {
		// RFC1918 + loopback + link-local
		return (
			ip === "127.0.0.1" ||
			ip === "::1" ||
			ip.startsWith("10.") ||
			ip.startsWith("192.168.") ||
			/^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(ip) ||
			ip.startsWith("169.254.")
		);
	}

		_isLocalAdminRequest(req) {
			const ip = this._getRemoteIp(req);
			if (!this._isPrivateIp(ip)) return false;
			if (this.adminSecret) {
				const provided = req.get("x-admin-secret") || req.query.adminSecret;
				if (!provided || provided !== this.adminSecret) return false;
			}
			return true;
		}

	// Compose base URL for server, prefer Host header when available
	_serverBaseUrl(req) {
		let host = req?.headers?.host;
		if (!host || typeof host !== 'string' || host.trim().length === 0) {
			host = `${this.bindAddress}:${this.port}`;
		}
		return `http://${host}`;
	}

	_computeWebhookPath(wh) {
		let basePath = wh.path && wh.path.trim().length > 0 ? wh.path.trim() : `/wh/${encodeURIComponent(wh.name.toLowerCase().replace(/\s+/g, "-"))}`;
		if (!basePath.startsWith("/")) basePath = `/${basePath}`;
		if (!basePath.startsWith("/wh/")) {
			// enforce prefix
			const rest = basePath.startsWith("/") ? basePath.substring(1) : basePath;
			basePath = `/wh/${rest.replace(/^wh\/?/, "")}`;
		}
		return basePath;
	}

	_composeWebhookUrl(req, wh) {
		const base = this._serverBaseUrl(req);
		const path = this._computeWebhookPath(wh);
		let url = `${base}${path}`;
		if (wh.token) url += `?token=${encodeURIComponent(wh.token)}`;
		return url;
	}

	_redactUrl(url) {
		try {
			const u = new URL(url, 'http://localhost');
			const params = u.searchParams;
			const SENSITIVE = new Set(['token', 'adminSecret']);
			for (const key of Array.from(params.keys())) {
				if (SENSITIVE.has(key)) {
					params.set(key, 'REDACTED');
				}
			}
			const path = u.pathname + (params.toString() ? `?${params.toString()}` : '');
			return path;
		} catch (_) {
			return url;
		}
	}

	// Ephemeral token helpers
	_addEphemeralToken(name, token, ttlMs) {
		const now = Date.now();
		const expiresAt = now + Math.max(1000, ttlMs || 300000);
		const list = this._ephemeralTokens.get(name) || [];
		// prune old
		const fresh = list.filter((e) => e.expiresAt > now);
		fresh.push({ token, expiresAt });
		this._ephemeralTokens.set(name, fresh);
		return { token, expiresAt };
	}

	_isEphemeralTokenValid(name, token) {
		if (!token) return false;
		const now = Date.now();
		const list = this._ephemeralTokens.get(name);
		if (!Array.isArray(list) || list.length === 0) return false;
		const fresh = list.filter((e) => e.expiresAt > now);
		this._ephemeralTokens.set(name, fresh);
		return fresh.some((e) => e.token === token);
	}

	// Cleanup on shutdown
	async shutdown() {
		try { this.server && this.server.close(); } catch (_) {}
		for (const cfg of this.emailTriggers) {
			if (cfg._keepAliveTimer) clearInterval(cfg._keepAliveTimer);
			try { cfg._imap && cfg._imap.end(); } catch (_) {}
		}
	}
}
