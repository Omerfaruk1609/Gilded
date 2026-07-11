const { GoogleGenAI } = require('@google/generative-ai');

// Yerel Bilgelik Kütüphanesi (Çevrimdışı/API Yokken Çalışacak Fallback)
const LOCAL_WISDOM = {
  'Kırgın': {
    philosopher: 'Marcus Aurelius (Stoacı İmparator)',
    quote: '“İncinmeyi reddettiğin zaman, incinmiş hissetmezsin. İncinmiş hissetmediğinde ise yara kendiliğinden kaybolur.”',
    advice: 'Başkalarının davranışları senin iç huzurunu belirlememeli. Kırgınlık, sana zarar verenlerin değil, senin o olaya verdiğin değerin bir yansımasıdır. Kendini serbest bırak ve yarayı altın dikişle kapat.'
  },
  'Yorgun': {
    philosopher: 'Lao Tzu (Taoizm Kurucusu)',
    quote: '“Doğa acele etmez, yine de her şey vaktinde başarılır. Su gibi ol; yavaş ama önlenemez.”',
    advice: 'Hayatın akışına direnmek ve her şeyi bir anda çözmeye çalışmak yorar. Bugün dinlenmek ve yavaşlamak bir zayıflık değil, güç toplama sürecidir. Akışa güven.'
  },
  'Üzgün': {
    philosopher: 'Mevlana Celaleddin-i Rumi (Tasavvuf Bilgesi)',
    quote: '“Yaraların, ışığın içeri sızdığı yerdir. Kırıldığın yerden daha güzel bir şekilde onarılacaksın.”',
    advice: 'Üzüntü, ruhunun kintsugi sürecine hazırlandığı andır. Kırılmaların seni değersiz yapmaz; aksine seni daha derin, bilge ve parıltılı bir ruh haline getirmek için birer kapıdır.'
  },
  'Öfkeli': {
    philosopher: 'Seneca (Stoacı Filozof)',
    quote: '“Öfke, hedef aldığı hedeften ziyade, içinde bulunduğu kabı eriten ve tahrip eden bir asittir.”',
    advice: 'Öfke anlık bir çılgınlıktır. Seni öfkelendiren olaya tepki vermeden önce derin bir nefes al ve zihnini sakinleştir. Kontrol edemeyeceğin şeyler için kendi ruhunu yıpratma.'
  },
  'Umutlu': {
    philosopher: 'Seneca (Stoacı Filozof)',
    quote: '“Umut varsa, yaşamın her anı altın bir dikişle değer kazanmaya hazır demektir. Yarınlar, bugünün sabrıyla işlenir.”',
    advice: 'İçindeki umut tohumu, kintsugi felsefesinin kalbidir. Şu an yaşadığın zorluk ne olursa olsun, geleceğe inancın ve attığın altın dikişler seni eskisinden çok daha güçlü kılacaktır.'
  },
  'Varsayılan': {
    philosopher: 'Socrates (Klasik Yunan Filozofu)',
    quote: '“Sorgulanmamış bir hayat yaşanmaya değer değildir. Acıların ve kırıklıkların seni bilgeliğe götüren yoldaki basamaklardır.”',
    advice: 'Zorluklar, zihnini eğitmek ve kim olduğunu keşfetmek için harika fırsatlardır. Bu zor anı bir engel olarak değil, bir öğrenme süreci olarak değerlendir.'
  }
};

/**
 * Gönderinin his durumuna veya içeriğine göre felsefi öğüt üretir.
 * @param {string} content - Gönderi içeriği
 * @param {string} mood - Gönderinin his durumu (Kırgın, Yorgun vb.)
 * @returns {Promise<{philosopher: string, quote: string, advice: string}>}
 */
async function generatePhilosopherWisdom(content, mood) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (apiKey) {
    try {
      // @google/generative-ai paketiyle GoogleGenAI / GoogleGenerativeAI ilklendirmesi
      // Not: package.json'da import ettiğimiz sürüme uygun olarak GoogleGenAI veya GoogleGenerativeAI kullanılabilir.
      // Modül yapısına göre uyarlayalım:
      const { GoogleGenerativeAI } = require('@google/generative-ai');
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

      const prompt = `
        Sen kadim bir kintsugi bilgesi ve filozofsun.
        Bir kullanıcının platformda paylaştığı şu acıyı/derdi oku:
        "${content}"
        
        Kullanıcının bu dertteki his durumu: "${mood || 'Belirtilmemiş'}"

        Lütfen bu derde yönelik olarak:
        1. Tarihteki ünlü bir filozoftan (Stoacılar, Rumi, Doğu felsefesi vb.) tam uyumlu ve teselli edici bir söz seç.
        2. Bu alıntının bu derde nasıl merhem olacağını kintsugi felsefesiyle harmanlayarak 2-3 cümleyle açıkla.
        
        Yanıtı kesinlikle şu JSON formatında dön:
        {
          "philosopher": "Filozofun İsmi",
          "quote": "“Filozofun Sözü”",
          "advice": "Derde özel kintsugi açıklaması ve felsefi tavsiye."
        }
        JSON formatı dışında hiçbir şey yazma. Markdown kod blokları veya ekstra açıklamalar ekleme.
      `;

      const result = await model.generateContent(prompt);
      const responseText = result.response.text().trim();
      
      // JSON temizleme (bazen model ```json ... ``` şeklinde sarabiliyor)
      const cleanJsonStr = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleanJsonStr);

      if (parsed.philosopher && parsed.quote && parsed.advice) {
        return parsed;
      }
    } catch (err) {
      console.warn('⚠️ Gemini API çağrısı başarısız oldu, yerel kütüphaneye geçiliyor:', err.message);
    }
  }

  // Fallback: Yerel kütüphaneyi kullan
  const selectedMood = mood && LOCAL_WISDOM[mood] ? mood : 'Varsayılan';
  return LOCAL_WISDOM[selectedMood];
}

module.exports = { generatePhilosopherWisdom };
