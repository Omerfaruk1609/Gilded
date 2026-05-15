const FORBIDDEN_WORDS = [
  'amk', 'aq', 'sg', 'siktir', 'oç', 'orospu', 'piç', 'yavşak', 'göt',
  'salak', 'aptal', 'mal', 'gerizekalı', 'amcık', 'sik', 'yarrak'
];

function containsProfanity(text) {
  if (!text) return false;
  const normalizedText = text.toLowerCase().replace(/[.,!?]/g, '');
  const words = normalizedText.split(/\s+/);

  for (const word of words) {
    if (FORBIDDEN_WORDS.includes(word)) {
      return true;
    }
  }

  // Daha geniş bir arama için: kelime içinde geçiyor mu?
  for (const forbidden of FORBIDDEN_WORDS) {
    if (normalizedText.includes(forbidden)) {
      // Çok katı olabilir, kelime başı/sonu sınırlarına bakmak daha iyi olabilir.
      // Şimdilik RegExp ile tam eşleşme kontrolü:
      const regex = new RegExp(`\\b${forbidden}\\b`, 'i');
      if (regex.test(normalizedText)) {
        return true;
      }
    }
  }

  return false;
}

module.exports = {
  containsProfanity
};
