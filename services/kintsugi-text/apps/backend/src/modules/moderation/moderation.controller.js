import { AnalyzeTextRequestSchema } from '@kintsugi/shared-types';
import { DecisionFusionEngine } from './decision-fusion.engine.js';

export class ModerationController {
  constructor() {
    this.fusionEngine = new DecisionFusionEngine();
  }

  analyze = async (req, res) => {
    const correlationId = req.headers['x-correlation-id'] || `req_${Date.now()}`;

    try {
      // DTO Validation
      const parseResult = AnalyzeTextRequestSchema.safeParse(req.body);
      if (!parseResult.success) {
        const response = {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Geçersiz metin analizi isteği',
            details: parseResult.error.flatten().fieldErrors
          },
          meta: {
            timestamp: new Date().toISOString(),
            correlation_id: correlationId
          }
        };
        res.status(400).json(response);
        return;
      }

      const result = await this.fusionEngine.evaluate(parseResult.data);

      const response = {
        success: true,
        data: result,
        meta: {
          timestamp: new Date().toISOString(),
          correlation_id: correlationId
        }
      };

      res.status(200).json(response);
    } catch (error) {
      console.error('Moderation analysis error:', error);
      const response = {
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Analiz sırasında sunucu hatası oluştu'
        },
        meta: {
          timestamp: new Date().toISOString(),
          correlation_id: correlationId
        }
      };
      res.status(500).json(response);
    }
  };
}
