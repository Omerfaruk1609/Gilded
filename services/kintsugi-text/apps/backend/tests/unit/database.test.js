import test from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseService } from '../../src/database/db.js';

test('DatabaseService Unit Tests', async (t) => {
  const db = DatabaseService.getInstance();

  await t.test('should return default tenant and api key on startup', () => {
    const keyInfo = db.getApiKey('kt_live_dev_key');
    assert.ok(keyInfo);
    assert.equal(keyInfo.tenant.id, 'tenant_gilded_default');
    assert.equal(keyInfo.keyInfo.key, 'kt_live_dev_key');
  });

  await t.test('should return active rules list', () => {
    const rules = db.getRules();
    assert.ok(Array.isArray(rules));
    assert.ok(rules.length > 0);
  });

  await t.test('should add a new rule and retrieve it', () => {
    const newRule = db.addRule({
      pattern: 'test_kural_pattern_xyz',
      category: 'PROFANITY',
      score: 0.9,
      reason: 'Birim testi kuralı'
    });

    assert.ok(newRule.id);
    assert.equal(newRule.pattern, 'test_kural_pattern_xyz');
    assert.equal(newRule.category, 'PROFANITY');

    const found = db.getRules().find(r => r.id === newRule.id);
    assert.ok(found);

    // Clean up
    db.deleteRule(newRule.id);
  });

  await t.test('should delete an existing rule and return false for nonexistent rule', () => {
    const rule = db.addRule({
      pattern: 'delete_me_pattern',
      category: 'SPAM',
      score: 0.8,
      reason: 'Silinecek kural'
    });

    const deleted = db.deleteRule(rule.id);
    assert.equal(deleted, true);

    const deletedAgain = db.deleteRule(rule.id);
    assert.equal(deletedAgain, false);
  });

  await t.test('should export rules with expected metadata and schema structure', () => {
    const exported = db.exportRules();
    assert.ok(exported.exportedAt);
    assert.ok(typeof exported.totalRules === 'number');
    assert.ok(Array.isArray(exported.rules));
  });

  await t.test('should import rules with merge strategy without deleting existing rules', () => {
    const initialCount = db.getRules().length;
    const testImportRules = [
      {
        pattern: 'import_test_pattern_1',
        category: 'spam',
        score: 0.75,
        reason: 'Import test'
      }
    ];

    const result = db.importRules(testImportRules, 'merge');
    assert.ok(result.importedCount >= 1);
    assert.equal(db.getRules().length, initialCount + 1);

    // Clean up
    const added = db.getRules().find(r => r.pattern === 'import_test_pattern_1');
    if (added) db.deleteRule(added.id);
  });

  await t.test('should add and retrieve analysis logs', () => {
    const log = db.addLog({
      correlation_id: `corr_test_${Date.now()}`,
      text: 'Log test metni',
      verdict: 'APPROVED',
      risk_score: 10
    });

    assert.ok(log.id);
    const logs = db.getLogs(10);
    assert.ok(logs.some(l => l.id === log.id));
  });
});
