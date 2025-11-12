"use strict";

/**
 * Centralized logging module for homebridge-unifi-protect-webhook
 * Provides consistent logging with clear prefixes and diagnostic capabilities
 */

const PLUGIN_PREFIX = "[UniFi Protect Webhook]";

class Logger {
	constructor(homebridgeLog = null) {
		this.homebridgeLog = homebridgeLog;
		this.diagnosticMode = true; // Initially true for debugging startup issues
	}

	/**
	 * Enable/disable diagnostic verbose logging
	 */
	setDiagnosticMode(enabled) {
		this.diagnosticMode = enabled;
	}

	/**
	 * Module load diagnostics (always shown, uses console.log)
	 */
	module(message, ...args) {
		const timestamp = new Date().toISOString();
		console.log(`${timestamp} ${PLUGIN_PREFIX} [MODULE] ${message}`, ...args);
	}

	/**
	 * Diagnostic logs (shown only in diagnostic mode)
	 */
	diagnostic(message, ...args) {
		if (!this.diagnosticMode) return;
		const timestamp = new Date().toISOString();
		console.log(`${timestamp} ${PLUGIN_PREFIX} [DIAGNOSTIC] ${message}`, ...args);
		if (this.homebridgeLog) {
			this.homebridgeLog.debug(`[DIAGNOSTIC] ${message}`, ...args);
		}
	}

	/**
	 * Standard info logs
	 */
	info(message, ...args) {
		if (this.homebridgeLog) {
			this.homebridgeLog.info(message, ...args);
		} else {
			console.log(`${PLUGIN_PREFIX} [INFO] ${message}`, ...args);
		}
	}

	/**
	 * Warning logs
	 */
	warn(message, ...args) {
		if (this.homebridgeLog) {
			this.homebridgeLog.warn(message, ...args);
		} else {
			console.warn(`${PLUGIN_PREFIX} [WARN] ${message}`, ...args);
		}
	}

	/**
	 * Error logs (always shown)
	 */
	error(message, ...args) {
		const timestamp = new Date().toISOString();
		console.error(`${timestamp} ${PLUGIN_PREFIX} [ERROR] ${message}`, ...args);
		if (this.homebridgeLog) {
			this.homebridgeLog.error(message, ...args);
		}
	}

	/**
	 * Debug logs
	 */
	debug(message, ...args) {
		if (this.homebridgeLog) {
			this.homebridgeLog.debug(message, ...args);
		}
	}

	/**
	 * Success logs (info with special formatting)
	 */
	success(message, ...args) {
		this.info(`✓ ${message}`, ...args);
	}

	/**
	 * Configuration display helper
	 */
	logConfig(config) {
		this.diagnostic("Configuration received:");
		this.diagnostic("  Platform:", config.platform || "N/A");
		this.diagnostic("  Name:", config.name || "N/A");
		this.diagnostic("  Port:", config.port || "default");
		this.diagnostic("  Bind Address:", config.bindAddress || "default");
		this.diagnostic("  Admin Secret:", config.adminSecret ? "SET" : "NOT SET");
		this.diagnostic("  Webhooks:", Array.isArray(config.webhooks) ? config.webhooks.length : 0);
		this.diagnostic("  Email Triggers:", Array.isArray(config.emailTriggers) ? config.emailTriggers.length : 0);
	}

	/**
	 * Startup banner
	 */
	banner() {
		const lines = [
			"",
			"═══════════════════════════════════════════════════",
			"  UniFi Protect Webhook Plugin",
			"  Webhook & Email triggers → HomeKit Motion Sensors",
			"═══════════════════════════════════════════════════",
			""
		];
		lines.forEach(line => console.log(line));
	}
}

// Export singleton instance for module-level logging
const globalLogger = new Logger();

module.exports = Logger;
module.exports.global = globalLogger;
