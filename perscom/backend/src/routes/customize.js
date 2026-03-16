'use strict';

const express = require('express');
const router  = express.Router();
const path    = require('path');
const fs      = require('fs');
const multer  = require('multer');

const UNIT_CONFIG_PATH = path.join(__dirname, '../../unit.config.json');
const BG_DIR = path.join(__dirname, '../../uploads/backgrounds');

if (!fs.existsSync(BG_DIR)) fs.mkdirSync(BG_DIR, { recursive: true });

// ── Multer — background image upload (accepts pre-compressed from client) ─────
const bgStorage = multer.diskStorage({
  destination: BG_DIR,
  filename: (req, file, cb) => {
    const type = req.params.type || 'bg';
    const ext  = path.extname(file.originalname).toLowerCase() || '.jpg';
    cb(null, `${type}${ext}`);
  },
});
const bgUpload = multer({
  storage: bgStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (/image\/(jpeg|png|webp)/.test(file.mimetype)) cb(null, true);
    else cb(new Error('Only JPEG, PNG, or WebP images are allowed.'));
  },
});

// ── Helpers ───────────────────────────────────────────────────────────────────
function readConfig() {
  try { return JSON.parse(fs.readFileSync(UNIT_CONFIG_PATH, 'utf8')); } catch { return {}; }
}
function writeConfig(data) {
  fs.writeFileSync(UNIT_CONFIG_PATH, JSON.stringify(data, null, 2));
}

// ── GET /api/customize — full theme config ────────────────────────────────────
router.get('/', (req, res) => {
  const cfg = readConfig();
  res.json({
    primaryColor:      cfg.primaryColor      || '#1e40af',
    accentColor:       cfg.accentColor       || '#3b82f6',
    sidebarColor:      cfg.sidebarColor      || '#080e1a',
    navbarColor:       cfg.navbarColor       || '#080e1a',
    cardColor:         cfg.cardColor         || '#0d1525',
    textColor:         cfg.textColor         || '#c8d8e8',
    dangerColor:       cfg.dangerColor       || '#ef4444',
    successColor:      cfg.successColor      || '#22c55e',
    theme:             cfg.theme             || 'dark',
    loginBackground:   cfg.loginBackground   || null,
    appBackground:     cfg.appBackground     || null,
    loginOverlayOpacity: cfg.loginOverlayOpacity ?? 0.6,
    appBackgroundBlur:   cfg.appBackgroundBlur   ?? 0,
    customCSS:         cfg.customCSS         || '',
  });
});

// ── POST /api/customize/theme — save color theme ──────────────────────────────
router.post('/theme', (req, res) => {
  const allowed = ['primaryColor','accentColor','sidebarColor','navbarColor','cardColor',
                   'textColor','dangerColor','successColor','theme',
                   'loginOverlayOpacity','appBackgroundBlur','customCSS'];
  const cfg = readConfig();
  for (const key of allowed) {
    if (req.body[key] !== undefined) cfg[key] = req.body[key];
  }
  writeConfig(cfg);
  res.json({ success: true });
});

// ── POST /api/customize/background/:type — upload image ──────────────────────
// :type = login | app
router.post('/background/:type', (req, res, next) => {
  const { type } = req.params;
  if (!['login','app'].includes(type)) return res.status(400).json({ error: 'Invalid background type.' });
  bgUpload.single('image')(req, res, (err) => {
    if (err) return res.status(400).json({ error: err.message });
    if (!req.file) return res.status(400).json({ error: 'No image provided.' });

    const configKey = type === 'login' ? 'loginBackground' : 'appBackground';
    const publicPath = `/uploads/backgrounds/${req.file.filename}`;
    const cfg = readConfig();
    cfg[configKey] = publicPath;
    writeConfig(cfg);
    res.json({ success: true, path: publicPath });
  });
});

// ── DELETE /api/customize/background/:type ────────────────────────────────────
router.delete('/background/:type', (req, res) => {
  const { type } = req.params;
  const configKey = type === 'login' ? 'loginBackground' : 'appBackground';
  const cfg = readConfig();
  const existing = cfg[configKey];
  if (existing) {
    const filePath = path.join(__dirname, '../../', existing.replace(/^\//, ''));
    try { fs.unlinkSync(filePath); } catch {}
  }
  cfg[configKey] = null;
  writeConfig(cfg);
  res.json({ success: true });
});

module.exports = router;
