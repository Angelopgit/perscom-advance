'use strict';

const path = require('path');
const fs   = require('fs');

const SETUP_STATE_PATH = path.join(__dirname, '../../data/setup.json');

function isSetupComplete() {
  try {
    const state = JSON.parse(fs.readFileSync(SETUP_STATE_PATH, 'utf8'));
    return state.complete === true;
  } catch {
    return false;
  }
}

/**
 * setupGuard — redirects all browser requests to /setup if first-run setup
 * has not been completed.
 *
 * Bypass rules:
 *  - /setup and /api/setup/* always allowed (the wizard itself)
 *  - /api/health always allowed
 *  - All other /api/* routes blocked with a JSON error
 *  - All other routes redirect to /setup
 */
function setupGuard(req, res, next) {
  if (isSetupComplete()) return next();

  const url = req.path;

  // Always allow the setup wizard and its API routes
  if (url === '/setup' || url.startsWith('/setup/') ||
      url.startsWith('/api/setup')) return next();

  // Always allow health check
  if (url === '/api/health') return next();

  // Block other API routes with JSON
  if (url.startsWith('/api/')) {
    return res.status(503).json({
      error:   'setup_required',
      message: 'PERSCOM has not been set up yet. Please complete setup at /setup',
    });
  }

  // Redirect browser requests to setup wizard
  res.redirect('/setup');
}

module.exports = { setupGuard, isSetupComplete };
