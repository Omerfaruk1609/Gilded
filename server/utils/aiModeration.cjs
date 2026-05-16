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

  // 1. Kelime bazlı kontrol (Regex ile tam kelime eşleşmesi)
  for (const phrase of TOXIC_PHRASES) {
    // Kelime sınırlarını (\b) kullanarak "saçma"yı bulup "saçmalamak" gibi 
    // geçerli kelimeleri engellememeye çalışıyoruz.
    const regex = new RegExp(`\\b${phrase}\\b`, 'i');
    
    if (regex.test(normalizedText)) {
      console.log(`Moderasyon: [${phrase}] kelimesi nedeniyle yorum reddedildi.`);
      return "REJECT";
    }
  }

  // 2. Basit Karakter Bazlı Kontrol (Örn: Çok fazla ünlem veya büyük harf bağırma hissi verebilir)
  // Hackathon'da anlatmak için güzel bir detay:
  if (text === text.toUpperCase() && text.length > 10) {
    // Sadece büyük harfle yazılan uzun cümleler agresif algılanabilir
    // return "REJECT"; // Bu çok katı olabilir, şimdilik kapalı.
  }

  return "APPROVE";
}

module.exports = { analyzeComment };
