'use strict';

const express = require('express');
const router  = express.Router();
const { getDb } = require('../config/database');

// ── GET /api/organization — full tree ─────────────────────────────────────────
router.get('/', (req, res) => {
  const db = getDb();
  const platoons  = db.prepare('SELECT * FROM platoons ORDER BY sort_order, id').all();
  const squads    = db.prepare('SELECT * FROM squads ORDER BY sort_order, id').all();
  const fireteams = db.prepare('SELECT * FROM fireteams ORDER BY sort_order, id').all();
  const positions = db.prepare('SELECT * FROM org_positions ORDER BY sort_order, id').all();

  const tree = platoons.map(p => ({
    ...p,
    positions: positions.filter(x => x.unit_type === 'platoon' && x.unit_id === p.id),
    squads: squads
      .filter(s => s.platoon_id === p.id)
      .map(s => ({
        ...s,
        positions: positions.filter(x => x.unit_type === 'squad' && x.unit_id === s.id),
        fireteams: fireteams
          .filter(f => f.squad_id === s.id)
          .map(f => ({
            ...f,
            positions: positions.filter(x => x.unit_type === 'fireteam' && x.unit_id === f.id),
          })),
      })),
  }));

  res.json(tree);
});

// ── Platoons ──────────────────────────────────────────────────────────────────
router.post('/platoons', (req, res) => {
  const { name, designation, type = 'infantry', notes = '' } = req.body;
  if (!name) return res.status(400).json({ error: 'Name is required.' });
  const db = getDb();
  const maxOrder = db.prepare('SELECT MAX(sort_order) as m FROM platoons').get().m || 0;
  const result = db.prepare(
    'INSERT INTO platoons (name, designation, type, sort_order, notes) VALUES (?,?,?,?,?)'
  ).run(name.trim(), designation || '', type, maxOrder + 1, notes);
  res.status(201).json({ id: result.lastInsertRowid });
});

router.put('/platoons/:id', (req, res) => {
  const { name, designation, type, notes, sort_order } = req.body;
  const db = getDb();
  const existing = db.prepare('SELECT id FROM platoons WHERE id=?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Not found.' });
  db.prepare('UPDATE platoons SET name=COALESCE(?,name), designation=COALESCE(?,designation), type=COALESCE(?,type), notes=COALESCE(?,notes), sort_order=COALESCE(?,sort_order) WHERE id=?')
    .run(name || null, designation || null, type || null, notes ?? null, sort_order ?? null, req.params.id);
  res.json({ success: true });
});

router.delete('/platoons/:id', (req, res) => {
  const db = getDb();
  db.prepare('DELETE FROM platoons WHERE id=?').run(req.params.id);
  res.json({ success: true });
});

// ── Squads ────────────────────────────────────────────────────────────────────
router.post('/squads', (req, res) => {
  const { platoon_id, name, designation, max_size = 9, notes = '' } = req.body;
  if (!platoon_id || !name) return res.status(400).json({ error: 'platoon_id and name are required.' });
  const db = getDb();
  const platoon = db.prepare('SELECT id FROM platoons WHERE id=?').get(platoon_id);
  if (!platoon) return res.status(404).json({ error: 'Platoon not found.' });
  const maxOrder = db.prepare('SELECT MAX(sort_order) as m FROM squads WHERE platoon_id=?').get(platoon_id).m || 0;
  const result = db.prepare(
    'INSERT INTO squads (platoon_id, name, designation, max_size, sort_order, notes) VALUES (?,?,?,?,?,?)'
  ).run(platoon_id, name.trim(), designation || '', max_size, maxOrder + 1, notes);
  res.status(201).json({ id: result.lastInsertRowid });
});

router.put('/squads/:id', (req, res) => {
  const { name, designation, max_size, notes, sort_order } = req.body;
  const db = getDb();
  const existing = db.prepare('SELECT id FROM squads WHERE id=?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Not found.' });
  db.prepare('UPDATE squads SET name=COALESCE(?,name), designation=COALESCE(?,designation), max_size=COALESCE(?,max_size), notes=COALESCE(?,notes), sort_order=COALESCE(?,sort_order) WHERE id=?')
    .run(name || null, designation || null, max_size ?? null, notes ?? null, sort_order ?? null, req.params.id);
  res.json({ success: true });
});

