const FORBIDDEN_WORDS = [
  'amk', 'aq', 'sg', 'siktir', 'oç', 'orospu', 'piç', 'yavşak', 'göt',
  'salak', 'aptal', 'mal', 'gerizekalı', 'amcık', 'sik', 'yarrak'
];

function containsProfanity(text) {
  if (!text) return false;
  const normalizedText = text.toLowerCase().trim();

  // Türkçe karakterleri de içeren kelime sınırı tanımları
  const boundaryStart = '(?<=^|[^a-zıışğüöçA-ZİIŞĞÜÖÇ0-9])';
  const boundaryEnd = '(?=$|[^a-zıışğüöçA-ZİIŞĞÜÖÇ0-9])';

  for (const forbidden of FORBIDDEN_WORDS) {
    // Kelimenin harfleri arasına gelebilecek olası karakterleri (nokta, boşluk, alt tire vb.) yakalayan regex
    const pattern = forbidden.split('').join('[\\s._-]*');
    const regex = new RegExp(`${boundaryStart}${pattern}${boundaryEnd}`, 'i');
    
    if (regex.test(normalizedText)) {
      console.log(`Küfür filtresi: [${forbidden}] tespit edildi.`);
      return true;
    }
  }

  return false;
}

module.exports = {
  containsProfanity
};
