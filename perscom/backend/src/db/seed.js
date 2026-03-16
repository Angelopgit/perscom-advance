'use strict';

require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const { initializeDatabase, getDb } = require('../config/database');
const bcrypt = require('bcryptjs');

async function seed() {
  console.log('[PERSCOM] Running database seed...');
  initializeDatabase();
  const db = getDb();

  // ── Admin user ──────────────────────────────────────────────────────────────
  const existingAdmin = db.prepare("SELECT id FROM users WHERE username='admin'").get();
  if (!existingAdmin) {
    const hash = bcrypt.hashSync('changeme123', 10);
    db.prepare(`INSERT INTO users (username, email, password_hash, role) VALUES (?,?,?,?)`)
      .run('admin', 'admin@perscom.local', hash, 'admin');
    console.log('[PERSCOM] Admin user created (admin / changeme123)');
  }

  // ── Default ranks (US Army enlisted + officer) ──────────────────────────────
  const rankCount = db.prepare('SELECT COUNT(*) as c FROM ranks').get().c;
  if (rankCount === 0) {
    const defaultRanks = [
      { name: 'Private',               abbreviation: 'PVT',  grade: 'E-1', tier: 1,  sort_order: 1  },
      { name: 'Private Second Class',  abbreviation: 'PV2',  grade: 'E-2', tier: 2,  sort_order: 2  },
      { name: 'Private First Class',   abbreviation: 'PFC',  grade: 'E-3', tier: 3,  sort_order: 3  },
      { name: 'Specialist',            abbreviation: 'SPC',  grade: 'E-4', tier: 4,  sort_order: 4  },
      { name: 'Corporal',              abbreviation: 'CPL',  grade: 'E-4', tier: 4,  sort_order: 5  },
      { name: 'Sergeant',              abbreviation: 'SGT',  grade: 'E-5', tier: 5,  sort_order: 6  },
      { name: 'Staff Sergeant',        abbreviation: 'SSG',  grade: 'E-6', tier: 6,  sort_order: 7  },
      { name: 'Sergeant First Class',  abbreviation: 'SFC',  grade: 'E-7', tier: 7,  sort_order: 8  },
      { name: 'Master Sergeant',       abbreviation: 'MSG',  grade: 'E-8', tier: 8,  sort_order: 9  },
      { name: 'First Sergeant',        abbreviation: '1SG',  grade: 'E-8', tier: 8,  sort_order: 10 },
      { name: 'Sergeant Major',        abbreviation: 'SGM',  grade: 'E-9', tier: 9,  sort_order: 11 },
      { name: 'Second Lieutenant',     abbreviation: '2LT',  grade: 'O-1', tier: 10, sort_order: 12 },
      { name: 'First Lieutenant',      abbreviation: '1LT',  grade: 'O-2', tier: 11, sort_order: 13 },
      { name: 'Captain',               abbreviation: 'CPT',  grade: 'O-3', tier: 12, sort_order: 14 },
      { name: 'Major',                 abbreviation: 'MAJ',  grade: 'O-4', tier: 13, sort_order: 15 },
      { name: 'Lieutenant Colonel',    abbreviation: 'LTC',  grade: 'O-5', tier: 14, sort_order: 16 },
      { name: 'Colonel',               abbreviation: 'COL',  grade: 'O-6', tier: 15, sort_order: 17 },
    ];
    const insertRank = db.prepare(
      'INSERT INTO ranks (name, abbreviation, grade, tier, sort_order) VALUES (@name,@abbreviation,@grade,@tier,@sort_order)'
    );
    db.transaction(() => defaultRanks.forEach(r => insertRank.run(r)))();
    console.log(`[PERSCOM] Seeded ${defaultRanks.length} default ranks`);
  }

  // ── Default org structure ───────────────────────────────────────────────────
  const platoonCount = db.prepare('SELECT COUNT(*) as c FROM platoons').get().c;
  if (platoonCount === 0) {
    const p1 = db.prepare("INSERT INTO platoons (name, designation, type, sort_order) VALUES (?,?,?,?)").run('Alpha Platoon', '1st PLT', 'infantry', 1).lastInsertRowid;
    const p2 = db.prepare("INSERT INTO platoons (name, designation, type, sort_order) VALUES (?,?,?,?)").run('Bravo Platoon', '2nd PLT', 'infantry', 2).lastInsertRowid;

    // Squads for Alpha
    const s1 = db.prepare("INSERT INTO squads (platoon_id, name, designation, max_size, sort_order) VALUES (?,?,?,?,?)").run(p1, '1st Squad', '1ST SQD', 9, 1).lastInsertRowid;
    const s2 = db.prepare("INSERT INTO squads (platoon_id, name, designation, max_size, sort_order) VALUES (?,?,?,?,?)").run(p1, '2nd Squad', '2ND SQD', 9, 2).lastInsertRowid;

    // Fireteams for 1st Squad
    db.prepare("INSERT INTO fireteams (squad_id, name, type, max_size, sort_order) VALUES (?,?,?,?,?)").run(s1, 'Alpha Team', 'fireteam', 4, 1);
    db.prepare("INSERT INTO fireteams (squad_id, name, type, max_size, sort_order) VALUES (?,?,?,?,?)").run(s1, 'Bravo Team', 'fireteam', 4, 2);

    // Leadership positions
    db.prepare("INSERT INTO org_positions (unit_id, unit_type, title, abbreviation, is_lead, sort_order) VALUES (?,?,?,?,?,?)").run(p1, 'platoon', 'Platoon Leader', 'PL', 1, 1);
    db.prepare("INSERT INTO org_positions (unit_id, unit_type, title, abbreviation, is_lead, sort_order) VALUES (?,?,?,?,?,?)").run(p1, 'platoon', 'Platoon Sergeant', 'PSG', 1, 2);
    db.prepare("INSERT INTO org_positions (unit_id, unit_type, title, abbreviation, is_lead, sort_order) VALUES (?,?,?,?,?,?)").run(s1, 'squad', 'Squad Leader', 'SL', 1, 1);
    db.prepare("INSERT INTO org_positions (unit_id, unit_type, title, abbreviation, is_lead, sort_order) VALUES (?,?,?,?,?,?)").run(s1, 'squad', 'Assistant Squad Leader', 'ASL', 0, 2);

    console.log('[PERSCOM] Seeded default organization structure');
  }

  console.log('[PERSCOM] Seed complete.');
  process.exit(0);
}

seed().catch(err => { console.error('[PERSCOM] Seed error:', err); process.exit(1); });
