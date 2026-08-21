import { ViolationCategoryEnum } from '@kintsugi/shared-types';
import { TurkishTextNormalizer } from './turkish-text.normalizer.js';
import { DatabaseService } from '../../database/db.js';

export class RuleEngineService {
  static instance;
  compiledRules = [];

  constructor() {
    this.dbService = DatabaseService.getInstance();
    this.reloadRulesCache();
  }

  static getInstance() {
    if (!RuleEngineService.instance) {
      RuleEngineService.instance = new RuleEngineService();
    }
    return RuleEngineService.instance;
  }

  reloadRulesCache() {
    const activeRules = this.dbService.getRules();
    const compiled = [];

    for (const rule of activeRules) {
      try {
        compiled.push({
          rule,
          regex: new RegExp(rule.pattern, 'gi')
        });
      } catch (e) {
        console.error(`Invalid regex pattern in rule ${rule.id}: ${rule.pattern}`, e);
      }
    }

    this.compiledRules = compiled;
    console.log(`⚡ [RuleEngineService] In-memory rules cache reloaded (${this.compiledRules.length} active rules).`);
    return this.compiledRules.length;
  }

  evaluate(rawText) {
    const normalizedText = TurkishTextNormalizer.normalize(rawText);
    const violations = [];
    const matchedRules = [];
    let highestScore = 0;

    // Use in-memory compiled rules for sub-millisecond evaluation
    if (!this.compiledRules || this.compiledRules.length === 0) {
      this.reloadRulesCache();
    }

    for (const { rule, regex } of this.compiledRules) {
      try {
        // Reset regex global index pointer for safety
        regex.lastIndex = 0;
        const matchedRaw = regex.test(rawText);
        regex.lastIndex = 0;
        const matchedNorm = regex.test(normalizedText);

        if (matchedRaw || matchedNorm) {
          violations.push({
            category: rule.category || ViolationCategoryEnum.PROFANITY,
            action: rule.action || 'block',
            severity: rule.severity || 3,
            score: rule.score,
            reason: rule.reason,
            matched_pattern: rule.pattern
          });

          matchedRules.push({
            rule_id: rule.id,
            pattern: rule.pattern,
            type: rule.category
          });

          if (rule.score > highestScore) {
            highestScore = rule.score;
          }
        }
      } catch (e) {
        console.error(`Execution error on rule pattern ${rule.pattern}:`, e);
      }
    }

    return {
      normalizedText,
      flagged: violations.length > 0,
      highestScore,
      violations,
      matchedRules
    };
  }
}
