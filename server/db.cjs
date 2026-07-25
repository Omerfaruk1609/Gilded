const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

let pool = null;

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
} else {
  console.error("❌ HATA: DATABASE_URL tanımlanmamış. PostgreSQL bağlantısı kurulamıyor.");
  process.exit(1);
}

// Veritabanını ilklendir (Tabloları kontrol et ve admin kullanıcısını oluştur)
async function initDb() {
  try {
    const client = await pool.connect();
    client.release();
    console.log('✅ PostgreSQL veritabanına başarıyla bağlandı.');
    
    // Veritabanı tablolarını schema.sql kullanarak oluştur/kontrol et
    const schemaPath = path.join(__dirname, 'schema.sql');
    if (fs.existsSync(schemaPath)) {
      const schemaSql = fs.readFileSync(schemaPath, 'utf8');
      // PostgreSQL üzerinde şemayı çalıştır
      await pool.query(schemaSql);
      console.log('✅ PostgreSQL tabloları kontrol edildi/oluşturuldu.');
    } else {
      console.warn('⚠️ Şema dosyası (schema.sql) bulunamadı.');
    }
  } catch (err) {
    console.error('❌ PostgreSQL başlatma/şema kurulum hatası:', err.message);
    process.exit(1);
  }

  // Yönetici hesabı kontrolü (sadece ortam değişkenleri tanımlıysa çalıştırılır)
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (adminEmail && adminPassword) {
    try {
      const res = await query('SELECT * FROM users WHERE email = $1', [adminEmail]);
      const existingAdmin = res.rows[0];

      if (!existingAdmin) {
        const hashedPassword = bcrypt.hashSync(adminPassword, 10);
        await query(
          'INSERT INTO users (email, password, ad, role) VALUES ($1, $2, $3, $4)',
          [adminEmail, hashedPassword, 'Admin', 'ADMIN']
        );
        console.log(`✅ Admin hesabı oluşturuldu: ${adminEmail}`);
      } else {
        if (existingAdmin.role !== 'ADMIN') {
          await query('UPDATE users SET role = $1 WHERE email = $2', ['ADMIN', adminEmail]);
          console.log(`⬆️ Mevcut hesap ADMIN rolüne yükseltildi: ${adminEmail}`);
        }
      }
    } catch (err) {
      console.error('❌ Veritabanı başlatma/admin kontrol hatası:', err);
    }
  }
}

// PostgreSQL sorgu metodu
async function query(text, params = []) {
  return pool.query(text, params);
}

module.exports = {
  query,
  pool,
  initDb
};
