export const openApiSpec = {
  openapi: '3.0.0',
  info: {
    title: '🏮 KintsugiText Content Safety & Moderation API',
    version: '1.1.0',
    description: `
**Enterprise Turkish-Focused Content Safety Infrastructure**

KintsugiText combines deterministic rule enforcement (Tier 1 < 4ms) with statistical machine learning classification (Tier 2 Scikit-Learn TF-IDF + FastAPI) and Redis Semantic Caching (< 0.03ms) to deliver scalable, explainable content moderation.

---
### Key Features
* ⚡ **Two-Tier Hybrid Engine**: Dual-level moderation combining regex leetspeak evaluation with Python ML inference.
* 🛡️ **PII Masking**: Automatic KVKK/GDPR redaction for TCKN, phone numbers, and credentials.
* 📦 **Dynamic Rule Management**: JSON Schema validated import & export with instant zero-downtime cache reload.
* 🚀 **Redis Cluster HA**: Sub-millisecond distributed semantic caching with Hash Tags (\`{cache}:mod:<hash>\`).
`,
    contact: {
      name: 'Ömer Faruk Kara',
      url: 'https://github.com/Omerfaruk1609/KintsugiText'
    },
    license: {
      name: 'MIT License',
      url: 'https://opensource.org/licenses/MIT'
    }
  },
  servers: [
    {
      url: 'http://localhost:4000',
      description: 'Local Development API Gateway Server'
    }
  ],
  tags: [
    { name: 'Moderation', description: 'Real-time Turkish text analysis and moderation endpoints' },
    { name: 'Rules Engine', description: 'Dynamic rule CRUD, schema validation, import and export' },
    { name: 'Human-in-the-Loop (HITL)', description: 'Moderator review queue and manual override feedback loops' },
    { name: 'System', description: 'Service healthcheck and liveness metrics' }
  ],
  paths: {
    '/api/v1/moderate': {
      post: {
        tags: ['Moderation'],
        summary: 'Analyze and moderate Turkish content (Two-Tier Engine)',
        description: 'Evaluates incoming raw text against Tier-1 Rule Engine and Tier-2 Python ML Service, applying PII masking and Redis semantic caching.',
        operationId: 'moderateText',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ModerateRequest'
              },
              examples: {
                preset_leetspeak: {
                  summary: '🟢 Preset 1: Leetspeak & Profanity Test',
                  value: {
                    text: 's4l4m kanka seni çok özledim.',
                    entity_type: 'comment',
                    tenant_id: 'gilded_playground',
                    force_ai: false
                  }
                },
                preset_spam: {
                  summary: '🚨 Preset 2: Spam & Illegal Gambling Test',
                  value: {
                    text: 'Günde 5000 TL kazan stoklarla sınırlı t.me/bahis linkine tıkla!',
                    entity_type: 'post',
                    tenant_id: 'gilded_playground',
                    force_ai: false
                  }
                },
                preset_threat: {
                  summary: '⚠️ Preset 3: Implicit Threat (AI Trigger Test)',
                  value: {
                    text: 'Seni bulduğum yerde yapacağımı bilirim, akşam kapına geleceğim.',
                    entity_type: 'chat_message',
                    tenant_id: 'gilded_playground',
                    force_ai: true
                  }
                },
                preset_pii: {
                  summary: '🔒 Preset 4: PII Masking (TCKN / Telefon)',
                  value: {
                    text: 'TCKN: 12345678901, Telefon: 05321234567 bizi hemen arayın.',
                    entity_type: 'comment',
                    tenant_id: 'gilded_playground',
                    force_ai: false
                  }
                }
              }
            }
          }
        },
        responses: {
          200: {
            description: 'Successful moderation response payload',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ModerateResponse' }
              }
            }
          },
          400: { $ref: '#/components/responses/400BadRequest' },
          429: { $ref: '#/components/responses/429TooManyRequests' },
          500: { $ref: '#/components/responses/500ServerError' }
        }
      }
    },
    '/api/v1/rules': {
      get: {
        tags: ['Rules Engine'],
        summary: 'List active moderation rules',
        description: 'Retrieves all active regex and pattern rules from the database.',
        responses: {
          200: {
            description: 'Active rules array response',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: { type: 'array', items: { $ref: '#/components/schemas/RuleItem' } }
                  }
                }
              }
            }
          }
        }
      },
      post: {
        tags: ['Rules Engine'],
        summary: 'Add a new moderation rule',
        description: 'Creates a new moderation rule and automatically reloads the Tier-1 in-memory regex cache.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CreateRuleInput' }
            }
          }
        },
        responses: {
          201: { description: 'Rule created successfully' },
          400: { $ref: '#/components/responses/400BadRequest' }
        }
      }
    },
    '/api/v1/rules/{id}': {
      delete: {
        tags: ['Rules Engine'],
        summary: 'Delete a moderation rule',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            example: 'rule_profanity_tr_1'
          }
        ],
        responses: {
          200: { description: 'Rule deleted successfully' },
          404: { description: 'Rule ID not found' }
        }
      }
    },
    '/api/v1/rules/export': {
      get: {
        tags: ['Rules Engine'],
        summary: 'Export moderation rules (JSON Schema format)',
        description: 'Exports active rules with metadata for backup or cross-environment migration.',
        parameters: [
          {
            name: 'download',
            in: 'query',
            schema: { type: 'boolean' },
            example: true,
            description: 'Set true to trigger JSON file attachment download'
          }
        ],
        responses: {
          200: { description: 'Exported JSON rule dataset' }
        }
      }
    },
    '/api/v1/rules/import': {
      post: {
        tags: ['Rules Engine'],
        summary: 'Batch import rules with JSON Schema validation',
        description: 'Validates and imports rules with conflict management strategy (merge or overwrite). Syncs Tier-1 in-memory cache instantly.',
        parameters: [
          {
            name: 'strategy',
            in: 'query',
            schema: { type: 'string', enum: ['merge', 'overwrite'], default: 'merge' },
            description: 'Conflict resolution strategy: merge preserves existing rules, overwrite replaces them.'
          }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ImportPayload' }
            }
          }
        },
        responses: {
          200: { description: 'Rules imported successfully' },
          400: { $ref: '#/components/responses/400BadRequest' }
        }
      }
    },
    '/api/v1/moderation/queue': {
      get: {
        tags: ['Human-in-the-Loop (HITL)'],
        summary: 'Get pending HITL review queue',
        responses: {
          200: { description: 'Pending queue items' }
        }
      }
    },
    '/api/v1/moderation/override': {
      post: {
        tags: ['Human-in-the-Loop (HITL)'],
        summary: 'Submit moderator review override',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  log_id: { type: 'string', example: 'log_1722365200' },
                  moderator_verdict: { type: 'string', enum: ['APPROVED', 'REJECTED'], example: 'APPROVED' },
                  reason: { type: 'string', example: 'Yanlış alarm tespiti' }
                }
              }
            }
          }
        },
        responses: {
          200: { description: 'Override applied and logged' }
        }
      }
    },
    '/api/v1/health': {
      get: {
        tags: ['System'],
        summary: 'Service Health & Readiness Metrics',
        responses: {
          200: {
            description: 'Service status healthy',
            content: {
              'application/json': {
                example: {
                  status: 'healthy',
                  service: 'KintsugiText Moderation Engine',
                  active_rules_count: 5,
                  timestamp: '2026-07-31T22:54:48.000Z'
                }
              }
            }
          }
        }
      }
    }
  },
  components: {
    schemas: {
      ModerateRequest: {
        type: 'object',
        required: ['text'],
        properties: {
          text: { type: 'string', example: 's4l4m kanka seni çok özledim.' },
          entity_type: { type: 'string', enum: ['comment', 'post', 'chat_message', 'user_bio'], default: 'comment' },
          tenant_id: { type: 'string', default: 'gilded_default' },
          force_ai: { type: 'boolean', default: false }
        }
      },
      ModerateResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          data: {
            type: 'object',
            properties: {
              correlation_id: { type: 'string', example: 'corr_1722365200_a8f9b' },
              verdict: { type: 'string', enum: ['APPROVED', 'REJECTED', 'FLAGGED_FOR_REVIEW'], example: 'REJECTED' },
              risk_score: { type: 'integer', example: 85 },
              evaluated_by: { type: 'string', example: 'HYBRID_FUSION' },
              violations: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    category: { type: 'string', example: 'PROFANITY' },
                    score: { type: 'number', example: 0.85 },
                    reason: { type: 'string', example: 'Hakaret veya argo ifade tespiti' }
                  }
                }
              },
              sanitized_text: { type: 'string', example: 'salam kanka seni çok özledim.' }
            }
          }
        }
      },
      RuleItem: {
        type: 'object',
        properties: {
          id: { type: 'string', example: 'rule_profanity_1' },
          pattern: { type: 'string', example: '(küfür|hakaret)' },
          category: { type: 'string', example: 'profanity' },
          action: { type: 'string', example: 'block' },
          severity: { type: 'integer', example: 3 },
          score: { type: 'number', example: 0.85 },
          isRegex: { type: 'boolean', example: true },
          reason: { type: 'string', example: 'Argo tespiti' }
        }
      },
      CreateRuleInput: {
        type: 'object',
        required: ['pattern', 'category', 'score', 'reason'],
        properties: {
          pattern: { type: 'string', example: '(spam_word|link)' },
          category: { type: 'string', example: 'SPAM' },
          score: { type: 'number', example: 0.9 },
          reason: { type: 'string', example: 'İzinsiz reklam veya spam' }
        }
      },
      ImportPayload: {
        type: 'object',
        required: ['rules'],
        properties: {
          strategy: { type: 'string', enum: ['merge', 'overwrite'], default: 'merge' },
          rules: {
            type: 'array',
            items: { $ref: '#/components/schemas/RuleItem' }
          }
        }
      }
    },
    responses: {
      '400BadRequest': {
        description: 'Bad Request - Validation error or invalid schema',
        content: {
          'application/json': {
            example: {
              success: false,
              error: { code: 'VALIDATION_ERROR', message: 'Geçersiz istek parametreleri' }
            }
          }
        }
      },
      '429TooManyRequests': {
        description: 'Rate Limit Exceeded',
        content: {
          'application/json': {
            example: {
              success: false,
              error: { code: 'RATE_LIMIT_EXCEEDED', message: 'Çok fazla istek gönderildi' }
            }
          }
        }
      },
      '500ServerError': {
        description: 'Internal Server Error',
        content: {
          'application/json': {
            example: {
              success: false,
              error: { code: 'INTERNAL_SERVER_ERROR', message: 'Sunucu içi hata oluştu' }
            }
          }
        }
      }
    }
  }
};
