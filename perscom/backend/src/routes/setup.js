'use strict';

const express = require('express');
const router  = express.Router();
const path    = require('path');
const fs      = require('fs');

const SETUP_STATE_PATH = path.join(__dirname, '../../data/setup.json');
const ENV_PATH         = path.join(__dirname, '../../.env');
const UNIT_CONFIG_PATH = path.join(__dirname, '../../unit.config.json');

// ── Helpers ───────────────────────────────────────────────────────────────────
function getSetupState() {
  try {
    return JSON.parse(fs.readFileSync(SETUP_STATE_PATH, 'utf8'));
  } catch {
    return { complete: false, step: 0 };
  }
}

function saveSetupState(state) {
  const dataDir = path.dirname(SETUP_STATE_PATH);
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  fs.writeFileSync(SETUP_STATE_PATH, JSON.stringify(state, null, 2));
}

function setEnvValue(key, value) {
  let content = '';
  try { content = fs.readFileSync(ENV_PATH, 'utf8'); } catch { return; }
  const escaped = value.replace(/[&|\\$`"]/g, '\\$&');
  if (new RegExp(`^${key}=`, 'm').test(content)) {
    content = content.replace(new RegExp(`^${key}=.*`, 'm'), `${key}=${value}`);
  } else {
    content += `\n${key}=${value}`;
  }
  fs.writeFileSync(ENV_PATH, content);
}

// ── GET /setup — serve wizard HTML ───────────────────────────────────────────
router.get('/', (req, res) => {
  const wizardPath = path.join(__dirname, '../setup/wizard.html');
  if (fs.existsSync(wizardPath)) {
    res.sendFile(wizardPath);
  } else {
    res.status(500).send('Setup wizard not found.');
  }
});

// ── GET /api/setup/status ──────────────────────────────────────────────────
router.get('/status', (req, res) => {
  const state = getSetupState();
  res.json(state);
});

// ── POST /api/setup/validate-license ─────────────────────────────────────────
router.post('/validate-license', async (req, res) => {
  const { licenseKey } = req.body;
  if (!licenseKey || !/^PCMA-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(licenseKey)) {
    return res.json({ valid: false, message: 'Invalid license key format. Expected: PCMA-XXXX-XXXX-XXXX-XXXX' });
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const response = await fetch('https://license.perscomadvance.com/api/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'User-Agent': 'PERSCOM-Advance-Setup/1.0' },
      body: JSON.stringify({ licenseKey, domain: req.hostname }),
      signal: controller.signal,
    });
    clearTimeout(timeout);
    const data = await response.json();
    if (data.valid) {
      // Save to state so we know which step completed
      const state = getSetupState();
      saveSetupState({ ...state, step: Math.max(state.step || 0, 1), licenseKey });
      return res.json({ valid: true, message: 'License validated successfully.' });
    }
    return res.json({ valid: false, message: data.message || 'License key is invalid or expired.' });
  } catch {
    // License server unreachable — allow setup to proceed with warning
    const state = getSetupState();
    saveSetupState({ ...state, step: Math.max(state.step || 0, 1), licenseKey });
    return res.json({
      valid: true,
      warning: 'Could not reach the license server right now. Key saved — it will be validated on first startup.',
      message: 'License key saved.'
    });
  }
});

// ── POST /api/setup/configure-unit ───────────────────────────────────────────
router.post('/configure-unit', (req, res) => {
  const { unitName, unitAbbreviation, primaryColor, accentColor, welcomeMessage, timezone } = req.body;
  if (!unitName || !unitAbbreviation) {
    return res.status(400).json({ success: false, message: 'Unit name and abbreviation are required.' });
  }

  try {
    let config = {};
    try { config = JSON.parse(fs.readFileSync(UNIT_CONFIG_PATH, 'utf8')); } catch {}
    const updated = {
      ...config,
      unitName:       unitName.trim(),
      unitAbbreviation: unitAbbreviation.trim().toUpperCase(),
      primaryColor:   primaryColor   || config.primaryColor   || '#1e40af',
      accentColor:    accentColor    || config.accentColor    || '#3b82f6',
      welcomeMessage: welcomeMessage || config.welcomeMessage || 'Welcome to PERSCOM. Please log in to continue.',
      timezone:       timezone       || config.timezone       || 'America/New_York',
    };
    fs.writeFileSync(UNIT_CONFIG_PATH, JSON.stringify(updated, null, 2));

    const state = getSetupState();
    saveSetupState({ ...state, step: Math.max(state.step || 0, 2) });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── POST /api/setup/test-discord ─────────────────────────────────────────────
router.post('/test-discord', async (req, res) => {
  const { discordBotToken, discordGuildId } = req.body;
  if (!discordBotToken) return res.json({ success: false, message: 'Bot token is required.' });

  try {
    const controller = new AbortController();
    setTimeout(() => controller.abort(), 6000);
    const r = await fetch('https://discord.com/api/v10/users/@me', {
      headers: { Authorization: `Bot ${discordBotToken}` },
      signal: controller.signal,
    });
    if (!r.ok) return res.json({ success: false, message: 'Invalid bot token — Discord rejected it.' });
    const botData = await r.json();

    let guildName = null;
    if (discordGuildId) {
      const gr = await fetch(`https://discord.com/api/v10/guilds/${discordGuildId}`, {
        headers: { Authorization: `Bot ${discordBotToken}` },
      });
      if (gr.ok) {
        const gd = await gr.json();
        guildName = gd.name;
      }
    }

    // Save Discord config
    let config = {};
    try { config = JSON.parse(fs.readFileSync(UNIT_CONFIG_PATH, 'utf8')); } catch {}
    fs.writeFileSync(UNIT_CONFIG_PATH, JSON.stringify({
      ...config,
      discordBotToken,
      discordGuildId: discordGuildId || config.discordGuildId || '',
    }, null, 2));

    res.json({
      success:   true,
      botName:   botData.username,
      guildName: guildName || null,
      message:   `Connected as ${botData.username}${guildName ? ` — Guild: ${guildName}` : ''}`,
    });
  } catch (err) {
    res.json({ success: false, message: 'Could not connect. Check the token and try again.' });
  }
});

// ── POST /api/setup/complete ──────────────────────────────────────────────────
router.post('/complete', (req, res) => {
  const state = getSetupState();
  // Write license key to .env if we have it
  if (state.licenseKey) {
    setEnvValue('PERSCOM_LICENSE_KEY', state.licenseKey);
    process.env.PERSCOM_LICENSE_KEY = state.licenseKey;
  }
  saveSetupState({ ...state, complete: true, completedAt: new Date().toISOString() });
  res.json({ success: true });
});

module.exports = router;
module.exports.getSetupState = getSetupState;
