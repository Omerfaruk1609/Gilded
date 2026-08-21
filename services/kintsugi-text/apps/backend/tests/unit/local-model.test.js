import test from 'node:test';
import assert from 'node:assert/strict';
import { LocalKintsugiModel } from '../../src/modules/ai-engine/local-model.js';
import { AIEngineService } from '../../src/modules/ai-engine/ai-engine.service.js';

test('LocalKintsugiModel & AIEngineService Unit Tests', async (t) => {
  await t.test('should analyze clean benign text with low risk scores', () => {
    const result = LocalKintsugiModel.analyze('Bu maçı kazanmak için elimizden geleni yapacağız.');
    assert.equal(result.ai_used, true);
    assert.ok(result.scores.implicit_threat < 0.5);
    assert.ok(result.scores.hate_speech < 0.5);
    assert.ok(result.scores.spam < 0.5);
    assert.equal(result.violations.length, 0);
  });

  await t.test('should detect implicit physical threat patterns', () => {
    const result = LocalKintsugiModel.analyze('Akşam evinin önüne geleceğim seni bulup geberteceğim!');
    assert.equal(result.ai_used, true);
    assert.ok(result.scores.implicit_threat >= 0.5);
    assert.ok(result.scores.toxicity >= 0.7);
    assert.ok(result.violations.some(v => v.category === 'IMPLICIT_THREAT'));
  });

  await t.test('should detect hate speech patterns', () => {
    const result = LocalKintsugiModel.analyze('Sizler aşağılık ırk insanlarsınız nefret ediyorum sizden');
    assert.equal(result.ai_used, true);
    assert.ok(result.scores.hate_speech >= 0.5);
    assert.ok(result.violations.some(v => v.category === 'HATE_SPEECH'));
  });

  await t.test('should detect spam and unauthorized betting links', () => {
    const result = LocalKintsugiModel.analyze('Hemen tıkla t.me/kazan yatırımsız bonus fırsatını kaçırma');
    assert.equal(result.ai_used, true);
    assert.ok(result.scores.spam >= 0.6);
    assert.ok(result.violations.some(v => v.category === 'SPAM'));
  });

  await t.test('AIEngineService should fallback gracefully to LocalKintsugiModel when remote AI is offline', async () => {
    const aiService = new AIEngineService();
    const result = await aiService.analyze('Bu güzel bir gün');
    assert.ok(result);
    assert.equal(result.ai_used, true);
    assert.ok(typeof result.duration_ms === 'number');
    assert.ok(result.scores);
  });
});
