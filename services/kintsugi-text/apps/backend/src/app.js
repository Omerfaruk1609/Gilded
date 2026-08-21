import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/env.js';
import { ModerationController } from './modules/moderation/moderation.controller.js';
import { RulesController } from './modules/rules/rules.controller.js';
import { FeedbackController } from './modules/moderation/feedback.controller.js';
import { PIISanitizer } from './shared/middlewares/pii-sanitizer.js';
import { DatabaseService } from './database/db.js';
import { Logger } from './shared/logger/logger.js';
import swaggerUi from 'swagger-ui-express';
import { openApiSpec } from './config/swagger.spec.js';
import { customCss } from './config/swagger.theme.js';
import { AuthMiddleware } from './shared/middlewares/auth.middleware.js';
import { QuotaMiddleware } from './shared/middlewares/quota.middleware.js';

const app = express();

app.use(helmet());
app.use(cors({ origin: env.CORS_ORIGIN }));
app.use(express.json());

// KVKK / GDPR Uyumlu PII Sanitizer Middleware
app.use(PIISanitizer.middleware());

// Request Correlation ID & Logger Middleware
app.use((req, res, next) => {
  req.correlationId = req.headers['x-correlation-id'] || `corr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  res.setHeader('X-Correlation-ID', req.correlationId);
  Logger.info(`HTTP ${req.method} ${req.url}`, { correlation_id: req.correlationId, ip: req.ip });
  next();
});

const moderationController = new ModerationController();
const rulesController = new RulesController();
const feedbackController = new FeedbackController();
const dbService = DatabaseService.getInstance();

// 1. OpenAPI / Swagger Documentation UI (/api/docs & /api/docs/json)
if (env.ENABLE_SWAGGER) {
  app.get('/api/docs/json', (_req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.json(openApiSpec);
  });

  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(openApiSpec, {
    customCss,
    customSiteTitle: '🏮 KintsugiText Enterprise API Docs',
    swaggerOptions: {
      docExpansion: 'list',
      defaultModelsExpandDepth: 3,
      displayRequestDuration: true,
      tryItOutEnabled: true,
      filter: true
    }
  }));
} else {
  app.use('/api/docs', (_req, res) => {
    res.status(404).json({
      success: false,
      error: {
        code: 'SWAGGER_DISABLED',
        message: 'API dokümantasyon ekranı ortam değişkenleri ile devredışı bırakılmıştır.'
      }
    });
  });
}

// 2. Healthcheck & Liveness Endpoint
app.get('/api/v1/health', (_req, res) => {
  res.status(200).json({
    status: 'healthy',
    service: 'KintsugiText Moderation Engine',
    env: env.NODE_ENV,
    active_rules_count: dbService.getRules().length,
    timestamp: new Date().toISOString()
  });
});

app.get('/healthz', (_req, res) => {
  res.redirect('/api/v1/health');
});

// 3. Protected API Routes Middleware Stack
const protectedAuth = [AuthMiddleware.authenticate(), QuotaMiddleware.rateLimit()];

// 4. Moderation Endpoints (Protected)
app.post('/api/v1/moderate', protectedAuth, moderationController.analyze);
app.post('/api/v1/analyze', protectedAuth, moderationController.analyze);

// 5. Rules CRUD & Import/Export Endpoints (Protected)
app.get('/api/v1/rules', protectedAuth, rulesController.getRules);
app.get('/api/v1/rules/export', protectedAuth, rulesController.exportRules);
app.post('/api/v1/rules/import', protectedAuth, rulesController.importRules);
app.post('/api/v1/rules', protectedAuth, rulesController.addRule);
app.delete('/api/v1/rules/:id', protectedAuth, rulesController.deleteRule);

// 6. HITL Moderatör Kuyruğu & Feedback Endpoints (Protected)
app.get('/api/v1/moderation/queue', protectedAuth, feedbackController.getQueue);
app.post('/api/v1/moderation/override', protectedAuth, feedbackController.submitOverride);
app.get('/api/v1/moderation/dataset/export', protectedAuth, feedbackController.exportDataset);

// 6. 404 Handler
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'ROUTE_NOT_FOUND',
      message: 'İstenen API uç noktası bulunamadı.'
    },
    meta: {
      timestamp: new Date().toISOString(),
      correlation_id: `req_${Date.now()}`
    }
  });
});

// 7. Global Error Handler
app.use((err, _req, res, _next) => {
  Logger.error('Unhandled Global Error', { error: err.message });
  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: err.message || 'Sunucu içi beklenmeyen bir hata oluştu.'
    },
    meta: {
      timestamp: new Date().toISOString(),
      correlation_id: `req_${Date.now()}`
    }
  });
});

export default app;
