import { z } from 'zod';
import { EntityTypeEnum } from '../enums/index.js';

export const AnalyzeTextRequestSchema = z.object({
  text: z.string().min(1, 'Metin boş olamaz').max(10000, 'Metin çok uzun (Max 10.000 karakter)'),
  entity_type: z.nativeEnum(EntityTypeEnum).default(EntityTypeEnum.COMMENT),
  entity_id: z.string().optional(),
  user_id: z.string().optional(),
  tenant_id: z.string().default('gilded_default'),
  force_ai: z.boolean().default(false)
});

export const RuleCategorySchema = z.enum([
  'profanity',
  'spam',
  'hate_speech',
  'threat',
  'pii',
  'PROFANITY',
  'SPAM',
  'HATE_SPEECH',
  'IMPLICIT_THREAT',
  'PII_LEAK',
  'SUSPICIOUS_LINK',
  'TOXICITY'
]);

export const RuleActionSchema = z.enum([
  'block',
  'flag',
  'mask',
  'BLOCK',
  'FLAG',
  'MASK'
]);

export const RuleItemSchema = z.object({
  id: z.string().optional(),
  pattern: z.string().min(1, 'Kural deseni (pattern) boş olamaz'),
  category: RuleCategorySchema,
  action: RuleActionSchema.default('block'),
  severity: z.number().min(1).max(5).default(3).optional(),
  score: z.number().min(0).max(1).default(0.85).optional(),
  isRegex: z.boolean().default(true).optional(),
  reason: z.string().optional().default('Dinamik kural')
});

export const RuleImportPayloadSchema = z.object({
  strategy: z.enum(['merge', 'overwrite']).default('merge').optional(),
  rules: z.array(RuleItemSchema).min(1, 'İçe aktarılacak kurallar dizisi boş olamaz')
});
