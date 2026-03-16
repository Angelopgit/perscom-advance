'use strict';

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');
const fs = require('fs');

const { validateLicenseOnStartup, isLicenseValid, getLicenseInfo, licenseGate } = require('./middleware/licenseCheck');
const { getUnitConfig } = require('./config/unitConfig');
const { checkForUpdates } = require('./utils/updateChecker');
const { setupGuard } = require('./middleware/setupGuard');
const setupRoutes   = require('./routes/setup');

// ─── Ensure required directories exist ───────────────────────────────────────
const uploadsDir = path.join(__dirname, '../uploads');
const dataDir    = path.join(__dirname, '../data');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
if (!fs.existsSync(dataDir))    fs.mkdirSync(dataDir,    { recursive: true });

// ─── Database ─────────────────────────────────────────────────────────────────
const { initializeDatabase } = require('./config/database');

// ─── Routes ──────────────────────────────────────────────────────────────────
const authRoutes          = require('./routes/auth');
const personnelRoutes     = require('./routes/personnel');
const operationsRoutes    = require('./routes/operations');
const evaluationsRoutes   = require('./routes/evaluations');
const announcementsRoutes = require('./routes/announcements');
const dashboardRoutes     = require('./routes/dashboard');
const orbatRoutes         = require('./routes/orbat');
const activityRoutes      = require('./routes/activity');
const settingsRoutes      = require('./routes/settings');
const documentsRoutes     = require('./routes/documents');
const gearRoutes          = require('./routes/gear');
const usersRoutes         = require('./routes/users');
const attendanceRoutes    = require('./routes/attendance');
const spotlightsRoutes    = require('./routes/spotlights');
const ranksRoutes         = require('./routes/ranks');
const customizeRoutes     = require('./routes/customize');
const organizationRoutes  = require('./routes/organization');

const app = express();
const PORT = process.env.PORT || 3001;
const unitConfig = getUnitConfig();

// ─── CORS ────────────────────────────────────────────────────────────────────
// APP_DOMAIN must match exactly: include https:// but NO trailing slash
// e.g. APP_DOMAIN=https://yourdomain.com
const appDomain = process.env.APP_DOMAIN || '';
const allowedOrigins = process.env.NODE_ENV === 'production'
  ? [appDomain, appDomain.replace(/\/$/, '')].filter(Boolean)
  : [
      'http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173',
      // Allow the server's own origin so pages served by the backend
      // (e.g. setup wizard, admin panel) can call the API without CORS errors
      `http://localhost:${process.env.PORT || 3001}`,
      `http://127.0.0.1:${process.env.PORT || 3001}`,
      appDomain,
    ].filter(Boolean);

app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    cb(new Error(`CORS: origin ${origin} not allowed. Check APP_DOMAIN in .env`));
  },
  credentials: true,
}));

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// ─── Static Uploads ───────────────────────────────────────────────────────────
app.use('/uploads', express.static(uploadsDir));

// ─── First-Run Setup Guard ────────────────────────────────────────────────────
app.use(setupGuard);
app.use('/setup', setupRoutes);
app.use('/api/setup', setupRoutes);

// ─── Health Check (no license gate) ──────────────────────────────────────────
app.get('/api/health', (req, res) => {
  const info = getLicenseInfo();
  let version = '1.0.0';
  try { version = require('../package.json').version; } catch {}
  res.json({
    status: 'ok',
    version,
    licensed: isLicenseValid(),
    unit: info.unitName || unitConfig.unitName,
    environment: process.env.NODE_ENV,
  });
});

// ─── License Gate (all API routes below require a valid license) ──────────────
app.use('/api', licenseGate);

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use('/api/auth',          authRoutes);
app.use('/api/personnel',     personnelRoutes);
app.use('/api/operations',    operationsRoutes);
app.use('/api/evaluations',   evaluationsRoutes);
app.use('/api/announcements', announcementsRoutes);
app.use('/api/dashboard',     dashboardRoutes);
app.use('/api/orbat',         orbatRoutes);
app.use('/api/activity',      activityRoutes);
app.use('/api/settings',      settingsRoutes);
app.use('/api/documents',     documentsRoutes);
app.use('/api/gear',          gearRoutes);
app.use('/api/users',         usersRoutes);
app.use('/api/attendance',    attendanceRoutes);
app.use('/api/spotlights',    spotlightsRoutes);
app.use('/api/ranks',         ranksRoutes);
app.use('/api/customize',     customizeRoutes);
app.use('/api/organization',  organizationRoutes);

// ─── Admin Customization UI ───────────────────────────────────────────────────
app.get('/admin/customize', (req, res) => {
  res.sendFile(path.join(__dirname, 'customize/index.html'));
});

// ─── Frontend (Production) ────────────────────────────────────────────────────
if (process.env.NODE_ENV === 'production') {
  const frontendDist = path.join(__dirname, '../../frontend/dist');
  if (fs.existsSync(frontendDist)) {
    app.use(express.static(frontendDist));
    app.get('*', (req, res) => res.sendFile(path.join(frontendDist, 'index.html')));
  } else {
    console.warn('[PERSCOM] WARNING: frontend/dist not found. Run: cd ../frontend && npm run build');
  }
}

// ─── Global Error Handler ─────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('[PERSCOM Server Error]', err.message);
  res.status(500).json({ error: 'Internal server error', message: err.message });
});

// ─── Startup ──────────────────────────────────────────────────────────────────
async function start() {
  initializeDatabase();
  await validateLicenseOnStartup();
  checkForUpdates().catch(() => {});

  // Discord bot — optional, skipped if not configured
  if (unitConfig.discordBotToken || process.env.DISCORD_BOT_TOKEN) {
    try {
      const { startBot } = require('./bot/discord');
      startBot().catch((err) => console.warn('[PERSCOM Discord] Bot startup failed:', err.message));
    } catch (err) {
      console.warn('[PERSCOM Discord] Bot module not found — Discord integration skipped.');
    }
  }

  app.listen(PORT, () => {
    const cfg = getUnitConfig();
    let version = '1.0.0';
    try { version = require('../package.json').version; } catch {}
    console.log('');
    console.log('╔════════════════════════════════════════╗');
    console.log('║       PERSCOM Advance is running       ║');
    console.log('╚════════════════════════════════════════╝');
    console.log(`  Unit    : ${cfg.unitName} (${cfg.unitAbbreviation})`);
    console.log(`  Version : v${version}`);
    console.log(`  Port    : ${PORT}`);
    console.log(`  Mode    : ${process.env.NODE_ENV || 'development'}`);
    console.log(`  License : ${isLicenseValid() ? '✓ Valid' : '✗ Invalid — check PERSCOM_LICENSE_KEY in .env'}`);
    console.log('');
  });
}

start().catch((err) => {
  console.error('[PERSCOM] Fatal startup error:', err);
  process.exit(1);
});

module.exports = app;