router.delete('/squads/:id', (req, res) => {
  getDb().prepare('DELETE FROM squads WHERE id=?').run(req.params.id);
  res.json({ success: true });
});

// ── Fireteams / Teams ─────────────────────────────────────────────────────────
router.post('/fireteams', (req, res) => {
  const { squad_id, name, type = 'fireteam', max_size = 4 } = req.body;
  if (!squad_id || !name) return res.status(400).json({ error: 'squad_id and name are required.' });
  const db = getDb();
  const squad = db.prepare('SELECT id FROM squads WHERE id=?').get(squad_id);
  if (!squad) return res.status(404).json({ error: 'Squad not found.' });
  const maxOrder = db.prepare('SELECT MAX(sort_order) as m FROM fireteams WHERE squad_id=?').get(squad_id).m || 0;
  const result = db.prepare(
    'INSERT INTO fireteams (squad_id, name, type, max_size, sort_order) VALUES (?,?,?,?,?)'
  ).run(squad_id, name.trim(), type, max_size, maxOrder + 1);
  res.status(201).json({ id: result.lastInsertRowid });
});

router.put('/fireteams/:id', (req, res) => {
  const { name, type, max_size, sort_order } = req.body;
  const db = getDb();
  const existing = db.prepare('SELECT id FROM fireteams WHERE id=?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Not found.' });
  db.prepare('UPDATE fireteams SET name=COALESCE(?,name), type=COALESCE(?,type), max_size=COALESCE(?,max_size), sort_order=COALESCE(?,sort_order) WHERE id=?')
    .run(name || null, type || null, max_size ?? null, sort_order ?? null, req.params.id);
  res.json({ success: true });
});

router.delete('/fireteams/:id', (req, res) => {
  getDb().prepare('DELETE FROM fireteams WHERE id=?').run(req.params.id);
  res.json({ success: true });
});

// ── Positions ─────────────────────────────────────────────────────────────────
router.get('/positions', (req, res) => {
  const { unit_type, unit_id } = req.query;
  let q = 'SELECT * FROM org_positions WHERE 1=1';
  const params = [];
  if (unit_type) { q += ' AND unit_type=?'; params.push(unit_type); }
  if (unit_id)   { q += ' AND unit_id=?';   params.push(unit_id);   }
  q += ' ORDER BY sort_order, id';
  res.json(getDb().prepare(q).all(...params));
});

router.post('/positions', (req, res) => {
  const { unit_id, unit_type, title, abbreviation = '', is_lead = 0 } = req.body;
  if (!unit_id || !unit_type || !title) return res.status(400).json({ error: 'unit_id, unit_type, and title are required.' });
  if (!['platoon','squad','fireteam'].includes(unit_type)) return res.status(400).json({ error: 'unit_type must be platoon, squad, or fireteam.' });
  const db = getDb();
  const maxOrder = db.prepare('SELECT MAX(sort_order) as m FROM org_positions WHERE unit_type=? AND unit_id=?').get(unit_type, unit_id).m || 0;
  const result = db.prepare(
    'INSERT INTO org_positions (unit_id, unit_type, title, abbreviation, is_lead, sort_order) VALUES (?,?,?,?,?,?)'
  ).run(unit_id, unit_type, title.trim(), abbreviation, is_lead ? 1 : 0, maxOrder + 1);
  res.status(201).json({ id: result.lastInsertRowid });
});

router.put('/positions/:id', (req, res) => {
  const { title, abbreviation, is_lead, sort_order } = req.body;
  const db = getDb();
  const existing = db.prepare('SELECT id FROM org_positions WHERE id=?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Not found.' });
  db.prepare('UPDATE org_positions SET title=COALESCE(?,title), abbreviation=COALESCE(?,abbreviation), is_lead=COALESCE(?,is_lead), sort_order=COALESCE(?,sort_order) WHERE id=?')
    .run(title || null, abbreviation ?? null, is_lead !== undefined ? (is_lead ? 1 : 0) : null, sort_order ?? null, req.params.id);
  res.json({ success: true });
});

router.delete('/positions/:id', (req, res) => {
  getDb().prepare('DELETE FROM org_positions WHERE id=?').run(req.params.id);
  res.json({ success: true });
});

module.exports = router;
