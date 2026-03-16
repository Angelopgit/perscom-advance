'use strict';

const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '../../data/perscom.db');
let db;

function getDb() {
  if (!db) throw new Error('Database not initialized. Call initializeDatabase() first.');
  return db;
}

function initializeDatabase() {
  db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  db.exec(`
    -- ── Users ──────────────────────────────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      email TEXT UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'member',
      is_active INTEGER DEFAULT 1,
      last_login DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- ── Ranks ──────────────────────────────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS ranks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      abbreviation TEXT,
      grade TEXT,
      tier INTEGER DEFAULT 0,
      icon_path TEXT,
      sort_order INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- ── Organization: Platoons ─────────────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS platoons (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      designation TEXT,
      type TEXT DEFAULT 'infantry',
      sort_order INTEGER DEFAULT 0,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- ── Organization: Squads ───────────────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS squads (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      platoon_id INTEGER REFERENCES platoons(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      designation TEXT,
      max_size INTEGER DEFAULT 9,
      sort_order INTEGER DEFAULT 0,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- ── Organization: Fireteams / Teams ────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS fireteams (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      squad_id INTEGER REFERENCES squads(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      type TEXT DEFAULT 'fireteam',
      max_size INTEGER DEFAULT 4,
      sort_order INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- ── Org Positions (leadership slots per unit) ──────────────────────────────
    CREATE TABLE IF NOT EXISTS org_positions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      unit_id INTEGER NOT NULL,
      unit_type TEXT NOT NULL,
      title TEXT NOT NULL,
      abbreviation TEXT,
      is_lead INTEGER DEFAULT 0,
      sort_order INTEGER DEFAULT 0
    );

    -- ── Personnel ──────────────────────────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS personnel (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      rank_id INTEGER REFERENCES ranks(id) ON DELETE SET NULL,
      mos TEXT,
      position_id INTEGER REFERENCES org_positions(id) ON DELETE SET NULL,
      platoon_id INTEGER REFERENCES platoons(id) ON DELETE SET NULL,
      squad_id INTEGER REFERENCES squads(id) ON DELETE SET NULL,
      fireteam_id INTEGER REFERENCES fireteams(id) ON DELETE SET NULL,
      status TEXT DEFAULT 'active',
      join_date DATE,
      discharge_date DATE,
      avatar_path TEXT,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- ── Operations ─────────────────────────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS operations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      type TEXT DEFAULT 'training',
      status TEXT DEFAULT 'planned',
      scheduled_at DATETIME,
      completed_at DATETIME,
      description TEXT,
      objectives TEXT,
      result TEXT,
      created_by INTEGER REFERENCES users(id),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- ── Attendance ─────────────────────────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS attendance (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      operation_id INTEGER REFERENCES operations(id) ON DELETE CASCADE,
      personnel_id INTEGER REFERENCES personnel(id) ON DELETE CASCADE,
      status TEXT DEFAULT 'present',
      notes TEXT,
      UNIQUE(operation_id, personnel_id)
    );

    -- ── Evaluations ────────────────────────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS evaluations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      personnel_id INTEGER REFERENCES personnel(id) ON DELETE CASCADE,
      evaluator_id INTEGER REFERENCES users(id),
      rating INTEGER CHECK(rating BETWEEN 1 AND 5),
      period TEXT,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- ── Announcements ──────────────────────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS announcements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      content TEXT,
      priority TEXT DEFAULT 'normal',
      author_id INTEGER REFERENCES users(id),
      published_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      expires_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- ── Documents ──────────────────────────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS documents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      category TEXT,
      file_path TEXT,
      file_size INTEGER,
      uploaded_by INTEGER REFERENCES users(id),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- ── Gear Loadouts ──────────────────────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS gear (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      personnel_id INTEGER REFERENCES personnel(id) ON DELETE CASCADE,
      item_name TEXT NOT NULL,
      category TEXT,
      quantity INTEGER DEFAULT 1,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- ── Activity Log ───────────────────────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS activity_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER REFERENCES users(id),
      action TEXT NOT NULL,
      entity_type TEXT,
      entity_id INTEGER,
      details TEXT,
      ip_address TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- ── Spotlights ─────────────────────────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS spotlights (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      personnel_id INTEGER REFERENCES personnel(id) ON DELETE CASCADE,
      reason TEXT,
      awarded_by INTEGER REFERENCES users(id),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  console.log('[PERSCOM] Database initialized');
  return db;
}

module.exports = { getDb, initializeDatabase };
