import Database from "better-sqlite3";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = process.env.DATA_DIR || path.join(__dirname, "data");
fs.mkdirSync(dataDir, { recursive: true });

const db = new Database(path.join(dataDir, "family-bills.db"));
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

db.exec(`
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS members (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  emoji TEXT NOT NULL DEFAULT '🙂',
  color TEXT NOT NULL DEFAULT '#6366f1'
);

CREATE TABLE IF NOT EXISTS bills (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'Other',
  amount_cents INTEGER NOT NULL,
  due_day INTEGER NOT NULL CHECK (due_day BETWEEN 1 AND 31),
  payer_member_id INTEGER REFERENCES members(id) ON DELETE SET NULL,
  split_type TEXT NOT NULL DEFAULT 'shared' CHECK (split_type IN ('shared','payer','custom')),
  split_pct INTEGER NOT NULL DEFAULT 50 CHECK (split_pct BETWEEN 0 AND 100),
  autopay INTEGER NOT NULL DEFAULT 0,
  notes TEXT NOT NULL DEFAULT '',
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS payments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  bill_id INTEGER NOT NULL REFERENCES bills(id) ON DELETE CASCADE,
  month TEXT NOT NULL,
  amount_cents INTEGER NOT NULL,
  paid_by_member_id INTEGER REFERENCES members(id) ON DELETE SET NULL,
  paid_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (bill_id, month)
);
`);

// Seed a default household on first run so the app is usable immediately.
const memberCount = db.prepare("SELECT COUNT(*) AS n FROM members").get().n;
if (memberCount === 0) {
  const insertMember = db.prepare(
    "INSERT INTO members (name, emoji, color) VALUES (?, ?, ?)"
  );
  insertMember.run("Partner 1", "🧑", "#1c1c1a");
  insertMember.run("Partner 2", "🧑", "#0f766e");
  db.prepare(
    "INSERT OR IGNORE INTO settings (key, value) VALUES ('household_name', 'Our Household')"
  ).run();
}

export default db;
