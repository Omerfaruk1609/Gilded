import test from 'node:test';
import assert from 'node:assert/strict';
import app from '../../src/app.js';
import { EntityTypeEnum, VerdictEnum } from '@kintsugi/shared-types';

let server;
let baseUrl;
const GILDED_API_KEY = 'kt_live_dev_key';

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

test('🏺 Gilded (Kintsugi Space) Ecosystem Compatibility Suite', async (t) => {
  // Helper to send moderation request
  const moderate = async (text, entityType = EntityTypeEnum.COMMENT) => {
    const res = await fetch(`${baseUrl}/api/v1/moderate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': GILDED_API_KEY
      },
      body: JSON.stringify({
        text,
        entity_type: entityType
      })
    });
    const json = await res.json();
    return { status: res.status, body: json };
  };

  // 1. Positive Sanctuary & Healing Phrases (Must be APPROVED)
  await t.test('Gilded Healing: should APPROVE inspirational Kintsugi quotes and supportive comments', async () => {
    const healingSamples = [
      'Yaralarınız, ışığın içeri girdiği yerdir. Kırıldığımız yerlerden daha güçlüyüz.',
      'Bu acı da geçecek dostum, altın dikişlerle daha güçlü ayağa kalkacaksın.',
      'Kintsugi felsefesiyle kırık parçalarımızı altınla onarıyoruz.',
      'Yanındayız, asla yalnız değilsin, hikayen hepimize ilham oldu.'
    ];

    for (const text of healingSamples) {
      const { status, body } = await moderate(text, EntityTypeEnum.COMMENT);
      assert.equal(status, 200);
      assert.equal(body.success, true);
      assert.equal(body.data.verdict, VerdictEnum.APPROVED, `Failed for healing quote: ${text}`);
      assert.ok(body.data.risk_score < 50);
    }
  });

  // 2. Gilded Toxic / Destructive Phrases (Must be REJECTED/FLAGGED)
  await t.test('Gilded Sanctuary Defense: should detect cynical, dismissive and toxic comments', async () => {
    const toxicPhrases = [
      'Sen tam bir ilgi meraklısısın, boş yapma prim kasıyorsun.',
      'Sana müstahak, hak etmişsin beter ol.',
      'Bana ne senin derdinden, çok da tın yalan söylüyorsun.',
      'Sen ezik ve güçsüz birisin, yapamazsın beceriksiz.'
    ];

    for (const text of toxicPhrases) {
      const { status, body } = await moderate(text, EntityTypeEnum.COMMENT);
      assert.equal(status, 200);
      assert.equal(body.success, true);
      assert.ok(
        [VerdictEnum.REJECTED, VerdictEnum.FLAGGED_FOR_REVIEW].includes(body.data.verdict),
        `Failed to reject toxic phrase: ${text}`
      );
      assert.ok(body.data.risk_score >= 50);
    }
  });

  // 3. Self-Harm & Severe Threat Phrases
  await t.test('Gilded Critical Safety: should immediately block self-harm and violence incitement', async () => {
    const dangerousTexts = [
      'Git kendini öldür, geber.',
      'Seni bulduğum yerde geberteceğim.'
    ];

    for (const text of dangerousTexts) {
      const { status, body } = await moderate(text, EntityTypeEnum.CHAT_MESSAGE);
      assert.equal(status, 200);
      assert.equal(body.data.verdict, VerdictEnum.REJECTED);
      assert.ok(body.data.risk_score >= 80);
    }
  });

  // 4. Gilded Profanity Filter & Evasion Tests
  await t.test('Gilded Profanity: should block direct and obfuscated leetspeak profanity', async () => {
    const profanities = [
      'Sen tam bir oç ve yavşaksın',
      'Defol git s.i.k.t.i.r',
      'Ne s4l4k bir insansın amk'
    ];

    for (const text of profanities) {
      const { status, body } = await moderate(text, EntityTypeEnum.POST);
      assert.equal(status, 200);
      assert.ok([VerdictEnum.REJECTED, VerdictEnum.FLAGGED_FOR_REVIEW].includes(body.data.verdict));
    }
  });

  // 5. Gilded Entity Types Compatibility
  await t.test('Gilded Entities: should accept and process all Gilded entity types correctly', async () => {
    const entityTypes = [
      EntityTypeEnum.POST,
      EntityTypeEnum.COMMENT,
      EntityTypeEnum.CHAT_MESSAGE,
      EntityTypeEnum.WISDOM,
      EntityTypeEnum.STITCH,
      EntityTypeEnum.USER_BIO
    ];

    for (const entityType of entityTypes) {
      const { status, body } = await moderate('Topluluk için paylaşılan temiz bir içerik.', entityType);
      assert.equal(status, 200);
      assert.equal(body.success, true);
      assert.equal(body.data.verdict, VerdictEnum.APPROVED);
    }
  });
});
