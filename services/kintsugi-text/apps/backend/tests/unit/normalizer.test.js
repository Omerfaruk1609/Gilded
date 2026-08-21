import test from 'node:test';
import assert from 'node:assert/strict';
import { TurkishTextNormalizer } from '../../src/modules/rule-engine/turkish-text.normalizer.js';

test('TurkishTextNormalizer Unit Tests', async (t) => {
  await t.test('should return empty string for null, undefined or empty input', () => {
    assert.equal(TurkishTextNormalizer.normalize(null), '');
    assert.equal(TurkishTextNormalizer.normalize(undefined), '');
    assert.equal(TurkishTextNormalizer.normalize(''), '');
    assert.equal(TurkishTextNormalizer.normalize('   '), '');
  });

  await t.test('should correctly normalize leetspeak numeric substitutions', () => {
    // 0 -> o, 1 -> i, 3 -> e, 4 -> a, 5 -> s, 7 -> t, @ -> a, $ -> s
    assert.equal(TurkishTextNormalizer.normalize('s4l4m'), 'salam');
    assert.equal(TurkishTextNormalizer.normalize('h3ll0'), 'hello');
    assert.equal(TurkishTextNormalizer.normalize('p1sl1k'), 'pislik');
    assert.equal(TurkishTextNormalizer.normalize('73hd17'), 'tehdit');
    assert.equal(TurkishTextNormalizer.normalize('@p7@l'), 'aptal');
    assert.equal(TurkishTextNormalizer.normalize('$4l4k'), 'salak');
  });

  await t.test('should remove punctuation and spacing evasion tricks between characters', () => {
    // s.e.l.a.m -> selam, s-e-l-a-m -> selam, s_e_l_a_m -> selam, s e l a m -> selam
    assert.equal(TurkishTextNormalizer.normalize('s.e.l.a.m'), 'selam');
    assert.equal(TurkishTextNormalizer.normalize('k.ü.f.ü.r'), 'küfür');
    assert.equal(TurkishTextNormalizer.normalize('a-p-t-a-l'), 'aptal');
    assert.equal(TurkishTextNormalizer.normalize('p_i_s_l_i_k'), 'pislik');
    assert.equal(TurkishTextNormalizer.normalize('s  e  l  a  m'), 'selam');
  });

  await t.test('should reduce excessive character repetitions (3+ to 2)', () => {
    assert.equal(TurkishTextNormalizer.normalize('salaaaaam'), 'salaam');
    assert.equal(TurkishTextNormalizer.normalize('şerefffffsiizzzz'), 'şereffsiizz');
    assert.equal(TurkishTextNormalizer.normalize('amkkkkk'), 'amkk');
  });

  await t.test('should handle combined evasion attempts (leet + spaces + repetition)', () => {
    // s.4.l.444.m -> salam
    const normalized = TurkishTextNormalizer.normalize('s.4.l.444.m');
    assert.ok(normalized.includes('salam') || normalized.includes('salaam'));
  });

  await t.test('should handle uppercase Turkish characters appropriately', () => {
    assert.equal(TurkishTextNormalizer.normalize('ŞEREFSİZ'), 'şerefsiz');
    assert.equal(TurkishTextNormalizer.normalize('ÇÖP'), 'çöp');
    assert.equal(TurkishTextNormalizer.normalize('İĞRENÇ'), 'iğrenç');
  });
});
