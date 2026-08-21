import {
  EngineTierEnum,
  VerdictEnum
} from '@kintsugi/shared-types';
import { RuleEngineService } from '../rule-engine/rule-engine.service.js';
import { AIEngineService } from '../ai-engine/ai-engine.service.js';
import { DatabaseService } from '../../database/db.js';
import { SemanticCacheService } from '../../shared/cache/cache.js';

export class DecisionFusionEngine {
  constructor() {
    this.ruleEngine = new RuleEngineService();
    this.aiEngine = new AIEngineService();
    this.dbService = DatabaseService.getInstance();
    this.cacheService = SemanticCacheService.getInstance();
  }

  async evaluate(request) {
    // 0. Cache Check (Gelişmiş Önbellek Kontrolü - < 2ms)
    const cached = await this.cacheService.get(request.text);
    if (cached && !request.force_ai) {
      return {
        ...cached,
        correlation_id: `corr_cache_${Date.now()}`,
        evaluated_by: 'SEMANTIC_CACHE',
        processed_at: new Date().toISOString()
      };
    }

    const correlationId = `corr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    // 1. Tier 1: Deterministic Rule Engine
    const tier1Start = Date.now();
    const tier1Result = this.ruleEngine.evaluate(request.text);
    const tier1Duration = Date.now() - tier1Start;

    let evaluatedBy = EngineTierEnum.TIER_1_DETERMINISTIC;
    const allViolations = [...tier1Result.violations];

    let tier2Duration = 0;
    let tier2Executed = false;
    let aiScores;

    const HARD_BLOCK_THRESHOLD = 0.85;

    // Eğer Tier 1 sert bir ihlal bulmadıysa veya force_ai = true ise Tier 2 AI analizine geçilir
    if (tier1Result.highestScore < HARD_BLOCK_THRESHOLD || request.force_ai) {
      tier2Executed = true;
      const tier2Result = await this.aiEngine.analyze(tier1Result.normalizedText);
      tier2Duration = tier2Result.duration_ms;
      aiScores = tier2Result.scores;
      evaluatedBy = EngineTierEnum.HYBRID_FUSION;

      allViolations.push(...tier2Result.violations);
    }

    let maxScore = 0;
    for (const v of allViolations) {
      if (v.score > maxScore) maxScore = v.score;
    }

    const riskScore = Math.round(maxScore * 100);

    let verdict = VerdictEnum.APPROVED;
    if (riskScore >= 80) {
      verdict = VerdictEnum.REJECTED;
    } else if (riskScore >= 50) {
      verdict = VerdictEnum.FLAGGED_FOR_REVIEW;
    }

    const result = {
      correlation_id: correlationId,
      verdict,
      risk_score: riskScore,
      evaluated_by: evaluatedBy,
      violations: allViolations,
      breakdown: {
        tier1: {
          executed: true,
          duration_ms: tier1Duration,
          flagged: tier1Result.flagged,
          score: Math.round(tier1Result.highestScore * 100),
          matches: tier1Result.matchedRules
        },
        tier2: {
          executed: tier2Executed,
          duration_ms: tier2Duration,
          ai_used: tier2Executed,
          scores: aiScores
        }
      },
      sanitized_text: tier1Result.normalizedText,
      processed_at: new Date().toISOString()
    };

    // Cache & DB Log Record
    await this.cacheService.set(request.text, result);
    try {
      this.dbService.addLog({
        correlation_id: correlationId,
        text: request.text,
        sanitized_text: tier1Result.normalizedText,
        verdict: verdict,
        risk_score: riskScore,
        violations: allViolations,
        breakdown: result.breakdown
      });
    } catch (e) {
      console.error('Failed to log moderation record:', e);
    }

    return result;
  }
}
