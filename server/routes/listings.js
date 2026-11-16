import express from 'express';
import multer from 'multer';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import db, { UPLOAD_DIR } from '../db.js';
import { CATEGORIES, TYPES, STATUSES } from '../constants.js';

const router = express.Router();

// ---------- photo upload (optional, max 5 MB, images only) ----------
const MIME_TO_EXT = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
};

const upload = multer({
  storage: multer.diskStorage({
    destination: UPLOAD_DIR,
    filename: (_req, file, cb) => {
      cb(null, crypto.randomBytes(12).toString('hex') + MIME_TO_EXT[file.mimetype]);
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, cb) => {
    if (MIME_TO_EXT[file.mimetype]) return cb(null, true);
    const err = new Error('Photo must be a JPG, PNG, WebP or GIF image.');
    err.status = 400;
    cb(err);
  },
});

function removeUpload(file) {
  if (file?.path) fs.unlink(file.path, () => {});
}

// ---------- helpers ----------
const isValidDate = (s) => /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(s));
const todayISO = () => new Date().toISOString().slice(0, 10);
const escapeLike = (s) => s.replace(/[\\%_]/g, (c) => '\\' + c);

function validateListing(body) {
  const errors = {};
  const type = String(body.type ?? '').trim();
  const itemName = String(body.item_name ?? '').trim();
  const description = String(body.description ?? '').trim();
  const category = String(body.category ?? '').trim();
  const location = String(body.location ?? '').trim();
  const date = String(body.date ?? '').trim();

  if (!TYPES.includes(type)) errors.type = 'Choose Lost or Found.';
  if (!itemName) errors.item_name = 'Enter the item name.';
  else if (itemName.length > 100) errors.item_name = 'Keep the item name under 100 characters.';
  if (!description) errors.description = 'Add a short description.';
  else if (description.length > 1000) errors.description = 'Keep the description under 1000 characters.';
  if (!CATEGORIES.includes(category)) errors.category = 'Choose a category.';
  if (!location) errors.location = 'Enter where it was lost or found.';
  else if (location.length > 150) errors.location = 'Keep the location under 150 characters.';
  if (!isValidDate(date)) errors.date = 'Enter a valid date.';
  else if (date > todayISO()) errors.date = 'The date cannot be in the future.';

  return {
    errors,
    values: { type, item_name: itemName, description, category, location, date },
  };
}

// ---------- GET /api/listings?q=&type=&category=&status=&page=&limit= ----------
router.get('/', (req, res) => {
  const q = String(req.query.q ?? '').trim();
  const type = String(req.query.type ?? '').trim();
  const category = String(req.query.category ?? '').trim();
  const status = String(req.query.status ?? '').trim();
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 12));

  const where = [];
  const params = [];

  if (q) {
    // Every word must match somewhere in name, description, location or category.
    for (const word of q.split(/\s+/).slice(0, 8)) {
      const like = `%${escapeLike(word)}%`;
      where.push(
        `(item_name LIKE ? ESCAPE '\\' OR description LIKE ? ESCAPE '\\' OR location LIKE ? ESCAPE '\\' OR category LIKE ? ESCAPE '\\')`
      );
      params.push(like, like, like, like);
    }
  }
  if (TYPES.includes(type)) {
    where.push('type = ?');
    params.push(type);
  }
  if (CATEGORIES.includes(category)) {
    where.push('category = ?');
    params.push(category);
  }
  if (STATUSES.includes(status)) {
    where.push('status = ?');
    params.push(status);
  }

  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const total = db.prepare(`SELECT COUNT(*) AS n FROM listings ${whereSql}`).get(...params).n;
  const items = db
    .prepare(
      `SELECT * FROM listings ${whereSql}
       ORDER BY created_at DESC, id DESC
       LIMIT ? OFFSET ?`
    )
    .all(...params, limit, (page - 1) * limit);

  res.json({ items, total, page, limit, hasMore: page * limit < total });
});

// ---------- GET /api/listings/:id ----------
router.get('/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (!Number.isInteger(id)) return res.status(404).json({ error: 'Listing not found.' });
  const row = db.prepare('SELECT * FROM listings WHERE id = ?').get(id);
  if (!row) return res.status(404).json({ error: 'Listing not found.' });
  res.json(row);
});

// ---------- POST /api/listings (multipart/form-data) ----------
router.post('/', upload.single('photo'), (req, res) => {
  const { errors, values } = validateListing(req.body);
  if (Object.keys(errors).length) {
    removeUpload(req.file);
    return res.status(400).json({ error: 'Please fix the highlighted fields.', fields: errors });
  }

  const photoPath = req.file ? `/uploads/${path.basename(req.file.path)}` : null;
  const info = db
    .prepare(
      `INSERT INTO listings (type, item_name, description, category, location, date, photo_path)
       VALUES (@type, @item_name, @description, @category, @location, @date, @photo_path)`
    )
    .run({ ...values, photo_path: photoPath });

  const created = db.prepare('SELECT * FROM listings WHERE id = ?').get(info.lastInsertRowid);
  res.status(201).json(created);
});

// ---------- PATCH /api/listings/:id/status  { status: 'open' | 'closed' } ----------
router.patch('/:id/status', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const status = String(req.body?.status ?? '');
  if (!STATUSES.includes(status)) {
    return res.status(400).json({ error: "Status must be 'open' or 'closed'." });
  }
  const info = db.prepare('UPDATE listings SET status = ? WHERE id = ?').run(status, id);
  if (info.changes === 0) return res.status(404).json({ error: 'Listing not found.' });
  res.json(db.prepare('SELECT * FROM listings WHERE id = ?').get(id));
});

export default router;
