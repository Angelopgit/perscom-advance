/**
 * PERSCOM Advance — License Validation Middleware
 * Validates subscription license against the PERSCOM Advance license server.
 * License keys are issued at https://perscomadvance.com after subscribing.
 */

'use strict';

const LICENSE_SERVER_URL = 'https://license.perscomadvance.com';
const VALIDATION_INTERVAL_MS = 24 * 60 * 60 * 1000; // 24 hours
const GRACE_PERIOD_MS = 72 * 60 * 60 * 1000;         // 72-hour grace if server unreachable
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 3000;

let licenseState = {
  valid: false,
  unitName: null,
  expiresAt: null,
  plan: null,
  lastChecked: null,
  lastSuccessfulCheck: null,
  error: null,
};

// ─── Helpers ────────────────────────────────────────────────────────────────

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchWithRetry(url, options, retries = MAX_RETRIES) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000); // 10s timeout
      const res = await fetch(url, { ...options, signal: controller.signal });
      clearTimeout(timeout);
      return res;
    } catch (err) {
      if (attempt === retries) throw err;
      console.warn(`[PERSCOM License] Attempt ${attempt}/${retries} failed: ${err.message}. Retrying...`);
      await sleep(RETRY_DELAY_MS * attempt);
    }
  }
}

// ─── Core Validation ────────────────────────────────────────────────────────

async function performValidation() {
  const key = process.env.PERSCOM_LICENSE_KEY;
  const domain = process.env.APP_DOMAIN || 'unknown';

  if (!key) {
    licenseState = {
      ...licenseState,
      valid: false,
      error: 'PERSCOM_LICENSE_KEY is not set in environment variables.',
      lastChecked: new Date().toISOString(),
    };
    return licenseState;
  }

  try {
    const res = await fetchWithRetry(`${LICENSE_SERVER_URL}/api/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key, domain }),
    });

    const data = await res.json();

    licenseState = {
      valid: data.valid === true,
      unitName: data.unitName || null,
      expiresAt: data.expiresAt || null,
      plan: data.plan || null,
      lastChecked: new Date().toISOString(),
      lastSuccessfulCheck: new Date().toISOString(),
      error: data.valid ? null : (data.reason || 'License invalid'),
    };

    if (data.valid) {
      console.log(`[PERSCOM License] ✓ License valid for "${data.unitName}" — expires ${data.expiresAt} (${data.plan} plan)`);
    } else {
      console.error(`[PERSCOM License] ✗ License invalid: ${data.reason}`);
    }
  } catch (err) {
    // License server unreachable — apply grace period logic
    const lastSuccess = licenseState.lastSuccessfulCheck;
    const withinGrace = lastSuccess && (Date.now() - new Date(lastSuccess).getTime()) < GRACE_PERIOD_MS;

    licenseState = {
      ...licenseState,
      valid: withinGrace ? licenseState.valid : false,
      lastChecked: new Date().toISOString(),
      error: `License server unreachable: ${err.message}. ${withinGrace ? `Grace period active (last validated: ${lastSuccess})` : 'Grace period expired.'}`,
    };

    if (withinGrace) {
      console.warn(`[PERSCOM License] ⚠ License server unreachable. Using cached validation (grace period active).`);
    } else {
      console.error(`[PERSCOM License] ✗ License server unreachable and grace period expired. License invalidated.`);
    }
  }

  return licenseState;
}

// ─── Public API ─────────────────────────────────────────────────────────────

/**
 * Call once at server startup. Validates license and starts 24-hour refresh cycle.
 */
async function validateLicenseOnStartup() {
  console.log('[PERSCOM License] Validating license key...');
  await performValidation();

  // Schedule periodic re-validation
  setInterval(async () => {
    console.log('[PERSCOM License] Running scheduled license re-validation...');
    await performValidation();
  }, VALIDATION_INTERVAL_MS);
}

function isLicenseValid() {
  return licenseState.valid === true;
}

function getLicenseInfo() {
  return { ...licenseState };
}

/**
 * Express middleware — blocks API access if license is invalid.
 * Apply to all API routes except /api/health.
 */
function licenseGate(req, res, next) {
  if (!isLicenseValid()) {
    return res.status(403).json({
      error: 'license_invalid',
      message: 'Your PERSCOM Advance license is invalid or expired. Please renew your subscription at https://perscomadvance.com',
      details: licenseState.error,
    });
  }
  next();
}

module.exports = { validateLicenseOnStartup, isLicenseValid, getLicenseInfo, licenseGate };
