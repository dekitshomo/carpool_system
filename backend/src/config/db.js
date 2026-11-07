const { DatabaseSync } = require('node:sqlite');
const path = require('node:path');
const fs = require('node:fs');

const dataDir = path.join(__dirname, '..', '..', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = process.env.DB_PATH || path.join(dataDir, 'carpool.db');
const db = new DatabaseSync(dbPath);

// Enable Foreign Keys and WAL mode for better concurrency and integrity
db.exec('PRAGMA foreign_keys = ON;');
db.exec('PRAGMA journal_mode = WAL;');

// Ensure core schema tables exist automatically
try {
  db.exec(`
    CREATE TABLE IF NOT EXISTS PendingRegistrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      student_id TEXT,
      password_hash TEXT NOT NULL,
      phone TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('driver', 'passenger')),
      department TEXT,
      license_number TEXT,
      verification_code TEXT,
      verification_token TEXT,
      code_hash TEXT,
      code_salt TEXT,
      failed_attempts INTEGER DEFAULT 0,
      last_sent_at DATETIME,
      resend_count INTEGER DEFAULT 1,
      expires_at DATETIME NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS SentEmails (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      to_email TEXT NOT NULL,
      subject TEXT NOT NULL,
      body_html TEXT NOT NULL,
      verification_code TEXT,
      status TEXT DEFAULT 'delivered',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
} catch (e) {
  // Ignore if already created
}

// Ensure all migration columns exist safely even if table was created earlier
const pendingCols = [
  'code_hash TEXT',
  'code_salt TEXT',
  'failed_attempts INTEGER DEFAULT 0',
  'last_sent_at DATETIME',
  'resend_count INTEGER DEFAULT 1'
];
for (const col of pendingCols) {
  try { db.exec(`ALTER TABLE PendingRegistrations ADD COLUMN ${col};`); } catch (e) {}
}
const userCols = [
  'email_verified INTEGER DEFAULT 0',
  'verification_code TEXT',
  'verification_token TEXT',
  'verification_expires DATETIME'
];
for (const col of userCols) {
  try { db.exec(`ALTER TABLE Users ADD COLUMN ${col};`); } catch (e) {}
}

module.exports = db;
