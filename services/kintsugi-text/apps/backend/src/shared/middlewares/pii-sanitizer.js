/**
 * KVKK / GDPR Uyumlu PII (Kişisel Veri) Maskeleme Middleware'i
 */
export class PIISanitizer {
  // T.C. Kimlık No (11 Hane)
  static TCKN_REGEX = /\b[1-9]\d{10}\b/g;

  // Kredi Kartı No (16 Hane / Gruplanmış)
  static CREDIT_CARD_REGEX = /\b(?:\d[ -]*?){13,16}\b/g;

  // Türkiye Telefon No (05xx xxx xx xx)
  static PHONE_REGEX = /(?:05\d{9}|5\d{9}|\+905\d{9})/g;

  // E-Posta Adresi
  static EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

  /**
   * Metindeki kişisel hassas verileri [PII_REDACTED] ile maskeler.
   */
  static sanitize(text) {
    if (!text || typeof text !== 'string') return text;

    let sanitized = text;
    sanitized = sanitized.replace(this.TCKN_REGEX, '[TCKN_REDACTED]');
    sanitized = sanitized.replace(this.CREDIT_CARD_REGEX, '[CARD_REDACTED]');
    sanitized = sanitized.replace(this.PHONE_REGEX, '[PHONE_REDACTED]');
    sanitized = sanitized.replace(this.EMAIL_REGEX, '[EMAIL_REDACTED]');

    return sanitized;
  }

  /**
   * Express Middleware Katmanı
   */
  static middleware() {
    return (req, _res, next) => {
      if (req.body && typeof req.body.text === 'string') {
        // Güvenlik amacıyla ham metni pii_sanitized hale getirip maskeler
        req.body.raw_text_original = req.body.text;
        req.body.sanitized_pii_text = PIISanitizer.sanitize(req.body.text);
      }
      next();
    };
  }
}
