const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, 'database.sqlite'));
db.pragma('foreign_keys = ON');

// Tabloları oluştur
db.exec(`
  CREATE TABLE IF NOT EXISTS posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    content TEXT NOT NULL,
    image_url TEXT DEFAULT NULL,
    post_type TEXT DEFAULT 'normal',
    author_id TEXT,
    support_count INTEGER DEFAULT 0,
    is_repaired BOOLEAN DEFAULT 0,
    is_anonymous BOOLEAN DEFAULT 0,
    category_id INTEGER DEFAULT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES wisdom_categories(id) ON DELETE SET NULL
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS wisdom_categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    created_by TEXT
  )
`);

try {
  db.exec("ALTER TABLE wisdom_categories ADD COLUMN created_by TEXT");
} catch (e) {}

// Mevcut kategorileri temizle (İstek üzerine)
db.exec('DELETE FROM wisdom_categories');
db.exec('DELETE FROM follows');

db.exec(`
  CREATE TABLE IF NOT EXISTS follows (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    category_id INTEGER NOT NULL,
    UNIQUE(user_id, category_id),
    FOREIGN KEY (category_id) REFERENCES wisdom_categories(id) ON DELETE CASCADE
  )
`);

// Varsayılan kategorileri eklemiyoruz

try {
  db.exec("ALTER TABLE posts ADD COLUMN post_type TEXT DEFAULT 'normal'");
} catch (e) {}

try {
  db.exec("ALTER TABLE posts ADD COLUMN category_id INTEGER DEFAULT NULL");
} catch (e) {}

db.exec(`
  CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    type TEXT NOT NULL,
    post_id INTEGER NOT NULL,
    is_read BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    post_id INTEGER NOT NULL,
    content TEXT NOT NULL,
    author_id TEXT,
    parent_id INTEGER DEFAULT NULL,
    score INTEGER DEFAULT 0,
    is_anonymous BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (post_id) REFERENCES posts (id) ON DELETE CASCADE,
    FOREIGN KEY (parent_id) REFERENCES comments (id) ON DELETE CASCADE
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS supports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    post_id INTEGER NOT NULL,
    user_id TEXT NOT NULL,
    UNIQUE(post_id, user_id),
    FOREIGN KEY (post_id) REFERENCES posts (id) ON DELETE CASCADE
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    ad TEXT NOT NULL,
    role TEXT DEFAULT 'user',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

const bcrypt = require('bcryptjs');

// Admin hesabı kontrolü ve oluşturma
const adminEmail = 'admin@gold.com';
const adminPassword = '123456';
const adminAd = 'Admin';

const existingAdmin = db.prepare('SELECT * FROM users WHERE email = ?').get(adminEmail);

if (!existingAdmin) {
  const hashedPassword = bcrypt.hashSync(adminPassword, 10);
  db.prepare('INSERT INTO users (email, password, ad, role) VALUES (?, ?, ?, ?)')
    .run(adminEmail, hashedPassword, adminAd, 'ADMIN');
  console.log('✅ Admin hesabı oluşturuldu: admin@gold.com');
} else {
  // Eğer kullanıcı varsa ama rolü admin değilse güncelle
  if (existingAdmin.role !== 'ADMIN') {
    db.prepare('UPDATE users SET role = ? WHERE email = ?').run('ADMIN', adminEmail);
    console.log('⬆️ Mevcut hesap ADMIN rolüne yükseltildi: admin@gold.com');
  }
}

module.exports = db;
