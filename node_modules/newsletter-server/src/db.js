const fs = require('fs');
const path = require('path');
const initSqlJs = require('sql.js');

const dbPath = process.env.DB_PATH || path.join(__dirname, 'newsletter.db');

let sqlDb;

// Attach nicer query helpers on top of sql.js v1 (Statement API: bind/step/getAsObject)
function attachHelpers(db) {
  db.query = function (sql, params = []) {
    const stmt = db.prepare(sql);
    stmt.bind(params);
    const rows = [];
    while (stmt.step()) {
      rows.push(stmt.getAsObject());
    }
    stmt.free();
    return rows;
  };

  db.queryOne = function (sql, params = []) {
    const stmt = db.prepare(sql);
    stmt.bind(params);
    let row = undefined;
    if (stmt.step()) {
      row = stmt.getAsObject();
    }
    stmt.free();
    return row;
  };

  db.runWrite = function (sql, params = []) {
    const stmt = db.prepare(sql);
    stmt.bind(params);
    stmt.step();
    stmt.free();
    const info = db.queryOne('SELECT last_insert_rowid() AS lastInsertRowid, changes() AS changes');
    return { changes: info.changes, lastInsertRowid: info.lastInsertRowid };
  };

  return db;
}

function initSchema(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name TEXT,
      role TEXT DEFAULT 'editor' CHECK(role IN ('admin','editor','subscriber')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS newsletters (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      summary TEXT,
      content TEXT NOT NULL DEFAULT '',
      cover_image TEXT,
      published INTEGER DEFAULT 0,
      published_at DATETIME,
      created_by INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (created_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS subscribers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      name TEXT,
      status TEXT DEFAULT 'active' CHECK(status IN ('active','unsubscribed')),
      subscribed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      unsubscribed_at DATETIME
    );

    CREATE TABLE IF NOT EXISTS campaigns (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      newsletter_id INTEGER NOT NULL,
      subject TEXT NOT NULL,
      recipient_count INTEGER DEFAULT 0,
      sent_count INTEGER DEFAULT 0,
      status TEXT DEFAULT 'draft' CHECK(status IN ('draft','sending','sent','failed')),
      sent_at DATETIME,
      created_by INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (newsletter_id) REFERENCES newsletters(id),
      FOREIGN KEY (created_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS email_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      campaign_id INTEGER,
      subscriber_id INTEGER,
      email TEXT NOT NULL,
      status TEXT DEFAULT 'pending' CHECK(status IN ('pending','sent','failed','bounced')),
      error TEXT,
      sent_at DATETIME,
      FOREIGN KEY (campaign_id) REFERENCES campaigns(id),
      FOREIGN KEY (subscriber_id) REFERENCES subscribers(id)
    );

    CREATE INDEX IF NOT EXISTS idx_newsletters_slug ON newsletters(slug);
    CREATE INDEX IF NOT EXISTS idx_newsletters_published ON newsletters(published);
    CREATE INDEX IF NOT EXISTS idx_subscribers_email ON subscribers(email);
    CREATE INDEX IF NOT EXISTS idx_subscribers_status ON subscribers(status);
    CREATE INDEX IF NOT EXISTS idx_email_logs_campaign ON email_logs(campaign_id);
    CREATE INDEX IF NOT EXISTS idx_email_logs_subscriber ON email_logs(subscriber_id);
  `);
}

async function init() {
  const sqlJsMain = require.resolve('sql.js');
  const sqlJsDist = path.dirname(sqlJsMain);
  const SQL = await initSqlJs({
    locateFile: (file) => path.join(sqlJsDist, file),
  });
  let existing = null;
  try {
    existing = fs.readFileSync(dbPath);
  } catch (e) {
    // no existing database file; start fresh
  }
  sqlDb = new SQL.Database(existing);
  sqlDb.run('PRAGMA foreign_keys = ON');
  attachHelpers(sqlDb);
  initSchema(sqlDb);
  module.exports.db = sqlDb;
  return sqlDb;
}

function getDb() {
  if (!sqlDb) throw new Error('Database not initialized. Call init() before using the database.');
  return sqlDb;
}

function persist() {
  if (!sqlDb) return;
  try {
    const data = sqlDb.export();
    fs.writeFileSync(dbPath, data);
  } catch (e) {
    console.error('[db] failed to persist:', e.message);
  }
}
setInterval(persist, 15000).unref();
process.on('exit', persist);
process.on('SIGINT', () => { persist(); process.exit(0); });

module.exports = { init, getDb, db: undefined, dbPath };
