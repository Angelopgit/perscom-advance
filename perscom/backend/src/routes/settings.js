'use strict';

const express = require('express');
const router = express.Router();
const { getUnitConfig, reloadConfig } = require('../config/unitConfig');
const { verifyToken, requireAdmin } = require('../middleware/auth');

// GET /api/settings/unit-config — public, returns safe config for frontend
router.get('/unit-config', (req, res) => {
  const config = getUnitConfig();
  // Return only safe, non-sensitive fields
  res.json({
    unitName: config.unitName,
    unitAbbreviation: config.unitAbbreviation,
    unitLogo: config.unitLogo,
    primaryColor: config.primaryColor,
    accentColor: config.accentColor,
    timezone: config.timezone,
    theme: config.theme,
    features: config.features,
    welcomeMessage: config.welcomeMessage,
  });
});

// POST /api/settings/reload-config — admin only, reloads unit.config.json without restart
router.post('/reload-config', verifyToken, requireAdmin, (req, res) => {
  try {
    const config = reloadConfig();
    res.json({ success: true, config });
  } catch (err) {
    res.status(500).json({ error: 'Failed to reload config', message: err.message });
  }
});

module.exports = router;
