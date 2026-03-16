'use strict';

const express = require('express');
const router  = express.Router();
const multer  = require('multer');
const path    = require('path');
const fs      = require('fs');
const { getDb } = require('../config/database');

const RANKS_ICON_DIR = path.join(__dirname, '../../uploads/ranks');
if (!fs.existsSync(RANKS_ICON_DIR)) fs.mkdirSync(RANKS_ICON_DIR, { recursive: true });

// ── Multer — rank icon upload (accepts client-side pre-resized image) ─────────
const iconStorage = multer.diskStorage({
  destination: RANKS_ICON_DIR,
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.png';
    cb(null, `rank_${req.params.id}_${Date.now()}${ext}`);
  },
});
const iconUpload = multer({
  storage: iconStorage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (/image\/(jpeg|png|webp|gif)/.test(file.mimetype)) cb(null, true);
    else cb(new Error('Only JPEG, PNG, WebP, or GIF images are allowed.'));
  },
});

// ── GET /api/ranks ─────────────────────────────────────────────────────────────
router.get('/', (req, res) => {
  res.json(getDb().prepare('SELECT * FROM ranks ORDER BY sort_order, tier, id').all());
});

// ── GET /api/ranks/:id ─────────────────────────────────────────────────────────
router.get('/:id', (req, res) => {
  const rank = getDb().prepare('SELECT * FROM ranks WHERE id=?').get(req.params.id);
  if (!rank) return res.status(404).json({ error: 'Rank not found.' });
  res.json(rank);
});

// ── POST /api/ranks ────────────────────────────────────────────────────────────
router.post('/', (req, res) => {
  const { name, abbreviation = '', grade = '', tier = 0 } = req.body;
  if (!name) return res.status(400).json({ error: 'Name is required.' });
  const db = getDb();
  const maxOrder = db.prepare('SELECT MAX(sort_order) as m FROM ranks').get().m || 0;
  const result = db.prepare(
    'INSERT INTO ranks (name, abbreviation, grade, tier, sort_order) VALUES (?,?,?,?,?)'
  ).run(name.trim(), abbreviation, grade, tier, maxOrder + 1);
  res.status(201).json({ id: result.lastInsertRowid });
});

// ── PUT /api/ranks/:id ─────────────────────────────────────────────────────────
router.put('/:id', (req, res) => {
  const { name, abbreviation, grade, tier, sort_order } = req.body;
  const db = getDb();
  const existing = db.prepare('SELECT id FROM ranks WHERE id=?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Not found.' });
  db.prepare('UPDATE ranks SET name=COALESCE(?,name), abbreviation=COALESCE(?,abbreviation), grade=COALESCE(?,grade), tier=COALESCE(?,tier), sort_order=COALESCE(?,sort_order) WHERE id=?')
    .run(name || null, abbreviation ?? null, grade ?? null, tier ?? null, sort_order ?? null, req.params.id);
  res.json({ success: true });
});

// ── DELETE /api/ranks/:id ──────────────────────────────────────────────────────
router.delete('/:id', (req, res) => {
  const db = getDb();
  const rank = db.prepare('SELECT icon_path FROM ranks WHERE id=?').get(req.params.id);
  if (!rank) return res.status(404).json({ error: 'Not found.' });
  if (rank.icon_path) {
    const abs = path.join(__dirname, '../../', rank.icon_path.replace(/^\//, ''));
    try { fs.unlinkSync(abs); } catch {}
  }
  db.prepare('DELETE FROM ranks WHERE id=?').run(req.params.id);
  res.json({ success: true });
});

// ── POST /api/ranks/:id/icon — upload rank icon ────────────────────────────────
// Client should pre-resize to max 128×128 using Canvas API before sending.
router.post('/:id/icon', (req, res) => {
  iconUpload.single('icon')(req, res, (err) => {
    if (err) return res.status(400).json({ error: err.message });
    if (!req.file) return res.status(400).json({ error: 'No image provided.' });

    const db = getDb();
    const rank = db.prepare('SELECT icon_path FROM ranks WHERE id=?').get(req.params.id);
    if (!rank) {
      fs.unlinkSync(req.file.path);
      return res.status(404).json({ error: 'Rank not found.' });
    }

    // Remove old icon
    if (rank.icon_path) {
      const abs = path.join(__dirname, '../../', rank.icon_path.replace(/^\//, ''));
      try { fs.unlinkSync(abs); } catch {}
    }

    const publicPath = `/uploads/ranks/${req.file.filename}`;
    db.prepare('UPDATE ranks SET icon_path=? WHERE id=?').run(publicPath, req.params.id);
    res.json({ success: true, icon_path: publicPath });
  });
});

// ── DELETE /api/ranks/:id/icon — remove rank icon ─────────────────────────────
router.delete('/:id/icon', (req, res) => {
  const db = getDb();
  const rank = db.prepare('SELECT icon_path FROM ranks WHERE id=?').get(req.params.id);
  if (!rank) return res.status(404).json({ error: 'Not found.' });
  if (rank.icon_path) {
    const abs = path.join(__dirname, '../../', rank.icon_path.replace(/^\//, ''));
    try { fs.unlinkSync(abs); } catch {}
    db.prepare("UPDATE ranks SET icon_path=NULL WHERE id=?").run(req.params.id);
  }
  res.json({ success: true });
});

module.exports = router;
