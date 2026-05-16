const db = require('../server/db.cjs');

try {
  // If no user is specified, let's just make the first user an admin
  const user = db.prepare('SELECT * FROM users LIMIT 1').get();
  if (user) {
    db.prepare('UPDATE users SET role = ? WHERE id = ?').run('ADMIN', user.id);
    console.log(`User ${user.email} is now an ADMIN.`);
  } else {
    console.log('No users found in database. Please register a user first.');
  }
} catch (error) {
  console.error('Error:', error);
}
