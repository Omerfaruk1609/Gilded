const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL && (process.env.DATABASE_URL.includes('supabase.co') || process.env.NODE_ENV === 'production') ? {
    rejectUnauthorized: false
  } : false
});

async function initDb() {
  const client = await pool.connect();
  try {
    // Admin hesabı kontrolü ve oluşturma
    const adminEmail = 'admin@gold.com';
    const adminPassword = '123456';
    const adminAd = 'Admin';

    const res = await client.query('SELECT * FROM users WHERE email = $1', [adminEmail]);
    const existingAdmin = res.rows[0];

    if (!existingAdmin) {
      const hashedPassword = bcrypt.hashSync(adminPassword, 10);
      await client.query(
        'INSERT INTO users (email, password, ad, role) VALUES ($1, $2, $3, $4)',
        [adminEmail, hashedPassword, adminAd, 'ADMIN']
      );
      console.log('✅ Admin hesabı oluşturuldu: admin@gold.com');
    } else {
      if (existingAdmin.role !== 'ADMIN') {
        await client.query('UPDATE users SET role = $1 WHERE email = $2', ['ADMIN', adminEmail]);
        console.log('⬆️ Mevcut hesap ADMIN rolüne yükseltildi: admin@gold.com');
      }
    }
  } catch (err) {
    console.error('Veritabanı başlatma hatası:', err);
  } finally {
    client.release();
  }
}

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool,
  initDb
};
