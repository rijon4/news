const express = require('express');
const router = express.Router();
const { body, param, query, validationResult } = require('express-validator');
const { db } = require('../db');
const { sendMail } = require('../mail');
const { authMiddleware, requireRole } = require('../authMiddleware');

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// GET /api/campaigns  (list campaigns)
router.get(
  '/',
  authMiddleware,
  (req, res) => {
    try {
      const rows = db.query(
        `SELECT c.*, n.title AS newsletter_title, u.name AS created_by_name
         FROM campaigns c
         JOIN newsletters n ON c.newsletter_id = n.id
         JOIN users u ON c.created_by = u.id
         ORDER BY c.created_at DESC`
      );
      res.json({ campaigns: rows });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Server error' });
    }
  }
);

// GET /api/campaigns/:id  (campaign detail + email logs)
router.get(
  '/:id',
  authMiddleware,
  [param('id').isInt()],
  handleValidationErrors,
  (req, res) => {
    try {
      const id = Number(req.params.id);
      const campaign = db.queryOne('SELECT * FROM campaigns WHERE id = ?', [id]);
      if (!campaign) {
        return res.status(404).json({ error: 'Campaign not found' });
      }
      const logs = db.query('SELECT * FROM email_logs WHERE campaign_id = ? ORDER BY sent_at DESC', [id]);
      res.json({ campaign, logs });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Server error' });
    }
  }
);

