const express = require('express');
const router = express.Router();
const { body, param, query, validationResult } = require('express-validator');
const { db } = require('../db');
const { authMiddleware, requireRole } = require('../authMiddleware');

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// GET /api/subscribers  (list, auth required)
router.get(
  '/',
  authMiddleware,
  [query('status').optional().isIn(['active', 'unsubscribed'])],
  handleValidationErrors,
  (req, res) => {
    try {
      const { status } = req.query;
      let sql = 'SELECT * FROM subscribers';
      const params = [];
      if (status) {
        sql += ' WHERE status = ?';
        params.push(status);
      }
      sql += ' ORDER BY subscribed_at DESC';
      const rows = db.query(sql, params);
      res.json({ subscribers: rows });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Server error' });
    }
  }
);

// POST /api/subscribers  (public signup / admin add)
router.post(
  '/',
  [
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('name').optional().trim().escape(),
    body('status').optional().isIn(['active', 'unsubscribed']),
  ],
  handleValidationErrors,
  (req, res) => {
    try {
      const { email, name, status } = req.body;
      const existing = db.queryOne('SELECT * FROM subscribers WHERE email = ?', [email]);
      if (existing) {
        return res.status(409).json({ error: 'Subscriber already exists' });
      }

      const result = db.runWrite(
        'INSERT INTO subscribers (email, name, status) VALUES (?, ?, ?)',
        [email, name || null, status || 'active']
      );
      const subscriber = db.queryOne('SELECT * FROM subscribers WHERE id = ?', [result.lastInsertRowid]);
      res.status(201).json({ subscriber });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Server error' });
    }
  }
);

// PATCH /api/subscribers/:id  (update status/name, auth required)
router.patch(
  '/:id',
  authMiddleware,
  [param('id').isInt(), body('status').optional().isIn(['active', 'unsubscribed'])],
  handleValidationErrors,
  (req, res) => {
    try {
      const id = Number(req.params.id);
      const existing = db.queryOne('SELECT * FROM subscribers WHERE id = ?', [id]);
      if (!existing) {
        return res.status(404).json({ error: 'Subscriber not found' });
      }

      const { name, status } = req.body;
      const updates = [];
      const params = [];
      if (name !== undefined) {
        updates.push('name = ?');
        params.push(name);
      }
      if (status !== undefined) {
        updates.push('status = ?');
        params.push(status);
        if (status === 'unsubscribed' && existing.status !== 'unsubscribed') {
          updates.push('unsubscribed_at = CURRENT_TIMESTAMP');
        }
        if (status === 'active' && existing.status !== 'active') {
          updates.push('unsubscribed_at = NULL');
        }
      }
      if (updates.length === 0) {
        return res.json({ subscriber: existing });
      }
      params.push(id);
      db.runWrite(`UPDATE subscribers SET ${updates.join(', ')} WHERE id = ?`, params);

      const subscriber = db.queryOne('SELECT * FROM subscribers WHERE id = ?', [id]);
      res.json({ subscriber });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Server error' });
    }
  }
);

// DELETE /api/subscribers/:id
router.delete(
  '/:id',
  authMiddleware,
  requireRole('admin', 'editor'),
  [param('id').isInt()],
  handleValidationErrors,
  (req, res) => {
    try {
      const id = Number(req.params.id);
      const existing = db.queryOne('SELECT id FROM subscribers WHERE id = ?', [id]);
      if (!existing) {
        return res.status(404).json({ error: 'Subscriber not found' });
      }
      db.runWrite('DELETE FROM subscribers WHERE id = ?', [id]);
      res.json({ message: 'Subscriber deleted' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Server error' });
    }
  }
);

// POST /api/subscribers/import  (bulk import emails, auth required)
router.post(
  '/import',
  authMiddleware,
  requireRole('admin', 'editor'),
  [body('emails').isArray({ min: 1 }).withMessage('emails must be a non-empty array')],
  handleValidationErrors,
  (req, res) => {
    try {
      const { emails } = req.body;
      db.runWrite('BEGIN');
      const insert = db.prepare('INSERT OR IGNORE INTO subscribers (email, name, status) VALUES (?, ?, ?)');
      for (const email of emails) {
        insert.bind([email, null, 'active']);
        insert.step();
      }
      insert.free();
      db.runWrite('COMMIT');

      const count = db.queryOne('SELECT COUNT(*) AS c FROM subscribers WHERE status = "active"').c;
      res.json({ imported: emails.length, totalActive: count });
    } catch (err) {
      try { db.runWrite('ROLLBACK'); } catch (_) {}
      console.error(err);
      res.status(500).json({ error: 'Server error' });
    }
  }
);

// POST /api/subscribers/unsubscribe  (public unsubscribe by email)
router.post(
  '/unsubscribe',
  [body('email').isEmail().normalizeEmail().withMessage('Valid email is required')],
  handleValidationErrors,
  (req, res) => {
    try {
      const { email } = req.body;
      const existing = db.queryOne('SELECT * FROM subscribers WHERE email = ?', [email]);
      if (!existing) {
        return res.status(404).json({ error: 'Subscriber not found' });
      }
      db.runWrite(
        'UPDATE subscribers SET status = "unsubscribed", unsubscribed_at = CURRENT_TIMESTAMP WHERE email = ?',
        [email]
      );
      res.json({ message: 'You have been unsubscribed' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Server error' });
    }
  }
);

module.exports = router;
