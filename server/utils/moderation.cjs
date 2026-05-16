const FORBIDDEN_WORDS = [
  'amk', 'aq', 'sg', 'siktir', 'oç', 'orospu', 'piç', 'yavşak', 'göt',
  'salak', 'aptal', 'mal', 'gerizekalı', 'amcık', 'sik', 'yarrak'
];

function containsProfanity(text) {
  if (!text) return false;
  const normalizedText = text.toLowerCase().trim();

  for (const forbidden of FORBIDDEN_WORDS) {
    // Kelimenin harfleri arasına gelebilecek olası karakterleri (nokta, boşluk, alt tire vb.) yakalayan regex
    // Örn: "k.ü.f.ü.r", "k ü f ü r", "k_ü_f_u_r" gibi varyasyonları yakalar.
    const pattern = forbidden.split('').join('[\\s._-]*');
    const regex = new RegExp(`\\b${pattern}\\b`, 'i');
    
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
