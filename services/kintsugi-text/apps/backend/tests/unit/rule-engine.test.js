import test from 'node:test';
import assert from 'node:assert/strict';
import { RuleEngineService } from '../../src/modules/rule-engine/rule-engine.service.js';

test('RuleEngineService Unit Tests', async (t) => {
  const ruleEngine = RuleEngineService.getInstance();

  await t.test('should correctly compile active rules into in-memory cache', () => {
    const count = ruleEngine.reloadRulesCache();
    assert.ok(count > 0, 'Active rules count should be greater than zero');
    assert.equal(ruleEngine.compiledRules.length, count);
  });

  await t.test('should evaluate clean text and return flagged=false with score 0', () => {
    const result = ruleEngine.evaluate('Harika bir çalışma olmuş, tebrikler!');
    assert.equal(result.flagged, false);
    assert.equal(result.highestScore, 0);
    assert.equal(result.violations.length, 0);
    assert.equal(result.matchedRules.length, 0);
  });

  await t.test('should detect direct profanity pattern and flag with correct violation', () => {
    const result = ruleEngine.evaluate('sen ne salak bir insansın amk');
    assert.equal(result.flagged, true);
    assert.ok(result.highestScore > 0);
    assert.ok(result.violations.length > 0);
    assert.ok(result.violations.some(v => v.category === 'PROFANITY' || v.action === 'block'));
  });

  await t.test('should detect obfuscated leetspeak profanity pattern', () => {
    const result = ruleEngine.evaluate('sen ne s4l4k birisin');
    assert.equal(result.flagged, true);
    assert.ok(result.highestScore > 0);
  });

  await t.test('should detect punctuated profanity pattern', () => {
    const result = ruleEngine.evaluate('sen tam bir a.m.k');
    assert.equal(result.flagged, true);
    assert.ok(result.violations.length > 0);
  });

  await t.test('should return normalizedText in the evaluation payload', () => {
    const result = ruleEngine.evaluate('s.4.l.4.m');
    assert.ok(result.normalizedText.includes('salam'));
  });
});
