import test from 'node:test';
import assert from 'node:assert/strict';
import app from '../../src/app.js';

let server;
let baseUrl;
const API_KEY = 'kt_live_dev_key';

test.before(async () => {
  await new Promise((resolve) => {
    server = app.listen(0, () => {
      const port = server.address().port;
      baseUrl = `http://127.0.0.1:${port}`;
      resolve();
    });
  });
});

test.after(async () => {
  if (server) {
    await new Promise((resolve) => server.close(resolve));
  }
});

test('KintsugiText Express API Integration Tests', async (t) => {
  // 1. Healthcheck
  await t.test('GET /api/v1/health should return 200 and healthy status', async () => {
    const res = await fetch(`${baseUrl}/api/v1/health`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.status, 'healthy');
    assert.ok(typeof body.active_rules_count === 'number');
  });

  // 2. Authentication & Authorization Guard
  await t.test('POST /api/v1/moderate without API key should return 401 Unauthorized', async () => {
    const res = await fetch(`${baseUrl}/api/v1/moderate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: 'test' })
    });
    assert.equal(res.status, 401);
    const body = await res.json();
    assert.equal(body.error.code, 'UNAUTHORIZED');
  });

  // 3. Moderation Endpoint with Clean Text
  await t.test('POST /api/v1/moderate with clean text should return 200 APPROVED', async () => {
    const res = await fetch(`${baseUrl}/api/v1/moderate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': API_KEY
      },
      body: JSON.stringify({
        text: 'Bu proje ekibine katkılarından dolayı çok teşekkür ederim.',
        entity_type: 'comment'
      })
    });

    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.equal(body.data.verdict, 'APPROVED');
    assert.ok(body.data.risk_score < 50);
  });

  // 4. Moderation Endpoint with Profanity / Toxicity
  await t.test('POST /api/v1/moderate with profanity should return REJECTED or FLAGGED', async () => {
    const res = await fetch(`${baseUrl}/api/v1/moderate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': API_KEY
      },
      body: JSON.stringify({
        text: 'sen ne salak bir insansın amk defol git',
        entity_type: 'comment'
      })
    });

    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.ok(body.data.risk_score >= 50);
    assert.ok(['REJECTED', 'FLAGGED_FOR_REVIEW'].includes(body.data.verdict));
    assert.ok(body.data.violations.length > 0);
  });

  // 5. Validation Error (Missing text field)
  await t.test('POST /api/v1/moderate with empty/invalid payload should return 400 Validation Error', async () => {
    const res = await fetch(`${baseUrl}/api/v1/moderate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': API_KEY
      },
      body: JSON.stringify({})
    });

    assert.equal(res.status, 400);
    const body = await res.json();
    assert.equal(body.success, false);
    assert.equal(body.error.code, 'VALIDATION_ERROR');
  });

  // 6. Rules API: GET, POST, DELETE
  let createdRuleId;
  await t.test('POST /api/v1/rules should create a new moderation rule', async () => {
    const res = await fetch(`${baseUrl}/api/v1/rules`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': API_KEY
      },
      body: JSON.stringify({
        pattern: 'yeni_engellenecek_kelime',
        category: 'PROFANITY',
        score: 0.95,
        reason: 'Entegrasyon testi kuralı'
      })
    });

    assert.equal(res.status, 201);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.ok(body.data.id);
    createdRuleId = body.data.id;
  });

  await t.test('GET /api/v1/rules should list all active rules including created rule', async () => {
    const res = await fetch(`${baseUrl}/api/v1/rules`, {
      headers: { 'X-API-Key': API_KEY }
    });

    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.ok(Array.isArray(body.data));
    assert.ok(body.data.some(r => r.id === createdRuleId));
  });

  await t.test('DELETE /api/v1/rules/:id should delete the rule', async () => {
    const res = await fetch(`${baseUrl}/api/v1/rules/${createdRuleId}`, {
      method: 'DELETE',
      headers: { 'X-API-Key': API_KEY }
    });

    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
  });

  // 7. Rules Export & Import
  await t.test('GET /api/v1/rules/export should export rules JSON structure', async () => {
    const res = await fetch(`${baseUrl}/api/v1/rules/export`, {
      headers: { 'X-API-Key': API_KEY }
    });

    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.ok(body.data.totalRules >= 0);
  });

  await t.test('POST /api/v1/rules/import should batch import rules with schema validation', async () => {
    const res = await fetch(`${baseUrl}/api/v1/rules/import`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': API_KEY
      },
      body: JSON.stringify({
        strategy: 'merge',
        rules: [
          {
            pattern: 'batch_imported_rule_1',
            category: 'spam',
            score: 0.88,
            reason: 'Batch import entegrasyon testi'
          }
        ]
      })
    });

    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
  });

  // 8. HITL Moderator Queue & Override
  await t.test('GET /api/v1/moderation/queue should return pending moderator queue', async () => {
    const res = await fetch(`${baseUrl}/api/v1/moderation/queue`, {
      headers: { 'X-API-Key': API_KEY }
    });

    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.ok(Array.isArray(body.data));
  });

  // 9. OpenAPI Documentation Spec
  await t.test('GET /api/docs/json should return OpenAPI schema JSON', async () => {
    const res = await fetch(`${baseUrl}/api/docs/json`);
    assert.equal(res.status, 200);
    const spec = await res.json();
    assert.ok(spec.openapi);
    assert.equal(spec.info.title, '🏮 KintsugiText Content Safety & Moderation API');
  });

  // 10. 404 Route Handler
  await t.test('GET /api/v1/nonexistent should return 404', async () => {
    const res = await fetch(`${baseUrl}/api/v1/nonexistent`);
    assert.equal(res.status, 404);
    const body = await res.json();
    assert.equal(body.error.code, 'ROUTE_NOT_FOUND');
  });
});
