import test from 'node:test';
import assert from 'node:assert/strict';
import { PIISanitizer } from '../../src/shared/middlewares/pii-sanitizer.js';

test('PIISanitizer Unit Tests', async (t) => {
  await t.test('should return input as is if not a string or empty', () => {
    assert.equal(PIISanitizer.sanitize(null), null);
    assert.equal(PIISanitizer.sanitize(undefined), undefined);
    assert.equal(PIISanitizer.sanitize(''), '');
  });

  await t.test('should sanitize 11-digit Turkish National ID (TCKN)', () => {
    const input = 'Vatandaşlık numaram 12345678901 ve işlem yapmak istiyorum.';
    const sanitized = PIISanitizer.sanitize(input);
    assert.ok(!sanitized.includes('12345678901'));
    assert.ok(sanitized.includes('[TCKN_REDACTED]'));
  });

  await t.test('should sanitize Credit Card Numbers in various formats', () => {
    const input1 = 'Kart numaram: 4543123456789012 lütfen ödemeyi çekin.';
    assert.ok(PIISanitizer.sanitize(input1).includes('[CARD_REDACTED]'));

    const input2 = 'Kart no: 5412-7512-3412-3456';
    assert.ok(PIISanitizer.sanitize(input2).includes('[CARD_REDACTED]'));

    const input3 = 'Kart no: 4111 2222 3333 4444';
    assert.ok(PIISanitizer.sanitize(input3).includes('[CARD_REDACTED]'));
  });

  await t.test('should sanitize Turkish Mobile Phone Numbers in various formats', () => {
    const p1 = 'Bana 05321234567 numarasından ulaşabilirsiniz.';
    assert.ok(PIISanitizer.sanitize(p1).includes('[PHONE_REDACTED]'));

    const p2 = 'Telefon: 5551234567';
    assert.ok(PIISanitizer.sanitize(p2).includes('[PHONE_REDACTED]'));

    const p3 = 'İletişim: +905441234567';
    assert.ok(PIISanitizer.sanitize(p3).includes('[PHONE_REDACTED]'));
  });

  await t.test('should sanitize Email Addresses', () => {
    const input = 'Bana test.user@kintsugitext.io adresinden e-posta atın.';
    const sanitized = PIISanitizer.sanitize(input);
    assert.ok(!sanitized.includes('test.user@kintsugitext.io'));
    assert.ok(sanitized.includes('[EMAIL_REDACTED]'));
  });

  await t.test('should handle multiple PII elements simultaneously', () => {
    const input = 'TC: 12345678901, Tel: 05321112233, Mail: info@domain.com, Kart: 4111-2222-3333-4444';
    const sanitized = PIISanitizer.sanitize(input);
    assert.ok(sanitized.includes('[TCKN_REDACTED]'));
    assert.ok(sanitized.includes('[PHONE_REDACTED]'));
    assert.ok(sanitized.includes('[EMAIL_REDACTED]'));
    assert.ok(sanitized.includes('[CARD_REDACTED]'));
  });

  await t.test('PIISanitizer middleware should populate sanitized_pii_text and keep raw_text_original', () => {
    const mw = PIISanitizer.middleware();
    const req = {
      body: {
        text: 'TC: 12345678901'
      }
    };
    let nextCalled = false;
    mw(req, {}, () => {
      nextCalled = true;
    });

    assert.ok(nextCalled);
    assert.equal(req.body.raw_text_original, 'TC: 12345678901');
    assert.equal(req.body.sanitized_pii_text, 'TC: [TCKN_REDACTED]');
  });
});
