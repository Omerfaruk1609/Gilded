import test from 'node:test';
import assert from 'node:assert/strict';
import { AuthMiddleware } from '../../src/shared/middlewares/auth.middleware.js';
import { QuotaMiddleware } from '../../src/shared/middlewares/quota.middleware.js';

test('AuthMiddleware & QuotaMiddleware Unit Tests', async (t) => {
  const authMw = AuthMiddleware.authenticate();
  const quotaMw = QuotaMiddleware.rateLimit();

  await t.test('AuthMiddleware should return 401 when API Key is missing', async () => {
    let statusCode = null;
    let jsonBody = null;

    const req = {
      headers: {},
      correlationId: 'test_corr_1'
    };
    const res = {
      status(code) {
        statusCode = code;
        return {
          json(data) {
            jsonBody = data;
          }
        };
      }
    };

    let nextCalled = false;
    await authMw(req, res, () => {
      nextCalled = true;
    });

    assert.equal(nextCalled, false);
    assert.equal(statusCode, 401);
    assert.equal(jsonBody.error.code, 'UNAUTHORIZED');
  });

  await t.test('AuthMiddleware should accept valid default API Key in X-API-Key header', async () => {
    const req = {
      headers: {
        'x-api-key': 'kt_live_dev_key'
      },
      correlationId: 'test_corr_2'
    };
    const res = {};

    let nextCalled = false;
    await authMw(req, res, () => {
      nextCalled = true;
    });

    assert.equal(nextCalled, true);
    assert.ok(req.tenant);
    assert.equal(req.tenant.id, 'tenant_gilded_default');
    assert.ok(req.apiKeyInfo);
  });

  await t.test('AuthMiddleware should accept valid API Key in Authorization Bearer header', async () => {
    const req = {
      headers: {
        authorization: 'Bearer kt_live_dev_key'
      },
      correlationId: 'test_corr_3'
    };
    const res = {};

    let nextCalled = false;
    await authMw(req, res, () => {
      nextCalled = true;
    });

    assert.equal(nextCalled, true);
    assert.equal(req.tenant.id, 'tenant_gilded_default');
  });

  await t.test('QuotaMiddleware should set rate limit headers and allow request within quota', async () => {
    const headersSet = {};
    const req = {
      tenant: {
        id: 'test_tenant_quota_1',
        rateLimitRpm: 100,
        dailyQuota: 5000
      }
    };
    const res = {
      setHeader(name, val) {
        headersSet[name] = val;
      }
    };

    let nextCalled = false;
    await quotaMw(req, res, () => {
      nextCalled = true;
    });

    assert.equal(nextCalled, true);
    assert.equal(headersSet['X-RateLimit-Limit'], 100);
    assert.ok(headersSet['X-RateLimit-Remaining'] >= 0);
    assert.equal(headersSet['X-DailyQuota-Limit'], 5000);
  });

  await t.test('QuotaMiddleware should return 429 when RPM limit is exceeded', async () => {
    const tenantId = `tenant_rpm_exceed_${Date.now()}`;
    let statusCode = null;
    let jsonBody = null;

    const createReqRes = () => {
      const headers = {};
      const req = {
        tenant: {
          id: tenantId,
          rateLimitRpm: 2,
          dailyQuota: 1000
        },
        correlationId: 'corr_rate_test'
      };
      const res = {
        setHeader(name, val) {
          headers[name] = val;
        },
        status(code) {
          statusCode = code;
          return {
            json(data) {
              jsonBody = data;
            }
          };
        }
      };
      return { req, res, headers };
    };

    // Request 1: OK
    const r1 = createReqRes();
    await quotaMw(r1.req, r1.res, () => {});

    // Request 2: OK
    const r2 = createReqRes();
    await quotaMw(r2.req, r2.res, () => {});

    // Request 3: EXCEEDED (limit is 2)
    const r3 = createReqRes();
    let nextCalled3 = false;
    await quotaMw(r3.req, r3.res, () => {
      nextCalled3 = true;
    });

    assert.equal(nextCalled3, false);
    assert.equal(statusCode, 429);
    assert.equal(jsonBody.error.code, 'RATE_LIMIT_EXCEEDED');
    assert.equal(r3.headers['Retry-After'], 60);
  });
});
