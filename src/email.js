"use strict";

const { ImapFlow } = require("imapflow");

module.exports = async function setupEmailTriggers(platform) {
	for (const cfg of platform.emailTriggers) {
		const key = `email:${cfg.name}`;
		const accessory = platform._getOrCreateAccessory(key, cfg.name);
		cfg._duration = Math.max(0, (cfg.durationSeconds || 10)) * 1000;
		cfg._debounce = Math.max(0, (cfg.debounceSeconds || 0)) * 1000;
		cfg._lastTrigger = 0;
		cfg._id = accessory.UUID;

		try {
			await startImapMonitor(platform, cfg, accessory);
			platform.log.info(`Email trigger '${cfg.name}' monitoring ${cfg.imapUser}@${cfg.imapHost}`);
		} catch (e) {
			platform.log.error(`Failed to start email trigger '${cfg.name}':`, e.message || e);
		}
	}
}

async function startImapMonitor(platform, cfg, accessory) {
	const client = new ImapFlow({
		host: cfg.imapHost,
		port: cfg.imapPort || 993,
		secure: cfg.imapTls !== false,
		auth: { user: cfg.imapUser, pass: cfg.imapPassword },
		logger: false,
		keepalive: { interval: 300000, idleInterval: 300000, forceNoop: true }
	});

	// prevent overlapping processing bursts
	cfg._processing = false;
	cfg._pending = false;

	const processUnseen = async () => {
		if (cfg._processing) {
			cfg._pending = true;
			return;
		}
		cfg._processing = true;
		try {
			const uids = await client.search({ seen: false }, { uid: true });
			if (!uids || uids.length === 0) return;

			const toMarkSeen = [];
			// Batch fetch envelopes for all unseen using generator
			for await (const msg of client.fetch(uids, { envelope: true }, { uid: true })) {
				const subject = msg?.envelope?.subject || "";
				const uid = msg.uid;
				if (!subject) {
					toMarkSeen.push(uid);
					continue;
				}
				if (matchSubject(subject, cfg.subjectMatch)) {
					const now = Date.now();
					if (cfg._debounce && now - cfg._lastTrigger < cfg._debounce) {
						platform.log.debug(`Email trigger '${cfg.name}' ignored by debounce`);
					} else {
						cfg._lastTrigger = now;
						platform._triggerAccessory(cfg.name, accessory, cfg._duration);
						platform.log.info(`Email trigger '${cfg.name}' fired (subject matched: "${subject}")`);
					}
				}
				toMarkSeen.push(uid);
			}

			// Batch mark as seen in chunks to avoid large commands
			for (let i = 0; i < toMarkSeen.length; i += 50) {
				const chunk = toMarkSeen.slice(i, i + 50);
				try { await client.messageFlagsAdd(chunk, ['\\Seen'], { uid: true }); } catch (_) {}
			}
		} catch (err) {
			platform.log.error(`Error processing new mail for '${cfg.name}':`, err.message || err);
		} finally {
			cfg._processing = false;
			if (cfg._pending) {
				cfg._pending = false;
				// process any new arrivals accumulated during processing
				setImmediate(() => processUnseen().catch(() => {}));
			}
		}
	};

	const connectAndListen = async () => {
		await client.connect();
		await client.mailboxOpen('INBOX');
		await processUnseen();
		client.on('exists', processUnseen);
		client.on('expunge', () => {});
	};

	client.on('error', (err) => {
		platform.log.warn(`IMAP error for '${cfg.name}':`, err?.message || err);
	});

	try {
		await connectAndListen();
	} catch (e) {
		platform.log.error(`Failed to start email trigger '${cfg.name}':`, e?.message || e);
		// retry later
		setTimeout(() => startImapMonitor(platform, cfg, accessory).catch(err => platform.log.error('IMAP reconnect failed', err)), 5000);
		return;
	}

	cfg._imap = client;
}

function matchSubject(subject, pattern) {
	if (!pattern) return false;
	try {
		const rx = new RegExp(pattern);
		return rx.test(subject);
	} catch (_) {
		return subject.includes(String(pattern));
	}
}
