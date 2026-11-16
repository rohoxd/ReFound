import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// DATA_DIR holds the SQLite file and uploaded photos.
export const DATA_DIR = process.env.DATA_DIR
  ? path.resolve(process.env.DATA_DIR)
  : path.join(__dirname, 'data');
export const UPLOAD_DIR = path.join(DATA_DIR, 'uploads');

fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const db = new Database(path.join(DATA_DIR, 'refound.db'));
db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS listings (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    type        TEXT NOT NULL CHECK (type IN ('lost', 'found')),
    item_name   TEXT NOT NULL,
    description TEXT NOT NULL,
    category    TEXT NOT NULL,
    location    TEXT NOT NULL,
    date        TEXT NOT NULL,
    photo_path  TEXT,
    created_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    status      TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed'))
  );
  CREATE INDEX IF NOT EXISTS idx_listings_created ON listings (created_at DESC);
  CREATE INDEX IF NOT EXISTS idx_listings_type ON listings (type);
  CREATE INDEX IF NOT EXISTS idx_listings_category ON listings (category);
`);

export default db;
