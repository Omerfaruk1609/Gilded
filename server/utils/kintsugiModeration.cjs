/**
 * 🏮 KintsugiText Moderation Client & Hybrid Engine
 * 
 * Provides direct integration with the KintsugiText microservice (Tier-1 Deterministic + Tier-2 AI)
 * with an ultra-fast local fallback engine (TurkishTextNormalizer + Regex Rules)
 * ensuring 100% uptime and sub-millisecond moderation even if the microservice is offline.
 */

const axios = require('axios');
require('dotenv').config();

const KINTSUGI_API_URL = process.env.KINTSUGI_API_URL || 'http://localhost:4000';
const KINTSUGI_API_KEY = process.env.KINTSUGI_API_KEY || 'kt_live_gilded_space_key_2026';
const KINTSUGI_TIMEOUT_MS = parseInt(process.env.KINTSUGI_TIMEOUT_MS || '2000', 10);

// --- Local Tier-1 Fallback Engine ---

class LocalTurkishTextNormalizer {
  static LEET_MAP = {
    '0': 'o',
    '1': 'i',
    '3': 'e',
    '4': 'a',
    '5': 's',
    '7': 't',
    '@': 'a',
    '$': 's'
  };

  /**
   * Metni leetspeak, gizli karakterler, noktalama hileleri ve tekrarlayan harflerden arındırır.
   */
  static normalize(rawText) {
    if (!rawText) return '';

    // 0. Zero-width karakterleri ve görünmeyen Unicode'ları temizle
    let text = rawText.replace(/[\u200B-\u200D\uFEFF]/g, '');

    // 1. Türkçe karakter küçültme ve combining dot temizliği
    text = text
      .replace(/İ/g, 'i')
      .replace(/I/g, 'ı')
      .toLocaleLowerCase('tr-TR')
      .replace(/\u0307/g, '')
      .trim();

    // 2. Leetspeak dönüşümü (s4l4m -> salam, @ -> a, $ -> s)
    text = text.replace(/[013457@$]/g, (match) => this.LEET_MAP[match] || match);

    // 3. Kelime içi noktalama hileleri: 's.i.k.t.i.r' -> 'siktir', 'a.m.k' -> 'amk'
    text = text.replace(/([a-zçğıöşü0-9])[.\-_*~|/]+(?=[a-zçğıöşü0-9])/gi, '$1');

    // 4. Tek harf ayrık yazım hilesi: 's i k t i r' -> 'siktir', 'a m k' -> 'amk'
    text = text.replace(/(?:^|\s)([a-zçğıöşü0-9])\s+([a-zçğıöşü0-9])\s+([a-zçğıöşü0-9])(?:\s+([a-zçğıöşü0-9]))?(?:\s+([a-zçğıöşü0-9]))?(?:\s+([a-zçğıöşü0-9]))?(?=\s|$)/gi, 
      (match, p1, p2, p3, p4, p5, p6) => [p1, p2, p3, p4, p5, p6].filter(Boolean).join('')
    );

    // 5. 2'den fazla ardışık tekrarları 1'e düşür (amkkkk -> amk, salaaak -> salak)
    text = text.replace(/([a-zçğıöşü0-9])\1{2,}/gu, '$1');

    return text;
  }
}


// Türkçe karakter sınırları ve yaygın yapım/çekim eki yakalayıcı
const BOUNDARY_START = '(?<=^|[^a-zıişğüöç0-9])';
const BOUNDARY_END = '(?:(?:ler|lar|dir|dır|dur|dür|sin|sın|sun|sün|siniz|sınız|imiz|ımız|in|ın|un|ün|e|a|den|dan|de|da|i|ı|u|ü|ca|ce|lik|lık|luk|lük|ça|çe|cı|ci|cu|cü)*)(?=[^a-zıişğüöç0-9]|$)';

// KintsugiText Gilded Core Kural Seti (Yerel Fallback)
const FALLBACK_RULES = [
  {
    id: 'rule_profanity_gilded_core',
    pattern: new RegExp(
      `${BOUNDARY_START}(amk|aq|sg|siktir|o\\s*ç|orospu|piç|yavşak|göt|salak|aptal|mal|gerizekalı|amcık|sik|yarrak|şerefsiz)${BOUNDARY_END}`,
      'i'
    ),
    category: 'PROFANITY',
    score: 0.90,
    reason: 'Küfür, hakaret veya argo ifade tespit edildi.'
  },
  {
    id: 'rule_gilded_sanctuary_toxic',
    pattern: new RegExp(
      `${BOUNDARY_START}(boş\\s*yapma|boş\\s*konuşma|ilgi\\s*meraklısı|prim\\s*yapma|geç\\s*bunları|kimin\\s*umrunda|bana\\s*ne|banane|çok\\s*da\\s*tın|yalan\\s*söylüyorsun|beceriksiz|yapamazsın|zayıfsın|güçsüzsün|ezik|sana\\s*müstahak|iyi\\s*olmuş|hak\\s*etmişsin|beter\\s*ol)${BOUNDARY_END}`,
      'i'
    ),
    category: 'TOXICITY',
    score: 0.85,
    reason: 'Topluluk destek ruhuna aykırı, alaycı ve küçümseyici ifade tespit edildi.'
  },
  {
    id: 'rule_gilded_self_harm_threat',
    pattern: new RegExp(
      `${BOUNDARY_START}(kendini\\s*öldür|intihar|geber|geberteceğim|öldürürüm)${BOUNDARY_END}`,
      'i'
    ),
    category: 'IMPLICIT_THREAT',
    score: 0.95,
    reason: 'Kendine veya başkasına zarar verme / tehdit tespiti.'
  },
  {
    id: 'rule_spam_gambling',
    pattern: new RegExp(
      `${BOUNDARY_START}(bahis|casino|bonus|bet[0-9]|kumar|deneme\\s*bonusu|yatırımsız\\s*bonus)${BOUNDARY_END}`,
      'i'
    ),
    category: 'SPAM',
    score: 0.95,
    reason: 'Yasadışı bahis veya spam reklam tespit edildi.'
  },
  {
    id: 'rule_hate_speech_tr',
    pattern: new RegExp(
      `${BOUNDARY_START}(ırkçı|mülteci\\s*düşmanı|nefret\\s*söylemi|defolun\\s*gidin|yaşamaya\\s*hakkı\\s*yok)${BOUNDARY_END}`,
      'i'
    ),
    category: 'HATE_SPEECH',
    score: 0.85,
    reason: 'Topluluk kurallarına aykırı nefret söylemi tespit edildi.'
  }
];


