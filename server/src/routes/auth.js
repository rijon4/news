const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const { db } = require('../db');
const { generateToken, authMiddleware, requireRole } = require('../authMiddleware');

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// POST /api/auth/register
router.post(
  '/register',
  [
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters'),
    body('name').optional().trim().escape(),
    body('role').optional().isIn(['admin', 'editor', 'subscriber']),
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const { email, password, name, role } = req.body;

      const existing = db.queryOne('SELECT id FROM users WHERE email = ?', [email]);
      if (existing) {
        return res.status(409).json({ error: 'Email already registered' });
      }

      const passwordHash = await bcrypt.hash(password, Number(process.env.BCRYPT_SALT_ROUNDS) || 10);
      const result = db.runWrite(
        'INSERT INTO users (email, password_hash, name, role) VALUES (?, ?, ?, ?)',
        [email, passwordHash, name || null, role || 'editor']
      );

      const user = db.queryOne(
        'SELECT id, email, name, role, created_at FROM users WHERE id = ?',
        [result.lastInsertRowid]
      );

      const token = generateToken(user);
      res.status(201).json({ token, user });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Server error' });
    }
  }
);

// POST /api/auth/login
router.post(
  '/login',
  [
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  handleValidationErrors,
  (req, res) => {
    try {
      const { email, password } = req.body;
      const user = db.queryOne('SELECT * FROM users WHERE email = ?', [email]);

      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const match = bcrypt.compareSync(password, user.password_hash);
      if (!match) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const { password_hash, ...userWithoutHash } = user;
      const token = generateToken(userWithoutHash);
      res.json({ token, user: userWithoutHash });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Server error' });
    }
  }
);

// GET /api/auth/me
router.get('/me', authMiddleware, (req, res) => {
  try {
    const user = db.queryOne(
      'SELECT id, email, name, role, created_at FROM users WHERE id = ?',
      [req.user.id]
    );
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
