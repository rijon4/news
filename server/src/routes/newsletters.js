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

// slug helper
function makeSlug(title) {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// GET /api/newsletters  (list; published-only for non-auth, all for auth)
router.get('/', query('published').optional().isIn(['true', 'false']), handleValidationErrors, (req, res) => {
  try {
    const { published } = req.query;
    let sql = `
      SELECT n.id, n.title, n.slug, n.summary, n.cover_image, n.published,
             n.published_at, n.created_at, n.updated_at,
             u.name AS author_name
      FROM newsletters n
      JOIN users u ON n.created_by = u.id
    `;
    const params = [];
    if (published === 'true') {
      sql += ' WHERE n.published = 1';
    } else if (published === 'false') {
      sql += ' WHERE n.published = 0';
    }
    sql += ' ORDER BY n.created_at DESC';
    const rows = db.query(sql, params);
    res.json({ newsletters: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/newsletters/:slug  (public view)
router.get('/:slug', param('slug').notEmpty(), handleValidationErrors, (req, res) => {
  try {
    const row = db.queryOne(
      `SELECT n.*, u.name AS author_name
       FROM newsletters n
       JOIN users u ON n.created_by = u.id
       WHERE n.slug = ?`,
      [req.params.slug]
    );

    if (!row) {
      return res.status(404).json({ error: 'Newsletter not found' });
    }

    // Non-authenticated users can only view published newsletters
    if (!row.published && !req.user) {
      return res.status(403).json({ error: 'Newsletter is not published' });
    }

    res.json({ newsletter: row });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/newsletters  (create draft)
router.post(
  '/',
  authMiddleware,
  requireRole('admin', 'editor'),
  [
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('summary').optional().trim().escape(),
    body('content').optional().isString(),
    body('cover_image').optional().trim().isURL().withMessage('cover_image must be a valid URL'),
    body('published').optional().isBoolean(),
  ],
  handleValidationErrors,
  (req, res) => {
    try {
      const { title, summary, content, cover_image, published } = req.body;
      const slug = makeSlug(title);

      // ensure unique slug
      let finalSlug = slug;
      let counter = 1;
      while (db.queryOne('SELECT id FROM newsletters WHERE slug = ?', [finalSlug])) {
        finalSlug = `${slug}-${counter++}`;
      }

      const publishedAt = published ? new Date().toISOString() : null;
      const result = db.runWrite(
        `INSERT INTO newsletters (title, slug, summary, content, cover_image, published, created_by, published_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [title, finalSlug, summary || null, content || '', cover_image || null, published ? 1 : 0, req.user.id, publishedAt]
      );

      const newsletter = db.queryOne('SELECT * FROM newsletters WHERE id = ?', [result.lastInsertRowid]);
      res.status(201).json({ newsletter });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Server error' });
    }
  }
);

// PUT /api/newsletters/:id  (update)
router.put(
  '/:id',
  authMiddleware,
  requireRole('admin', 'editor'),
  [
    param('id').isInt(),
    body('title').optional().trim().notEmpty(),
    body('summary').optional().trim().escape(),
    body('content').optional().isString(),
    body('cover_image').optional().trim().isURL(),
    body('published').optional().isBoolean(),
  ],
  handleValidationErrors,
  (req, res) => {
    try {
      const id = Number(req.params.id);
      const existing = db.queryOne('SELECT * FROM newsletters WHERE id = ?', [id]);
      if (!existing) {
        return res.status(404).json({ error: 'Newsletter not found' });
      }

      const { title, summary, content, cover_image, published } = req.body;
      const updates = [];
      const params = [];

      if (title !== undefined) {
        updates.push('title = ?');
        params.push(title);
      }
      if (summary !== undefined) {
        updates.push('summary = ?');
        params.push(summary);
      }
      if (content !== undefined) {
        updates.push('content = ?');
        params.push(content);
      }
      if (cover_image !== undefined) {
        updates.push('cover_image = ?');
        params.push(cover_image);
      }
      if (published !== undefined) {
        updates.push('published = ?');
        params.push(published ? 1 : 0);
        if (published && !existing.published) {
          updates.push('published_at = ?');
          params.push(new Date().toISOString());
        }
      }
      updates.push('updated_at = CURRENT_TIMESTAMP');
      params.push(id);

      if (updates.length > 1) {
        db.runWrite(`UPDATE newsletters SET ${updates.join(', ')} WHERE id = ?`, params);
      }

      const newsletter = db.queryOne('SELECT * FROM newsletters WHERE id = ?', [id]);
      res.json({ newsletter });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Server error' });
    }
  }
);

// DELETE /api/newsletters/:id
router.delete(
  '/:id',
  authMiddleware,
  requireRole('admin', 'editor'),
  [param('id').isInt()],
  handleValidationErrors,
  (req, res) => {
    try {
      const id = Number(req.params.id);
      const existing = db.queryOne('SELECT id FROM newsletters WHERE id = ?', [id]);
      if (!existing) {
        return res.status(404).json({ error: 'Newsletter not found' });
      }
      db.runWrite('DELETE FROM newsletters WHERE id = ?', [id]);
      res.json({ message: 'Newsletter deleted' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Server error' });
    }
  }
);

module.exports = router;
