/**
 * Yerel Moderasyon Algoritması
 * Hackathon sunumu için API anahtarı gerektirmeyen, 
 * kelime bazlı duygu durum koruma filtresi.
 */

const TOXIC_PHRASES = [
  // Alaycı ve Küçümseyici
  'saçma', 'gereksiz', 'boş yapma', 'boş konuşma', 'abartma', 'ilgi meraklısı', 'prim yapma', 
  'geç bunları', 'kimin umrunda', 'banane', 'bana ne', 'çok da tın', 'yalan söylüyorsun',
  
  // Olumsuz/Yıkıcı Eleştiri
  'berbat', 'rezil', 'çirkin', 'kötü görünüyorsun', 'beceriksiz', 'yapamazsın', 'imkansız',
  
  // Hassas Durumlarda Kaçınılması Gereken Kırıcı İfadeler
  'öl', 'geber', 'intihar', 'kendini öldür', 'zayıfsın', 'güçsüzsün', 'ezik',
  
  // Topluluk Ruhuna Aykırı
  'sana müstahak', 'iyi olmuş', 'hak etmişsin', 'beter ol'
];

/**
 * Yorumun içeriğini analiz eder.
 * @param {string} text - Analiz edilecek metin
 * @returns {Promise<string>} - 'APPROVE' veya 'REJECT'
 */
async function analyzeComment(text) {
  if (!text) return "APPROVE";

  const normalizedText = text.toLowerCase().trim();

  // Türkçe karakterleri de içeren kelime sınırı tanımları
  const boundaryStart = '(?<=^|[^a-zıışğüöçA-ZİIŞĞÜÖÇ0-9])';
  const boundaryEnd = '(?=$|[^a-zıışğüöçA-ZİIŞĞÜÖÇ0-9])';

  // 1. Kelime bazlı kontrol (Regex ile tam kelime eşleşmesi)
  for (const phrase of TOXIC_PHRASES) {
    const regex = new RegExp(`${boundaryStart}${phrase}${boundaryEnd}`, 'i');
    
    if (regex.test(normalizedText)) {
      console.log(`Moderasyon: [${phrase}] kelimesi nedeniyle yorum reddedildi.`);
      return "REJECT";
    }
  }

  return "APPROVE";
}

module.exports = { analyzeComment };
