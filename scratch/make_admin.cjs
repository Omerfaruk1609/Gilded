const db = require('../server/db.cjs');

async function run() {
  try {
    await db.initDb();
    
    // SQLite/PostgreSQL uyumlu tekil query metodunu kullanalım
    const result = await db.query('SELECT * FROM users ORDER BY id ASC LIMIT 1');
    const user = result.rows[0];
    
    if (user) {
      await db.query('UPDATE users SET role = $1 WHERE id = $2', ['ADMIN', user.id]);
      console.log(`User ${user.email} is now an ADMIN.`);
    } else {
      console.log('No users found in database. Please register a user first.');
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    if (db.pool) {
      await db.pool.end();
    }
    process.exit(0);
  }
}

run();
