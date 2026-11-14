require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const { init, getDb } = require('./src/db');

async function start() {
  await init();

  // Require routes AFTER the database is initialized so `const { db } = require('../db')`
  // in route modules resolves to the live instance.
  const authRoutes = require('./src/routes/auth');
  const newsletterRoutes = require('./src/routes/newsletters');
  const subscriberRoutes = require('./src/routes/subscribers');
  const campaignRoutes = require('./src/routes/campaigns');
  const statsRoutes = require('./src/routes/stats');

  const app = express();
  const PORT = process.env.PORT || 5000;

  app.use(cors({ origin: process.env.CLIENT_URL || '*', credentials: true }));
  app.use(express.json());

  // Health check
  app.get('/api/health', (req, res) => res.json({ ok: true }));

  // API routes
  app.use('/api/auth', authRoutes);
  app.use('/api/newsletters', newsletterRoutes);
  app.use('/api/subscribers', subscriberRoutes);
  app.use('/api/campaigns', campaignRoutes);
  app.use('/api/stats', statsRoutes);

  // 404 for API
  app.use('/api', (req, res) => res.status(404).json({ error: 'Not found' }));

  // Global error handler
  app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  });

  const server = app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });

  return { app, server };
}

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

module.exports = { init, getDb };
