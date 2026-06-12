// database/db.js
// SQLite database using sql.js (pure JavaScript — no C++ compiler needed!)
// sql.js runs SQLite compiled to WebAssembly, so it works on any platform.
//
// HOW IT WORKS:
//   - On startup: loads game.db from disk into memory (or creates a new DB)
//   - On every write: saves the in-memory DB back to disk automatically
//   - This gives us the full SQLite feature set with zero native dependencies

const path = require('path');
const fs   = require('fs');

const DB_PATH = path.join(__dirname, 'game.db');

let db; // Will hold the sql.js Database instance

// ── Initialize (async because sql.js uses WebAssembly) ─────────────────────
async function initDB() {
  const initSqlJs = require('sql.js');
  const SQL = await initSqlJs();

  // Load existing DB file, or create a fresh one
  if (fs.existsSync(DB_PATH)) {
    const fileBuffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(fileBuffer);
    console.log('✅ Database loaded from disk');
  } else {
    db = new SQL.Database();
    console.log('✅ New database created');
  }

  // Enable foreign keys
  db.run('PRAGMA foreign_keys = ON;');

  // Create all tables
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      username      TEXT    NOT NULL UNIQUE,
      email         TEXT    NOT NULL UNIQUE,
      password_hash TEXT    NOT NULL,
      avatar        TEXT    DEFAULT '🧙',
      created_at    DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS player_stats (
      user_id           INTEGER PRIMARY KEY,
      level             INTEGER DEFAULT 1,
      xp                INTEGER DEFAULT 0,
      coins             INTEGER DEFAULT 50,
      hp                INTEGER DEFAULT 100,
      max_hp            INTEGER DEFAULT 100,
      total_battles     INTEGER DEFAULT 0,
      monsters_defeated INTEGER DEFAULT 0,
      correct_answers   INTEGER DEFAULT 0,
      wrong_answers     INTEGER DEFAULT 0,
      current_streak    INTEGER DEFAULT 0,
      best_streak       INTEGER DEFAULT 0,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS questions (
      id             INTEGER PRIMARY KEY AUTOINCREMENT,
      category       TEXT    NOT NULL,
      difficulty     TEXT    NOT NULL,
      question_text  TEXT    NOT NULL,
      option_a       TEXT    NOT NULL,
      option_b       TEXT    NOT NULL,
      option_c       TEXT    NOT NULL,
      option_d       TEXT    NOT NULL,
      correct_option TEXT    NOT NULL,
      explanation    TEXT    NOT NULL,
      xp_reward      INTEGER DEFAULT 10
    );

    CREATE TABLE IF NOT EXISTS monsters (
      id             INTEGER PRIMARY KEY AUTOINCREMENT,
      name           TEXT    NOT NULL,
      category       TEXT    NOT NULL,
      hp             INTEGER NOT NULL,
      level_required INTEGER DEFAULT 1,
      image_emoji    TEXT    DEFAULT '👾',
      xp_reward      INTEGER DEFAULT 50,
      coin_reward    INTEGER DEFAULT 20,
      description    TEXT    DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS achievements (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      name            TEXT    NOT NULL,
      description     TEXT    NOT NULL,
      icon            TEXT    DEFAULT '🏆',
      condition_type  TEXT    NOT NULL,
      condition_value INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS user_achievements (
      user_id        INTEGER NOT NULL,
      achievement_id INTEGER NOT NULL,
      unlocked_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (user_id, achievement_id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (achievement_id) REFERENCES achievements(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS battle_history (
      id                 INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id            INTEGER NOT NULL,
      monster_id         INTEGER NOT NULL,
      outcome            TEXT    NOT NULL,
      questions_answered INTEGER DEFAULT 0,
      correct_count      INTEGER DEFAULT 0,
      xp_gained          INTEGER DEFAULT 0,
      played_at          DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (monster_id) REFERENCES monsters(id) ON DELETE CASCADE
    );
  `);

  // Save initial schema to disk
  saveToDisk();
  console.log('✅ All tables ready');
  return db;
}

// ── Save in-memory DB to disk ───────────────────────────────────────────────
function saveToDisk() {
  const data = db.export();
  fs.writeFileSync(DB_PATH, Buffer.from(data));
}

// ── Query helpers (mimic better-sqlite3 synchronous API) ───────────────────

/**
 * Run a SELECT query and return all matching rows as an array of objects.
 * Example: dbAll('SELECT * FROM users WHERE email = ?', [email])
 */
function dbAll(sql, params = []) {
  const stmt   = db.prepare(sql);
  const rows   = [];
  stmt.bind(params);
  while (stmt.step()) {
    rows.push(stmt.getAsObject());
  }
  stmt.free();
  return rows;
}

/**
 * Run a SELECT query and return the first matching row (or null).
 * Example: dbGet('SELECT * FROM users WHERE id = ?', [userId])
 */
function dbGet(sql, params = []) {
  const rows = dbAll(sql, params);
  return rows.length ? rows[0] : null;
}

/**
 * Run an INSERT/UPDATE/DELETE query.
 * Returns { lastInsertRowid, changes }
 * Example: dbRun('INSERT INTO users (username) VALUES (?)', ['Alice'])
 */
function dbRun(sql, params = []) {
  db.run(sql, params);
  const info = {
    lastInsertRowid: db.exec('SELECT last_insert_rowid()')[0]?.values[0][0] ?? null,
    changes: db.getRowsModified(),
  };
  saveToDisk(); // Persist every write immediately
  return info;
}

/**
 * Run multiple statements in one go (used for seeding).
 */
function dbExec(sql) {
  db.exec(sql);
  saveToDisk();
}

module.exports = { initDB, dbGet, dbAll, dbRun, dbExec, saveToDisk };
