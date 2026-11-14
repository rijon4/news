const { init, getDb, dbPath } = require('./src/db');
const fs = require('fs');
const bcrypt = require('bcryptjs');

(async () => {
  await init();
  const db = getDb();

  const users = [
    { email: 'admin@example.com', password: 'admin123', name: 'Admin User', role: 'admin' },
    { email: 'editor@example.com', password: 'editor123', name: 'Editor User', role: 'editor' },
  ];

  const saltRounds = Number(process.env.BCRYPT_SALT_ROUNDS) || 10;
  for (const u of users) {
    const hash = bcrypt.hashSync(u.password, saltRounds);
    // use bind+step (sql.js v1 requires an array of params)
    const stmt = db.prepare(
      'INSERT OR IGNORE INTO users (email, password_hash, name, role) VALUES (?, ?, ?, ?)'
    );
    stmt.bind([u.email, hash, u.name, u.role]);
    stmt.step();
    stmt.free();
  }

  // Persist explicitly so the file is written before this process exits.
  const data = db.export();
  fs.writeFileSync(dbPath, data);

  console.log('Seed complete.');
  console.log('Admin:    admin@example.com / admin123');
  console.log('Editor:   editor@example.com / editor123');
  process.exit(0);
})();
