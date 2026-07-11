const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

let pool = null;
let sqliteDb = null;
let useSqlite = false;

// PostgreSQL bağlantı havuzunu ayarla (URL varsa)
if (process.env.DATABASE_URL) {
  let dbUrl = process.env.DATABASE_URL.trim();
  // Şifrenin sonunda yanlışlıkla kalmış olabilecek :@ karakterini temizle
  if (dbUrl.includes(':@')) {
    dbUrl = dbUrl.replace(':@', '@');
  }

  pool = new Pool({
    connectionString: dbUrl,
    ssl: dbUrl.includes('supabase.co') || process.env.NODE_ENV === 'production' ? {
      rejectUnauthorized: false
    } : false
  });
}

// Yerel SQLite veritabanını ilklendir
function initSqlite() {
  console.log('⚠️ Supabase bağlantısı pasif veya başarısız. Yerel SQLite veritabanına geçiliyor...');
  useSqlite = true;
  const Database = require('better-sqlite3');
  const dbPath = path.join(__dirname, 'database.sqlite');
  
  sqliteDb = new Database(dbPath);
  
  // Yabancı anahtar (Foreign Key) kısıtlamalarını etkinleştir
  sqliteDb.pragma('foreign_keys = ON');

  // Şemayı oku ve tabloları oluştur
  try {
    const schemaPath = path.join(__dirname, 'schema.sql');
    if (fs.existsSync(schemaPath)) {
      const schemaSql = fs.readFileSync(schemaPath, 'utf8');
      
      // PostgreSQL şemasını SQLite uyumlu hale getir
      const sqliteSchema = schemaSql
        .replace(/SERIAL PRIMARY KEY/gi, 'INTEGER PRIMARY KEY AUTOINCREMENT')
        .replace(/TIMESTAMP WITH TIME ZONE/gi, 'TIMESTAMP')
        .replace(/BOOLEAN DEFAULT FALSE/gi, 'INTEGER DEFAULT 0')
        .replace(/BOOLEAN DEFAULT TRUE/gi, 'INTEGER DEFAULT 1')
        .replace(/VARCHAR\(\d+\)/gi, 'TEXT')
        .replace(/character varying\(\d+\)/gi, 'TEXT');
      
      // Tüm şemayı çalıştır
      sqliteDb.exec(sqliteSchema);
      console.log('✅ Yerel SQLite tabloları kontrol edildi/oluşturuldu.');
    } else {
      console.warn('⚠️ Şema dosyası (schema.sql) bulunamadı, SQLite tabloları otomatik oluşturulamadı.');
    }
  } catch (err) {
    console.error('❌ Yerel SQLite şema kurulum hatası:', err);
  }
}

// Veritabanını ilklendir (İlk çalışma ve admin kullanıcısı)
async function initDb() {
  if (pool) {
    try {
      const client = await pool.connect();
      client.release();
      console.log('✅ Supabase PostgreSQL veritabanına başarıyla bağlandı.');
    } catch (err) {
      console.error('❌ PostgreSQL bağlantısı kurulamadı:', err.message);
      initSqlite();
    }
  } else {
    initSqlite();
  }

  // Yönetici hesabı kontrolü ve oluşturma
  const adminEmail = 'admin@gold.com';
  const adminPassword = '123456';
  const adminAd = 'Admin';

  try {
    const res = await query('SELECT * FROM users WHERE email = $1', [adminEmail]);
    const existingAdmin = res.rows[0];

    if (!existingAdmin) {
      const hashedPassword = bcrypt.hashSync(adminPassword, 10);
      await query(
        'INSERT INTO users (email, password, ad, role) VALUES ($1, $2, $3, $4)',
        [adminEmail, hashedPassword, adminAd, 'ADMIN']
      );
      console.log('✅ Admin hesabı oluşturuldu: admin@gold.com');
    } else {
      if (existingAdmin.role !== 'ADMIN') {
        await query('UPDATE users SET role = $1 WHERE email = $2', ['ADMIN', adminEmail]);
        console.log('⬆️ Mevcut hesap ADMIN rolüne yükseltildi: admin@gold.com');
      }
    }
  } catch (err) {
    console.error('❌ Veritabanı başlatma/admin kontrol hatası:', err);
  }
}

// PostgreSQL ve SQLite uyumlu dinamik sorgu metodu
async function query(text, params = []) {
  if (useSqlite) {
    // PostgreSQL uyumlu bazı kısımları SQLite'a çevir
    let sqliteText = text.replace(/::int/gi, '');
    
    // PostgreSQL $1, $2 parametrelerini SQLite ? parametrelerine çevir
    sqliteText = sqliteText.replace(/\$\d+/g, '?');

    try {
      const stmt = sqliteDb.prepare(sqliteText);
      let rows = [];

      // SELECT veya RETURNING içeren sorgularda veri okumak için .all() kullan
      if (/select|returning/i.test(sqliteText)) {
        rows = stmt.all(params);
      } else {
        const info = stmt.run(params);
        rows = [];
      }

      return {
        rows: rows || [],
        rowCount: rows ? rows.length : 0
      };
    } catch (err) {
      console.error('❌ SQLite Sorgu Hatası:', err.message, '\nSorgu:', sqliteText, '\nParametreler:', params);
      throw err;
    }
  } else {
    return pool.query(text, params);
  }
}

module.exports = {
  query,
  pool,
  initDb
};
