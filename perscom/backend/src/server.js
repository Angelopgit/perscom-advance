'use strict';

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');

const { validateLicenseOnStartup, isLicenseValid, getLicenseInfo, licenseGate } = require('./middleware/licenseCheck');
const { getUnitConfig } = require('./config/unitConfig');
const { initializeDatabase } = require('./config/database');
const { checkForUpdates } = require('./utils/updateChecker');

// ─── Routes ──────────────────────────────────────────────────────────────────
const authRoutes         = require('./routes/auth');
const personnelRoutes    = require('./routes/personnel');
const operationsRoutes   = require('./routes/operations');
const evaluationsRoutes  = require('./routes/evaluations');
const announcementsRoutes = require('./routes/announcements');
const dashboardRoutes    = require('./routes/dashboard');
const orbatRoutes        = require('./routes/orbat');
const activityRoutes     = require('./routes/activity');
const settingsRoutes     = require('./routes/settings');
const documentsRoutes    = require('./routes/documents');
const gearRoutes         = require('./routes/gear');
const usersRoutes        = require('./routes/users');
const attendanceRoutes   = require('./routes/attendance');
const spotlightsRoutes   = require('./routes/spotlights');
const ranksRoutes        = require('./routes/ranks');

const app = express();
const PORT = process.env.PORT || 3001;
const unitConfig = getUnitConfig();

// ─── CORS ────────────────────────────────────────────────────────────────────
const allowedOrigins = process.env.NODE_ENV === 'production'
  ? [process.env.APP_DOMAIN].filter(Boolean)
  : ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173'];

app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    cb(new Error(`CORS: origin ${origin} not allowed`));
  },
  credentials: true,
}));

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ─── Static Uploads ───────────────────────────────────────────────────────────
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// ─── Health Check (no license gate) ──────────────────────────────────────────
app.get('/api/health', (req, res) => {
  const info = getLicenseInfo();
  res.json({
    status: 'ok',
    version: require('../../package.json').version,
    licensed: isLicenseValid(),
    unit: info.unitName || unitConfig.unitName,
    environment: process.env.NODE_ENV,
  });
});

// ─── License Gate (all API routes below this require a valid license) ─────────
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

// ─── Frontend (Production) ────────────────────────────────────────────────────
if (process.env.NODE_ENV === 'production') {
  const frontendDist = path.join(__dirname, '../../frontend/dist');
  app.use(express.static(frontendDist));
  app.get('*', (req, res) => {
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
}

// ─── Global Error Handler ─────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('[PERSCOM Server Error]', err.message);
  res.status(500).json({ error: 'Internal server error', message: err.message });
});

// ─── Startup ──────────────────────────────────────────────────────────────────
async function start() {
  // Initialize database
  initializeDatabase();

  // Validate license (non-blocking startup but gate will reject requests if invalid)
  await validateLicenseOnStartup();

  // Check for available updates (non-blocking)
  checkForUpdates().catch(() => {});

  // Start Discord bot asynchronously (does not block startup)
  try {
    const { startBot } = require('./bot/discord');
    startBot().catch((err) => console.warn('[PERSCOM Discord] Bot startup failed:', err.message));
  } catch {
    // Discord bot module not configured — skip
  }

  app.listen(PORT, () => {
    const cfg = getUnitConfig();
    console.log('');
    console.log('╔════════════════════════════════════════╗');
    console.log('║       PERSCOM Advance is running       ║');
    console.log('╚════════════════════════════════════════╝');
    console.log(`  Unit    : ${cfg.unitName} (${cfg.unitAbbreviation})`);
    console.log(`  Port    : ${PORT}`);
    console.log(`  Mode    : ${process.env.NODE_ENV}`);
    console.log(`  License : ${isLicenseValid() ? '✓ Valid' : '✗ Invalid'}`);
    console.log('');
  });
}

start().catch((err) => {
  console.error('[PERSCOM] Fatal startup error:', err);
  process.exit(1);
});

module.exports = app;
