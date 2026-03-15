/**
 * PERSCOM Advance — Unit Configuration Loader
 * Reads unit.config.json from the backend root directory.
 * Edit unit.config.json to customize PERSCOM Advance for your unit.
 */

'use strict';

const path = require('path');
const fs = require('fs');

const CONFIG_PATH = path.join(__dirname, '../../unit.config.json');

const DEFAULTS = {
  unitName: 'My Milsim Unit',
  unitAbbreviation: 'MMU',
  unitLogo: '/uploads/logo.png',
  primaryColor: '#1e40af',
  accentColor: '#3b82f6',
  discordGuildId: '',
  discordBotToken: '',
  timezone: 'America/New_York',
  theme: 'dark',
  features: {
    operations: true,
    evaluations: true,
    orbat: true,
    documents: true,
    gearLoadouts: true,
    attendance: true,
    spotlights: true,
  },
  ranks: [],
  welcomeMessage: 'Welcome to PERSCOM Advance.',
};

let _config = null;

function loadConfig() {
  try {
    if (fs.existsSync(CONFIG_PATH)) {
      const raw = fs.readFileSync(CONFIG_PATH, 'utf-8');
      const parsed = JSON.parse(raw);
      _config = { ...DEFAULTS, ...parsed, features: { ...DEFAULTS.features, ...(parsed.features || {}) } };
    } else {
      console.warn('[PERSCOM Config] unit.config.json not found, using defaults.');
      _config = { ...DEFAULTS };
    }
  } catch (err) {
    console.error(`[PERSCOM Config] Failed to parse unit.config.json: ${err.message}. Using defaults.`);
    _config = { ...DEFAULTS };
  }
  return _config;
}

function getUnitConfig() {
  if (!_config) loadConfig();
  return _config;
}

function reloadConfig() {
  _config = null;
  return loadConfig();
}

// Load on module init
loadConfig();

module.exports = { getUnitConfig, reloadConfig };