// POST /api/campaigns  (create + send a campaign)
router.post(
  '/',
  authMiddleware,
  requireRole('admin', 'editor'),
  [
    body('newsletter_id').isInt().withMessage('newsletter_id is required'),
    body('subject').trim().notEmpty().withMessage('Subject is required'),
    body('test_only').optional().isBoolean(),
    body('test_email').optional().isEmail().withMessage('test_email must be valid when test_only is true'),
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const { newsletter_id, subject, test_only, test_email } = req.body;

      const newsletter = db.queryOne('SELECT * FROM newsletters WHERE id = ?', [newsletter_id]);
      if (!newsletter) {
        return res.status(404).json({ error: 'Newsletter not found' });
      }

      const insert = db.runWrite(
        `INSERT INTO campaigns (newsletter_id, subject, recipient_count, sent_count, status, created_by)
         VALUES (?, ?, 0, 0, 'draft', ?)`,
        [newsletter_id, subject, req.user.id]
      );
      const campaignId = insert.lastInsertRowid;

      if (test_only) {
        if (!test_email) {
          db.runWrite('DELETE FROM campaigns WHERE id = ?', [campaignId]);
          return res.status(400).json({ error: 'test_email is required for test_only' });
        }
        try {
          await sendMail({
            to: test_email,
            subject: `[TEST] ${subject}`,
            html: `
              <div style="font-family:system-ui,sans-serif;max-width:600px;padding:24px;">
                <h1 style="font-size:24px;margin:0 0 12px;">${escapeHtml(newsletter.title)}</h1>
                <div style="color:#555;">${escapeHtml(newsletter.summary || '')}</div>
                <div style="margin-top:20px;">${newsletter.content}</div>
                <hr style="margin:24px 0;border:none;border-top:1px solid #ddd;">
                <p style="color:#888;font-size:12px;">This is a test email from your Newsletter Platform.</p>
              </div>
            `,
          });
          db.runWrite(
            'UPDATE campaigns SET status = "sent", sent_count = 1, sent_at = CURRENT_TIMESTAMP WHERE id = ?',
            [campaignId]
          );
          db.runWrite(
            `INSERT INTO email_logs (campaign_id, subscriber_id, email, status, sent_at)
             VALUES (?, NULL, ?, 'sent', CURRENT_TIMESTAMP)`,
            [campaignId, test_email]
          );
          const campaign = db.queryOne('SELECT * FROM campaigns WHERE id = ?', [campaignId]);
          return res.status(201).json({ campaign, test: true, message: 'Test email sent' });
        } catch (err) {
          console.error(err);
          db.runWrite('UPDATE campaigns SET status = "failed" WHERE id = ?', [campaignId]);
          return res.status(500).json({ error: 'Failed to send test email' });
        }
      }

      // Full send to all active subscribers
      const subscribers = db.query('SELECT id, email FROM subscribers WHERE status = "active"');

      if (subscribers.length === 0) {
        db.runWrite('DELETE FROM campaigns WHERE id = ?', [campaignId]);
        return res.status(400).json({ error: 'No active subscribers to send to' });
      }

      db.runWrite('UPDATE campaigns SET recipient_count = ?, status = "sending" WHERE id = ?', [
        subscribers.length,
        campaignId,
      ]);

      // Insert pending email logs
      const insertLog = db.prepare(
        `INSERT INTO email_logs (campaign_id, subscriber_id, email, status, sent_at)
         VALUES (?, ?, ?, 'pending', CURRENT_TIMESTAMP)`
      );
      for (const sub of subscribers) {
        insertLog.bind([campaignId, sub.id, sub.email]);
        insertLog.step();
      }
      insertLog.free();

      // Send emails (track; continue on individual failures)
      let sentCount = 0;
      for (const sub of subscribers) {
        try {
          await sendMail({
            to: sub.email,
            subject,
            html: `
              <div style="font-family:system-ui,sans-serif;max-width:600px;padding:24px;">
                <h1 style="font-size:24px;margin:0 0 12px;">${escapeHtml(newsletter.title)}</h1>
                ${newsletter.summary ? `<div style="color:#555;margin-bottom:16px;">${escapeHtml(newsletter.summary)}</div>` : ''}
                <div style="margin-top:20px;">${newsletter.content}</div>
                <hr style="margin:24px 0;border:none;border-top:1px solid #ddd;">
                <p style="color:#888;font-size:12px;">
                  You received this because you subscribed to our newsletter.
                  <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/unsubscribe?email=${encodeURIComponent(
                    sub.email
                  )}" style="color:#888;">Unsubscribe</a>
                </p>
              </div>
            `,
          });
          db.runWrite(
            `UPDATE email_logs SET status = 'sent', sent_at = CURRENT_TIMESTAMP WHERE campaign_id = ? AND email = ?`,
            [campaignId, sub.email]
          );
          sentCount++;
        } catch (err) {
          console.error(`Failed to send to ${sub.email}:`, err.message);
          db.runWrite(
            `UPDATE email_logs SET status = 'failed', error = ? WHERE campaign_id = ? AND email = ?`,
            [err.message, campaignId, sub.email]
          );
        }
      }

      db.runWrite(
        `UPDATE campaigns SET sent_count = ?, status = 'sent', sent_at = CURRENT_TIMESTAMP WHERE id = ?`,
        [sentCount, campaignId]
      );

      const campaign = db.queryOne('SELECT * FROM campaigns WHERE id = ?', [campaignId]);
      res.status(201).json({
        campaign,
        sent: sentCount,
        total: subscribers.length,
        message: `Campaign sent to ${sentCount}/${subscribers.length} subscribers`,
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Server error' });
    }
  }
);

// DELETE /api/campaigns/:id
router.delete(
  '/:id',
  authMiddleware,
  requireRole('admin', 'editor'),
  [param('id').isInt()],
  handleValidationErrors,
  (req, res) => {
    try {
      const id = Number(req.params.id);
      const existing = db.queryOne('SELECT id FROM campaigns WHERE id = ?', [id]);
      if (!existing) {
        return res.status(404).json({ error: 'Campaign not found' });
      }
      db.runWrite('DELETE FROM email_logs WHERE campaign_id = ?', [id]);
      db.runWrite('DELETE FROM campaigns WHERE id = ?', [id]);
      res.json({ message: 'Campaign deleted' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Server error' });
    }
  }
);

function escapeHtml(unsafe) {
  if (!unsafe) return '';
  return String(unsafe)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

module.exports = router;
