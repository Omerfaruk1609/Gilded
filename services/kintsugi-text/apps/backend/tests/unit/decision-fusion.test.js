import test from 'node:test';
import assert from 'node:assert/strict';
import { DecisionFusionEngine } from '../../src/modules/moderation/decision-fusion.engine.js';
import { VerdictEnum, EngineTierEnum } from '@kintsugi/shared-types';

test('DecisionFusionEngine Unit Tests', async (t) => {
  const fusionEngine = new DecisionFusionEngine();

  await t.test('should evaluate clean text and produce APPROVED verdict with low risk', async () => {
    const result = await fusionEngine.evaluate({
      text: 'Bugün hava çok güzel ve ekip olarak harika iş çıkardık.',
      entity_type: 'comment'
    });

    assert.equal(result.verdict, VerdictEnum.APPROVED);
    assert.ok(result.risk_score < 50);
    assert.ok(result.correlation_id.startsWith('corr_'));
    assert.ok(result.breakdown.tier1.executed);
    assert.ok(result.processed_at);
  });

  await t.test('should produce REJECTED verdict on severe profanity / rule violations', async () => {
    const result = await fusionEngine.evaluate({
      text: 'Sen ne salak ve şerefsiz birisin amk!',
      entity_type: 'comment'
    });

    assert.equal(result.verdict, VerdictEnum.REJECTED);
    assert.ok(result.risk_score >= 80);
    assert.ok(result.violations.length > 0);
  });

  await t.test('should execute Tier-2 AI analysis when force_ai is true', async () => {
    const result = await fusionEngine.evaluate({
      text: 'Seni bulduğum yerde gününü göreceksin.',
      entity_type: 'comment',
      force_ai: true
    });

    assert.equal(result.breakdown.tier2.executed, true);
    assert.equal(result.breakdown.tier2.ai_used, true);
    assert.equal(result.evaluated_by, EngineTierEnum.HYBRID_FUSION);
  });

  await t.test('should return cached result on second query for same text when force_ai is false', async () => {
    const sampleText = `Önbellek test metni #${Date.now()}`;
    const firstResult = await fusionEngine.evaluate({ text: sampleText, entity_type: 'comment' });
    const secondResult = await fusionEngine.evaluate({ text: sampleText, entity_type: 'comment' });

    assert.equal(secondResult.evaluated_by, 'SEMANTIC_CACHE');
    assert.equal(secondResult.risk_score, firstResult.risk_score);
    assert.equal(secondResult.verdict, firstResult.verdict);
  });
});
