const crypto = require('crypto');

/**
 * 🛡️ Webhook İmza Doğrulama (Madde 17: Webhook İmzası)
 * Gelen harici webhook isteklerinin (ödeme, e-posta, üçüncü taraf bildirimleri)
 * sahte değil, gerçek servis sağlayıcıdan geldiğini HMAC SHA-256 ile doğrular.
 * 
 * @param {string|Buffer} rawBody - Ham istek gövdesi
 * @param {string} signatureHeader - İstek başlığındaki imza (ör. sha256=...)
 * @param {string} secret - Paylaşılan gizli anahtar
 * @returns {boolean}
 */
function verifyWebhookSignature(rawBody, signatureHeader, secret) {
  if (!rawBody || !signatureHeader || !secret) {
    return false;
  }

  try {
    const signature = signatureHeader.startsWith('sha256=') 
      ? signatureHeader.slice(7) 
      : signatureHeader;

    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(typeof rawBody === 'string' ? rawBody : JSON.stringify(rawBody))
      .digest('hex');

    return crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    );
  } catch {
    return false;
  }
}

module.exports = { verifyWebhookSignature };
