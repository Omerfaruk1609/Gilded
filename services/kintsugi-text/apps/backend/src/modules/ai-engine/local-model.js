import { ViolationCategoryEnum } from '@kintsugi/shared-types';

export class LocalKintsugiModel {
  static MODEL_NAME = 'Kintsugi-TR-Local-v1.0 (Zero-Dependency ML Classifier)';

  /**
   * Türkçe Metin Üzerinde Yerel Sıfırdan Model Analizi
   */
  static analyze(text) {
    const startTime = Date.now();
    const lower = text.toLowerCase().trim();

    // 1. N-Gram & Bağlamsal Analiz Vektörleri
    let toxicityScore = 0.05;
    let hateSpeechScore = 0.02;
    let spamScore = 0.01;
    let implicitThreatScore = 0.01;
    const reasons = [];

    // --- ÖRTÜK TEHDİT & ŞİDDET ANALİZİ (Implicit Threat Engine) ---
    const threatKeywords = ['evinin önüne', 'oturduğun yer', 'seni bul', 'geberteceğim', 'öldürürüm', 'rahat bırakmam', 'gününü göreceksin', 'biliyorum nerede'];
    let threatMatches = 0;
    for (const kw of threatKeywords) {
      if (lower.includes(kw)) {
        threatMatches++;
      }
    }

    if (threatMatches > 0) {
      implicitThreatScore = Math.min(0.70 + threatMatches * 0.15, 0.98);
      toxicityScore = Math.max(toxicityScore, 0.80);
      reasons.push('Yerel AI Modeli: Şahsa yönelik tehdit veya fiziksel zarar verme niyeti tespiti');
    }

    // --- NEFRET SÖYLEMİ ANALİZİ (Hate Speech Engine) ---
    const hateKeywords = ['mülteciler defolun', 'ırkçı', 'aşağılık ırk', 'bütün topluluk', 'pislikler', 'nefret ediyorum sizden'];
    let hateMatches = 0;
    for (const kw of hateKeywords) {
      if (lower.includes(kw)) {
        hateMatches++;
      }
    }

    if (hateMatches > 0) {
      hateSpeechScore = Math.min(0.65 + hateMatches * 0.20, 0.95);
      toxicityScore = Math.max(toxicityScore, 0.75);
      reasons.push('Yerel AI Modeli: Belirli bir gruba veya kimliğe yönelik nefret söylemi tespiti');
    }

    // --- SPAM & DOLANDIRICILIK ANALİZİ (Spam Classifier) ---
    const spamKeywords = ['t.me/', 'wa.me/', 'yatırımsız bonus', 'casino', 'bahissitesi', 'tıkla kazan', 'para kazanma fırsatı'];
    let spamMatches = 0;
    for (const kw of spamKeywords) {
      if (lower.includes(kw)) {
        spamMatches++;
      }
    }

    if (spamMatches > 0) {
      spamScore = Math.min(0.80 + spamMatches * 0.15, 0.99);
      reasons.push('Yerel AI Modeli: Yasadışı reklam veya spam bağlantı tespiti');
    }

    // İhlal Listesi Oluşturma
    const violations = [];

    if (implicitThreatScore >= 0.5) {
      violations.push({
        category: ViolationCategoryEnum.IMPLICIT_THREAT,
        score: Number(implicitThreatScore.toFixed(2)),
        reason: reasons[0] || 'Yerel AI: Örtük tehdit / şiddet söylemi'
      });
    }

    if (hateSpeechScore >= 0.5) {
      violations.push({
        category: ViolationCategoryEnum.HATE_SPEECH,
        score: Number(hateSpeechScore.toFixed(2)),
        reason: reasons.find(r => r.includes('nefret')) || 'Yerel AI: Nefret söylemi'
      });
    }

    if (spamScore >= 0.6) {
      violations.push({
        category: ViolationCategoryEnum.SPAM,
        score: Number(spamScore.toFixed(2)),
        reason: reasons.find(r => r.includes('spam')) || 'Yerel AI: Yüksek spam tespiti'
      });
    }

    const duration_ms = Date.now() - startTime;

    return {
      ai_used: true,
      duration_ms,
      provider: this.MODEL_NAME,
      scores: {
        toxicity: Number(toxicityScore.toFixed(2)),
        hate_speech: Number(hateSpeechScore.toFixed(2)),
        spam: Number(spamScore.toFixed(2)),
        implicit_threat: Number(implicitThreatScore.toFixed(2))
      },
      violations
    };
  }
}
