const express = require('express');
const router = express.Router();
const { db } = require('../db');
const { authMiddleware } = require('../authMiddleware');

// GET /api/stats  (dashboard overview)
router.get('/', authMiddleware, (req, res) => {
  try {
    const totalNewsletters = db.queryOne('SELECT COUNT(*) AS c FROM newsletters').c;
    const publishedNewsletters = db.queryOne('SELECT COUNT(*) AS c FROM newsletters WHERE published = 1').c;
    const totalSubscribers = db.queryOne('SELECT COUNT(*) AS c FROM subscribers').c;
    const activeSubscribers = db.queryOne('SELECT COUNT(*) AS c FROM subscribers WHERE status = "active"').c;
    const unsubscribed = db.queryOne('SELECT COUNT(*) AS c FROM subscribers WHERE status = "unsubscribed"').c;
    const totalCampaigns = db.queryOne('SELECT COUNT(*) AS c FROM campaigns').c;
    const sentCampaigns = db.queryOne('SELECT COUNT(*) AS c FROM campaigns WHERE status = "sent"').c;
    const totalEmailsSent = db.queryOne(
      "SELECT COALESCE(SUM(sent_count), 0) AS c FROM campaigns WHERE status = 'sent'"
    ).c;

    res.json({
      totalNewsletters,
      publishedNewsletters,
      draftNewsletters: totalNewsletters - publishedNewsletters,
      totalSubscribers,
      activeSubscribers,
      unsubscribed,
      totalCampaigns,
      sentCampaigns,
      totalEmailsSent,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
