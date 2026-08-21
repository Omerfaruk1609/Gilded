import { RuleImportPayloadSchema, RuleItemSchema } from '@kintsugi/shared-types';
import { DatabaseService } from '../../database/db.js';
import { RuleEngineService } from '../rule-engine/rule-engine.service.js';

export class RulesController {
  constructor() {
    this.db = DatabaseService.getInstance();
    this.ruleEngine = RuleEngineService.getInstance();
  }

  getRules = (_req, res) => {
    const rules = this.db.getRules();
    const response = {
      success: true,
      data: rules,
      meta: {
        timestamp: new Date().toISOString(),
        correlation_id: `req_${Date.now()}`
      }
    };
    res.status(200).json(response);
  };

  addRule = (req, res) => {
    const { pattern, category, score, reason, action, severity, isRegex } = req.body;

    if (!pattern || !category || score === undefined || !reason) {
      const response = {
        success: false,
        error: {
          code: 'INVALID_RULE_DATA',
          message: 'Lütfen pattern, category, score (0-1) ve reason alanlarını eksiksiz girin.'
        },
        meta: {
          timestamp: new Date().toISOString(),
          correlation_id: `req_${Date.now()}`
        }
      };
      res.status(400).json(response);
      return;
    }

    try {
      new RegExp(pattern);

      const newRule = this.db.addRule({
        pattern,
        category,
        score: Number(score),
        reason,
        action,
        severity,
        isRegex
      });

      // Reload in-memory cache
      this.ruleEngine.reloadRulesCache();

      const response = {
        success: true,
        data: newRule,
        meta: {
          timestamp: new Date().toISOString(),
          correlation_id: `req_${Date.now()}`
        }
      };
      res.status(201).json(response);
    } catch (e) {
      const response = {
        success: false,
        error: {
          code: 'INVALID_REGEX',
          message: 'Girdiğiniz Regex ifadesi sözdizimsel olarak geçersiz.'
        },
        meta: {
          timestamp: new Date().toISOString(),
          correlation_id: `req_${Date.now()}`
        }
      };
      res.status(400).json(response);
    }
  };

  deleteRule = (req, res) => {
    const { id } = req.params;
    const deleted = this.db.deleteRule(id);

    if (!deleted) {
      const response = {
        success: false,
        error: {
          code: 'RULE_NOT_FOUND',
          message: `ID değeri '${id}' olan kural bulunamadı.`
        },
        meta: {
          timestamp: new Date().toISOString(),
          correlation_id: `req_${Date.now()}`
        }
      };
      res.status(404).json(response);
      return;
    }

    // Reload in-memory cache
    this.ruleEngine.reloadRulesCache();

    const response = {
      success: true,
      data: { id },
      meta: {
        timestamp: new Date().toISOString(),
        correlation_id: `req_${Date.now()}`
      }
    };
    res.status(200).json(response);
  };

  exportRules = (req, res) => {
    const exportedData = this.db.exportRules();
    
    // Set headers for downloadable JSON attachment
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename="kintsugi-rules-export.json"');

    if (req.query.download === 'true') {
      res.send(JSON.stringify(exportedData, null, 2));
    } else {
      res.status(200).json({
        success: true,
        data: exportedData,
        meta: {
          timestamp: new Date().toISOString(),
          correlation_id: `req_${Date.now()}`
        }
      });
    }
  };

  importRules = (req, res) => {
    const strategy = req.query.strategy || req.body?.strategy || 'merge';
    const rulesPayload = Array.isArray(req.body) ? req.body : req.body?.rules;

    const payloadToValidate = {
      strategy,
      rules: rulesPayload
    };

    const parseResult = RuleImportPayloadSchema.safeParse(payloadToValidate);

    if (!parseResult.success) {
      const formattedErrors = parseResult.error.errors.map(err => `${err.path.join('.')}: ${err.message}`);
      res.status(400).json({
        success: false,
        error: {
          code: 'SCHEMA_VALIDATION_ERROR',
          message: 'İçe aktarılan kural verisi JSON şema kurallarına uymuyor.',
          details: formattedErrors
        },
        meta: {
          timestamp: new Date().toISOString(),
          correlation_id: `req_${Date.now()}`
        }
      });
      return;
    }

    const { rules: validRules } = parseResult.data;
    const summary = this.db.importRules(validRules, strategy);

    // Instant zero-downtime in-memory cache synchronization
    const activeCount = this.ruleEngine.reloadRulesCache();

    res.status(200).json({
      success: true,
      message: `Kurallar başarıyla içe aktarıldı (${strategy} stratejisi ile).`,
      data: {
        summary,
        active_in_memory_rules: activeCount
      },
      meta: {
        timestamp: new Date().toISOString(),
        correlation_id: `req_${Date.now()}`
      }
    });
  };
}
