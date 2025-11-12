#!/usr/bin/env node
/**
 * Configuration checker for homebridge-unifi-protect-webhook
 * 
 * This script verifies if the plugin is properly configured in Homebridge config.json
 * 
 * Usage:
 *   node check-config.js [path-to-config.json]
 * 
 * If no path is provided, it will try to find config.json in standard locations.
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

const PLUGIN_NAME = 'homebridge-unifi-protect-webhook';
const PLATFORM_NAME = 'ProtectWebhookPlatform';

// ANSI colors
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

function log(msg, color = 'reset') {
  console.log(`${colors[color]}${msg}${colors.reset}`);
}

function findConfigPath() {
  const configArg = process.argv[2];
  if (configArg) {
    return path.resolve(configArg);
  }

  // Standard Homebridge config locations
  const locations = [
    path.join(os.homedir(), '.homebridge', 'config.json'),
    '/var/lib/homebridge/config.json',
    path.join(process.env.APPDATA || '', 'homebridge', 'config.json'),
  ];

  for (const loc of locations) {
    if (fs.existsSync(loc)) {
      return loc;
    }
  }

  return null;
}

function checkConfiguration() {
  log('\n═══════════════════════════════════════════════════', 'bright');
  log('  UniFi Protect Webhook - Configuration Checker', 'bright');
  log('═══════════════════════════════════════════════════\n', 'bright');

  // Find config.json
  const configPath = findConfigPath();
  if (!configPath) {
    log('❌ ERROR: Could not find Homebridge config.json', 'red');
    log('\nTried these locations:', 'yellow');
    log('  - ~/.homebridge/config.json');
    log('  - /var/lib/homebridge/config.json');
    log('  - %APPDATA%/homebridge/config.json');
    log('\nYou can specify a custom path: node check-config.js /path/to/config.json\n', 'yellow');
    process.exit(1);
  }

  log(`✓ Found config.json: ${configPath}`, 'green');

  // Read and parse config
  let config;
  try {
    const content = fs.readFileSync(configPath, 'utf8');
    config = JSON.parse(content);
    log('✓ config.json is valid JSON', 'green');
  } catch (err) {
    log(`❌ ERROR: Failed to parse config.json: ${err.message}`, 'red');
    process.exit(1);
  }

  // Check platforms array
  if (!config.platforms || !Array.isArray(config.platforms)) {
    log('❌ ERROR: No "platforms" array found in config.json', 'red');
    log('\nYour config.json should have a structure like:', 'yellow');
    log('{\n  "bridge": {...},\n  "platforms": [\n    {...}\n  ]\n}\n', 'yellow');
    process.exit(1);
  }

  log(`✓ Found ${config.platforms.length} platform(s) configured`, 'green');

  // Find our platform
  const ourPlatform = config.platforms.find(p => p.platform === PLATFORM_NAME);
  
  if (!ourPlatform) {
    log(`\n❌ ERROR: Platform "${PLATFORM_NAME}" not found in config.json`, 'red');
    log('\nThe plugin is installed but NOT configured!', 'yellow');
    log('\nTo fix this, add the following to your "platforms" array:\n', 'yellow');
    log('{\n  "platform": "ProtectWebhookPlatform",\n  "name": "UniFi Protect Webhook",\n  "port": 12050\n}\n', 'blue');
    log('See CONFIGURATION.md for detailed setup instructions.\n', 'yellow');
    process.exit(1);
  }

  log(`\n✓ Platform "${PLATFORM_NAME}" is configured!`, 'green');

  // Validate configuration
  log('\n📋 Current Configuration:', 'bright');
  log('─────────────────────────────────────────────────', 'bright');

  const warnings = [];
  const errors = [];

  // Check required fields
  if (!ourPlatform.name) {
    errors.push('Missing required field "name"');
  } else {
    log(`  Name: ${ourPlatform.name}`, 'blue');
  }

  // Check optional fields
  const port = ourPlatform.port || 12050;
  log(`  Port: ${port}${ourPlatform.port ? '' : ' (default)'}`, 'blue');

  const bindAddress = ourPlatform.bindAddress || '0.0.0.0';
  log(`  Bind Address: ${bindAddress}${ourPlatform.bindAddress ? '' : ' (default)'}`, 'blue');

  const enforceLocalOnly = ourPlatform.enforceLocalOnly !== false;
  log(`  Enforce Local Only: ${enforceLocalOnly}${ourPlatform.enforceLocalOnly === undefined ? ' (default)' : ''}`, 'blue');

  if (ourPlatform.adminSecret) {
    log(`  Admin Secret: SET ✓`, 'green');
  } else {
    warnings.push('adminSecret not set - admin endpoints will be accessible to anyone on local network');
    log(`  Admin Secret: NOT SET`, 'yellow');
  }

  const webhookCount = Array.isArray(ourPlatform.webhooks) ? ourPlatform.webhooks.length : 0;
  const emailCount = Array.isArray(ourPlatform.emailTriggers) ? ourPlatform.emailTriggers.length : 0;
  
  log(`  Webhooks: ${webhookCount}`, 'blue');
  log(`  Email Triggers: ${emailCount}`, 'blue');

  // Display warnings and errors
  if (errors.length > 0) {
    log('\n❌ Configuration Errors:', 'red');
    errors.forEach(err => log(`  - ${err}`, 'red'));
  }

  if (warnings.length > 0) {
    log('\n⚠️  Configuration Warnings:', 'yellow');
    warnings.forEach(warn => log(`  - ${warn}`, 'yellow'));
  }

  if (errors.length === 0 && warnings.length === 0) {
    log('\n✅ Configuration looks good!', 'green');
  }

  // Check plugin installation
  log('\n📦 Plugin Installation:', 'bright');
  log('─────────────────────────────────────────────────', 'bright');
  
  try {
    const packagePath = require.resolve(`${PLUGIN_NAME}/package.json`);
    const pkg = require(packagePath);
    log(`  ✓ Plugin installed: v${pkg.version}`, 'green');
    log(`  Location: ${path.dirname(packagePath)}`, 'blue');
  } catch (err) {
    log(`  ❌ Plugin NOT installed or not found in node path`, 'red');
    log(`  Install it with: npm install -g ${PLUGIN_NAME}`, 'yellow');
  }

  // Summary
  log('\n═══════════════════════════════════════════════════', 'bright');
  if (errors.length > 0) {
    log('❌ Configuration has ERRORS - plugin will NOT work', 'red');
    log('Fix the errors above and restart Homebridge.\n', 'yellow');
    process.exit(1);
  } else if (warnings.length > 0) {
    log('⚠️  Configuration OK but has warnings', 'yellow');
    log('Plugin should work, but consider addressing warnings.\n', 'yellow');
  } else {
    log('✅ Everything looks good!', 'green');
    log('If the plugin still doesn\'t work, check Homebridge logs.\n', 'green');
  }
}

// Run the checker
try {
  checkConfiguration();
} catch (err) {
  log(`\n❌ Unexpected error: ${err.message}`, 'red');
  console.error(err);
  process.exit(1);
}
