const fs = require('fs');
const path = require('path');

/**
 * 🛡️ Otomatik Veritabanı Yedekleme (Madde 20: Otomatik Yedek)
 * SQLite / Veri dosyasını güvenli, web sunucusundan yalıtılmış bir backups dizinine tarihli kopyalar.
 */
function backupDatabase() {
  const dbPath = path.join(__dirname, '..', 'database.sqlite');
  const backupDir = path.join(__dirname, '..', 'backups');

  if (!fs.existsSync(dbPath)) {
    return { success: false, message: 'Veritabanı dosyası bulunamadı.' };
  }

  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupFileName = `backup-gilded-${timestamp}.sqlite`;
  const targetPath = path.join(backupDir, backupFileName);

  try {
    fs.copyFileSync(dbPath, targetPath);
    console.log(`✅ Güvenli Veritabanı Yedeği Alındı: ${backupFileName}`);
    return { success: true, file: backupFileName, path: targetPath };
  } catch (err) {
    console.error('❌ Veritabanı yedekleme hatası:', err.message);
    return { success: false, error: err.message };
  }
}

module.exports = { backupDatabase };