/**
 * Yerel Kural Değerlendirme (Fallback)
 */
function evaluateLocally(text) {
  if (!text) {
    return {
      isClean: true,
      verdict: 'APPROVED',
      riskScore: 0,
      sanitizedText: '',
      violations: [],
      source: 'LOCAL_FALLBACK'
    };
  }

  const normalized = LocalTurkishTextNormalizer.normalize(text);
  const violations = [];
  let maxScore = 0;

  for (const rule of FALLBACK_RULES) {
    if (rule.pattern.test(normalized) || rule.pattern.test(text.toLowerCase())) {
      violations.push({
        category: rule.category,
        score: rule.score,
        reason: rule.reason
      });
      if (rule.score > maxScore) maxScore = rule.score;
    }
  }

  const riskScore = Math.round(maxScore * 100);
  const isRejected = riskScore >= 80;

  return {
    isClean: !isRejected,
    verdict: isRejected ? 'REJECTED' : (riskScore >= 50 ? 'FLAGGED_FOR_REVIEW' : 'APPROVED'),
    riskScore,
    reason: violations.length > 0 ? violations[0].reason : null,
    category: violations.length > 0 ? violations[0].category : null,
    violations,
    sanitizedText: normalized,
    source: 'LOCAL_FALLBACK'
  };
}

/**
 * Ana İçerik Moderasyon Fonksiyonu (KintsugiText API -> Yerel Fallback)
 * 
 * @param {string} text - Denetlenecek metin
 * @param {object} [options] - Opsiyonel parametreler { force_ai, threshold }
 * @returns {Promise<{ isClean: boolean, verdict: string, riskScore: number, reason: string|null, category: string|null, sanitizedText: string, source: string }>}
 */
async function moderateText(text, options = {}) {
  if (!text || typeof text !== 'string') {
    return {
      isClean: true,
      verdict: 'APPROVED',
      riskScore: 0,
      reason: null,
      category: null,
      sanitizedText: '',
      source: 'NO_OP'
    };
  }

  // 1. KintsugiText API'sine çağrı yapmayı dene
  try {
    const response = await axios.post(
      `${KINTSUGI_API_URL}/api/v1/moderate`,
      {
        text,
        force_ai: options.force_ai || false
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': KINTSUGI_API_KEY
        },
        timeout: KINTSUGI_TIMEOUT_MS
      }
    );

    if (response.data && response.data.success && response.data.data) {
      const data = response.data.data;
      const isClean = data.verdict === 'APPROVED' && data.risk_score < 80;
      const topViolation = data.violations && data.violations.length > 0 ? data.violations[0] : null;

      return {
        isClean,
        verdict: data.verdict,
        riskScore: data.risk_score,
        reason: topViolation ? topViolation.reason : null,
        category: topViolation ? topViolation.category : null,
        violations: data.violations || [],
        sanitizedText: data.sanitized_text || text,
        source: 'KINTSUGI_API',
        evaluatedBy: data.evaluated_by
      };
    }
  } catch (err) {
    // KintsugiText mikroservisi çevrimdışı veya yanıt vermiyor ise sessizce Fallback'e geç
    // console.warn(`[KintsugiText API Offline/Error]: Falling back to local engine. (${err.message})`);
  }

  // 2. Mikroservis erişilemezse Yerel Kural ve Normalizasyon Motorunu çalıştır
  return evaluateLocally(text);
}

/**
 * Gilded için geriye dönük uyumlu `containsProfanity` fonksiyonu (Senkron hızlı kontrol)
 */
function containsProfanity(text) {
  const result = evaluateLocally(text);
  return !result.isClean;
}

/**
 * Gilded için geriye dönük uyumlu `analyzeComment` fonksiyonu (Asenkron KintsugiText kontrolü)
 */
async function analyzeComment(text) {
  const result = await moderateText(text);
  if (!result.isClean) {
    return 'REJECT';
  }
  return 'APPROVE';
}

module.exports = {
  moderateText,
  containsProfanity,
  analyzeComment,
  LocalTurkishTextNormalizer,
  evaluateLocally
};
